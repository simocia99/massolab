import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  isToday,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { it } from 'date-fns/locale';
import { SectionHeader } from './shared';

const DOT_COLORS = {
  pending: 'bg-yellow-400',
  confirmed: 'bg-green-500',
  completed: 'bg-blue-500',
  cancelled: 'bg-red-400',
};

export default function CalendarTab({ appointments }) {
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState(null);
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const leadingBlanks = (getDay(startOfMonth(month)) + 6) % 7; // week starts on Monday
  const forDay = (d) => appointments.filter((a) => a.preferred_date === format(d, 'yyyy-MM-dd'));
  const selectedAppts = selected ? forDay(selected) : [];

  return (
    <div className="space-y-6">
      <SectionHeader title="Calendario" subtitle="Visualizza gli appuntamenti nel calendario" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 capitalize">{format(month, 'MMMM yyyy', { locale: it })}</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setMonth(subMonths(month, 1))}
                aria-label="Mese precedente"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMonth(addMonths(month, 1))}
                aria-label="Mese successivo"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 mb-2">
            {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((d) => (
              <div key={d} className="text-center text-xs font-bold text-gray-400 py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: leadingBlanks }, (_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {days.map((day) => {
              const dayAppts = forDay(day);
              const isSel = selected && isSameDay(day, selected);
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelected(isSel ? null : day)}
                  aria-label={`${format(day, 'd MMMM', { locale: it })}: ${dayAppts.length} appuntamenti`}
                  aria-pressed={!!isSel}
                  className={`relative aspect-square rounded-xl flex flex-col items-center justify-start pt-2 text-sm transition-all hover:bg-red-50 ${isSel ? 'bg-red-600 text-white' : isToday(day) ? 'bg-red-50 text-red-600 font-bold' : 'text-gray-700'}`}
                >
                  <span className="text-xs font-semibold">{format(day, 'd')}</span>
                  {dayAppts.length > 0 && (
                    <div className="flex gap-0.5 mt-1 flex-wrap justify-center px-1">
                      {dayAppts.slice(0, 3).map((a) => (
                        <span key={a.id} className={`w-1.5 h-1.5 rounded-full ${isSel ? 'bg-white' : DOT_COLORS[a.status] || 'bg-gray-400'}`} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h3 className="font-bold text-gray-900 mb-4">
            {selected ? format(selected, 'd MMMM yyyy', { locale: it }) : 'Seleziona un giorno'}
          </h3>
          {!selected ? (
            <p className="text-gray-400 text-sm">Clicca su un giorno per vedere gli appuntamenti.</p>
          ) : selectedAppts.length === 0 ? (
            <p className="text-gray-400 text-sm">Nessun appuntamento.</p>
          ) : (
            <div className="space-y-3">
              {selectedAppts.map((a) => (
                <div key={a.id} className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${DOT_COLORS[a.status] || 'bg-gray-400'}`} />
                    <p className="text-xs font-bold text-gray-500 uppercase">{a.preferred_time || '—'}</p>
                  </div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {a.first_name} {a.last_name}
                  </p>
                  <p className="text-xs text-gray-500">{a.treatment_type}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
