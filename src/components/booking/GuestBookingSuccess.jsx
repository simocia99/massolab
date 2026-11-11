import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, CircleCheck, Clock, FileText, Info } from 'lucide-react';
import { createPageUrl } from '@/lib/utils';
import { SummaryRow } from './GuestBookingParts';

export default function GuestBookingSuccess({ appointment, treatment, intakeSkipped }) {
  const intakeUrl = `${createPageUrl('IntakeForm')}?id=${encodeURIComponent(appointment.id)}&token=${encodeURIComponent(appointment.access_token || '')}`;
  return (
    <div className="min-h-screen bg-[#F3F0EA] flex items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 max-w-md w-full"
      >
        <div className="text-center mb-6">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CircleCheck className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Richiesta inviata!</h2>
          <p className="text-gray-500 text-sm">Simone ti contatterà a breve per confermare.</p>
          <p className="text-xs text-gray-500 mt-1">
            Riceverai il riepilogo via email a <strong>{appointment.email}</strong>
          </p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-4 mb-5 space-y-2">
          <SummaryRow icon={<Calendar className="w-4 h-4 text-red-500" />} label="Trattamento" value={treatment.name} />
          <SummaryRow
            icon={<Clock className="w-4 h-4 text-gray-500" />}
            label="Data & Ora"
            value={`${appointment.preferred_date} alle ${appointment.preferred_time}`}
          />
          <SummaryRow icon={<Clock className="w-4 h-4 text-gray-500" />} label="Durata" value={`${treatment.duration} min`} />
        </div>

        {intakeSkipped ? (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-5 flex gap-3">
            <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-800 mb-1">Compila la scheda salute</p>
              <p className="text-xs text-blue-700 mb-3">
                Aiuta Simone a prepararsi al meglio per la tua seduta. Richiede solo 2 minuti.
              </p>
              <Link
                to={intakeUrl}
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
              >
                Compila ora →
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 rounded-2xl p-4 mb-5 flex gap-3">
            <CircleCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800">Scheda salute inviata. Simone potrà prepararsi al meglio per te.</p>
          </div>
        )}

        <div className="bg-amber-50 rounded-xl p-3 mb-5 flex gap-2">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">Cancellazione gratuita fino a 24 ore prima dell'appuntamento.</p>
        </div>

        <Link
          to="/"
          className="block w-full bg-gray-900 hover:bg-gray-800 text-white rounded-2xl py-4 font-bold transition-colors text-center"
        >
          Torna alla Home
        </Link>
      </motion.div>
    </div>
  );
}
