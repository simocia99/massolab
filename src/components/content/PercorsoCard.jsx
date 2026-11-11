// Treatment path packages shown on the Percorsi page (bundle `Lte`, `Rte`, `zte`).
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, CircleCheckBig, Clock, Droplets, Euro, MessageCircle, Sparkles, Star } from 'lucide-react';
import { whatsappUrl } from '@/api/config';
import { createPageUrl } from '@/lib/utils';

/** Package id -> PricingSettings.item_key (bundle `Lte`). */
export const PACKAGE_PRICING_KEYS = {
  'benessere-3': 'percorso-benessere-3',
  mantenimento: 'percorso-mantenimento-8',
};

/** Bundle `Rte`. */
export const PACKAGES = [
  {
    id: 'benessere-3',
    name: 'Percorso Benessere',
    subtitle: '3 sedute',
    sessions: 3,
    treatment: 'Massaggio Tradizionale/Rilassante',
    icon: Sparkles,
    gradient: 'from-red-500 to-orange-400',
    description:
      'Ideale per iniziare o per chi vuole concedersi un momento di cura con continuità. Tre sedute progettate per sciogliere tensioni accumulate e ritrovare equilibrio psicofisico.',
    benefits: ['Riduzione delle tensioni muscolari', 'Miglioramento del sonno e del benessere', 'Ripristino del tono muscolare'],
    recommended_frequency: 'Una volta a settimana',
    ideal_for: 'Chi vuole iniziare un percorso o prendersi cura di sé con regolarità',
    badge: null,
  },
  {
    id: 'mantenimento',
    name: 'Percorso Mantenimento',
    subtitle: '8 sedute',
    sessions: 8,
    treatment: 'Massaggio Tradizionale/Rilassante',
    icon: Droplets,
    gradient: 'from-blue-500 to-cyan-400',
    description:
      "Il programma completo per chi vuole fare del benessere una costante. Otto sedute da pianificare con libertà nell'arco di due o tre mesi, per mantenere i risultati nel tempo.",
    benefits: [
      'Benefici duraturi e progressivi',
      'Adattamento del trattamento nel tempo',
      'Prevenzione delle tensioni ricorrenti',
      'Priorità di prenotazione garantita',
    ],
    recommended_frequency: 'Una volta ogni 1-2 settimane',
    ideal_for: 'Chi ha già sperimentato i benefici del massaggio e vuole mantenerli nel tempo',
    badge: 'Miglior valore',
  },
];

export default function PercorsoCard({ pkg, index, pricingRecord: price }) {
  const Icon = pkg.icon;
  const showPrice = price?.visible && price.price != null && price.price !== '' && Number(price.price) !== 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group"
    >
      {pkg.badge && (
        <div className="absolute top-5 right-5 z-10">
          <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <Star className="w-3 h-3" />
            {pkg.badge}
          </span>
        </div>
      )}
      <div className={`bg-gradient-to-br ${pkg.gradient} p-6 sm:p-8 pb-10`}>
        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-5">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-1">{pkg.name}</h3>
        <p className="text-white/80 font-medium">{pkg.subtitle}</p>
        <div className="flex flex-wrap gap-2 mt-5" aria-hidden="true">
          {Array.from({ length: pkg.sessions }, (_, i) => (
            <div key={i} className="w-4 h-4 rounded-full bg-white/40 border-2 border-white/70" />
          ))}
        </div>
        <p className="text-white/70 text-xs mt-2">{pkg.sessions} sedute incluse</p>
        {showPrice && (
          <div className="mt-4 bg-white/20 rounded-2xl px-4 py-2.5 inline-flex items-center gap-2">
            <Euro className="w-4 h-4 text-white" />
            <span className="text-white font-bold text-lg">€{price.price}</span>
            {price.price_note && <span className="text-white/70 text-xs">{price.price_note}</span>}
          </div>
        )}
      </div>

      <div className="p-6 sm:p-8 flex flex-col flex-1">
        <p className="text-gray-600 text-sm leading-relaxed mb-6">{pkg.description}</p>
        <div className="space-y-2.5 mb-6">
          {pkg.benefits.map((b) => (
            <div key={b} className="flex items-start gap-2.5">
              <CircleCheckBig className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700">{b}</span>
            </div>
          ))}
        </div>
        <div className="bg-gray-50 rounded-2xl p-4 mb-6 space-y-2">
          {price?.visible && price?.duration_minutes ? (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              <span>
                Durata seduta: <strong className="text-gray-700">{price.duration_minutes} min</strong>
              </span>
            </div>
          ) : null}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="w-3.5 h-3.5" />
            <span>
              Frequenza consigliata: <strong className="text-gray-700">{pkg.recommended_frequency}</strong>
            </span>
          </div>
          <div className="flex items-start gap-2 text-xs text-gray-500">
            <Star className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>
              Ideale per: <strong className="text-gray-700">{pkg.ideal_for}</strong>
            </span>
          </div>
        </div>
        <div className="mt-auto space-y-3">
          <Link
            to={createPageUrl('ClientLogin')}
            className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r ${pkg.gradient} text-white font-semibold rounded-2xl py-3.5 text-sm hover:opacity-90 transition-opacity`}
          >
            <Calendar className="w-4 h-4" />
            Prenota questo percorso
          </Link>
          <a
            href={whatsappUrl(`Ciao Simone, vorrei informazioni sul percorso ${pkg.name}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-2xl py-3 text-sm transition-colors border border-gray-100"
          >
            <MessageCircle className="w-4 h-4 text-green-500" />
            Chiedi informazioni
          </a>
        </div>
      </div>
    </motion.div>
  );
}
