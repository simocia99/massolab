import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, CircleAlert, CircleCheckBig, Clock, Package } from 'lucide-react';
import { db } from '@/api/client';
import { createPageUrl } from '@/lib/utils';

/** Suggested interval between sessions, per treatment (bundle `B2`). */
export const NEXT_SESSION_TIPS = {
  'Massaggio Tradizionale/Rilassante': {
    days: 7,
    tip: 'Per mantenere i benefici, ti consigliamo una seduta ogni 7-10 giorni.',
  },
  'Massaggio Sportivo': { days: 4, tip: 'Per il recupero ottimale, prenota la prossima seduta entro 4-5 giorni.' },
  'Massaggio Miofasciale': {
    days: 5,
    tip: 'Il trattamento fasciale è più efficace con continuità. Prenota entro 5-7 giorni.',
  },
  Linfodrenaggio: { days: 5, tip: 'Il drenaggio linfatico beneficia di continuità. Consigliato entro 5 giorni.' },
  'Massaggio Connettivale': {
    days: 7,
    tip: 'Per risultati progressivi, pianifica la prossima seduta entro 7 giorni.',
  },
  Kinesiotaping: { days: 4, tip: "Il taping va rinnovato ogni 4-5 giorni per mantenere l'effetto." },
  Coppettazione: {
    days: 7,
    tip: "Lascia almeno 5-7 giorni tra una seduta e l'altra per il recupero dei tessuti.",
  },
  Bendaggio: { days: 4, tip: 'Il bendaggio funzionale va rinnovato ogni 4 giorni o secondo indicazione.' },
};

function SessionDots({ total, used }) {
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${i < used ? 'bg-gray-300 border-gray-300' : 'bg-red-100 border-red-400'}`}
        >
          {i < used && <span className="text-white text-[8px] font-bold">✓</span>}
        </div>
      ))}
    </div>
  );
}

function NextSessionHint({ pkg }) {
  const tip = NEXT_SESSION_TIPS[pkg.treatment_type];
  const remaining = pkg.total_sessions - (pkg.used_sessions || 0);
  if (remaining === 0) {
    return (
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
        <CircleCheckBig className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Percorso completato!</p>
          <p className="text-xs text-blue-600 mt-1">
            Hai completato tutte le sedute del pacchetto. Parlane con Simone per proseguire.
          </p>
        </div>
      </div>
    );
  }
  if (remaining === 1) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <CircleAlert className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Ultima seduta rimasta</p>
          <p className="text-xs text-amber-700 mt-1">
            È la tua ultima seduta inclusa nel pacchetto. Prenota e parla con Simone per rinnovare il percorso.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
      <div className="flex items-start gap-3 mb-3">
        <Clock className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-red-700 leading-relaxed">
          {tip?.tip || 'Prenota la prossima seduta per continuare il tuo percorso.'}
        </p>
      </div>
      <Link
        to={`${createPageUrl('ClientArea')}?tab=book`}
        className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors"
      >
        <Calendar className="w-4 h-4" />
        Prenota la prossima seduta
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

function StatusBadge({ status, remaining }) {
  if (remaining === 0 || status === 'completed')
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">Completato</span>;
  if (remaining === 1)
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">Ultima seduta</span>;
  return <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">Attivo</span>;
}

function PackageCard({ pkg, index }) {
  const total = pkg.total_sessions || 0;
  const used = pkg.used_sessions || 0;
  const remaining = total - used;
  const pct = total ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const finished = pkg.status === 'completed' || remaining === 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`bg-white rounded-3xl border shadow-sm overflow-hidden ${finished ? 'border-gray-200 opacity-75' : 'border-gray-100'}`}
    >
      <div className={`px-6 py-5 ${finished ? 'bg-gray-50' : 'bg-gradient-to-r from-red-50 to-orange-50'}`}>
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="font-bold text-gray-900 text-base">{pkg.package_name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{pkg.treatment_type}</p>
          </div>
          <StatusBadge status={pkg.status} remaining={remaining} />
        </div>
      </div>
      <div className="px-6 py-4 border-b border-gray-50">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sedute</span>
          <span className="text-xs text-gray-600">
            <strong className={remaining > 0 ? 'text-red-600 text-sm' : 'text-gray-500'}>{remaining}</strong>
            <span className="text-gray-500"> / {total} rimanenti</span>
          </span>
        </div>
        <SessionDots total={total} used={used} />
        <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? 'bg-gray-400' : 'bg-red-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1.5">
          <span>{used} effettuate</span>
          <span>{pct}% completato</span>
        </div>
      </div>
      {!finished && (
        <div className="px-6 py-4">
          <NextSessionHint pkg={pkg} />
        </div>
      )}
      {pkg.notes && (
        <div className="px-6 pb-4">
          <p className="text-xs text-gray-500 italic">{pkg.notes}</p>
        </div>
      )}
    </motion.div>
  );
}

const byActiveThenNewest = (a, b) => {
  if (a.status === 'active' && b.status !== 'active') return -1;
  if (b.status === 'active' && a.status !== 'active') return 1;
  return new Date(b.created_date) - new Date(a.created_date);
};

/** "Pacchetti" tab (bundle `G2`). */
export default function ClientPackages({ clientEmail }) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    db.entities.TreatmentPackage.filter({ client_email: clientEmail })
      .then((rows) => alive && setPackages([...rows].sort(byActiveThenNewest)))
      .catch(() => alive && setError('Impossibile caricare i pacchetti. Riprova più tardi.'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [clientEmail]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-7 h-7 rounded-full border-2 border-red-200 border-t-red-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">I tuoi percorsi</h2>
          <p className="text-sm text-gray-500 mt-0.5">Tieni traccia delle sedute e pianifica le prossime</p>
        </div>
      </div>

      {error && <p className="text-sm text-danger bg-danger-soft rounded-xl px-4 py-2">{error}</p>}

      {packages.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <Package className="w-7 h-7 text-red-400" />
          </div>
          <h3 className="font-bold text-gray-800 mb-2">Nessun percorso attivo</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
            Non hai ancora un pacchetto di sedute. Se ti interessa, chiedi a Simone.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {packages.map((p, i) => (
            <PackageCard key={p.id} pkg={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
