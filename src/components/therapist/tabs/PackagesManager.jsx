import { useEffect, useState } from 'react';
import { CircleAlert, CircleCheckBig, Minus, Package, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/api/client';

export const PACKAGE_TREATMENTS = ['Massaggio Tradizionale/Rilassante'];

export const PACKAGE_PRESETS = [
  { name: 'Percorso Benessere', sessions: 3 },
  { name: 'Percorso Intensivo', sessions: 5 },
  { name: 'Percorso Riabilitativo', sessions: 6 },
  { name: 'Percorso Mantenimento', sessions: 8 },
];

const EMPTY_FORM = {
  client_email: '',
  treatment_type: PACKAGE_TREATMENTS[0],
  package_name: '',
  total_sessions: 5,
  notes: '',
};

/** +/- counter of used sessions for one TreatmentPackage. */
export function PackageSessionCounter({ pkg, onUpdate }) {
  const [busy, setBusy] = useState(false);
  const used = pkg.used_sessions || 0;
  const remaining = pkg.total_sessions - used;

  const change = async (delta) => {
    const next = Math.min(pkg.total_sessions, Math.max(0, used + delta));
    setBusy(true);
    try {
      await db.entities.TreatmentPackage.update(pkg.id, {
        used_sessions: next,
        status: next >= pkg.total_sessions ? 'completed' : 'active',
      });
      await onUpdate?.();
    } catch {
      toast.error('Aggiornamento non riuscito.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => change(-1)}
        disabled={busy || used === 0}
        aria-label="Togli una seduta"
        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-30 transition-colors"
      >
        <Minus className="w-3 h-3" />
      </button>
      <span className="text-sm font-bold text-gray-900 w-16 text-center">
        {used} / {pkg.total_sessions}
      </span>
      <button
        onClick={() => change(1)}
        disabled={busy || remaining <= 0}
        aria-label="Aggiungi una seduta"
        className="w-7 h-7 rounded-lg bg-red-100 hover:bg-red-200 flex items-center justify-center disabled:opacity-30 transition-colors"
      >
        <Plus className="w-3 h-3 text-red-600" />
      </button>
      <span className="text-xs text-gray-400 ml-1">{remaining > 0 ? `${remaining} rimanenti` : 'Completato'}</span>
    </div>
  );
}

export function PackageStatusBadge({ status, remaining }) {
  if (remaining === 0 || status === 'completed') {
    return (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Completato</span>
    );
  }
  if (remaining === 1) {
    return (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Ultima seduta</span>
    );
  }
  return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Attivo</span>;
}

const inputCls =
  'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400';
const labelCls = 'text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block';

export default function PackagesManager() {
  const [packages, setPackages] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = async () => {
    try {
      const [pkgs, accounts] = await Promise.all([
        db.entities.TreatmentPackage.list('-created_date'),
        db.entities.ClientAccount.list(),
      ]);
      setPackages(pkgs);
      setClients(accounts);
    } catch {
      toast.error('Impossibile caricare i pacchetti.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const clientName = (email) => {
    const c = clients.find((x) => x.email === email);
    return c ? `${c.first_name} ${c.last_name}` : email;
  };

  const applyPreset = (preset) =>
    setForm((f) => ({ ...f, package_name: preset.name, total_sessions: preset.sessions }));

  const create = async () => {
    if (!form.client_email || !form.total_sessions) return;
    setSaving(true);
    try {
      await db.entities.TreatmentPackage.create({
        ...form,
        package_name: form.package_name || `${form.total_sessions} sedute di ${form.treatment_type}`,
        client_name: clientName(form.client_email),
        used_sessions: 0,
        status: 'active',
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      toast.success('Pacchetto creato');
      load();
    } catch {
      toast.error('Salvataggio non riuscito. Riprova.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Eliminare questo pacchetto?')) return;
    try {
      await db.entities.TreatmentPackage.delete(id);
      load();
    } catch {
      toast.error('Eliminazione non riuscita.');
    }
  };

  const q = search.toLowerCase();
  const filtered = packages.filter((p) => {
    const matchSearch =
      !q ||
      p.client_email?.toLowerCase().includes(q) ||
      p.client_name?.toLowerCase().includes(q) ||
      p.package_name?.toLowerCase().includes(q);
    return matchSearch && (statusFilter === 'all' || p.status === statusFilter);
  });

  const active = packages.filter((p) => p.status === 'active');
  const stats = [
    { label: 'Pacchetti attivi', value: active.length, color: 'text-green-600', bg: 'bg-green-50' },
    {
      label: 'Sedute rimanenti',
      value: active.reduce((sum, p) => sum + (p.total_sessions - (p.used_sessions || 0)), 0),
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      label: 'Completati',
      value: packages.filter((p) => p.status === 'completed').length,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Ultima seduta',
      value: active.filter((p) => p.total_sessions - (p.used_sessions || 0) === 1).length,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Pacchetti &amp; Percorsi</h2>
          <p className="text-gray-500">Gestisci i percorsi di trattamento dei tuoi clienti</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl px-4 py-2.5 text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuovo Pacchetto
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-600 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h3 className="font-bold text-gray-900 mb-4">Crea Nuovo Pacchetto</h3>
          <div className="mb-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Percorsi predefiniti</p>
            <div className="flex flex-wrap gap-2">
              {PACKAGE_PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => applyPreset(p)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                    form.package_name === p.name && form.total_sessions === p.sessions
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-red-300'
                  }`}
                >
                  {p.name} ({p.sessions} sed.)
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls} htmlFor="pkg-client">
                Cliente
              </label>
              <select
                id="pkg-client"
                value={form.client_email}
                onChange={(e) => setForm((f) => ({ ...f, client_email: e.target.value }))}
                className={inputCls}
              >
                <option value="">Seleziona cliente...</option>
                {clients.map((c) => (
                  <option key={c.id || c.email} value={c.email}>
                    {c.first_name} {c.last_name} ({c.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="pkg-treatment">
                Tipo Trattamento
              </label>
              <select
                id="pkg-treatment"
                value={form.treatment_type}
                onChange={(e) => setForm((f) => ({ ...f, treatment_type: e.target.value }))}
                className={inputCls}
              >
                {PACKAGE_TREATMENTS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="pkg-sessions">
                N° Sedute
              </label>
              <input
                id="pkg-sessions"
                type="number"
                min="1"
                value={form.total_sessions}
                onChange={(e) => setForm((f) => ({ ...f, total_sessions: Math.max(1, parseInt(e.target.value) || 1) }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="pkg-name">
                Nome Pacchetto
              </label>
              <input
                id="pkg-name"
                type="text"
                placeholder="Es. Percorso Benessere 3 sedute"
                value={form.package_name}
                onChange={(e) => setForm((f) => ({ ...f, package_name: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls} htmlFor="pkg-notes">
                Note
              </label>
              <textarea
                id="pkg-notes"
                placeholder="Note sul pacchetto..."
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                className={`${inputCls} resize-none`}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={create}
              disabled={saving || !form.client_email}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl px-5 py-2.5 text-sm transition-colors disabled:opacity-40"
            >
              {saving ? 'Salvataggio...' : 'Salva Pacchetto'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl px-5 py-2.5 text-sm transition-colors"
            >
              Annulla
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca per cliente o pacchetto..."
            aria-label="Cerca pacchetti"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {[
            { key: 'active', label: 'Attivi' },
            { key: 'completed', label: 'Completati' },
            { key: 'all', label: 'Tutti' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                statusFilter === f.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">Nessun pacchetto trovato.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((p) => {
              const remaining = p.total_sessions - (p.used_sessions || 0);
              const pct = Math.min(100, Math.round(((p.used_sessions || 0) / p.total_sessions) * 100));
              return (
                <div key={p.id} className="p-4 sm:p-5">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        p.status === 'completed' ? 'bg-blue-100' : remaining === 1 ? 'bg-amber-100' : 'bg-red-100'
                      }`}
                    >
                      {p.status === 'completed' ? (
                        <CircleCheckBig className="w-5 h-5 text-blue-600" />
                      ) : remaining === 1 ? (
                        <CircleAlert className="w-5 h-5 text-amber-600" />
                      ) : (
                        <Package className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="font-semibold text-gray-900 text-sm">{p.package_name}</p>
                        <PackageStatusBadge status={p.status} remaining={remaining} />
                      </div>
                      <p className="text-xs text-gray-500">
                        {p.client_name || p.client_email} · {p.treatment_type}
                      </p>
                      <div className="mt-3 mb-3">
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              pct >= 100 ? 'bg-blue-400' : remaining === 1 ? 'bg-amber-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <PackageSessionCounter pkg={p} onUpdate={load} />
                    </div>
                    <button
                      onClick={() => remove(p.id)}
                      aria-label="Elimina pacchetto"
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
