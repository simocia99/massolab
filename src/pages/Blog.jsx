import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, Clock, Rss, Tag } from 'lucide-react';
import BlogSidebar from '@/components/content/BlogSidebar';
import { collectTags, formatPostDate, postUrl, usePublishedPosts } from '@/components/content/blogData';

export default function Blog() {
  const { data: posts = [], isLoading, isError, refetch } = usePublishedPosts();
  const [params, setParams] = useSearchParams();
  const activeTag = params.get('tag');

  useEffect(() => {
    const prev = document.title;
    document.title = 'Blog & Consigli — MassoLab';
    return () => {
      document.title = prev;
    };
  }, []);

  const setActiveTag = (tag) => setParams(tag ? { tag } : {}, { replace: true });
  const allTags = collectTags(posts);
  const visible = activeTag ? posts.filter((p) => (p.tags || []).includes(activeTag)) : posts;

  const pill = (active) =>
    `px-4 min-h-[44px] inline-flex items-center rounded-full text-sm font-semibold transition-all ${
      active ? 'bg-red-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-red-300'
    }`;

  return (
    <div className="pt-20 min-h-screen bg-[#F3F0EA]">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
          <div className="flex items-center gap-3 mb-3">
            <Rss className="w-6 h-6 text-red-500" />
            <span className="text-xs font-bold tracking-widest uppercase text-red-500">Blog &amp; Consigli</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">Benessere &amp; Salute</h1>
          <p className="text-gray-500 text-lg max-w-xl">
            Articoli informativi su massoterapia, postura, recupero e stile di vita sano.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button type="button" onClick={() => setActiveTag(null)} className={pill(!activeTag)} aria-pressed={!activeTag}>
              Tutti
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                aria-pressed={activeTag === tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={pill(activeTag === tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-10">
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="grid gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl h-52 animate-pulse" />
                ))}
              </div>
            ) : isError ? (
              <div className="text-center py-20 text-gray-500">
                <p className="font-medium mb-3">Impossibile caricare gli articoli.</p>
                <button type="button" onClick={() => refetch()} className="text-red-600 font-semibold hover:underline">
                  Riprova
                </button>
              </div>
            ) : visible.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <Rss className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="font-medium">Nessun articolo trovato.</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {visible.map((post, i) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i, 10) * 0.05 }}
                  >
                    <Link
                      to={postUrl(post)}
                      className="block bg-white rounded-2xl border border-gray-100 hover:shadow-lg transition-all overflow-hidden group"
                    >
                      <div className="flex flex-col sm:flex-row">
                        {post.cover_image && (
                          <div className="sm:w-56 flex-shrink-0 overflow-hidden">
                            <img
                              src={post.cover_image}
                              alt={post.title}
                              loading={i < 2 ? 'eager' : 'lazy'}
                              decoding="async"
                              className="w-full h-48 sm:h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        )}
                        <div className="p-5 sm:p-6 flex flex-col justify-between flex-1 min-w-0">
                          <div>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {(post.tags || []).slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="text-xs bg-red-50 text-red-600 font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
                                >
                                  <Tag className="w-3 h-3" />
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">
                              {post.title}
                            </h2>
                            {post.excerpt && <p className="text-gray-500 text-sm line-clamp-2">{post.excerpt}</p>}
                          </div>
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {formatPostDate(post.created_date)}
                              </span>
                              {post.reading_time ? (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  {post.reading_time} min
                                </span>
                              ) : null}
                            </div>
                            <span className="text-red-600 text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                              Leggi <ChevronRight className="w-4 h-4" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:w-80 flex-shrink-0">
            <BlogSidebar posts={posts} allTags={allTags} activeTag={activeTag} onTagClick={setActiveTag} />
          </div>
        </div>
      </div>
    </div>
  );
}
