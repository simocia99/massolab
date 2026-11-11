import { useEffect, useMemo, useState } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, ChevronDown, ChevronUp, TrendingDown } from 'lucide-react';
import { db } from '@/api/client';

const parseDate = (s) => {
  if (!s) return null;
  try {
    const d = parseISO(s);
    return isValid(d) ? d : null;
  } catch {
    return null;
  }
};

export const formatShortDate = (s, pattern = 'd MMM') => {
  const d = parseDate(s);
  return d ? format(d, pattern, { locale: it }) : '—';
};

const byDateAsc = (a, b) => new Date(a.session_date) - new Date(b.session_date);
const byDateDesc = (a, b) => new Date(b.session_date) - new Date(a.session_date);

/**
 * Merges TreatmentProgress rows (pre/post scores) and client-visible
 * TreatmentReport rows into one chronological list (bundle `a4`).
 */
export function mergeSessions(progress, reports) {
  const rows = progress.map((p) => ({
    id: `prog_${p.id}`,
    session_date: p.session_date || '',
    treatment_type: p.treatment_type || '',
    problem_area: p.problem_area || '',
    initial_score: p.initial_score ?? null,
    final_score: p.final_score ?? null,
    notes: p.notes || '',
  }));
  for (const r of reports) {
    const date = r.session_date || (r.created_date ? r.created_date.substring(0, 10) : '');
    const match = rows.find((x) => x.session_date === date && x.treatment_type === (r.treatment_type || ''));
    if (match) {
      if (match.final_score === null && r.progress_score) match.final_score = r.progress_score;
      if (!match.problem_area && r.title) match.problem_area = r.title;
    } else {
      rows.push({
        id: `rep_${r.id}`,
        session_date: date,
        treatment_type: r.treatment_type || '',
        problem_area: r.title || '',
        initial_score: null,
        final_score: r.progress_score ?? null,
        notes: r.content ? r.content.substring(0, 150) : '',
      });
    }
  }
  return rows.sort(byDateAsc);
}

