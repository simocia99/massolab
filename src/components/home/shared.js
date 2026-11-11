// Shared animation presets for the Home sections.
export const EASE = [0.25, 0.46, 0.45, 0.94];

/** Fade-up on first scroll into view. */
export const reveal = (y = 30, duration = 0.7, delay = 0, ease = EASE) => ({
  initial: { opacity: 0, y },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration, delay, ...(ease ? { ease } : {}) },
});

export const HEADING_FONT = { fontFamily: 'Inter, -apple-system, sans-serif' };
