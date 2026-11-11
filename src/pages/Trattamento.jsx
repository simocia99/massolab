import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, CircleAlert, CircleCheckBig, CircleHelp, Clock, Euro, Phone } from 'lucide-react';
import { whatsappUrl } from '@/api/config';
import { createPageUrl } from '@/lib/utils';
import { TREATMENTS } from '@/data/treatments';
import { TREATMENT_KEYS, TREATMENT_SLUGS } from '@/data/treatmentCards';
import { FaqItem, TreatmentReviews } from '@/components/content/TreatmentBits';

/** Accepts a TREATMENTS key ("Massaggio Sportivo") or a slug ("massaggio-sportivo"). */
export function findTreatment(param) {
  if (param && TREATMENTS[param]) return TREATMENTS[param];
  if (param) {
    const title = Object.keys(TREATMENT_SLUGS).find((t) => TREATMENT_SLUGS[t] === param);
    if (title && TREATMENTS[TREATMENT_KEYS[title]]) return TREATMENTS[TREATMENT_KEYS[title]];
  }
  return TREATMENTS[Object.keys(TREATMENTS)[0]];
}

const reveal = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } };

export default function Trattamento() {
  const [params] = useSearchParams();
  const treatment = findTreatment(params.get('t') || params.get('treatment'));
  const bookUrl = `${createPageUrl('GuestBooking')}?treatment=${encodeURIComponent(treatment.slug)}`;

  useEffect(() => {
    const prev = document.title;
    document.title = `${treatment.titolo} — MassoLab`;
    return () => {
      document.title = prev;
    };
  }, [treatment.titolo]);

  return (
    <div className="min-h-screen bg-[#F3F0EA]">
      <div className="relative bg-gray-900 text-white overflow-hidden" style={{ minHeight: 420 }}>
        <img
          src={treatment.hero_img}
          alt={treatment.titolo}
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-6 pt-24 sm:pt-28 pb-14 sm:pb-16">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-red-400 mb-3">{treatment.tag}</span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 leading-tight">{treatment.titolo}</h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mb-8 leading-relaxed">{treatment.sottotitolo}</p>
          <div className="flex flex-wrap gap-4 mb-8">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur rounded-xl px-4 py-2.5">
              <Clock className="w-4 h-4 text-red-400" />
              <span className="text-sm font-semibold">{treatment.durata}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur rounded-xl px-4 py-2.5">
              <Euro className="w-4 h-4 text-red-400" />
              <span className="text-sm font-semibold">{treatment.prezzo}</span>
            </div>
          </div>
          <Link
            to={bookUrl}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl px-7 py-4 text-base transition-all shadow-xl"
          >
            <Calendar className="w-5 h-5" />
            Prenota ora
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6 sm:space-y-10">
        <motion.div {...reveal} className="bg-white rounded-2xl p-5 sm:p-7 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Per chi è indicato</h2>
          <ul className="space-y-3">
            {treatment.per_chi.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <CircleCheckBig className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700 text-sm leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <motion.div {...reveal} className="bg-white rounded-2xl p-5 sm:p-7 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Problemi tipici</h2>
            <ul className="space-y-2.5">
              {treatment.problemi.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-2" />
                  <span className="text-gray-700 text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div {...reveal} className="bg-white rounded-2xl p-5 sm:p-7 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Benefici attesi</h2>
            <p className="text-xs text-gray-500 mb-4 italic">
              Cosa puoi aspettarti: ogni persona risponde in modo diverso.
            </p>
            <ul className="space-y-2.5">
              {treatment.benefici.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-2" />
                  <span className="text-gray-700 text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <motion.div {...reveal} className="bg-white rounded-2xl p-5 sm:p-7 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Come si svolge la seduta</h2>
          <p className="text-gray-700 text-sm leading-relaxed">{treatment.come_si_svolge}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <motion.div {...reveal} className="bg-green-50 rounded-2xl p-5 sm:p-7">
            <h2 className="text-lg font-bold text-green-800 mb-4">✓ Quando è meglio prenotare</h2>
            <ul className="space-y-2.5">
              {treatment.quando_prenotare.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CircleCheckBig className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-green-900 text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div {...reveal} className="bg-amber-50 rounded-2xl p-5 sm:p-7">
            <h2 className="text-lg font-bold text-amber-800 mb-4">⚠ Quando chiedere prima informazioni</h2>
            <ul className="space-y-2.5">
              {treatment.quando_chiedere_info.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CircleAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span className="text-amber-900 text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <motion.div {...reveal} className="bg-white rounded-2xl p-5 sm:p-7 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <CircleHelp className="w-5 h-5 text-red-500" />
            <h2 className="text-xl font-bold text-gray-900">Domande frequenti</h2>
          </div>
          <div>
            {treatment.faq.map((f) => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </motion.div>

        <TreatmentReviews treatmentType={treatment.slug} />

        <motion.div {...reveal} className="bg-gray-900 rounded-2xl p-6 sm:p-8 text-white text-center">
          <h2 className="text-2xl font-extrabold mb-2">Pronto a prenotare?</h2>
          <p className="text-gray-300 mb-6 text-sm">Scegli data e orario direttamente online. Nessuna attesa al telefono.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to={bookUrl}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl px-8 py-4 text-base transition-all w-full sm:w-auto justify-center"
            >
              <Calendar className="w-5 h-5" />
              Prenota {treatment.titolo}
            </Link>
            <a
              href={whatsappUrl(`Ciao Simone, vorrei informazioni sul trattamento ${treatment.titolo}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-2xl px-8 py-4 text-base transition-all w-full sm:w-auto justify-center"
            >
              <Phone className="w-5 h-5" />
              Hai dubbi? Scrivimi
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
