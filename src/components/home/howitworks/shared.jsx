import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { createPageUrl } from '@/lib/utils';
import { reveal } from '../shared';
import SectionLabel from '../SectionLabel';
import { STEPS, img } from './steps';

export const CONTAINER = 'max-w-6xl mx-auto px-5 sm:px-6 lg:px-8';

// Viewport heights: `vh` fallback first, `svh` where supported (Safari iOS < 15.4 has no svh).
export const STAGE_H = 'h-[100vh] supports-[height:100svh]:h-[100svh]';
// Phone: 340 (≈ 2.4 screens of scroll); desktop: 400.
export const TRACK_H =
  'h-[340vh] supports-[height:100svh]:h-[340svh] md:h-[400vh] md:supports-[height:100svh]:h-[400svh]';
// Space under the floating pill navbar.
export const STAGE_PAD = 'pt-[5.5rem] md:pt-28';

export function StepsHeader() {
  return (
    <div className={CONTAINER}>
      <SectionLabel>Come funziona</SectionLabel>
      <motion.h2
        {...reveal()}
        className="text-ink font-medium leading-[1.05] mb-10 md:mb-12"
        style={{ fontSize: 'clamp(2rem, 4.2vw, 3.25rem)', letterSpacing: '-0.03em' }}
      >
        Semplice come
        <br />
        dovrebbe essere
      </motion.h2>
    </div>
  );
}

export function StepCta() {
  return (
    <div className={`${CONTAINER} mt-10 md:mt-14`}>
      <Link
        to={createPageUrl('GuestBooking')}
        className="group inline-flex items-center gap-1.5 bg-ink text-white rounded-full pl-6 pr-4 py-3 text-sm font-medium transition-all duration-300 hover:scale-[1.02] hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-600 focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
      >
        Prenota la prima seduta
        <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
      </Link>
      <p className="text-gray-500 text-sm mt-3">Cancellazione gratuita fino a 24h prima.</p>
    </div>
  );
}

/** Plain stacked blocks: used with prefers-reduced-motion (no pinning, no transforms). */
export function StaticSteps() {
  return (
    <div className={CONTAINER}>
      <ol role="list" className="space-y-5 md:space-y-6">
        {STEPS.map((s) => (
          <li
            key={s.number}
            className="bg-white rounded-[24px] overflow-hidden grid md:grid-cols-2 md:min-h-[360px]"
          >
            <div className="relative aspect-[4/3] md:aspect-auto">
              <img
                src={img(s.image)}
                alt=""
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            <div className="p-7 md:p-12">
              <p aria-hidden="true" className="text-6xl md:text-7xl font-medium text-sage-200 leading-none mb-6 tabular-nums">
                {s.number}
              </p>
              <h3 className="text-2xl md:text-3xl font-medium text-ink mb-3" style={{ letterSpacing: '-0.03em' }}>
                {s.title}
              </h3>
              <p className="text-gray-500 leading-relaxed max-w-md">{s.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
