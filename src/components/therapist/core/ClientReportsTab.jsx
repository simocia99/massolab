import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, CirclePlus, LoaderCircle, Save, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/api/client';

const emptyForm = () => ({
  report_type: 'general_report',
  title: '',
  content: '',
  treatment_type: '',
  session_date: '',
  progress_score: '',
  visible_to_client: true,
  appointment_id: '',
});

const labelCls = 'block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1';
const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400';

export default function ClientReportsTab({ appointments }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clientEmail, setClientEmail] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const clients = useMemo(
    () => [
      ...new Map(
        appointments.filter((a) => a.email).map((a) => [a.email, { email: a.email, name: `${a.first_name} ${a.last_name}` }]),
      ).values(),
    ],
    [appointments],
  );

  const load = async () => {
    setLoading(true);
    try {
      setReports(await db.entities.TreatmentReport.list('-created_date', 200));
    } catch {
      toast.error('Impossibile caricare i report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const clientAppointments = appointments.filter((a) => a.email === clientEmail);
  const clientReports = reports.filter((r) => r.client_email === clientEmail);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await db.entities.TreatmentReport.create({
        ...form,
        client_email: clientEmail,
        progress_score: form.progress_score ? Number(form.progress_score) : undefined,
      });
      await load();
      setForm(emptyForm());
      setShowForm(false);
    } catch (err) {
      toast.error(err.message || 'Salvataggio non riuscito');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Eliminare questo report?')) return;
    try {
      await db.entities.TreatmentReport.delete(id);
      setReports((rs) => rs.filter((r) => r.id !== id));
    } catch (err) {
      toast.error(err.message || 'Eliminazione non riuscita');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Report Clienti</h2>
      <div>
        <label htmlFor="report-client" className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
          Seleziona Cliente
        </label>
        <div className="relative w-full sm:max-w-xs">
          <select
            id="report-client"
            value={clientEmail}
            onChange={(e) => {
              setClientEmail(e.target.value);
              setShowForm(false);
            }}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm appearance-none focus:outline-none focus:border-red-400 bg-white"
          >
            <option value="">— Scegli cliente —</option>
            {clients.map((c) => (
              <option key={c.email} value={c.email}>
                {c.name} ({c.email})
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {clientEmail && (
        <>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl px-4 py-2.5 transition-colors"
          >
            <CirclePlus className="w-4 h-4" />
            {showForm ? 'Annulla' : 'Aggiungi Report'}
          </button>

          {showForm && (
            <form onSubmit={submit} className="bg-gray-50 rounded-2xl border border-gray-200 p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="rep-type" className={labelCls}>
                    Tipo
                  </label>
                  <select id="rep-type" value={form.report_type} onChange={set('report_type')} className={`${inputCls} bg-white`}>
                    <option value="general_report">Report Generale</option>
                    <option value="appointment_note">Nota Appuntamento</option>
                  </select>
                </div>
                {form.report_type === 'appointment_note' && (
                  <div>
                    <label htmlFor="rep-appt" className={labelCls}>
                      Appuntamento
                    </label>
                    <select id="rep-appt" value={form.appointment_id} onChange={set('appointment_id')} className={`${inputCls} bg-white`}>
                      <option value="">— Seleziona —</option>
                      {clientAppointments.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.treatment_type} {a.preferred_date ? '— ' + a.preferred_date : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="rep-title" className={labelCls}>
                  Titolo
                </label>
                <input id="rep-title" value={form.title} onChange={set('title')} className={inputCls} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="rep-treat" className={labelCls}>
                    Trattamento
                  </label>
                  <input id="rep-treat" value={form.treatment_type} onChange={set('treatment_type')} className={inputCls} />
                </div>
                <div>
                  <label htmlFor="rep-date" className={labelCls}>
                    Data Sessione
                  </label>
                  <input id="rep-date" type="date" value={form.session_date} onChange={set('session_date')} className={inputCls} />
                </div>
              </div>
              <div>
                <label htmlFor="rep-score" className={labelCls}>
                  Punteggio Andamento (1-10)
                </label>
                <input
                  id="rep-score"
                  type="number"
                  min="1"
                  max="10"
                  value={form.progress_score}
                  onChange={set('progress_score')}
                  className="w-32 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400"
                />
              </div>
              <div>
                <label htmlFor="rep-content" className={labelCls}>
                  Contenuto / Note *
                </label>
                <textarea id="rep-content" required rows={4} value={form.content} onChange={set('content')} className={`${inputCls} resize-none`} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="visible" checked={form.visible_to_client} onChange={set('visible_to_client')} className="rounded" />
                <label htmlFor="visible" className="text-sm text-gray-600">
                  Visibile al cliente
                </label>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl px-4 py-2.5 transition-colors disabled:opacity-60"
              >
                {saving ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salva Report
              </button>
            </form>
          )}

          {loading ? (
            <div className="flex justify-center py-10">
              <LoaderCircle className="w-6 h-6 animate-spin text-gray-300" />
            </div>
          ) : clientReports.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">Nessun report per questo cliente.</p>
          ) : (
            <div className="space-y-4">
              {clientReports.map((r) => (
                <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.report_type === 'general_report' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}
                        >
                          {r.report_type === 'general_report' ? 'Report Generale' : 'Nota Appuntamento'}
                        </span>
                        {!!r.progress_score && (
                          <span className="flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                            <Star className="w-3 h-3" fill="currentColor" />
                            {r.progress_score}/10
                          </span>
                        )}
                        {!r.visible_to_client && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Nascosto</span>
                        )}
                      </div>
                      {r.title && <h4 className="font-semibold text-gray-900">{r.title}</h4>}
                      {r.session_date && <p className="text-xs text-gray-500">{r.session_date}</p>}
                      <p className="text-sm text-gray-700 mt-2 whitespace-pre-line break-words">{r.content}</p>
                    </div>
                    <button
                      onClick={() => remove(r.id)}
                      aria-label="Elimina report"
                      className="text-gray-300 hover:text-red-500 transition-colors shrink-0 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
