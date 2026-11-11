// Questions and recommendation rules of the "Aiutami a scegliere" wizard.

export const NEEDS = [
  { id: 'cervicale', label: 'Cervicale e tensioni al collo', emoji: '🔴' },
  { id: 'schiena', label: 'Mal di schiena / zona lombare', emoji: '🟠' },
  { id: 'contratture', label: 'Contratture muscolari', emoji: '🟡' },
  { id: 'sportivo', label: 'Recupero sportivo', emoji: '🟢' },
  { id: 'stress', label: 'Stress e tensione generale', emoji: '🔵' },
  { id: 'gambe', label: 'Gambe pesanti / gonfiore', emoji: '🟣' },
  { id: 'nonso', label: 'Non so quale trattamento scegliere', emoji: '⚪' },
];

export const DURATIONS = [
  { id: 'giorni', label: 'Pochi giorni' },
  { id: 'settimane', label: 'Qualche settimana' },
  { id: 'mesi', label: 'Qualche mese' },
  { id: 'cronico', label: 'Da molto tempo (cronico)' },
];

export const INTENSITIES = [
  { id: 'lieve', label: 'Lieve — ci convivo senza grossi problemi' },
  { id: 'moderata', label: "Moderata — mi limita un po'" },
  { id: 'forte', label: 'Forte — è fastidioso ogni giorno' },
];

export const STYLES = [
  { id: 'rilassante', label: 'Rilassante — voglio staccare e recuperare' },
  { id: 'mirato', label: 'Mirato — voglio risolvere il problema' },
  { id: 'entrambi', label: 'Entrambi vanno bene' },
];

const RULES = {
  cervicale: {
    treatment: 'Massaggio Miofasciale',
    alternative: 'Massaggio Connettivale',
    reason:
      'Le tensioni cervicali croniche originano spesso dalle fasce muscolari. Il miofasciale lavora in profondità per sciogliere i blocchi alla base del problema.',
    duration: '50–60 min',
    price: 'da €55',
  },
  schiena: {
    treatment: 'Massaggio Connettivale',
    alternative: 'Massaggio Miofasciale',
    reason:
      'I dolori lombari sono spesso legati a tensioni nel tessuto connettivo e a posture scorrette. Il connettivale agisce in modo specifico su queste strutture.',
    duration: '50–60 min',
    price: 'da €55',
  },
  contratture: {
    treatment: 'Massaggio Miofasciale',
    alternative: 'Coppettazione',
    reason:
      'Le contratture muscolari rispondono bene a un lavoro profondo e mirato sulle fasce. La coppettazione può affiancare il trattamento per sciogliere le zone più resistenti.',
    duration: '50–60 min',
    price: 'da €55',
  },
  sportivo: {
    treatment: 'Massaggio Sportivo',
    alternative: 'Kinesiotaping',
    reason:
      'Il massaggio sportivo è progettato per accelerare il recupero muscolare, ridurre i DOMS e preparare il corpo alle sessioni successive.',
    duration: '50–60 min',
    price: 'da €60',
  },
  stress: {
    treatment: 'Massaggio Tradizionale/Rilassante',
    alternative: 'Massaggio Miofasciale',
    reason:
      'Il massaggio rilassante abbassa il tono muscolare e il livello di cortisolo, aiutando corpo e mente a recuperare. Se le tensioni sono profonde, il miofasciale può essere più efficace.',
    duration: '60 min',
    price: 'da €50',
  },
  gambe: {
    treatment: 'Linfodrenaggio',
    alternative: 'Massaggio Tradizionale/Rilassante',
    reason:
      'Il linfodrenaggio stimola il ritorno venoso e linfatico, riducendo gonfiori e senso di pesantezza in modo diretto e misurabile.',
    duration: '50–60 min',
    price: 'da €55',
  },
  nonso: {
    treatment: 'Massaggio Tradizionale/Rilassante',
    alternative: null,
    reason:
      'Se non sai da dove partire, una prima seduta rilassante permette di capire dove il tuo corpo porta più tensione. Da lì decidiamo insieme il percorso più adatto.',
    duration: '60 min',
    price: 'da €50',
  },
};

/** Recommendation for the answers (original `X4`). `caution` = chronic + strong pain. */
export function suggestTreatment({ need, duration, intensity, does_sport, style_preference }) {
  const caution = duration === 'cronico' && intensity === 'forte';
  const base = RULES[need] || RULES.nonso;
  if (does_sport && need !== 'sportivo' && style_preference === 'mirato') {
    return { ...base, alternative: 'Massaggio Sportivo', caution };
  }
  return { ...base, caution };
}

export const needLabel = (id) => NEEDS.find((n) => n.id === id)?.label || id;
