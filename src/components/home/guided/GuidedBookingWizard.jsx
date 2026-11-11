import { useState } from 'react';
import { useHoneypot } from '@/lib/honeypot';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, CircleCheck, MessageCircle, X } from 'lucide-react';
import { db } from '@/api/client';
import { whatsappUrl } from '@/api/config';
import { createPageUrl } from '@/lib/utils';
import { needLabel, suggestTreatment } from './quizData';
import { ContactStep, DetailsStep, NeedStep, SuggestionStep } from './WizardSteps';

const TOTAL_STEPS = 4;
const EMPTY_ANSWERS = { duration: null, intensity: null, first_time: null, does_sport: null, style_preference: null };

/**
 * 4-step "Aiutami a scegliere" wizard + result screen (original `a3`).
 * Fix: the original saved the GuidedBooking when leaving step 3, i.e. BEFORE
 * the contact step, so name/email/phone were never stored. Now it is saved
 * when leaving step 4 (with contact data) or when the user skips (without).
 */
export default function GuidedBookingWizard({ onClose }) {
  const hp = useHoneypot();
  const [step, setStep] = useState(1);
  const [need, setNeed] = useState(null);
  const [answers, setAnswers] = useState(EMPTY_ANSWERS);
  const [contact, setContact] = useState({ name: '', email: '', phone: '' });
  const [suggestion, setSuggestion] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const setAnswer = (k, v) => setAnswers((a) => ({ ...a, [k]: v }));
  const setContactField = (k, v) => setContact((c) => ({ ...c, [k]: v }));

  const canContinue = () => {
    if (step === 1) return !!need;
    if (step === 2)
      return !!(
        answers.duration &&
        answers.intensity &&
        answers.first_time !== null &&
        answers.does_sport !== null &&
        answers.style_preference
      );
    return true;
  };

  const save = async (withContact) => {
    if (hp.isBot()) return; // honeypot compilato: niente salvataggio
    const c = withContact ? contact : { name: '', email: '', phone: '' };
    await db.entities.GuidedBooking.create({
      need: needLabel(need),
      duration: answers.duration,
      intensity: answers.intensity,
      first_time: answers.first_time,
      does_sport: answers.does_sport,
      style_preference: answers.style_preference,
      suggested_treatment: suggestion?.treatment,
      alternative_treatment: suggestion?.alternative || '',
      caution_flag: suggestion?.caution || false,
      client_name: c.name.trim(),
      client_email: c.email.trim(),
      client_phone: c.phone.trim(),
    });
  };

  const next = async () => {
    setError('');
    if (step === 2) setSuggestion(suggestTreatment({ need, ...answers }));
    if (step === 4) {
      setSaving(true);
      try {
        await save(true);
        setSaved(true);
      } catch {
        setError('Non è stato possibile salvare i dati. Riprova o salta questo passaggio.');
        return;
      } finally {
        setSaving(false);
      }
    }
    setStep((s) => s + 1);
  };

  const skip = async () => {
    setError('');
    setSaving(true);
    try {
      await save(false);
      setSaved(true);
    } catch {
      // The result is still useful without saving.
    } finally {
      setSaving(false);
      setStep(5);
    }
  };

  const whatsappHref = () =>
    whatsappUrl(
      `Ciao Simone, ho usato il wizard sul sito e mi è stato suggerito: *${suggestion?.treatment}*.\nProblema: ${needLabel(need)}.\nVorrei prenotare una seduta.`,
    );

  if (step === 5) {
    const bookingUrl =
      createPageUrl('GuestBooking') +
      (suggestion?.treatment ? `?treatment=${encodeURIComponent(suggestion.treatment)}` : '');
    return (
      <div className="flex flex-col h-full overflow-y-auto p-6 text-center justify-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
          <CircleCheck className="w-9 h-9 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Perfetto, ci siamo!</h2>
        <p className="text-gray-500 text-sm mb-8">
          {saved
            ? "Il tuo percorso è stato salvato. Simone lo vedrà prima dell'appuntamento."
            : 'Ecco il tuo risultato.'}
          {contact.name.trim() && ` Grazie, ${contact.name.trim()}!`}
        </p>
        {suggestion?.caution ? (
          <a
            href={whatsappHref()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl py-4 font-bold text-base mb-3 transition-colors"
          >
            <MessageCircle className="w-5 h-5 text-green-400" />
            Scrivimi prima su WhatsApp
          </a>
        ) : (
          <div className="flex flex-col gap-3">
            <Link
              to={bookingUrl}
              onClick={onClose}
              className="w-full inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-xl py-4 font-bold text-base transition-colors"
            >
              <Calendar className="w-5 h-5" />
              Prenota {suggestion?.treatment}
            </Link>
            <a
              href={whatsappHref()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl py-4 font-bold text-base transition-colors"
            >
              <MessageCircle className="w-5 h-5 text-green-400" />
              Prima scrivi su WhatsApp
            </a>
          </div>
        )}
        <button type="button" onClick={onClose} className="mt-5 text-sm text-gray-400 hover:text-gray-600">
          Chiudi
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {hp.field}
      <div className="flex items-center justify-between mb-4 px-5 pt-5 md:px-6 md:pt-6 flex-shrink-0">
        <div className="flex-1">
          <div className="flex gap-1.5 mb-3" aria-hidden="true">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${n <= step ? 'bg-red-500' : 'bg-gray-200'}`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-400 font-medium">
            Step {step} di {TOTAL_STEPS}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Chiudi"
          className="ml-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 px-5 md:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 1 && <NeedStep value={need} onChange={setNeed} />}
            {step === 2 && <DetailsStep answers={answers} onChange={setAnswer} />}
            {step === 3 && suggestion && <SuggestionStep suggestion={suggestion} />}
            {step === 4 && <ContactStep contact={contact} onChange={setContactField} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex-shrink-0 pt-4 mt-2 border-t border-gray-100 px-5 pb-5 md:px-6 md:pb-6">
        {error && (
          <p className="text-xs text-red-600 font-medium mb-2" role="alert">
            {error}
          </p>
        )}
        <div className="flex gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={() => {
                setError('');
                setStep((s) => s - 1);
              }}
              disabled={saving}
              className="px-5 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              Indietro
            </button>
          )}
          <button
            type="button"
            onClick={next}
            disabled={!canContinue() || saving}
            className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors"
          >
            {saving ? 'Salvo...' : step === 4 ? 'Vedi i risultati →' : step === 3 ? 'Continua →' : 'Avanti →'}
          </button>
        </div>
        {step === 4 && (
          <button
            type="button"
            onClick={skip}
            disabled={saving}
            className="w-full mt-2 text-xs text-gray-400 hover:text-gray-600 py-1"
          >
            Salta — vai al risultato senza lasciare i dati
          </button>
        )}
      </div>
    </div>
  );
}
