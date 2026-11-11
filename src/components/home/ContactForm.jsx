import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleCheckBig, Send } from 'lucide-react';
import { db } from '@/api/client';
import { whatsappUrl } from '@/api/config';
import { createPageUrl } from '@/lib/utils';
import { useHoneypot } from '@/lib/honeypot';

const INPUT =
  'w-full bg-[#f5f5f7] rounded-2xl px-4 py-3.5 text-sm text-[#1D1D1F] placeholder-[#C7C7CC] outline-none focus:ring-2 ring-[#E50914]/30 transition-all';

/** "Scrivi a Simone" form: sends an email to the therapist. */
export default function ContactForm() {
  const hp = useHoneypot();
  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    const phone = form.phone.trim();
    if (!name || !phone) {
      setError('Inserisci nome e telefono.');
      return;
    }
    if (hp.isBot()) {
      setSent(true); // finto successo: niente invio
      return;
    }
    setSending(true);
    setError('');
    try {
      // Testo e destinatario (terapista) li decide il server.
      await db.integrations.Core.SendNotification({
        type: 'contact_request',
        data: { name: name.slice(0, 100), phone: phone.slice(0, 40), message: form.message.trim().slice(0, 2000) },
      });
      setSent(true);
    } catch {
      setError('Invio non riuscito. Riprova o scrivimi su WhatsApp.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 text-center" role="status">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-5">
          <CircleCheckBig className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-2xl font-black text-[#1D1D1F] mb-2" style={{ letterSpacing: '-0.02em' }}>
          Messaggio inviato.
        </h3>
        <p className="text-[#86868B] font-light mb-6 max-w-xs">
          Simone ti risponderà entro poche ore. Nel frattempo puoi anche prenotare direttamente online.
        </p>
        <Link
          to={createPageUrl('GuestBooking')}
          className="bg-[#E50914] hover:bg-[#cc0812] text-white rounded-full px-7 py-3 font-bold text-sm transition-all duration-300 hover:scale-[1.03]"
        >
          Prenota ora
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#E50914] mb-2">Scrivi a Simone</p>
      <h3 className="text-2xl font-black text-[#1D1D1F] mb-1" style={{ letterSpacing: '-0.03em' }}>
        Hai domande?
      </h3>
      <p className="text-[#86868B] text-sm font-light mb-7">Lascia i tuoi dati e ti rispondo entro poche ore.</p>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {hp.field}
        <div>
          <label htmlFor="contact-name" className="text-xs font-semibold text-[#1D1D1F] block mb-1.5">
            Nome e cognome *
          </label>
          <input
            id="contact-name"
            type="text"
            autoComplete="name"
            value={form.name}
            onChange={set('name')}
            placeholder="Mario Rossi"
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="contact-phone" className="text-xs font-semibold text-[#1D1D1F] block mb-1.5">
            Telefono *
          </label>
          <input
            id="contact-phone"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={set('phone')}
            placeholder="+39 333 000 0000"
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="contact-message" className="text-xs font-semibold text-[#1D1D1F] block mb-1.5">
            Di cosa hai bisogno? <span className="font-normal text-[#86868B]">(opzionale)</span>
          </label>
          <textarea
            id="contact-message"
            value={form.message}
            onChange={set('message')}
            placeholder="Es. ho un dolore alla schiena da qualche settimana..."
            rows={3}
            className={`${INPUT} resize-none`}
          />
        </div>
        {error && (
          <p className="text-red-500 text-xs font-medium" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={sending}
          className="w-full inline-flex items-center justify-center gap-2 bg-[#E50914] hover:bg-[#cc0812] disabled:opacity-60 text-white rounded-2xl px-6 py-4 font-bold transition-all duration-300 hover:scale-[1.02]"
        >
          {sending ? (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {sending ? 'Invio in corso...' : 'Invia messaggio'}
        </button>
        <p className="text-center text-xs text-[#C7C7CC] font-light">
          Oppure{' '}
          <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="text-green-500 font-semibold hover:underline">
            scrivimi su WhatsApp
          </a>{' '}
          per una risposta immediata.
        </p>
      </form>
    </>
  );
}
