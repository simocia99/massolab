// Shared data for the "Come funziona" section (all scroll-driven variants use the same copy and photos).
export const img = (name) => `${import.meta.env.BASE_URL}images/${name}`;

export const STEPS = [
  {
    number: '01',
    tab: 'Prenoti',
    title: '2 minuti. Zero burocrazia.',
    description: 'Scegli trattamento, data e orario. Ricevi subito la conferma della richiesta via email.',
    image: '1bb1e47da.jpg',
  },
  {
    number: '02',
    tab: 'Ti rispondo',
    title: 'Prima che arrivi, sono già pronto.',
    description: 'Un messaggio per assicurarmi che tutto sia chiaro e rispondere a eventuali dubbi.',
    image: '7df950c0e.jpg',
  },
  {
    number: '03',
    tab: 'Ascolto',
    title: 'La valutazione parte da qui.',
    description: 'Prima seduta: breve anamnesi. Dove senti il problema, da quando, cosa lo peggiora.',
    image: '1ff2b3f9b.jpg',
  },
  {
    number: '04',
    tab: 'Agiamo',
    title: 'Un piano chiaro dalla prima seduta.',
    description: 'Si inizia. A fine seduta sai già frequenza, trattamento e obiettivo.',
    image: 'df9d70f1d.jpg',
  },
];
