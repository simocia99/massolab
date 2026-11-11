import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, FileText, Mail, MessageCircle, Package, Save, Star, Target } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/api/client';
import { absolutePageUrl, escapeHtml } from '@/lib/utils';
import { waPhone } from './shared';

export const JOURNEY_STATUSES = [
  { value: 'nuovo', label: 'Nuovo', color: 'bg-blue-100 text-blue-700' },
  { value: 'attivo', label: 'Attivo', color: 'bg-green-100 text-green-700' },
  { value: 'da_ricontattare', label: 'Da ricontattare', color: 'bg-amber-100 text-amber-700' },
  { value: 'inattivo', label: 'Inattivo', color: 'bg-gray-100 text-gray-500' },
  { value: 'pacchetto', label: 'Con pacchetto', color: 'bg-purple-100 text-purple-700' },
];

const APPT_STATUS = {
  pending: { label: 'In attesa', color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Confermato', color: 'bg-green-100 text-green-700' },
  completed: { label: 'Completato', color: 'bg-blue-100 text-blue-700' },
  cancelled: { label: 'Annullato', color: 'bg-red-100 text-red-600' },
};

const apptTime = (a) => new Date(a.preferred_date || a.created_date);

export default function ClientDetail({ client, onUpdate }) {
  const [notes, setNotes] = useState(client.notes || '');
  const [goal, setGoal] = useState(client.goal || '');
  const [journey, setJourney] = useState(client.journey_status || 'nuovo');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [intakeForms, setIntakeForms] = useState([]);
  const [packages, setPackages] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [requestingReview, setRequestingReview] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setNotes(client.notes || '');
    setGoal(client.goal || '');
    setJourney(client.journey_status || 'nuovo');
    Promise.all([
      db.entities.IntakeForm.filter({ email: client.email }),
      db.entities.TreatmentPackage.filter({ client_email: client.email }),
    ])
      .then(([forms, pkgs]) => {
        if (cancelled) return;
        setIntakeForms(forms);
        setPackages(pkgs.filter((p) => p.status === 'active'));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client.email]);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(t);
  }, [saved]);

  const save = async () => {
    setSaving(true);
    try {
      const existing = await db.entities.ManualPatient.filter({ email: client.email });
      if (existing.length > 0) {
        await db.entities.ManualPatient.update(existing[0].id, { notes, goal, journey_status: journey });
      } else {
        await db.entities.ManualPatient.create({
          notes,
          goal,
          journey_status: journey,
          first_name: client.firstName,
          last_name: client.lastName,
          email: client.email,
          phone: client.phone,
        });
      }
      setSaved(true);
      onUpdate?.();
    } catch (e) {
      toast.error(e.message || 'Salvataggio non riuscito');
    } finally {
      setSaving(false);
    }
  };

  const requestReview = async () => {
    setRequestingReview(true);
    try {
      const existing = await db.entities.ManualPatient.filter({ email: client.email });
      const reviewUrl = `${absolutePageUrl('LeaveReview')}?name=${encodeURIComponent(`${client.firstName} ${client.lastName}`)}`;
      await db.integrations.Core.SendEmail({
        to: client.email,
        from_name: 'MassoLab — Simone Ciacchi',
        subject: 'Come ti sei trovato? Lascia una recensione 🌟',
        body: `<div style="font-family:sans-serif;max-width:500px;margin:auto;padding:28px;background:#f9fafb;border-radius:16px;">
        <h2 style="color:#dc2626;">La tua opinione conta!</h2>
        <p>Ciao <strong>${escapeHtml(client.firstName)}</strong>,</p>
        <p>Come ti sei trovato con il trattamento? Sarei molto felice se potessi lasciare una breve recensione — ci vuole solo un minuto e mi aiuta tantissimo.</p>
        <div style="text-align:center;margin:24px 0;">
          <a href="${escapeHtml(reviewUrl)}" style="background:#dc2626;color:white;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:bold;">⭐ Lascia una recensione</a>
        </div>
        <p style="color:#9ca3af;font-size:12px;">Grazie di cuore — Simone Ciacchi</p>
      </div>`,
      });
      if (existing.length > 0) await db.entities.ManualPatient.update(existing[0].id, { review_requested: true });
      toast.success('Email per recensione inviata!');
      onUpdate?.();
    } catch (e) {
      toast.error(e.message || 'Invio non riuscito');
    } finally {
      setRequestingReview(false);
    }
  };

  const journeyInfo = JOURNEY_STATUSES.find((s) => s.value === journey);
  const history = [...(client.appointments || [])].sort((a, b) => apptTime(b) - apptTime(a));
  const last = history[0];
  const daysSince = last?.preferred_date ? Math.floor((new Date() - new Date(last.preferred_date)) / 864e5) : null;

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center flex-shrink-0">
          <span className="text-red-600 font-black text-xl">{client.name.charAt(0).toUpperCase()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xl font-bold text-gray-900">{client.name}</h3>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${journeyInfo?.color}`}>{journeyInfo?.label}</span>
          </div>
          <p className="text-gray-400 text-sm break-all">
            {client.appointments?.length || 0} trattamento/i · {client.email}
          </p>
          {daysSince !== null && (
            <p className={`text-xs mt-1 font-semibold ${daysSince > 60 ? 'text-red-500' : daysSince > 30 ? 'text-amber-500' : 'text-gray-400'}`}>
              {daysSince === 0 ? 'Seduta oggi' : `Ultima seduta ${daysSince} giorni fa`}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <a href={`mailto:${client.email}`} className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
          <Mail className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-700 truncate">{client.email}</span>
        </a>
        {client.phone && (
          <a
            href={`https://wa.me/${waPhone(client.phone)}?text=${encodeURIComponent(`Ciao ${client.firstName}!`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 bg-green-50 hover:bg-green-100 rounded-xl transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-gray-700">{client.phone}</span>
          </a>
        )}
      </div>

      {packages.length > 0 && (
        <div className="bg-purple-50 rounded-xl p-4">
          <p className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Package className="w-3.5 h-3.5" /> Pacchetti attivi
          </p>
          {packages.map((p) => (
            <div key={p.id} className="flex items-center justify-between">
              <span className="text-sm text-purple-900 font-medium">{p.package_name}</span>
              <span className="text-sm font-bold text-purple-700">{p.total_sessions - (p.used_sessions || 0)} rimaste</span>
            </div>
          ))}
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Stato percorso</label>
        <div className="flex flex-wrap gap-2">
          {JOURNEY_STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => setJourney(s.value)}
              aria-pressed={journey === s.value}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border-2 transition-all ${journey === s.value ? 'border-gray-900 ' + s.color : 'border-transparent ' + s.color + ' opacity-50'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="client-goal" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <Target className="w-3.5 h-3.5" /> Obiettivo del cliente
        </label>
        <input
          id="client-goal"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="es. ridurre il dolore lombare, recupero sportivo..."
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400"
        />
      </div>

      <div>
        <label htmlFor="client-notes" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
          Note interne
        </label>
        <textarea
          id="client-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Controindicazioni, preferenze, osservazioni..."
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400 resize-none"
        />
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl py-3 text-sm font-bold transition-colors disabled:opacity-50"
      >
        <Save className="w-4 h-4" />
        {saving ? 'Salvataggio...' : saved ? '✓ Salvato' : 'Salva scheda'}
      </button>

      {intakeForms.length > 0 && (
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" /> Schede salute ({intakeForms.length})
          </p>
          {intakeForms.slice(0, 2).map((f) => (
            <div key={f.id} className="text-sm text-blue-800 py-1 border-b border-blue-100 last:border-0">
              <span className="font-medium">{new Date(f.created_date).toLocaleDateString('it-IT')}</span>
              {f.visit_reason && <span className="text-blue-600 ml-2 text-xs">— {f.visit_reason.slice(0, 40)}</span>}
            </div>
          ))}
        </div>
      )}

      <div>
        <button
          className="flex items-center justify-between w-full mb-3"
          onClick={() => setHistoryOpen((o) => !o)}
          aria-expanded={historyOpen}
        >
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Storico appuntamenti ({history.length})</span>
          {historyOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
        {historyOpen && (
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {history.length === 0 && <p className="text-sm text-gray-400 py-2 text-center">Nessun appuntamento</p>}
            {history.map((a) => {
              const st = APPT_STATUS[a.status] || APPT_STATUS.pending;
              return (
                <div key={a.id} className="flex items-center justify-between gap-2 p-3 bg-gray-50 rounded-xl">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{a.treatment_type}</p>
                    <p className="text-xs text-gray-400">
                      {a.preferred_date} {a.preferred_time}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${st.color}`}>{st.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button
        onClick={requestReview}
        disabled={requestingReview}
        className="w-full flex items-center justify-center gap-2 border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
      >
        <Star className="w-4 h-4" /> Richiedi recensione via email
      </button>
    </div>
  );
}
