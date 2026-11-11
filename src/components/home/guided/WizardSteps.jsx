import { motion } from 'framer-motion';
import { ArrowRight, Clock, Sparkles, Tag, TriangleAlert } from 'lucide-react';
import { DURATIONS, INTENSITIES, NEEDS, STYLES } from './quizData';

const choice = (selected) =>
  selected ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300';

/** Step 1 — what brings you here. */
export function NeedStep({ value, onChange }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Cosa ti porta qui?</h2>
      <p className="text-gray-500 mb-6 text-sm">Scegli la situazione più vicina alla tua. Non deve essere precisa al 100%.</p>
      <div className="grid grid-cols-1 gap-3" role="radiogroup" aria-label="Cosa ti porta qui?">
        {NEEDS.map((n, i) => {
          const selected = value === n.id;
          return (
            <motion.button
              key={n.id}
              type="button"
              role="radio"
              aria-checked={selected}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onChange(n.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left font-medium transition-all ${
                selected ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="text-xl" aria-hidden="true">
                {n.emoji}
              </span>
              <span>{n.label}</span>
              {selected && <span className="ml-auto text-red-500">✓</span>}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function OptionQuestion({ label, options, value, onChange }) {
  return (
    <div className="mb-6">
      <p className="font-semibold text-gray-800 mb-3 text-sm">{label}</p>
      <div className="flex flex-col gap-2" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={value === o.id}
            onClick={() => onChange(o.id)}
            className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${choice(value === o.id)}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function YesNoQuestion({ label, value, onChange }) {
  return (
    <div className="mb-6">
      <p className="font-semibold text-gray-800 mb-3 text-sm">{label}</p>
      <div className="flex gap-3" role="radiogroup" aria-label={label}>
        {['Sì', 'No'].map((text) => {
          const v = text === 'Sì';
          return (
            <button
              key={text}
              type="button"
              role="radio"
              aria-checked={value === v}
              onClick={() => onChange(v)}
              className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all ${choice(value === v)}`}
            >
              {text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Step 2 — five quick questions. */
export function DetailsStep({ answers, onChange }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Dimmi qualcosa in più</h2>
      <p className="text-gray-500 mb-6 text-sm">Poche domande per orientarti meglio. Non ci sono risposte giuste o sbagliate.</p>
      <OptionQuestion
        label="Da quanto tempo hai questo problema?"
        options={DURATIONS}
        value={answers.duration}
        onChange={(v) => onChange('duration', v)}
      />
      <OptionQuestion
        label="Come lo descriveresti in termini di intensità?"
        options={INTENSITIES}
        value={answers.intensity}
        onChange={(v) => onChange('intensity', v)}
      />
      <YesNoQuestion
        label="È la prima volta che cerchi un trattamento per questo?"
        value={answers.first_time}
        onChange={(v) => onChange('first_time', v)}
      />
      <YesNoQuestion
        label="Pratichi sport o attività fisica regolare?"
        value={answers.does_sport}
        onChange={(v) => onChange('does_sport', v)}
      />
      <OptionQuestion
        label="Cosa preferisci in questo momento?"
        options={STYLES}
        value={answers.style_preference}
        onChange={(v) => onChange('style_preference', v)}
      />
    </motion.div>
  );
}

/** Step 3 — recommendation (or "let's talk first" when chronic + strong). */
export function SuggestionStep({ suggestion }) {
  const { treatment, alternative, reason, duration, price, caution } = suggestion;

  if (caution) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5">
          <TriangleAlert className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Prima parliamoci</h2>
        <p className="text-gray-600 leading-relaxed mb-6">
          Dalla tua descrizione emerge un problema cronico e con intensità elevata. In questi casi preferisco fare una breve
          chiacchierata prima di prenotare — per capire meglio la situazione e consigliarti nel modo più utile.
        </p>
        <p className="text-gray-500 text-sm bg-amber-50 border border-amber-200 rounded-xl p-4">
          Non è un rifiuto — è la scelta più corretta per te. Scrivimi su WhatsApp e rispondo entro poche ore.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Ecco il trattamento consigliato per te</h2>
      <p className="text-gray-500 text-sm mb-6">Basato sulle tue risposte — puoi sempre cambiare idea prima della seduta.</p>
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-red-500" />
          <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Consigliato</span>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">{treatment}</h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">{reason}</p>
        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-1 text-gray-500">
            <Clock className="w-4 h-4" /> {duration}
          </span>
          <span className="flex items-center gap-1 text-gray-500">
            <Tag className="w-4 h-4" /> {price}
          </span>
        </div>
      </div>
      {alternative && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Alternativa valida</span>
          </div>
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-700">{alternative}</h4>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      )}
      <p className="text-xs text-gray-400 mt-4 leading-relaxed">
        ⚠️ Questo è uno strumento di orientamento, non una diagnosi. Per qualsiasi dubbio medico rivolgiti al tuo medico.
      </p>
    </motion.div>
  );
}

const FIELD = 'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-red-400';

/** Step 4 — optional contact details. */
export function ContactStep({ contact, onChange }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Un ultimo passo</h2>
      <p className="text-gray-500 text-sm mb-6">
        Lascia i tuoi dati così, quando prenoti, Simone sa già tutto. Opzionale — puoi saltare.
      </p>
      <div className="space-y-3">
        <input
          type="text"
          aria-label="Il tuo nome"
          autoComplete="name"
          placeholder="Il tuo nome"
          value={contact.name}
          onChange={(e) => onChange('name', e.target.value)}
          className={FIELD}
        />
        <input
          type="email"
          aria-label="Email"
          autoComplete="email"
          placeholder="Email"
          value={contact.email}
          onChange={(e) => onChange('email', e.target.value)}
          className={FIELD}
        />
        <input
          type="tel"
          aria-label="Telefono (opzionale)"
          autoComplete="tel"
          placeholder="Telefono (opzionale)"
          value={contact.phone}
          onChange={(e) => onChange('phone', e.target.value)}
          className={FIELD}
        />
      </div>
    </motion.div>
  );
}
