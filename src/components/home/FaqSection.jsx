import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';
import { whatsappUrl } from '@/api/config';
import { reveal } from './shared';

const FAQS = [
  {
    q: 'Non ho mai fatto un massaggio terapeutico. Da dove parto?',
    a: 'Dalla prenotazione. Nella prima seduta mi racconti cosa senti, dove, da quanto. Poi decidiamo insieme quale trattamento ha senso per te. Non devi sapere già cosa vuoi.',
  },
  {
    q: 'Quante sedute servono per vedere risultati?',
    a: 'Dipende dal problema. Per tensioni muscolari ligate allo stress, spesso bastano 2-3 sedute. Per dolori cronici o posturali il percorso è più lungo. Te lo dico chiaramente dopo la prima valutazione.',
  },
  {
    q: 'Il massaggio fa male?',
    a: 'Dipende dal trattamento e dalla tua soglia di tolleranza. Tecniche come il miofasciale o la coppettazione possono dare una sensazione di pressione intensa, ma mai dolore non gestibile. Comunichi sempre come stai durante la seduta.',
  },
  {
    q: 'Posso prenotare se ho un infortunio recente?',
    a: 'In alcune fasi acute è meglio aspettare. Se hai dubbi, scrivimi su WhatsApp prima di prenotare e ti dico onestamente se è il momento giusto o se è meglio aspettare.',
  },
  {
    q: 'Dove si trova lo studio?',
    a: 'Al momento non ho uno studio fisso. I trattamenti sono a domicilio: vengo direttamente da te, dove ti trovi più comodo. Portafoglio risparmiato, zero spostamenti.',
  },
  {
    q: 'Posso cancellare o spostare un appuntamento?',
    a: 'Sì, fino a 24 ore prima senza problemi. Ti chiedo solo di avvisarmi con anticipo per poter offrire lo slot ad altri clienti.',
  },
];

/** FAQ accordion (original `m3`). */
export default function FaqSection() {
  const [open, setOpen] = useState(null);

  return (
    <section id="faq" className="py-28 md:py-36 bg-white">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div {...reveal(20, 0.6, 0, null)} className="text-center mb-14">
          <h2 className="text-4xl md:text-6xl font-black text-[#1D1D1F] mb-4" style={{ letterSpacing: '-0.04em' }}>
            Hai domande?
          </h2>
          <p className="text-lg text-[#86868B] font-light">Le rispondo tutte. Qui, adesso.</p>
        </motion.div>

        <div className="space-y-3">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={item.q}
                {...reveal(20, 0.4, i * 0.06, null)}
                className="bg-[#f5f5f7] rounded-[24px] overflow-hidden hover:bg-white hover:shadow-md transition-all duration-300"
              >
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-6 text-left"
                  aria-expanded={isOpen}
                  aria-controls={`faq-${i}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span className="font-semibold text-[#1D1D1F] pr-4" style={{ letterSpacing: '-0.01em' }}>
                    {item.q}
                  </span>
                  {isOpen ? (
                    <Minus className="w-5 h-5 text-red-500 flex-shrink-0" />
                  ) : (
                    <Plus className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-${i}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-6 text-[#86868B] leading-relaxed font-light">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-500 mb-4">Hai altre domande?</p>
          <a
            href={whatsappUrl('Ciao Simone, ho una domanda')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#1D1D1F] hover:bg-black text-white rounded-full px-8 py-4 font-bold transition-all duration-300 hover:scale-[1.03]"
          >
            Scrivimi su WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
