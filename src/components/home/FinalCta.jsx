import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MessageCircle } from 'lucide-react';
import { createPageUrl } from '@/lib/utils';
import { whatsappUrl } from '@/api/config';
import { HEADING_FONT, reveal } from './shared';

const HEADING_STYLE = { letterSpacing: '-0.045em', ...HEADING_FONT };

/** Final dark call-to-action (original `u3`). */
export default function FinalCta() {
  return (
    <section className="py-28 md:py-40 bg-black relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] max-w-full h-[300px] rounded-full blur-[120px] opacity-15"
        style={{ background: '#E50914' }}
      />
      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <motion.div {...reveal(40, 0.9)}>
          <p className="text-xs font-bold tracking-[0.25em] uppercase text-[#E50914] mb-6">Inizia ora</p>
          <h2 className="text-5xl md:text-7xl font-black text-white mb-4" style={HEADING_STYLE}>
            Prenota.
          </h2>
          <h2 className="text-5xl md:text-7xl font-light text-white/30 mb-8" style={HEADING_STYLE}>
            In 2 minuti.
          </h2>
          <p className="text-lg text-white/40 mb-12 max-w-lg mx-auto font-light leading-relaxed">
            Scegli il trattamento, la data, l'orario. Confermo io. Arrivo io. Penso io al resto.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={createPageUrl('GuestBooking')}
              className="inline-flex items-center gap-2 bg-[#E50914] hover:bg-[#cc0812] text-white rounded-full px-10 py-4 text-base font-bold shadow-2xl transition-all duration-300 hover:scale-[1.04]"
            >
              <Calendar className="w-5 h-5" />
              Prenota ora
            </Link>
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/8 hover:bg-white/15 border border-white/15 text-white rounded-full px-10 py-4 text-base font-medium backdrop-blur-sm transition-all duration-300 hover:scale-[1.04]"
            >
              <MessageCircle className="w-5 h-5 text-green-400" />
              Scrivimi su WhatsApp
            </a>
          </div>
          <p className="text-sm text-white/20 mt-8">Cancellazione gratuita fino a 24h prima</p>
        </motion.div>
      </div>
    </section>
  );
}
