import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import {
  Bell,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  CircleCheckBig,
  Clock,
  Mail,
  PenLine,
  RefreshCw,
  Save,
  Send,
  Star,
  UserX,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/api/client';
import { absolutePageUrl } from '@/lib/utils';
import { AUTOMATION_KEYS, DEFAULT_AUTOMATIONS } from '@/lib/automations';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Switch, Textarea } from './ui';

export const AUTOMATION_META = {
  booking_confirm: {
    icon: CircleCheckBig,
    color: 'text-green-600',
    bg: 'bg-green-50',
    description: 'Inviata quando un appuntamento viene confermato dal terapista',
  },
  reminder_24h: {
    icon: Clock,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    description: "Inviata automaticamente 24 ore prima dell'appuntamento",
  },
  reminder_2h: {
    icon: Bell,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    description: "Inviata automaticamente 2 ore prima dell'appuntamento",
  },
  post_treatment: {
    icon: Mail,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    description: 'Inviata 24 ore dopo il trattamento completato',
  },
  review_request: {
    icon: Star,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    description: 'Inviata 48 ore dopo il trattamento per raccogliere recensioni',
  },
  rebooking: {
    icon: RefreshCw,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    description: 'Inviata ~3 settimane dopo per invitare a riprenotare',
  },
  win_back: {
    icon: UserX,
    color: 'text-red-600',
    bg: 'bg-red-50',
    description: 'Inviata a clienti che non prenotano da 60+ giorni',
  },
};

// Template preview with sample values.
const preview = (text, vars = {}) =>
  text
    ? text
        .replace(/{{nome}}/g, vars.nome || 'Marco')
        .replace(/{{trattamento}}/g, vars.trattamento || 'Massaggio Sportivo')
        .replace(/{{data}}/g, vars.data || 'Venerdì 21 Marzo')
        .replace(/{{ora}}/g, vars.ora || '10:00')
        .replace(/{{review_url}}/g, absolutePageUrl('LeaveReview'))
        .replace(/{{booking_url}}/g, absolutePageUrl('GuestBooking'))
    : '';

