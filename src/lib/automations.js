// Automated client emails (reminders, follow-ups, review requests, win-back).
// Runs in the therapist's browser while the dashboard is open.
//
// De-duplication relies ONLY on AutomationLog records (shared across devices):
// before sending, the runner re-reads the log for that appointment/key and
// "claims" it with a `pending` row, then marks it `sent` or `failed`.
import { differenceInHours, format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { db } from '@/api/client';
import { absolutePageUrl, escapeHtml, toISODate } from '@/lib/utils';
import { BUSINESS } from '@/api/config';

export const AUTOMATION_KEYS = [
  'booking_confirm',
  'reminder_24h',
  'reminder_2h',
  'post_treatment',
  'review_request',
  'rebooking',
  'win_back',
];

/** Default templates, created (disabled) the first time the automations tab is opened. */
export const DEFAULT_AUTOMATIONS = [
  {
    automation_key: 'booking_confirm',
    label: 'Conferma prenotazione',
    subject: 'Appuntamento confermato — MassoLab',
    body: 'Ciao {{nome}},\n\nil tuo appuntamento per {{trattamento}} è confermato per {{data}} alle {{ora}}.\n\nA presto,\nSimone Ciacchi — MassoLab',
  },
  {
    automation_key: 'reminder_24h',
    label: 'Promemoria 24 ore prima',
    subject: 'Promemoria: il tuo appuntamento di domani — MassoLab',
    body: 'Ciao {{nome}},\n\nti ricordo l\'appuntamento per {{trattamento}} di {{data}} alle {{ora}}.\n\nA domani!\nSimone Ciacchi — MassoLab',
  },
  {
    automation_key: 'reminder_2h',
    label: 'Promemoria 2 ore prima',
    subject: 'Ci vediamo tra poco — MassoLab',
    body: 'Ciao {{nome}},\n\nti aspetto oggi alle {{ora}} per {{trattamento}}.\n\nA tra poco!\nSimone Ciacchi — MassoLab',
  },
  {
    automation_key: 'post_treatment',
    label: 'Follow-up post trattamento',
    subject: 'Come ti senti dopo il trattamento? — MassoLab',
    body: 'Ciao {{nome}},\n\ncome ti senti dopo il {{trattamento}} di ieri? Ricordati di bere molta acqua e di fare gli esercizi consigliati.\n\nPer qualsiasi dubbio scrivimi pure.\nSimone Ciacchi — MassoLab',
  },
  {
    automation_key: 'review_request',
    label: 'Richiesta recensione',
    subject: 'Ti è piaciuto il trattamento? — MassoLab',
    body: 'Ciao {{nome}},\n\nse ti sei trovato bene, mi aiuteresti molto lasciando una breve recensione:\n{{review_url}}\n\nGrazie!\nSimone Ciacchi — MassoLab',
  },
  {
    automation_key: 'rebooking',
    label: 'Invito a riprenotare',
    subject: 'È il momento della prossima seduta? — MassoLab',
    body: 'Ciao {{nome}},\n\nsono passate circa tre settimane dal tuo {{trattamento}}. Per mantenere i risultati puoi prenotare la prossima seduta qui:\n{{booking_url}}\n\nA presto,\nSimone Ciacchi — MassoLab',
  },
  {
    automation_key: 'win_back',
    label: 'Recupero clienti inattivi',
    subject: 'Ci manchi! — MassoLab',
    body: 'Ciao {{nome}},\n\nè da un po\' che non ci vediamo. Se vuoi prenderti di nuovo cura di te, prenota qui:\n{{booking_url}}\n\nA presto,\nSimone Ciacchi — MassoLab',
  },
];

/** Replace {{variables}} in a template. Values are inserted as-is (plain text). */
export function fillTemplate(text, vars = {}) {
  if (!text) return '';
  return text
    .replace(/{{nome}}/g, vars.nome || '')
    .replace(/{{trattamento}}/g, vars.trattamento || '')
    .replace(/{{data}}/g, vars.data || '')
    .replace(/{{ora}}/g, vars.ora || '')
    .replace(/{{review_url}}/g, absolutePageUrl('LeaveReview'))
    .replace(/{{booking_url}}/g, absolutePageUrl('GuestBooking'));
}

/** Plain-text template -> safe HTML email body (everything escaped, URLs linked, newlines kept). */
export function textToEmailHtml(text) {
  const html = escapeHtml(text)
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#dc2626;">$1</a>')
    .replace(/\n/g, '<br>');
  return `<div style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px;color:#374151;font-size:14px;line-height:1.6;">${html}</div>`;
}

const appointmentStart = (a) => {
  const [h, m] = (a.preferred_time || '09:00').split(':').map(Number);
  const d = parseISO(a.preferred_date);
  d.setHours(h || 9, m || 0, 0, 0);
  return d;
};

const fullName = (a) => `${a.first_name || ''} ${a.last_name || ''}`.trim();

/**
 * Claim + send + log. Returns true when an email was actually sent.
 * `alreadyDone(logs)` decides, on a fresh read of the log, whether to skip.
 */
async function sendOnce({ key, appointment, subject, html, query, alreadyDone, fromName }) {
  const fresh = await db.entities.AutomationLog.filter(query, '-sent_at', 50);
  if (alreadyDone(fresh)) return false;

  const base = {
    automation_key: key,
    appointment_id: appointment.id,
    client_email: appointment.email,
    client_name: fullName(appointment),
  };
  const claim = await db.entities.AutomationLog.create({
    ...base,
    sent_at: new Date().toISOString(),
    status: 'pending',
  });
  try {
    await db.integrations.Core.SendEmail({ to: appointment.email, subject, body: html, from_name: fromName });
    await db.entities.AutomationLog.update(claim.id, { status: 'sent', sent_at: new Date().toISOString() });
    return true;
  } catch (err) {
    await db.entities.AutomationLog.update(claim.id, {
      status: 'failed',
      error: err?.message || 'Errore sconosciuto',
    });
    return false;
  }
}

const anyLog = (logs) => logs.length > 0;

// Prevent overlapping runs inside the same tab (interval + manual trigger).
let running = null;

/** Run all enabled automations once. Resolves to the number of emails sent. */
export function runAutomations() {
  if (!running) {
    running = doRun()
      .catch((err) => {
        console.error('[automations]', err);
        return 0;
      })
      .finally(() => {
        running = null;
      });
  }
  return running;
}

async function doRun() {
  const [settings, logs, appointments] = await Promise.all([
    db.entities.AutomationSettings.list(),
    db.entities.AutomationLog.list('-sent_at', 2000),
    db.entities.Appointment.list('-preferred_date', 500),
  ]);
  const enabled = Object.fromEntries(settings.filter((s) => s.enabled).map((s) => [s.automation_key, s]));
  if (Object.keys(enabled).length === 0) return 0;

  const now = new Date();
  let sent = 0;
  // Cheap pre-filter on the bulk log; sendOnce re-checks against fresh data.
  const logged = (apptId, key) => logs.some((l) => l.appointment_id === apptId && l.automation_key === key);

  const trigger = async (key, appointment, vars) => {
    const auto = enabled[key];
    if (!auto || logged(appointment.id, key)) return;
    const ok = await sendOnce({
      key,
      appointment,
      subject: fillTemplate(auto.subject, vars),
      html: textToEmailHtml(fillTemplate(auto.body, vars)),
      query: { appointment_id: appointment.id, automation_key: key },
      alreadyDone: anyLog,
    });
    if (ok) sent++;
  };

  for (const a of appointments) {
    if (!a.preferred_date || !a.email) continue;
    const start = appointmentStart(a);
    const hoursUntil = differenceInHours(start, now);
    const hoursSince = -hoursUntil;
    const vars = {
      nome: a.first_name,
      trattamento: a.treatment_type || '',
      data: format(start, 'EEEE d MMMM', { locale: it }),
      ora: a.preferred_time || '',
    };

    if (a.status === 'confirmed') await trigger('booking_confirm', a, vars);
    if (!['confirmed', 'completed'].includes(a.status)) continue;

    if (hoursUntil <= 24 && hoursUntil > 1) await trigger('reminder_24h', a, vars);
    if (hoursUntil <= 2 && hoursUntil > 0) await trigger('reminder_2h', a, vars);
    if (a.status !== 'completed') continue;

    if (hoursSince >= 24 && hoursSince < 48) await trigger('post_treatment', a, vars);
    if (hoursSince >= 48 && hoursSince < 72) await trigger('review_request', a, vars);
    if (hoursSince >= 504 && hoursSince < 528) await trigger('rebooking', a, vars);
  }

  // Win-back: last completed appointment 60–65 days ago, no win-back in the last 30 days.
  const winBack = enabled.win_back;
  if (winBack) {
    const lastByEmail = {};
    for (const a of appointments) {
      if (a.status !== 'completed' || !a.email || !a.preferred_date) continue;
      const prev = lastByEmail[a.email];
      if (!prev || a.preferred_date > prev.preferred_date) lastByEmail[a.email] = a;
    }
    const recentWinBack = (list, email) =>
      list.some(
        (l) =>
          l.automation_key === 'win_back' &&
          l.client_email === email &&
          l.status !== 'failed' &&
          l.sent_at &&
          differenceInHours(now, parseISO(l.sent_at)) < 720,
      );
    for (const [email, last] of Object.entries(lastByEmail)) {
      const hoursSince = differenceInHours(now, appointmentStart(last));
      if (hoursSince < 1440 || hoursSince >= 1560 || recentWinBack(logs, email)) continue;
      const vars = { nome: last.first_name, trattamento: last.treatment_type || '', data: '', ora: '' };
      const ok = await sendOnce({
        key: 'win_back',
        appointment: last,
        subject: fillTemplate(winBack.subject, vars),
        html: textToEmailHtml(fillTemplate(winBack.body, vars)),
        query: { automation_key: 'win_back', client_email: email },
        alreadyDone: (fresh) => recentWinBack(fresh, email),
      });
      if (ok) sent++;
    }
  }
  return sent;
}

/** Confirm/cancel link for an appointment (requires its access_token). */
export function appointmentActionUrl(appointment, action) {
  const params = new URLSearchParams({ id: appointment.id, token: appointment.access_token || '', action });
  return `${absolutePageUrl('AppointmentAction')}?${params}`;
}

/**
 * "Appuntamento domani" reminder with confirm/cancel buttons (originally sent
 * from the dashboard and de-duplicated with localStorage). Now de-duplicated
 * through AutomationLog (key `reminder_tomorrow`), so it works across devices.
 */
export async function sendTomorrowReminders(appointments = []) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const day = toISODate(tomorrow);
  const due = appointments.filter((a) => a.preferred_date === day && a.status === 'confirmed' && a.email);
  let sent = 0;
  for (const a of due) {
    try {
      const ok = await sendOnce({
        key: 'reminder_tomorrow',
        appointment: a,
        fromName: 'MassoLab - Simone Ciacchi',
        subject: 'Promemoria: Appuntamento Domani — MassoLab',
        html: tomorrowReminderHtml(a),
        query: { appointment_id: a.id, automation_key: 'reminder_tomorrow' },
        alreadyDone: anyLog,
      });
      if (ok) sent++;
    } catch (err) {
      console.error('[reminder]', err);
    }
  }
  return sent;
}

