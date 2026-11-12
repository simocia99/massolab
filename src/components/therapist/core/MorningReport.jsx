// "Resoconto di oggi" in cima alla dashboard del terapista (MassoLab Studio).
// Stessi conteggi della notifica del mattino (supabase/functions/daily-report),
// ma qui, dietro login, si possono mostrare nomi e orari.
// Dati: entità esistenti tramite db.entities → funziona sia con Supabase sia in DEMO.
// Stile volutamente essenziale: lo rifinisce il Design.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, BellOff, BellRing, ChevronRight, Send } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/api/client';
import { toISODate } from '@/lib/utils';
import { disablePush, enablePush, getPushState, sendTestPush, syncPushSubscription } from '@/lib/push';

const DAY_MS = 24 * 60 * 60 * 1000;

// ---- Calcolo del resoconto (puro, testabile) -------------------------------------
const fullName = (r) =>
  `${r.first_name || ''} ${r.last_name || ''}`.trim() || r.client_name || r.name || r.email || r.client_email || 'Cliente';

const isActiveAppt = (a) => a.status !== 'cancelled' && a.status !== 'rejected';
const isRecent = (r, since) => r.created_date && new Date(r.created_date).getTime() >= since;

export function buildMorningReport({ appointments = [], intakeForms = [], reviews = [], messages = [], healthData = [] }, now = new Date()) {
  const today = toISODate(now);
  const since = now.getTime() - DAY_MS;
  const todays = appointments
    .filter((a) => a.preferred_date === today && isActiveAppt(a))
    .sort((a, b) => (a.preferred_time || '99').localeCompare(b.preferred_time || '99'));
  const pending = appointments
    .filter((a) => a.status === 'pending')
    .sort((a, b) => `${a.preferred_date}${a.preferred_time}`.localeCompare(`${b.preferred_date}${b.preferred_time}`));
  const formsToReview = intakeForms.filter((f) => f.status !== 'reviewed');
  const reviewsToApprove = reviews.filter((r) => !r.status || r.status === 'pending');
  const clientMessages = messages.filter((m) => m.sender === 'client');
  const unread = clientMessages.filter((m) => !m.read);
  const unreadFrom = new Set(unread.map((m) => (m.client_email || '').toLowerCase())).size;
  const news = {
    appointments: appointments.filter((a) => isRecent(a, since)).length,
    intakeForms: intakeForms.filter((f) => isRecent(f, since)).length,
    healthData: healthData.filter((h) => isRecent(h, since)).length,
    reviews: reviews.filter((r) => isRecent(r, since)).length,
    messages: clientMessages.filter((m) => isRecent(m, since)).length,
  };
  news.total = Object.values(news).reduce((s, n) => s + n, 0);
  return { today, todays, pending, formsToReview, reviewsToApprove, unread, unreadFrom, news };
}

// ---- Pulsante "Attiva notifiche del mattino" -----------------------------------
const PUSH_TEXT = {
  demo: 'Le notifiche non sono disponibili in modalità demo.',
  unconfigured: 'Le notifiche non sono ancora state configurate. Servono ancora un paio di passaggi sul server.',
  'needs-install':
    'Per ricevere le notifiche, installa prima l’app: tocca Condividi → “Aggiungi alla schermata Home”, poi aprila da lì.',
  unsupported: 'Questo browser non supporta le notifiche. Usa un Safari o un Chrome aggiornati.',
  denied: 'Le notifiche sono bloccate. Riattivale dalle impostazioni del dispositivo, nella sezione dedicata a MassoLab.',
  inactive: 'Ogni mattina alle 7:30 ricevi un riepilogo della giornata, solo con i numeri.',
  active: 'Attive su questo dispositivo: ogni mattina alle 7:30.',
};