function StatTile({ label, value, color }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

/** Send history of one automation. */
export function AutomationLogList({ logs }) {
  if (logs.length === 0) return <p className="text-xs text-gray-400 text-center py-3">Nessun invio registrato.</p>;
  return (
    <div className="space-y-1 max-h-48 overflow-y-auto">
      {logs.slice(0, 50).map((l) => (
        <div key={l.id} className="flex items-center justify-between gap-2 text-xs py-1.5 px-2 rounded-lg bg-gray-50">
          <div className="flex items-center gap-2 min-w-0">
            {l.status === 'sent' ? (
              <Send className="w-3 h-3 text-green-500 flex-shrink-0" />
            ) : l.status === 'pending' ? (
              <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />
            ) : (
              <CircleAlert className="w-3 h-3 text-red-500 flex-shrink-0" />
            )}
            <span className="font-medium text-gray-700 truncate" title={l.error || undefined}>
              {l.client_name || l.client_email}
            </span>
          </div>
          <span className="text-gray-400 flex-shrink-0">
            {l.sent_at ? format(parseISO(l.sent_at), 'dd MMM HH:mm', { locale: it }) : '—'}
          </span>
        </div>
      ))}
    </div>
  );
}

// `appointments` is accepted for API compatibility with the dashboard (unused, as in the original).
// eslint-disable-next-line no-unused-vars
export default function AutomationsSettings({ appointments = [] }) {
  const [automations, setAutomations] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});
  const [historyKey, setHistoryKey] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let [settings, log] = await Promise.all([
          db.entities.AutomationSettings.list(),
          db.entities.AutomationLog.list('-sent_at', 200),
        ]);
        // First run: create the default templates (disabled) so there is something to configure.
        const missing = DEFAULT_AUTOMATIONS.filter((d) => !settings.some((s) => s.automation_key === d.automation_key));
        if (missing.length > 0) {
          const created = await db.entities.AutomationSettings.bulkCreate(
            missing.map((d) => ({ ...d, enabled: false })),
          );
          settings = [...settings, ...created];
        }
        if (!cancelled) {
          setAutomations(settings);
          setLogs(log);
        }
      } catch {
        if (!cancelled) toast.error('Impossibile caricare le automazioni.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = async (auto) => {
    try {
      await db.entities.AutomationSettings.update(auto.id, { enabled: !auto.enabled });
      setAutomations((list) => list.map((a) => (a.id === auto.id ? { ...a, enabled: !a.enabled } : a)));
    } catch {
      toast.error('Aggiornamento non riuscito.');
    }
  };

  const startEdit = (auto) => {
    setEditingId(auto.id);
    setDraft({ subject: auto.subject, body: auto.body, label: auto.label });
  };

  const saveTemplate = async () => {
    setSaving(true);
    try {
      await db.entities.AutomationSettings.update(editingId, draft);
      setAutomations((list) => list.map((a) => (a.id === editingId ? { ...a, ...draft } : a)));
      setEditingId(null);
      toast.success('Template salvato');
    } catch {
      toast.error('Salvataggio non riuscito. Riprova.');
    } finally {
      setSaving(false);
    }
  };

  const logsFor = (key) => logs.filter((l) => l.automation_key === key);
  const ordered = AUTOMATION_KEYS.map((k) => automations.find((a) => a.automation_key === k)).filter(Boolean);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-0 sm:p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Automazioni Email</h2>
        <p className="text-gray-500 text-sm mt-1">
          Gestisci i messaggi automatici inviati ai clienti. Ogni automazione può essere attivata, disattivata e
          personalizzata.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <StatTile label="Automazioni attive" value={automations.filter((a) => a.enabled).length} color="text-green-600" />
        <StatTile
          label="Email inviate (totale)"
          value={logs.filter((l) => l.status === 'sent').length}
          color="text-blue-600"
        />
        <StatTile label="Fallite" value={logs.filter((l) => l.status === 'failed').length} color="text-red-600" />
      </div>

      <div className="space-y-4">
        {ordered.map((auto) => {
          const meta = AUTOMATION_META[auto.automation_key] || {};
          const Icon = meta.icon || Bell;
          const autoLogs = logsFor(auto.automation_key);
          const editing = editingId === auto.id;
          const showHistory = historyKey === auto.automation_key;
          return (
            <Card key={auto.id} className={`border ${auto.enabled ? 'border-gray-200' : 'border-gray-100 opacity-70'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${meta.bg || 'bg-gray-50'}`}>
                      <Icon className={`w-5 h-5 ${meta.color || 'text-gray-600'}`} />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base font-semibold text-gray-900">{auto.label}</CardTitle>
                      <p className="text-xs text-gray-500 mt-0.5">{meta.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row items-end sm:items-center gap-2 sm:gap-3 shrink-0">
                    <Badge className="text-xs whitespace-nowrap">{autoLogs.length} inviati</Badge>
                    <Switch
                      checked={!!auto.enabled}
                      onCheckedChange={() => toggle(auto)}
                      aria-label={`Attiva ${auto.label}`}
                    />
                  </div>
                </div>
              </CardHeader>
              {editing ? (
                <CardContent className="pt-0 space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block" htmlFor={`label-${auto.id}`}>
                      Label
                    </label>
                    <Input
                      id={`label-${auto.id}`}
                      value={draft.label || ''}
                      onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block" htmlFor={`subj-${auto.id}`}>
                      Oggetto email
                    </label>
                    <Input
                      id={`subj-${auto.id}`}
                      value={draft.subject || ''}
                      onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block" htmlFor={`body-${auto.id}`}>
                      Corpo messaggio
                      <span className="ml-2 font-normal text-gray-400 normal-case break-words">
                        Variabili: {'{{nome}} {{trattamento}} {{data}} {{ora}} {{review_url}} {{booking_url}}'}
                      </span>
                    </label>
                    <Textarea
                      id={`body-${auto.id}`}
                      value={draft.body || ''}
                      onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
                      rows={10}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>
                      <X className="w-3.5 h-3.5 mr-1.5" /> Annulla
                    </Button>
                    <Button size="sm" onClick={saveTemplate} disabled={saving}>
                      <Save className="w-3.5 h-3.5 mr-1.5" /> {saving ? 'Salvo...' : 'Salva template'}
                    </Button>
                  </div>
                </CardContent>
              ) : (
                <CardContent className="pt-0 space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    <p className="text-xs font-semibold text-gray-500 mb-1">OGGETTO</p>
                    <p className="text-gray-700 break-words">{auto.subject}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    <p className="text-xs font-semibold text-gray-500 mb-1">MESSAGGIO</p>
                    <pre className="text-gray-700 whitespace-pre-wrap break-words font-sans text-sm leading-relaxed">
                      {preview(auto.body)}
                    </pre>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      onClick={() => setHistoryKey(showHistory ? null : auto.automation_key)}
                      className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1"
                      aria-expanded={showHistory}
                    >
                      {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      Storico invii ({autoLogs.length})
                    </button>
                    <Button size="sm" variant="outline" onClick={() => startEdit(auto)}>
                      <PenLine className="w-3.5 h-3.5 mr-1.5" /> Modifica template
                    </Button>
                  </div>
                  {showHistory && <AutomationLogList logs={autoLogs} />}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
