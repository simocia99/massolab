import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, Rss, Tag } from 'lucide-react';
import { db } from '@/api/client';
import { createPageUrl, formatDateIT } from '@/lib/utils';

/** Latest 3 published blog posts (original `T3`). Hidden when there are none. */
export default function BlogTeaser() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    db.entities.BlogPost.filter({ status: 'published' }, '-created_date', 3)
      .then((rows) => alive && setPosts(rows || []))
      .catch(() => alive && setPosts([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  if (!loading && posts.length === 0) return null;

  return (
    <section className="overflow-hidden py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Rss className="w-4 h-4 text-red-500" />
              <span className="text-xs font-medium tracking-[0.08em] uppercase text-gray-500">Dal Blog</span>
            </div>
            <h2 className="text-4xl md:text-[3.25rem] font-medium leading-[1.05] text-gray-900">Notizie &amp; Consigli</h2>
            <p className="text-gray-500 mt-2 text-lg">Articoli sul benessere, massoterapia e stile di vita sano.</p>
          </div>
          <Link
            to={createPageUrl('Blog')}
            className="hidden sm:flex items-center gap-2 min-h-[44px] text-red-600 font-semibold hover:gap-3 transition-all text-sm"
          >
            Tutti gli articoli <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl h-72 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  to={`${createPageUrl('BlogPost')}?slug=${encodeURIComponent(post.slug || post.id)}`}
                  className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 h-full"
                >
                  <div className="overflow-hidden h-48 bg-gradient-to-br from-red-50 to-orange-50">
                    {post.cover_image ? (
                      <img
                        src={post.cover_image}
                        alt={post.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-5xl opacity-30" aria-hidden="true">
                          📄
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    {(post.tags || []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {post.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs bg-red-50 text-red-600 font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
                          >
                            <Tag className="w-2.5 h-2.5" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-red-600 transition-colors line-clamp-2 leading-snug">
                      {post.title}
                    </h3>
                    {post.excerpt && <p className="text-gray-500 text-sm line-clamp-2 mb-4">{post.excerpt}</p>}
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{formatDateIT(post.created_date)}</span>
                        {post.reading_time && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {post.reading_time} min
                          </span>
                        )}
                      </div>
                      <span className="text-red-600 text-xs font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                        Leggi <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        <div className="sm:hidden mt-8 text-center">
          <Link to={createPageUrl('Blog')} className="inline-flex items-center gap-2 min-h-[44px] text-red-600 font-semibold text-sm">
            Tutti gli articoli <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
