import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs) => twMerge(clsx(inputs));

const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

/** Router path for a page: pageUrl('BlogPost') -> "/BlogPost" (use with <Link>/navigate). */
export const createPageUrl = (name) => '/' + name.replace(/ /g, '-');

/** Absolute href including the deploy base path (use with window.location / emails). */
export const pageUrl = (name) => BASE + createPageUrl(name);

/** Full public URL of a page, e.g. for links inside emails or QR codes. */
export const absolutePageUrl = (name) => window.location.origin + pageUrl(name);

export const formatDateIT = (d, opts = { day: 'numeric', month: 'long', year: 'numeric' }) => {
  if (!d) return '';
  const date = typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(d + 'T12:00:00') : new Date(d);
  return isNaN(date) ? '' : date.toLocaleDateString('it-IT', opts);
};

/** Escape user input before inserting it into HTML emails. */
export const escapeHtml = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Local YYYY-MM-DD (avoids the UTC shift of toISOString()). */
export const toISODate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
