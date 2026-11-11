import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CircleCheckBig, User, UserPlus } from 'lucide-react';
import { db } from '@/api/client';
import { createPageUrl, pageUrl } from '@/lib/utils';

const BENEFITS = ['Gestisci le tue prenotazioni', 'Chat diretta con il terapista', 'Storico trattamenti e progressi'];

// Client login/registration, then back to the booking page.
const goToLogin = () => db.auth.redirectToLogin(pageUrl('GuestBooking'));

export default function BookingEntry() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F3F0EA] to-white flex items-center justify-center px-4 sm:px-6 py-20">
      <div className="max-w-4xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ ease: [0.28, 0.11, 0.32, 1], duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">Benvenuto in MassoLab</h1>
          <p className="text-lg text-gray-500">Scegli come preferisci prenotare il tuo prossimo trattamento.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ ease: [0.28, 0.11, 0.32, 1], duration: 0.5, delay: 0.1 }}>
            <Link to={createPageUrl('GuestBooking')} className="block h-full">
              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 h-full flex flex-col group">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
                  <User className="w-7 h-7 text-gray-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Continua come Ospite</h3>
                <p className="text-gray-500 mb-8 flex-grow">
                  Prenota velocemente un appuntamento senza creare un account. Ideale per la tua prima visita.
                </p>
                <div className="flex items-center justify-center gap-2 bg-gray-900 text-white rounded-xl py-4 px-6 font-semibold group-hover:bg-gray-800 transition-colors">
                  Prenota come Ospite <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ ease: [0.28, 0.11, 0.32, 1], duration: 0.5, delay: 0.2 }}>
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border-2 border-red-100 h-full flex flex-col group">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-6">
                <UserPlus className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Registrati come Cliente</h3>
              <div className="space-y-3 mb-8 flex-grow">
                {BENEFITS.map((b) => (
                  <div key={b} className="flex items-center gap-2 text-gray-500">
                    <CircleCheckBig className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={goToLogin}
                className="flex items-center justify-center gap-2 bg-red-600 text-white rounded-xl py-4 px-6 font-semibold hover:bg-red-700 transition-colors w-full"
              >
                Crea Account Gratuito
              </button>
            </div>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8 text-gray-500"
        >
          Hai già un account?{' '}
          <button type="button" onClick={goToLogin} className="text-red-600 font-semibold hover:text-red-700 transition-colors">
            Accedi qui
          </button>
        </motion.p>
      </div>
    </div>
  );
}
