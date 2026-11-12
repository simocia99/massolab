// Supabase Edge Function "daily-report" (Deno) — resoconto del mattino via Web Push.
//
// Deploy SENZA verifica JWT (la chiamata del cron non ha un utente):
//   supabase functions deploy daily-report --no-verify-jwt   (lo fa scripts/configura-notifiche.sh)
// L'accesso è comunque protetto: vedi le due modalità qui sotto.
//
// Segreti (Supabase -> Edge Functions -> Secrets; li imposta lo script):
//   VAPID_PUBLIC_KEY      chiave pubblica VAPID (base64url, la stessa di VITE_VAPID_PUBLIC_KEY)
//   VAPID_PRIVATE_KEY     chiave privata VAPID (base64url) — SOLO qui, mai nel sito
//   VAPID_SUBJECT         contatto per i servizi push, es. "mailto:massolab...@gmail.com"
//   DAILY_REPORT_SECRET   segreto condiviso con il job pg_cron (copia nel Vault)
//   ALLOWED_ORIGINS       (facoltativo, già usato da send-email) origini per CORS
// SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY sono già presenti.
//
// Modalità:
//  1) DAILY  — chiamata dal job pg_cron con l'header "x-cron-secret".
//     Invia SOLO se a Roma sono tra le 7:25 e le 9:59 (l'ora legale la gestisce
//     il fuso "Europe/Rome") e se oggi non è già stato inviato (automation_log,
//     indice unico su report_date). A tutte le iscrizioni dell'admin.
//  2) TEST   — chiamata dall'app (pulsante "Prova") con il JWT del terapista (admin).
//     Invia subito, solo ai dispositivi di chi chiama, senza registrare nulla.
//
// PRIVACY: la notifica passa dai server di Apple/Google/Mozilla, quindi contiene
// SOLO conteggi. Mai nomi, email, trattamenti o dati di salute.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
// web-push (npm, versione fissata): cifratura aes128gcm (RFC 8291) + VAPID (RFC 8292).
// Provata in Deno 2: generateRequestDetails funziona; l'invio lo facciamo con fetch.
import webpush from 'npm:web-push@3.6.7';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC_KEY = (Deno.env.get('VAPID_PUBLIC_KEY') ?? '').trim();
const VAPID_PRIVATE_KEY = (Deno.env.get('VAPID_PRIVATE_KEY') ?? '').trim();
const VAPID_SUBJECT = (Deno.env.get('VAPID_SUBJECT') ?? 'mailto:massolab.simoneciacchi@gmail.com').trim();
const CRON_SECRET = (Deno.env.get('DAILY_REPORT_SECRET') ?? '').trim();

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((s) => s.trim().replace(/\/$/, ''))
  .filter(Boolean);

const TIME_ZONE = 'Europe/Rome';
const SEND_FROM_MIN = 7 * 60 + 25; // 7:25 a Roma
const SEND_UNTIL_MIN = 10 * 60; // entro le 9:59 (recupero se l'invio delle 7:30 è fallito)
const PENDING_STALE_MS = 10 * 60_000; // un tentativo "pending" più vecchio di 10 min si può riprendere
const MAX_FAILS = 10; // dopo 10 errori consecutivi (non 404/410) l'iscrizione viene tolta
const LOG_KEY = 'daily_report';

// Solo servizi push conosciuti: niente richieste verso indirizzi arbitrari.
const PUSH_HOSTS = [
  /^fcm\.googleapis\.com$/,
  /^android\.googleapis\.com$/,
  /^(.+\.)?push\.apple\.com$/,
  /^updates\.push\.services\.mozilla\.com$/,
  /^(.+\.)?push\.services\.mozilla\.com$/,
  /^(.+\.)?notify\.windows\.com$/,
];

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// ---- Utilità -------------------------------------------------------------------
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

const json = (req: Request, status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  });

