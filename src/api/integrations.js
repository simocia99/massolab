// Email sending, file upload and server-side functions.
import { IS_DEMO } from './config';
import { supabase } from './supabaseClient';
import { localFunctions } from './localFunctions';
import { seedIfEmpty } from './demoSeed';
import { toISODate } from '@/lib/utils';

const DEMO_OUTBOX = 'massolab:outbox';

function demoOutbox(entry) {
  try {
    const outbox = JSON.parse(localStorage.getItem(DEMO_OUTBOX) || '[]');
    outbox.unshift({ ...entry, sent_at: new Date().toISOString() });
    localStorage.setItem(DEMO_OUTBOX, JSON.stringify(outbox.slice(0, 100)));
  } catch {
    // outbox demo: best effort
  }
}

export const integrations = {
  Core: {
    /**
     * Send an email. { to, subject, body (HTML or text), from_name? }
     * Production: Supabase Edge Function "send-email" (Resend).
     * Demo: stored in localStorage outbox and logged to the console.
     */
    async SendEmail({ to, subject, body, from_name }) {
      // In produzione funziona SOLO per il terapista (admin): visitatori e
      // clienti usano SendNotification (testi generati dal server).
      if (IS_DEMO) {
        demoOutbox({ to, subject, body, from_name });
        console.info(`[demo] email a ${to}: ${subject}`);
        return { ok: true, demo: true };
      }
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { to, subject, body, from_name },
      });
      if (error) throw new Error("Invio email non riuscito. Riprova più tardi.");
      return data;
    },

    /**
     * Notifica con testo e destinatario decisi dal server (edge function "send-email").
     * { type, appointment_id?, token?, data? } — tipi: booking_received,
     * appointment_confirmed, appointment_cancelled, client_cancelled,
     * intake_submitted, review_submitted, contact_request, client_message.
     * Demo: finisce nell'outbox locale come SendEmail.
     */
    async SendNotification({ type, appointment_id, token, data } = {}) {
      if (!type) throw new Error('Tipo di notifica mancante');
      if (IS_DEMO) {
        demoOutbox({ type, appointment_id, data, subject: `[notifica] ${type}` });
        console.info(`[demo] notifica ${type}`);
        return { ok: true, demo: true };
      }
      const { data: res, error } = await supabase.functions.invoke('send-email', {
        body: { type, appointment_id, token, data },
      });
      if (error) throw new Error('Invio email non riuscito. Riprova più tardi.');
      return res;
    },

    /** Upload a File; resolves to { file_url }. */
    async UploadFile({ file, folder = 'uploads' }) {
      if (!file) throw new Error('Nessun file selezionato');
      if (file.size > 10 * 1024 * 1024) throw new Error('File troppo grande (max 10 MB).');
      if (IS_DEMO) {
        if (file.size > 1.5 * 1024 * 1024) throw new Error('In modalità demo i file devono essere sotto 1,5 MB.');
        const file_url = await new Promise((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(r.result);
          r.onerror = rej;
          r.readAsDataURL(file);
        });
        return { file_url };
      }
      const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
      const path = `${folder}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('uploads').upload(path, file, {
        cacheControl: '3600',
        contentType: file.type || undefined,
      });
      if (error) throw new Error('Caricamento non riuscito: ' + error.message);
      const { data } = supabase.storage.from('uploads').getPublicUrl(path);
      return { file_url: data.publicUrl };
    },

    /**
     * Upload a private document (referti, radiografie...) for a client.
     * Production: private bucket "documents", path "<client_email>/<date>/<uuid>.<ext>";
     * readable only by the therapist and that client (via CreateSignedUrl).
     * Demo: file_path is a data URL. Resolves to { file_path } — store it, never a public URL.
     */
    async UploadPrivateFile({ file, client_email }) {
      if (!file) throw new Error('Nessun file selezionato');
      const owner = (client_email || '').toLowerCase().trim();
      if (!owner) throw new Error('Cliente non specificato');
      if (file.size > 10 * 1024 * 1024) throw new Error('File troppo grande (max 10 MB).');
      if (IS_DEMO) {
        if (file.size > 1.5 * 1024 * 1024) throw new Error('In modalità demo i file devono essere sotto 1,5 MB.');
        const file_path = await new Promise((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(r.result);
          r.onerror = rej;
          r.readAsDataURL(file);
        });
        return { file_path };
      }
      const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
      const file_path = `${owner}/${toISODate()}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('documents').upload(file_path, file, {
        contentType: file.type || undefined,
      });
      if (error) throw new Error('Caricamento non riuscito: ' + error.message);
      return { file_path };
    },

    /**
     * Temporary link to open a private document. { file_path, expires_in? (seconds, default 1h) } -> { url }
     * Legacy rows holding a full http(s)/data URL are returned unchanged.
     */
    async CreateSignedUrl({ file_path, expires_in = 3600 }) {
      if (!file_path) throw new Error('File non specificato');
      if (/^(data:|https?:)/.test(file_path)) return { url: file_path };
      if (IS_DEMO) throw new Error('File non disponibile in modalità demo');
      const { data, error } = await supabase.storage.from('documents').createSignedUrl(file_path, expires_in);
      if (error || !data?.signedUrl) throw new Error('Impossibile aprire il documento.');
      return { url: data.signedUrl };
    },
  },
};

/**
 * Server-side functions for operations anonymous visitors may perform on
 * data they cannot read directly (e.g. booked time slots).
 * Production: Postgres RPC (security definer). Demo: src/api/localFunctions.js
 */
export const functions = {
  async invoke(name, payload = {}) {
    if (IS_DEMO) {
      await seedIfEmpty();
      const fn = localFunctions[name];
      if (!fn) throw new Error(`Funzione "${name}" non disponibile in demo`);
      return fn(payload);
    }
    const { data, error } = await supabase.rpc(name, payload);
    if (error) throw new Error(error.message);
    return data;
  },
};
