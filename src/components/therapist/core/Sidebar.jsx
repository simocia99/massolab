import {
  Calendar,
  ClipboardList,
  Dumbbell,
  Euro,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Package,
  QrCode,
  Rss,
  Settings,
  Star,
  TrendingUp,
  UserSearch,
  Watch,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { BUSINESS } from '@/api/config';
import { pageUrl } from '@/lib/utils';

export const NAV_GROUPS = [
  {
    label: 'Operativo',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, tab: 'dashboard' },
      { label: 'Agenda', icon: Calendar, tab: 'calendar' },
      { label: 'Prenotazioni', icon: ClipboardList, tab: 'bookings' },
      { label: 'Disponibilità', icon: Settings, tab: 'availability' },
    ],
  },
  {
    label: 'CRM Clienti',
    items: [
      { label: 'Clienti & CRM', icon: UserSearch, tab: 'clients' },
      { label: 'Moduli Salute', icon: FileText, tab: 'intake_forms' },
      { label: 'Report Clinici', icon: TrendingUp, tab: 'client_reports' },
      { label: 'Pacchetti', icon: Package, tab: 'packages' },
      { label: 'Documenti', icon: FolderOpen, tab: 'patient_files' },
      { label: 'Schede Esercizi', icon: Dumbbell, tab: 'exercise_programs' },
      { label: 'Prezzi & Durate', icon: Euro, tab: 'pricing' },
      { label: 'Dati Salute', icon: Watch, tab: 'health_data' },
    ],
  },
  {
    label: 'Comunicazione',
    items: [
      { label: 'Messaggi', icon: MessageSquare, tab: 'messages' },
      { label: 'Automazioni', icon: Zap, tab: 'automations' },
      { label: 'Recensioni', icon: Star, tab: 'reviews' },
      { label: 'Blog', icon: Rss, tab: 'blog' },
      // New: share the site by link / QR code.
      { label: 'Condividi sito', icon: QrCode, tab: 'share' },
    ],
  },
];

/** Sezioni fisse nella barra in basso su telefono (l'ultima voce, "Altro", apre il menu completo). */
export const BOTTOM_TABS = [
  { label: 'Panoramica', icon: LayoutDashboard, tab: 'dashboard' },
  { label: 'Prenotazioni', icon: ClipboardList, tab: 'bookings' },
  { label: 'Calendario', icon: Calendar, tab: 'calendar' },
  { label: 'Clienti', icon: UserSearch, tab: 'clients' },
];

/** Nome leggibile della sezione attiva (titolo della barra in alto su telefono). */
export const tabLabel = (tab) =>
  BOTTOM_TABS.find((t) => t.tab === tab)?.label ||
  NAV_GROUPS.flatMap((g) => g.items).find((i) => i.tab === tab)?.label ||
  'Panoramica';

/**
 * Menu laterale del terapista.
 * variant "desktop": barra laterale fissa (Mac / schermi larghi).
 * variant "sheet": contenuto del foglio "Altro" su telefono (voci in griglia a 2 colonne, rispetta la safe area).
 */
export default function Sidebar({ activeTab, setActiveTab, variant = 'desktop' }) {
  const { logout } = useAuth();
  const sheet = variant === 'sheet';
  return (
    <aside
      className={
        sheet
          ? 'w-full bg-white flex flex-col h-full'
          : 'w-[280px] max-w-[85vw] bg-white flex flex-col h-full border-r border-black/[0.06]'
      }
    >
      <div className={`flex-shrink-0 ${sheet ? 'px-5 pt-3 pb-3' : 'px-5 pt-6 pb-5'}`}>
        <div className="flex items-center gap-3">
          <img
            src={BUSINESS.logo}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 flex-shrink-0 rounded-full ring-1 ring-black/10"
          />
          <div className="leading-none min-w-0">
            <h2 className="text-[#191A17] font-bold text-base" style={{ letterSpacing: '-0.02em' }}>
              Masso Lab
            </h2>
            <p className="text-[#6A685F] text-[13px] font-[400] mt-1" style={{ letterSpacing: '-0.01em' }}>
              Studio · Simone Ciacchi
            </p>
          </div>
        </div>
      </div>
      <nav
        className={`flex-1 px-3 space-y-5 overflow-y-auto overscroll-contain min-h-0 sidebar-scroll ${sheet ? 'pb-3' : 'pb-4'}`}
        aria-label="Sezioni area terapista"
      >
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6A685F] px-3 mb-1.5">{group.label}</p>
            <div className={sheet ? 'grid grid-cols-2 gap-1' : 'space-y-0.5'}>
              {group.items.map(({ label, icon: Icon, tab }) => {
                const active = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    aria-current={active ? 'page' : undefined}
                    className={`w-full flex items-center gap-3 px-3 min-h-[44px] rounded-full text-[13px] font-semibold text-left transition-colors duration-300 ease-apple ${active ? 'bg-[#F3F0EA] text-[#191A17]' : 'text-[#6A685F] hover:text-[#191A17] hover:bg-[#F3F0EA]/70 active:bg-[#F3F0EA]'}`}
                  >
                    <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${active ? 'text-[#56695C]' : ''}`} aria-hidden="true" />
                    <span className="truncate">{label}</span>
                    {active && !sheet && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#56695C] flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div
        className="px-3 pt-3 border-t border-black/[0.06] flex-shrink-0"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <button
          onClick={() => logout(pageUrl('Home'))}
          className="w-full flex items-center gap-3 px-3 min-h-[44px] rounded-full text-[13px] font-semibold text-[#6A685F] hover:text-[#56695C] hover:bg-[#56695C]/5 transition-colors duration-300 ease-apple"
        >
          <LogOut className="w-[18px] h-[18px]" aria-hidden="true" />
          Esci
        </button>
      </div>
    </aside>
  );
}
