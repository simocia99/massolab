import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, ChevronLeft, Clock, Tag } from 'lucide-react';
import { createPageUrl } from '@/lib/utils';
import BlogSidebar from '@/components/content/BlogSidebar';
import SafeContent from '@/components/content/SafeContent';
import { collectTags, formatPostDate, postUrl, usePublishedPosts } from '@/components/content/blogData';

function setMetaDescription(text) {
  let tag = document.querySelector('meta[name="description"]');
  if (!tag) {
    tag = document.createElement('meta');
    tag.name = 'description';
    document.head.appendChild(tag);
  }
  const prev = tag.content;
  tag.content = text;
  return () => {
    tag.content = prev;
  };
}

export default function BlogPost() {
  const [params] = useSearchParams();
  const slug = params.get('slug');
  const { data: posts = [], isLoading } = usePublishedPosts();
  const post = slug ? posts.find((p) => p.slug === slug || p.id === slug) : null;

  useEffect(() => {
    if (!post) return undefined;
    const prevTitle = document.title;
    document.title = `${post.title} — MassoLab Blog`;
    const restoreMeta = post.excerpt ? setMetaDescription(post.excerpt) : null;
    return () => {
      document.title = prevTitle;
      restoreMeta?.();
    };
  }, [post]);

  if (slug && isLoading) {
    return (
      <div className="pt-20 flex justify-center items-center min-h-screen">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" role="status" aria-label="Caricamento" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="pt-20 min-h-screen flex flex-col items-center justify-center text-gray-500 gap-4 px-6 text-center">
        <p className="text-lg font-medium">Articolo non trovato.</p>
        <Link to={createPageUrl('Blog')} className="text-red-600 font-semibold hover:underline">
          ← Torna al Blog
        </Link>
      </div>
    );
  }

  const allTags = collectTags(posts);
  const postTags = post.tags || [];
  const related = posts
    .filter((p) => p.id !== post.id && (p.tags || []).some((t) => postTags.includes(t)))
    .slice(0, 3);

  return (
    <div className="pt-20 min-h-screen bg-[#F3F0EA]">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
          <Link
            to={createPageUrl('Blog')}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 mb-6 transition-colors font-medium"
          >
            <ChevronLeft className="w-4 h-4" /> Blog
          </Link>
          <div className="flex flex-wrap gap-2 mb-4">
            {postTags.map((tag) => (
              <span key={tag} className="text-xs bg-red-50 text-red-600 font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 max-w-3xl break-words">{post.title}</h1>
          {post.excerpt && <p className="text-gray-500 text-lg max-w-2xl mb-6">{post.excerpt}</p>}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {formatPostDate(post.created_date)}
            </span>
            {post.reading_time ? (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {post.reading_time} min di lettura
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {post.cover_image && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 -mb-6 relative z-10">
          <img
            src={post.cover_image}
            alt={post.title}
            decoding="async"
            className="w-full h-64 md:h-96 object-cover rounded-2xl shadow-lg"
          />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-10">
          <motion.article
            key={post.id}
            initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-100 p-5 sm:p-8 md:p-12"
          >
            <SafeContent content={post.content} className="max-w-none break-words [&>*:first-child]:mt-0" />
          </motion.article>
          <div className="lg:w-80 flex-shrink-0">
            <BlogSidebar posts={posts} allTags={allTags} />
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Articoli Correlati</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((p) => (
                <Link
                  key={p.id}
                  to={postUrl(p)}
                  className="bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-all overflow-hidden group"
                >
                  {p.cover_image && (
                    <img src={p.cover_image} alt={p.title} loading="lazy" decoding="async" className="w-full h-40 object-cover" />
                  )}
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 mb-2 group-hover:text-red-600 transition-colors line-clamp-2">{p.title}</h3>
                    <span className="text-red-600 text-sm font-semibold flex items-center gap-1">
                      Leggi <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