/** Confronto a tempo costante (tramite hash) per il segreto del cron. */
async function sameSecret(a: string, b: string) {
  if (!a || !b) return false;
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a)),
    crypto.subtle.digest('SHA-256', enc.encode(b)),
  ]);
  const x = new Uint8Array(ha);
  const y = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

/** Data e ora di Roma (gestisce da solo ora legale/solare). */
function romeNow(d = new Date()) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  );
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute) };
}

/** Utente admin (email confermata + tabella admins) dal JWT, oppure null. */
async function adminCaller(req: Request): Promise<{ id: string } | null> {
  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return null;
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false },
  });
  const { data } = await userClient.auth.getUser();
  const u = data?.user;
  if (!u?.email || !u.email_confirmed_at) return null;
  const { data: ok } = await userClient.rpc('is_admin');
  return ok === true ? { id: u.id } : null;
}

// Limite "best effort" per le prove dall'app (in memoria, per istanza).
const testHits: number[] = [];
function testRateLimited(max = 5, windowMs = 10 * 60_000) {
  const now = Date.now();
  while (testHits.length && now - testHits[0] > windowMs) testHits.shift();
  testHits.push(now);
  return testHits.length > max;
}

// ---- Resoconto (solo conteggi) ---------------------------------------------------
type Counts = {
  today: number;
  pending: number;
  forms: number;
  reviews: number;
  unread: number;
  news: number;
};

async function countRows(table: string, build: (q: any) => any): Promise<number> {
  const { count, error } = await build(admin.from(table).select('id', { count: 'exact', head: true }));
  if (error) throw new Error(`Conteggio ${table} non riuscito`);
  return count ?? 0;
}

async function buildCounts(date: string): Promise<Counts> {
  const since = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
  const recent = (t: string, extra?: (q: any) => any) =>
    countRows(t, (q) => (extra ? extra(q.gte('created_date', since)) : q.gte('created_date', since)));
  const [today, pending, forms, reviews, unread, ...news] = await Promise.all([
    countRows('appointment', (q) =>
      q.eq('data->>preferred_date', date).not('data->>status', 'in', '(cancelled,rejected)'),
    ),
    countRows('appointment', (q) => q.eq('data->>status', 'pending')),
    countRows('intake_form', (q) => q.or('data->>status.is.null,data->>status.neq.reviewed')),
    countRows('review', (q) => q.or('data->>status.is.null,data->>status.eq.pending')),
    countRows('message', (q) => q.eq('data->>sender', 'client').or('data->>read.is.null,data->>read.eq.false')),
    recent('appointment'),
    recent('intake_form'),
    recent('health_data'),
    recent('review'),
    recent('message', (q) => q.eq('data->>sender', 'client')),
  ]);
  return { today, pending, forms, reviews, unread, news: news.reduce((s, n) => s + n, 0) };
}

// ==== TESTI DELLA NOTIFICA (li rifinisce l'agente Testi) — SOLO numeri ====
const n = (v: number, one: string, many: string) => `${v} ${v === 1 ? one : many}`;
function notificationText(c: Counts, test = false) {
  // Titolo = la cosa più importante (l'agenda); corpo = ciò che resta da fare. Solo numeri.
  const title = `${test ? 'Prova' : 'Buongiorno'} · ${
    c.today ? `${n(c.today, 'appuntamento', 'appuntamenti')} oggi` : 'oggi nessun appuntamento'
  }`;
  const parts: string[] = [];
  if (c.pending) parts.push(n(c.pending, 'richiesta da confermare', 'richieste da confermare'));
  if (c.unread) parts.push(n(c.unread, 'messaggio da leggere', 'messaggi da leggere'));
  if (c.forms) parts.push(n(c.forms, 'scheda da leggere', 'schede da leggere'));
  if (c.reviews) parts.push(n(c.reviews, 'recensione da approvare', 'recensioni da approvare'));
  const body = parts.length
    ? parts.join(' · ')
    : c.news
      ? `Niente in sospeso. ${n(c.news, 'novità', 'novità')} nelle ultime 24 ore.`
      : 'Niente in sospeso e nessuna novità. Buona giornata.';
  return {
    title,
    body,
    url: 'TherapistDashboard',
    tag: test ? 'resoconto-prova' : 'resoconto',
  };
}
// ==========================================================================

