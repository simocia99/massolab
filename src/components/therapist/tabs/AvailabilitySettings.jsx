import { useEffect, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isBefore,
  startOfDay,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { it } from 'date-fns/locale';
import { Ban, Calendar, Check, CircleAlert, Clock, LoaderCircle, MapPin, Plus, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/api/client';
import { h3 as ServiceAreaMap } from '@/xref/home';

export const WEEK_DAYS = [
  { value: 1, label: 'Lunedì' },
  { value: 2, label: 'Martedì' },
  { value: 3, label: 'Mercoledì' },
  { value: 4, label: 'Giovedì' },
  { value: 5, label: 'Venerdì' },
  { value: 6, label: 'Sabato' },
  { value: 7, label: 'Domenica' },
];

export const DURATION_TREATMENTS = [
  'Massaggio Tradizionale/Rilassante',
  'Linfodrenaggio',
  'Bendaggio',
  'Massaggio Sportivo',
  'Massaggio Miofasciale',
  'Massaggio Connettivale',
  'Kinesiotaping',
  'Coppettazione',
];

const DEFAULT_LOCATION = { lat: 45.3252, lng: 9.1401 };

export const toMinutes = (hhmm) => {
  if (!hhmm) return 0;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** Convert legacy settings (work_days + work_hours + lunch break) to per-day schedules. */
export function normalizeSchedules(settings) {
  if (settings.day_schedules) return settings;
  const days = settings.work_days || [1, 2, 3, 4, 5];
  const start = settings.work_hours_start || '09:00';
  const end = settings.work_hours_end || '19:00';
  const ls = settings.lunch_break_start;
  const le = settings.lunch_break_end;
  const slots =
    ls && le && toMinutes(ls) > toMinutes(start) && toMinutes(le) < toMinutes(end)
      ? [
          { start, end: ls },
          { start: le, end },
        ]
      : [{ start, end }];
  const day_schedules = {};
  for (let d = 1; d <= 7; d++) {
    day_schedules[d] = { active: days.includes(d), slots: days.includes(d) ? slots.map((s) => ({ ...s })) : [] };
  }
  return { ...settings, day_schedules };
}

const overlaps = (slots) => {
  const sorted = [...slots].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  for (let i = 0; i < sorted.length - 1; i++) {
    if (toMinutes(sorted[i].end) > toMinutes(sorted[i + 1].start)) return true;
  }
  return false;
};

export function validateSlots(slots) {
  for (const s of slots) {
    if (!s.start || !s.end) return 'Tutti i campi orario devono essere compilati';
    if (toMinutes(s.start) >= toMinutes(s.end)) return "L'orario di fine deve essere dopo l'inizio";
  }
  return overlaps(slots) ? 'Le fasce orarie si sovrappongono' : null;
}

function defaultSettings() {
  const day_schedules = {};
  for (let d = 1; d <= 7; d++) {
    day_schedules[d] =
      d <= 5
        ? {
            active: true,
            slots: [
              { start: '09:00', end: '13:00' },
              { start: '14:00', end: '18:00' },
            ],
          }
        : { active: false, slots: [] };
  }
  return {
    day_schedules,
    slot_duration: 60,
    blocked_dates: [],
    base_location: { ...DEFAULT_LOCATION, label: 'Lacchiarella (MI)' },
    service_radius_km: 15,
    treatment_durations: {
      'Massaggio Tradizionale/Rilassante': 60,
      Linfodrenaggio: 90,
      Bendaggio: 45,
      'Massaggio Sportivo': 60,
      'Massaggio Miofasciale': 75,
      'Massaggio Connettivale': 60,
      Kinesiotaping: 30,
      Coppettazione: 45,
    },
  };
}

// Strip system columns before writing.
const payload = ({ id, created_date, updated_date, created_by, ...rest }) => rest;

export default function AvailabilitySettings() {
  const [settings, setSettings] = useState(null);
  const [settingsId, setSettingsId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [month, setMonth] = useState(new Date());
  const [slotErrors, setSlotErrors] = useState({});
  const [geocoding, setGeocoding] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await db.entities.TherapistSettings.list('-created_date', 1);
        if (cancelled) return;
        if (rows.length > 0) {
          setSettings(normalizeSchedules(rows[0]));
          setSettingsId(rows[0].id);
        } else {
          setSettings(defaultSettings());
        }
      } catch {
        if (!cancelled) {
          toast.error('Impossibile caricare le impostazioni.');
          setSettings(defaultSettings());
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!confirmed) return;
    const t = setTimeout(() => setConfirmed(false), 2500);
    return () => clearTimeout(t);
  }, [confirmed]);

  const set = (key, value) => setSettings((s) => ({ ...s, [key]: value }));

  const updateDay = (day, updater) =>
    setSettings((s) => {
      const schedules = { ...s.day_schedules };
      schedules[day] = updater(schedules[day] || { active: false, slots: [] });
      return { ...s, day_schedules: schedules };
    });

  const toggleDay = (day) =>
    updateDay(day, (d) => ({
      active: !d.active,
      slots: !d.active && d.slots.length === 0 ? [{ start: '09:00', end: '18:00' }] : d.slots,
    }));

  const changeSlot = (day, index, field, value) => {
    const slots = [...(settings.day_schedules[day]?.slots || [])];
    slots[index] = { ...slots[index], [field]: value };
    updateDay(day, (d) => ({ ...d, slots }));
    setSlotErrors((e) => ({ ...e, [day]: validateSlots(slots) }));
  };

  const addSlot = (day) => {
    const slots = [...(settings.day_schedules[day]?.slots || []), { start: '09:00', end: '18:00' }];
    updateDay(day, (d) => ({ ...d, slots }));
    setSlotErrors((e) => ({ ...e, [day]: validateSlots(slots) }));
  };

  const removeSlot = (day, index) => {
    const slots = (settings.day_schedules[day]?.slots || []).filter((_, i) => i !== index);
    updateDay(day, (d) => ({ ...d, slots }));
    setSlotErrors((e) => ({ ...e, [day]: validateSlots(slots) }));
  };

  const setDuration = (treatment, value) =>
    set('treatment_durations', { ...settings.treatment_durations, [treatment]: parseInt(value) || 60 });

  const unblockDate = (date) =>
    set(
      'blocked_dates',
      (settings.blocked_dates || []).filter((d) => d !== date),
    );

  const persist = async () => {
    if (settingsId) {
      await db.entities.TherapistSettings.update(settingsId, payload(settings));
    } else {
      const created = await db.entities.TherapistSettings.create(payload(settings));
      setSettingsId(created.id);
    }
  };

  const hasErrors = Object.values(slotErrors).some(Boolean);

  const save = async () => {
    if (hasErrors) {
      toast.error('Correggi le fasce orarie prima di salvare.');
      return;
    }
    setSaving(true);
    try {
      await persist();
      toast.success('Impostazioni salvate');
    } catch {
      toast.error('Salvataggio non riuscito. Riprova.');
    } finally {
      setSaving(false);
    }
  };

  const confirmLocation = async () => {
    setConfirming(true);
    try {
      await persist();
      setConfirmed(true);
    } catch {
      toast.error('Salvataggio non riuscito. Riprova.');
    } finally {
      setConfirming(false);
    }
  };

  const geocode = async (query) => {
    const q = (query || '').trim();
    if (!q) return;
    setGeocoding(true);
    setGeoError('');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
        { headers: { 'Accept-Language': 'it' } },
      );
      const results = await res.json();
      if (results && results.length > 0) {
        const lat = parseFloat(results[0].lat);
        const lng = parseFloat(results[0].lon);
        setSettings((s) => ({
          ...s,
          base_location: { ...(s.base_location || DEFAULT_LOCATION), label: q, lat, lng },
        }));
      } else {
        setGeoError("Località non trovata. Prova con un indirizzo più preciso (es. 'Lacchiarella, MI').");
      }
    } catch {
      setGeoError('Errore nella ricerca della località. Riprova.');
    } finally {
      setGeocoding(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const monthStart = startOfMonth(month);
  const days = eachDayOfInterval({ start: monthStart, end: endOfMonth(month) });
  const leadingBlanks = (getDay(monthStart) + 6) % 7;
  const blocked = settings.blocked_dates || [];
  const isBlocked = (d) => blocked.includes(format(d, 'yyyy-MM-dd'));
  const isPast = (d) => isBefore(startOfDay(d), startOfDay(new Date()));
  const toggleBlocked = (d) => {
    if (isPast(d)) return;
    const key = format(d, 'yyyy-MM-dd');
    set('blocked_dates', blocked.includes(key) ? blocked.filter((x) => x !== key) : [...blocked, key].sort());
  };

  const loc = settings.base_location || {};
  const radius = settings.service_radius_km ?? 15;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-900">Gestione Disponibilità</h2>
        <button
          onClick={save}
          disabled={saving || hasErrors}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {saving ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salva Impostazioni
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly hours */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <Calendar className="w-5 h-5 text-red-500" />
            <h3 className="font-bold text-gray-900">Orari per Giorno</h3>
            <span className="text-xs text-gray-400 sm:ml-2">
              Configura fasce orarie differenti per ogni giorno della settimana
            </span>
          </div>
          <div className="space-y-3">
            {WEEK_DAYS.map((day) => {
              const sched = (settings.day_schedules || {})[day.value] || { active: false, slots: [] };
              const error = slotErrors[day.value];
              return (
                <div
                  key={day.value}
                  className={`rounded-2xl border-2 transition-all ${
                    sched.active ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <button
                      onClick={() => toggleDay(day.value)}
                      role="switch"
                      aria-checked={!!sched.active}
                      aria-label={`${day.label}: disponibile`}
                      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
                        sched.active ? 'bg-red-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          sched.active ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className={`w-24 text-sm font-bold ${sched.active ? 'text-gray-900' : 'text-gray-400'}`}>
                      {day.label}
                    </span>
                    {sched.active ? (
                      <div className="flex-1 basis-full sm:basis-0 flex flex-wrap items-center gap-2">
                        {sched.slots.map((slot, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-1.5 bg-gray-50 rounded-xl px-3 py-1.5 border border-gray-200"
                          >
                            <input
                              type="time"
                              value={slot.start}
                              aria-label="Inizio fascia"
                              onChange={(e) => changeSlot(day.value, i, 'start', e.target.value)}
                              className="text-sm font-semibold text-gray-800 bg-transparent focus:outline-none w-20"
                            />
                            <span className="text-gray-400 text-xs">–</span>
                            <input
                              type="time"
                              value={slot.end}
                              aria-label="Fine fascia"
                              onChange={(e) => changeSlot(day.value, i, 'end', e.target.value)}
                              className="text-sm font-semibold text-gray-800 bg-transparent focus:outline-none w-20"
                            />
                            {sched.slots.length > 1 && (
                              <button
                                onClick={() => removeSlot(day.value, i)}
                                className="text-gray-400 hover:text-red-500 ml-1"
                                aria-label="Rimuovi fascia"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                        {sched.slots.length < 4 && (
                          <button
                            onClick={() => addSlot(day.value)}
                            className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" /> Aggiungi fascia
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Non disponibile</span>
                    )}
                  </div>
                  {error && (
                    <div className="flex items-center gap-2 px-4 pb-3 text-xs text-red-600">
                      <CircleAlert className="w-3.5 h-3.5 flex-shrink-0" />
                      {error}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Treatment durations */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-green-500" />
            <h3 className="font-bold text-gray-900">Durata Trattamenti (minuti)</h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {DURATION_TREATMENTS.map((t) => (
              <div key={t} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <span className="flex-1 text-sm text-gray-700 truncate">{t}</span>
                <input
                  type="number"
                  min={15}
                  max={180}
                  step={15}
                  aria-label={`Durata ${t}`}
                  value={(settings.treatment_durations || {})[t] || 60}
                  onChange={(e) => setDuration(t, e.target.value)}
                  className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-red-400"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Blocked dates */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Ban className="w-5 h-5 text-red-500" />
            <h3 className="font-bold text-gray-900">Giorni Bloccati / Festività</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Clicca sui giorni per bloccarli o sbloccarli. I clienti non potranno prenotare in questi giorni.
          </p>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setMonth(subMonths(month, 1))}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Mese precedente"
            >
              ←
            </button>
            <span className="font-semibold text-gray-900 capitalize">{format(month, 'MMMM yyyy', { locale: it })}</span>
            <button
              onClick={() => setMonth(addMonths(month, 1))}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Mese successivo"
            >
              →
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((d) => (
              <div key={d} className="text-center text-xs font-bold text-gray-400 py-2">
                {d}
              </div>
            ))}
            {Array.from({ length: leadingBlanks }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {days.map((d) => {
              const b = isBlocked(d);
              const past = isPast(d);
              return (
                <button
                  key={d.toISOString()}
                  onClick={() => toggleBlocked(d)}
                  disabled={past}
                  aria-pressed={b}
                  className={`aspect-square rounded-xl text-sm font-medium flex items-center justify-center transition-all ${
                    b ? 'bg-red-600 text-white' : ''
                  } ${past ? 'text-gray-300 cursor-default' : 'hover:bg-gray-100 cursor-pointer'} ${
                    !b && !past ? 'text-gray-700' : ''
                  }`}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
          {blocked.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <h4 className="text-sm font-semibold text-gray-600 mb-3">Date Bloccate:</h4>
              <div className="flex flex-wrap gap-2">
                {blocked.map((d) => (
                  <span
                    key={d}
                    className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 px-3 py-1.5 rounded-full text-sm font-medium"
                  >
                    {format(new Date(d + 'T12:00:00'), 'd MMM yyyy', { locale: it })}
                    <button
                      onClick={() => unblockDate(d)}
                      className="hover:bg-red-200 rounded-full p-0.5"
                      aria-label="Sblocca data"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Service area */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-red-500" />
            <h3 className="font-bold text-gray-900">Area di servizio e posizione</h3>
            <span className="text-xs text-gray-400 sm:ml-2">
              Scrivi la località e premi Invio per aggiornare la mappa qui, poi conferma per sincronizzare con la home
            </span>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5" htmlFor="base-location">
                  Località principale
                </label>
                <div className="flex gap-2">
                  <input
                    id="base-location"
                    type="text"
                    value={loc.label || ''}
                    onChange={(e) => set('base_location', { ...DEFAULT_LOCATION, ...loc, label: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        geocode(e.target.value);
                      }
                    }}
                    placeholder="Lacchiarella, MI"
                    className="flex-1 min-w-0 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400"
                  />
                  <button
                    type="button"
                    onClick={() => geocode(loc.label || '')}
                    disabled={geocoding}
                    className="px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-60 transition-colors flex items-center gap-1 flex-shrink-0"
                  >
                    {geocoding ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                    Cerca
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  Scrivi città o indirizzo e premi Invio: la mappa si aggiorna qui. Premi "Conferma modifiche" per
                  sincronizzare con la home.
                </p>
                {geoError && <p className="text-xs text-red-600 mt-1.5">{geoError}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5" htmlFor="service-radius">
                  Raggio di servizio: <span className="text-red-600 font-bold">{radius} km</span>
                </label>
                <input
                  id="service-radius"
                  type="range"
                  min={5}
                  max={150}
                  step={5}
                  value={radius}
                  onChange={(e) => set('service_radius_km', parseInt(e.target.value))}
                  className="w-full accent-red-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>5 km</span>
                  <span>150 km</span>
                </div>
              </div>
              <div className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3 leading-relaxed">
                <span className="font-semibold text-gray-700">Coordinate:</span>
                <br />
                Lat {(loc.lat ?? DEFAULT_LOCATION.lat).toFixed(4)} · Lng {(loc.lng ?? DEFAULT_LOCATION.lng).toFixed(4)}
              </div>
            </div>
            <div className="lg:col-span-2">
              <ServiceAreaMap
                lat={loc.lat ?? DEFAULT_LOCATION.lat}
                lng={loc.lng ?? DEFAULT_LOCATION.lng}
                radiusKm={radius}
                label={loc.label || 'Lacchiarella (MI)'}
                className="h-72"
              />
            </div>
          </div>
          <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-gray-100">
            <p
              className={`text-xs ${confirmed ? 'text-green-600 font-semibold flex items-center gap-1.5' : 'text-gray-500'}`}
            >
              {confirmed ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Modifiche confermate e sincronizzate con la home.
                </>
              ) : (
                'Modifica località e raggio, poi conferma per aggiornare la sezione "Dove opero" sulla home.'
              )}
            </p>
            <button
              onClick={confirmLocation}
              disabled={confirming}
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors flex-shrink-0"
            >
              {confirming ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
              Conferma modifiche
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
