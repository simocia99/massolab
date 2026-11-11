// Shared data for the "Come funziona" section (all scroll-driven variants use the same copy and photos).
export const img = (name) => `${import.meta.env.BASE_URL}images/${name}`;

export const STEPS = [
  {
    number: '01',
    tab: 'Prenoti',
    title: '2 minuti. Zero burocrazia.',
    description: 'Scegli trattamento, data e orario. Ricevi subito la conferma della richiesta via email.',
    image: 'passo-1-prenoti.jpg',
  },
  {
    number: '02',
    tab: 'Ti rispondo',
    title: 'Prima che arrivi, sono già pronto.',
    description: 'Un messaggio per assicurarmi che tutto sia chiaro e rispondere a eventuali dubbi.',
    image: 'passo-2-ti-rispondo.jpg',
  },
  {
    number: '03',
    tab: 'Ascolto',
    title: 'La valutazione parte da qui.',
    description: 'Prima seduta: breve anamnesi. Dove senti il problema, da quando, cosa lo peggiora.',
    image: 'passo-3-ascolto.jpg',
  },
  {
    number: '04',
    tab: 'Agiamo',
    title: 'Un piano chiaro dalla prima seduta.',
    description: 'Si inizia. A fine seduta sai già frequenza, trattamento e obiettivo.',
    image: 'passo-4-agiamo.jpg',
  },
];