// ---- Invio Web Push -------------------------------------------------------------
type Sub = { id: string; endpoint: string; p256dh: string; auth: string; fail_count: number };

function allowedEndpoint(endpoint: string) {
  try {
    const u = new URL(endpoint);
    return u.protocol === 'https:' && PUSH_HOSTS.some((re) => re.test(u.hostname));
  } catch {
    return false;
  }
}

async function sendAll(subs: Sub[], payload: Record<string, string>) {
  let sent = 0;
  let failed = 0;
  let removed = 0;
  const body = JSON.stringify(payload);
  for (const s of subs) {
    if (!allowedEndpoint(s.endpoint)) {
      await admin.from('push_subscription').delete().eq('id', s.id);
      removed++;
      continue;
    }
    let status = 0;
    try {
      const req = webpush.generateRequestDetails(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        body,
        {
          TTL: 4 * 60 * 60, // se il telefono è spento, la notifica vale ancora per 4 ore
          urgency: 'normal',
          topic: payload.tag,
          vapidDetails: { subject: VAPID_SUBJECT, publicKey: VAPID_PUBLIC_KEY, privateKey: VAPID_PRIVATE_KEY },
        },
      );
      const headers: Record<string, string> = {};
      for (const [k, v] of Object.entries(req.headers)) headers[k] = String(v);
      const res = await fetch(req.endpoint, {
        method: 'POST',
        headers,
        body: req.body,
        // Niente redirect: l'allowlist degli host vale solo per l'indirizzo iniziale.
        redirect: 'manual',
        signal: AbortSignal.timeout(10_000),
      });
      status = res.status;
      await res.body?.cancel();
    } catch {
      status = 0;
    }
    if (status >= 200 && status < 300) {
      sent++;
      await admin
        .from('push_subscription')
        .update({ last_sent_at: new Date().toISOString(), fail_count: 0 })
        .eq('id', s.id);
    } else if (status === 404 || status === 410) {
      // Iscrizione scaduta o revocata dal dispositivo: la togliamo.
      await admin.from('push_subscription').delete().eq('id', s.id);
      removed++;
    } else {
      failed++;
      if (s.fail_count + 1 >= MAX_FAILS) {
        await admin.from('push_subscription').delete().eq('id', s.id);
        removed++;
      } else {
        await admin.from('push_subscription').update({ fail_count: s.fail_count + 1 }).eq('id', s.id);
      }
      console.warn('daily-report: invio non riuscito, stato', status);
    }
  }
  return { sent, failed, removed };
}

async function loadSubs(userId?: string): Promise<Sub[]> {
  let q = admin.from('push_subscription').select('id, endpoint, p256dh, auth, fail_count, user_id');
  if (userId) q = q.eq('user_id', userId);
  const { data, error } = await q.limit(50);
  if (error) throw new Error('Lettura iscrizioni non riuscita');
  // Solo dispositivi di utenti che sono ancora admin.
  const { data: admins } = await admin.from('admins').select('email');
  const allowed = new Set((admins ?? []).map((a: { email: string }) => a.email.toLowerCase()));
  const out: Sub[] = [];
  const emailCache = new Map<string, string | null>();
  for (const row of data ?? []) {
    if (!emailCache.has(row.user_id)) {
      const { data: u } = await admin.auth.admin.getUserById(row.user_id);
      const ok = u?.user?.email && u.user.email_confirmed_at ? u.user.email.toLowerCase() : null;
      emailCache.set(row.user_id, ok);
    }
    const email = emailCache.get(row.user_id);
    if (email && allowed.has(email)) out.push(row as Sub);
  }
  return out;
}

// ---- Claim giornaliero in automation_log -------------------------------------------
type LogRow = { id: string; updated_date: string; data: Record<string, unknown> };

