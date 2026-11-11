import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Download, File, FileText, Image, LoaderCircle, Trash2, Upload, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/api/client';

const DOCUMENT_TYPES = [
  { value: 'rx', label: 'RX / Radiografia' },
  { value: 'tac', label: 'TAC' },
  { value: 'ecografia', label: 'Ecografia' },
  { value: 'referto', label: 'Referto Medico' },
  { value: 'piano_trattamento', label: 'Piano di Trattamento' },
  { value: 'altro', label: 'Altro' },
];

const emptyPatient = { first_name: '', last_name: '', email: '', phone: '', notes: '' };
const labelCls = 'block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1';
const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400';

function FileIcon({ type }) {
  if (type?.startsWith('image/')) return <Image className="w-5 h-5 text-blue-400 flex-shrink-0" />;
  if (type === 'application/pdf') return <FileText className="w-5 h-5 text-red-400 flex-shrink-0" />;
  return <File className="w-5 h-5 text-gray-400 flex-shrink-0" />;
}

export default function PatientDocumentsTab({ appointments }) {
  const [documents, setDocuments] = useState([]);
  const [manualPatients, setManualPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [patient, setPatient] = useState(emptyPatient);
  const [savingPatient, setSavingPatient] = useState(false);
  const [docType, setDocType] = useState('altro');
  const [docNotes, setDocNotes] = useState('');
  const fileRef = useRef(null);

  const patients = useMemo(() => {
    const map = new Map();
    appointments.forEach(
      (a) => a.email && map.set(a.email, { email: a.email, name: `${a.first_name} ${a.last_name}`, source: 'booking' }),
    );
    manualPatients.forEach(
      (m) => m.email && map.set(m.email, { email: m.email, name: `${m.first_name} ${m.last_name}`, source: 'manual' }),
    );
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [appointments, manualPatients]);

  const load = async () => {
    setLoading(true);
    try {
      const [docs, manual] = await Promise.all([
        db.entities.PatientDocument.list('-created_date', 500),
        db.entities.ManualPatient.list('-created_date', 500),
      ]);
      setDocuments(docs);
      setManualPatients(manual);
    } catch {
      toast.error('Impossibile caricare i documenti');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const patientDocs = documents.filter((d) => d.client_email === email);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !email) return;
    setUploading(true);
    try {
      // Health documents go to the PRIVATE bucket; opened via short-lived signed links.
      const { file_path } = await db.integrations.Core.UploadPrivateFile({ file, client_email: email });
      await db.entities.PatientDocument.create({
        client_email: email,
        client_name: patients.find((p) => p.email === email)?.name || '',
        file_path,
        file_name: file.name,
        file_type: file.type,
        document_type: docType,
        notes: docNotes,
      });
      await load();
      setDocNotes('');
      toast.success('Documento caricato');
    } catch (err) {
      toast.error(err.message || 'Caricamento non riuscito');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const openDocument = async (doc) => {
    // Open the tab synchronously (popup blockers), then point it at the signed link.
    // ('noopener' would make window.open return null, so we clear opener manually.)
    const win = window.open('', '_blank');
    if (win) win.opener = null;
    try {
      let { url } = await db.integrations.Core.CreateSignedUrl({ file_path: doc.file_path || doc.file_url });
      // Browsers block top-level navigation to data: URLs (demo mode) -> use a blob URL.
      if (url.startsWith('data:')) url = URL.createObjectURL(await (await fetch(url)).blob());
      if (win) win.location.href = url;
      else window.location.href = url;
    } catch (err) {
      win?.close();
      toast.error(err.message || 'Impossibile aprire il documento');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Eliminare questo documento?')) return;
    try {
      await db.entities.PatientDocument.delete(id);
      setDocuments((ds) => ds.filter((d) => d.id !== id));
    } catch (err) {
      toast.error(err.message || 'Eliminazione non riuscita');
    }
  };

  const addPatient = async (e) => {
    e.preventDefault();
    setSavingPatient(true);
    try {
      await db.entities.ManualPatient.create({ ...patient, email: patient.email.trim().toLowerCase() });
      setPatient(emptyPatient);
      setShowPatientForm(false);
      await load();
    } catch (err) {
      toast.error(err.message || 'Salvataggio non riuscito');
    } finally {
      setSavingPatient(false);
    }
  };

  const setP = (key) => (e) => setPatient((p) => ({ ...p, [key]: e.target.value }));

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <LoaderCircle className="w-6 h-6 animate-spin text-gray-300" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-gray-900">Documenti Pazienti</h2>
        <button
          onClick={() => setShowPatientForm((s) => !s)}
          className="flex items-center gap-2 border border-gray-200 hover:border-red-400 text-gray-600 hover:text-red-600 text-sm font-semibold rounded-xl px-4 py-2.5 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          {showPatientForm ? 'Annulla' : 'Aggiungi Paziente Manuale'}
        </button>
      </div>

      {showPatientForm && (
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 sm:p-5 space-y-4">
          <h3 className="font-semibold text-gray-800 text-sm">Nuovo Paziente</h3>
          <form onSubmit={addPatient} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="mp-first" className={labelCls}>
                  Nome *
                </label>
                <input id="mp-first" required value={patient.first_name} onChange={setP('first_name')} className={inputCls} />
              </div>
              <div>
                <label htmlFor="mp-last" className={labelCls}>
                  Cognome *
                </label>
                <input id="mp-last" required value={patient.last_name} onChange={setP('last_name')} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="mp-email" className={labelCls}>
                  Email *
                </label>
                <input id="mp-email" required type="email" value={patient.email} onChange={setP('email')} className={inputCls} />
              </div>
              <div>
                <label htmlFor="mp-phone" className={labelCls}>
                  Telefono
                </label>
                <input id="mp-phone" type="tel" value={patient.phone} onChange={setP('phone')} className={inputCls} />
              </div>
            </div>
            <div>
              <label htmlFor="mp-notes" className={labelCls}>
                Note
              </label>
              <textarea id="mp-notes" rows={2} value={patient.notes} onChange={setP('notes')} className={`${inputCls} resize-none`} />
            </div>
            <button
              type="submit"
              disabled={savingPatient}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl px-4 py-2.5 transition-colors disabled:opacity-60"
            >
              {savingPatient ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Aggiungi Paziente
            </button>
          </form>
        </div>
      )}

      <div>
        <label htmlFor="docs-patient" className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
          Seleziona Paziente
        </label>
        <div className="relative w-full sm:max-w-xs">
          <select
            id="docs-patient"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm appearance-none focus:outline-none focus:border-red-400 bg-white"
          >
            <option value="">— Scegli paziente —</option>
            {patients.map((p) => (
              <option key={p.email} value={p.email}>
                {p.name} {p.source === 'manual' ? '(manuale)' : ''} — {p.email}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {email && (
        <>
          <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-300 p-4 sm:p-5 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Carica Documento</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="doc-type" className="block text-xs text-gray-500 mb-1">
                  Tipo Documento
                </label>
                <div className="relative">
                  <select
                    id="doc-type"
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm appearance-none focus:outline-none focus:border-red-400 bg-white"
                  >
                    {DOCUMENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label htmlFor="doc-notes" className="block text-xs text-gray-500 mb-1">
                  Note (opzionale)
                </label>
                <input
                  id="doc-notes"
                  value={docNotes}
                  onChange={(e) => setDocNotes(e.target.value)}
                  placeholder="es. Lombare 2024"
                  className={inputCls}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <input ref={fileRef} type="file" onChange={upload} className="hidden" id="file-upload" disabled={uploading} />
              <label
                htmlFor="file-upload"
                className={`flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl px-4 py-2.5 cursor-pointer transition-colors ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
              >
                {uploading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? 'Caricamento...' : 'Scegli File'}
              </label>
              <span className="text-xs text-gray-400">PDF, immagini, documenti</span>
            </div>
          </div>

          {patientDocs.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">Nessun documento caricato per questo paziente.</p>
          ) : (
            <div className="space-y-3">
              {patientDocs.map((d) => (
                <div key={d.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                  <FileIcon type={d.file_type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{d.file_name}</p>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        {DOCUMENT_TYPES.find((t) => t.value === d.document_type)?.label || d.document_type}
                      </span>
                      {d.notes && <span className="text-xs text-gray-400">{d.notes}</span>}
                      <span className="text-xs text-gray-300">{d.created_date?.slice(0, 10)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openDocument(d)}
                      aria-label={`Apri ${d.file_name}`}
                      className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors rounded-lg hover:bg-blue-50"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => remove(d.id)}
                      aria-label={`Elimina ${d.file_name}`}
                      className="p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
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
