// Static data of the booking flows (copied from the original site).

/** Treatments offered in GuestBooking (bundle `v4`). */
export const GUEST_TREATMENTS = [
  { name: 'Massaggio Tradizionale/Rilassante', duration: 60, price: 60, description: 'Relax profondo, riduzione dello stress' },
  { name: 'Massaggio Sportivo', duration: 60, price: 65, description: 'Recupero muscolare e performance' },
  { name: 'Massaggio Miofasciale', duration: 75, price: 75, description: 'Liberazione delle tensioni fasciali' },
  { name: 'Linfodrenaggio', duration: 90, price: 80, description: 'Drenaggio e riduzione dei gonfiori' },
  { name: 'Massaggio Connettivale', duration: 60, price: 65, description: 'Trattamento del tessuto connettivo' },
  { name: 'Coppettazione', duration: 45, price: 55, description: 'Decontrattura con coppe' },
  { name: 'Kinesiotaping', duration: 30, price: 40, description: 'Taping funzionale e riabilitativo' },
  { name: 'Bendaggio', duration: 45, price: 50, description: 'Bendaggio funzionale e sportivo' },
];

/** Treatment names in the client-area booking form (bundle `L2`). */
export const AREA_TREATMENTS = [
  'Massaggio Tradizionale/Rilassante',
  'Linfodrenaggio',
  'Bendaggio',
  'Massaggio Sportivo',
  'Massaggio Miofasciale',
  'Massaggio Connettivale',
  'Kinesiotaping',
  'Coppettazione',
];

export const BODY_AREAS = [
  'Collo / Cervicale',
  'Spalle',
  'Schiena (dorsale)',
  'Schiena (lombare)',
  'Braccia / Gomiti',
  'Gambe',
  'Ginocchia',
  'Caviglie / Piedi',
  'Tutto il corpo',
  'Altro',
];

export const PROBLEM_DURATIONS = ['Pochi giorni', '1–4 settimane', '1–3 mesi', 'Più di 3 mesi', 'Problema cronico'];

/** Keywords that flag a possible contraindication. */
export const CONTRAINDICATION_KEYWORDS = [
  'tumore',
  'cancro',
  'trombosi',
  'gravidanza',
  'pacemaker',
  'epilessia',
  'febbre',
  'infezione',
  'operazione recente',
  'frattura',
];

export const GUEST_STEPS = ['Trattamento', 'Data & Orario', 'I tuoi dati', 'Scheda salute'];
