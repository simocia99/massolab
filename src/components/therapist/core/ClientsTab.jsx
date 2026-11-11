import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Bell, Clock, Search, Star, User, UserCheck, UserPlus, Users } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { db } from '@/api/client';
import ClientDetail from './ClientDetail';

const VIEWS = [
  { id: 'all', label: 'Tutti i clienti', icon: Users, color: 'text-gray-700' },
  { id: 'new', label: 'Nuovi (30gg)', icon: UserPlus, color: 'text-blue-600' },
  { id: 'inactive_30', label: 'Assenti 30+ giorni', icon: Clock, color: 'text-amber-600' },
  { id: 'inactive_60', label: 'Assenti 60+ giorni', icon: Clock, color: 'text-orange-600' },
  { id: 'inactive_90', label: 'Assenti 90+ giorni', icon: Clock, color: 'text-red-600' },
  { id: 'review', label: 'Da recensire', icon: Star, color: 'text-yellow-600' },
  { id: 'followup', label: 'Da ricontattare', icon: Bell, color: 'text-purple-600' },
];

const JOURNEY_COLORS = {
  nuovo: 'bg-blue-100 text-blue-700',
  attivo: 'bg-green-100 text-green-700',
  da_ricontattare: 'bg-amber-100 text-amber-700',
  inattivo: 'bg-gray-100 text-gray-500',
  pacchetto: 'bg-purple-100 text-purple-700',
};

const emptyClient = (email, extra) => ({
  email,
  firstName: '',
  lastName: '',
  name: email,
  phone: '',
  appointments: [],
  registered: false,
  notes: '',
  goal: '',
  journey_status: 'nuovo',
  review_requested: false,
  manualId: null,
  firstApptDate: null,
  ...extra,
});

/** Merge every source of client data into one record per e-mail address. */
export function buildClients(appointments, manualPatients, accounts, guidedBookings, intakeForms) {
  const map = {};
  appointments.forEach((a) => {
    if (!a.email) return;
    if (!map[a.email]) {
      map[a.email] = emptyClient(a.email, {
        firstName: a.first_name,
        lastName: a.last_name,
        name: `${a.first_name} ${a.last_name}`,
        phone: a.phone || '',
        journey_status: 'attivo',
        firstApptDate: a.preferred_date || a.created_date,
      });
    }
    map[a.email].appointments.push(a);
    const d = a.preferred_date || a.created_date;
    if (d && (!map[a.email].firstApptDate || d < map[a.email].firstApptDate)) map[a.email].firstApptDate = d;
  });
  accounts.forEach((c) => {
    if (!c.email) return;
    if (map[c.email]) map[c.email].registered = true;
    else
      map[c.email] = emptyClient(c.email, {
        firstName: c.first_name,
        lastName: c.last_name,
        name: `${c.first_name} ${c.last_name}`,
        phone: c.phone || '',
        registered: true,
        firstApptDate: c.created_date,
      });
  });
  manualPatients.forEach((m) => {
    if (!m.email) return;
    if (!map[m.email])
      map[m.email] = emptyClient(m.email, {
        firstName: m.first_name,
        lastName: m.last_name,
        name: `${m.first_name} ${m.last_name}`,
        phone: m.phone || '',
        firstApptDate: m.created_date,
      });
    Object.assign(map[m.email], {
      notes: m.notes || '',
      goal: m.goal || '',
      journey_status: m.journey_status || 'attivo',
      review_requested: m.review_requested || false,
      manualId: m.id,
    });
  });
  guidedBookings.forEach((g) => {
    const email = g.client_email;
    if (!email) return;
    if (map[email]) {
      if (!map[email].phone && g.client_phone) map[email].phone = g.client_phone;
      return;
    }
    const parts = (g.client_name || '').trim().split(/\s+/);
    map[email] = emptyClient(email, {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || '',
      name: g.client_name || parts[0] || email,
      phone: g.client_phone || '',
      firstApptDate: g.created_date,
    });
  });
  intakeForms.forEach((f) => {
    const email = f.email;
    if (!email) return;
    const c = map[email];
    if (c) {
      if (!c.phone && f.phone) c.phone = f.phone;
      if (!c.firstName && f.first_name) c.firstName = f.first_name;
      if (!c.lastName && f.last_name) c.lastName = f.last_name;
      return;
    }
    map[email] = emptyClient(email, {
      firstName: f.first_name || '',
      lastName: f.last_name || '',
      name: `${f.first_name || ''} ${f.last_name || ''}`.trim() || email,
      phone: f.phone || '',
      firstApptDate: f.created_date,
    });
  });
  return Object.values(map);
}

/** Days since the last confirmed/completed session (null if none). */
export function daysSinceLastSession(client) {
  const done = client.appointments.filter((a) => a.status === 'completed' || a.status === 'confirmed');
  if (!done.length) return null;
  const last = [...done].sort(
    (a, b) => new Date(b.preferred_date || b.created_date) - new Date(a.preferred_date || a.created_date),
  )[0].preferred_date;
  return last ? differenceInDays(new Date(), parseISO(last)) : null;
}

