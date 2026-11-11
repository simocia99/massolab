// Client area "I miei appuntamenti" tab (bundle `BE`, used by the client area).
import { useState } from 'react';
import { CalendarDays, CircleAlert, CircleCheck, Clock, RefreshCw, Tag, X } from 'lucide-react';
import { db } from '@/api/client';
import { whatsappUrl } from '@/api/config';

export const STATUS_BADGES = {
  pending: { label: 'In attesa', color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Confermato', color: 'bg-green-100 text-green-700' },
  completed: { label: 'Completato', color: 'bg-blue-100 text-blue-700' },
  cancelled: { label: 'Annullato', color: 'bg-danger-soft text-danger' },
};

/** Hours from now until the appointment (null when there is no date). */
export function hoursUntil(date, time) {
  if (!date) return null;
  const at = new Date(`${date}T${time || '09:00'}:00`);
  if (isNaN(at)) return null;
  return Math.trunc((at.getTime() - Date.now()) / 3_600_000);
}

export default function ClientAppointmentsList({ appointments, onRefresh }) {
  const [rowState, setRowState] = useState({});
  const [notice, setNotice] = useState(null);

  const upcoming = appointments.filter((a) => a.status !== 'cancelled' && a.status !== 'completed');
  const history = appointments.filter((a) => a.status === 'cancelled' || a.status === 'completed');
  const setRow = (id, v) => setRowState((s) => ({ ...s, [id]: v }));

  const cancel = async (appt) => {
    const h = hoursUntil(appt.preferred_date, appt.preferred_time);
    if (h !== null && h < 24) {
      setNotice({ type: 'warn', text: "Non puoi annullare a meno di 24 ore dall'appuntamento. Contatta Simone direttamente." });
      return;
    }
    setRow(appt.id, 'loading');
    try {
      if (appt.access_token) {
        await db.functions.invoke('appointment_respond', { p_id: appt.id, p_token: appt.access_token, p_action: 'cancel' });
      } else {
        await db.entities.Appointment.update(appt.id, { status: 'cancelled' });
      }
    } catch {
      setRow(appt.id, null);
      setNotice({ type: 'warn', text: 'Non è stato possibile annullare l\'appuntamento. Riprova o contatta Simone.' });
      return;
    }
    try {
      // Testo generato dal server; richiede id + token e stato "cancelled".
      if (appt.access_token) {
        await db.integrations.Core.SendNotification({
          type: 'client_cancelled',
          appointment_id: appt.id,
          token: appt.access_token,
        });
      }
    } catch {
      // The cancellation is saved; the notification email is best effort.
    }
    setRow(appt.id, 'done');
    setNotice({ type: 'ok', text: 'Appuntamento annullato. Simone è stato notificato.' });
    onRefresh?.();
  };

  const reschedule = (appt) => {
    window.open(
      whatsappUrl(
        `Ciao Simone, vorrei spostare il mio appuntamento del ${appt.preferred_date} alle ${appt.preferred_time} (${appt.treatment_type}). Potresti aiutarmi?`,
      ),
      '_blank',
      'noopener',
    );
  };

  if (!appointments.length) {
    return (
      <div className="text-center py-16 text-gray-500">
        <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p>Nessun appuntamento trovato.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notice && (
        <div
          role="status"
          className={`flex items-start gap-3 rounded-2xl p-4 ${notice.type === 'ok' ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'}`}
        >
          {notice.type === 'ok' ? (
            <CircleCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <CircleAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <p className="text-sm">{notice.text}</p>
          <button type="button" onClick={() => setNotice(null)} aria-label="Chiudi" className="ml-auto text-gray-500 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {upcoming.length > 0 && (
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">Prossimi appuntamenti</h2>
          <div className="space-y-3">
            {upcoming.map((appt) => {
              const badge = STATUS_BADGES[appt.status] || STATUS_BADGES.pending;
              const h = hoursUntil(appt.preferred_date, appt.preferred_time);
              const canCancel = h === null || h >= 24;
              const loading = rowState[appt.id] === 'loading';
              return (
                <div key={appt.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Tag className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <span className="font-semibold text-gray-900 text-sm">{appt.treatment_type}</span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        {appt.preferred_date && (
                          <span className="flex items-center gap-1">
                            <CalendarDays className="w-3.5 h-3.5" />
                            {appt.preferred_date}
                          </span>
                        )}
                        {appt.preferred_time && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {appt.preferred_time}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${badge.color}`}>{badge.label}</span>
                  </div>
                  {appt.notes && <p className="text-xs text-gray-500 italic mb-3">"{appt.notes}"</p>}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-50">
                    <button
                      type="button"
                      onClick={() => reschedule(appt)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-xl transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Sposta
                    </button>
                    {canCancel ? (
                      <button
                        type="button"
                        disabled={loading || rowState[appt.id] === 'done'}
                        onClick={() => cancel(appt)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        {loading ? 'Annullamento...' : 'Annulla'}
                      </button>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-xl">
                        <CircleAlert className="w-3.5 h-3.5" /> Meno di 24h
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {history.length > 0 && (
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">Storico</h2>
          <div className="space-y-2">
            {history.map((appt) => {
              const badge = STATUS_BADGES[appt.status] || STATUS_BADGES.pending;
              return (
                <div key={appt.id} className="bg-white rounded-2xl border border-gray-100 p-4 opacity-70">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{appt.treatment_type}</p>
                      <div className="flex gap-3 text-xs text-gray-500 mt-1">
                        {appt.preferred_date && (
                          <span className="flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            {appt.preferred_date}
                          </span>
                        )}
                        {appt.preferred_time && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {appt.preferred_time}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${badge.color}`}>{badge.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
