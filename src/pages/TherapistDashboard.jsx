import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/api/client';
import TherapistGuard from '@/components/therapist/core/TherapistGuard';
import Sidebar, { BOTTOM_TABS, tabLabel } from '@/components/therapist/core/Sidebar';
import OverviewTab from '@/components/therapist/core/OverviewTab';
import BookingsTab from '@/components/therapist/core/BookingsTab';
import CalendarTab from '@/components/therapist/core/CalendarTab';
import { Spinner } from '@/components/therapist/core/shared';
import MorningReport from '@/components/therapist/core/MorningReport';
import { enableStudioPwa } from '@/lib/pwa';

// Less-used / heavy tabs are code-split so the dashboard opens fast on a phone.
const ClientsTab = lazy(() => import('@/components/therapist/core/ClientsTab'));
const MessagesTab = lazy(() => import('@/components/therapist/core/MessagesTab'));
const ReviewsTab = lazy(() => import('@/components/therapist/core/ReviewsTab'));
const ClientReportsTab = lazy(() => import('@/components/therapist/core/ClientReportsTab'));
const PatientProgressTab = lazy(() => import('@/components/therapist/core/PatientProgressTab'));
const PatientDocumentsTab = lazy(() => import('@/components/therapist/core/PatientDocumentsTab'));
const ShareSiteTab = lazy(() => import('@/components/therapist/core/ShareSiteTab'));

// Tabs implemented by area therapistB (imported by minified name).
const loadB = () => import('@/xref/therapistB');
const lazyB = (name) => lazy(() => loadB().then((m) => ({ default: m[name] })));
const BlogManager = lazyB('m6');
const TherapistSettings = lazyB('x6');
const PackagesManager = lazyB('T6');
const GuidedBookings = lazyB('k6');
const IntakeForms = lazyB('M6');
const Automations = lazyB('vte');
const ExercisePrograms = lazyB('Ste');
const Pricing = lazyB('Tte');
const HealthData = lazyB('Dte');

const runAutomations = () =>
  loadB()
    .then((m) => m.j9())
    .catch((e) => console.warn('Automazioni non eseguite:', e));

/** Day-before reminders, deduplicated via AutomationLog (works across devices). */
const sendTomorrowReminders = (appointments) =>
  loadB()
    .then((m) => m.sendTomorrowReminders(appointments))
    .catch((e) => console.warn('Promemoria non inviati:', e));

