import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, LoaderCircle, Star, TrendingUp } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { db } from '@/api/client';

export default function PatientProgressTab({ appointments }) {
  const [reports, setReports] = useState([]);
  const [manualPatients, setManualPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([db.entities.TreatmentReport.list('-session_date', 500), db.entities.ManualPatient.list('-created_date', 500)])
      .then(([r, m]) => {
        if (cancelled) return;
        setReports(r);
        setManualPatients(m);
      })
      .catch(() => !cancelled && toast.error('Impossibile caricare i dati'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const patients = useMemo(() => {
    const map = new Map();
    appointments.forEach((a) => a.email && map.set(a.email, { email: a.email, name: `${a.first_name} ${a.last_name}` }));
    manualPatients.forEach((m) => m.email && map.set(m.email, { email: m.email, name: `${m.first_name} ${m.last_name}` }));
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [appointments, manualPatients]);

  const scored = reports.filter((r) => r.client_email === email && r.progress_score);
  const points = [...scored]
    .sort((a, b) => (a.session_date || '').localeCompare(b.session_date || ''))
    .map((r) => ({
      date: r.session_date || r.created_date?.slice(0, 10),
      score: r.progress_score,
      title: r.title || r.treatment_type || 'Sessione',
    }));
  const avg = scored.length ? (scored.reduce((s, r) => s + r.progress_score, 0) / scored.length).toFixed(1) : null;
  const lastScore = points[points.length - 1]?.score;
  const firstScore = points[0]?.score;
  const delta = lastScore && firstScore ? lastScore - firstScore : null;

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <LoaderCircle className="w-6 h-6 animate-spin text-gray-300" />
      </div>
    );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Andamento Trattamenti</h2>
      <div>
        <label htmlFor="progress-patient" className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
          Seleziona Paziente
        </label>
        <div className="relative w-full sm:max-w-xs">
          <select
            id="progress-patient"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm appearance-none focus:outline-none focus:border-red-400 bg-white"
          >
            <option value="">— Scegli paziente —</option>
            {patients.map((p) => (
              <option key={p.email} value={p.email}>
                {p.name} — {p.email}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {email &&
        (points.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <TrendingUp className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              Nessun dato di andamento. Aggiungi report con punteggio dalla sezione &quot;Report Clienti&quot;.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-4 text-center">
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{points.length}</p>
                <p className="text-xs text-gray-500 mt-1">Sessioni registrate</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-4 text-center">
                <p className="text-2xl sm:text-3xl font-bold text-amber-500">{avg}</p>
                <p className="text-xs text-gray-500 mt-1">Punteggio medio</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-4 text-center">
                <p
                  className={`text-2xl sm:text-3xl font-bold ${delta > 0 ? 'text-green-500' : delta < 0 ? 'text-red-500' : 'text-gray-500'}`}
                >
                  {delta === null ? '—' : delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Variazione totale</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
              <h3 className="text-sm font-bold text-gray-600 mb-4">Andamento nel tempo</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={points}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} width={28} />
                  <Tooltip formatter={(v) => [v + '/10', 'Punteggio']} labelFormatter={(l) => `Data: ${l}`} />
                  <Line type="monotone" dataKey="score" stroke="#dc2626" strokeWidth={2.5} dot={{ r: 4, fill: '#dc2626' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {[...points].reverse().map((p, i) => (
                <div key={`${p.date}-${i}`} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                    <Star className="w-4 h-4 text-amber-500" fill="currentColor" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{p.title}</p>
                    <p className="text-xs text-gray-500">{p.date}</p>
                  </div>
                  <span className="text-lg font-bold text-red-600">
                    {p.score}
                    <span className="text-sm text-gray-500">/10</span>
                  </span>
                </div>
              ))}
            </div>
          </>
        ))}
    </div>
  );
}
