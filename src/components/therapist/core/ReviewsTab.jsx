import { useEffect, useState } from 'react';
import { Check, Star, X } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/api/client';
import { Spinner } from './shared';

const REVIEW_STATUS = {
  pending: { label: 'In attesa', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Approvata', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rifiutata', color: 'bg-danger-soft text-danger' },
};

const FILTERS = [
  { key: 'all', label: 'Tutte' },
  { key: 'pending', label: 'In attesa' },
  { key: 'approved', label: 'Approvate' },
  { key: 'rejected', label: 'Rifiutate' },
];

function Stars({ rating }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} stelle su 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`w-4 h-4 ${n <= rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`} />
      ))}
    </div>
  );
}

export default function ReviewsTab() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;
    db.entities.Review.list('-created_date', 200)
      .then((rows) => !cancelled && setReviews(rows))
      .catch(() => !cancelled && toast.error('Impossibile caricare le recensioni'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const setStatus = async (id, status) => {
    try {
      await db.entities.Review.update(id, { status });
      setReviews((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch (e) {
      toast.error(e.message || 'Aggiornamento non riuscito');
    }
  };

  if (loading) return <Spinner />;

  const visible = filter === 'all' ? reviews : reviews.filter((r) => r.status === filter);
  const count = (key) => (key === 'all' ? reviews.length : reviews.filter((r) => r.status === key).length);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Recensioni</h2>
        <p className="text-gray-500 mt-1">Modera le recensioni dei tuoi clienti prima della pubblicazione.</p>
      </div>
      <div className="flex gap-2 flex-wrap mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${filter === f.key ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            {f.label}
            <span className={`text-xs rounded-full px-2 py-0.5 ${filter === f.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {count(f.key)}
            </span>
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <div className="text-center py-16 text-gray-500">Nessuna recensione trovata.</div>
      ) : (
        <div className="space-y-4">
          {visible.map((r) => {
            const st = REVIEW_STATUS[r.status] || REVIEW_STATUS.pending;
            return (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="font-bold text-gray-900">{r.client_name}</span>
                      <Stars rating={r.rating} />
                      {r.treatment_type && (
                        <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-3 py-1">{r.treatment_type}</span>
                      )}
                      <span className={`text-xs rounded-full px-3 py-1 font-medium ${st.color}`}>{st.label}</span>
                    </div>
                    {r.text && <p className="text-gray-600 text-sm leading-relaxed">{r.text}</p>}
                    <p className="text-xs text-gray-500 mt-3">
                      {new Date(r.created_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {r.status !== 'approved' && (
                      <button
                        onClick={() => setStatus(r.id, 'approved')}
                        className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors"
                      >
                        <Check className="w-4 h-4" /> Approva
                      </button>
                    )}
                    {r.status !== 'rejected' && (
                      <button
                        onClick={() => setStatus(r.id, 'rejected')}
                        className="flex items-center gap-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl px-4 py-2 text-sm font-medium transition-colors"
                      >
                        <X className="w-4 h-4" /> Rifiuta
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
