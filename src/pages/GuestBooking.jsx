import { Fragment, useRef, useState } from 'react';
import { useHoneypot } from '@/lib/honeypot';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowRight, Calendar, ChevronLeft, Clock, Euro, Info, Mail, Phone, User } from 'lucide-react';
import { db } from '@/api/client';
import SlotPicker from '@/components/booking/SlotPicker';
import GuestIntakeStep from '@/components/booking/GuestIntakeStep';
import GuestBookingSuccess from '@/components/booking/GuestBookingSuccess';
import { IconInput, SummaryRow } from '@/components/booking/GuestBookingParts';
import { CONTRAINDICATION_KEYWORDS, GUEST_STEPS, GUEST_TREATMENTS } from '@/components/booking/bookingData';
import { SlotTakenError, createAppointment } from '@/components/booking/bookingUtils';
import { notifyBookingReceived } from '@/components/booking/bookingEmails';

const EMPTY_CONTACT = { first_name: '', last_name: '', email: '', phone: '', notes: '' };
const EMPTY_INTAKE = {
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
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const stepMotion = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};
const continueBtn =
  'w-full bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2 transition-colors';

export default function GuestBooking() {
  const hp = useHoneypot();
  const [params] = useSearchParams();
  const initialTreatment = GUEST_TREATMENTS.find((t) => t.name === params.get('treatment')) || null;

  const [step, setStep] = useState(initialTreatment ? 2 : 1);
  const [treatment, setTreatment] = useState(initialTreatment);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [contact, setContact] = useState(EMPTY_CONTACT);
  const [intake, setIntake] = useState(EMPTY_INTAKE);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { appointment, intakeSkipped }
  const submittingRef = useRef(false);

  const setContactField = (k, v) => setContact((c) => ({ ...c, [k]: v }));
  const setIntakeField = (k, v) =>
    setIntake((prev) => {
      const next = { ...prev, [k]: v };
      if (k === 'contraindications') {
        next.has_contraindications = CONTRAINDICATION_KEYWORDS.some((w) => v.toLowerCase().includes(w));
      }
      return next;
    });

  const slotChosen = date && time;
  const contactValid =
    contact.first_name.trim() && contact.last_name.trim() && isEmail(contact.email) && contact.phone.trim();

  const submit = async (skipIntake) => {
    if (submittingRef.current) return; // guard against double clicks
    if (hp.isBot()) return; // honeypot compilato: nessun invio
    submittingRef.current = true;
    setSubmitting(true);
    const person = {
      first_name: contact.first_name.trim(),
      last_name: contact.last_name.trim(),
      email: contact.email.toLowerCase().trim(),
      phone: contact.phone.trim(),
    };
    try {
      const appointment = await createAppointment({
        ...person,
        treatment_type: treatment.name,
        preferred_date: date,
        preferred_time: time,
        notes: contact.notes,
        is_guest: true,
      });

      let intakeSkipped = skipIntake;
      if (!skipIntake) {
        try {
          await db.entities.IntakeForm.create({ ...person, ...intake, status: 'completed' });
        } catch (err) {
          console.warn('Scheda salute non salvata:', err);
          intakeSkipped = true;
          toast.error('Prenotazione inviata, ma la scheda salute non è stata salvata. Potrai compilarla più tardi.');
        }
      }

      await notifyBookingReceived(appointment, { source: 'guest', intakeSkipped });
      setResult({ appointment, intakeSkipped });
      window.scrollTo(0, 0);
    } catch (err) {
      if (err instanceof SlotTakenError) {
        toast.error(err.message);
        setTime('');
        setStep(2);
      } else {
        console.error(err);
        toast.error("Si è verificato un errore durante l'invio della prenotazione. Riprova.");
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <GuestBookingSuccess appointment={result.appointment} treatment={treatment} intakeSkipped={result.intakeSkipped} />
    );
  }

  return (
    <div className="min-h-screen overflow-x-clip bg-[#f5f5f7] px-4 py-8 md:py-16 pb-28 md:pb-16">
      {hp.field}
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-gray-400 hover:text-gray-700 text-sm mb-5 transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" /> Indietro
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Prenota un Appuntamento</h1>
          <p className="text-gray-500 mt-1">In pochi minuti</p>
        </div>

        <div className="flex items-center gap-2 mb-8">
          {GUEST_STEPS.map((label, idx) => {
            const n = idx + 1;
            const active = step === n;
            const done = step > n;
            return (
              <Fragment key={n}>
                <button
                  type="button"
                  onClick={() => done && !submitting && setStep(n)}
                  aria-label={`Passo ${n}: ${label}`}
                  aria-current={active ? 'step' : undefined}
                  className={`flex items-center gap-2 min-h-[44px] min-w-[32px] justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500 text-sm font-semibold transition-all ${active ? 'text-gray-900' : done ? 'text-red-600 cursor-pointer' : 'text-gray-300'}`}
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${active ? 'bg-gray-900 text-white' : done ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-400'}`}
                  >
                    {done ? '✓' : n}
                  </span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
                {idx < GUEST_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 rounded-full transition-all ${done ? 'bg-red-600' : 'bg-gray-200'}`} />
                )}
              </Fragment>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" {...stepMotion}>
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-1">Scegli il trattamento</h2>
                <p className="text-sm text-gray-400 mb-5">Seleziona il tipo di seduta che desideri</p>
                <div className="space-y-2">
                  {GUEST_TREATMENTS.map((t) => {
                    const selected = treatment?.name === t.name;
                    return (
                      <button
                        key={t.name}
                        type="button"
                        onClick={() => {
                          if (treatment?.name !== t.name) setTime('');
                          setTreatment(t);
                        }}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 text-left transition-all ${selected ? 'border-red-500 bg-red-50' : 'border-gray-100 hover:border-gray-200 bg-gray-50'}`}
                      >
                        <div>
                          <p className={`font-semibold text-sm ${selected ? 'text-red-700' : 'text-gray-800'}`}>{t.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{t.description}</p>
                        </div>
                        <div className="flex-shrink-0 ml-4 text-right">
                          <div
                            className={`flex items-center gap-1 text-sm font-bold ${selected ? 'text-red-600' : 'text-gray-700'}`}
                          >
                            <Euro className="w-3.5 h-3.5" />
                            {t.price}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {t.duration} min
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <button type="button" disabled={!treatment} onClick={() => setStep(2)} className={`${continueBtn} mt-5`}>
                  Continua <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" {...stepMotion}>
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Trattamento selezionato</p>
                    <p className="font-bold text-gray-900 mt-0.5">{treatment?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{treatment?.duration} min</p>
                    <p className="font-bold text-red-600">€{treatment?.price}</p>
                  </div>
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Scegli data e orario</h2>
                <p className="text-sm text-gray-400 mb-5">Solo le disponibilità reali sono mostrate</p>
                <SlotPicker
                  selectedDate={date}
                  selectedTime={time}
                  treatmentType={treatment?.name}
                  onSelectSlot={(d, t) => {
                    setDate(d);
                    setTime(t);
                  }}
                />
                <button type="button" disabled={!slotChosen} onClick={() => setStep(3)} className={`${continueBtn} mt-6`}>
                  Continua <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" {...stepMotion}>
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                <div className="bg-gray-50 rounded-2xl p-4 mb-6 space-y-2">
                  <SummaryRow
                    icon={<Calendar className="w-4 h-4 text-red-500" />}
                    label={treatment?.name}
                    value={`€${treatment?.price} · ${treatment?.duration} min`}
                  />
                  <SummaryRow icon={<Clock className="w-4 h-4 text-gray-400" />} label={date} value={`ore ${time}`} />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">I tuoi dati</h2>
                <p className="text-sm text-gray-400 mb-5">Per confermare la prenotazione</p>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <IconInput
                      icon={<User className="w-4 h-4" />}
                      placeholder="Nome"
                      autoComplete="given-name"
                      value={contact.first_name}
                      onChange={(v) => setContactField('first_name', v)}
                    />
                    <IconInput
                      placeholder="Cognome"
                      autoComplete="family-name"
                      value={contact.last_name}
                      onChange={(v) => setContactField('last_name', v)}
                    />
                  </div>
                  <IconInput
                    icon={<Mail className="w-4 h-4" />}
                    type="email"
                    placeholder="Email"
                    autoComplete="email"
                    value={contact.email}
                    onChange={(v) => setContactField('email', v)}
                  />
                  <IconInput
                    icon={<Phone className="w-4 h-4" />}
                    type="tel"
                    placeholder="Telefono"
                    autoComplete="tel"
                    value={contact.phone}
                    onChange={(v) => setContactField('phone', v)}
                  />
                  <textarea
                    value={contact.notes}
                    onChange={(ev) => setContactField('notes', ev.target.value)}
                    placeholder="Note opzionali (es. problemi specifici, preferenze...)"
                    aria-label="Note opzionali"
                    rows={3}
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 resize-none"
                  />
                </div>
                <div className="flex gap-3 bg-amber-50 rounded-xl p-4 mt-5">
                  <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    <strong>Cancellazione gratuita</strong> fino a 24 ore prima.
                  </p>
                </div>
                <button type="button" disabled={!contactValid} onClick={() => setStep(4)} className={`${continueBtn} mt-5`}>
                  Continua <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" {...stepMotion}>
              <GuestIntakeStep intake={intake} setField={setIntakeField} submitting={submitting} onSubmit={submit} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
