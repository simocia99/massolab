// MassoLab Studio — iscrizione alle notifiche Web Push (resoconto del mattino).
//
// - Chiave PUBBLICA VAPID: variabile VITE_VAPID_PUBLIC_KEY (GitHub → Variables).
//   La chiave privata NON è mai nel sito: sta solo nei secrets di Supabase.
// - L'iscrizione del dispositivo viene salvata in public.push_subscription
//   (RLS: solo l'admin vede e gestisce le proprie righe).
// - iPhone/iPad: le notifiche funzionano solo dall'app aggiunta alla schermata Home
//   (iOS 16.4+), e il permesso va chiesto con un tocco (gesto dell'utente).

import { supabase } from '@/api/supabaseClient';
import { IS_DEMO } from '@/api/config';
import { isIOS, isStandalone, registerStudioServiceWorker, serviceWorkerSupported } from '@/lib/pwa';

export const VAPID_PUBLIC_KEY = (import.meta.env.VITE_VAPID_PUBLIC_KEY || '').trim();
const TABLE = 'push_subscription';

/**
 * Stati possibili del pulsante:
 *  demo           sito in modalità DEMO (nessun server: niente notifiche)
 *  unconfigured   manca la chiave pubblica VAPID (script non ancora lanciato)
 *  needs-install  iPhone/iPad da Safari: prima "Aggiungi alla schermata Home"
 *  unsupported    browser senza Web Push
 *  denied         permesso negato nelle impostazioni del dispositivo
 *  inactive       si possono attivare
 *  active         attive su questo dispositivo
 */
export async function getPushState() {
  if (IS_DEMO) return 'demo';
  if (!VAPID_PUBLIC_KEY) return 'unconfigured';
  if (isIOS() && !isStandalone()) return 'needs-install';
  if (!pushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  const sub = await currentSubscription();
  return sub && Notification.permission === 'granted' ? 'active' : 'inactive';
}

export function pushSupported() {
  return (
    serviceWorkerSupported() &&
    typeof window !== 'undefined' &&
    'PushManager' in window &&
    'Notification' in window
  );
}

async function currentSubscription() {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration(import.meta.env.BASE_URL);
  return reg ? reg.pushManager.getSubscription() : null;
}

function base64UrlToBytes(b64url) {
  const pad = '='.repeat((4 - (b64url.length % 4)) % 4);
  const raw = atob((b64url + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function sameKey(a, b) {
  if (!a || !b) return false;
  const x = new Uint8Array(a);
  return x.length === b.length && x.every((v, i) => v === b[i]);
}

function deviceLabel() {
  const ua = navigator.userAgent || '';
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'iPad';
  if (/Android/.test(ua)) return 'Android';
  if (/Macintosh|Mac OS X/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'Windows';
  return 'Dispositivo';
}

async function saveSubscription(sub) {
  const json = sub.toJSON();
  const row = {
    endpoint: json.endpoint,
    p256dh: json.keys?.p256dh,
    auth: json.keys?.auth,
    device_label: deviceLabel(),
    user_agent: (navigator.userAgent || '').slice(0, 300),
    last_seen_at: new Date().toISOString(),
  };
  if (!row.endpoint || !row.p256dh || !row.auth) throw new Error('Iscrizione non valida');
  const { error } = await supabase.from(TABLE).upsert(row, { onConflict: 'endpoint' });
  if (error) throw new Error('Impossibile salvare l’iscrizione alle notifiche.');
}

/**
 * Attiva le notifiche su questo dispositivo. Va chiamata da un click/tocco.
 * Restituisce il nuovo stato.
 */
export async function enablePush() {
  const state = await getPushState();
  if (['demo', 'unconfigured', 'needs-install', 'unsupported'].includes(state)) return state;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'inactive';

  const reg = await registerStudioServiceWorker();
  const key = base64UrlToBytes(VAPID_PUBLIC_KEY);
  let sub = await reg.pushManager.getSubscription();
  // Chiave cambiata (script rilanciato): la vecchia iscrizione non vale più.
  if (sub && !sameKey(sub.options?.applicationServerKey, key)) {
    await removeRow(sub.endpoint);
    await sub.unsubscribe().catch(() => {});
    sub = null;
  }
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
  await saveSubscription(sub);
  return 'active';
}

async function removeRow(endpoint) {
  if (!supabase || !endpoint) return;
  await supabase.from(TABLE).delete().eq('endpoint', endpoint);
}

/** Disattiva le notifiche su questo dispositivo (gli altri restano attivi). */
export async function disablePush() {
  const sub = await currentSubscription();
  if (sub) {
    await removeRow(sub.endpoint);
    await sub.unsubscribe().catch(() => {});
  }
  return getPushState();
}

/**
 * All'apertura della dashboard: se questo dispositivo è iscritto, riallinea la riga
 * nel database (utile se è stata cancellata o se il browser ha rinnovato l'iscrizione).
 */
export async function syncPushSubscription() {
  if (IS_DEMO || !VAPID_PUBLIC_KEY || !pushSupported()) return;
  if (Notification.permission !== 'granted') return;
  const sub = await currentSubscription();
  if (sub && sameKey(sub.options?.applicationServerKey, base64UrlToBytes(VAPID_PUBLIC_KEY))) {
    await saveSubscription(sub).catch(() => {});
  }
}

/** Chiede alla funzione daily-report una notifica di prova verso i propri dispositivi. */
export async function sendTestPush() {
  if (IS_DEMO) throw new Error('Non disponibile in modalità demo.');
  const { data, error } = await supabase.functions.invoke('daily-report', { body: { mode: 'test' } });
  if (error) throw new Error('Invio di prova non riuscito.');
  return data; // { sent, failed, removed }
}
