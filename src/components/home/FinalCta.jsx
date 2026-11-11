import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, MessageCircle } from 'lucide-react';
import { createPageUrl } from '@/lib/utils';
import { whatsappUrl } from '@/api/config';
import { reveal } from './shared';

/** Final call-to-action (Estetica v2): deep sage frame, lime button. */
export default function FinalCta() {
  return (
    <section className="bg-white px-2 sm:px-4 py-2 sm:py-4">
      <div className="relative overflow-hidden rounded-[24px] sm:rounded-[32px] bg-sage-600 py-24 md:py-32">
        <div
          aria-hidden="true"
          className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[900px] max-w-[140%] h-[420px] rounded-full blur-[110px] opacity-40"
          style={{ background: '#C98B4E' }}
        />
        <motion.div {...reveal(40)} className="relative max-w-3xl mx-auto px-6 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-white/90 mb-6">Inizia ora</p>
          <h2
            className="text-white font-medium leading-[1.02] mb-6"
            style={{ fontSize: 'clamp(2.6rem, 6vw, 4.75rem)', letterSpacing: '-0.035em' }}
          >
            Prenota in 2 minuti.
          </h2>
          <p className="text-lg text-white/85 mb-10 max-w-lg mx-auto leading-relaxed">
            Scegli il trattamento, la data, l&apos;orario. Confermo io, arrivo io, penso io al resto.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={createPageUrl('GuestBooking')}
              className="group inline-flex items-center gap-1.5 bg-lime text-ink rounded-full pl-7 pr-5 py-3.5 text-[15px] font-medium transition-all duration-300 hover:scale-[1.02] hover:bg-lime-400"
            >
              Prenota ora
              <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-white/35 bg-white/10 text-white rounded-full px-7 py-3.5 text-[15px] font-medium transition-all duration-300 hover:bg-white/20"
            >
              <MessageCircle className="w-4 h-4" />
              Scrivimi su WhatsApp
            </a>
          </div>
          <p className="text-sm text-white/75 mt-8">Cancellazione gratuita fino a 24h prima</p>
        </motion.div>
      </div>
    </section>
  );
}
