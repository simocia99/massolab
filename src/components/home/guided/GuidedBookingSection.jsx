import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { WandSparkles } from 'lucide-react';
import GuidedBookingWizard from './GuidedBookingWizard';

/** "Non sai quale trattamento scegliere?" teaser + wizard modal (original `o3`). */
export default function GuidedBookingSection() {
  const [open, setOpen] = useState(false);

  // Lock page scroll and close on Escape while the modal is open.
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 text-red-600 text-sm font-bold uppercase tracking-wider mb-5">
              <WandSparkles className="w-4 h-4" /> Nuovo
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              Non sai quale trattamento scegliere?
            </h2>
            <p className="text-lg text-gray-500 mb-8 max-w-xl mx-auto">
              Rispondi a 5 domande rapide sul tuo problema e ti suggerisco il trattamento più adatto — senza linguaggio
              tecnico.
            </p>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white rounded-full px-10 py-4 text-base font-bold shadow-lg hover:scale-105 transition-all duration-200"
            >
              <WandSparkles className="w-5 h-5" />
              Aiutami a scegliere
            </button>
            <p className="text-xs text-gray-400 mt-4">Nessuna diagnosi medica — solo un orientamento pratico.</p>
          </motion.div>
        </div>
      </section>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setOpen(false)}
            />
            <motion.div
              key="dialog"
              role="dialog"
              aria-modal="true"
              aria-label="Aiutami a scegliere il trattamento"
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 md:inset-4 md:max-w-lg md:w-full md:m-auto bg-white rounded-t-3xl md:rounded-2xl z-50 shadow-2xl flex flex-col"
              style={{ height: '88dvh', maxHeight: '600px' }}
            >
              <GuidedBookingWizard onClose={() => setOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
