import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, CircleCheck, Clock, FileText, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/api/client';

const STATUS = {
  incomplete: { label: 'Incompleto', color: 'bg-gray-100 text-gray-500', icon: Clock },
  completed: { label: 'Completato', color: 'bg-blue-100 text-blue-700', icon: FileText },
  reviewed: { label: 'Revisionato', color: 'bg-green-100 text-green-700', icon: CircleCheck },
};

function Section({ title, children, highlight }) {
  return (
    <div className={`rounded-2xl p-4 space-y-2 ${highlight ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'}`}>
      <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${highlight ? 'text-amber-700' : 'text-gray-500'}`}>
        {title}
      </p>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex gap-2">
      <span className="text-xs text-gray-500 font-semibold w-28 sm:w-36 flex-shrink-0">{label}</span>
      <span className="text-xs text-gray-800 min-w-0 break-words">{value || '—'}</span>
    </div>
  );
}

export default function IntakeFormsList() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [notes, setNotes] = useState({});
  const [savingId, setSavingId] = useState(null);

  const load = async () => {
    try {
      setForms(await db.entities.IntakeForm.list('-created_date'));
    } catch {
      toast.error('Impossibile caricare i moduli.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markReviewed = async (id) => {
    setSavingId(id);
    try {
      await db.entities.IntakeForm.update(id, { status: 'reviewed', therapist_notes: notes[id] || '' });
      await load();
    } catch {
      toast.error('Salvataggio non riuscito. Riprova.');
    } finally {
      setSavingId(null);
    }
  };

  const toggle = (id) => setOpenId((cur) => (cur === id ? null : id));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Moduli Pre-Trattamento</h2>
        <p className="text-gray-500">Schede compilate dai clienti prima della prima seduta</p>
      </div>
      {forms.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Nessun modulo ricevuto</p>
        </div>
      ) : (
        <div className="space-y-3">
          {forms.map((f) => {
            const st = STATUS[f.status] || STATUS.incomplete;
            const StatusIcon = st.icon;
            const open = openId === f.id;
            return (
              <div key={f.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => toggle(f.id)}
                  aria-expanded={open}
                  className="w-full flex items-center justify-between gap-3 p-4 sm:p-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600 text-sm flex-shrink-0">
                      {f.first_name?.[0]}
                      {f.last_name?.[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900">
                        {f.first_name} {f.last_name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {f.email} · {new Date(f.created_date).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                    {f.has_contraindications && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                        <TriangleAlert className="w-3 h-3" /> Da valutare
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 ${st.color}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      <span className="hidden sm:inline">{st.label}</span>
                    </span>
                    {open ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                </button>
                {open && (
                  <div className="border-t border-gray-100 p-4 sm:p-5 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Section title="Anagrafica">
                        <Row label="Nome" value={`${f.first_name || ''} ${f.last_name || ''}`.trim()} />
                        <Row label="Email" value={f.email} />
                        <Row label="Telefono" value={f.phone} />
                        <Row label="Data di nascita" value={f.birth_date || '—'} />
                      </Section>
                      <Section title="Il problema">
                        <Row label="Motivo visita" value={f.visit_reason} />
                        <Row label="Area interessata" value={f.body_area} />
                        <Row label="Durata" value={f.problem_duration} />
                        <Row label="Intensità" value={f.pain_intensity ? `${f.pain_intensity}/10` : '—'} />
                      </Section>
                      <Section title="Stile di vita">
                        <Row label="Attività lavorativa" value={f.job_activity || '—'} />
                        <Row label="Attività sportiva" value={f.sport_activity || '—'} />
                        <Row label="Trattamenti precedenti" value={f.previous_treatments || '—'} />
                      </Section>
                      <Section title="Da segnalare" highlight={f.has_contraindications}>
                        <Row label="Note cliente" value={f.contraindications || 'Nessuna segnalazione'} />
                      </Section>
                    </div>
                    {f.status !== 'reviewed' && (
                      <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                        <label className="block text-sm font-semibold text-gray-700" htmlFor={`notes-${f.id}`}>
                          Note interne del terapista
                        </label>
                        <textarea
                          id={`notes-${f.id}`}
                          rows={2}
                          value={notes[f.id] || ''}
                          onChange={(e) => setNotes((n) => ({ ...n, [f.id]: e.target.value }))}
                          placeholder="Annotazioni private per il trattamento..."
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 resize-none bg-white"
                        />
                        <button
                          onClick={() => markReviewed(f.id)}
                          disabled={savingId === f.id}
                          className="bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                          {savingId === f.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <CircleCheck className="w-4 h-4" />
                          )}
                          Segna come revisionato
                        </button>
                      </div>
                    )}
                    {f.status === 'reviewed' && f.therapist_notes && (
                      <div className="bg-green-50 rounded-2xl p-4">
                        <p className="text-xs font-semibold text-green-700 mb-1">Note del terapista</p>
                        <p className="text-sm text-green-800 whitespace-pre-line">{f.therapist_notes}</p>
                      </div>
                    )}
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
