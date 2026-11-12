// Small pieces shared by the Trattamento page and the treatment detail modal
// (bundle `M4`/`I4` stars, `N4`/`L4` FAQ item, `P4`/`R4` approved reviews).
import { useId, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Star } from 'lucide-react';
import { db } from '@/api/client';

export function Stars({ stars = 0 }) {
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${stars} stelle su 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`w-4 h-4 ${n <= stars ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
      ))}
    </div>
  );
}

export function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={id}
        className="w-full text-left py-4 flex items-center justify-between gap-4"
      >
        <span className="font-semibold text-gray-900 text-sm">{q}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
        )}
      </button>
      {open && (
        <p id={id} className="text-gray-600 text-sm pb-4 leading-relaxed">
          {a}
        </p>
      )}
    </div>
  );
}

/** Approved reviews for one treatment type, via the public `approved_reviews` RPC (no emails). */
export function useTreatmentReviews(treatmentType) {
  const { data = [], isLoading } = useQuery({
    queryKey: ['approvedReviews', 100],
    queryFn: () => db.functions.invoke('approved_reviews', { p_limit: 100 }),
    staleTime: 5 * 60_000,
  });
  const reviews = (Array.isArray(data) ? data : []).filter((r) => r.treatment_type === treatmentType);
  return { reviews, isLoading };
}

/** "Cosa dicono i clienti" block on the Trattamento page (bundle `P4`). */
export function TreatmentReviews({ treatmentType }) {
  const { reviews, isLoading } = useTreatmentReviews(treatmentType);
  if (isLoading || reviews.length === 0) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
      <h2 className="text-xl font-bold text-gray-900 mb-5">Cosa dicono i clienti</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {reviews.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl p-5 shadow-sm">
            <Stars stars={r.rating} />
            <p className="text-gray-700 text-sm mt-3 mb-4 leading-relaxed italic">"{r.text}"</p>
            <p className="text-xs font-bold text-gray-500">{r.client_name}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/** Compact variant used inside the treatment modal (bundle `R4`). */
export function TreatmentReviewsCompact({ treatmentType }) {
  const { reviews, isLoading } = useTreatmentReviews(treatmentType);
  if (isLoading || reviews.length === 0) return null;
  return (
    <div>
      <h3 className="text-base font-bold text-gray-900 mb-3">Cosa dicono i clienti</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {reviews.map((r) => (
          <div key={r.id} className="bg-gray-50 rounded-2xl p-4">
            <Stars stars={r.rating} />
            <p className="text-gray-700 text-xs mt-2 mb-3 leading-relaxed italic">"{r.text}"</p>
            <p className="text-xs font-bold text-gray-500">{r.client_name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