/** Restituisce l'id del log "preso" per oggi, oppure null se non bisogna inviare. */
async function claimToday(date: string): Promise<string | null> {
  const { data: existing } = await admin
    .from('automation_log')
    .select('id, updated_date, data')
    .eq('data->>automation_key', LOG_KEY)
    .eq('data->>report_date', date)
    .maybeSingle();
  const now = new Date().toISOString();
  if (!existing) {
    const { data, error } = await admin
      .from('automation_log')
      .insert({ data: { automation_key: LOG_KEY, report_date: date, status: 'pending', attempt_at: now } })
      .select('id')
      .single();
    return error ? null : (data as { id: string }).id; // 23505 = un'altra esecuzione l'ha già preso
  }
  const row = existing as LogRow;
  const status = String(row.data?.status ?? '');
  if (status === 'sent') return null;
  const attemptAt = Date.parse(String(row.data?.attempt_at ?? row.updated_date));
  if (status === 'pending' && Date.now() - attemptAt < PENDING_STALE_MS) return null;
  // Riprova (fallito / nessun dispositivo / pending vecchio): blocco ottimistico su updated_date.
  const { data: upd } = await admin
    .from('automation_log')
    .update({ data: { ...row.data, status: 'pending', attempt_at: now } })
    .eq('id', row.id)
    .eq('updated_date', row.updated_date)
    .select('id');
  return upd && upd.length ? row.id : null;
}

async function finishLog(id: string, patch: Record<string, unknown>) {
  const { data } = await admin.from('automation_log').select('data').eq('id', id).single();
  await admin
    .from('automation_log')
    .update({ data: { ...(data?.data ?? {}), ...patch, sent_at: new Date().toISOString() } })
    .eq('id', id);
}

// ---- Handler -------------------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) });
  if (req.method !== 'POST') return json(req, 405, { error: 'Metodo non consentito' });

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return json(req, 500, { error: 'Notifiche non configurate (chiavi VAPID mancanti)' });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const mode = body?.mode === 'test' ? 'test' : 'daily';

  try {
    // ---- Prova dall'app: solo il terapista loggato, solo i suoi dispositivi ----
    if (mode === 'test') {
      const caller = await adminCaller(req);
      if (!caller) return json(req, 403, { error: 'Non autorizzato' });
      if (testRateLimited()) return json(req, 429, { error: 'Troppe prove, riprova tra qualche minuto' });
      const counts = await buildCounts(romeNow().date);
      const subs = await loadSubs(caller.id);
      const result = await sendAll(subs, notificationText(counts, true));
      return json(req, 200, { ok: true, devices: subs.length, ...result });
    }

    // ---- Resoconto del mattino (pg_cron) ----
    if (!(await sameSecret(req.headers.get('x-cron-secret') ?? '', CRON_SECRET))) {
      return json(req, 401, { error: 'Non autorizzato' });
    }
    const rome = romeNow();
    if (rome.minutes < SEND_FROM_MIN || rome.minutes >= SEND_UNTIL_MIN) {
      return json(req, 200, { ok: true, skipped: 'fuori orario', rome: rome.date });
    }
    const logId = await claimToday(rome.date);
    if (!logId) return json(req, 200, { ok: true, skipped: 'già inviato o in corso', rome: rome.date });

    try {
      const counts = await buildCounts(rome.date);
      const subs = await loadSubs();
      const result = subs.length ? await sendAll(subs, notificationText(counts)) : { sent: 0, failed: 0, removed: 0 };
      const status = result.sent > 0 ? 'sent' : subs.length ? 'failed' : 'skipped';
      await finishLog(logId, { status, devices: subs.length, ...result, counts });
      return json(req, 200, { ok: true, status, devices: subs.length, ...result });
    } catch (err) {
      await finishLog(logId, { status: 'failed', error: String((err as Error)?.message ?? err).slice(0, 200) });
      throw err;
    }
  } catch (err) {
    console.error('daily-report:', (err as Error)?.message ?? err);
    return json(req, 500, { error: 'Errore interno' });
  }
});
