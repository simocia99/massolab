import { AnimatePresence, motion } from 'framer-motion';
import { CircleCheck, FileText, LoaderCircle, SkipForward, TriangleAlert } from 'lucide-react';
import { BODY_AREAS, PROBLEM_DURATIONS } from './bookingData';
import { ConsentCard, IconInput } from './GuestBookingParts';

const chip = (active) =>
  `px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${active ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'}`;

/** Step 4 of GuestBooking: optional health questionnaire. */
export default function GuestIntakeStep({ intake, setField, submitting, onSubmit }) {
  const consentsGiven = intake.privacy_consent && intake.treatment_consent;
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-5">
      <div className="flex items-start gap-3 bg-blue-50 rounded-2xl p-4">
        <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-blue-800">Scheda salute pre-trattamento</p>
          <p className="text-xs text-blue-600 mt-0.5">
            Facoltativa ma consigliata. Aiuta Simone a personalizzare la seduta per te.
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="gb-visit-reason" className="block text-sm font-semibold text-gray-700 mb-1">
          Motivo principale della visita
        </label>
        <textarea
          id="gb-visit-reason"
          value={intake.visit_reason}
          onChange={(ev) => setField('visit_reason', ev.target.value)}
          rows={2}
          placeholder="Es. tensione cervicale, recupero sportivo, relax..."
          className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 resize-none"
        />
      </div>

      <div>
        <p className="block text-sm font-semibold text-gray-700 mb-2">Area del corpo interessata</p>
        <div className="flex flex-wrap gap-2">
          {BODY_AREAS.map((a) => (
            <button key={a} type="button" onClick={() => setField('body_area', a)} className={chip(intake.body_area === a)}>
              {a}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="block text-sm font-semibold text-gray-700 mb-2">Da quanto tempo è presente?</p>
        <div className="flex flex-wrap gap-2">
          {PROBLEM_DURATIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setField('problem_duration', d)}
              className={chip(intake.problem_duration === d)}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="gb-pain" className="block text-sm font-semibold text-gray-700 mb-2">
          Intensità percepita: <span className="text-red-600">{intake.pain_intensity}/10</span>
        </label>
        <input
          id="gb-pain"
          type="range"
          min={1}
          max={10}
          step={1}
          value={intake.pain_intensity}
          onChange={(ev) => setField('pain_intensity', Number(ev.target.value))}
          className="w-full accent-red-600"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1 — Lieve</span>
          <span>10 — Molto intenso</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <IconInput placeholder="Attività lavorativa" value={intake.job_activity} onChange={(v) => setField('job_activity', v)} />
        <IconInput placeholder="Attività sportiva" value={intake.sport_activity} onChange={(v) => setField('sport_activity', v)} />
      </div>

      <div>
        <label htmlFor="gb-contra" className="block text-sm font-semibold text-gray-700 mb-1">
          Situazioni da segnalare{' '}
          <span className="text-xs font-normal text-gray-500">(gravidanza, patologie, operazioni...)</span>
        </label>
        <textarea
          id="gb-contra"
          value={intake.contraindications}
          onChange={(ev) => setField('contraindications', ev.target.value)}
          rows={2}
          placeholder="Segnala qualsiasi informazione utile per il terapista..."
          className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 resize-none"
        />
        <AnimatePresence>
          {intake.has_contraindications && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3"
            >
              <TriangleAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                Hai segnalato informazioni importanti.{' '}
                <strong>Ti consigliamo di contattare Simone prima dell'appuntamento</strong> per una valutazione preventiva.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ConsentCard
        checked={intake.privacy_consent}
        onChange={(v) => setField('privacy_consent', v)}
        label="Consenso privacy *"
        text="Acconsento al trattamento dei miei dati personali ai sensi del GDPR per la gestione della cartella clinica."
      />
      <ConsentCard
        checked={intake.treatment_consent}
        onChange={(v) => setField('treatment_consent', v)}
        label="Informativa trattamento *"
        text="Dichiaro di aver preso visione delle informazioni sul trattamento. Sono consapevole che la massoterapia è una disciplina di benessere e non sostituisce la diagnosi medica."
      />

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          disabled={submitting}
          onClick={() => onSubmit(true)}
          className="flex items-center gap-1.5 px-4 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-40"
        >
          <SkipForward className="w-4 h-4" /> Salta
        </button>
        <button
          type="button"
          disabled={!consentsGiven || submitting}
          onClick={() => onSubmit(false)}
          className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-2xl py-3 font-bold flex items-center justify-center gap-2 transition-colors text-sm"
        >
          {submitting ? (
            <LoaderCircle className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <CircleCheck className="w-4 h-4" /> Invia e conferma
            </>
          )}
        </button>
      </div>
      <p className="text-xs text-gray-500 text-center">Puoi anche saltare e compilare la scheda in un secondo momento</p>
    </div>
  );
}
