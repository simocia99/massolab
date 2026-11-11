import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { db } from '@/api/client';
import { BUSINESS, whatsappUrl } from '@/api/config';
import { createPageUrl } from '@/lib/utils';
import ContactForm from './ContactForm';
import ServiceAreaMap from './ServiceAreaMap';
import SectionLabel from './SectionLabel';

const DEFAULT_LOCATION = { lat: 45.3252, lng: 9.1401, label: 'Lacchiarella (MI)' };
const DEFAULT_RADIUS_KM = 15;
const DAY_FULL = { 1: 'Lunedì', 2: 'Martedì', 3: 'Mercoledì', 4: 'Giovedì', 5: 'Venerdì', 6: 'Sabato', 7: 'Domenica' };

/** TherapistSettings.day_schedules ({1..7: {active, slots:[{start,end}]}}) -> rows. */
function scheduleRows(daySchedules) {
  if (!daySchedules) return [];
  const rows = [];
  for (let n = 1; n <= 7; n++) {
    const d = daySchedules[n] ?? daySchedules[String(n)];
    if (!d) continue;
    const active = !!(d.active && d.slots && d.slots.length > 0);
    rows.push({
      num: n,
      hours: active ? d.slots.map((s) => `${s.start}–${s.end}`).join(', ') : 'Chiuso',
      active,
    });
  }
  return rows;
}

/** ISO weekday 1 (Mon) .. 7 (Sun). */
const todayIsoWeekday = () => ((new Date().getDay() + 6) % 7) + 1;

const directLink = 'flex items-center gap-3 group min-h-[44px]';
const directIcon =
  'w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-[#56695C]/10 transition-colors';

