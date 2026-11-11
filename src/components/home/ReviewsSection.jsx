import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Star } from 'lucide-react';
import { db } from '@/api/client';
import { createPageUrl } from '@/lib/utils';
import { reveal } from './shared';

function Stars({ rating }) {
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${rating} stelle su 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-4 h-4 ${n <= rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`}
        />
      ))}
    </div>
  );
}

/** "Cosa dicono i clienti" (original `f3`). */
export default function ReviewsSection() {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    let alive = true;
    // Server function returns only public fields (no reviewer email).
    db.functions
      .invoke('approved_reviews', { p_limit: 6 })
      .then((rows) => alive && setReviews(Array.isArray(rows) ? rows : []))
      .catch(() => alive && setReviews([]));
    return () => {
      alive = false;
    };
  }, []);

  const avg = reviews.length
    ? (reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviews.length).toFixed(1)
    : null;

  return (
    <section className="py-28 md:py-36 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div {...reveal(20, 0.6, 0, null)} className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-black text-[#1D1D1F] mb-4" style={{ letterSpacing: '-0.03em' }}>
            Cosa dicono i clienti
          </h2>
          {avg && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <div className="flex gap-1" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`w-6 h-6 ${n <= Math.round(avg) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`}
                  />
                ))}
              </div>
              <span className="text-2xl font-bold text-[#1D1D1F]">{avg}</span>
              <span className="text-[#86868B] text-sm">({reviews.length} recensioni)</span>
            </div>
          )}
        </motion.div>

        {reviews.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>Ancora nessuna recensione. Sii il primo!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {reviews.map((r, i) => (
              <motion.div
                key={r.id}
                {...reveal(30, 0.5, i * 0.08, null)}
                className="bg-[#f5f5f7] rounded-[28px] p-7 hover:bg-white hover:shadow-xl transition-all duration-300"
              >
                <Stars rating={r.rating} />
                {r.text && <p className="text-gray-600 text-sm leading-relaxed mt-3 mb-4">"{r.text}"</p>}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1D1D1F] text-sm">{r.client_name}</span>
                  {r.treatment_type && (
                    <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-3 py-1">{r.treatment_type}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="text-center">
          <Link
            to={createPageUrl('LeaveReview')}
            className="inline-flex items-center gap-2 bg-[#E50914] hover:bg-[#cc0812] text-white rounded-full px-8 py-4 font-bold transition-all duration-200 hover:scale-[1.02]"
          >
            <Star className="w-5 h-5" />
            Lascia la tua recensione
          </Link>
        </div>
      </div>
    </section>
  );
}
