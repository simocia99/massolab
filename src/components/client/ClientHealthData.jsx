import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Brain, Check, CircleAlert, Footprints, Heart, Moon, Plus, Trash2, Watch, Zap } from 'lucide-react';
import { db } from '@/api/client';
import { formatDateIT, toISODate } from '@/lib/utils';

export const HEALTH_SOURCES = [
  { id: 'manual', label: 'Inserimento Manuale' },
  { id: 'apple_health', label: 'Apple Health' },
  { id: 'google_fit', label: 'Google Fit' },
  { id: 'fitbit', label: 'Fitbit' },
  { id: 'garmin', label: 'Garmin' },
];
const SLEEP_QUALITY = ['', 'Pessimo', 'Scarso', 'Discreto', 'Buono', 'Ottimo'];

const emptyForm = () => ({
  date: toISODate(),
  steps: '',
  sleep_hours: '',
  sleep_quality: 3,
  active_minutes: '',
  heart_rate_avg: '',
  stress_level: 5,
  pain_level: 0,
  notes: '',
  source: 'manual',
});
const num = (v) => (v === '' || v == null ? undefined : Number(v));
const inputCls =
  'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300';

function MetricCard({ icon: Icon, label, value, unit, color }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">
        {value ?? '—'} <span className="text-sm font-normal text-gray-500">{unit}</span>
      </p>
    </div>
  );
}

