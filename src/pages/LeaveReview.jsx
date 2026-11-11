import { useEffect, useState } from 'react';
import { useHoneypot } from '@/lib/honeypot';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, CircleCheck, LoaderCircle, Star } from 'lucide-react';
import { db } from '@/api/client';
import { createPageUrl } from '@/lib/utils';

const RATING_LABELS = ['', 'Pessimo', 'Scarso', 'Nella media', 'Buono', 'Eccellente'];

export default function LeaveReview() {
  const hp = useHoneypot();
  const [params] = useSearchParams();
  // Links: (a) from an appointment: ?id=<appointmentId>&token=<access_token> (also appointment_id / appointmentId);
  // (b) from the CRM review request: ?email=&name= (no appointment, only the name is prefilled).
  const appointmentId = params.get('id') || params.get('appointment_id') || params.get('appointmentId') || '';
  const token = params.get('token') || '';

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(!!(appointmentId && token));
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState('');
  const [name, setName] = useState(params.get('name') || '');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!appointmentId || !token) return undefined;
    let cancelled = false;
    db.functions
      .invoke('appointment_by_token', { p_id: appointmentId, p_token: token })
      .then((res) => {
        const appt = Array.isArray(res) ? res[0] : res;
        if (cancelled || !appt) return;
        setAppointment(appt);
        setName((n) => n || appt.first_name || '');
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [appointmentId, token]);

  const submit = async (e) => {
    e.preventDefault();
    if (rating === 0 || !name.trim() || submitting) return;
    if (hp.isBot()) {
      setDone(true); // finto successo
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await db.entities.Review.create({
        appointment_id: appointment?.id || null,
        client_name: name.trim(),
        client_email: appointment?.email || params.get('email') || '',
        rating,
        treatment_type: appointment?.treatment_type || '',
        text: text.trim(),
        status: 'pending',
      });
      db.integrations.Core.SendNotification({
        type: 'review_submitted',
        data: { client_name: name.trim().slice(0, 120), rating, treatment_type: appointment?.treatment_type || '' },
      }).catch((err) => console.warn('Notifica email non inviata:', err));
      setDone(true);
    } catch {
      setError('Invio non riuscito. Controlla la connessione e riprova.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f5f5f7] to-white flex items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CircleCheck className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Grazie per la tua recensione!</h2>
          <p className="text-gray-500 mb-8">La tua recensione è stata inviata e sarà pubblicata dopo la moderazione.</p>
          <Link
            to={createPageUrl('Home')}
            className="inline-block bg-gray-900 text-white rounded-xl px-8 py-3 font-semibold hover:bg-gray-800 transition-colors"
          >
            Torna alla Home
          </Link>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoaderCircle className="w-8 h-8 animate-spin text-red-600" aria-label="Caricamento" />
      </div>
    );
  }

  const shown = hover || rating;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f5f7] to-white px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-lg mx-auto">
        <Link
          to={createPageUrl('Home')}
          className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-6 sm:mb-8 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Home
        </Link>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">Lascia una Recensione</h1>
        <p className="text-gray-500 mb-10">
          {appointment?.treatment_type
            ? `Racconta la tua esperienza con il trattamento ${appointment.treatment_type}.`
            : 'Racconta la tua esperienza con MassoLab.'}
        </p>

        <form
          onSubmit={submit}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-8 space-y-6"
          style={{ borderLeft: '4px solid #dc2626' }}
        >
          {hp.field}
          <div>
            <label htmlFor="review-name" className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Il tuo nome *
            </label>
            <input
              id="review-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mario Rossi"
              maxLength={80}
              autoComplete="name"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 transition-colors disabled:bg-gray-50 disabled:text-gray-500"
              required
            />
          </div>

          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Valutazione *</span>
            <div className="flex gap-1 sm:gap-2" role="radiogroup" aria-label="Valutazione">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} ${n === 1 ? 'stella' : 'stelle'} — ${RATING_LABELS[n]}`}
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  className="transition-transform hover:scale-110 active:scale-95 p-1 touch-manipulation"
                >
                  <Star
                    className={`w-9 h-9 sm:w-10 sm:h-10 transition-colors ${
                      n <= shown ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200 fill-gray-200'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && <p className="text-sm text-gray-500 mt-2">{RATING_LABELS[rating]}</p>}
          </div>

          <div>
            <label htmlFor="review-text" className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              La tua esperienza
            </label>
            <textarea
              id="review-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Descrivi la tua esperienza con il trattamento..."
              rows={4}
              maxLength={2000}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 transition-colors resize-none"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={rating === 0 || !name.trim() || submitting}
            className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl py-4 font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[52px] touch-manipulation"
          >
            {submitting ? <LoaderCircle className="w-5 h-5 animate-spin" /> : 'Invia Recensione'}
          </button>
        </form>
      </div>
    </div>
  );
}
