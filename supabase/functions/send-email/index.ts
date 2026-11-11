// Supabase Edge Function "send-email" (Deno) — invia email con Resend.
//
// Variabili (Supabase -> Edge Functions -> Secrets):
//   RESEND_API_KEY   chiave API di Resend
//   GMAIL_USER / GMAIL_APP_PASSWORD  alternativa provvisoria a Resend (SMTP Gmail, password per le app)
//   MAIL_FROM        mittente verificato su Resend, es. "notifiche@massolab.it"
//   THERAPIST_EMAIL  email del terapista (anche più indirizzi separati da virgola)
//   SITE_URL         indirizzo del sito CON il percorso base, senza "/" finale,
//                    es. "https://utente.github.io/massolab" (serve per i link)
//   ALLOWED_ORIGINS  (facoltativo) origini del sito separate da virgola per CORS
// SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY sono già presenti.
//
// Due modalità:
//  1) EMAIL LIBERA { to, subject, body, from_name }  -> SOLO il terapista (admin).
//  2) NOTIFICA { type, appointment_id?, token?, data? } -> chiunque.
//     Testo e destinatario li decide questa funzione (template qui sotto,
//     ogni valore escapato e accorciato). Tipi:
//       booking_received       cliente dell'appuntamento + terapista (id+token, pending, < 60 min)
//       appointment_confirmed  cliente (id+token, presenza confermata davvero)
//       appointment_cancelled  cliente (id+token, stato davvero "cancelled")
//       client_cancelled       terapista (id+token, stato "cancelled")
//       intake_submitted       terapista
//       review_submitted       terapista
//       contact_request        terapista
//       client_message         terapista (solo cliente loggato con email confermata)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
// nodemailer (npm, versione fissata): sostituisce denomailer, non mantenuto e instabile su Deno 2.
import nodemailer from 'npm:nodemailer@6.9.16';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const MAIL_FROM = Deno.env.get('MAIL_FROM') ?? 'onboarding@resend.dev';
const THERAPISTS = (Deno.env.get('THERAPIST_EMAIL') ?? 'massolab.simoneciacchi@gmail.com')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
// Gmail (provvisorio, finche' non c'e' un dominio verificato su Resend): password per le app a 16 caratteri.
const GMAIL_USER = (Deno.env.get('GMAIL_USER') ?? '').trim().replace(/[\r\n]/g, '');
const GMAIL_APP_PASSWORD = (Deno.env.get('GMAIL_APP_PASSWORD') ?? '').replace(/\s+/g, '');
const USE_RESEND = !!(RESEND_API_KEY && Deno.env.get('MAIL_FROM'));
const USE_GMAIL = !USE_RESEND && !!(GMAIL_USER && GMAIL_APP_PASSWORD);
const SITE_URL = (Deno.env.get('SITE_URL') ?? '').trim().replace(/\/+$/, '');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const MAX_BODY_CHARS = 100_000;
const MAX_SUBJECT_CHARS = 300;

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((s) => s.trim().replace(/\/$/, ''))
  .filter(Boolean);

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  const allow = !ALLOWED_ORIGINS.length ? '*' : ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

const json = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const EMAIL_RE = /^[^\s@<>(),;:"*%]+@[^\s@<>(),;:"*%]+\.[^\s@<>(),;:"*%]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN_RE = /^[0-9a-f]{32,64}$/;
// "_" is a LIKE wildcard: escape it for case-insensitive exact matches
const likeExact = (s: string) => s.replace(/[\\_%]/g, (c) => '\\' + c);

// Limite "best effort" per istanza (in memoria).
const hits = new Map<string, number[]>();
function rateLimited(key: string, max = 20, windowMs = 10 * 60_000) {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) hits.clear();
  return list.length > max;
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
/** Testo utente -> stringa accorciata (senza a capo se oneLine). */
const clip = (v: unknown, max: number, oneLine = true) => {
  let s = String(v ?? '').trim();
  if (oneLine) s = s.replace(/[\r\n\t]+/g, ' ');
  return s.slice(0, max);
};
/** Testo utente -> HTML escapato e accorciato. */
const e = (v: unknown, max = 120) => escapeHtml(clip(v, max));
const pageLink = (name: string, params?: Record<string, string>) =>
  SITE_URL ? `${SITE_URL}/${name}${params ? '?' + new URLSearchParams(params) : ''}` : '';

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function callerEmail(req: Request): Promise<string | null> {
  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return null;
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false },
  });
  const { data } = await userClient.auth.getUser();
  const u = data?.user;
  // email non confermata = trattata come anonima
  if (!u?.email || !u.email_confirmed_at) return null;
  return u.email.toLowerCase();
}