export function MorningPushButton() {
  const [state, setState] = useState('loading');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    getPushState()
      .then((s) => alive && setState(s))
      .catch(() => alive && setState('unsupported'));
    syncPushSubscription().catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const run = async (fn, okMsg) => {
    setBusy(true);
    try {
      const next = await fn();
      if (typeof next === 'string') setState(next);
      if (okMsg && (typeof next !== 'string' || next === 'active' || next === 'inactive')) toast.success(okMsg(next));
    } catch (e) {
      toast.error(e?.message || 'Operazione non riuscita.');
    } finally {
      setBusy(false);
    }
  };

  if (state === 'loading') return null;
  const canToggle = state === 'inactive' || state === 'active';
  const Icon = state === 'active' ? BellRing : canToggle ? Bell : BellOff;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl bg-[#F3F0EA] p-3.5" data-push-state={state}>
      <div className="flex items-start gap-2 min-w-0 flex-1">
        <Icon className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#56695C]" aria-hidden="true" />
        <p className="text-[13px] leading-snug text-[#3E3D38]">{PUSH_TEXT[state] || PUSH_TEXT.unsupported}</p>
      </div>
      {canToggle && (
        <div className="flex gap-2 flex-shrink-0">
          {state === 'active' && (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                run(sendTestPush, (r) => (r?.sent ? 'Notifica di prova inviata.' : 'La notifica di prova non è partita: controlla i permessi.'))
              }
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-black/10 bg-white px-4 min-h-[44px] text-[13px] font-semibold text-[#191A17] transition-colors duration-300 ease-apple hover:bg-[#FAF8F5] disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" aria-hidden="true" /> Prova
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              state === 'active'
                ? run(disablePush, () => 'Notifiche disattivate su questo dispositivo.')
                : run(enablePush, (s) => (s === 'active' ? 'Notifiche del mattino attivate.' : 'Permesso non concesso: le notifiche restano disattivate.'))
            }
            className={`rounded-full px-4 min-h-[44px] text-[13px] font-semibold transition-colors duration-300 ease-apple disabled:opacity-50 ${
              state === 'active' ? 'border border-black/10 bg-white text-[#191A17] hover:bg-[#FAF8F5]' : 'bg-[#56695C] text-white hover:bg-[#46574B]'
            }`}
          >
            {state === 'active' ? 'Disattiva' : 'Attiva notifiche del mattino'}
          </button>
        </div>
      )}
    </div>
  );
}

// ---- Riquadro ----------------------------------------------------------------
function Row({ label, count, detail, tab, onNavigate, tone }) {
  const link = Boolean(onNavigate && tab);
  if (tone) {
    // Tessera con numero grande (appuntamenti e richieste: le due cose da guardare per prime).
    const dark = tone === 'sage';
    const content = (
      <>
        <span className={`block text-[13px] font-semibold ${dark ? 'text-white' : 'text-[#191A17]'}`}>{label}</span>
        <span
          className={`mt-2 block text-[44px] sm:text-5xl font-semibold leading-none tabular-nums ${dark ? 'text-white' : 'text-[#191A17]'}`}
          style={{ letterSpacing: '-0.04em' }}
        >
          {count}
        </span>
        <span className={`mt-2 block text-xs leading-snug line-clamp-2 min-h-[2rem] ${dark ? 'text-white/90' : 'text-[#6A685F]'}`}>
          {detail || (count === 0 ? 'Niente per ora' : '')}
        </span>
      </>
    );
    const tcls = `block w-full text-left rounded-2xl p-4 sm:p-5 transition-transform duration-300 ease-apple ${
      dark ? 'bg-[#56695C]' : 'bg-[#F3F0EA]'
    } ${link ? 'hover:scale-[1.01] active:scale-[0.99]' : ''}`;
    return link ? (
      <button type="button" className={tcls} onClick={() => onNavigate(tab)}>
        {content}
      </button>
    ) : (
      <div className={tcls}>{content}</div>
    );
  }
  const content = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-[#191A17]">{label}</span>
        {detail && <span className="block text-xs text-[#6A685F] truncate">{detail}</span>}
      </span>
      <span
        className={`text-xl font-semibold tabular-nums ${count > 0 ? 'text-[#191A17]' : 'text-[#6A685F]'}`}
        style={{ letterSpacing: '-0.03em' }}
      >
        {count}
      </span>
      {link && <ChevronRight className="w-4 h-4 text-[#6A685F]" aria-hidden="true" />}
    </>
  );
  const cls =
    'flex w-full items-center gap-3 px-3 min-h-[56px] py-2 text-left border-t border-black/[0.06] transition-colors duration-300 ease-apple' +
    (link ? ' hover:bg-[#F3F0EA]/70 active:bg-[#F3F0EA]' : '');
  return link ? (
    <button type="button" className={cls} onClick={() => onNavigate(tab)}>
      {content}
    </button>
  ) : (
    <div className={cls}>{content}</div>
  );
}

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const list = (rows, fmt, max = 3) =>
  rows.length ? rows.slice(0, max).map(fmt).join(' · ') + (rows.length > max ? ` · +${rows.length - max}` : '') : '';
const shortDate = (d) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }) : '');