function tomorrowReminderHtml(a) {
  const row = (label, value) =>
    `<tr><td style="padding:6px 8px;color:#6b7280;font-weight:bold;font-size:13px;">${label}</td><td style="padding:6px 8px;font-size:14px;">${escapeHtml(value)}</td></tr>`;
  const date = a.preferred_date ? format(parseISO(a.preferred_date), 'EEEE d MMMM yyyy', { locale: it }) : '';
  return `
  <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px;background:#f9fafb;border-radius:16px;">
    <h2 style="color:#dc2626;margin-bottom:8px;">🗓️ Promemoria: Appuntamento Domani!</h2>
    <p style="color:#374151;">Ciao <strong>${escapeHtml(a.first_name || '')}</strong>, ti ricordiamo che domani hai un appuntamento con noi!</p>
    <div style="background:white;border-radius:12px;padding:16px;margin:20px 0;border:1px solid #e5e7eb;">
      <table style="border-collapse:collapse;width:100%;">
        ${row('Trattamento', a.treatment_type || '')}
        ${row('Data', date)}
        ${a.preferred_time ? row('Orario', a.preferred_time) : ''}
      </table>
    </div>
    <p style="color:#374151;font-size:14px;margin-bottom:12px;">Conferma la tua presenza o annulla con un click:</p>
    <div style="display:flex;gap:12px;flex-wrap:wrap;">
      <a href="${escapeHtml(appointmentActionUrl(a, 'confirm'))}" style="background:#16a34a;color:white;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:14px;">✅ Confermo</a>
      <a href="${escapeHtml(appointmentActionUrl(a, 'cancel'))}" style="background:#dc2626;color:white;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:14px;">❌ Annulla</a>
    </div>
    <p style="color:#9ca3af;font-size:12px;margin-top:20px;"><strong>MassoLab — ${escapeHtml(BUSINESS.owner)}</strong></p>
  </div>`;
}
