import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { ChevronDown, ChevronUp, Watch } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { db } from '@/api/client';

const SLEEP_QUALITY = ['', 'Pessimo', 'Scarso', 'Discreto', 'Buono', 'Ottimo'];

// "YYYY-MM-DD" -> local date (avoids the UTC shift of new Date("YYYY-MM-DD")).
const toDate = (d) => (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(d + 'T12:00:00') : new Date(d));
const fmt = (d, pattern) => {
  const date = toDate(d);
  return isNaN(date) ? '—' : format(date, pattern, { locale: it });
};

function Metric({ label, value, unit }) {
  if (value == null) return null;
  return (
    <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1 text-xs text-gray-700">
      <strong>{value}</strong> {unit} <span className="text-gray-500">{label}</span>
    </span>
  );
}

export default function HealthDataOverview() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clientFilter, setClientFilter] = useState('all');
  const [openEmail, setOpenEmail] = useState(null);

  useEffect(() => {
    let cancelled = false;
    db.entities.HealthData.list('-date', 500)
      .then((rows) => !cancelled && setRecords(rows))
      .catch(() => !cancelled && toast.error('Impossibile caricare i dati salute.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const clients = useMemo(
    () => [...new Map(records.map((r) => [r.client_email, { email: r.client_email, name: r.client_name }])).values()],
    [records],
  );

  const groups = useMemo(() => {
    const list = clientFilter === 'all' ? records : records.filter((r) => r.client_email === clientFilter);
    const out = {};
    for (const r of list) {
      const key = r.client_email;
      if (!out[key]) out[key] = { email: r.client_email, name: r.client_name, records: [] };
      out[key].records.push(r);
    }
    return Object.values(out);
  }, [records, clientFilter]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center flex-shrink-0">
          <Watch className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Dati Salute Clienti</h2>
          <p className="text-sm text-gray-500">Dati da smartwatch e app fitness dei tuoi clienti</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <label className="text-sm font-semibold text-gray-600" htmlFor="health-client">
          Cliente:
        </label>
        <select
          id="health-client"
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="min-w-0 flex-1 sm:flex-none border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
        >
          <option value="all">Tutti i clienti</option>
          {clients.map((c) => (
            <option key={c.email} value={c.email}>
              {c.name || c.email}
            </option>
          ))}
        </select>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Watch className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">Nessun dato disponibile</p>
          <p className="text-sm mt-1">I clienti non hanno ancora inserito dati salute</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => {
            const open = openEmail === g.email;
            const latest = g.records[0];
            const chartData = [...g.records]
              .reverse()
              .slice(-14)
              .map((r) => ({
                date: fmt(r.date, 'd/M'),
                passi: r.steps,
                sonno: r.sleep_hours,
                stress: r.stress_level,
                dolore: r.pain_level,
              }));
            const displayName = g.name || g.email || '?';
            return (
              <div key={g.email || 'unknown'} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setOpenEmail(open ? null : g.email)}
                  aria-expanded={open}
                  className="w-full flex items-center justify-between gap-3 p-4 sm:p-5 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-red-600 font-bold text-sm">{displayName[0].toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{displayName}</p>
                      <p className="text-xs text-gray-500">
                        {g.records.length} rilevamenti · Ultimo: {fmt(latest.date, 'd MMM yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="hidden sm:flex flex-wrap gap-2">
                      <Metric label="passi" value={latest.steps?.toLocaleString('it-IT')} unit="" />
                      <Metric label="h sonno" value={latest.sleep_hours} unit="" />
                      <Metric label="stress" value={latest.stress_level} unit="/10" />
                      {latest.pain_level > 0 && <Metric label="dolore" value={latest.pain_level} unit="/10" />}
                    </div>
                    {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </div>
                </button>
                {open && (
                  <div className="border-t border-gray-100 p-4 sm:p-5">
                    {chartData.length > 1 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                            Passi (ultimi 14 giorni)
                          </p>
                          <ResponsiveContainer width="100%" height={150}>
                            <LineChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                              <YAxis tick={{ fontSize: 12 }} width={40} />
                              <Tooltip />
                              <Line type="monotone" dataKey="passi" stroke="#3b82f6" strokeWidth={2} dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Stress &amp; Dolore</p>
                          <ResponsiveContainer width="100%" height={150}>
                            <LineChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                              <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} width={30} />
                              <Tooltip />
                              <Line
                                type="monotone"
                                dataKey="stress"
                                stroke="#f97316"
                                strokeWidth={2}
                                dot={false}
                                name="Stress"
                              />
                              <Line
                                type="monotone"
                                dataKey="dolore"
                                stroke="#dc2626"
                                strokeWidth={2}
                                dot={false}
                                name="Dolore"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      {g.records.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-start justify-between gap-3 sm:gap-4 py-3 border-b border-gray-50 last:border-0"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-700">
                              {fmt(r.date, 'EEEE d MMMM yyyy')}
                            </p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                              {!!r.steps && <span>👟 {r.steps.toLocaleString('it-IT')} passi</span>}
                              {!!r.sleep_hours && (
                                <span>
                                  🌙 {r.sleep_hours}h sonno ({SLEEP_QUALITY[r.sleep_quality] || ''})
                                </span>
                              )}
                              {!!r.active_minutes && <span>⚡ {r.active_minutes} min attività</span>}
                              {!!r.heart_rate_avg && <span>❤️ {r.heart_rate_avg} bpm</span>}
                              {!!r.stress_level && <span>🧠 stress {r.stress_level}/10</span>}
                              {r.pain_level > 0 && (
                                <span className="text-red-500 font-medium">⚠️ dolore {r.pain_level}/10</span>
                              )}
                            </div>
                            {r.notes && <p className="text-xs text-gray-500 mt-1 italic">"{r.notes}"</p>}
                          </div>
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full whitespace-nowrap">
                            {r.source || 'manuale'}
                          </span>
                        </div>
                      ))}
                    </div>
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
