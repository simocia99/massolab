import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HandHeart, RotateCcw, ShieldCheck, Target } from 'lucide-react';
import { createPageUrl } from '@/lib/utils';
import { EASE, HEADING_FONT, reveal } from './shared';

const REASONS = [
  {
    icon: Target,
    headline: 'Su misura.',
    title: 'Nessun protocollo fisso.',
    description: 'Ogni seduta è costruita sulla tua situazione specifica. Non su una lista prestabilita.',
    accent: '#E50914',
  },
  {
    icon: HandHeart,
    headline: 'Diretto.',
    title: 'La verità sul tuo problema.',
    description: 'Ti dico quante sedute ha senso fare. E quando è meglio rivolgerti altrove.',
    accent: '#FF9500',
  },
  {
    icon: RotateCcw,
    headline: 'Continuo.',
    title: 'Tracciamento seduta per seduta.',
    description: 'Tengo memoria di ogni sessione. Il trattamento evolve con te nel tempo.',
    accent: '#30D158',
  },
  {
    icon: ShieldCheck,
    headline: 'Certificato.',
    title: 'Formazione professionale.',
    description: "Aggiornato e specializzato. Lavoro solo nell'ambito delle mie competenze.",
    accent: '#0A84FF',
  },
];

/** "Perché Massolab" (original `c3`). */
export default function WhyMassolab() {
  return (
    <section className="py-28 md:py-36 bg-[#f5f5f7]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div {...reveal()} className="mb-16">
          <p className="text-xs font-bold tracking-[0.25em] uppercase text-[#E50914] mb-4">Perché Massolab</p>
          <h2 className="text-4xl md:text-6xl font-black text-[#1D1D1F] mb-4" style={{ letterSpacing: '-0.04em', ...HEADING_FONT }}>
            Progettato per
            <br />
            <span className="text-[#86868B] font-light">darti risultati.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-14">
          {REASONS.map((r, i) => {
            const Icon = r.icon;
            return (
              <motion.div
                key={r.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: EASE }}
                className="group bg-white rounded-[32px] p-8 md:p-10 hover:shadow-2xl transition-all duration-500 relative overflow-hidden"
              >
                <div
                  className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-4 blur-3xl"
                  style={{ background: r.accent, transform: 'translate(40%, -40%)' }}
                />
                <div className="flex items-center gap-4 mb-7">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${r.accent}15` }}>
                    <Icon className="w-6 h-6" style={{ color: r.accent }} />
                  </div>
                </div>
                <h3 className="text-3xl font-black text-[#1D1D1F] mb-1" style={{ letterSpacing: '-0.03em' }}>
                  {r.headline}
                </h3>
                <p className="text-base font-semibold text-[#1D1D1F]/60 mb-3">{r.title}</p>
                <p className="text-[#86868B] text-sm leading-relaxed font-light max-w-sm">{r.description}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center">
          <Link
            to={createPageUrl('GuestBooking')}
            className="inline-flex items-center gap-2 bg-[#E50914] hover:bg-[#cc0812] text-white rounded-full px-8 py-4 font-bold transition-all duration-300 hover:scale-[1.03]"
          >
            Prenota la tua prima seduta
          </Link>
        </div>
      </div>
    </section>
  );
}
