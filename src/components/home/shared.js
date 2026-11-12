// Shared animation presets (Estetica v2: Apple-style curve, fade + rise + blur).
export const EASE = [0.28, 0.11, 0.32, 1];

/** Fade-up with a soft blur on first scroll into view. */
export const reveal = (y = 32, duration = 1, delay = 0, ease = EASE) => ({
  initial: { opacity: 0, y },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.25 },
  transition: { duration, delay, ...(ease ? { ease } : {}) },
});

export const HEADING_FONT = { fontFamily: "'Instrument Sans', -apple-system, sans-serif" };
