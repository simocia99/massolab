import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CircleCheckBig, Droplets, Sparkles } from 'lucide-react';
import { createPageUrl } from '@/lib/utils';

const PATHS = [
  {
    sessions: 3,
    name: 'Percorso Benessere',
    icon: Sparkles,
    gradient: 'from-red-500 to-orange-400',
    tagline: 'Sciogliere tensioni e ritrovare equilibrio',
  },
  {
    sessions: 8,
    name: 'Percorso Mantenimento',
    icon: Droplets,
    gradient: 'from-blue-500 to-cyan-400',
    tagline: 'Continuità, seduta dopo seduta',
    featured: true,
  },
];

const BENEFITS = [
  'Sedute scalate automaticamente dal pacchetto',
  'Suggerimenti personalizzati per la prossima seduta',
  "Tracciamento del percorso dall'area clienti",
  'Sedute da pianificare secondo i tuoi ritmi',
];

/** "Percorsi di trattamento" teaser (original `A3`). */
export default function PercorsiTeaser() {
  return (
    <section className="overflow-hidden py-24 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true }}
          transition={{ ease: [0.28, 0.11, 0.32, 1], duration: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
        >
          <div>
            <span className="inline-flex items-center gap-2 border border-ink/10 bg-white text-gray-500 text-xs font-medium uppercase tracking-[0.08em] px-3 py-1.5 rounded-full mb-6">
              Percorsi di trattamento
            </span>
            <h2 className="text-4xl md:text-[3.25rem] font-medium leading-[1.05] text-gray-900 mb-6 tracking-tight leading-tight">
              La costanza
              <br />
              fa la differenza
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed mb-8">
              Una seduta ti fa staccare. Con più sedute posso seguirti nel tempo e adattare il lavoro a come
              rispondi, seduta dopo seduta.
            </p>
            <div className="space-y-3 mb-10">
              {BENEFITS.map((b) => (
                <div key={b} className="flex items-center gap-3">
                  <CircleCheckBig className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{b}</span>
                </div>
              ))}
            </div>
            <Link
              to={createPageUrl('Percorsi')}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-2xl px-7 py-3.5 transition-colors group"
            >
              Scopri tutti i percorsi
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4">
            {PATHS.map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.div
                  key={p.name}
                  initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
                  whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative rounded-2xl p-4 sm:p-5 flex flex-col gap-2 sm:gap-3 overflow-hidden ${
                    p.featured ? 'bg-gray-900 text-white' : 'bg-white border border-gray-100'
                  }`}
                >
                  {p.featured && (
                    <span className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      Il più completo
                    </span>
                  )}
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${p.gradient} flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${p.featured ? 'text-white' : 'text-gray-900'}`}>{p.name}</p>
                    <p className={`text-xs mt-0.5 ${p.featured ? 'text-gray-400' : 'text-gray-500'}`}>{p.sessions} sedute</p>
                  </div>
                  <p className={`text-xs leading-relaxed ${p.featured ? 'text-gray-400' : 'text-gray-500'}`}>{p.tagline}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
