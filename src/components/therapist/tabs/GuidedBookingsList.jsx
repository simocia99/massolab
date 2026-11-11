import { useEffect, useState } from 'react';
import { Calendar, ChevronDown, ChevronUp, TriangleAlert, User, WandSparkles } from 'lucide-react';
import { db } from '@/api/client';

function InfoTile({ label, value, highlight }) {
  return (
    <div className={`rounded-xl p-3 ${highlight ? 'bg-red-50 border border-red-100' : 'bg-gray-50'}`}>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`font-semibold ${highlight ? 'text-red-700' : 'text-gray-700'} text-sm break-words`}>
        {value || '—'}
      </p>
    </div>
  );
}

export default function GuidedBookingsList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    db.entities.GuidedBooking.list('-created_date', 50)
      .then((rows) => !cancelled && setItems(rows))
      .catch(() => !cancelled && setError(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-48 text-gray-500">Caricamento...</div>;
  }

  return (
    <div className="p-0 sm:p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
          <WandSparkles className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Percorsi Guidati</h2>
          <p className="text-sm text-gray-500">Clienti che hanno usato il wizard di orientamento sul sito</p>
        </div>
      </div>
      {error ? (
        <p className="text-center py-16 text-red-500 text-sm">Impossibile caricare i percorsi guidati. Riprova.</p>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <WandSparkles className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Nessun percorso guidato ancora</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((g) => {
            const open = openId === g.id;
            return (
              <div key={g.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenId(open ? null : g.id)}
                  aria-expanded={open}
                >
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm">{g.client_name || 'Anonimo'}</p>
                        {g.caution_flag && (
                          <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                            <TriangleAlert className="w-3 h-3" /> Attenzione
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{g.need}</p>
                    </div>
                    <div className="text-right flex-shrink-0 mr-2 max-w-[40%]">
                      <p className="text-xs font-bold text-gray-700 truncate">{g.suggested_treatment}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 justify-end mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {new Date(g.created_date).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                  </div>
                  {open ? (
                    <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  )}
                </button>
                {open && (
                  <div className="px-4 sm:px-5 pb-5 border-t border-gray-100 pt-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <InfoTile label="Problema" value={g.need} />
                    <InfoTile label="Durata problema" value={g.duration} />
                    <InfoTile label="Intensità" value={g.intensity} />
                    <InfoTile label="Prima volta" value={g.first_time ? 'Sì' : 'No'} />
                    <InfoTile label="Fa sport" value={g.does_sport ? 'Sì' : 'No'} />
                    <InfoTile label="Preferenza" value={g.style_preference} />
                    <InfoTile label="Trattamento suggerito" value={g.suggested_treatment} highlight />
                    {g.alternative_treatment && <InfoTile label="Alternativa" value={g.alternative_treatment} />}
                    {g.client_email && <InfoTile label="Email" value={g.client_email} />}
                    {g.client_phone && <InfoTile label="Telefono" value={g.client_phone} />}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