export default function MorningReport({ appointments = [], onNavigate }) {
  const [extra, setExtra] = useState(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    const safe = (p) => p.catch(() => null);
    const [intakeForms, reviews, messages, healthData] = await Promise.all([
      safe(db.entities.IntakeForm.list('-created_date', 300)),
      safe(db.entities.Review.list('-created_date', 300)),
      safe(db.entities.Message.list('-created_date', 500)),
      safe(db.entities.HealthData.list('-created_date', 300)),
    ]);
    setFailed([intakeForms, reviews, messages, healthData].some((x) => x === null));
    setExtra({
      intakeForms: intakeForms || [],
      reviews: reviews || [],
      messages: messages || [],
      healthData: healthData || [],
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const report = useMemo(() => (extra ? buildMorningReport({ appointments, ...extra }) : null), [appointments, extra]);
  const dateLabel = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <section aria-labelledby="morning-report-title" className="bg-white rounded-3xl p-4 sm:p-6 border border-black/[0.04] shadow-[0_10px_40px_-12px_rgba(25,26,23,0.12)] space-y-4 sm:space-y-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6A685F]">{dateLabel}</p>
        <h2 id="morning-report-title" className="mt-1 text-2xl font-semibold text-[#191A17]" style={{ letterSpacing: '-0.03em' }}>
          Resoconto di oggi
        </h2>
      </header>

      {!report ? (
        <p className="text-sm text-[#6A685F]">Preparo il resoconto…</p>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Row
              tone="sage"
              label="Appuntamenti di oggi"
              count={report.todays.length}
              detail={list(report.todays, (a) => `${a.preferred_time || '—'} ${fullName(a)}`)}
              tab="calendar"
              onNavigate={onNavigate}
            />
            <Row
              tone="sand"
              label="Richieste da confermare"
              count={report.pending.length}
              detail={list(report.pending, (a) => `${fullName(a)} (${shortDate(a.preferred_date)})`)}
              tab="bookings"
              onNavigate={onNavigate}
            />
          </div>
          <div>
          <Row
            label="Schede e moduli da leggere"
            count={report.formsToReview.length}
            detail={list(report.formsToReview, fullName)}
            tab="intake_forms"
            onNavigate={onNavigate}
          />
          <Row
            label="Recensioni da approvare"
            count={report.reviewsToApprove.length}
            detail={list(report.reviewsToApprove, fullName)}
            tab="reviews"
            onNavigate={onNavigate}
          />
          <Row
            label="Messaggi non letti"
            count={report.unread.length}
            detail={report.unread.length ? `da ${plural(report.unreadFrom, 'cliente', 'clienti')}` : ''}
            tab="messages"
            onNavigate={onNavigate}
          />
          <Row
            label="Novità nelle ultime 24 ore"
            count={report.news.total}
            detail={[
              report.news.appointments && plural(report.news.appointments, 'prenotazione', 'prenotazioni'),
              report.news.intakeForms && plural(report.news.intakeForms, 'scheda', 'schede'),
              report.news.healthData && plural(report.news.healthData, 'dato di salute', 'dati di salute'),
              report.news.reviews && plural(report.news.reviews, 'recensione', 'recensioni'),
              report.news.messages && plural(report.news.messages, 'messaggio', 'messaggi'),
            ]
              .filter(Boolean)
              .join(' · ')}
          />
          </div>
          {failed && <p className="pt-2 text-xs text-[#9A5F2A]">Alcune informazioni non si sono caricate: il resoconto potrebbe essere incompleto.</p>}
        </div>
      )}

      <MorningPushButton />
    </section>
  );
}
