// Safe renderer for BlogPost.content (HTML or Markdown written in the dashboard).
// The original used dangerouslySetInnerHTML on the raw string. Here the content
// is parsed with DOMParser (inert document: scripts never run), filtered through
// an allow-list of tags/attributes and turned into React elements — no innerHTML.
import { createElement, Fragment, useMemo } from 'react';

// Tag -> Tailwind classes (the project has no typography plugin).
const TAG_CLASSES = {
  h1: 'text-2xl md:text-3xl font-bold text-gray-900 mt-10 mb-4 leading-tight',
  h2: 'text-2xl md:text-[1.7rem] font-bold text-gray-900 mt-10 mb-4 leading-tight',
  h3: 'text-xl font-bold text-gray-900 mt-8 mb-3',
  h4: 'text-lg font-bold text-gray-900 mt-6 mb-2',
  h5: 'text-base font-bold text-gray-900 mt-6 mb-2',
  h6: 'text-sm font-bold uppercase tracking-wide text-gray-700 mt-6 mb-2',
  p: 'text-gray-600 text-base md:text-lg leading-relaxed my-5',
  ul: 'list-disc pl-6 my-5 space-y-2 text-gray-600 text-base md:text-lg leading-relaxed marker:text-red-500',
  ol: 'list-decimal pl-6 my-5 space-y-2 text-gray-600 text-base md:text-lg leading-relaxed marker:text-gray-400',
  li: 'pl-1',
  a: 'text-red-600 no-underline hover:underline break-words',
  strong: 'font-semibold text-gray-900',
  b: 'font-semibold text-gray-900',
  em: 'italic',
  i: 'italic',
  blockquote: 'border-l-4 border-red-400 pl-5 my-6 italic text-gray-500',
  img: 'rounded-xl shadow-md my-6 max-w-full h-auto',
  hr: 'my-10 border-gray-100',
  code: 'bg-gray-100 text-gray-800 rounded px-1.5 py-0.5 text-[0.9em]',
  pre: 'bg-gray-900 text-gray-100 rounded-xl p-4 my-6 overflow-x-auto text-sm',
  table: 'w-full text-sm my-6 border-collapse',
  th: 'text-left font-semibold text-gray-900 border-b border-gray-200 py-2 pr-4',
  td: 'border-b border-gray-100 py-2 pr-4 text-gray-600 align-top',
  figure: 'my-6',
  figcaption: 'text-sm text-gray-400 text-center mt-2',
};

const ALLOWED = new Set([
  ...Object.keys(TAG_CLASSES),
  'br', 'u', 's', 'del', 'sup', 'sub', 'span', 'div', 'thead', 'tbody', 'tr', 'section', 'mark', 'small',
]);
// Removed together with their content.
const DROP = new Set(['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'textarea',
  'select', 'svg', 'math', 'noscript', 'template', 'link', 'meta', 'base', 'frame', 'frameset', 'video', 'audio']);
const VOID = new Set(['br', 'hr', 'img']);