const isNewClient = (c) => !!c.firstApptDate && differenceInDays(new Date(), parseISO(c.firstApptDate.slice(0, 10))) <= 30;

const VIEW_FILTERS = {
  all: () => true,
  new: isNewClient,
  inactive_30: (c) => {
    const d = daysSinceLastSession(c);
    return d !== null && d >= 30 && d < 60;
  },
  inactive_60: (c) => {
    const d = daysSinceLastSession(c);
    return d !== null && d >= 60 && d < 90;
  },
  inactive_90: (c) => {
    const d = daysSinceLastSession(c);
    return d !== null && d >= 90;
  },
  review: (c) => {
    const d = daysSinceLastSession(c);
    return d !== null && d >= 2 && d <= 14 && !c.review_requested;
  },
  followup: (c) => c.journey_status === 'da_ricontattare',
};

function ViewFilters({ activeView, onChange, counts }) {
  return (
    <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible">
      {VIEWS.map(({ id, label, icon: Icon, color }) => {
        const count = counts?.[id] ?? 0;
        const active = activeView === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap flex-shrink-0 ${active ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
          >
            <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : color}`} />
            {label}
            {count > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function ClientsTab({ appointments }) {
  const [search, setSearch] = useState('');
  const [view, setView] = useState('all');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [sources, setSources] = useState({ manual: [], accounts: [], guided: [], intake: [] });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // Bug fix: the original read `.items` from list() results, which are plain arrays.
    Promise.all([
      db.entities.ManualPatient.list(null, 500),
      db.entities.ClientAccount.list(null, 500),
      db.entities.GuidedBooking.list(null, 500),
      db.entities.IntakeForm.list(null, 500),
    ])
      .then(([manual, accounts, guided, intake]) => {
        if (!cancelled) setSources({ manual, accounts, guided, intake });
      })
      .catch(() => !cancelled && toast.error('Impossibile caricare i dati dei clienti'));
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const clients = useMemo(
    () => buildClients(appointments, sources.manual, sources.accounts, sources.guided, sources.intake),
    [appointments, sources],
  );

  const counts = useMemo(
    () => Object.fromEntries(Object.entries(VIEW_FILTERS).map(([id, fn]) => [id, clients.filter(fn).length])),
    [clients],
  );

  const visible = useMemo(() => {
    let list = clients.filter(VIEW_FILTERS[view]);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.phone || '').includes(q),
      );
    }
    return [...list].sort((a, b) => b.appointments.length - a.appointments.length);
  }, [clients, view, search]);

  const selected = selectedEmail ? clients.find((c) => c.email === selectedEmail) : null;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">CRM Clienti</h2>
        <p className="text-gray-500 text-sm">{clients.length} clienti totali</p>
      </div>
      <ViewFilters
        activeView={view}
        onChange={(id) => {
          setView(id);
          setSelectedEmail(null);
        }}
        counts={counts}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div
          className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex-col ${selected ? 'hidden lg:flex' : 'flex'}`}
        >
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca per nome, email, tel..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Cerca clienti"
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400"
              />
            </div>
          </div>
          <div className="flex-1 divide-y divide-gray-50 overflow-y-auto lg:max-h-[calc(100vh-320px)]">
            {visible.length === 0 && <p className="p-6 text-center text-gray-400 text-sm">Nessun cliente trovato.</p>}
            {visible.map((c) => {
              const days = daysSinceLastSession(c);
              return (
                <button
                  key={c.email}
                  onClick={() => setSelectedEmail(c.email)}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${selectedEmail === c.email ? 'bg-red-50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-red-600 font-bold text-sm">{c.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-gray-900 text-sm truncate">{c.name}</p>
                        {c.registered && <UserCheck className="w-3 h-3 text-green-500 flex-shrink-0" aria-label="Registrato" />}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-gray-400">{c.appointments.length} sedute</p>
                        {days !== null && (
                          <span
                            className={`text-[10px] font-semibold ${days >= 90 ? 'text-red-500' : days >= 60 ? 'text-orange-500' : days >= 30 ? 'text-amber-500' : 'text-gray-400'}`}
                          >
                            · {days}gg fa
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${JOURNEY_COLORS[c.journey_status] || 'bg-gray-100 text-gray-500'}`}
                    >
                      {c.journey_status || 'attivo'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div
          className={`lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${selected ? 'block' : 'hidden lg:block'}`}
        >
          {selected ? (
            <div className="h-full lg:overflow-y-auto lg:max-h-[calc(100vh-200px)]">
              <div className="lg:hidden p-4 border-b border-gray-100">
                <button onClick={() => setSelectedEmail(null)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800">
                  <ArrowLeft className="w-4 h-4" /> Torna alla lista
                </button>
              </div>
              <div className="p-4 sm:p-6">
                <ClientDetail client={selected} onUpdate={() => setReloadKey((k) => k + 1)} />
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-300">
              <div className="text-center">
                <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Seleziona un cliente per aprire la scheda</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
