import { useEffect, useState } from 'react';
import { Bell, CircleCheck } from 'lucide-react';

const supported = () => typeof Notification !== 'undefined';

/** Browser-notification permission banner (bundle `z2`). */
export default function NotificationsBanner() {
  const [permission, setPermission] = useState(supported() ? Notification.permission : 'default');

  useEffect(() => {
    if (supported()) setPermission(Notification.permission);
  }, []);

  if (!supported()) return null;

  const request = async () => {
    try {
      setPermission(await Notification.requestPermission());
    } catch {
      /* some browsers (iOS) throw instead of returning "denied" */
    }
  };

  const granted = permission === 'granted';
  return (
    <div
      className={`rounded-2xl border p-4 flex items-center gap-4 ${granted ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${granted ? 'bg-green-100' : 'bg-amber-100'}`}
      >
        {granted ? <CircleCheck className="w-5 h-5 text-green-600" /> : <Bell className="w-5 h-5 text-amber-600" />}
      </div>
      <div className="flex-1 min-w-0">
        {granted ? (
          <>
            <p className="font-semibold text-green-800 text-sm">Notifiche Attive</p>
            <p className="text-xs text-green-600">Riceverai una notifica quando il terapista risponde alla tua prenotazione.</p>
          </>
        ) : permission === 'denied' ? (
          <>
            <p className="font-semibold text-gray-700 text-sm">Notifiche Bloccate</p>
            <p className="text-xs text-gray-500">
              Abilita le notifiche nelle impostazioni del browser per ricevere aggiornamenti sulle prenotazioni.
            </p>
          </>
        ) : (
          <>
            <p className="font-semibold text-amber-800 text-sm">Attiva le Notifiche</p>
            <p className="text-xs text-amber-700">Ricevi aggiornamenti in tempo reale sullo stato dei tuoi appuntamenti.</p>
          </>
        )}
      </div>
      {permission === 'default' && (
        <button
          type="button"
          onClick={request}
          className="flex-shrink-0 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors"
        >
          Attiva
        </button>
      )}
    </div>
  );
}
