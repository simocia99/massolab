// Availability + booking helpers shared by GuestBooking and the client area.
import { db } from '@/api/client';
import { absolutePageUrl, toISODate } from '@/lib/utils';

/** Minutes kept free before/after every booked appointment. */
export const BUFFER_MINUTES = 15;

/** Fallback when the therapist has not saved any settings yet. */
export const DEFAULT_SETTINGS = {
  work_days: [1, 2, 3, 4, 5],
  work_hours_start: '09:00',
  work_hours_end: '19:00',
  lunch_break_start: '13:00',
  lunch_break_end: '14:00',
  slot_duration: 60,
  blocked_dates: [],
  treatment_durations: {},
};

export const toMinutes = (hhmm) => {
  if (!hhmm) return 0;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export const fromMinutes = (min) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

export const treatmentDuration = (settings, treatment) =>
  (settings.treatment_durations || {})[treatment] || settings.slot_duration || 60;

/** ISO weekday 1 (Mon) .. 7 (Sun). */
export const isoWeekday = (date) => (date.getDay() === 0 ? 7 : date.getDay());

function timesInRanges(ranges, duration) {
  const out = [];
  for (const r of ranges || []) {
    const end = toMinutes(r.end);
    for (let t = toMinutes(r.start); t + duration <= end; t += 15) out.push(fromMinutes(t));
  }
  return out;
}

/** All start times the therapist works on that weekday (ignores bookings). */
export function workingTimes(settings, treatment, weekday) {
  const duration = treatmentDuration(settings, treatment);
  const schedule = settings.day_schedules?.[weekday];
  if (schedule) return schedule.active ? timesInRanges(schedule.slots || [], duration) : [];
  if (!(settings.work_days || [1, 2, 3, 4, 5]).includes(weekday)) return [];

  const start = toMinutes(settings.work_hours_start || '09:00');
  const end = toMinutes(settings.work_hours_end || '19:00');
  const lunchStart = toMinutes(settings.lunch_break_start || '13:00');
  const lunchEnd = toMinutes(settings.lunch_break_end || '14:00');
  const out = [];
  for (let t = start; t + duration <= end; t += 15) {
    const overlapsLunch = t < lunchEnd && t + duration > lunchStart;
    if (!overlapsLunch) out.push(fromMinutes(t));
  }
  return out;
}

export function isWorkDay(settings, date) {
  const weekday = isoWeekday(date);
  const schedule = settings.day_schedules?.[weekday];
  return schedule ? !!schedule.active : (settings.work_days || [1, 2, 3, 4, 5]).includes(weekday);
}

/**
 * True when `time` on `dateStr` does not overlap (incl. buffer) any booked slot.
 * `booked` = rows from the booked_slots RPC: { date, time, duration?, treatment_type?, status }.
 */
export function isSlotFree(settings, booked, dateStr, time, treatment) {
  const start = toMinutes(time);
  const end = start + treatmentDuration(settings, treatment);
  return !booked.some((b) => {
    if (b.date !== dateStr || !b.time) return false;
    if (b.status === 'cancelled' || b.status === 'rejected') return false;
    const bStart = toMinutes(b.time);
    const bDuration = Number(b.duration) || (b.treatment_type ? treatmentDuration(settings, b.treatment_type) : settings.slot_duration || 60);
    const bEnd = bStart + bDuration + BUFFER_MINUTES;
    return start < bEnd && end > bStart - BUFFER_MINUTES;
  });
}

/** Free start times for a day; past times of today are excluded. */
export function freeTimes(settings, booked, date, treatment) {
  const dateStr = toISODate(date);
  let times = workingTimes(settings, treatment, isoWeekday(date)).filter((t) =>
    isSlotFree(settings, booked, dateStr, t, treatment),
  );
  if (dateStr === toISODate(new Date())) {
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    times = times.filter((t) => toMinutes(t) > nowMin);
  }
  return times;
}

export async function loadTherapistSettings() {
  try {
    const rows = await db.entities.TherapistSettings.list('-created_date', 1);
    return rows.length ? { ...DEFAULT_SETTINGS, ...rows[0] } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Booked slots (no personal data) between two YYYY-MM-DD dates. */
export async function fetchBookedSlots(from, to) {
  const rows = await db.functions.invoke('booked_slots', { p_from: from, p_to: to });
  return Array.isArray(rows) ? rows : [];
}

/** 32 random hex chars, used to authorise links in emails. */
export function generateAccessToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export class SlotTakenError extends Error {
  constructor() {
    super('Questo orario non è più disponibile. Scegline un altro.');
    this.name = 'SlotTakenError';
  }
}

/**
 * Creates a pending Appointment after re-checking that the slot is still
 * free (prevents double-booking between page load and submit).
 * Returns the created record (incl. access_token).
 */
export async function createAppointment(data) {
  const settings = await loadTherapistSettings();
  const booked = await fetchBookedSlots(data.preferred_date, data.preferred_date);
  if (!isSlotFree(settings, booked, data.preferred_date, data.preferred_time, data.treatment_type)) {
    throw new SlotTakenError();
  }
  return db.entities.Appointment.create({
    ...data,
    email: (data.email || '').toLowerCase().trim(),
    duration: treatmentDuration(settings, data.treatment_type),
    status: 'pending',
    access_token: generateAccessToken(),
  });
}

/** Tokenised links for emails about an appointment. */
export function appointmentLinks(appt) {
  const id = encodeURIComponent(appt.id);
  const token = encodeURIComponent(appt.access_token || '');
  return {
    confirm: `${absolutePageUrl('AppointmentAction')}?id=${id}&action=confirm&token=${token}`,
    cancel: `${absolutePageUrl('AppointmentAction')}?id=${id}&action=cancel&token=${token}`,
    intake: `${absolutePageUrl('IntakeForm')}?id=${id}&token=${token}`,
    feedback: `${absolutePageUrl('PostSessionFeedback')}?appointmentId=${id}&token=${token}`,
  };
}
