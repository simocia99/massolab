import { Link } from 'react-router-dom';
import { Calendar, Clock, Tag } from 'lucide-react';
import { createPageUrl } from '@/lib/utils';
import { formatPostDate, postUrl } from './blogData';

const TREATMENTS = ['Massaggio Rilassante', 'Linfodrenaggio', 'Massaggio Sportivo', 'Kinesiotaping', 'Coppettazione'];

/** Blog sidebar: booking CTA, tag cloud, recent posts, treatments (bundle `Bw`). */
export default function BlogSidebar({ posts = [], allTags = [], activeTag = null, onTagClick }) {
  const recent = posts.slice(0, 4);
  return (
    <div className="space-y-6 lg:sticky lg:top-24">
      <div className="bg-red-600 rounded-2xl p-6 text-white text-center">
        <div className="text-3xl mb-3" aria-hidden="true">💆</div>
        <h3 className="font-bold text-lg mb-2">Prenota una Sessione</h3>
        <p className="text-red-100 text-sm mb-5">
          Scopri i benefici del massaggio professionale. Prima sessione senza impegno.
        </p>
        <Link
          to={createPageUrl('GuestBooking')}
          className="block bg-white text-red-600 font-bold text-sm px-5 py-3 rounded-xl hover:bg-red-50 transition-colors"
        >
          Prenota Ora →
        </Link>
        <p className="text-white/90 text-xs mt-3">Risposta entro 24 ore</p>
      </div>

      {allTags.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Tag className="w-4 h-4 text-red-500" />
            Argomenti
          </h4>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => {
              const className = `px-3 min-h-[44px] inline-flex items-center rounded-full text-sm font-medium transition-all ${
                activeTag === tag ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-700'
              }`;
              // On the post page there is no filter: tags link back to the filtered blog list.
              return onTagClick ? (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={activeTag === tag}
                  onClick={() => onTagClick(activeTag === tag ? null : tag)}
                  className={className}
                >
                  {tag}
                </button>
              ) : (
                <Link key={tag} to={`${createPageUrl('Blog')}?tag=${encodeURIComponent(tag)}`} className={className}>
                  {tag}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {recent.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-500" />
            Articoli Recenti
          </h4>
          <div className="space-y-4">
            {recent.map((post) => (
              <Link key={post.id} to={postUrl(post)} className="flex gap-3 group">
                {post.cover_image ? (
                  <img
                    src={post.cover_image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="w-14 h-14 object-cover rounded-xl flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 bg-red-50 rounded-xl flex-shrink-0 flex items-center justify-center">
                    <span className="text-xl" aria-hidden="true">📄</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-red-600 transition-colors line-clamp-2">
                    {post.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatPostDate(post.created_date, { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gray-900 rounded-2xl p-6 text-white">
        <h4 className="font-bold mb-3">I Nostri Trattamenti</h4>
        <ul className="text-gray-300 text-sm space-y-1.5">
          {TREATMENTS.map((t) => (
            <li key={t} className="flex items-center gap-2">
              <span className="w-1 h-1 bg-red-500 rounded-full" />
              {t}
            </li>
          ))}
        </ul>
        <Link
          to={createPageUrl('GuestBooking')}
          className="mt-2 block py-3 text-center text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
        >
          Scopri tutti i trattamenti →
        </Link>
      </div>
    </div>
  );
}
