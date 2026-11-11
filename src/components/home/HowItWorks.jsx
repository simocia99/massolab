import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarCheck, Clipboard, MessageSquare, Zap } from 'lucide-react';
import { createPageUrl } from '@/lib/utils';
import { EASE, HEADING_FONT, reveal } from './shared';

const STEPS = [
  {
    number: '01',
    icon: CalendarCheck,
    headline: 'Prenoti.',
    title: '2 minuti. Zero burocrazia.',
    description: 'Scegli trattamento, data e orario. Conferma immediata via email.',
  },
  {
    number: '02',
    icon: MessageSquare,
    headline: 'Ti rispondo.',
    title: 'Prima che arrivi, sono già pronto.',
    description: 'Un messaggio per assicurarmi che tutto sia chiaro e rispondere a eventuali dubbi.',
  },
  {
    number: '03',
    icon: Clipboard,
    headline: 'Ascolto.',
    title: 'La diagnosi parte da qui.',
    description: 'Prima seduta: breve anamnesi. Dove senti il problema, da quando, cosa lo peggiora.',
  },
  {
    number: '04',
    icon: Zap,
    headline: 'Agiamo.',
    title: 'Risultati dalla prima seduta.',
    description: 'Si inizia. A fine seduta hai già un piano chiaro: frequenza, trattamento, obiettivo.',
  },
];

/** "Come funziona" (original `G4`). */
export default function HowItWorks() {
  return (
    <section id="come-funziona" className="py-28 md:py-36 bg-[#1D1D1F]">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <motion.div {...reveal()} className="mb-16">
          <p className="text-xs font-bold tracking-[0.25em] uppercase text-[#E50914] mb-4">Come funziona</p>
          <h2 className="text-4xl md:text-6xl font-black text-white mb-4" style={{ letterSpacing: '-0.04em', ...HEADING_FONT }}>
            Semplice come
            <br />
            <span className="text-[#86868B] font-light">dovrebbe essere.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.number}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.12, ease: EASE }}
                className="relative bg-white/5 border border-white/8 rounded-[28px] p-7 hover:bg-white/8 hover:border-white/15 transition-all duration-400 group"
              >
                <span
                  aria-hidden="true"
                  className="text-7xl font-black text-white/4 absolute top-4 right-5 leading-none select-none group-hover:text-white/6 transition-colors"
                >
                  {s.number}
                </span>
                <div className="w-11 h-11 rounded-2xl bg-[#E50914]/15 border border-[#E50914]/20 flex items-center justify-center mb-5">
                  <Icon className="w-5 h-5 text-[#E50914]" />
                </div>
                <h3 className="text-2xl font-black text-white mb-1" style={{ letterSpacing: '-0.02em' }}>
                  {s.headline}
                </h3>
                <p className="text-sm font-semibold text-white/60 mb-3">{s.title}</p>
                <p className="text-white/40 text-sm leading-relaxed font-light">{s.description}</p>
              </motion.div>
            );
          })}
        </div>

        <motion.div {...reveal(20, 0.6, 0.4, null)} className="text-center">
          <Link
            to={createPageUrl('GuestBooking')}
            className="inline-block bg-[#E50914] hover:bg-[#cc0812] text-white rounded-full px-10 py-4 text-base font-bold shadow-xl transition-all duration-300 hover:scale-[1.04]"
          >
            Prenota la prima seduta
          </Link>
          <p className="text-white/30 text-sm mt-4">Cancellazione gratuita fino a 24h prima.</p>
        </motion.div>
      </div>
    </section>
  );
}