async function isAdmin(email: string) {
  const { data } = await admin.from('admins').select('email').ilike('email', likeExact(email)).limit(1).maybeSingle();
  return !!data;
}

type Appt = { id: string; created_date: string; data: Record<string, unknown> };

/** Appuntamento solo se id + token corrispondono. */
async function apptByToken(id: unknown, token: unknown): Promise<Appt | null> {
  const sid = String(id ?? '');
  const stok = String(token ?? '');
  if (!UUID_RE.test(sid) || !TOKEN_RE.test(stok)) return null;
  const { data } = await admin.from('appointment').select('id, created_date, data').eq('id', sid).maybeSingle();
  if (!data || (data as Appt).data?.access_token !== stok) return null;
  return data as Appt;
}

type Mail = { to: string; subject: string; html: string; fromName: string };

const noCrLf = (v: string) => v.replace(/[\r\n]+/g, ' ');

function htmlToText(html: string): string {
  return html
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, '')
    .replace(/<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
    .replace(/<\/(p|div|h[1-6]|tr|li)>|<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    // &amp; per ultimo: evita la doppia decodifica ("&amp;lt;" deve restare "&lt;")
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function sendMail(m: Mail) {
  const toTherapist = THERAPISTS.includes(m.to);
  const isHtml = /<\/?[a-z][\s\S]*>/i.test(m.html);
  const html = isHtml ? m.html : `<div style="font-family:sans-serif;white-space:pre-wrap">${escapeHtml(m.html)}</div>`;
  const text = isHtml ? htmlToText(m.html) : m.html;
  const subject = noCrLf(clip(m.subject, MAX_SUBJECT_CHARS));
  const to = noCrLf(m.to);
  const replyTo = !toTherapist && THERAPISTS[0] ? noCrLf(THERAPISTS[0]) : undefined;

  if (USE_GMAIL) {
    // From = sempre l'account Gmail configurato, mai un indirizzo deciso dal client.
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
    try {
      await transporter.sendMail({
        from: { name: 'MassoLab - Simone Ciacchi', address: GMAIL_USER },
        to,
        subject,
        text,
        html,
        ...(replyTo ? { replyTo } : {}),
      });
    } catch (e) {
      // Solo codice e risposta del server SMTP (es. "535 ... Username and Password not accepted"),
      // mai le credenziali: serve a capire se Gmail rifiuta l'accesso o la connessione.
      const err = e as { name?: string; code?: string; responseCode?: number; response?: string; message?: string };
      const detail = String(err?.response ?? err?.message ?? '').split(GMAIL_APP_PASSWORD).join('***').slice(0, 300);
      console.error('SMTP error', err?.name ?? 'unknown', err?.code ?? '', err?.responseCode ?? '', detail);
      throw new Error('send failed');
    } finally {
      try { transporter.close(); } catch { /* ignora */ }
    }
    return 'gmail';
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `${noCrLf(m.fromName)} <${Deno.env.get('MAIL_FROM') ?? MAIL_FROM}>`,
      to: [to],
      subject,
      html,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });
  if (!res.ok) {
    console.error('Resend error', res.status);
    throw new Error('send failed');
  }
  return (await res.json())?.id ?? null;
}

/* =============================== TEMPLATE =============================== */
// Testi spostati dalle pagine del sito (bookingEmails.js, AppointmentAction.jsx,
// ClientAppointmentsList.jsx, ContactForm.jsx, ClientMessages.jsx).

const T = THERAPISTS[0];

function guestTherapistEmail(a: Record<string, unknown>, intakeSkipped: boolean): Mail {
  return {
    to: T,
    fromName: 'MassoLab Prenotazioni',
    subject: `Nuova prenotazione — ${clip(a.first_name, 80)} ${clip(a.last_name, 80)}`,
    html: `<div style="font-family:sans-serif;max-width:520px;margin:auto;padding:28px;background:#f9fafb;border-radius:16px;">
        <h2 style="color:#dc2626;margin-top:0;">📅 Nuova Richiesta di Appuntamento</h2>
        <div style="background:white;border-radius:12px;padding:20px;border:1px solid #e5e7eb;">
          <table style="border-collapse:collapse;width:100%;font-size:14px;">
            <tr><td style="padding:8px;color:#6b7280;font-weight:600;">Cliente</td><td style="padding:8px;">${e(a.first_name)} ${e(a.last_name)}</td></tr>
            <tr><td style="padding:8px;color:#6b7280;font-weight:600;">Email</td><td style="padding:8px;">${e(a.email)}</td></tr>
            <tr><td style="padding:8px;color:#6b7280;font-weight:600;">Telefono</td><td style="padding:8px;">${e(a.phone, 40)}</td></tr>
            <tr style="background:#fef2f2;"><td style="padding:8px;color:#6b7280;font-weight:600;">Trattamento</td><td style="padding:8px;font-weight:700;color:#dc2626;">${e(a.treatment_type)}</td></tr>
            <tr><td style="padding:8px;color:#6b7280;font-weight:600;">Data</td><td style="padding:8px;font-weight:600;">${e(a.preferred_date, 20)}</td></tr>
            <tr><td style="padding:8px;color:#6b7280;font-weight:600;">Orario</td><td style="padding:8px;font-weight:600;">${e(a.preferred_time, 10)}</td></tr>
            <tr><td style="padding:8px;color:#6b7280;font-weight:600;">Scheda salute</td><td style="padding:8px;">${intakeSkipped ? 'Non compilata' : '✅ Compilata'}</td></tr>
          </table>
        </div>
      </div>`,
  };
}

function guestClientEmail(appt: Appt, intakeSkipped: boolean): Mail {
  const a = appt.data;
  const intake = pageLink('IntakeForm', { id: appt.id, token: String(a.access_token) });
  const intakeBlock = intakeSkipped && intake
    ? `<p style="color:#374151;font-size:14px;margin-top:16px;">Aiuta Simone a prepararsi al meglio: <a href="${escapeHtml(intake)}" style="color:#dc2626;font-weight:bold;">compila la scheda salute</a> (2 minuti).</p>`
    : '';
  return {
    to: String(a.email).toLowerCase(),
    fromName: 'MassoLab — Simone Ciacchi',
    subject: 'Richiesta ricevuta ✓ — MassoLab',
    html: `<div style="font-family:sans-serif;max-width:520px;margin:auto;padding:28px;background:#f9fafb;border-radius:16px;">
        <h2 style="color:#16a34a;margin-top:0;">✅ Richiesta Ricevuta!</h2>
        <p style="color:#374151;">Ciao <strong>${e(a.first_name)}</strong>, abbiamo ricevuto la tua richiesta.</p>
        <div style="background:white;border-radius:12px;padding:20px;border:1px solid #e5e7eb;margin:20px 0;">
          <table style="border-collapse:collapse;width:100%;font-size:14px;">
            <tr><td style="padding:8px;color:#6b7280;font-weight:600;">Trattamento</td><td style="padding:8px;font-weight:700;">${e(a.treatment_type)}</td></tr>
            <tr><td style="padding:8px;color:#6b7280;font-weight:600;">Data richiesta</td><td style="padding:8px;">${e(a.preferred_date, 20)}</td></tr>
            <tr><td style="padding:8px;color:#6b7280;font-weight:600;">Orario</td><td style="padding:8px;">${e(a.preferred_time, 10)}</td></tr>
          </table>
        </div>
        <p style="color:#374151;font-size:14px;">Simone ti contatterà entro breve per <strong>confermare l'appuntamento</strong>.</p>${intakeBlock}
        <div style="background:#fef3c7;border-radius:10px;padding:14px;margin-top:16px;border-left:4px solid #f59e0b;">
          <p style="margin:0;font-size:13px;color:#92400e;"><strong>Politica di cancellazione:</strong> Puoi annullare gratuitamente fino a 24 ore prima.</p>
        </div>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px;"><strong>MassoLab — Simone Ciacchi</strong></p>
      </div>`,
  };
}

function areaClientEmail(a: Record<string, unknown>): Mail {
  return {
    to: String(a.email).toLowerCase(),
    fromName: 'MassoLab - Simone Ciacchi',
    subject: 'Richiesta Appuntamento Ricevuta — MassoLab',
    html: `
        <div style="font-family:sans-serif;max-width:500px;margin:auto;">
          <h2 style="color:#dc2626;">Richiesta Ricevuta ✓</h2>
          <p>Ciao <strong>${e(a.first_name)}</strong>,</p>
          <p>La tua richiesta di appuntamento è stata ricevuta. Il terapista la esaminerà e riceverai una conferma via email.</p>
          <table style="border-collapse:collapse;width:100%;margin:16px 0;">
            <tr><td style="padding:8px;color:#555;font-weight:bold;">Trattamento</td><td style="padding:8px;">${e(a.treatment_type)}</td></tr>
            <tr><td style="padding:8px;color:#555;font-weight:bold;">Data</td><td style="padding:8px;">${e(a.preferred_date, 20)}</td></tr>
            <tr><td style="padding:8px;color:#555;font-weight:bold;">Orario</td><td style="padding:8px;">${e(a.preferred_time, 10)}</td></tr>
          </table>
          <p style="color:#888;font-size:13px;"><strong>MassoLab — Simone Ciacchi</strong></p>
        </div>
      `,
  };
}

function areaTherapistEmail(a: Record<string, unknown>): Mail {
  return {
    to: T,
    fromName: 'MassoLab Sistema',
    subject: `Nuova Prenotazione — ${clip(a.first_name, 80)} ${clip(a.last_name, 80)}`,
    html: `
        <div style="font-family:sans-serif;max-width:500px;margin:auto;">
          <h2>Nuova Prenotazione</h2>
          <p><strong>${e(a.first_name)} ${e(a.last_name)}</strong> (${e(a.email)}) ha richiesto un appuntamento.</p>
          <table style="border-collapse:collapse;width:100%;margin:16px 0;">
            <tr><td style="padding:8px;font-weight:bold;">Trattamento</td><td style="padding:8px;">${e(a.treatment_type)}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;">Data</td><td style="padding:8px;">${e(a.preferred_date, 20)}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;">Orario</td><td style="padding:8px;">${e(a.preferred_time, 10)}</td></tr>
          </table>
        </div>
      `,
  };
}

function responseEmail(a: Record<string, unknown>, confirmed: boolean): Mail {
  const name = e(a.first_name);
  const treatment = e(a.treatment_type);
  const home = pageLink('Home');
  const html = confirmed
    ? `<div style="font-family:sans-serif;max-width:500px;margin:auto;">
            <h2 style="color:#16a34a;">Presenza Confermata ✓</h2>
            <p>Ciao <strong>${name}</strong>,</p>
            <p>Hai confermato il tuo appuntamento. Ti aspettiamo!</p>
            <table style="border-collapse:collapse;width:100%;margin:16px 0;">
              <tr><td style="padding:8px;color:#555;font-weight:bold;">Trattamento</td><td style="padding:8px;">${treatment}</td></tr>
              ${a.preferred_date ? `<tr><td style="padding:8px;color:#555;font-weight:bold;">Data</td><td style="padding:8px;">${e(a.preferred_date, 20)}</td></tr>` : ''}
              ${a.preferred_time ? `<tr><td style="padding:8px;color:#555;font-weight:bold;">Orario</td><td style="padding:8px;">${e(a.preferred_time, 10)}</td></tr>` : ''}
            </table>
            <p style="color:#888;font-size:13px;"><strong>MassoLab — Simone Ciacchi</strong></p>
          </div>`
    : `<div style="font-family:sans-serif;max-width:500px;margin:auto;">
            <h2 style="color:#dc2626;">Appuntamento Annullato</h2>
            <p>Ciao <strong>${name}</strong>,</p>
            <p>Il tuo appuntamento per <strong>${treatment}</strong> è stato annullato come richiesto.</p>
            <p>Puoi prenotare un nuovo appuntamento quando vuoi dal nostro sito.</p>
            ${home ? `<p style="margin:20px 0;"><a href="${escapeHtml(home)}" style="background:#dc2626;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Prenota di nuovo</a></p>` : ''}
            <p style="color:#888;font-size:13px;"><strong>MassoLab — Simone Ciacchi</strong></p>
          </div>`;
  return {
    to: String(a.email).toLowerCase(),
    fromName: 'MassoLab - Simone Ciacchi',
    subject: confirmed ? 'Presenza Confermata — MassoLab' : 'Appuntamento Annullato — MassoLab',
    html,
  };
}

function clientCancelledEmail(a: Record<string, unknown>): Mail {
  return {
    to: T,
    fromName: 'MassoLab Area Clienti',
    subject: `Annullamento appuntamento — ${clip(a.first_name, 80)} ${clip(a.last_name, 80)}`,
    html: `<p>${e(a.first_name)} ${e(a.last_name)} ha annullato l'appuntamento del <strong>${e(a.preferred_date, 20)}</strong> alle <strong>${e(a.preferred_time, 10)}</strong> (${e(a.treatment_type)}).</p>`,
  };
}

