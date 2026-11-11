// Confirm / cancel an appointment from the link in the email:
//   /AppointmentAction?id=<appointment id>&action=confirm|cancel&token=<access_token>
// Anonymous page: reads and updates the appointment only through the token-checked RPCs.
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, CircleCheck, CircleX, Clock, LoaderCircle, User } from 'lucide-react';
import { db } from '@/api/client';
import { createPageUrl } from '@/lib/utils';

const one = (res) => (Array.isArray(res) ? res[0] : res) || null;

function Details({ appt, compact }) {
  const fullName = [appt?.first_name, appt?.last_name].filter(Boolean).join(' ');
  const row = compact ? 'flex items-center gap-2 text-sm text-gray-700' : 'flex items-center gap-3';
  const icon = compact ? 'w-4 h-4 text-gray-400' : 'w-4 h-4 text-gray-400 flex-shrink-0';
  return (
    <>
      <div className={row}>
        <User className={icon} />
        <span className={compact ? '' : 'text-sm font-semibold text-gray-800'}>{fullName}</span>
      </div>
      <div className={row}>
        <Calendar className={icon} />
        <span className={compact ? '' : 'text-sm text-gray-700'}>{appt?.treatment_type}</span>
      </div>
      {appt?.preferred_date && (
        <div className={row}>
          <Clock className={icon} />
          <span className={compact ? '' : 'text-sm text-gray-700'}>
            {appt.preferred_date}
            {appt.preferred_time && ` alle ${appt.preferred_time}`}
          </span>
        </div>
      )}
    </>
  );
}

export default function AppointmentAction() {
  const [params] = useSearchParams();
  const id = params.get('id') || params.get('appointmentId');
  const action = params.get('action') === 'confirm' ? 'confirm' : 'cancel';
  const token = params.get('token');

  const [appt, setAppt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (!id || !token) {
      setError('Link non valido.');
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    db.functions
      .invoke('appointment_by_token', { p_id: id, p_token: token })
      .then((res) => {
        if (cancelled) return;
        const found = one(res);
        if (found) setAppt(found);
        else setError('Appuntamento non trovato.');
      })
      .catch(() => !cancelled && setError("Impossibile caricare l'appuntamento. Riprova più tardi."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id, token]);

  const respond = async (act) => {
    if (!appt || working) return;
    setWorking(true);
    setActionError('');
    let updated;
    try {
      updated = one(await db.functions.invoke('appointment_respond', { p_id: appt.id, p_token: token, p_action: act }));
    } catch {
      setWorking(false);
      setActionError('Operazione non riuscita. Riprova tra qualche istante.');
      return;
    }
    const next = {
      ...appt,
      ...(updated || {}),
      status: updated?.status || (act === 'confirm' ? appt.status : 'cancelled'),
      client_confirmed: act === 'confirm' ? true : updated?.client_confirmed,
    };
    const confirmed = act === 'confirm';
    if (next.email) {
      try {
        // Testo e destinatario li decide il server (template + controllo token/stato).
        await db.integrations.Core.SendNotification({
          type: confirmed ? 'appointment_confirmed' : 'appointment_cancelled',
          appointment_id: appt.id,
          token,
        });
      } catch {
        // The status is saved; the summary email is best effort.
      }
    }
    setAppt(next);
    setWorking(false);
    setDone(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <LoaderCircle className="w-8 h-8 animate-spin text-red-600" aria-label="Caricamento" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <CircleX className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Errore</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link to={createPageUrl('Home')} className="text-red-600 font-semibold hover:underline">
            Torna alla Home
          </Link>
        </div>
      </div>
    );
  }

  const isFinal = appt?.status === 'cancelled' || !!appt?.client_confirmed;
  if (done || isFinal) {
    const confirmed = appt?.status !== 'cancelled' && !!appt?.client_confirmed;
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-4 sm:px-6 py-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-10"
        >
          {confirmed ? (
            <CircleCheck className="w-16 h-16 text-green-500 mx-auto mb-4" />
          ) : (
            <CircleX className="w-16 h-16 text-red-400 mx-auto mb-4" />
          )}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {confirmed ? 'Presenza Confermata' : 'Appuntamento Annullato'}
          </h2>
          <p className="text-gray-500 mb-2">
            {confirmed
              ? 'Grazie! Ti aspettiamo. Hai ricevuto un riepilogo via email.'
              : "L'appuntamento è stato annullato. Puoi prenotarne uno nuovo quando vuoi."}
          </p>
          <div className="bg-gray-50 rounded-2xl p-4 text-left mt-4 mb-6 space-y-2">
            <Details appt={appt} compact />
          </div>
          <Link
            to={createPageUrl('GuestBooking')}
            className="block w-full bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl py-3 transition-colors"
          >
            Prenota un Appuntamento
          </Link>
        </motion.div>
      </div>
    );
  }

  const spinner = <LoaderCircle className="w-5 h-5 animate-spin" />;
  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-4 sm:px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8"
      >
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {action === 'confirm' ? 'Conferma il tuo Appuntamento' : 'Annulla il tuo Appuntamento'}
          </h1>
          <p className="text-gray-500 text-sm">
            {action === 'confirm'
              ? 'Clicca il pulsante per confermare la tua presenza.'
              : 'Clicca il pulsante per annullare. Puoi sempre prenotare di nuovo.'}
          </p>
        </div>
        <div className="bg-gray-50 rounded-2xl p-5 mb-6 space-y-3">
          <Details appt={appt} />
        </div>
        {actionError && (
          <p role="alert" className="text-sm text-red-600 text-center mb-4">
            {actionError}
          </p>
        )}
        <div className="space-y-3">
          {action === 'confirm' ? (
            <>
              <button
                type="button"
                onClick={() => respond('confirm')}
                disabled={working}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl py-3.5 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {working ? spinner : <CircleCheck className="w-5 h-5" />}
                Confermo la mia presenza
              </button>
              <button
                type="button"
                onClick={() => respond('cancel')}
                disabled={working}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl py-3 transition-colors text-sm disabled:opacity-50"
              >
                Annulla appuntamento
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => respond('cancel')}
                disabled={working}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl py-3.5 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {working ? spinner : <CircleX className="w-5 h-5" />}
                Annulla l'appuntamento
              </button>
              <button
                type="button"
                onClick={() => respond('confirm')}
                disabled={working}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl py-3 transition-colors text-sm disabled:opacity-50"
              >
                No, mantieni l'appuntamento
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
