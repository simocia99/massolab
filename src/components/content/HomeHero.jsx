// Home hero (Estetica v2, docs/agent-notes/design.md): photo in a rounded frame,
// giant word revealed letter by letter, frame that settles back on scroll.
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ChevronRight, MessageCircle } from 'lucide-react';
import { BUSINESS, whatsappUrl } from '@/api/config';
import { createPageUrl } from '@/lib/utils';

const EASE = [0.28, 0.11, 0.32, 1];
const WORD = 'Benessere';
const HERO_IMG = `${import.meta.env.BASE_URL}images/hero.jpg`;

const fade = (delay, reduce) => ({
  initial: reduce ? { opacity: 0 } : { opacity: 0, y: 24, filter: 'blur(8px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: reduce ? 0.2 : 1, delay: reduce ? 0 : delay, ease: EASE },
});

export default function HomeHero() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const frameScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 0.92]);
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '12%']);
  const wordY = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '-40%']);
  const wordOpacity = useTransform(scrollYProgress, [0, 0.6], [1, reduce ? 1 : 0]);

  return (
    <section ref={ref} className="overflow-hidden relative bg-white px-2 sm:px-4 pt-2 sm:pt-4">
      <motion.div
        style={{ scale: frameScale }}
        className="relative h-[calc(100svh-1rem)] sm:h-[calc(100svh-2rem)] min-h-[620px] max-h-[980px] rounded-[24px] sm:rounded-[32px] overflow-hidden bg-[#A9B8B0] origin-top will-change-transform"
      >
        <motion.div style={{ y: imgY }} className="absolute inset-0">
          <motion.img
            src={HERO_IMG}
            alt="Mani del massoterapista sulla schiena durante un massaggio"
            fetchpriority="high"
            decoding="async"
            initial={reduce ? false : { scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.6, ease: EASE }}
            className="w-full h-full object-cover object-[60%_40%]"
          />
        </motion.div>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, rgba(25,26,23,.35) 0%, rgba(25,26,23,.15) 35%, rgba(25,26,23,.72) 100%)',
          }}
        />

        {/* Giant word (decorative: the real heading is the h1 below). */}
        <motion.div
          aria-hidden="true"
          style={{ y: wordY, opacity: wordOpacity }}
          className="absolute inset-x-0 top-24 sm:top-28 flex justify-center select-none pointer-events-none"
        >
          <span
            className="flex text-white font-medium leading-[0.9] whitespace-nowrap"
            style={{ fontSize: 'clamp(3.6rem, 16.5vw, 15rem)', letterSpacing: '-0.05em' }}
          >
            {WORD.split('').map((ch, i) => (
              <span key={i} className="inline-block overflow-hidden pb-[0.08em]">
                <motion.span
                  className="inline-block"
                  initial={reduce ? { opacity: 0 } : { y: '105%' }}
                  animate={reduce ? { opacity: 1 } : { y: '0%' }}
                  transition={{ duration: reduce ? 0.2 : 0.9, delay: reduce ? 0 : 0.15 + i * 0.045, ease: EASE }}
                >
                  {ch}
                </motion.span>
              </span>
            ))}
          </span>
        </motion.div>

        <div className="absolute inset-x-0 bottom-16 sm:bottom-20 px-5 sm:px-10 lg:px-14">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-end">
            <div>
              <motion.p
                {...fade(0.55, reduce)}
                className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/10 backdrop-blur-md px-3 py-1 text-xs text-white/90 mb-4"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-lime" />
                Massaggio a domicilio · {BUSINESS.city}
              </motion.p>
              <motion.h1
                {...fade(0.65, reduce)}
                className="text-white font-medium leading-[1.02]"
                style={{ fontSize: 'clamp(2.4rem, 5.2vw, 4.25rem)', letterSpacing: '-0.035em' }}
              >
                Il massaggio
                <br />
                che viene da te
              </motion.h1>
            </div>
            <motion.div {...fade(0.8, reduce)} className="md:justify-self-end md:text-right max-w-sm">
              <p className="text-white/90 text-[15px] leading-relaxed mb-6">
                Massoterapia professionale a casa tua, entro {BUSINESS.radiusKm} km da {BUSINESS.city}. Prima ascolto, poi
                valuto, poi lavoriamo: ogni seduta è costruita su di te.
              </p>
              <div className="flex flex-wrap items-center gap-3 md:justify-end">
                <Link
                  to={createPageUrl('GuestBooking')}
                  className="group inline-flex items-center gap-1.5 bg-white text-ink rounded-full pl-6 pr-4 min-h-[44px] text-sm font-medium transition-all duration-300 hover:scale-[1.02] hover:bg-lime"
                >
                  Prenota ora
                  <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </Link>
                <a
                  href={whatsappUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 backdrop-blur-md text-white px-5 min-h-[44px] text-sm font-medium transition-all duration-300 hover:bg-white/20"
                >
                  <MessageCircle className="w-4 h-4" />
                  Scrivimi
                </a>
              </div>
            </motion.div>
          </div>
        </div>

        <motion.div
          {...fade(1, reduce)}
          className="absolute inset-x-0 bottom-0 border-t border-white/30 px-5 sm:px-10 lg:px-14 h-12 flex items-center justify-between text-xs font-medium uppercase tracking-[0.08em] text-white/90"
        >
          <span>A domicilio · entro {BUSINESS.radiusKm} km</span>
          <span>6 giorni su 7</span>
        </motion.div>
      </motion.div>
    </section>
  );
}