const dashboardLink = () => {
  const url = pageLink('TherapistDashboard');
  return url
    ? `<p style="margin:20px 0;"><a href="${escapeHtml(url)}" style="background:#dc2626;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Apri la dashboard</a></p>`
    : '<p>Accedi alla dashboard per i dettagli.</p>';
};

// Testi nuovi (sobri), nessun dato sanitario nell'email: solo l'avviso.
function intakeSubmittedEmail(name: string, treatment: string): Mail {
  return {
    to: T,
    fromName: 'MassoLab Sistema',
    subject: `Nuova scheda salute — ${clip(name, 120) || 'cliente'}`,
    html: `
        <div style="font-family:sans-serif;max-width:500px;margin:auto;">
          <h2>Nuova Scheda Salute</h2>
          <p><strong>${e(name) || 'Un cliente'}</strong> ha compilato la scheda salute.</p>
          ${treatment ? `<p>Trattamento: <strong>${e(treatment)}</strong></p>` : ''}
          ${dashboardLink()}
          <p style="color:#888;font-size:13px;"><strong>MassoLab</strong></p>
        </div>`,
  };
}

function reviewSubmittedEmail(name: string, treatment: string, rating: number): Mail {
  return {
    to: T,
    fromName: 'MassoLab Sistema',
    subject: `Nuova recensione da approvare — ${clip(name, 120) || 'cliente'}`,
    html: `
        <div style="font-family:sans-serif;max-width:500px;margin:auto;">
          <h2>Nuova Recensione</h2>
          <p><strong>${e(name) || 'Un cliente'}</strong> ha lasciato una recensione${rating ? ` (${'★'.repeat(rating)})` : ''}.</p>
          ${treatment ? `<p>Trattamento: <strong>${e(treatment)}</strong></p>` : ''}
          <p>La recensione è in attesa di approvazione.</p>
          ${dashboardLink()}
          <p style="color:#888;font-size:13px;"><strong>MassoLab</strong></p>
        </div>`,
  };
}

