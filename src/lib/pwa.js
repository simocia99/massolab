// MassoLab Studio — l'Area Terapista come app installabile (PWA).
//
// Il manifest e le meta di Apple vengono aggiunti SOLO quando è aperta una pagina
// del terapista (TherapistLogin / TherapistDashboard) e tolti quando si esce:
// così il sito pubblico resta un normale sito e non si installa come "l'app".
// Il service worker (public/sw.js) gestisce solo le notifiche: niente cache, niente
// intercettazione delle richieste.

const BASE = import.meta.env.BASE_URL; // '/massolab/' online, '/' in locale
const MARK = 'data-massolab-studio';

// Valori dell'app installata (colori e nome li rifinisce il Design).
const STUDIO_HEAD = {
  manifest: BASE + 'studio.webmanifest',
  appleTouchIcon: BASE + 'images/studio-apple-touch.png',
  themeColor: '#F3F0EA',
  title: 'MassoLab',
  statusBar: 'default', // 'default' | 'black' | 'black-translucent'
};

function addTag(tag, attrs) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  el.setAttribute(MARK, '');
  document.head.appendChild(el);
  return el;
}

/** Cambia un attributo di un tag già presente e restituisce la funzione che lo ripristina. */
function swapAttr(selector, attr, value) {
  const el = document.head.querySelector(selector);
  if (!el) return () => {};
  const prev = el.getAttribute(attr);
  el.setAttribute(attr, value);
  return () => (prev == null ? el.removeAttribute(attr) : el.setAttribute(attr, prev));
}

let mounted = 0;
let restore = null;

/**
 * Attiva manifest + meta Apple per l'app e registra il service worker.
 * Da chiamare in un useEffect delle pagine del terapista: restituisce la pulizia.
 */
export function enableStudioPwa() {
  if (typeof document === 'undefined') return () => {};
  mounted += 1;
  if (mounted === 1) {
    const undo = [
      swapAttr('link[rel="apple-touch-icon"]', 'href', STUDIO_HEAD.appleTouchIcon),
      swapAttr('meta[name="theme-color"]', 'content', STUDIO_HEAD.themeColor),
    ];
    if (!document.head.querySelector('link[rel="apple-touch-icon"]')) {
      addTag('link', { rel: 'apple-touch-icon', href: STUDIO_HEAD.appleTouchIcon });
    }
    addTag('link', { rel: 'manifest', href: STUDIO_HEAD.manifest });
    addTag('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' });
    addTag('meta', { name: 'mobile-web-app-capable', content: 'yes' });
    addTag('meta', { name: 'apple-mobile-web-app-title', content: STUDIO_HEAD.title });
    addTag('meta', { name: 'apple-mobile-web-app-status-bar-style', content: STUDIO_HEAD.statusBar });
    restore = () => {
      document.head.querySelectorAll(`[${MARK}]`).forEach((el) => el.remove());
      undo.forEach((fn) => fn());
    };
    registerStudioServiceWorker().catch(() => {});
  }
  return () => {
    mounted = Math.max(0, mounted - 1);
    if (mounted === 0 && restore) {
      restore();
      restore = null;
    }
  };
}

export const serviceWorkerSupported = () => typeof navigator !== 'undefined' && 'serviceWorker' in navigator;

/** Registra (una volta) public/sw.js con scope = BASE_URL. Restituisce la registration pronta. */
export async function registerStudioServiceWorker() {
  if (!serviceWorkerSupported()) throw new Error('Service worker non supportato');
  await navigator.serviceWorker.register(BASE + 'sw.js', { scope: BASE });
  return navigator.serviceWorker.ready;
}

/** true se la pagina è aperta come app installata (schermata Home / Dock). */
export function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.matchMedia?.('(display-mode: fullscreen)').matches ||
    window.navigator.standalone === true
  );
}

/** iPhone / iPad (anche iPad che si presenta come Mac). */
export function isIOS() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
