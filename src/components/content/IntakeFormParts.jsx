// Building blocks of the pre-treatment intake form (bundle `F9`, `I9`, `L9`, `R9`)
// and its option lists (`N9`, `Nte`, `Pte`, `Fte`, `P9`).
import { useId } from 'react';
import { ChevronLeft, ChevronRight, CircleCheck, LoaderCircle } from 'lucide-react';

export const STEPS = ['Dati personali', 'Il tuo problema', 'Stile di vita', 'Consensi'];

export const BODY_AREAS = [
  'Collo / Cervicale',
  'Spalle',
  'Schiena (dorsale)',
  'Schiena (lombare)',
  'Braccia / Gomiti',
  'Mani / Polsi',
  'Gambe',
  'Ginocchia',
  'Caviglie / Piedi',
  'Tutto il corpo',
  'Altro',
];

export const DURATIONS = ['Pochi giorni', '1–4 settimane', '1–3 mesi', 'Più di 3 mesi', 'Problema cronico'];

export const RED_FLAG_WORDS = [
  'tumore',
  'cancro',
  'trombosi',
  'tromboflebite',
  'gravidanza',
  'pacemaker',
  'epilessia',
  'febbre',
  'infezione',
  'operazione recente',
  'frattura',
];

/** True when the free text mentions a possible contraindication. */
export function hasRedFlags(text) {
  if (!text) return false;
  const t = text.toLowerCase();
  return RED_FLAG_WORDS.some((w) => t.includes(w));
}

export function StepCard({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-6 space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

export function TextField({ label, type = 'text', value, onChange, placeholder, autoComplete }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-1">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 transition-colors"
      />
    </div>
  );
}

export function ConsentBox({ checked, onChange, label, text }) {
  const toggle = () => onChange(!checked);
  return (
    <div
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          toggle();
        }
      }}
      className={`rounded-2xl border-2 p-4 cursor-pointer transition-all select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 ${
        checked ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
            checked ? 'bg-red-600 border-red-600' : 'border-gray-300'
          }`}
        >
          {checked && <CircleCheck className="w-3.5 h-3.5 text-white" />}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800 mb-1">{label}</p>
          <p className="text-xs text-gray-500 leading-relaxed">{text}</p>
        </div>
      </div>
    </div>
  );
}

export function StepNav({ onBack, onNext, canNext, nextLabel = 'Continua', loading = false, isLast = false }) {
  return (
    <div className="flex gap-3 pt-2">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 px-4 sm:px-5 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Indietro
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext || loading}
        className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-2xl py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors"
      >
        {loading ? (
          <LoaderCircle className="w-4 h-4 animate-spin" aria-label="Invio in corso" />
        ) : (
          <>
            {nextLabel} {!isLast && <ChevronRight className="w-4 h-4" />}
          </>
        )}
      </button>
    </div>
  );
}

export function ChipGroup({ label, options, value, onChange }) {
  return (
    <div>
      <span className="block text-sm font-semibold text-gray-700 mb-2">{label}</span>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={value === opt}
            onClick={() => onChange(opt)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              value === opt ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
