import { useEffect, useState } from 'react';
import { Bell, MessageCircle, Search } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/api/client';
import {
  ensureAccessToken,
  SectionHeader,
  sendCancelledEmail,
  sendCompletedEmail,
  sendConfirmedEmail,
  sendReminderEmail,
  STATUS_COLORS,
  STATUS_LABELS,
  waPhone,
  whatsappText,
} from './shared';

const FILTERS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];
const STATUSES = FILTERS.filter((s) => s !== 'all');

/** When an appointment is completed, consume one session of the client's active package. */
async function consumePackageSession(appt) {
  const packages = await db.entities.TreatmentPackage.filter({
    client_email: appt.email,
    treatment_type: appt.treatment_type,
    status: 'active',
  });
  if (!packages.length) return;
  const pkg = packages[0];
  const used = (pkg.used_sessions || 0) + 1;
  await db.entities.TreatmentPackage.update(pkg.id, {
    used_sessions: used,
    status: used >= pkg.total_sessions ? 'completed' : 'active',
  });
}

export default function BookingsTab({ appointments, onRefresh }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [reminded, setReminded] = useState({});

  // Legacy appointments without access_token would produce links that the
  // public pages refuse: give them one so WhatsApp links work.
  useEffect(() => {
    appointments
      .filter((a) => !a.access_token && (a.status === 'pending' || a.status === 'confirmed'))
      .forEach((a) => ensureAccessToken(a).catch(() => {}));
  }, [appointments]);

  const sendReminder = async (appt) => {
    try {
      await sendReminderEmail(appt);
      setReminded((r) => ({ ...r, [appt.id]: true }));
      toast.success('Promemoria inviato');
    } catch (e) {
      toast.error(e.message || 'Invio promemoria non riuscito');
    }
  };

  const changeStatus = async (id, status) => {
    const appt = appointments.find((a) => a.id === id);
    setUpdatingId(id);
    try {
      await db.entities.Appointment.update(id, { status });
      if (appt && status === 'completed') await consumePackageSession(appt);
      if (appt) {
        try {
          if (status === 'confirmed') await sendConfirmedEmail(appt);
          else if (status === 'completed') await sendCompletedEmail(appt);
          else if (status === 'cancelled') await sendCancelledEmail(appt);
        } catch {
          toast.error("Stato aggiornato, ma l'email al cliente non è stata inviata");
        }
      }
      await onRefresh();
    } catch (e) {
      toast.error(e.message || 'Aggiornamento non riuscito');
    } finally {
      setUpdatingId(null);
    }
  };

  const q = search.toLowerCase();
  const visible = appointments.filter(
    (a) =>
      (filter === 'all' || a.status === filter) &&
      (!q || `${a.first_name} ${a.last_name} ${a.email} ${a.treatment_type}`.toLowerCase().includes(q)),
  );

  const actions = (a) => (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={a.status}
        disabled={updatingId === a.id}
        onChange={(e) => changeStatus(a.id, e.target.value)}
        aria-label="Stato prenotazione"
        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-red-400 bg-white"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      {a.phone && (
        <a
          href={`https://wa.me/${waPhone(a.phone)}?text=${encodeURIComponent(whatsappText(a, a.status === 'confirmed' ? 'confirmed' : 'reminder'))}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Invia WhatsApp"
          aria-label="Invia WhatsApp"
          className="p-1.5 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
        >
          <MessageCircle className="w-4 h-4 text-green-600" />
        </a>
      )}
      {(a.status === 'pending' || a.status === 'confirmed') && (
        <button
          onClick={() => sendReminder(a)}
          title="Invia promemoria email"
          aria-label="Invia promemoria email"
          className={`p-1.5 rounded-lg transition-colors ${reminded[a.id] ? 'bg-blue-100 text-blue-600' : 'bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-600'}`}
        >
          <Bell className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  const badge = (status) => (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );

  return (
    <div className="space-y-6">
      <SectionHeader title="Prenotazioni" subtitle="Gestisci tutte le richieste di appuntamento" />
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Cerca per nome, email o trattamento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Cerca prenotazioni"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${filter === f ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {STATUS_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {visible.length === 0 ? (
          <div className="p-12 text-center text-gray-500">Nessuna prenotazione trovata.</div>
        ) : (
          <>
            {/* Phone: one card per booking */}
            <ul className="md:hidden divide-y divide-gray-100">
              {visible.map((a) => (
                <li key={a.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">
                        {a.first_name} {a.last_name}
                      </p>
                      <p className="text-xs text-gray-500 break-all">{a.email}</p>
                    </div>
                    {badge(a.status)}
                  </div>
                  <p className="text-sm text-gray-600">
                    {a.treatment_type}
                    <span className="text-gray-500">
                      {' · '}
                      {a.preferred_date || '—'} {a.preferred_time || ''}
                    </span>
                  </p>
                  {actions(a)}
                </li>
              ))}
            </ul>
            {/* Tablet / desktop: table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Cliente', 'Trattamento', 'Data', 'Orario', 'Stato', 'Azioni'].map((h) => (
                      <th key={h} className="text-left text-xs font-bold uppercase tracking-wider text-gray-500 px-5 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((a) => (
                    <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900">
                          {a.first_name} {a.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{a.email}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">{a.treatment_type}</td>
                      <td className="px-5 py-4 text-sm text-gray-600">{a.preferred_date || '—'}</td>
                      <td className="px-5 py-4 text-sm text-gray-600">{a.preferred_time || '—'}</td>
                      <td className="px-5 py-4">{badge(a.status)}</td>
                      <td className="px-5 py-4">{actions(a)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
