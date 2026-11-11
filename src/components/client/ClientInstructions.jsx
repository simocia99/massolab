import { useState } from 'react';
import { Bath, ChevronDown, ChevronUp, Clock, Droplets, Dumbbell, MessageCircle, Moon, Phone, Shirt, Sun, Utensils } from 'lucide-react';
import { BUSINESS, whatsappUrl } from '@/api/config';
import ExercisePrograms from './ExercisePrograms';

export const BEFORE_SESSION = [
  { icon: Utensils, title: 'Pasto leggero', text: 'Evita pasti abbondanti nelle 2 ore prima della seduta. Un pasto leggero va bene.' },
  {
    icon: Droplets,
    title: 'Idratati bene',
    text: "Bevi acqua a sufficienza prima di venire. L'idratazione migliora la risposta dei tessuti.",
  },
  {
    icon: Shirt,
    title: 'Abbigliamento comodo',
    text: 'Indossa abiti comodi e facili da togliere. Non è necessario portare nulla di speciale.',
  },
  { icon: Dumbbell, title: 'Evita sport intenso', text: 'Se possibile, evita attività fisica intensa nelle ore precedenti la seduta.' },
  {
    icon: Clock,
    title: 'Arriva puntuale',
    text: "Cerca di arrivare con qualche minuto di anticipo per essere già rilassato all'inizio.",
  },
];

export const AFTER_SESSION = [
  {
    icon: Droplets,
    title: 'Bevi molta acqua',
    text: 'È fondamentale idratarsi nelle ore successive. Il massaggio stimola il rilascio di tossine.',
  },
  {
    icon: Sun,
    title: 'Riposa se puoi',
    text: 'Evita attività intensa per almeno 2-3 ore dopo la seduta. Il corpo ha bisogno di integrarsi.',
  },
  {
    icon: Bath,
    title: 'Doccia tiepida',
    text: 'Puoi fare una doccia tiepida (non calda) dopo il trattamento per mantenere il senso di leggerezza.',
  },
  {
    icon: Dumbbell,
    title: 'No sport il giorno stesso',
    text: "Rimanda l'allenamento al giorno successivo per non vanificare i benefici della seduta.",
  },
  { icon: Moon, title: 'Dormi bene', text: 'La notte dopo il massaggio è spesso più profonda e rigenerante. Approfittane.' },
];

function Section({ icon: Icon, iconBox, title, subtitle, open, onToggle, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button type="button" aria-expanded={open} className="w-full flex items-center justify-between p-5 text-left" onClick={onToggle}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBox}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">{title}</p>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>
      {open && children}
    </div>
  );
}

function TipList({ items, rowClass, iconClass }) {
  return (
    <div className="px-5 pb-5 space-y-3 border-t border-gray-50 pt-4">
      {items.map(({ icon: Icon, title, text }) => (
        <div key={title} className={`flex items-start gap-3 p-3 rounded-xl ${rowClass}`}>
          <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${iconClass}`} />
          <div>
            <p className="text-sm font-semibold text-gray-800">{title}</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/** "Indicazioni" tab (bundle `n4`). */
export default function ClientInstructions({ clientEmail }) {
  const [beforeOpen, setBeforeOpen] = useState(false);
  const [afterOpen, setAfterOpen] = useState(false);
  const [exercisesOpen, setExercisesOpen] = useState(true);

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-5 border border-red-100">
        <h2 className="text-base font-bold text-gray-900 mb-1">Indicazioni &amp; Esercizi</h2>
        <p className="text-sm text-gray-500">Le tue schede esercizi domiciliari e le indicazioni per le sedute.</p>
      </div>

      <Section
        icon={Dumbbell}
        iconBox="bg-red-100 text-red-600"
        title="Schede Esercizi Domiciliari"
        subtitle="Programmi personalizzati dal terapista"
        open={exercisesOpen}
        onToggle={() => setExercisesOpen((o) => !o)}
      >
        <div className="px-5 pb-5 border-t border-gray-50 pt-4">
          <ExercisePrograms clientEmail={clientEmail} />
        </div>
      </Section>

      <Section
        icon={Sun}
        iconBox="bg-amber-100 text-amber-600"
        title="Prima della seduta"
        subtitle="Come prepararsi"
        open={beforeOpen}
        onToggle={() => setBeforeOpen((o) => !o)}
      >
        <TipList items={BEFORE_SESSION} rowClass="bg-amber-50/50" iconClass="text-amber-600" />
      </Section>

      <Section
        icon={Moon}
        iconBox="bg-blue-100 text-blue-600"
        title="Dopo la seduta"
        subtitle="Cosa fare per massimizzare i benefici"
        open={afterOpen}
        onToggle={() => setAfterOpen((o) => !o)}
      >
        <TipList items={AFTER_SESSION} rowClass="bg-blue-50/50" iconClass="text-blue-600" />
      </Section>

      <div className="bg-gray-900 rounded-2xl p-5 text-white">
        <p className="font-bold text-base mb-1">Hai domande?</p>
        <p className="text-sm text-gray-300 mb-4">Simone risponde su WhatsApp o per email.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={whatsappUrl('Ciao Simone, ho una domanda')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm px-5 py-3 rounded-xl transition-colors"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </a>
          <a
            href={`mailto:${BUSINESS.email}`}
            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm px-5 py-3 rounded-xl transition-colors"
          >
            <Phone className="w-4 h-4" /> Email
          </a>
        </div>
      </div>
    </div>
  );
}
