import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/api/client';
import TherapistGuard from '@/components/therapist/core/TherapistGuard';
import Sidebar from '@/components/therapist/core/Sidebar';
import OverviewTab from '@/components/therapist/core/OverviewTab';
import BookingsTab from '@/components/therapist/core/BookingsTab';
import CalendarTab from '@/components/therapist/core/CalendarTab';
import { Spinner } from '@/components/therapist/core/shared';

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
            className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-5 py-2.5 text-sm font-semibold"
          >
            Riprova
          </button>
        </div>
      );
    const props = { appointments };
    switch (activeTab) {
      case 'dashboard':
        return <OverviewTab {...props} />;
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

  return (
    <div className="flex min-h-screen bg-[#F3F0EA]">
      <div className="hidden lg:block sticky top-0 h-screen flex-shrink-0">
        <Sidebar activeTab={activeTab} setActiveTab={selectTab} />
      </div>

      <AnimatePresence>
        {menuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu area terapista">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ ease: [0.28, 0.11, 0.32, 1], duration: 0.2 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] shadow-2xl"
            >
              <Sidebar activeTab={activeTab} setActiveTab={selectTab} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden bg-white/80 backdrop-blur-xl border-b border-black/[0.06] px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
          <button
            onClick={() => setMenuOpen(true)}
            className="p-3 -ml-2 hover:bg-[#F3F0EA] rounded-lg transition-colors"
            aria-label="Apri menu"
            aria-expanded={menuOpen}
          >
            <Menu className="w-5 h-5 text-[#191A17]" />
          </button>
          <h1 className="font-black text-[#191A17] text-[15px]" style={{ letterSpacing: '-0.02em' }}>
            Area Terapista
          </h1>
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Suspense fallback={<Spinner />}>{renderTab()}</Suspense>
        </main>
      </div>
    </div>
  );
}

export default function TherapistDashboard() {
  return (
    <TherapistGuard>
      <Dashboard />
    </TherapistGuard>
  );
}
