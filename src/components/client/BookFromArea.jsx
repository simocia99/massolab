import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { CalendarDays, CircleCheck, LoaderCircle } from 'lucide-react';
import SlotPicker from '@/components/booking/SlotPicker';
import { AREA_TREATMENTS } from '@/components/booking/bookingData';
import { SlotTakenError, createAppointment } from '@/components/booking/bookingUtils';
import { notifyBookingReceived } from '@/components/booking/bookingEmails';

const EMPTY = { treatment_type: '', preferred_date: '', preferred_time: '', notes: '' };

/** Booking form inside the client area (bundle `R2`). `client` = ClientAccount profile. */
export default function BookFromArea({ client, onBooked }) {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [pickerKey, setPickerKey] = useState(0);
  const busy = useRef(false);
  const timer = useRef(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => () => clearTimeout(timer.current), []);

  const submit = async (ev) => {
    ev.preventDefault();
    if (!form.treatment_type || !form.preferred_date || !form.preferred_time || busy.current) return;
    busy.current = true;
    setSubmitting(true);
    const parts = client.first_name ? [client.first_name, client.last_name] : (client.name || '').split(' ');
    const first_name = client.first_name || parts[0] || '';
    const last_name = client.last_name || parts.slice(1).join(' ') || '';
    try {
      const appt = await createAppointment({
        first_name,
        last_name,
        email: client.email,
        phone: client.phone || '',
        treatment_type: form.treatment_type,
        preferred_date: form.preferred_date,
        preferred_time: form.preferred_time,
        notes: form.notes,
        is_guest: false,
      });
      await notifyBookingReceived(appt, { source: 'area' });
      setDone(true);
      timer.current = setTimeout(() => {
        setDone(false);
        setForm(EMPTY);
        onBooked?.();
      }, 3000);
    } catch (err) {
      if (err instanceof SlotTakenError) {
        toast.error(err.message);
        set('preferred_time', '');
        setPickerKey((k) => k + 1); // reload availability
      } else {
        console.error(err);
        toast.error("Si è verificato un errore durante l'invio della richiesta. Riprova.");
      }
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <CircleCheck className="w-14 h-14 text-green-500 mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Richiesta Inviata!</h3>
        <p className="text-gray-500 text-sm">
          Riceverai una conferma via email quando il terapista approverà l'appuntamento.
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <p className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Tipo di Trattamento *</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {AREA_TREATMENTS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                if (form.treatment_type !== t) set('preferred_time', '');
                set('treatment_type', t);
              }}
              className={`text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${form.treatment_type === t ? 'bg-red-600 text-white border-red-600' : 'bg-white border-gray-200 text-gray-700 hover:border-red-300'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {form.treatment_type && (
        <motion.div initial={{ opacity: 0, y: 8, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}>
          <p className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-2">
            <CalendarDays className="w-4 h-4" /> Seleziona Data e Orario *
          </p>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <SlotPicker
              key={pickerKey}
              onSelectSlot={(d, t) => setForm((f) => ({ ...f, preferred_date: d, preferred_time: t }))}
              selectedDate={form.preferred_date}
              selectedTime={form.preferred_time}
              treatmentType={form.treatment_type}
            />
          </div>
        </motion.div>
      )}

      {form.preferred_date && form.preferred_time && (
        <motion.div initial={{ opacity: 0, y: 8, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}>
          <label htmlFor="area-notes" className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
            Note (opzionale)
          </label>
          <textarea
            id="area-notes"
            value={form.notes}
            onChange={(ev) => set('notes', ev.target.value)}
            placeholder="Allergie, zone da trattare, altre info..."
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 resize-none"
          />
        </motion.div>
      )}

      <button
        type="submit"
        disabled={submitting || !form.treatment_type || !form.preferred_date || !form.preferred_time}
        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-500 text-white font-bold rounded-xl py-3.5 text-sm transition-colors flex items-center justify-center gap-2"
      >
        {submitting ? <LoaderCircle className="w-4 h-4 animate-spin" /> : null}
        Richiedi Appuntamento
      </button>
    </form>
  );
}