function contactEmail(d: Record<string, unknown>): Mail {
  const message = escapeHtml(clip(d.message, 2000, false) || '–').replace(/\n/g, '<br>');
  return {
    to: T,
    fromName: 'MassoLab - Sito Web',
    subject: `Nuova richiesta da ${clip(d.name, 100)}`,
    html: `Nome: ${e(d.name, 100)}<br>Telefono: ${e(d.phone, 40)}<br><br>Messaggio:<br>` + message,
  };
}

function clientMessageEmail(clientName: string, clientEmail: string, content: string): Mail {
  return {
    to: T,
    fromName: 'MassoLab - Area Clienti',
    subject: `💬 Nuovo messaggio da ${clip(clientName, 100) || clientEmail}`,
    html: `<p>Hai ricevuto un nuovo messaggio dall'area clienti.</p><p>Da: ${e(clientName, 100)} (${escapeHtml(clientEmail)})</p><p>Messaggio:<br>"${escapeHtml(clip(content, 2000, false)).replace(/\n/g, '<br>')}"</p><p>Accedi alla dashboard per rispondere.</p>`,
  };
}

/* ============================== NOTIFICHE =============================== */

// Ogni notifica legata a un appuntamento parte una sola volta per istanza.
const sentOnce = new Set<string>();
function once(key: string) {
  if (sentOnce.has(key)) return false;
  if (sentOnce.size > 5000) sentOnce.clear();
  sentOnce.add(key);
  return true;
}

