import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronUp, Pen, X } from 'lucide-react';

/** Stick-figure placeholder used when an exercise has no image. */
export function StickFigure({ className = 'w-12 h-12 text-gray-300', small = false }) {
  if (small) {
    return (
      <svg viewBox="0 0 56 56" className={className} aria-hidden="true">
        <g stroke="currentColor" strokeWidth="2" fill="none">
          <circle cx="28" cy="11" r="5" />
          <line x1="28" y1="16" x2="28" y2="35" />
          <line x1="28" y1="23" x2="18" y2="31" />
          <line x1="28" y1="23" x2="38" y2="31" />
          <line x1="28" y1="35" x2="21" y2="48" />
          <line x1="28" y1="35" x2="35" y2="48" />
        </g>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
      <g stroke="currentColor" strokeWidth="2.5" fill="none">
        <circle cx="40" cy="16" r="7" />
        <line x1="40" y1="23" x2="40" y2="50" />
        <line x1="40" y1="32" x2="25" y2="44" />
        <line x1="40" y1="32" x2="55" y2="44" />
        <line x1="40" y1="50" x2="30" y2="68" />
        <line x1="40" y1="50" x2="50" y2="68" />
      </g>
    </svg>
  );
}

export function Pill({ label, color = 'gray' }) {
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
        color === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'
      }`}
    >
      {label}
    </span>
  );
}

/** One exercise inside the program editor. */
export function ExerciseCard({ exercise, onEdit, onRemove, index }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex gap-3 sm:gap-4 p-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
          {exercise.image_url ? (
            <img
              src={exercise.image_url}
              alt={exercise.name}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
              style={{ filter: 'grayscale(60%) contrast(1.1)' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <StickFigure />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-bold text-gray-900 text-sm break-words">{exercise.name}</p>
            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={() => onEdit(index)}
                aria-label="Modifica esercizio"
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Pen className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onRemove(index)}
                aria-label="Rimuovi esercizio"
                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {!!exercise.sets && <Pill label={`${exercise.sets} serie`} />}
            {exercise.reps && <Pill label={`${exercise.reps} rip.`} />}
            {exercise.duration && <Pill label={exercise.duration} />}
            {exercise.frequency && <Pill label={exercise.frequency} color="blue" />}
          </div>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="text-xs text-gray-500 hover:text-gray-600 mt-2 flex items-center gap-1"
          >
            {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {open ? 'Nascondi' : 'Dettagli'}
          </button>
          {open && (
            <div className="mt-2 text-xs text-gray-500 space-y-1">
              {exercise.description && <p>{exercise.description}</p>}
              {exercise.notes && <p className="text-amber-600 font-medium">⚠️ {exercise.notes}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">
        {label}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-normal text-gray-900 focus:outline-none focus:border-red-400"
        />
      </label>
    </div>
  );
}

/** Modal to edit a single exercise. */
export function ExerciseEditor({ exercise, onSave, onClose }) {
  const [form, setForm] = useState({ ...exercise });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && closeRef.current();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, []);

  const validImage = /^https?:\/\//i.test(form.image_url || '');

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="exercise-editor-title"
    >
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 id="exercise-editor-title" className="font-bold text-gray-900">
            Modifica esercizio
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl" aria-label="Chiudi">
            <X className="w-4 h-4" />
          </button>
        </div>
        <Field label="Nome" value={form.name || ''} onChange={(v) => set('name', v)} />
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            Descrizione
            <textarea
              value={form.description || ''}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-normal text-gray-900 focus:outline-none focus:border-red-400 resize-none"
            />
          </label>
        </div>
        <Field
          label="URL immagine"
          value={form.image_url || ''}
          onChange={(v) => set('image_url', v)}
          placeholder="https://..."
        />
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Serie"
            type="number"
            value={form.sets || ''}
            onChange={(v) => set('sets', v === '' ? '' : Number(v))}
          />
          <Field label="Ripetizioni" value={form.reps || ''} onChange={(v) => set('reps', v)} placeholder="es. 10-12" />
          <Field label="Durata" value={form.duration || ''} onChange={(v) => set('duration', v)} placeholder="es. 30 sec" />
          <Field
            label="Frequenza"
            value={form.frequency || ''}
            onChange={(v) => set('frequency', v)}
            placeholder="es. 3x settimana"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            Note / precauzioni
            <textarea
              value={form.notes || ''}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
              className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-normal text-gray-900 focus:outline-none focus:border-red-400 resize-none"
            />
          </label>
        </div>
        {validImage && (
          <img
            src={form.image_url}
            alt="preview"
            className="w-full h-32 object-cover rounded-xl"
            style={{ filter: 'grayscale(60%)' }}
          />
        )}
        <button
          onClick={() => {
            onSave(form);
            onClose();
          }}
          className="w-full bg-red-600 hover:bg-red-700 text-white rounded-2xl py-3 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
        >
          <Check className="w-4 h-4" /> Salva modifiche
        </button>
      </div>
    </div>
  );
}
