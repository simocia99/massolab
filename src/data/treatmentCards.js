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
      'Tensione accumulata, postura scorretta, stanchezza profonda. Manovre lente e calibrate che sciolgono ciò che nessun farmaco può raggiungere.',
    icon: Sparkles,
    accent: '#56695C',
    tag: 'Benessere',
    featured: true,
  },
  {
    title: 'Massaggio Sportivo',
    headline: 'Recupera più veloce.',
    description:
      'Progettato per chi si allena seriamente. Riduce i DOMS, ottimizza i tempi di recupero e prepara il corpo alla sessione successiva.',
    icon: Dumbbell,
    accent: '#9A5F2A',
    tag: 'Performance',
    featured: true,
  },
  {
    title: 'Massaggio Miofasciale',
    headline: 'Libera i blocchi.',
    description: 'Lavoro in profondità sulle fasce muscolari per eliminare aderenze e rigidità croniche.',
    icon: Move,
    accent: '#7A5C6E',
    tag: 'Dolori cronici',
  },
  {
    title: 'Linfodrenaggio',
    headline: 'Leggerezza totale.',
    description: 'Riduce gonfiori e senso di pesantezza stimolando il drenaggio dei liquidi in eccesso.',
    icon: Droplets,
    accent: '#4F6B3A',
    tag: 'Circolazione',
  },
  {
    title: 'Massaggio Connettivale',
    headline: 'In profondità.',
    description: 'Stimolazioni riflesse sul tessuto connettivo per dolori vertebrali e tensioni profonde.',
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
    description: 'Coppe a pressione negativa per sciogliere contratture profonde e migliorare la circolazione locale.',
    icon: CircleDot,
    accent: '#56695C',
    tag: 'Contratture',
  },
  {
    title: 'Bendaggio Funzionale',
    headline: 'Stabilità sicura.',
    description: "Stabilizzazione articolare per prevenzione, supporto post-infortunio e rientro all'attività.",
    icon: Bandage,
    accent: '#4F6B3A',
    tag: 'Infortuni',
  },
];