function Labeled({ id, label, children, className }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-xs font-semibold text-gray-600 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

/** "Salute" tab: daily health/fitness data (bundle `p4`). */
export default function ClientHealthData({ clientEmail, clientName }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await db.entities.HealthData.filter({ client_email: clientEmail });
      setEntries([...rows].sort((a, b) => (b.date || '').localeCompare(a.date || '')));
    } catch {
      toast.error('Impossibile caricare i dati salute.');
    } finally {
      setLoading(false);
    }
  }, [clientEmail]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!saved) return undefined;
    const t = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(t);
  }, [saved]);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await db.entities.HealthData.create({
        ...form,
        client_email: clientEmail,
        client_name: clientName,
        steps: num(form.steps),
        sleep_hours: num(form.sleep_hours),
        active_minutes: num(form.active_minutes),
        heart_rate_avg: num(form.heart_rate_avg),
      });
      setSaved(true);
      setShowForm(false);
      setForm(emptyForm());
      load();
    } catch {
      toast.error('Salvataggio non riuscito. Riprova.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Eliminare questo rilevamento?')) return;
    try {
      await db.entities.HealthData.delete(id);
      load();
    } catch {
      toast.error('Eliminazione non riuscita.');
    }
  };

  const latest = entries[0];
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center">
            <Watch className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Dati Salute &amp; Fitness</h2>
            <p className="text-xs text-gray-500">Sincronizza i tuoi dati da smartwatch o app fitness</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Aggiungi
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6 flex items-start gap-3">
        <CircleAlert className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700">
          Puoi inserire manualmente i dati giornalieri oppure esportarli dalla tua app salute (Apple Health, Google Fit,
          Fitbit, Garmin) e inserirli qui per condividerli con il tuo terapista.
        </p>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          className="bg-white border border-gray-200 rounded-2xl p-6 mb-6"
        >
          <h3 className="font-bold text-gray-900 mb-4">Nuovo Rilevamento</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Labeled id="hd-date" label="Data">
              <input id="hd-date" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} className={inputCls} />
            </Labeled>
            <Labeled id="hd-source" label="Fonte dati">
              <select id="hd-source" value={form.source} onChange={(e) => set('source', e.target.value)} className={inputCls}>
                {HEALTH_SOURCES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Labeled>
            <Labeled id="hd-steps" label="Passi">
              <input
                id="hd-steps"
                type="number"
                placeholder="es. 8500"
                value={form.steps}
                onChange={(e) => set('steps', e.target.value)}
                className={inputCls}
              />
            </Labeled>
            <Labeled id="hd-sleep" label="Ore di sonno">
              <input
                id="hd-sleep"
                type="number"
                step="0.5"
                placeholder="es. 7.5"
                value={form.sleep_hours}
                onChange={(e) => set('sleep_hours', e.target.value)}
                className={inputCls}
              />
            </Labeled>
            <Labeled
              id="hd-sleepq"
              label={
                <>
                  Qualità sonno: <strong>{SLEEP_QUALITY[form.sleep_quality]}</strong>
                </>
              }
            >
              <input
                id="hd-sleepq"
                type="range"
                min="1"
                max="5"
                value={form.sleep_quality}
                onChange={(e) => set('sleep_quality', Number(e.target.value))}
                className="w-full accent-red-600"
              />
            </Labeled>
            <Labeled id="hd-active" label="Minuti attività fisica">
              <input
                id="hd-active"
                type="number"
                placeholder="es. 45"
                value={form.active_minutes}
                onChange={(e) => set('active_minutes', e.target.value)}
                className={inputCls}
              />
            </Labeled>
            <Labeled id="hd-hr" label="FC media (bpm)">
              <input
                id="hd-hr"
                type="number"
                placeholder="es. 72"
                value={form.heart_rate_avg}
                onChange={(e) => set('heart_rate_avg', e.target.value)}
                className={inputCls}
              />
            </Labeled>
            <Labeled
              id="hd-stress"
              label={
                <>
                  Stress percepito: <strong>{form.stress_level}/10</strong>
                </>
              }
            >
              <input
                id="hd-stress"
                type="range"
                min="1"
                max="10"
                value={form.stress_level}
                onChange={(e) => set('stress_level', Number(e.target.value))}
                className="w-full accent-red-600"
              />
            </Labeled>
            <Labeled
              id="hd-pain"
              label={
                <>
                  Livello dolore: <strong>{form.pain_level}/10</strong>
                </>
              }
            >
              <input
                id="hd-pain"
                type="range"
                min="0"
                max="10"
                value={form.pain_level}
                onChange={(e) => set('pain_level', Number(e.target.value))}
                className="w-full accent-red-600"
              />
            </Labeled>
            <Labeled id="hd-notes" label="Note" className="sm:col-span-2">
              <textarea
                id="hd-notes"
                placeholder="Come ti sei sentito oggi?"
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                rows={2}
                className={`${inputCls} resize-none`}
              />
            </Labeled>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {saved ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {saving ? 'Salvataggio...' : saved ? 'Salvato!' : 'Salva'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors"
            >
              Annulla
            </button>
          </div>
        </motion.div>
      )}

      {latest && (
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">
            Ultimo rilevamento — {formatDateIT(latest.date)}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <MetricCard icon={Footprints} label="Passi" value={latest.steps?.toLocaleString('it-IT')} unit="" color="bg-blue-50 text-blue-600" />
            <MetricCard icon={Moon} label="Sonno" value={latest.sleep_hours} unit="h" color="bg-indigo-50 text-indigo-600" />
            <MetricCard icon={Zap} label="Attività" value={latest.active_minutes} unit="min" color="bg-green-50 text-green-600" />
            <MetricCard icon={Heart} label="FC media" value={latest.heart_rate_avg} unit="bpm" color="bg-red-50 text-red-600" />
            <MetricCard icon={Brain} label="Stress" value={latest.stress_level} unit="/10" color="bg-orange-50 text-orange-600" />
            <MetricCard icon={CircleAlert} label="Dolore" value={latest.pain_level} unit="/10" color="bg-yellow-50 text-yellow-600" />
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-red-200 border-t-red-600 rounded-full animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Watch className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nessun dato inserito</p>
          <p className="text-sm mt-1">Clicca "Aggiungi" per iniziare a tracciare i tuoi dati</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Storico</p>
          {entries.map((e) => (
            <div key={e.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-900 text-sm">
                    {formatDateIT(e.date, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    {HEALTH_SOURCES.find((s) => s.id === e.source)?.label || e.source}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  {!!e.steps && <span>👟 {e.steps.toLocaleString('it-IT')} passi</span>}
                  {!!e.sleep_hours && <span>🌙 {e.sleep_hours}h sonno</span>}
                  {!!e.active_minutes && <span>⚡ {e.active_minutes} min attività</span>}
                  {!!e.heart_rate_avg && <span>❤️ {e.heart_rate_avg} bpm</span>}
                  {!!e.stress_level && <span>🧠 stress {e.stress_level}/10</span>}
                  {e.pain_level > 0 && <span>⚠️ dolore {e.pain_level}/10</span>}
                </div>
                {e.notes && <p className="text-xs text-gray-500 mt-1 italic">"{e.notes}"</p>}
              </div>
              <button
                type="button"
                onClick={() => remove(e.id)}
                aria-label="Elimina rilevamento"
                className="p-2 hover:bg-red-50 rounded-xl text-gray-500 hover:text-red-500 transition-colors flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