async function notification(
  type: string,
  payload: Record<string, unknown>,
  caller: string | null,
): Promise<Mail[] | { status: number; error: string }> {
  const d = (payload.data && typeof payload.data === 'object' ? payload.data : {}) as Record<string, unknown>;
  const bad = { status: 403, error: 'Link non valido' };
  const dup = { status: 409, error: 'Notifica già inviata' };

  switch (type) {
    case 'booking_received': {
      const appt = await apptByToken(payload.appointment_id, payload.token);
      if (!appt || appt.data.status !== 'pending') return bad;
      if (Date.now() - new Date(appt.created_date).getTime() > 60 * 60_000) return bad;
      if (!EMAIL_RE.test(String(appt.data.email ?? ''))) return bad;
      if (!once(`booking:${appt.id}`)) return dup;
      const intakeSkipped = d.intake_skipped === true;
      return d.source === 'area'
        ? [areaClientEmail(appt.data), areaTherapistEmail(appt.data)]
        : [guestTherapistEmail(appt.data, intakeSkipped), guestClientEmail(appt, intakeSkipped)];
    }
    case 'appointment_confirmed':
    case 'appointment_cancelled': {
      const appt = await apptByToken(payload.appointment_id, payload.token);
      if (!appt || !EMAIL_RE.test(String(appt.data.email ?? ''))) return bad;
      const confirmed = type === 'appointment_confirmed';
      const ok = confirmed
        ? appt.data.client_confirmed === true && appt.data.status !== 'cancelled'
        : appt.data.status === 'cancelled';
      if (!ok) return { status: 409, error: 'Stato non corrispondente' };
      if (!once(`${type}:${appt.id}`)) return dup;
      return [responseEmail(appt.data, confirmed)];
    }
    case 'client_cancelled': {
      const appt = await apptByToken(payload.appointment_id, payload.token);
      if (!appt) return bad;
      if (appt.data.status !== 'cancelled') return { status: 409, error: 'Stato non corrispondente' };
      if (!once(`client_cancelled:${appt.id}`)) return dup;
      return [clientCancelledEmail(appt.data)];
    }
    case 'intake_submitted': {
      const appt = payload.appointment_id ? await apptByToken(payload.appointment_id, payload.token) : null;
      const a = appt?.data ?? d;
      const name = `${clip(a.first_name, 80)} ${clip(a.last_name, 80)}`.trim();
      return [intakeSubmittedEmail(name, clip(a.treatment_type ?? d.treatment_type, 120))];
    }
    case 'review_submitted': {
      const rating = Number(d.rating);
      return [
        reviewSubmittedEmail(
          clip(d.client_name, 120),
          clip(d.treatment_type, 120),
          Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : 0,
        ),
      ];
    }
    case 'contact_request': {
      if (!clip(d.name, 100) || !clip(d.phone, 40)) return { status: 400, error: 'Nome e telefono obbligatori' };
      return [contactEmail(d)];
    }
    case 'client_message': {
      if (!caller) return { status: 401, error: 'Accesso richiesto' };
      const content = clip(d.content, 2000, false);
      if (!content) return { status: 400, error: 'Messaggio vuoto' };
      return [clientMessageEmail(clip(d.client_name, 100), caller, content)];
    }
    default:
      return { status: 400, error: 'Tipo di notifica non valido' };
  }
}

