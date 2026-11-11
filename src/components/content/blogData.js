import { useQuery } from '@tanstack/react-query';
import { db } from '@/api/client';
import { createPageUrl } from '@/lib/utils';

/** Published blog posts, newest first (shared cache between Blog and BlogPost). */
export function usePublishedPosts() {
  return useQuery({
    queryKey: ['blogPosts', 'published'],
    queryFn: () => db.entities.BlogPost.filter({ status: 'published' }, '-created_date', 50),
    staleTime: 5 * 60_000,
  });
}

export const postUrl = (post) => `${createPageUrl('BlogPost')}?slug=${encodeURIComponent(post.slug || post.id)}`;

export const formatPostDate = (d, opts = { day: 'numeric', month: 'long', year: 'numeric' }) => {
  if (!d) return '';
  const date = new Date(d);
  return isNaN(date) ? '' : date.toLocaleDateString('it-IT', opts);
};

export const collectTags = (posts) => [...new Set(posts.flatMap((p) => p.tags || []))];