const safeUrl = (url, { image = false } = {}) => {
  const u = (url || '').trim();
  if (!u) return null;
  if (/^(https?:)?\/\//i.test(u) || /^[/#?.]/.test(u) || /^[\w-]+(\.[\w-]+)*\/?[^:]*$/.test(u)) return u;
  if (!image && /^(mailto|tel):/i.test(u)) return u;
  return null; // javascript:, data:, vbscript:, ...
};

function toReact(node, key) {
  if (node.nodeType === 3) return node.nodeValue;
  if (node.nodeType !== 1) return null;
  const tag = node.tagName.toLowerCase();
  if (DROP.has(tag)) return null;
  const children = () => Array.from(node.childNodes, (c, i) => toReact(c, i));
  if (!ALLOWED.has(tag)) return createElement(Fragment, { key }, ...children());

  // Markdown headings typed inside the rich-text editor ("<p># Titolo</p>")
  // are shown as real headings instead of a literal "#".
  if (tag === 'p' && node.childNodes.length === 1 && node.firstChild.nodeType === 3) {
    const m = /^\s*(#{1,4})\s+(.+)$/.exec(node.firstChild.nodeValue);
    if (m) {
      const h = `h${Math.min(m[1].length + 1, 4)}`;
      return createElement(h, { key, className: TAG_CLASSES[h] }, m[2]);
    }
  }

  const props = { key };
  if (TAG_CLASSES[tag]) props.className = TAG_CLASSES[tag];
  if (tag === 'a') {
    const href = safeUrl(node.getAttribute('href'));
    if (href) {
      props.href = href;
      if (/^(https?:)?\/\//i.test(href)) {
        props.target = '_blank';
        props.rel = 'noopener noreferrer nofollow';
      }
    }
  } else if (tag === 'img') {
    const src = safeUrl(node.getAttribute('src'), { image: true });
    if (!src) return null;
    Object.assign(props, { src, alt: node.getAttribute('alt') || '', loading: 'lazy', decoding: 'async' });
  } else if (tag === 'td' || tag === 'th') {
    const span = Number(node.getAttribute('colspan'));
    if (span > 1 && span < 20) props.colSpan = span;
  } else if (tag === 'ol') {
    const start = Number(node.getAttribute('start'));
    if (start > 1) props.start = start;
  }
  if (tag === 'table') {
    return createElement('div', { key, className: 'overflow-x-auto' }, createElement('table', { ...props, key: undefined }, ...children()));
  }
  return VOID.has(tag) ? createElement(tag, props) : createElement(tag, props, ...children());
}

// ---------------------------------------------------------------------------
// Tiny Markdown -> HTML (only used when the content contains no HTML tags).
// Text is HTML-escaped first, and the output still goes through the sanitizer.
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const inline = (s) =>
  esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img alt="$1" src="$2">')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*|__([^_]+)__/g, (_, a, b) => `<strong>${a || b}</strong>`)
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/(^|\W)_([^_\n]+)_(?=\W|$)/g, '$1<em>$2</em>');

export function markdownToHtml(md) {
  const lines = md.replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let para = [];
  let list = null; // { tag, items }
  const flushPara = () => {
    if (para.length) out.push(`<p>${para.map(inline).join('<br>')}</p>`);
    para = [];
  };
  const flushList = () => {
    if (list) out.push(`<${list.tag}>${list.items.map((i) => `<li>${inline(i)}</li>`).join('')}</${list.tag}>`);
    list = null;
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    let m;
    if (!line.trim()) {
      flushPara();
      flushList();
    } else if ((m = line.match(/^(#{1,6})\s+(.*)$/))) {
      flushPara();
      flushList();
      out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`);
    } else if (/^(\*\s*\*\s*\*|-\s*-\s*-)[\s*-]*$/.test(line)) {
      flushPara();
      flushList();
      out.push('<hr>');
    } else if ((m = line.match(/^\s*([-*+]|\d+[.)])\s+(.*)$/))) {
      flushPara();
      const tag = /\d/.test(m[1]) ? 'ol' : 'ul';
      if (list && list.tag !== tag) flushList();
      if (!list) list = { tag, items: [] };
      list.items.push(m[2]);
    } else if ((m = line.match(/^>\s?(.*)$/))) {
      flushPara();
      flushList();
      out.push(`<blockquote><p>${inline(m[1])}</p></blockquote>`);
    } else {
      flushList();
      para.push(line.trim());
    }
  }
  flushPara();
  flushList();
  return out.join('\n');
}

const looksLikeHtml = (s) => /<\/?[a-z][a-z0-9]*[\s>/]/i.test(s);

export default function SafeContent({ content = '', className = '' }) {
  const nodes = useMemo(() => {
    if (!content || typeof DOMParser === 'undefined') return null;
    const html = looksLikeHtml(content) ? content : markdownToHtml(content);
    const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
    return Array.from(doc.body.childNodes, (n, i) => toReact(n, i));
  }, [content]);
  return <div className={className}>{nodes}</div>;
}
