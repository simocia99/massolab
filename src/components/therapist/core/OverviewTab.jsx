import { CalendarCheck, CircleCheckBig, Clock, Users } from 'lucide-react';
import { toISODate } from '@/lib/utils';
import { SectionHeader, StatusBadge } from './shared';

export default function OverviewTab({ appointments }) {
  const today = toISODate();
  const todays = appointments.filter((a) => a.preferred_date === today);
  const stats = [
    { label: 'Prenotazioni Totali', value: appointments.length, icon: CalendarCheck, color: 'bg-blue-500' },
    { label: 'In Attesa', value: appointments.filter((a) => a.status === 'pending').length, icon: Clock, color: 'bg-yellow-500' },
    { label: 'Confermate', value: appointments.filter((a) => a.status === 'confirmed').length, icon: CircleCheckBig, color: 'bg-green-500' },
    { label: 'Clienti Unici', value: new Set(appointments.map((a) => a.email)).size, icon: Users, color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-8">
      <SectionHeader title="Dashboard" subtitle="Panoramica generale dell'attività" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-4`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-4">Appuntamenti di Oggi ({todays.length})</h3>
        {todays.length === 0 ? (
          <p className="text-gray-400 text-sm">Nessun appuntamento oggi.</p>
        ) : (
          <div className="space-y-3">
            {todays.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 py-3 border-b border-gray-50 last:border-0">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {a.first_name} {a.last_name}
                  </p>
                  <p className="text-sm text-gray-500 truncate">{a.treatment_type}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-gray-700">{a.preferred_time || '—'}</p>
                  <StatusBadge status={a.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
