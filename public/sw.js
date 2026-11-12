/* MassoLab Studio — service worker (solo notifiche).
 *
 * Cosa fa:
 *   - riceve le notifiche Web Push del resoconto del mattino e le mostra;
 *   - al tocco sulla notifica apre (o porta in primo piano) l'Area Terapista.
 *
 * Cosa NON fa, di proposito:
 *   - nessun gestore "fetch": non intercetta nessuna richiesta, quindi il sito
 *     pubblico si comporta esattamente come senza service worker;
 *   - nessuna cache: nessun dato personale viene salvato sul dispositivo.
 *
 * Viene registrato solo dalle pagine del terapista (src/lib/pwa.js).
 */

const SCOPE = self.registration.scope; // es. https://simocia99.github.io/massolab/
const DEFAULT_URL = SCOPE + 'TherapistDashboard';
const ICON = SCOPE + 'images/studio-icon-192.png';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// Accetta solo indirizzi dello stesso sito e dentro l'app: mai link esterni.
function safeUrl(raw) {
  try {
    const url = new URL(raw || DEFAULT_URL, SCOPE);
    return url.origin === self.location.origin && url.href.startsWith(SCOPE) ? url.href : DEFAULT_URL;
  } catch (e) {
    return DEFAULT_URL;
  }
}

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {};
  }
  const title = typeof data.title === 'string' && data.title ? data.title.slice(0, 80) : 'MassoLab Studio';
  // iOS revoca il permesso se una push non mostra una notifica: la mostriamo SEMPRE.
  const options = {
    body: typeof data.body === 'string' ? data.body.slice(0, 240) : 'Apri l’app per il resoconto di oggi.',
    icon: ICON,
    badge: ICON,
    tag: typeof data.tag === 'string' ? data.tag.slice(0, 40) : 'resoconto',
    renotify: true,
    lang: 'it',
    data: { url: safeUrl(data.url) },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = safeUrl(event.notification.data && event.notification.data.url);
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const win of wins) {
        if (win.url.startsWith(SCOPE) && 'focus' in win) {
          return win.focus().then((w) => (w && 'navigate' in w && w.url !== target ? w.navigate(target) : w));
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
