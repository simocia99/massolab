// Pre-treatment intake form (anonymous IntakeForm insert).
// Optional URL params to prefill: first_name, last_name, email, phone (or name="Nome Cognome"),
// or appointment_id (+ token) to prefill from the booked appointment.
import { useHoneypot } from '@/lib/honeypot';
import { Fragment, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, CircleCheck, TriangleAlert } from 'lucide-react';
import { db } from '@/api/client';
import { createPageUrl } from '@/lib/utils';
import {
  BODY_AREAS,
  ChipGroup,
  ConsentBox,
  DURATIONS,
  hasRedFlags,
  StepCard,
  StepNav,
  STEPS,
  TextField,
} from '@/components/content/IntakeFormParts';

const EMPTY = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  birth_date: '',
  visit_reason: '',
  body_area: '',
  problem_duration: '',
  pain_intensity: 5,
  job_activity: '',
  sport_activity: '',
  previous_treatments: '',
  contraindications: '',
  has_contraindications: false,
  privacy_consent: false,
  treatment_consent: false,
};

const textareaClass =
  'w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 resize-none';
const slide = { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } };

function initialFromParams(params) {
  const [nameFirst = '', ...rest] = (params.get('name') || '').trim().split(/\s+/);
  return {
    ...EMPTY,
    first_name: params.get('first_name') || nameFirst,
    last_name: params.get('last_name') || rest.join(' '),
    email: params.get('email') || '',
    phone: params.get('phone') || '',
  };
}

