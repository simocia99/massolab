import { CircleCheck } from 'lucide-react';

/** Icon + label + value row used in the booking summaries (bundle `w4`). */
export function SummaryRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="text-sm font-semibold text-gray-700 flex-1">{label}</span>
      <span className="text-sm text-gray-500">{value}</span>
    </div>
  );
}

/** Rounded input with optional leading icon (bundle `T4`). */
export function IconInput({ icon, type = 'text', placeholder, value, onChange, autoComplete }) {
  return (
    <div className="relative">
      {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>}
      <input
        type={type}
        placeholder={placeholder}
        aria-label={placeholder}
        autoComplete={autoComplete}
        value={value}
        onChange={(ev) => onChange(ev.target.value)}
        className={`w-full border border-gray-200 rounded-2xl py-3.5 text-sm focus:outline-none focus:border-red-400 transition-colors ${icon ? 'pl-10 pr-4' : 'px-4'}`}
      />
    </div>
  );
}

/** Clickable consent card (bundle `E4`). */
export function ConsentCard({ checked, onChange, label, text }) {
  const toggle = () => onChange(!checked);
  return (
    <div
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onClick={toggle}
      onKeyDown={(ev) => {
        if (ev.key === ' ' || ev.key === 'Enter') {
          ev.preventDefault();
          toggle();
        }
      }}
      className={`rounded-2xl border-2 p-4 cursor-pointer transition-all select-none ${checked ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${checked ? 'bg-red-600 border-red-600' : 'border-gray-300'}`}
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