/* ================================ HANDLER =============================== */

Deno.serve(async (req) => {
  const res = await handle(req);
  for (const [k, v] of Object.entries(corsHeaders(req))) res.headers.set(k, v);
  return res;
});

async function handle(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok');
  if (req.method !== 'POST') return json(405, { error: 'Metodo non consentito' });
  if (!USE_RESEND && !USE_GMAIL) return json(500, { error: 'Invio email non configurato' });

  let payload: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY_CHARS + 5_000) return json(413, { error: 'Messaggio troppo lungo' });
    payload = JSON.parse(raw);
    if (!payload || typeof payload !== 'object') throw new Error();
  } catch {
    return json(400, { error: 'Richiesta non valida' });
  }

  const caller = await callerEmail(req);
  const callerIsAdmin = !!caller && (await isAdmin(caller));

  // ---- 2) Notifiche a template (tutti) ----
  if (typeof payload.type === 'string') {
    if (!callerIsAdmin) {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
      if (rateLimited((caller ?? 'ip:' + ip), 20)) return json(429, { error: 'Troppi invii, riprova più tardi' });
    }
    const out = await notification(payload.type, payload, caller);
    if (!Array.isArray(out)) return json(out.status, { error: out.error });
    // Max 3 email ogni 30 minuti allo stesso indirizzo non-terapista.
    for (const m of out) {
      if (!callerIsAdmin && !THERAPISTS.includes(m.to) && rateLimited('to:' + m.to, 3, 30 * 60_000)) {
        return json(429, { error: 'Troppi invii, riprova più tardi' });
      }
    }
    try {
      const ids = [];
      for (const m of out) ids.push(await sendMail(m));
      return json(200, { ok: true, ids });
    } catch {
      return json(502, { error: 'Invio non riuscito' });
    }
  }

  // ---- 1) Email libera: solo il terapista ----
  if (!callerIsAdmin) return json(403, { error: 'Non consentito' });

  const toField = payload.to;
  if (Array.isArray(toField) && toField.length !== 1) return json(400, { error: 'Un solo destinatario' });
  const to = String(Array.isArray(toField) ? toField[0] : toField ?? '').trim().toLowerCase();
  const subject = String(payload.subject ?? '').replace(/[\r\n]+/g, ' ').slice(0, MAX_SUBJECT_CHARS);
  const body = String(payload.body ?? '');
  const fromName = String(payload.from_name ?? 'MassoLab')
    .replace(/[<>"\r\n]/g, '')
    .slice(0, 80) || 'MassoLab';

  if (!EMAIL_RE.test(to)) return json(400, { error: 'Destinatario non valido' });
  if (!subject || !body) return json(400, { error: 'Oggetto e testo obbligatori' });
  if (body.length > MAX_BODY_CHARS) return json(413, { error: 'Messaggio troppo lungo' });

  try {
    const id = await sendMail({ to, subject, html: body, fromName });
    return json(200, { ok: true, id });
  } catch {
    return json(502, { error: 'Invio non riuscito' });
  }
}
