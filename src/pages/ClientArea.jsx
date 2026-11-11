import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, CalendarDays, CirclePlus, ClipboardList, LogOut, MessageCircle, Package, TrendingUp, User, Watch } from 'lucide-react';
import { db } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { createPageUrl } from '@/lib/utils';
import { ensureClientProfile } from '@/components/client/clientProfile';
import NotificationsBanner from '@/components/client/NotificationsBanner';
import BookFromArea from '@/components/client/BookFromArea';
import { BE as ClientAppointments } from '@/xref/content';
import ClientPackages from '@/components/client/ClientPackages';
import ClientIntakeForms from '@/components/client/ClientIntakeForms';
import ClientInstructions from '@/components/client/ClientInstructions';
import ClientProgress from '@/components/client/ClientProgress';
import ClientHealthData from '@/components/client/ClientHealthData';
import ClientMessages from '@/components/client/ClientMessages';

const TABS = [
  { id: 'appointments', label: 'Appuntamenti', icon: CalendarDays },
  { id: 'book', label: 'Prenota', icon: CirclePlus },
  { id: 'packages', label: 'Pacchetti', icon: Package },
  { id: 'forms', label: 'Schede', icon: ClipboardList },
  { id: 'progress', label: 'Andamento', icon: Activity },
  { id: 'instructions', label: 'Indicazioni', icon: TrendingUp },
  { id: 'health', label: 'Salute', icon: Watch },
  { id: 'messages', label: 'Messaggi', icon: MessageCircle },
];
const STATUS_NOTIFICATION = {
  confirmed: 'Appuntamento Confermato ✓',
  cancelled: 'Appuntamento Annullato',
  completed: 'Sessione Completata',
};
const POLL_MS = 30_000;

const byDateDesc = (a, b) =>
  new Date(b.preferred_date || b.created_date) - new Date(a.preferred_date || a.created_date);

function Spinner() {
  return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 rounded-full border-2 border-red-200 border-t-red-600 animate-spin" />
    </div>
  );
}

export default function ClientArea() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const { user, isLoadingAuth, logout } = useAuth();
  const tabFromUrl = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : null;
  const [tab, setTab] = useState(tabFromUrl || 'appointments');
  const [client, setClient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const knownStatuses = useRef(null); // id -> status, for status-change notifications
  const loggingOut = useRef(false);

  const email = user?.email || '';

  // Not logged in -> login page, then back here.
  useEffect(() => {
    if (!isLoadingAuth && !user && !loggingOut.current) {
      navigate(`${createPageUrl('ClientLogin')}?next=${encodeURIComponent(location.pathname + location.search)}`, {
        replace: true,
      });
    }
  }, [isLoadingAuth, user, navigate, location.pathname, location.search]);

  useEffect(() => {
    if (tabFromUrl) setTab(tabFromUrl);
  }, [tabFromUrl]);

  const loadAppointments = useCallback(async () => {
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      const rows = await db.entities.Appointment.filter({ email });
      setAppointments([...rows].sort(byDateDesc));
      knownStatuses.current = Object.fromEntries(rows.map((a) => [a.id, a.status]));
    } catch {
      setError('Impossibile caricare gli appuntamenti. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    if (!user) return undefined;
    let alive = true;
    ensureClientProfile(user).then((p) => alive && setClient(p));
    loadAppointments();
    return () => {
      alive = false;
    };
  }, [user, loadAppointments]);

  // Poll for status changes made by the therapist and show a browser notification.
  useEffect(() => {
    if (!email) return undefined;
    const id = setInterval(async () => {
      try {
        const rows = await db.entities.Appointment.filter({ email });
        const known = knownStatuses.current || {};
        let changed = false;
        rows.forEach((a) => {
          const before = known[a.id];
          if (before !== a.status) changed = true;
          const title = STATUS_NOTIFICATION[a.status];
          if (before && before !== a.status && title && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification('MassoLab', {
              body: `${title} — ${a.treatment_type} del ${a.preferred_date}`,
              icon: `${import.meta.env.BASE_URL}images/logo.png`,
            });
          }
        });
        knownStatuses.current = Object.fromEntries(rows.map((a) => [a.id, a.status]));
        if (changed || rows.length !== Object.keys(known).length) setAppointments([...rows].sort(byDateDesc));
      } catch {
        /* transient network error: retry at next tick */
      }
    }, POLL_MS);
    return () => clearInterval(id);
  }, [email]);

  const handleLogout = async () => {
    loggingOut.current = true;
    await logout();
    navigate(createPageUrl('Home'));
  };

  if (isLoadingAuth || !user) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <Spinner />
      </div>
    );
  }

  const profile = client || { email, first_name: user.first_name, last_name: user.last_name, phone: '' };
  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="bg-white/80 backdrop-blur-xl border-b border-black/[0.06] sticky top-16 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#56695C]/10 flex items-center justify-center">
              <User className="w-4 h-4 text-[#56695C]" />
            </div>
            <div>
              <p className="font-black text-[#191A17] text-sm" style={{ letterSpacing: '-0.02em' }}>
                {profile.first_name} {profile.last_name}
              </p>
              <p className="text-xs text-[#6A685F]">{email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Esci"
            className="flex items-center gap-1.5 min-h-[44px] text-sm font-semibold text-[#6A685F] hover:text-[#56695C] transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Esci</span>
          </button>
        </div>
        <div className="max-w-4xl mx-auto px-4 pb-3 pt-1 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1.5" role="tablist">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setTab(id);
                    if (params.has('tab')) setParams({}, { replace: true });
                  }}
                  className={`flex items-center gap-1.5 px-3.5 min-h-[44px] text-[13px] font-semibold rounded-full whitespace-nowrap flex-shrink-0 transition-all duration-200 ${active ? 'bg-[#191A17] text-white' : 'text-[#6A685F] hover:text-[#191A17] hover:bg-[#F3F0EA]'}`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <NotificationsBanner />
        </div>
        {error && <p className="text-danger text-sm bg-danger-soft rounded-xl px-4 py-2 mb-4">{error}</p>}
        {loading ? (
          <Spinner />
        ) : (
          <motion.div key={tab} initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ ease: [0.28, 0.11, 0.32, 1], duration: 0.2 }}>
            {tab === 'book' && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-6">Prenota un Appuntamento</h2>
                <BookFromArea client={profile} onBooked={loadAppointments} />
              </div>
            )}
            {tab === 'appointments' && <ClientAppointments appointments={appointments} onRefresh={loadAppointments} />}
            {tab === 'packages' && <ClientPackages clientEmail={email} />}
            {tab === 'forms' && <ClientIntakeForms clientEmail={email} />}
            {tab === 'instructions' && <ClientInstructions clientEmail={email} />}
            {tab === 'progress' && <ClientProgress clientEmail={email} />}
            {tab === 'health' && <ClientHealthData clientEmail={email} clientName={fullName} />}
            {tab === 'messages' && <ClientMessages clientEmail={email} clientName={fullName} />}
          </motion.div>
        )}
      </div>
    </div>
  );
}
