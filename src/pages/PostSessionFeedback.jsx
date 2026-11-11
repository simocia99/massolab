import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, CircleCheck, LoaderCircle, Star } from 'lucide-react';
import { db } from '@/api/client';
import { createPageUrl } from '@/lib/utils';

const AREAS = [
  'Collo / Cervicale',
  'Spalle',
  'Schiena (dorsale)',
  'Schiena (lombare)',
  'Braccia / Gomiti',
  'Gambe',
  'Ginocchia',
  'Caviglie / Piedi',
  'Tutto il corpo',
  'Altro',
];

const MISSING_PARAMS = 'Parametri mancanti. Usa il link ricevuto via email.';
const points = (n) => `punt${n === 1 ? 'o' : 'i'}`;

function ScoreSlider({ id, when, suffix, value, onChange, valueClass, accentClass }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-1">
        Dolore / disagio <span className="font-normal text-gray-400">{when}</span>
        {suffix}
        <span className={`ml-2 font-bold ${valueClass}`}>{value}/10</span>
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full ${accentClass}`}
      />
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>0 — Nessuno</span>
        <span>10 — Insopportabile</span>
      </div>
    </div>
  );
}

/**
 * Post-session pain feedback (original `cne`).
 * Security fix: the original wrote TreatmentProgress directly from URL params
 * (email/treatment/date). Now the link must carry appointmentId + token and the
 * server function `submit_session_feedback` validates them.
 */
export default function PostSessionFeedback() {
  const [params] = useSearchParams();
  const appointmentId = params.get('appointmentId') || params.get('appointment_id') || '';
  const token = params.get('token') || '';
  const hasParams = !!(appointmentId && token);

  const [treatment, setTreatment] = useState(params.get('treatment') || '');
  const [date, setDate] = useState(params.get('date') || '');
  const [initial, setInitial] = useState(5);
  const [final, setFinal] = useState(5);
  const [area, setArea] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(hasParams ? '' : MISSING_PARAMS);

  // Fill the subtitle (treatment · date) from the appointment when not in the URL.
  useEffect(() => {
    if (!hasParams || (treatment && date)) return undefined;
    let alive = true;
    db.functions
      .invoke('appointment_by_token', { p_id: appointmentId, p_token: token })
      .then((a) => {
        if (!alive) return;
        if (!a) {
          setError('Link non valido o scaduto. Usa il link ricevuto via email.');
          return;
        }
        if (!treatment && a.treatment_type) setTreatment(a.treatment_type);
        if (!date && a.preferred_date) setDate(a.preferred_date);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId, token, hasParams]);

  const submit = async () => {
    if (!hasParams) {
      setError(MISSING_PARAMS);
      return;
    }
    setSaving(true);
    setError('');
    try {
      await db.functions.invoke('submit_session_feedback', {
        p_appointment_id: appointmentId,
        p_token: token,
        p_initial_score: initial,
        p_final_score: final,
        p_problem_area: area,
        p_notes: notes.trim(),
      });
      setDone(true);
    } catch {
      setError('Invio non riuscito. Il link potrebbe non essere valido: riprova o contatta Simone.');
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 max-w-sm w-full text-center"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CircleCheck className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Grazie per il tuo feedback!</h2>
          <p className="text-gray-500 text-sm mb-6">
            La tua valutazione è stata registrata e aggiornerà i grafici del tuo andamento.
          </p>
          <Link
            to={createPageUrl('Home')}
            className="block w-full bg-gray-900 hover:bg-gray-800 text-white rounded-2xl py-3 font-bold text-sm transition-colors"
          >
            Torna alla Home
          </Link>
        </motion.div>
      </div>
    );
  }

  const diff = initial - final;

  return (
    <div className="min-h-screen bg-[#f5f5f7] px-4 py-12">
      <div className="max-w-md mx-auto">
        <Link
          to={createPageUrl('Home')}
          className="inline-flex items-center text-gray-400 hover:text-gray-700 text-sm mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Home
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-6"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-5 h-5 text-red-500" />
              <h1 className="text-lg font-bold text-gray-900">Come ti senti dopo la seduta?</h1>
            </div>
            {treatment && (
              <p className="text-sm text-gray-400">
                {treatment}
                {date ? ` · ${date}` : ''}
              </p>
            )}
          </div>

          <ScoreSlider
            id="score-before"
            when="prima"
            suffix=" della seduta:"
            value={initial}
            onChange={setInitial}
            valueClass="text-red-600"
            accentClass="accent-red-600"
          />
          <ScoreSlider
            id="score-after"
            when="dopo"
            suffix=" la seduta:"
            value={final}
            onChange={setFinal}
            valueClass="text-green-600"
            accentClass="accent-green-600"
          />

          <AnimatePresence>
            {diff !== 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`rounded-2xl p-3 text-sm font-semibold text-center ${
                  diff > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}
              >
                {diff > 0
                  ? `✅ Miglioramento di ${diff} ${points(diff)}`
                  : `⚠️ Aumento di ${Math.abs(diff)} ${points(Math.abs(diff))}`}
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <p className="block text-sm font-semibold text-gray-700 mb-2">
              Zona trattata <span className="font-normal text-gray-400">(opzionale)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {AREAS.map((a) => (
                <button
                  key={a}
                  type="button"
                  aria-pressed={area === a}
                  onClick={() => setArea((cur) => (cur === a ? '' : a))}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    area === a
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="feedback-notes" className="block text-sm font-semibold text-gray-700 mb-1">
              Note aggiuntive <span className="font-normal text-gray-400">(opzionale)</span>
            </label>
            <textarea
              id="feedback-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Come ti sei sentito/a? Hai notato qualcosa di particolare?"
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 font-medium" role="alert">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={saving || !hasParams}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2 transition-colors"
          >
            {saving ? (
              <LoaderCircle className="w-4 h-4 animate-spin" aria-label="Invio in corso" />
            ) : (
              <>
                <CircleCheck className="w-4 h-4" /> Invia valutazione
              </>
            )}
          </button>
          <p className="text-xs text-gray-400 text-center">
            I tuoi dati aggiornano automaticamente i grafici nell'area clienti.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
