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
      'Per collo e spalle rigidi il miofasciale lavora con pressioni lente e mirate. Se il dolore scende al braccio o senti formicolii, senti prima il medico.',
    duration: '50–60 min',
    price: 'Prezzo in prenotazione',
  },
  schiena: {
    treatment: 'Massaggio Connettivale',
    alternative: 'Massaggio Miofasciale',
    reason:
      'Il connettivale lavora sulle tensioni profonde della schiena, con trazioni leggere su pelle e tessuto sottocutaneo.',
    duration: '50–60 min',
    price: 'Prezzo in prenotazione',
  },
  contratture: {
    treatment: 'Massaggio Miofasciale',
    alternative: 'Coppettazione',
    reason:
      'Per le contratture serve un lavoro lento e mirato sulle fasce. La coppettazione può affiancare il trattamento sulle zone più rigide.',
    duration: '50–60 min',
    price: 'Prezzo in prenotazione',
  },
  sportivo: {
    treatment: 'Massaggio Sportivo',
    alternative: 'Kinesiotaping',
    reason:
      'Il massaggio sportivo può ridurre l\'indolenzimento dei giorni dopo l\'allenamento e aiutarti a ritrovare scioltezza.',
    duration: '50–60 min',
    price: 'Prezzo in prenotazione',
  },
  stress: {
    treatment: 'Massaggio Tradizionale/Rilassante',
    alternative: 'Massaggio Miofasciale',
    reason:
      'Il massaggio rilassante abbassa il ritmo e scioglie la tensione: un\'ora per staccare davvero. Se le tensioni sono profonde, possiamo valutare il miofasciale.',
    duration: '60 min',
    price: 'Prezzo in prenotazione',
  },
  gambe: {
    treatment: 'Linfodrenaggio',
    alternative: 'Massaggio Tradizionale/Rilassante',
    reason:
      'Il linfodrenaggio favorisce il drenaggio dei liquidi e dà una sensazione di gambe più leggere.',
    duration: '50–60 min',
    price: 'Prezzo in prenotazione',
  },
  nonso: {
    treatment: 'Massaggio Tradizionale/Rilassante',
    alternative: null,
    reason:
      'Se non sai da dove partire, una prima seduta rilassante permette di capire dove il tuo corpo porta più tensione. Da lì decidiamo insieme il percorso più adatto.',
    duration: '60 min',
    price: 'Prezzo in prenotazione',
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
