import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, MessageCircle } from 'lucide-react';
import { createPageUrl } from '@/lib/utils';
import { whatsappUrl } from '@/api/config';

const EASE = [0.28, 0.11, 0.32, 1];

/**
 * Mobile-only floating booking bar. It appears only once the hero (which has
 * its own "Prenota ora") has scrolled away, so the screen never shows three
 * booking buttons at once.
 */
export default function StickyCta() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 96, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 96, opacity: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="fixed left-3 right-3 z-30 md:hidden [@media(max-height:480px)]:hidden flex gap-2 p-1.5 rounded-full bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_-10px_rgba(25,26,23,0.25)]"
          style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          <Link
            to={createPageUrl('GuestBooking')}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-ink text-white rounded-full py-3 font-medium text-sm transition-colors active:bg-gray-800"
          >
            <Calendar className="w-4 h-4" />
            Prenota ora
          </Link>
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-lime text-ink rounded-full py-3 font-medium text-sm transition-colors active:bg-lime-400"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
