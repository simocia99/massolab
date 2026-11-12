import { useRef, useState } from 'react';
import { motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { EASE } from '../shared';
import { STEPS, img } from './steps';
import { CONTAINER, STAGE_H, STAGE_PAD, TRACK_H } from './shared';

/**
 * "Come funziona": pinned section (Apple style).
 * It stays still while the page scrolls. The scroll position only decides WHICH step is
 * shown; the change itself is a short timed animation that always completes, so the text
 * is never left half-blurred when the visitor stops scrolling between two steps.
 * The thin progress line under the text follows the scroll continuously.
 */
const N = STEPS.length;
const T_TEXT = { duration: 0.45, ease: EASE };
const T_PHOTO = { duration: 0.8, ease: EASE };

function Photo({ step, active }) {
  return (
    <motion.img
      src={img(step.image)}
      alt=""
      decoding="async"
      loading="lazy"
      className="absolute inset-0 w-full h-full object-cover"
      initial={false}
      animate={active ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.08 }}
      transition={T_PHOTO}
    />
  );
}

function Copy({ step, state }) {
  // state: -1 = already passed, 0 = current, 1 = coming next
  const variants = {
    passed: { opacity: 0, y: -16, transition: { ...T_TEXT, duration: 0.3 } },
    current: { opacity: 1, y: 0, transition: { ...T_TEXT, delay: 0.15 } },
    next: { opacity: 0, y: 24, transition: { ...T_TEXT, duration: 0.3 } },
  };
  return (
    <motion.li
      className="[grid-area:1/1]"
      initial={false}
      variants={variants}
      animate={state === 0 ? 'current' : state < 0 ? 'passed' : 'next'}
      aria-current={state === 0 ? 'step' : undefined}
    >
      <h3 className="text-xl sm:text-2xl md:text-3xl font-medium text-ink mb-3" style={{ letterSpacing: '-0.03em' }}>
        {step.title}
      </h3>
      <p className="text-gray-500 leading-relaxed max-w-md">{step.description}</p>
    </motion.li>
  );
}

function Tick({ step, active }) {
  return (
    <motion.span
      initial={false}
      animate={{ opacity: active ? 1 : 0.45 }}
      transition={T_TEXT}
      className="text-xs font-medium uppercase tracking-[0.06em] text-ink"
    >
      {step.tab}
    </motion.span>
  );
}

export default function PinnedSteps() {
  const track = useRef(null);
  const { scrollYProgress: p } = useScroll({ target: track, offset: ['start start', 'end end'] });
  const [active, setActive] = useState(0);
  useMotionValueEvent(p, 'change', (v) => {
    const next = Math.min(N - 1, Math.max(0, Math.floor(v * N)));
    setActive((cur) => (cur === next ? cur : next));
  });

  return (
    <div ref={track} className={`relative ${TRACK_H}`}>
      <div className={`sticky top-0 ${STAGE_H} ${STAGE_PAD} pb-[6.5rem] md:pb-8`}>
        <div className={`${CONTAINER} h-full`}>
          <div className="relative isolate h-full bg-white rounded-[24px] overflow-hidden grid grid-rows-[minmax(0,40%)_minmax(0,1fr)] md:grid-rows-1 md:grid-cols-2">
            <div className="relative overflow-hidden">
              {STEPS.map((s, i) => (
                <Photo key={s.number} step={s} active={i === active} />
              ))}
            </div>

            <div className="p-6 sm:p-8 md:p-12 flex flex-col justify-between min-h-0">
              <div>
                {/* Decorative: the number is announced by the ordered list below. */}
                <div
                  aria-hidden="true"
                  className="h-[1em] overflow-hidden text-6xl md:text-8xl leading-none font-medium text-sage-200 tabular-nums mb-4 md:mb-8"
                >
                  <motion.div initial={false} animate={{ y: `${-active * (100 / N)}%` }} transition={{ duration: 0.6, ease: EASE }}>
                    {STEPS.map((s) => (
                      <div key={s.number} className="h-[1em] leading-none">
                        {s.number}
                      </div>
                    ))}
                  </motion.div>
                </div>
                <ol role="list" className="grid">
                  {STEPS.map((s, i) => (
                    <Copy key={s.number} step={s} state={Math.sign(i - active)} />
                  ))}
                </ol>
              </div>

              <div aria-hidden="true">
                <div className="relative h-[2px] bg-ink/10 overflow-hidden rounded-full">
                  <motion.div className="absolute inset-0 bg-ink origin-left" style={{ scaleX: p }} />
                </div>
                <div className="hidden sm:flex justify-between mt-3">
                  {STEPS.map((s, i) => (
                    <Tick key={s.number} step={s} active={i === active} />
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
