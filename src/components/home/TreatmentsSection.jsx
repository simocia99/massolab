import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Clock, Euro } from 'lucide-react';
import { db } from '@/api/client';
import {
  H4 as TREATMENT_CARDS,
  B4 as PRICING_KEY_BY_TITLE,
  V4 as TREATMENT_KEY_BY_TITLE,
  z4 as TreatmentDetailModal,
} from '@/xref/content';
import { EASE, HEADING_FONT, reveal } from './shared';

function SmallCard({ item, index, onOpen }) {
  const Icon = item.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: EASE }}
      whileTap={{ scale: 0.97 }}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen())}
      className="group bg-white rounded-[28px] p-6 hover:shadow-xl transition-all duration-400 cursor-pointer touch-manipulation active:bg-black/[0.02]"
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${item.accent}15` }}>
        <Icon className="w-5 h-5" style={{ color: item.accent }} />
      </div>
      <span className="text-xs font-bold tracking-widest uppercase mb-2 block" style={{ color: item.accent }}>
        {item.tag}
      </span>
      <h3 className="text-lg font-black text-[#1D1D1F] mb-1 leading-tight" style={{ letterSpacing: '-0.02em' }}>
        {item.title}
      </h3>
      <p className="text-xs font-light italic mb-3" style={{ color: item.accent }}>
        {item.headline}
      </p>
      <p className="text-[#86868B] text-xs leading-relaxed mb-4 font-light">{item.description}</p>
      <span
        className="inline-flex items-center gap-1 text-xs font-semibold group-hover:gap-2 transition-all duration-300"
        style={{ color: item.accent }}
      >
        Scopri <ArrowRight className="w-3 h-3" />
      </span>
    </motion.div>
  );
}

/** "Trattamenti" grid (original `U4`). */
export default function TreatmentsSection() {
  const [pricing, setPricing] = useState({});
  const [openKey, setOpenKey] = useState(null);

  useEffect(() => {
    let alive = true;
    db.entities.PricingSettings.filter({ item_type: 'treatment' })
      .then((rows) => {
        if (!alive) return;
        const map = {};
        rows.forEach((r) => {
          map[r.item_key] = r;
        });
        setPricing(map);
      })
      .catch(() => {}); // prices are optional decoration
    return () => {
      alive = false;
    };
  }, []);

  const featured = TREATMENT_CARDS.filter((t) => t.featured);
  const others = TREATMENT_CARDS.filter((t) => !t.featured);
  const open = (title) => setOpenKey(TREATMENT_KEY_BY_TITLE[title]);

  return (
    <section id="trattamenti" className="py-28 md:py-36 bg-[#f5f5f7]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div {...reveal()} className="mb-16">
          <p className="text-xs font-bold tracking-[0.25em] uppercase text-[#E50914] mb-4">Trattamenti</p>
          <h2
            className="text-4xl md:text-6xl font-black text-[#1D1D1F] mb-5"
            style={{ letterSpacing: '-0.04em', ...HEADING_FONT }}
          >
            Ogni muscolo
            <br />
            <span className="text-[#86868B] font-light">ha una storia.</span>
          </h2>
          <p className="text-lg text-[#86868B] max-w-xl font-light leading-relaxed">
            Otto specializzazioni. Un unico obiettivo: farti stare meglio, seduta per seduta.
          </p>
        </motion.div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featured.map((t, i) => {
              const Icon = t.icon;
              const key = PRICING_KEY_BY_TITLE[t.title];
              const price = key && pricing[key];
              return (
                <motion.div
                  key={t.title}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1, ease: EASE }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => open(t.title)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), open(t.title))}
                  className="group bg-white rounded-[32px] p-8 md:p-10 hover:shadow-2xl transition-all duration-500 cursor-pointer relative overflow-hidden touch-manipulation active:bg-black/[0.02]"
                  style={{ minHeight: 280 }}
                >
                  <div
                    className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-5 blur-3xl"
                    style={{ background: t.accent, transform: 'translate(30%, -30%)' }}
                  />
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{ background: `${t.accent}15` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: t.accent }} />
                    </div>
                    <span className="text-xs font-bold tracking-widest uppercase" style={{ color: t.accent }}>
                      {t.tag}
                    </span>
                  </div>
                  <h3
                    className="text-3xl md:text-4xl font-black text-[#1D1D1F] mb-1"
                    style={{ letterSpacing: '-0.035em' }}
                  >
                    {t.title}
                  </h3>
                  <p className="text-base font-light italic mb-4" style={{ color: t.accent }}>
                    {t.headline}
                  </p>
                  <p className="text-[#86868B] text-base leading-relaxed mb-6 max-w-sm font-light">{t.description}</p>
                  <div className="flex items-center justify-between">
                    {price && price.visible && (
                      <div className="flex items-center gap-3">
                        {price.price && (
                          <span className="flex items-center gap-1 text-sm font-bold text-[#1D1D1F]">
                            <Euro className="w-3.5 h-3.5" style={{ color: t.accent }} />
                            {price.price}
                          </span>
                        )}
                        {price.duration_minutes && (
                          <span className="flex items-center gap-1 text-xs text-[#86868B]">
                            <Clock className="w-3 h-3" />
                            {price.duration_minutes} min
                          </span>
                        )}
                      </div>
                    )}
                    <span
                      className="inline-flex items-center gap-1 text-sm font-semibold group-hover:gap-2 transition-all duration-300"
                      style={{ color: t.accent }}
                    >
                      {t.title} <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {others.slice(0, 4).map((t, i) => (
              <SmallCard key={t.title} item={t} index={i} onOpen={() => open(t.title)} />
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {others.slice(4).map((t, i) => (
              <SmallCard key={t.title} item={t} index={i} onOpen={() => open(t.title)} />
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {openKey && <TreatmentDetailModal treatmentKey={openKey} onClose={() => setOpenKey(null)} />}
      </AnimatePresence>
    </section>
  );
}
