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

export default function Sidebar({ activeTab, setActiveTab }) {
  const { logout } = useAuth();
  return (
    <aside className="w-[280px] max-w-[85vw] bg-white flex flex-col h-full border-r border-black/[0.06]">
      <div className="px-6 pt-6 pb-5 flex-shrink-0">
        <h2 className="text-[#191A17] font-black text-lg" style={{ letterSpacing: '-0.03em' }}>
          Masso Lab
        </h2>
        <p className="text-[#56695C] text-xs font-bold tracking-[0.18em] uppercase mt-0.5">Area Terapista</p>
      </div>
      <nav className="flex-1 px-3 pb-4 space-y-5 overflow-y-auto min-h-0 sidebar-scroll" aria-label="Sezioni area terapista">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6A685F] px-3 mb-1.5">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map(({ label, icon: Icon, tab }) => {
                const active = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    aria-current={active ? 'page' : undefined}
                    className={`w-full flex items-center gap-3 px-3 min-h-[44px] rounded-xl text-[13px] font-semibold transition-all duration-200 ${active ? 'bg-[#F3F0EA] text-[#191A17]' : 'text-[#6A685F] hover:text-[#191A17] hover:bg-[#F3F0EA]/60'}`}
                  >
                    <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${active ? 'text-[#56695C]' : ''}`} />
                    {label}
                    {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#56695C] flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-black/[0.06] flex-shrink-0">
        <button
          onClick={() => logout(pageUrl('Home'))}
          className="w-full flex items-center gap-3 px-3 min-h-[44px] rounded-xl text-[13px] font-semibold text-[#6A685F] hover:text-[#56695C] hover:bg-[#56695C]/5 transition-all duration-200"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Esci
        </button>
      </div>
    </aside>
  );
}
