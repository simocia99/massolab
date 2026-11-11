// Home "Trattamenti" cards and the maps from card title to slug / TREATMENTS key
// (bundle `B4`, `V4`, `H4`; consumed by the home area).
import { Bandage, CircleDot, Droplets, Dumbbell, Layers, Move, Shield, Sparkles } from 'lucide-react';

/** Card title -> URL slug (bundle `B4`). */
export const TREATMENT_SLUGS = {
  'Massaggio Rilassante': 'massaggio-rilassante',
  'Massaggio Sportivo': 'massaggio-sportivo',
  'Massaggio Miofasciale': 'massaggio-miofasciale',
  Linfodrenaggio: 'linfodrenaggio',
  'Massaggio Connettivale': 'massaggio-connettivale',
  Kinesiotaping: 'kinesiotaping',
  Coppettazione: 'coppettazione',
  'Bendaggio Funzionale': 'bendaggio',
};

/** Card title -> key of TREATMENTS in '@/data/treatments' (bundle `V4`). */
export const TREATMENT_KEYS = {
  'Massaggio Rilassante': 'Massaggio Tradizionale/Rilassante',
  'Massaggio Sportivo': 'Massaggio Sportivo',
  'Massaggio Miofasciale': 'Massaggio Miofasciale',
  Linfodrenaggio: 'Linfodrenaggio',
  'Massaggio Connettivale': 'Massaggio Connettivale',
  Kinesiotaping: 'Kinesiotaping',
  Coppettazione: 'Coppettazione',
  'Bendaggio Funzionale': 'Bendaggio',
};

/** Home treatment cards (bundle `H4`). */
export const TREATMENT_CARDS = [
  {
    title: 'Massaggio Rilassante',
    headline: 'Svuota la mente.',
    description:
      "Tensione accumulata, postura scorretta, stanchezza profonda. Manovre lente e calibrate per sciogliere la tensione e prenderti un'ora per te.",
    icon: Sparkles,
    accent: '#56695C',
    tag: 'Benessere',
    featured: true,
  },
  {
    title: 'Massaggio Sportivo',
    headline: 'Recupera più veloce.',
    description:
      "Pensato per chi si allena con costanza. Può ridurre l'indolenzimento dei giorni dopo (DOMS) e aiutarti a ritrovare scioltezza.",
    icon: Dumbbell,
    accent: '#9A5F2A',
    tag: 'Performance',
    featured: true,
  },
  {
    title: 'Massaggio Miofasciale',
    headline: 'Libera i blocchi.',
    description: 'Lavoro in profondità sulle fasce muscolari, per la rigidità che torna sempre nello stesso punto.',
    icon: Move,
    accent: '#7A5C6E',
    tag: 'Dolori cronici',
  },
  {
    title: 'Linfodrenaggio',
    headline: 'Leggerezza totale.',
    description: 'Manovre delicate e ritmiche che favoriscono il drenaggio dei liquidi, per gambe gonfie e pesanti.',
    icon: Droplets,
    accent: '#4F6B3A',
    tag: 'Circolazione',
  },
  {
    title: 'Massaggio Connettivale',
    headline: 'In profondità.',
    description: 'Stimolazioni riflesse sul tessuto connettivo, per le tensioni profonde di schiena e collo.',
    icon: Layers,
    accent: '#4A6470',
    tag: 'Postura',
  },
  {
    title: 'Kinesiotaping',
    headline: 'Supporto attivo.',
    description: 'Nastri elastici funzionali che supportano senza limitare il movimento naturale.',
    icon: Shield,
    accent: '#4F6B3A',
    tag: 'Prevenzione',
  },
  {
    title: 'Coppettazione',
    headline: 'Pressione negativa.',
    description: 'Coppe a pressione negativa sulle zone più contratte. Possono lasciare segni rossi per qualche giorno.',
    icon: CircleDot,
    accent: '#56695C',
    tag: 'Contratture',
  },
  {
    title: 'Bendaggio Funzionale',
    headline: 'Stabilità sicura.',
    description: "Sostegno articolare per tornare all'attività con più sicurezza. Dopo un infortunio, prima il medico.",
    icon: Bandage,
    accent: '#4F6B3A',
    tag: 'Infortuni',
  },
];
