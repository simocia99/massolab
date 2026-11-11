// Shared helpers for the therapist dashboard (core tabs).
import { db } from '@/api/client';
import { absolutePageUrl, escapeHtml } from '@/lib/utils';

export const FROM_NAME = 'MassoLab - Simone Ciacchi';

export const STATUS_LABELS = {
  all: 'Tutti',
  pending: 'In attesa',
  confirmed: 'Confermata',
  completed: 'Completata',
  cancelled: 'Annullata',
};

export const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
};

export function StatusBadge({ status }) {
  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export function Spinner({ className = 'h-64' }) {
  return (
    <div className={`flex items-center justify-center ${className}`} role="status" aria-label="Caricamento">
      <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function SectionHeader({ title, subtitle }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-1">{title}</h2>
      {subtitle && <p className="text-gray-500">{subtitle}</p>}
    </div>
  );
}

/** 32 random hex chars. */
export const randomToken = () =>
  [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, '0')).join('');

/**
 * Returns the appointment's access_token, creating and saving one for
 * legacy records that don't have it yet (links without a token are refused).
 */
export async function ensureAccessToken(appt) {
  if (appt.access_token) return appt.access_token;
  const access_token = randomToken();
  await db.entities.Appointment.update(appt.id, { access_token });
  appt.access_token = access_token;
  return access_token;
}

/** Confirm/cancel link for an appointment (token required). */
export const actionUrl = (appt, action) =>
  `${absolutePageUrl('AppointmentAction')}?id=${encodeURIComponent(appt.id)}&action=${action}&token=${encodeURIComponent(appt.access_token || '')}`;

const row = (label, value) =>
  `<tr><td style="padding:6px 8px;color:#6b7280;font-weight:bold;font-size:13px;">${label}</td><td style="padding:6px 8px;font-size:14px;">${escapeHtml(value)}</td></tr>`;

const detailsTable = (a, { alwaysDate = false } = {}) => `
            <div style="background:white;border-radius:12px;padding:16px;margin:20px 0;border:1px solid #e5e7eb;">
              <table style="border-collapse:collapse;width:100%;">
                ${row('Trattamento', a.treatment_type)}
                ${a.preferred_date || alwaysDate ? row('Data', a.preferred_date || '') : ''}
                ${a.preferred_time ? row('Orario', a.preferred_time) : ''}
              </table>
            </div>`;

const signature = (mt = 20) =>
  `<p style="color:#9ca3af;font-size:12px;margin-top:${mt}px;"><strong>MassoLab — Simone Ciacchi</strong></p>`;

/** Reminder with confirm/cancel buttons. `tomorrow` = automatic day-before reminder. */
export async function sendReminderEmail(a, { tomorrow = false } = {}) {
  await ensureAccessToken(a);
  const confirm = actionUrl(a, 'confirm');
  const cancel = actionUrl(a, 'cancel');
  const name = escapeHtml(a.first_name);
  return db.integrations.Core.SendEmail({
    to: a.email,
    from_name: FROM_NAME,
    subject: tomorrow
      ? 'Promemoria: Appuntamento Domani — MassoLab'
      : `Promemoria Appuntamento — ${a.preferred_date || 'MassoLab'}`,
    body: `
          <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px;background:#f9fafb;border-radius:16px;">
            <h2 style="color:#dc2626;margin-bottom:8px;">🗓️ ${tomorrow ? 'Promemoria: Appuntamento Domani!' : 'Promemoria Appuntamento'}</h2>
            <p style="color:#374151;">Ciao <strong>${name}</strong>, ${tomorrow ? 'ti ricordiamo che domani hai un appuntamento con noi!' : 'ti ricordiamo il tuo appuntamento:'}</p>
            ${detailsTable(a, { alwaysDate: tomorrow })}
            <p style="color:#374151;font-size:14px;margin-bottom:12px;">Conferma la tua presenza o annulla con un click:</p>
            <div style="display:flex;gap:12px;flex-wrap:wrap;">
              <a href="${escapeHtml(confirm)}" style="background:#16a34a;color:white;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:14px;">✅ Confermo</a>
              <a href="${escapeHtml(cancel)}" style="background:#dc2626;color:white;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:14px;">❌ Annulla</a>
            </div>
            ${signature()}
          </div>`,
  });
}

export async function sendConfirmedEmail(a) {
  await ensureAccessToken(a);
  return db.integrations.Core.SendEmail({
    to: a.email,
    from_name: FROM_NAME,
    subject: 'Appuntamento Confermato — MassoLab',
    body: `
          <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px;background:#f9fafb;border-radius:16px;">
            <h2 style="color:#16a34a;margin-bottom:8px;">✅ Appuntamento Confermato!</h2>
            <p style="color:#374151;">Ciao <strong>${escapeHtml(a.first_name)}</strong>, il tuo appuntamento è confermato.</p>
            ${detailsTable(a)}
            <p style="color:#6b7280;font-size:13px;">Hai bisogno di annullare?</p>
            <a href="${escapeHtml(actionUrl(a, 'cancel'))}" style="display:inline-block;background:#dc2626;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:14px;margin-bottom:20px;">❌ Annulla Appuntamento</a>
            ${signature(16)}
          </div>`,
  });
}

export async function sendCompletedEmail(a) {
  const token = await ensureAccessToken(a);
  const feedback = `${absolutePageUrl('PostSessionFeedback')}?appointmentId=${encodeURIComponent(a.id)}&token=${encodeURIComponent(token)}`;
  const review = `${absolutePageUrl('LeaveReview')}?appointmentId=${encodeURIComponent(a.id)}&token=${encodeURIComponent(token)}`;
  return db.integrations.Core.SendEmail({
    to: a.email,
    from_name: FROM_NAME,
    subject: 'Come ti senti dopo la seduta? — MassoLab',
    body: `
          <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:28px;background:#f9fafb;border-radius:16px;">
            <h2 style="color:#dc2626;margin-top:0;">Come ti senti dopo la seduta? ✨</h2>
            <p style="color:#374151;">Ciao <strong>${escapeHtml(a.first_name)}</strong>,</p>
            <p style="color:#374151;">La tua sessione di <strong>${escapeHtml(a.treatment_type)}</strong> è appena terminata.</p>
            <p style="color:#374151;">Dedica 30 secondi a registrare il tuo livello di dolore prima e dopo la seduta: i dati aggiornano automaticamente i grafici del tuo andamento nell'area clienti.</p>
            <div style="margin:24px 0;text-align:center;">
              <a href="${escapeHtml(feedback)}" style="display:inline-block;background:#dc2626;color:white;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:15px;">📊 Inserisci la tua autovalutazione</a>
            </div>
            <p style="color:#6b7280;font-size:13px;margin-top:16px;">Vuoi anche lasciare una recensione? <a href="${escapeHtml(review)}" style="color:#dc2626;">Clicca qui</a></p>
            ${signature(24)}
          </div>`,
  });
}

export function sendCancelledEmail(a) {
  return db.integrations.Core.SendEmail({
    to: a.email,
    from_name: FROM_NAME,
    subject: 'Appuntamento Annullato — MassoLab',
    body: `
          <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px;background:#f9fafb;border-radius:16px;">
            <h2 style="color:#dc2626;margin-bottom:8px;">Appuntamento Annullato</h2>
            <p style="color:#374151;">Ciao <strong>${escapeHtml(a.first_name)}</strong>, il tuo appuntamento per <strong>${escapeHtml(a.treatment_type)}</strong> è stato annullato.</p>
            <p style="color:#6b7280;font-size:14px;">Puoi prenotare un nuovo appuntamento dal nostro sito:</p>
            <a href="${absolutePageUrl('GuestBooking')}" style="display:inline-block;background:#dc2626;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:14px;margin:16px 0;">Prenota di nuovo</a>
            ${signature(16)}
          </div>`,
  });
}

/** WhatsApp text for an appointment ("reminder" or "confirmed"). */
export function whatsappText(a, kind) {
  const confirm = actionUrl(a, 'confirm');
  const cancel = actionUrl(a, 'cancel');
  const when = a.preferred_date ? `📅 *${a.preferred_date}${a.preferred_time ? ` alle ${a.preferred_time}` : ''}*` : '';
  return kind === 'reminder'
    ? `Ciao ${a.first_name}! 👋\n\nTi ricordiamo che hai un appuntamento con *MassoLab - Simone Ciacchi*.\n\n💆 Trattamento: *${a.treatment_type}*\n${when}\n\nConferma la tua presenza o annulla tramite questi link:\n✅ Conferma: ${confirm}\n❌ Annulla: ${cancel}\n\nA presto!`
    : `Ciao ${a.first_name}! 👋\n\nIl tuo appuntamento per *${a.treatment_type}* è stato confermato.\n${when}\n\nPer annullare: ${cancel}\n\n*MassoLab - Simone Ciacchi*`;
}

export const waPhone = (phone = '') => phone.replace(/\D/g, '');
