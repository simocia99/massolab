// Section label of Estetica v2: "■ TITOLO ————" (small square, caps, hairline).
export default function SectionLabel({ children, className = '', dark = false }) {
  return (
    <div className={`flex items-center gap-4 mb-8 md:mb-10 ${className}`}>
      <span className={`w-1.5 h-1.5 flex-shrink-0 ${dark ? 'bg-white' : 'bg-ink'}`} aria-hidden="true" />
      <span
        className={`text-xs font-medium uppercase tracking-[0.08em] whitespace-nowrap ${dark ? 'text-white/75' : 'text-gray-500'}`}
      >
        {children}
      </span>
      <span className={`h-px flex-1 ${dark ? 'bg-white/20' : 'bg-ink/10'}`} aria-hidden="true" />
    </div>
  );
}
