import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { db } from '@/api/client';
import PercorsoCard, { PACKAGE_PRICING_KEYS, PACKAGES } from '@/components/content/PercorsoCard';

const STEPS = [
  {
    step: '01',
    title: 'Scegli il percorso',
    desc: 'Seleziona il pacchetto più adatto al tuo obiettivo. Ogni percorso è progettato con una frequenza e una durata specifiche.',
  },
  {
    step: '02',
    title: 'Prenota la prima seduta',
    desc: "Accedi all'area clienti e prenota direttamente. Il pagamento avviene direttamente con Simone, nessuna transazione online.",
  },
  {
    step: '03',
    title: 'Segui il percorso',
    desc: "Ricevi suggerimenti per la seduta successiva e monitora il tuo avanzamento dall'area clienti. Ogni seduta scalerà automaticamente dal pacchetto.",
  },
];

export default function Percorsi() {
  const { data: pricing = {} } = useQuery({
    queryKey: ['pricingSettings', 'package'],
    queryFn: async () => {
      const rows = await db.entities.PricingSettings.filter({ item_type: 'package' });
      return Object.fromEntries(rows.map((r) => [r.item_key, r]));
    },
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    const prev = document.title;
    document.title = 'Percorsi di trattamento — MassoLab';
    return () => {
      document.title = prev;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F3F0EA]">
      <section className="bg-white py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ ease: [0.28, 0.11, 0.32, 1], duration: 0.6 }}>
            <span className="inline-block bg-red-50 text-red-600 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
              Percorsi di trattamento
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight leading-tight">
              Un percorso costruito
              <br className="hidden md:block" /> attorno a te
            </h1>
            <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
              I risultati duraturi si ottengono con continuità. Ogni percorso è pensato per creare un cambiamento reale,
              seduta dopo seduta.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {STEPS.map((s) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <span className="text-4xl font-black text-gray-100 block mb-3">{s.step}</span>
                <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 pb-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Scegli il tuo percorso</h2>
            <p className="text-gray-500">Ogni pacchetto include sedute da utilizzare con flessibilità, in accordo con Simone.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 max-w-3xl mx-auto">
            {PACKAGES.map((pkg, i) => (
              <PercorsoCard key={pkg.id} pkg={pkg} index={i} pricingRecord={pricing[PACKAGE_PRICING_KEYS[pkg.id]]} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-12 px-4 sm:px-6 border-t border-gray-100">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-gray-500 text-sm leading-relaxed">
            <strong className="text-gray-700">Nessun acquisto online.</strong> I percorsi si prenotano e si accordano
            direttamente con Simone. Il pagamento avviene in studio o tramite accordo diretto. I pacchetti non hanno
            scadenza fissa — si utilizzano nei tempi che meglio si adattano al tuo ritmo.
          </p>
        </div>
      </section>
    </div>
  );
}
