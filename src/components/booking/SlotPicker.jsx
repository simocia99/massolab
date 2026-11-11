import { useEffect, useMemo, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isBefore,
  isSameDay,
  isToday,
  startOfDay,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { it } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, LoaderCircle } from 'lucide-react';
import { toISODate } from '@/lib/utils';
import {
  DEFAULT_SETTINGS,
  fetchBookedSlots,
  freeTimes,
  isWorkDay,
  loadTherapistSettings,
  treatmentDuration,
} from './bookingUtils';

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const parseDay = (s) => (s ? new Date(`${s}T12:00:00`) : null);

/** Month calendar + free time slots, based on TherapistSettings and booked_slots. */
export default function SlotPicker({ onSelectSlot, selectedDate, selectedTime, treatmentType }) {
  const [month, setMonth] = useState(() => parseDay(selectedDate) || new Date());
  const [booked, setBooked] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [day, setDay] = useState(() => parseDay(selectedDate));

  useEffect(() => {
    let alive = true;
    loadTherapistSettings().then((s) => alive && setSettings(s));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    fetchBookedSlots(toISODate(startOfMonth(month)), toISODate(endOfMonth(month)))
      .then((rows) => alive && setBooked(rows))
      .catch(() => alive && setError('Impossibile caricare le disponibilità. Riprova più tardi.'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [month]);

  const s = settings || DEFAULT_SETTINGS;
  const monthStart = startOfMonth(month);
  const days = eachDayOfInterval({ start: monthStart, end: endOfMonth(month) });
  const padding = (monthStart.getDay() + 6) % 7;

  const isBlocked = (d) => (s.blocked_dates || []).includes(toISODate(d));
  const isPast = (d) => isBefore(startOfDay(d), startOfDay(new Date()));
  const isOpen = (d) => isWorkDay(s, d) && !isPast(d) && !isBlocked(d);

  const freeByDay = useMemo(() => {
    const map = {};
    for (const d of days) map[toISODate(d)] = isOpen(d) ? freeTimes(s, booked, d, treatmentType) : [];
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, booked, settings, treatmentType]);

  const pickDay = (d) => {
    if (!isOpen(d)) return;
    setDay(d);
    onSelectSlot(toISODate(d), '');
  };

  const times = day ? freeByDay[toISODate(day)] || [] : [];
  const busy = loading || !settings;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonth((m) => subMonths(m, 1))}
          aria-label="Mese precedente"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <span className="font-semibold text-gray-900 capitalize">{format(month, 'MMMM yyyy', { locale: it })}</span>
        <button
          type="button"
          onClick={() => setMonth((m) => addMonths(m, 1))}
          aria-label="Mese successivo"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-xs font-bold text-gray-500 py-1">
            {w}
          </div>
        ))}
        {Array.from({ length: padding }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((d) => {
          const selected = day && isSameDay(d, day);
          const today = isToday(d);
          const open = isOpen(d);
          const hasSlots = (freeByDay[toISODate(d)] || []).length > 0;
          const blocked = isBlocked(d);
          return (
            <button
              key={toISODate(d)}
              type="button"
              onClick={() => pickDay(d)}
              disabled={!open || !hasSlots}
              title={blocked ? 'Giorno bloccato' : ''}
              className={`
                relative aspect-square rounded-xl text-sm font-medium flex flex-col items-center justify-center transition-all
                ${selected ? 'bg-red-600 text-white' : ''}
                ${!selected && today ? 'border-2 border-red-400 text-red-600' : ''}
                ${!selected && open && hasSlots ? 'hover:bg-red-50 text-gray-900 cursor-pointer' : ''}
                ${blocked ? 'bg-red-50 text-red-300 line-through cursor-not-allowed' : ''}
                ${!open && !blocked ? 'text-gray-300 cursor-default' : ''}
              `}
            >
              {d.getDate()}
              {open && hasSlots && !selected && (
                <span className="absolute bottom-1 w-1 h-1 bg-green-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {busy && (
        <div className="flex items-center justify-center py-6">
          <LoaderCircle className="w-5 h-5 animate-spin text-red-500" />
        </div>
      )}

      {!busy && error && <p className="text-sm text-danger text-center py-3 bg-danger-soft rounded-xl">{error}</p>}

      {!busy && !error && day && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">
              Orari disponibili — {format(day, 'd MMMM', { locale: it })}
            </span>
            {treatmentType && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                {treatmentDuration(s, treatmentType)} min
              </span>
            )}
          </div>
          {times.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-3 bg-gray-50 rounded-xl">
              Nessun orario disponibile per questo giorno
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {times.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onSelectSlot(toISODate(day), t)}
                  className={`py-2.5 rounded-xl text-sm font-semibold border transition-all
                    ${selectedTime === t ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 border-gray-200 hover:border-red-400 hover:text-red-600'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {!busy && !error && !day && (
        <p className="text-sm text-gray-500 text-center py-3">Seleziona un giorno per vedere gli orari disponibili</p>
      )}
    </div>
  );
}
