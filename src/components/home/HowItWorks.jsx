import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { createPageUrl } from '@/lib/utils';
import { EASE, reveal } from './shared';
import SectionLabel from './SectionLabel';

const img = (name) => `${import.meta.env.BASE_URL}images/${name}`;

const STEPS = [
  {
    number: '01',
    tab: 'Prenoti',
    title: '2 minuti. Zero burocrazia.',
    description: 'Scegli trattamento, data e orario. Ricevi subito la conferma della richiesta via email.',
    image: '1bb1e47da.jpg',
  },
  {
    number: '02',
    tab: 'Ti rispondo',
    title: 'Prima che arrivi, sono già pronto.',
    description: 'Un messaggio per assicurarmi che tutto sia chiaro e rispondere a eventuali dubbi.',
    image: '7df950c0e.jpg',
  },
  {
    number: '03',
    tab: 'Ascolto',
    title: 'La valutazione parte da qui.',
    description: 'Prima seduta: breve anamnesi. Dove senti il problema, da quando, cosa lo peggiora.',
    image: '1ff2b3f9b.jpg',
  },
  {
    number: '04',
    tab: 'Agiamo',
    title: 'Un piano chiaro dalla prima seduta.',
    description: 'Si inizia. A fine seduta sai già frequenza, trattamento e obiettivo.',
    image: 'df9d70f1d.jpg',
  },
];

/** "Come funziona" (Estetica v2): numbered pill tabs that swap the card below. */
export default function HowItWorks() {
  const [active, setActive] = useState(0);
  const step = STEPS[active];

  const onKey = (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = (active + (e.key === 'ArrowRight' ? 1 : STEPS.length - 1)) % STEPS.length;
    setActive(next);
    document.getElementById(`step-tab-${next}`)?.focus();
  };

  return (
    <section id="come-funziona" className="scroll-mt-24 py-24 md:py-32 bg-sand">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
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

        <motion.div
          {...reveal(24, 1, 0.1)}
          role="tablist"
          aria-label="Passaggi"
          onKeyDown={onKey}
          className="grid grid-cols-2 md:grid-cols-4 gap-1 bg-white rounded-[28px] md:rounded-full p-1 mb-6"
        >
          {STEPS.map((s, i) => {
            const on = i === active;
            return (
              <button
                key={s.number}
                id={`step-tab-${i}`}
                type="button"
                role="tab"
                aria-selected={on}
                aria-controls="step-panel"
                tabIndex={on ? 0 : -1}
                onClick={() => setActive(i)}
                className={`relative flex items-center justify-between rounded-full px-5 py-3.5 text-xs font-medium uppercase tracking-[0.06em] transition-colors duration-300 ${
                  on ? 'text-white' : 'text-gray-500 hover:text-ink'
                }`}
              >
                {on && (
                  <motion.span
                    layoutId="step-pill"
                    className="absolute inset-0 rounded-full bg-ink"
                    transition={{ duration: 0.5, ease: EASE }}
                  />
                )}
                <span className="relative">{s.tab}</span>
                <span className="relative tabular-nums">{s.number}</span>
              </button>
            );
          })}
        </motion.div>

        <div
          id="step-panel"
          role="tabpanel"
          aria-labelledby={`step-tab-${active}`}
          className="relative bg-white rounded-[24px] overflow-hidden grid md:grid-cols-2 min-h-[420px]"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={step.number}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: EASE }}
              className="relative aspect-[4/3] md:aspect-auto md:min-h-[420px]"
            >
              <img
                src={img(step.image)}
                alt=""
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </motion.div>
          </AnimatePresence>
          <div className="p-7 md:p-12 flex flex-col justify-between gap-10">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                <p className="text-6xl md:text-7xl font-medium text-sage-200 leading-none mb-6 tabular-nums">
                  {step.number}
                </p>
                <h3 className="text-2xl md:text-3xl font-medium text-ink mb-3" style={{ letterSpacing: '-0.03em' }}>
                  {step.title}
                </h3>
                <p className="text-gray-500 leading-relaxed max-w-md">{step.description}</p>
              </motion.div>
            </AnimatePresence>
            <div>
              <Link
                to={createPageUrl('GuestBooking')}
                className="group inline-flex items-center gap-1.5 bg-ink text-white rounded-full pl-6 pr-4 py-3 text-sm font-medium transition-all duration-300 hover:scale-[1.02] hover:bg-gray-800"
              >
                Prenota la prima seduta
                <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
              <p className="text-gray-500 text-sm mt-3">Cancellazione gratuita fino a 24h prima.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