export default function IntakeForm() {
  const hp = useHoneypot();
  const [params] = useSearchParams();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(() => initialFromParams(params));
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  // I link delle email e della pagina di conferma usano ?id=<appointment id>&token=...
  const appointmentId = params.get('appointment_id') || params.get('appointmentId') || params.get('id');
  const token = params.get('token');
  useEffect(() => {
    if (!appointmentId || !token) return undefined;
    let cancelled = false;
    db.functions
      .invoke('appointment_by_token', { p_id: appointmentId, p_token: token })
      .then((res) => {
        const appt = Array.isArray(res) ? res[0] : res;
        if (cancelled || !appt) return;
        setForm((f) => ({ ...f, first_name: f.first_name || appt.first_name || '', email: f.email || appt.email || '' }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [appointmentId, token]);

  const set = (field, value) =>
    setForm((f) => ({
      ...f,
      [field]: value,
      ...(field === 'contraindications' ? { has_contraindications: hasRedFlags(value) } : {}),
    }));

  const step1Ok = form.first_name.trim() && form.last_name.trim() && /\S+@\S+\.\S+/.test(form.email) && form.phone.trim();
  const step2Ok = form.visit_reason.trim() && form.body_area && form.problem_duration;
  const step4Ok = form.privacy_consent && form.treatment_consent;
  const showWarning = form.has_contraindications;

  const goTo = (n) => {
    setStep(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async () => {
    if (hp.isBot()) {
      setSent(true); // finto successo
      return;
    }
    setSaving(true);
    setError('');
    try {
      await db.entities.IntakeForm.create({ ...form, status: 'completed' });
      // Avviso al terapista (testo generato dal server, nessun dato sanitario).
      db.integrations.Core.SendNotification({
        type: 'intake_submitted',
        ...(appointmentId && token ? { appointment_id: appointmentId, token } : {}),
        data: { first_name: form.first_name, last_name: form.last_name },
      }).catch((err) => console.warn('Notifica email non inviata:', err));
      setSent(true);
    } catch {
      setError('Invio non riuscito. Controlla la connessione e riprova.');
    } finally {
      setSaving(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-[#F3F0EA] flex items-center justify-center px-4 sm:px-6 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-10 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CircleCheck className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Modulo inviato!</h2>
          <p className="text-gray-500 mb-6">
            Grazie <strong>{form.first_name}</strong>. Simone leggerà le tue informazioni prima della seduta e potrà
            prepararsi al meglio.
          </p>
          {form.has_contraindications && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex gap-3 text-left">
              <TriangleAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                Hai segnalato alcune informazioni importanti.{' '}
                <strong>Ti consigliamo di contattare Simone prima dell'appuntamento</strong> per una breve valutazione
                preliminare.
              </p>
            </div>
          )}
          <Link
            to={createPageUrl('Home')}
            className="block w-full bg-gray-900 hover:bg-gray-800 text-white rounded-2xl py-4 font-bold transition-colors text-center"
          >
            Torna alla Home
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-clip bg-[#F3F0EA] px-4 py-10 md:py-16">
      {hp.field}
      <div className="max-w-xl mx-auto">
        <div className="mb-8">
          <Link
            to={createPageUrl('Home')}
            className="inline-flex items-center text-gray-500 hover:text-gray-700 text-sm mb-5 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Indietro
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Modulo Pre-Trattamento</h1>
          <p className="text-gray-500 text-sm mt-1">Poche domande per aiutarci a prepararci al meglio per te</p>
        </div>

        <ol className="flex items-center gap-2 mb-8" aria-label="Avanzamento">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const active = step === n;
            const past = step > n;
            return (
              <Fragment key={n}>
                <li
                  aria-current={active ? 'step' : undefined}
                  className={`flex items-center gap-1.5 text-xs font-semibold transition-all ${
                    active ? 'text-gray-900' : past ? 'text-red-600' : 'text-gray-300'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      active ? 'bg-gray-900 text-white' : past ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {past ? '✓' : n}
                  </span>
                  <span className="hidden sm:inline">{label}</span>
                </li>
                {i < STEPS.length - 1 && (
                  <li aria-hidden="true" className={`flex-1 h-0.5 rounded-full ${past ? 'bg-red-600' : 'bg-gray-200'}`} />
                )}
              </Fragment>
            );
          })}
        </ol>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" {...slide}>
              <StepCard title="Dati personali" subtitle="Informazioni di base per identificarti">
                <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3">
                  <TextField label="Nome *" value={form.first_name} onChange={(v) => set('first_name', v)} placeholder="Mario" autoComplete="given-name" />
                  <TextField label="Cognome *" value={form.last_name} onChange={(v) => set('last_name', v)} placeholder="Rossi" autoComplete="family-name" />
                </div>
                <TextField label="Email *" type="email" value={form.email} onChange={(v) => set('email', v)} placeholder="mario@email.com" autoComplete="email" />
                <TextField label="Telefono *" type="tel" value={form.phone} onChange={(v) => set('phone', v)} placeholder="+39 333 000 0000" autoComplete="tel" />
                <TextField label="Data di nascita" type="date" value={form.birth_date} onChange={(v) => set('birth_date', v)} autoComplete="bday" />
                <StepNav onNext={() => goTo(2)} canNext={step1Ok} />
              </StepCard>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" {...slide}>
              <StepCard title="Il tuo problema" subtitle="Raccontaci cosa ti ha portato qui">
                <div>
                  <label htmlFor="visit_reason" className="block text-sm font-semibold text-gray-700 mb-1">
                    Motivo principale della visita *
                  </label>
                  <textarea
                    id="visit_reason"
                    value={form.visit_reason}
                    onChange={(e) => set('visit_reason', e.target.value)}
                    rows={3}
                    placeholder="Es. tensione cervicale, dolore alla schiena, recupero sportivo..."
                    className={textareaClass}
                  />
                </div>
                <ChipGroup label="Area del corpo interessata *" options={BODY_AREAS} value={form.body_area} onChange={(v) => set('body_area', v)} />
                <ChipGroup label="Da quanto tempo è presente? *" options={DURATIONS} value={form.problem_duration} onChange={(v) => set('problem_duration', v)} />
                <div>
                  <label htmlFor="pain_intensity" className="block text-sm font-semibold text-gray-700 mb-2">
                    Intensità percepita: <span className="text-red-600">{form.pain_intensity}/10</span>
                  </label>
                  <input
                    id="pain_intensity"
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={form.pain_intensity}
                    onChange={(e) => set('pain_intensity', Number(e.target.value))}
                    className="w-full accent-red-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1 — Lieve</span>
                    <span>10 — Molto intenso</span>
                  </div>
                </div>
                <StepNav onBack={() => goTo(1)} onNext={() => goTo(3)} canNext={step2Ok} />
              </StepCard>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" {...slide}>
              <StepCard title="Stile di vita" subtitle="Informazioni che aiutano il terapista a personalizzare il trattamento">
                <TextField
                  label="Attività lavorativa"
                  value={form.job_activity}
                  onChange={(v) => set('job_activity', v)}
                  placeholder="Es. impiegato (lavoro seduto), operaio, infermiere..."
                />
                <TextField
                  label="Attività sportiva"
                  value={form.sport_activity}
                  onChange={(v) => set('sport_activity', v)}
                  placeholder="Es. corsa 3 volte/settimana, nuoto, nessuna..."
                />
                <div>
                  <label htmlFor="previous_treatments" className="block text-sm font-semibold text-gray-700 mb-1">
                    Trattamenti già effettuati
                  </label>
                  <textarea
                    id="previous_treatments"
                    value={form.previous_treatments}
                    onChange={(e) => set('previous_treatments', e.target.value)}
                    rows={2}
                    placeholder="Es. fisioterapia, osteopatia, altri massaggi..."
                    className={textareaClass}
                  />
                </div>
                <div>
                  <label htmlFor="contraindications" className="block text-sm font-semibold text-gray-700 mb-1">
                    Situazioni da segnalare
                    <span className="text-xs font-normal text-gray-500 ml-2">(es. gravidanza, operazioni recenti, patologie...)</span>
                  </label>
                  <textarea
                    id="contraindications"
                    value={form.contraindications}
                    onChange={(e) => set('contraindications', e.target.value)}
                    rows={2}
                    placeholder="Segnala qualsiasi informazione utile per il terapista..."
                    className={textareaClass}
                  />
                  <AnimatePresence>
                    {showWarning && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, filter: 'blur(8px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0 }}
                        role="alert"
                        className="mt-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3"
                      >
                        <TriangleAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800">
                          Hai segnalato informazioni che potrebbero richiedere una valutazione preventiva.{' '}
                          <strong>Ti consigliamo di contattare Simone prima dell'appuntamento</strong> per concordare il
                          trattamento più adatto a te.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <StepNav onBack={() => goTo(2)} onNext={() => goTo(4)} canNext />
              </StepCard>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="s4" {...slide}>
              <StepCard title="Consensi" subtitle="Leggi e accetta prima di inviare">
                <ConsentBox
                  checked={form.privacy_consent}
                  onChange={(v) => set('privacy_consent', v)}
                  label="Consenso al trattamento dei dati personali *"
                  text="Acconsento al trattamento dei miei dati personali ai sensi del Reg. UE 2016/679 (GDPR) per la gestione della mia cartella clinica e delle comunicazioni relative ai trattamenti. I dati non saranno ceduti a terzi."
                />
                <ConsentBox
                  checked={form.treatment_consent}
                  onChange={(v) => set('treatment_consent', v)}
                  label="Informativa trattamento *"
                  text="Dichiaro di aver preso visione delle informazioni sul trattamento. Sono consapevole che la massoterapia è una disciplina di benessere e non sostituisce la diagnosi o la cura medica. In caso di dubbi sulla mia condizione di salute, mi sono rivolto o mi rivolgerò al mio medico."
                />
                {error && (
                  <p role="alert" className="text-sm text-danger">
                    {error}
                  </p>
                )}
                <StepNav onBack={() => goTo(3)} onNext={submit} nextLabel="Invia Modulo" canNext={step4Ok} loading={saving} isLast />
              </StepCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
