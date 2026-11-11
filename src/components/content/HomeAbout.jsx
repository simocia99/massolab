// Home "Chi sono" (Estetica v2): two photos with floating stat cards and a
// centred text column, as in the reference layout. Stats are the real ones.
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { createPageUrl } from '@/lib/utils';
import { reveal } from '@/components/home/shared';
import SectionLabel from '@/components/home/SectionLabel';

const img = (name) => `${import.meta.env.BASE_URL}images/${name}`;

function StatCard({ value, label, className = '' }) {
  return (
    <div
      className={`absolute bg-white rounded-[20px] px-4 py-3 sm:px-5 sm:py-3.5 shadow-[0_10px_40px_-12px_rgba(25,26,23,0.22)] ${className}`}
    >
      <p className="text-2xl md:text-[1.7rem] font-medium text-ink leading-none" style={{ letterSpacing: '-0.03em' }}>
        {value}
      </p>
      <p className="text-xs text-gray-500 mt-1.5">{label}</p>
    </div>
  );
}

export default function HomeAbout() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const leftY = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const rightY = useTransform(scrollYProgress, [0, 1], [-30, 30]);

  return (
    <section id="chi-sono" ref={ref} className="scroll-mt-24 py-24 md:py-32 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
        <SectionLabel>Chi sono</SectionLabel>

        <div className="grid grid-cols-2 lg:grid-cols-12 gap-x-4 sm:gap-x-6 gap-y-12 lg:gap-8 items-start">
          <motion.h2
            {...reveal()}
            className="col-span-2 lg:col-span-5 text-ink font-medium leading-[1.05]"
            style={{ fontSize: 'clamp(2rem, 4.2vw, 3.25rem)', letterSpacing: '-0.03em' }}
          >
            Non improvvisa.
            <br />
            <span className="text-gray-500">Studia, poi lavora su di te.</span>
          </motion.h2>
          <div className="hidden lg:block lg:col-span-7" />

          {/* Left photo */}
          <motion.div {...reveal(40, 1, 0.05)} className="col-span-1 lg:col-span-4 relative lg:mt-10 order-2 lg:order-none">
            <motion.div style={{ y: leftY }} className="relative pt-10">
              <div className="rounded-[24px] overflow-hidden aspect-[4/5] bg-sand">
                <img
                  src={img('49cd576e2.jpg')}
                  alt="Trattamento manuale sulla gamba"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.04]"
                />
              </div>
              <StatCard value="8+" label="Specializzazioni" className="top-0 left-6" />
            </motion.div>
          </motion.div>

          {/* Text */}
          <motion.div
            {...reveal(32, 1, 0.12)}
            className="col-span-2 lg:col-span-4 lg:self-center order-1 lg:order-none lg:px-4"
          >
            <p className="text-lg md:text-xl leading-snug" style={{ letterSpacing: '-0.01em' }}>
              <span className="text-ink">
                Sono Simone Ciacchi. Lavoro con chi ha dolori muscolari cronici, tensioni da stress o vuole recuperare il
                benessere fisico.{' '}
              </span>
              <span className="text-gray-500">
                Non esiste un protocollo standard: prima ascolto, poi valuto, poi agiamo. Tecniche classiche e metodologie
                recenti, con un solo obiettivo — risultati concreti, non solo un&apos;ora di relax.
              </span>
            </p>
            <Link
              to={createPageUrl('GuestBooking')}
              className="group mt-8 inline-flex items-center gap-1.5 bg-lime text-ink rounded-full pl-6 pr-4 py-3 text-sm font-medium transition-all duration-300 hover:scale-[1.02] hover:bg-lime-400"
            >
              Prenota una seduta
              <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </motion.div>

          {/* Right photo */}
          <motion.div {...reveal(40, 1, 0.2)} className="col-span-1 lg:col-span-4 relative mt-16 lg:-mt-24 order-3 lg:order-none">
            <motion.div style={{ y: rightY }} className="relative">
              <div className="rounded-[24px] overflow-hidden aspect-[4/5] bg-sand">
                <img
                  src={img('5e4fb85e2.jpg')}
                  alt="Massaggio alla schiena in un ambiente luminoso"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.04]"
                />
              </div>
              <StatCard value="100%" label="A domicilio" className="-top-6 -left-2 lg:-left-10 hidden sm:block" />
              <StatCard value="6/7" label="Giorni a settimana" className="bottom-4 right-4" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