function Ring({ value, max = 10, label, sub, color = '#56695C' }) {
  const circumference = 2 * Math.PI * 36;
  const filled = Math.max(0, Math.min(1, (value ?? 0) / max)) * circumference;
  return (
    <div className="bg-white rounded-[22px] border border-black/[0.06] p-5 flex flex-col items-center gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <svg width={90} height={90} viewBox="0 0 90 90" aria-hidden="true">
        <circle cx={45} cy={45} r={36} fill="none" stroke="#f0f0f2" strokeWidth={8} />
        <circle
          cx={45}
          cy={45}
          r={36}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeDasharray={`${filled} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(-90 45 45)"
          style={{ transition: 'stroke-dasharray 0.6s cubic-bezier(.4,0,.2,1)' }}
        />
        <text
          x={45}
          y={45}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#191A17"
          fontSize={22}
          fontWeight={800}
          fontFamily="Inter, sans-serif"
        >
          {value ?? '—'}
        </text>
      </svg>
      <div className="text-center">
        <p className="text-[#191A17] text-sm font-bold">{label}</p>
        {sub && <p className="text-[#6A685F] text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function StatTile({ label, value }) {
  return (
    <div className="bg-white rounded-[18px] border border-black/[0.06] px-5 py-4 flex-1 min-w-[130px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <p className="text-[#6A685F] text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
      <p className="text-[#191A17] text-2xl font-black" style={{ letterSpacing: '-0.03em' }}>
        {value}
      </p>
    </div>
  );
}

const deltaOf = (r) => (r.initial_score != null && r.final_score != null ? r.initial_score - r.final_score : null);

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const r = payload[0]?.payload;
  if (!r) return null;
  const delta = deltaOf(r);
  return (
    <div className="bg-white border border-black/10 rounded-2xl shadow-xl p-4 text-sm min-w-[160px]">
      <p className="text-[#191A17] font-bold mb-0.5">{formatShortDate(r.session_date, 'd MMM yyyy')}</p>
      <p className="text-[#6A685F] text-xs mb-2">{r.treatment_type || '—'}</p>
      {r.initial_score != null && (
        <div className="flex justify-between gap-4">
          <span className="text-[#6A685F]">Prima</span>
          <span className="font-bold text-[#FF3B30]">{r.initial_score}/10</span>
        </div>
      )}
      {r.final_score != null && (
        <div className="flex justify-between gap-4">
          <span className="text-[#6A685F]">Dopo</span>
          <span className="font-bold text-[#4F6B3A]">{r.final_score}/10</span>
        </div>
      )}
      {delta != null && (
        <div className="flex justify-between gap-4 border-t border-black/5 mt-2 pt-2">
          <span className="text-[#6A685F]">Δ</span>
          <span
            className={`font-black ${delta > 0 ? 'text-[#4F6B3A]' : delta < 0 ? 'text-[#FF3B30]' : 'text-[#6A685F]'}`}
          >
            {delta > 0 ? `−${delta} pt` : delta < 0 ? `+${Math.abs(delta)} pt` : 'stabile'}
          </span>
        </div>
      )}
    </div>
  );
}

function HistoryRow({ r, idx, total }) {
  const delta = deltaOf(r);
  return (
    <div className={`flex items-center gap-4 py-3.5 ${idx < total - 1 ? 'border-b border-black/5' : ''}`}>
      <div className="w-10 h-10 rounded-full bg-[#F3F0EA] flex items-center justify-center flex-shrink-0">
        <span className="text-[#191A17] text-xs font-bold">{total - idx}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[#191A17] text-sm font-semibold truncate">{r.treatment_type || 'Sessione'}</p>
        <p className="text-[#6A685F] text-xs">
          {formatShortDate(r.session_date, 'd MMM yyyy')} {r.problem_area ? `· ${r.problem_area}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {r.initial_score != null && <span className="text-[#FF3B30] text-sm font-bold">{r.initial_score}</span>}
        {r.initial_score != null && r.final_score != null && <span className="text-black/20 text-xs">→</span>}
        {r.final_score != null && <span className="text-[#4F6B3A] text-sm font-bold">{r.final_score}</span>}
        {delta != null && (
          <span
            className={`ml-1 text-xs font-black px-2 py-0.5 rounded-full ${delta > 0 ? 'bg-[#4F6B3A]/10 text-[#4F6B3A]' : delta < 0 ? 'bg-[#FF3B30]/10 text-[#FF3B30]' : 'bg-[#F3F0EA] text-[#6A685F]'}`}
          >
            {delta > 0 ? `−${delta}` : delta < 0 ? `+${Math.abs(delta)}` : '='}
          </span>
        )}
      </div>
    </div>
  );
}

/** "Andamento" tab: pain scores over time (bundle `u4`). */
export default function ClientProgress({ clientEmail }) {
  const [progress, setProgress] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.all([
      db.entities.TreatmentProgress.filter({ client_email: clientEmail }),
      db.entities.TreatmentReport.filter({ client_email: clientEmail }),
    ])
      .then(([p, r]) => {
        if (!alive) return;
        setProgress(p);
        setReports(r.filter((x) => x.progress_score && x.visible_to_client !== false));
      })
      .catch((err) => console.warn('Andamento non disponibile:', err))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [clientEmail]);

  const sessions = useMemo(() => mergeSessions(progress, reports), [progress, reports]);
  const scored = useMemo(() => sessions.filter((s) => s.initial_score != null && s.final_score != null), [sessions]);
  const avgImprovement = scored.length
    ? scored.reduce((sum, s) => sum + (s.initial_score - s.final_score), 0) / scored.length
    : null;
  const newestFirst = useMemo(() => [...sessions].sort(byDateDesc), [sessions]);
  const latest = newestFirst[0];
  const bestTreatment = useMemo(() => {
    const groups = {};
    scored.forEach((s) => {
      if (!groups[s.treatment_type]) groups[s.treatment_type] = [];
      groups[s.treatment_type].push(s.initial_score - s.final_score);
    });
    return (
      Object.entries(groups)
        .map(([name, deltas]) => [name, deltas.reduce((a, b) => a + b, 0) / deltas.length])
        .sort((a, b) => b[1] - a[1])[0] || null
    );
  }, [scored]);
  const chartData = sessions.map((s) => ({ ...s, dateLabel: formatShortDate(s.session_date) }));

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-[#56695C]/20 border-t-[#56695C] animate-spin" />
      </div>
    );
  }

  if (!sessions.length) {
    return (
      <div className="text-center py-20 px-4">
        <div className="w-20 h-20 rounded-full bg-[#F3F0EA] flex items-center justify-center mx-auto mb-5">
          <Activity className="w-9 h-9 text-black/15" />
        </div>
        <h3 className="text-xl font-black text-[#191A17] mb-2" style={{ letterSpacing: '-0.03em' }}>
          Nessun dato ancora
        </h3>
        <p className="text-[#6A685F] text-sm max-w-xs mx-auto">I tuoi progressi appariranno qui dopo le prime sedute.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#56695C] mb-1">I tuoi progressi</p>
        <h2 className="text-2xl font-black text-[#191A17]" style={{ letterSpacing: '-0.04em' }}>
          Andamento trattamenti
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Ring
          value={latest?.final_score ?? null}
          label="Ultima valutazione"
          sub={latest ? formatShortDate(latest.session_date, 'd MMM') : '—'}
          color="#4F6B3A"
        />
        <Ring
          value={sessions.length}
          max={Math.max(sessions.length, 10)}
          label="Sedute totali"
          sub="dall'inizio"
          color="#56695C"
        />
        <Ring
          value={scored.length}
          max={Math.max(sessions.length, 10)}
          label="Con valutazione"
          sub="pre/post"
          color="#4A6470"
        />
      </div>

      <div className="flex gap-3 flex-wrap">
        <StatTile
          label="Miglioramento medio"
          value={
            avgImprovement == null
              ? '—'
              : `${avgImprovement > 0 ? '−' : avgImprovement < 0 ? '+' : ''}${Math.abs(avgImprovement).toFixed(1)} pt`
          }
        />
        {bestTreatment && <StatTile label="Trattamento top" value={bestTreatment[0].split(' ').slice(0, 2).join(' ')} />}
      </div>

      {bestTreatment && (
        <div className="bg-white rounded-[18px] border border-[#4F6B3A]/15 p-4 flex items-center gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <TrendingDown className="w-5 h-5 text-[#4F6B3A] flex-shrink-0" />
          <div>
            <p className="text-[#4F6B3A] text-xs font-bold uppercase tracking-wider">Risultati migliori</p>
            <p className="text-[#191A17] text-sm font-semibold">{bestTreatment[0]}</p>
          </div>
          <span className="ml-auto text-[#4F6B3A] font-black text-lg">−{bestTreatment[1].toFixed(1)}</span>
        </div>
      )}

      {chartData.length >= 2 && (
        <div className="bg-white rounded-[22px] border border-black/[0.06] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <p className="text-[#191A17] text-sm font-bold mb-4">Progressione nel tempo</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -28, bottom: 5 }}>
              <XAxis dataKey="dateLabel" tick={{ fontSize: 12, fill: '#6A685F' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 12, fill: '#6A685F' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <ReferenceLine y={5} stroke="#e5e5ea" strokeDasharray="4 4" />
              <Line
                type="monotone"
                dataKey="initial_score"
                name="Prima"
                stroke="#FF3B30"
                strokeWidth={2.5}
                dot={{ fill: '#FF3B30', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#FF3B30' }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="final_score"
                name="Dopo"
                stroke="#4F6B3A"
                strokeWidth={2.5}
                dot={{ fill: '#4F6B3A', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#4F6B3A' }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-4 pt-3 border-t border-black/5">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#FF3B30] rounded-full inline-block" />
              <span className="text-[#6A685F] text-xs">Prima</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#4F6B3A] rounded-full inline-block" />
              <span className="text-[#6A685F] text-xs">Dopo</span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[22px] border border-black/[0.06] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <button
          type="button"
          aria-expanded={historyOpen}
          onClick={() => setHistoryOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-4"
        >
          <span className="text-[#191A17] font-bold text-sm">Storico sedute</span>
          <div className="flex items-center gap-2">
            <span className="text-[#6A685F] text-xs">{sessions.length} totali</span>
            {historyOpen ? (
              <ChevronUp className="w-4 h-4 text-[#6A685F]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#6A685F]" />
            )}
          </div>
        </button>
        {historyOpen && (
          <div className="px-5 pb-2">
            {newestFirst.map((r, i) => (
              <HistoryRow key={r.id} r={r} idx={i} total={newestFirst.length} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