function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const loadAppointments = useCallback(async () => {
    try {
      const rows = await db.entities.Appointment.list('-created_date', 500);
      setAppointments(rows);
      setLoadError(false);
      return rows;
    } catch {
      setLoadError(true);
      toast.error('Impossibile caricare le prenotazioni');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadAppointments().then((rows) => {
      if (!cancelled && rows) sendTomorrowReminders(rows);
    });
    const interval = setInterval(runAutomations, 3_600_000);
    const first = setTimeout(runAutomations, 10_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
      clearTimeout(first);
    };
  }, [loadAppointments]);

  // Lock page scroll while the mobile drawer is open.
  useEffect(() => {
    if (!menuOpen) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const selectTab = (tab) => {
    setActiveTab(tab);
    setMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const renderTab = () => {
    if (loading) return <Spinner />;
    if (loadError && appointments.length === 0)
      return (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <p className="text-gray-600 mb-4">Impossibile caricare i dati. Controlla la connessione e riprova.</p>
          <button
            onClick={() => {
              setLoading(true);
              loadAppointments();
            }}
            className="bg-[#56695C] hover:bg-[#46574B] text-white rounded-full px-5 min-h-[44px] text-sm font-semibold transition-colors duration-300 ease-apple"
          >
            Riprova
          </button>
        </div>
      );
    const props = { appointments };
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            <MorningReport appointments={appointments} onNavigate={selectTab} />
            <OverviewTab {...props} />
          </div>
        );
      case 'bookings':
        return <BookingsTab {...props} onRefresh={loadAppointments} />;
      case 'calendar':
        return <CalendarTab {...props} />;
      case 'clients':
      case 'crm':
        return <ClientsTab {...props} />;
      case 'messages':
        return <MessagesTab {...props} />;
      case 'reviews':
        return <ReviewsTab />;
      case 'client_reports':
        return <ClientReportsTab {...props} />;
      case 'patient_progress':
        return <PatientProgressTab {...props} />;
      case 'patient_files':
        return <PatientDocumentsTab {...props} />;
      case 'share':
        return <ShareSiteTab />;
      case 'blog':
        return <BlogManager />;
      case 'availability':
        return <TherapistSettings />;
      case 'packages':
        return <PackagesManager />;
      case 'guided_bookings':
        return <GuidedBookings />;
      case 'intake_forms':
        return <IntakeForms />;
      case 'automations':
        return <Automations {...props} />;
      case 'exercise_programs':
        return <ExercisePrograms {...props} />;
      case 'pricing':
        return <Pricing />;
      case 'health_data':
        return <HealthData />;
      default:
        return null;
    }
  };

  const inOther = !BOTTOM_TABS.some((t) => t.tab === activeTab);

  return (
    <div className="flex min-h-screen supports-[min-height:100dvh]:min-h-[100dvh] bg-[#F3F0EA] [-webkit-tap-highlight-color:transparent]">
      <div className="hidden lg:block sticky top-0 h-screen flex-shrink-0">
        <Sidebar activeTab={activeTab} setActiveTab={selectTab} />
      </div>

      {/* "Altro": foglio dal basso con il menu completo (solo telefono/tablet) */}
      <AnimatePresence>
        {menuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu completo">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ ease: [0.28, 0.11, 0.32, 1], duration: 0.25 }}
              className="absolute inset-0 bg-[#191A17]/40"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ ease: [0.28, 0.11, 0.32, 1], duration: 0.4 }}
              className="absolute inset-x-0 bottom-0 h-[85vh] supports-[height:100dvh]:h-[85dvh] flex flex-col bg-white rounded-t-[28px] shadow-[0_-10px_40px_-12px_rgba(25,26,23,0.25)] overflow-hidden"
            >
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Chiudi menu"
                className="flex-shrink-0 w-full h-7 flex items-center justify-center"
              >
                <span className="block h-1 w-10 rounded-full bg-[#D3CEC4]" />
              </button>
              <div className="flex-1 min-h-0">
                <Sidebar variant="sheet" activeTab={activeTab} setActiveTab={selectTab} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] lg:pl-0 lg:pr-0">
        {/* Barra in alto (telefono): rispetta notch / Dynamic Island */}
        <header
          className="lg:hidden bg-white border-b border-black/[0.06] px-4 flex flex-col justify-center sticky top-0 z-40"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="min-h-[52px] flex flex-col justify-center py-1.5">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6A685F] leading-none">Masso Lab Studio</p>
            <h1 className="mt-1 text-[19px] font-semibold text-[#191A17] leading-none" style={{ letterSpacing: '-0.03em' }}>
              {tabLabel(activeTab)}
            </h1>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-8 max-w-7xl w-full mx-auto">
          <Suspense fallback={<Spinner />}>{renderTab()}</Suspense>
        </main>
      </div>

      {/* Barra di navigazione in basso (telefono): comoda col pollice, sopra la barra Home */}
      <nav
        className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-white border-t border-black/[0.06] shadow-[0_-8px_30px_-12px_rgba(25,26,23,0.18)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Navigazione principale"
      >
        <ul className="flex items-stretch px-1">
          {BOTTOM_TABS.map(({ label, icon: Icon, tab }) => {
            const active = activeTab === tab;
            return (
              <li key={tab} className="flex-1 min-w-0">
                <button
                  onClick={() => selectTab(tab)}
                  aria-current={active ? 'page' : undefined}
                  className="w-full min-h-[56px] pt-1.5 pb-1 flex flex-col items-center justify-center gap-0.5"
                >
                  <span className={`h-7 w-14 rounded-full flex items-center justify-center transition-colors duration-300 ease-apple ${active ? 'bg-[#CFE99A]' : ''}`}>
                    <Icon className={`w-[22px] h-[22px] transition-colors duration-300 ease-apple ${active ? 'text-[#191A17]' : 'text-[#6A685F]'}`} aria-hidden="true" />
                  </span>
                  <span className={`text-xs leading-none tracking-[-0.01em] ${active ? 'font-bold text-[#191A17]' : 'font-semibold text-[#6A685F]'}`}>{label}</span>
                </button>
              </li>
            );
          })}
          <li className="flex-1 min-w-0">
            <button
              onClick={() => setMenuOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              className="w-full min-h-[56px] pt-1.5 pb-1 flex flex-col items-center justify-center gap-0.5"
            >
              <span className={`h-7 w-14 rounded-full flex items-center justify-center transition-colors duration-300 ease-apple ${inOther || menuOpen ? 'bg-[#CFE99A]' : ''}`}>
                <MoreHorizontal className={`w-[22px] h-[22px] ${inOther || menuOpen ? 'text-[#191A17]' : 'text-[#6A685F]'}`} aria-hidden="true" />
              </span>
              <span className={`text-xs leading-none tracking-[-0.01em] ${inOther ? 'font-bold text-[#191A17]' : 'font-semibold text-[#6A685F]'}`}>Altro</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default function TherapistDashboard() {
  // App installabile "MassoLab Studio": manifest + service worker solo su queste pagine.
  useEffect(() => enableStudioPwa(), []);
  return (
    <TherapistGuard>
      <Dashboard />
    </TherapistGuard>
  );
}
