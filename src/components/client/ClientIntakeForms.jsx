import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { db } from '@/api/client';
import { createPageUrl } from '@/lib/utils';

const STATUS = {
  incomplete: { label: 'Incompleto', color: 'bg-gray-100 text-gray-500' },
  completed: { label: 'Compilato', color: 'bg-green-100 text-green-700' },
  reviewed: { label: 'Revisionato', color: 'bg-blue-100 text-blue-700' },
};

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-gray-700 mt-0.5">{value}</p>
    </div>
  );
}

/** "Schede" tab: the client's intake forms (bundle `q2`). */
export default function ClientIntakeForms({ clientEmail }) {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    db.entities.IntakeForm.filter({ email: clientEmail })
      .then((rows) => alive && setForms([...rows].sort((a, b) => new Date(b.created_date) - new Date(a.created_date))))
      .catch(() => alive && setError('Impossibile caricare le schede. Riprova più tardi.'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [clientEmail]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-7 h-7 rounded-full border-2 border-red-200 border-t-red-600 animate-spin" />
      </div>
    );
  }

  if (!forms.length) {
    return (
      <div className="text-center py-16 text-gray-400">
        <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
        {error ? <p className="mb-4 text-red-600">{error}</p> : <p className="mb-4">Nessun modulo compilato.</p>}
        <Link
          to={createPageUrl('IntakeForm')}
          className="inline-block bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          Compila ora →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-bold text-gray-900">Schede salute compilate</h2>
        <Link to={createPageUrl('IntakeForm')} className="text-xs text-red-600 hover:underline font-semibold">
          + Nuova scheda
        </Link>
      </div>
      {forms.map((f) => {
        const status = STATUS[f.status] || STATUS.incomplete;
        const open = openId === f.id;
        return (
          <div key={f.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button
              type="button"
              aria-expanded={open}
              className="w-full flex items-center justify-between p-5 text-left"
              onClick={() => setOpenId(open ? null : f.id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    Scheda del {new Date(f.created_date).toLocaleDateString('it-IT')}
                  </p>
                  {f.visit_reason && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{f.visit_reason}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.color}`}>{status.label}</span>
                {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>
            </button>
            {open && (
              <div className="px-5 pb-5 space-y-3 border-t border-gray-50 pt-4">
                <Field label="Motivo visita" value={f.visit_reason} />
                <Field label="Area del corpo" value={f.body_area} />
                <Field label="Durata del problema" value={f.problem_duration} />
                {f.pain_intensity ? <Field label="Intensità dolore" value={`${f.pain_intensity}/10`} /> : null}
                <Field label="Attività lavorativa" value={f.job_activity} />
                <Field label="Attività sportiva" value={f.sport_activity} />
                <Field label="Trattamenti precedenti" value={f.previous_treatments} />
                {f.contraindications && <Field label="Controindicazioni segnalate" value={f.contraindications} />}
                {f.therapist_notes && (
                  <div className="bg-blue-50 rounded-xl p-3 mt-2">
                    <p className="text-xs font-bold text-blue-700 mb-1">Note di Simone</p>
                    <p className="text-sm text-blue-800">{f.therapist_notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