/** "Contatti" + live opening hours + "Dove opero" map (original `w3`). */
export default function ContactSection() {
  const [hours, setHours] = useState([]);
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [showArea, setShowArea] = useState(true);

  useEffect(() => {
    let alive = true;
    db.entities.TherapistSettings.list('-created_date', 1)
      .then((rows) => {
        if (!alive || !rows?.length) return;
        const s = rows[0];
        setHours(scheduleRows(s.day_schedules));
        if (s.base_location) setLocation({ ...DEFAULT_LOCATION, ...s.base_location });
        if (s.service_radius_km) setRadiusKm(s.service_radius_km);
      })
      .catch(() => {}); // fall back to the static hours text
    return () => {
      alive = false;
    };
  }, []);

  const today = todayIsoWeekday();
  const wa = whatsappUrl();

  return (
    <section id="contatti" className="py-28 md:py-36 bg-[#F3F0EA]">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true }}
          transition={{ ease: [0.28, 0.11, 0.32, 1], duration: 0.6 }}
          className="mb-14"
        >
          <SectionLabel>Contatti</SectionLabel>
          <h2 className="text-4xl md:text-[3.25rem] font-medium leading-[1.05] text-[#191A17] mb-3" style={{ letterSpacing: '-0.04em' }}>
            Parliamoci.
          </h2>
          <p className="text-lg text-[#6A685F] font-light">{location.label} e dintorni. Zero spostamenti per te.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ ease: [0.28, 0.11, 0.32, 1], duration: 0.6 }}
            className="space-y-5"
          >
            <div className="bg-white rounded-[28px] p-7 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-[#56695C]/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-[#56695C]" />
                </div>
                <div>
                  <p className="font-bold text-[#191A17] leading-tight">Orari disponibili</p>
                  <p className="text-xs text-[#6A685F] font-light">Aggiornati in tempo reale dall'area terapista</p>
                </div>
              </div>
              {hours.length > 0 ? (
                <div className="space-y-1">
                  {hours.map((d) => {
                    const isToday = d.num === today;
                    return (
                      <div
                        key={d.num}
                        className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 transition-colors ${
                          isToday ? 'bg-[#56695C]/[0.06] ring-1 ring-[#56695C]/20' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${d.active ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className={`text-sm font-semibold ${isToday ? 'text-[#56695C]' : 'text-[#191A17]'}`}>
                            {DAY_FULL[d.num]}
                          </span>
                          {isToday && (
                            <span className="text-xs font-bold uppercase tracking-wider text-white bg-[#56695C] rounded-full px-2 py-0.5">
                              Oggi
                            </span>
                          )}
                        </div>
                        <span className={`text-sm font-light text-right ${d.active ? 'text-[#191A17]' : 'text-[#6A685F]'}`}>
                          {d.hours}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[#6A685F] text-sm font-light">Lun – Ven: 9:00–19:00 · Sab su appuntamento</p>
              )}
            </div>

            <div className="bg-white rounded-[28px] p-7 shadow-sm space-y-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-[#56695C]/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-[#56695C]" />
                </div>
                <p className="font-bold text-[#191A17]">Contatti diretti</p>
              </div>
              <a href={`tel:${BUSINESS.phoneRaw}`} className={directLink}>
                <span className={directIcon}>
                  <Phone className="w-4 h-4 text-[#6A685F] group-hover:text-[#56695C] transition-colors" />
                </span>
                <span className="text-sm font-medium text-[#191A17] group-hover:text-[#56695C] transition-colors">
                  {BUSINESS.phone}
                </span>
              </a>
              <a href={`mailto:${BUSINESS.email}`} className={directLink}>
                <span className={directIcon}>
                  <Mail className="w-4 h-4 text-[#6A685F] group-hover:text-[#56695C] transition-colors" />
                </span>
                <span className="text-sm font-medium text-[#191A17] group-hover:text-[#56695C] transition-colors break-all">
                  {BUSINESS.email}
                </span>
              </a>
              <a href={wa} target="_blank" rel="noopener noreferrer" className={directLink}>
                <span className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/10 transition-colors">
                  <MessageCircle className="w-4 h-4 text-[#6A685F] group-hover:text-green-500 transition-colors" />
                </span>
                <span className="text-sm font-medium text-[#191A17] group-hover:text-green-600 transition-colors">
                  Scrivimi su WhatsApp
                </span>
              </a>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to={createPageUrl('GuestBooking')}
                className="flex-1 w-full inline-flex items-center justify-center gap-2 bg-[#56695C] hover:bg-[#46574B] text-white rounded-2xl px-6 py-4 font-bold transition-all duration-300 hover:scale-[1.02]"
              >
                <Calendar className="w-4 h-4" />
                Prenota online
              </Link>
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 w-full inline-flex items-center justify-center gap-2 bg-[#191A17] hover:bg-black text-white rounded-2xl px-6 py-4 font-bold transition-all duration-300 hover:scale-[1.02]"
              >
                <MessageCircle className="w-4 h-4 text-green-400" />
                WhatsApp
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ ease: [0.28, 0.11, 0.32, 1], duration: 0.6, delay: 0.1 }}
            className="bg-white rounded-[28px] p-8"
          >
            <ContactForm />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true }}
          transition={{ ease: [0.28, 0.11, 0.32, 1], duration: 0.6 }}
          className="bg-white rounded-[28px] p-6 sm:p-8 shadow-sm mt-8"
        >
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#56695C]/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-[#56695C]" />
                </div>
                <p className="font-bold text-[#191A17]">Dove opero</p>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-[#191A17]" style={{ letterSpacing: '-0.03em' }}>
                {location.label}
              </h3>
              <p className="text-[#6A685F] font-light leading-relaxed max-w-md">
                L'area di intervento copre un raggio di <span className="font-bold text-[#191A17]">{radiusKm} km</span> da{' '}
                {location.label}, direttamente a domicilio o in studio.
              </p>
            </div>
            <label className="inline-flex items-center gap-3 cursor-pointer select-none self-start md:self-end">
              <span className="relative inline-block">
                <input
                  type="checkbox"
                  checked={showArea}
                  onChange={(e) => setShowArea(e.target.checked)}
                  className="sr-only peer"
                />
                <span className="block w-11 h-6 rounded-full bg-gray-300 peer-checked:bg-[#191A17] peer-focus-visible:ring-2 peer-focus-visible:ring-[#56695C]/40 transition-colors" />
                <span className="absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
              </span>
              <span className="text-sm font-semibold text-[#191A17]">Mostra area operativa</span>
            </label>
          </div>
          <ServiceAreaMap
            lat={location.lat}
            lng={location.lng}
            radiusKm={radiusKm}
            label={location.label}
            showCircle={showArea}
          />
        </motion.div>
      </div>
    </section>
  );
}
