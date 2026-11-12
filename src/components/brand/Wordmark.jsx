// Logo MassoLab "Firma": "massolab." (Instrument Sans 600, punto in ocra/rame) + "SIMONE CIACCHI".
// Testo vero (non immagine): nitido a ogni dimensione e leggibile dagli screen reader.
// tone: 'dark' = scritta scura su fondo chiaro · 'light' = scritta chiara su fondo scuro/foto.
const SIZES = {
  sm: { word: 'text-[22px]', name: 'text-[12px] mt-1', hideNameBelow420: true },
  lg: { word: 'text-[40px]', name: 'text-[13px] mt-2', hideNameBelow420: false },
};

export default function Wordmark({ tone = 'dark', size = 'sm', showName = true, className = '' }) {
  const s = SIZES[size] || SIZES.sm;
  const word = tone === 'light' ? 'text-white' : 'text-ink';
  const name = tone === 'light' ? 'text-white/80' : 'text-gray-600';
  return (
    <span className={`flex flex-col leading-none ${className}`}>
      <span
        className={`${s.word} ${word} leading-none transition-colors`}
        style={{ fontWeight: 600, letterSpacing: '-0.05em' }}
      >
        massolab<span className="text-ocra">.</span>
      </span>
      {showName && (
        <span
          className={`${s.name} ${name} uppercase transition-colors ${s.hideNameBelow420 ? 'hidden min-[420px]:block' : 'block'}`}
          style={{ fontWeight: 500, letterSpacing: '0.24em' }}
        >
          Simone Ciacchi
        </span>
      )}
    </span>
  );
}
