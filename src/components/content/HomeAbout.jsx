// Home "Chi sono" section (bundle `A4`).
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { BUSINESS } from '@/api/config';
import { createPageUrl } from '@/lib/utils';

const EASE = [0.25, 0.46, 0.45, 0.94];
const HEADING_STYLE = { letterSpacing: '-0.04em', fontFamily: 'Inter, -apple-system, sans-serif' };
const STATS = [
  { value: '8+', label: 'Specializzazioni' },
  { value: '100%', label: 'A domicilio' },
  { value: '6', label: 'Giorni su 7' },
];

export default function HomeAbout() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [-30, 30]);

  return (
    <section id="chi-sono" ref={ref} className="py-28 md:py-36 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: EASE }}
            className="relative"
          >
            <div className="absolute -inset-6 bg-gradient-to-tr from-[#E50914]/10 to-orange-400/5 rounded-[40px] blur-2xl" />
            <div className="relative rounded-[36px] shadow-2xl w-full aspect-square overflow-hidden bg-white flex items-center justify-center">
              <motion.img
                style={{ y }}
                src={BUSINESS.logo}
                alt="MassoLab — Simone Ciacchi, Massoterapista"
                loading="lazy"
                decoding="async"
                className="w-[82%] h-auto object-contain"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
          >
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-[#E50914] mb-5">Chi sono</p>
            <h2 className="text-4xl md:text-5xl font-black text-[#1D1D1F] mb-3" style={HEADING_STYLE}>
              Non improvvisa.
            </h2>
            <h2 className="text-4xl md:text-5xl font-light text-[#86868B] mb-8" style={HEADING_STYLE}>
              Studia. Poi lavora su di te.
            </h2>
            <div className="space-y-5 mb-10">
              <p className="text-[#1D1D1F] text-lg leading-relaxed font-light">
                Sono Simone Ciacchi. Lavoro con chi ha dolori muscolari cronici, tensioni da stress o vuole recuperare il
                benessere fisico. Non esiste un protocollo standard — ogni seduta è costruita su di te.
              </p>
              <p className="text-[#86868B] text-base leading-relaxed font-light">
                Prima ascolto. Poi valuto. Poi agiamo. Il mio approccio combina tecniche classiche e metodologie recenti,
                con un solo obiettivo: risultati concreti, non solo un'ora di relax.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-10">
              {STATS.map((s) => (
                <div key={s.label} className="bg-[#f5f5f7] rounded-[20px] p-4 text-center">
                  <p className="text-2xl font-black text-[#1D1D1F]" style={{ letterSpacing: '-0.03em' }}>
                    {s.value}
                  </p>
                  <p className="text-xs text-[#86868B] font-medium mt-1">{s.label}</p>
                </div>
              ))}
            </div>
            <Link
              to={createPageUrl('GuestBooking')}
              className="inline-flex items-center gap-2 bg-[#E50914] hover:bg-[#cc0812] text-white rounded-full px-8 py-4 font-bold transition-all duration-300 hover:scale-[1.03]"
            >
              <Calendar className="w-4 h-4" />
              Prenota una seduta
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
