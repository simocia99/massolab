// DEMO implementations of the server-side functions (Postgres RPCs in
// production, see supabase/migrations/0001_init.sql). Keep names, payloads
// and return shapes identical.
import { localEntities, localRead } from './localAdapter';

const validToken = (appt, token) =>
  !!appt && typeof token === 'string' && token.length >= 32 && appt.access_token === token;

const limitedAppointment = (a) =>
  a && {
    id: a.id,
    first_name: a.first_name,
    client_confirmed: !!a.client_confirmed,
    treatment_type: a.treatment_type,
    preferred_date: a.preferred_date,
    preferred_time: a.preferred_time,
    status: a.status,
    email: a.email,
  };

const findAppointment = (id) => localRead('Appointment').find((a) => a.id === id);

export const localFunctions = {
  /** Booked slots between two dates (YYYY-MM-DD), without personal data. */
  async booked_slots({ p_from, p_to } = {}) {
    return localRead('Appointment')
      .filter((a) => a.status === 'pending' || a.status === 'confirmed')
      .filter((a) => (!p_from || a.preferred_date >= p_from) && (!p_to || a.preferred_date <= p_to))
      .sort((a, b) => `${a.preferred_date} ${a.preferred_time}`.localeCompare(`${b.preferred_date} ${b.preferred_time}`))
      .map((a) => ({
        date: a.preferred_date,
        time: a.preferred_time,
        duration: a.duration ?? null,
        treatment_type: a.treatment_type ?? null,
        status: a.status,
      }));
  },

  /** Limited appointment view for e-mail links (id + token), or null. */
  async appointment_by_token({ p_id, p_token } = {}) {
    const appt = findAppointment(p_id);
    return validToken(appt, p_token) ? limitedAppointment(appt) : null;
  },

  /** Confirm / cancel from an e-mail link. Only pending|confirmed -> confirmed|cancelled. */
  async appointment_respond({ p_id, p_token, p_action } = {}) {
    const status = { confirm: 'confirmed', cancel: 'cancelled' }[p_action];
    if (!status) throw new Error('Azione non valida');
    const appt = findAppointment(p_id);
    if (!validToken(appt, p_token)) return null;
    if (['pending', 'confirmed'].includes(appt.status)) {
      // D3: "confirm" registra solo la presenza; lo stato lo decide il terapista.
      const patch = status === 'cancelled'
        ? { status }
        : { client_confirmed: true, client_confirmed_at: new Date().toISOString() };
      return limitedAppointment(await localEntities.Appointment.update(appt.id, patch));
    }
    return limitedAppointment(appt);
  },

  /** Post-session pain scores: upsert TreatmentProgress for that appointment. */
  async submit_session_feedback({
    p_appointment_id,
    p_token,
    p_initial_score,
    p_final_score,
    p_problem_area = '',
    p_notes = '',
  } = {}) {
    const ok = (n) => Number.isInteger(n) && n >= 0 && n <= 10;
    if (!ok(p_initial_score) || !ok(p_final_score)) throw new Error('Punteggio non valido');
    const appt = findAppointment(p_appointment_id);
    if (!validToken(appt, p_token)) throw new Error('Link non valido');

    const email = (appt.email || '').toLowerCase();
    const existing = localRead('TreatmentProgress')
      .filter(
        (p) =>
          (p.client_email || '').toLowerCase() === email &&
          p.session_date === appt.preferred_date &&
          p.treatment_type === appt.treatment_type,
      )
      .sort((a, b) => (b.created_date || '').localeCompare(a.created_date || ''))[0];

    if (existing) {
      await localEntities.TreatmentProgress.update(existing.id, {
        initial_score: p_initial_score,
        final_score: p_final_score,
        problem_area: p_problem_area || existing.problem_area || '',
        notes: p_notes || existing.notes || '',
        appointment_id: appt.id,
      });
    } else {
      await localEntities.TreatmentProgress.create({
        client_email: email,
        client_name: `${appt.first_name || ''} ${appt.last_name || ''}`.trim(),
        session_date: appt.preferred_date,
        treatment_type: appt.treatment_type,
        problem_area: p_problem_area || '',
        initial_score: p_initial_score,
        final_score: p_final_score,
        notes: p_notes || '',
        appointment_id: appt.id,
      });
    }
    return { ok: true };
  },

  /** Approved reviews without personal data, newest first. */
  async approved_reviews({ p_limit = 6, p_treatment_type = null } = {}) {
    const limit = Math.min(Math.max(Number(p_limit) || 6, 1), 100);
    return localRead('Review')
      .filter((r) => r.status === 'approved')
      .filter((r) => !p_treatment_type || r.treatment_type === p_treatment_type)
      .sort((a, b) => (b.created_date || '').localeCompare(a.created_date || ''))
      .slice(0, limit)
      .map(({ id, client_name, rating, text, treatment_type, created_date }) => ({
        id,
        client_name,
        rating,
        text,
        treatment_type,
        created_date,
      }));
  },
};
