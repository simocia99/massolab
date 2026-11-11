// Treatment detail modal opened from the home treatment cards (bundle `z4`).
// Props: { treatmentKey (key of TREATMENTS), onClose }.
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, CircleAlert, CircleCheckBig, CircleHelp, Clock, Euro, X } from 'lucide-react';
import { createPageUrl } from '@/lib/utils';
import { TREATMENTS } from '@/data/treatments';
import { FaqItem, TreatmentReviewsCompact } from './TreatmentBits';

export default function TreatmentDetailModal({ treatmentKey, onClose }) {
  const treatment = TREATMENTS[treatmentKey];
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!treatment) return undefined;
    const prevOverflow = document.body.style.overflow;
    const prevFocus = document.activeElement;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e) => {
      if (e.key === 'Escape') onCloseRef.current?.();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
      prevFocus?.focus?.({ preventScroll: true });
    };
  }, [treatment]);

  if (!treatment) return null;
  const bookUrl = `${createPageUrl('GuestBooking')}?treatment=${encodeURIComponent(treatment.slug)}`;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="treatment-modal-title"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 10 }}
        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-[#f5f5f7] rounded-[28px] w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
      >
        <div className="relative flex-shrink-0 h-44 sm:h-52 overflow-hidden rounded-t-[28px]">
          <img src={treatment.hero_img} alt={treatment.titolo} decoding="async" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10" />
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="absolute top-3 right-3 z-30 w-9 h-9 rounded-full bg-white/80 backdrop-blur-md text-gray-700 hover:bg-white flex items-center justify-center transition-colors touch-manipulation"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="relative z-10 h-full flex flex-col justify-end p-6">
            <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-red-300 mb-2">{treatment.tag}</span>
            <h2
              id="treatment-modal-title"
              className="text-2xl sm:text-3xl font-black text-white leading-tight"
              style={{ letterSpacing: '-0.03em' }}
            >
              {treatment.titolo}
            </h2>
            <p className="text-sm text-gray-200 mt-1 max-w-xl leading-snug">{treatment.sottotitolo}</p>
          </div>
        </div>

        <div className="overflow-y-auto overscroll-contain flex-1">
          <div className="flex flex-wrap gap-2 px-4 sm:px-6 pt-5">
            <span className="inline-flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm">
              <Clock className="w-3.5 h-3.5 text-red-500" />
              {treatment.durata}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm">
              <Euro className="w-3.5 h-3.5 text-red-500" />
              {treatment.prezzo}
            </span>
          </div>

          <div className="px-4 sm:px-6 py-6 space-y-5">
            <div className="bg-white rounded-2xl p-5">
              <h3 className="text-base font-bold text-gray-900 mb-3">Per chi è indicato</h3>
              <ul className="space-y-2.5">
                {treatment.per_chi.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CircleCheckBig className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-5">
                <h3 className="text-base font-bold text-gray-900 mb-3">Problemi tipici</h3>
                <ul className="space-y-2">
                  {treatment.problemi.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0 mt-2" />
                      <span className="text-gray-700 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-2xl p-5">
                <h3 className="text-base font-bold text-gray-900 mb-3">Benefici attesi</h3>
                <ul className="space-y-2">
                  {treatment.benefici.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0 mt-2" />
                      <span className="text-gray-700 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5">
              <h3 className="text-base font-bold text-gray-900 mb-2">Come si svolge la seduta</h3>
              <p className="text-gray-700 text-sm leading-relaxed">{treatment.come_si_svolge}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-green-800 mb-3">✓ Quando prenotare</h3>
                <ul className="space-y-2">
                  {treatment.quando_prenotare.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CircleCheckBig className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-green-900 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-amber-50 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-amber-800 mb-3">⚠ Quando chiedere prima info</h3>
                <ul className="space-y-2">
                  {treatment.quando_chiedere_info.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CircleAlert className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span className="text-amber-900 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <CircleHelp className="w-4 h-4 text-red-500" />
                <h3 className="text-base font-bold text-gray-900">Domande frequenti</h3>
              </div>
              <div>
                {treatment.faq.map((f) => (
                  <FaqItem key={f.q} q={f.q} a={f.a} />
                ))}
              </div>
            </div>

            <TreatmentReviewsCompact treatmentType={treatment.slug} />

            <div className="bg-gray-900 rounded-2xl p-6 text-center">
              <h3 className="text-lg font-extrabold text-white mb-1">Pronto a prenotare?</h3>
              <p className="text-gray-400 text-xs mb-4">Scegli data e orario direttamente online.</p>
              <Link
                to={bookUrl}
                onClick={onClose}
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl px-7 py-3.5 text-sm transition-all touch-manipulation"
              >
                <Calendar className="w-4 h-4" /> Prenota {treatment.titolo}
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
