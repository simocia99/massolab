import { useRef } from 'react';
import { motion, useScroll, useTransform, cubicBezier } from 'framer-motion';
import { EASE } from '../shared';
import { STEPS, img } from './steps';
import { CONTAINER, STAGE_H, STAGE_PAD, TRACK_H } from './shared';

/**
 * "Come funziona": pinned section (Apple style).
 * It stays still while the page scrolls: photo and text change with fade, blur and scale,
 * the big number slides vertically, a thin line shows the progress.
 *
 * Timing: each step owns 1/N of the scroll. Around every boundary there is a short
 * transition (T); the rest of the step (~70%) is a calm "hold" where nothing moves.
 * Inside a transition the outgoing text is gone before the incoming one appears
 * (small empty gap), while the photos are allowed to cross-dissolve.
 */
const N = STEPS.length;
const T = 0.07; // transition width around each boundary, as a share of the whole pinned scroll
const H = T / 2;
const TEXT_PART = 0.45; // text out / text in each use 45% of T (10% gap between them)
const ease = cubicBezier(...EASE);

/**
 * Value for step `i` as a function of scroll progress: enter -> mid (while active) -> exit.
 * kind "text": exits first, enters after (never both visible). kind "cross": spans the whole T.
 */
function useStep(progress, i, enter, mid, exit, kind = 'text') {
  const start = i / N;
  const end = (i + 1) / N;
  const text = kind === 'text';
  const input = [];
  const output = [];
  if (i > 0) {
    input.push(text ? start + H - TEXT_PART * T : start - H, start + H);
    output.push(enter, mid);
  } else {
    input.push(0);
    output.push(mid);
  }
  if (i < N - 1) {
    input.push(end - H, text ? end - H + TEXT_PART * T : end + H);
    output.push(mid, exit);
  } else {
    input.push(1);
    output.push(mid);
  }
  return useTransform(progress, input, output, { ease });
}

function Photo({ step, i, p }) {
  // The outgoing photo stays opaque underneath so the card never shows a white dip.
  const opacity = useStep(p, i, 0, 1, 1, 'cross');
  const scale = useStep(p, i, 1.08, 1, 1, 'cross');
  const filter = useStep(p, i, 'blur(8px)', 'blur(0px)', 'blur(0px)', 'cross');
  return (
    <motion.img
      src={img(step.image)}
      alt=""
      decoding="async"
      loading="lazy"
      className="absolute inset-0 w-full h-full object-cover"
      style={{ opacity, scale, filter }}
    />
  );
}

function Copy({ step, i, p }) {
  const opacity = useStep(p, i, 0, 1, 0);
  const y = useStep(p, i, 24, 0, -16);
  const scale = useStep(p, i, 0.98, 1, 1.01);
  const filter = useStep(p, i, 'blur(6px)', 'blur(0px)', 'blur(6px)');
  return (
    <motion.li className="[grid-area:1/1]" style={{ opacity, y, scale, filter }}>
      <h3 className="text-xl sm:text-2xl md:text-3xl font-medium text-ink mb-3" style={{ letterSpacing: '-0.03em' }}>
        {step.title}
      </h3>
      <p className="text-gray-500 leading-relaxed max-w-md">{step.description}</p>
    </motion.li>
  );
}

function Tick({ step, i, p }) {
  const opacity = useStep(p, i, 0.45, 1, 0.45, 'cross');
  return (
    <motion.span style={{ opacity }} className="text-xs font-medium uppercase tracking-[0.06em] text-ink">
      {step.tab}
    </motion.span>
  );
}

// Big number: a column 01..04 that slides up in the middle of each transition (crisp holds).
const NUM_IN = [0];
const NUM_OUT = ['0%'];
for (let k = 1; k < N; k += 1) {
  NUM_IN.push(k / N - 0.22 * T, k / N + 0.22 * T);
  NUM_OUT.push(`${-(k - 1) * (100 / N)}%`, `${-k * (100 / N)}%`);
}
NUM_IN.push(1);
NUM_OUT.push(`${-(N - 1) * (100 / N)}%`);

export default function PinnedSteps() {
  const track = useRef(null);
  const { scrollYProgress: p } = useScroll({ target: track, offset: ['start start', 'end end'] });
  const numberY = useTransform(p, NUM_IN, NUM_OUT, { ease });

  return (
    <div ref={track} className={`relative ${TRACK_H}`}>
      <div className={`sticky top-0 ${STAGE_H} ${STAGE_PAD} pb-[6.5rem] md:pb-8`}>
        <div className={`${CONTAINER} h-full`}>
          <div className="relative isolate h-full bg-white rounded-[24px] overflow-hidden grid grid-rows-[minmax(0,40%)_minmax(0,1fr)] md:grid-rows-1 md:grid-cols-2">
            <div className="relative overflow-hidden">
              {STEPS.map((s, i) => (
                <Photo key={s.number} step={s} i={i} p={p} />
              ))}
            </div>

            <div className="p-6 sm:p-8 md:p-12 flex flex-col justify-between min-h-0">
              <div>
                {/* Decorative: the number is announced by the ordered list below. */}
                <div
                  aria-hidden="true"
                  className="h-[1em] overflow-hidden text-6xl md:text-8xl leading-none font-medium text-sage-200 tabular-nums mb-4 md:mb-8"
                >
                  <motion.div style={{ y: numberY }}>
                    {STEPS.map((s) => (
                      <div key={s.number} className="h-[1em] leading-none">
                        {s.number}
                      </div>
                    ))}
                  </motion.div>
                </div>
                <ol role="list" className="grid">
                  {STEPS.map((s, i) => (
                    <Copy key={s.number} step={s} i={i} p={p} />
                  ))}
                </ol>
              </div>

              <div aria-hidden="true">
                <div className="relative h-[2px] bg-ink/10 overflow-hidden rounded-full">
                  <motion.div className="absolute inset-0 bg-ink origin-left" style={{ scaleX: p }} />
                </div>
                <div className="hidden sm:flex justify-between mt-3">
                  {STEPS.map((s, i) => (
                    <Tick key={s.number} step={s} i={i} p={p} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
