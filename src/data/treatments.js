// Treatment detail content (titles, benefits, FAQ, sample reviews) used by the
// Trattamento page and the treatment detail modal. Keys = treatment_type values.
const img = (id) => `${import.meta.env.BASE_URL}images/${id}.jpg`;

export const TREATMENTS = {
  "Massaggio Tradizionale/Rilassante": {
    "slug": "Massaggio Tradizionale/Rilassante",
    "titolo": "Massaggio Rilassante",
    "sottotitolo": "Scioglie la tensione muscolare, restituisce leggerezza e aiuta a dormire meglio.",
    "tag": "Benessere & Stress",
    "durata": "60 min",
    "prezzo": "Consulta il listino",
    "gradient": "from-sage-600 to-sage-400",
    "hero_img": img('trattamento-rilassante'),
    "per_chi": [
      "Chi accumula tensione da lavoro sedentario o davanti al pc",
      "Chi ha difficoltà ad addormentarsi o dorme in modo agitato",
      "Chi sente il collo e le spalle sempre contratti",
      "Chi vuole semplicemente staccare e ricaricarsi"
    ],
    "problemi": [
      "Tensione cervicale e spalle rigide",
      "Mal di testa da tensione muscolare",
      "Senso di pesantezza generalizzata",
      "Stress cronico e difficoltà a rilassarsi",
      "Stanchezza muscolare da postura scorretta"
    ],
    "benefici": [
      "Riduzione della tensione muscolare percepita già dalla prima seduta",
      "Miglioramento della qualità del sonno nelle ore successive",
      "Senso di leggerezza e miglioramento dell'umore",
      "Miglior consapevolezza corporea"
    ],
    "come_si_svolge": "Si inizia in posizione prona (a pancia in giù). Vengono usate manovre di sfioramento, impastamento e frizione su schiena, spalle, collo, gambe e piedi. Il ritmo è lento e continuo. Durata circa 60 minuti. Si lavora con oli naturali. Non è necessario togliersi tutti i vestiti se si preferisce lasciare qualcosa.",
    "quando_prenotare": [
      "Dopo un periodo di forte stress lavorativo o personale",
      "Prima di un evento importante per arrivare più centrati",
      "Come rituale mensile di mantenimento del benessere",
      "Quando senti collo e spalle bloccati da giorni"
    ],
    "quando_chiedere_info": [
      "Hai problemi alla pelle nell'area da trattare",
      "Hai febbre o infezioni in corso",
      "Sei in stato di gravidanza (gestibile con variante specifica)",
      "Hai patologie vascolari o problemi circolatori gravi"
    ],
    "faq": [
      {
        "q": "Fa male?",
        "a": "No. È un trattamento a pressione modulabile. Puoi sempre chiedere di alleggerire o aumentare la pressione."
      },
      {
        "q": "Quante sedute servono?",
        "a": "Una seduta dà già sollievo, ma per risultati duraturi sul cronico è consigliato un percorso di 3-5 incontri."
      },
      {
        "q": "Cosa devo portare?",
        "a": "Niente di speciale. Arriva comodo. L'olio viene fornito. Se vuoi puoi portare un cambio."
      },
      {
        "q": "Posso mangiare prima?",
        "a": "Evita pasti abbondanti nell'ora precedente. Un pasto leggero va bene."
      }
    ],
    "recensioni": [
      {
        "nome": "Laura B.",
        "testo": "Finalmente ho trovato qualcuno che sa davvero lavorare sulla zona cervicale. Dopo anni di tensioni, ho dormito come un bambino.",
        "stelle": 5
      },
      {
        "nome": "Marco T.",
        "testo": "Ambiente tranquillo, mani esperte. Mi aspettavo il solito massaggio 'da centro benessere', invece è un lavoro molto più preciso.",
        "stelle": 5
      },
      {
        "nome": "Silvia R.",
        "testo": "Lo faccio ogni mese da 6 mesi. Ogni volta è diverso perché Simone ascolta davvero come stai quel giorno.",
        "stelle": 5
      }
    ]
  },
  "Massaggio Sportivo": {
    "slug": "Massaggio Sportivo",
    "titolo": "Massaggio Sportivo",
    "sottotitolo": "Per chi si allena: recupera più in fretta, previene gli infortuni e torni in campo con il giusto tono muscolare.",
    "tag": "Sport & Performance",
    "durata": "60 min",
    "prezzo": "Consulta il listino",
    "gradient": "from-ocra to-[#E2B98C]",
    "hero_img": img('trattamento-sportivo'),
    "per_chi": [
      "Sportivi amatoriali e agonisti che si allenano almeno 2-3 volte a settimana",
      "Chi sente dolori muscolari persistenti dopo l'allenamento (DOMS forti)",
      "Chi vuole ottimizzare il recupero tra sessioni ravvicinate",
      "Chi ha piccoli indolenzimenti ricorrenti nello stesso punto"
    ],
    "problemi": [
      "Dolori muscolari post-allenamento (DOMS)",
      "Rigidità muscolare che limita la performance",
      "Crampi ricorrenti o tensioni in specifiche catene muscolari",
      "Recupero lento tra allenamenti ravvicinati",
      "Microtraumi accumulati da sport di resistenza"
    ],
    "benefici": [
      "Accelerazione del recupero muscolare dopo sforzo intenso",
      "Riduzione delle tensioni e aumento della mobilità articolare",
      "Migliore percezione corporea e prevenzione dei sovraccarichi",
      "Supporto mentale alla preparazione atletica"
    ],
    "come_si_svolge": "Si lavora sulle catene muscolari più sollecitate dallo sport che pratichi. Le manovre includono frizioni profonde, stretching passivo guidato e lavoro sui trigger point. La pressione è più intensa rispetto al massaggio rilassante. Si può fare sia pre che post gara/allenamento, con approcci diversi.",
    "quando_prenotare": [
      "Nelle 24-48h dopo un allenamento intenso o una gara",
      "Prima di una competizione (almeno 2 giorni prima)",
      "Come protocollo settimanale durante la stagione agonistica",
      "Quando senti una zona che 'tira' in modo persistente"
    ],
    "quando_chiedere_info": [
      "Hai un infortunio acuto (distorsione, strappo fresco — aspetta 48-72h)",
      "Hai ematomi o contusioni importanti in zona",
      "Hai dolori articolari con gonfiore che non si spiegano",
      "Sei in periodo post-operatorio (dipende dal tipo di intervento)"
    ],
    "faq": [
      {
        "q": "Quando farlo rispetto all'allenamento?",
        "a": "Se è pre-performance: 48h prima. Se è per recupero: nelle 24-48h dopo l'allenamento. Subito dopo la gara è possibile ma con manovre più leggere."
      },
      {
        "q": "È doloroso?",
        "a": "Può essere intenso sulle zone più contratte. Il disagio deve essere sempre tollerabile — comunica sempre come ti senti durante la seduta."
      },
      {
        "q": "Posso farlo se ho un dolore acuto?",
        "a": "Se è un infortunio acuto recente, aspetta 48-72h. Se è un dolore cronico ricorrente, il massaggio sportivo può essere molto utile."
      },
      {
        "q": "Ogni quanto è utile farlo?",
        "a": "Per sportivi regolari: 1 volta ogni 2-3 settimane. In periodi intensi: anche settimanalmente."
      }
    ],
    "recensioni": [
      {
        "nome": "Andrea C.",
        "testo": "Corro maratone e dopo ogni lungo faccio una seduta qui. I tempi di recupero sono cambiati radicalmente rispetto a prima.",
        "stelle": 5
      },
      {
        "nome": "Francesca M.",
        "testo": "Gioco a calcio. Avevo un problema cronico al polpaccio che con l'osteopata non si risolveva. In 3 sedute ho ripreso ad allenarmi normalmente.",
        "stelle": 5
      },
      {
        "nome": "Luca P.",
        "testo": "Massaggio molto tecnico, sente subito dove lavori e dove hai più tensione. Non il massaggio da spa — è un lavoro serio.",
        "stelle": 5
      }
    ]
  },
  "Massaggio Miofasciale": {
    "slug": "Massaggio Miofasciale",
    "titolo": "Massaggio Miofasciale",
    "sottotitolo": "Lavora in profondità sulle fasce muscolari per liberare blocchi, rigidità croniche e dolori difficili da spiegare.",
    "tag": "Dolori cronici & Postura",
    "durata": "60 min",
    "prezzo": "Consulta il listino",
    "gradient": "from-[#7A5C6E] to-[#B49AA8]",
    "hero_img": img('trattamento-miofasciale'),
    "per_chi": [
      "Chi ha dolori muscolari cronici che si ripresentano sempre nello stesso punto",
      "Chi sente limitazioni nei movimenti quotidiani (alzarsi, girarsi, piegarsi)",
      "Chi ha già provato altri trattamenti senza risultati duraturi",
      "Chi ha una postura alterata da anni di lavoro sedentario"
    ],
    "problemi": [
      "Dolori muscolari cronici e persistenti",
      "Limitazioni di movimento (es. non riesci a girare bene il collo)",
      "Senso di rigidità muscolare profonda",
      "Dolori posturali da lavoro al computer",
      "Tensioni non risolte da massaggi superficiali"
    ],
    "benefici": [
      "Recupero parziale o totale del range di movimento limitato",
      "Riduzione dei dolori cronici nelle zone trattate",
      "Miglioramento della postura nel tempo (con percorso continuato)",
      "Senso di leggerezza e fluidità nei movimenti"
    ],
    "come_si_svolge": "Si usano tecniche di pressione lenta e sostenuta sulla fascia muscolare — il tessuto connettivo che avvolge i muscoli. Non è una pressione intensa ma profonda e progressiva. Il corpo risponde con un rilascio graduale. A volte si lavora anche su zone lontane dal dolore (le fasce sono collegate in catene).",
    "quando_prenotare": [
      "Hai un dolore muscolare che dura da settimane o mesi",
      "Senti un punto sempre contratto che non si scioglie mai",
      "Hai limitazione nel movimento che interferisce con le attività quotidiane",
      "Vuoi migliorare la postura in modo strutturato"
    ],
    "quando_chiedere_info": [
      "Non hai ancora una diagnosi chiara e il dolore è molto forte",
      "Hai una patologia infiammatoria in fase acuta",
      "Hai dolori articolari con gonfiore importante",
      "Hai osteoporosi severa"
    ],
    "faq": [
      {
        "q": "È diverso dal massaggio normale?",
        "a": "Sì. Il lavoro è più lento, più profondo e più mirato. Non è rilassante nel senso classico — è terapeutico e focalizzato su zone specifiche."
      },
      {
        "q": "Quante sedute servono?",
        "a": "Per problemi cronici, un minimo di 4-6 sedute. I miglioramenti si notano già dalla seconda o terza."
      },
      {
        "q": "Fa male?",
        "a": "Può esserci un leggero disagio durante la pressione sostenuta, ma mai dolore acuto. Il rilascio dà spesso una sensazione di sollievo immediato."
      },
      {
        "q": "Si può combinare con altri trattamenti?",
        "a": "Sì, si combina bene con kinesiotaping, coppettazione e percorsi posturali."
      }
    ],
    "recensioni": [
      {
        "nome": "Carla V.",
        "testo": "Avevo un dolore alla spalla destra da 2 anni. Dopo 5 sedute miofasciali con Simone, sono tornata a dormire sul fianco destro.",
        "stelle": 5
      },
      {
        "nome": "Paolo G.",
        "testo": "Non credevo molto nel massaggio per il mal di schiena cronico. Mi sbagliavo. Il lavoro fasciale ha fatto la differenza.",
        "stelle": 5
      },
      {
        "nome": "Elena S.",
        "testo": "Trattamento molto diverso da quello che mi aspettavo. Non premi forte ma senti comunque che lavora in profondità. Risultati ottimi.",
        "stelle": 5
      }
    ]
  },
  "Linfodrenaggio": {
    "slug": "Linfodrenaggio",
    "titolo": "Linfodrenaggio",
    "sottotitolo": "Riduce gonfiori, pesantezza e ritenzione idrica. Delicato, efficace, adatto a momenti delicati del corpo.",
    "tag": "Circolazione & Gambe",
    "durata": "60 min",
    "prezzo": "Consulta il listino",
    "gradient": "from-[#4A6470] to-sage-300",
    "hero_img": img('trattamento-linfodrenaggio'),
    "per_chi": [
      "Chi soffre di gambe gonfie e pesanti, soprattutto la sera",
      "Chi ha problemi di ritenzione idrica",
      "Chi è in fase post-operatoria (chirurgia estetica, ortopedica)",
      "Chi ha linfedema diagnosticato o tendenza al gonfiore degli arti"
    ],
    "problemi": [
      "Gonfiore alle gambe e alle caviglie",
      "Senso di pesantezza agli arti inferiori",
      "Ritenzione idrica generalizzata",
      "Post-operatorio con gonfiore",
      "Cellulite edematosa"
    ],
    "benefici": [
      "Riduzione visibile del gonfiore agli arti già dopo poche sedute",
      "Sensazione di leggerezza nelle gambe",
      "Miglioramento della circolazione linfatica",
      "Supporto al recupero post-chirurgico (sempre con indicazione medica)"
    ],
    "come_si_svolge": "Il linfodrenaggio manuale usa manovre leggere, lente e ritmiche che seguono le vie linfatiche del corpo. Non è un massaggio a pressione — è gentile per definizione. La seduta inizia spesso con il lavoro sui linfonodi del collo, poi si procede agli arti. Si lavora a contatto diretto con la pelle, senza oli.",
    "quando_prenotare": [
      "Hai le gambe gonfie da settimane senza cause evidenti",
      "Sei in fase post-operatoria (con consenso del medico)",
      "Stai attraversando un momento ormonale (ciclo, menopausa)",
      "Lavori molte ore in piedi o seduto e senti pesantezza"
    ],
    "quando_chiedere_info": [
      "Hai trombosi venosa profonda attiva (è una controindicazione assoluta)",
      "Hai infezioni o infiammazioni acute in zona",
      "Hai patologie cardiache o renali gravi",
      "Il gonfiore è comparso improvvisamente senza causa — consulta prima un medico"
    ],
    "faq": [
      {
        "q": "Fa male?",
        "a": "No, è uno dei trattamenti più delicati. Le manovre sono leggere e la pressione è minima. Molte persone si addormentano durante la seduta."
      },
      {
        "q": "Quante sedute servono?",
        "a": "Per gonfiori occasionali: 2-3 sedute. Per linfedema cronico o post-operatorio: ciclo di 8-10 sedute ravvicinate."
      },
      {
        "q": "Può aiutare con la cellulite?",
        "a": "Può aiutare con la cellulite edematosa (gonfia). Sulle forme fibrose ha effetti più limitati."
      },
      {
        "q": "Posso farlo durante il ciclo?",
        "a": "Sì, anzi può dare sollievo al gonfiore tipico di quel periodo."
      }
    ],
    "recensioni": [
      {
        "nome": "Giovanna T.",
        "testo": "Ho fatto il linfodrenaggio dopo la chirurgia al ginocchio. Il gonfiore si è ridotto molto più in fretta del previsto. Lo consiglio a chiunque sia in post-op.",
        "stelle": 5
      },
      {
        "nome": "Maria L.",
        "testo": "Lavoro 8 ore in piedi. La sera non riuscivo neanche a infilarmi le scarpe. Ora faccio una seduta ogni 2 settimane e la differenza è enorme.",
        "stelle": 5
      },
      {
        "nome": "Sara C.",
        "testo": "Trattamento dolcissimo ma efficace. Le gambe dopo sembrano diverse, leggere. Avrei dovuto iniziare prima.",
        "stelle": 5
      }
    ]
  },
  "Massaggio Connettivale": {
    "slug": "Massaggio Connettivale",
    "titolo": "Massaggio Connettivale",
    "sottotitolo": "Agisce sul tessuto sottocutaneo con stimolazioni riflesse. Per dolori vertebrali, tensioni profonde e problemi posturali.",
    "tag": "Postura & Colonna",
    "durata": "60 min",
    "prezzo": "Consulta il listino",
    "gradient": "from-sage-800 to-sage-500",
    "hero_img": img('trattamento-connettivale'),
    "per_chi": [
      "Chi ha dolori alla colonna vertebrale cronici o ricorrenti",
      "Chi ha problemi posturali come ipercifosi, iperlordosi o scoliosi lieve",
      "Chi sente tensioni profonde che i massaggi normali non risolvono",
      "Chi ha dolori riferiti (sente il dolore in una zona ma l'origine è altrove)"
    ],
    "problemi": [
      "Dolore lombare cronico",
      "Dolore cervicale con irradiazione alle braccia",
      "Tensioni profonde non risposte ad altri trattamenti",
      "Problemi posturali strutturati",
      "Dolori riferiti di origine muscolo-fasciale"
    ],
    "benefici": [
      "Miglioramento della mobilità vertebrale",
      "Riduzione delle tensioni profonde non raggiungibili con massaggio superficiale",
      "Effetto positivo sulla postura nel medio termine",
      "Miglior consapevolezza posturale"
    ],
    "come_si_svolge": "Il massaggio connettivale usa prese corte e specifiche sul tessuto sottocutaneo — quello tra la pelle e i muscoli. Si lavora con le dita in modo preciso e progressivo su specifiche zone riflesse. Può dare una sensazione di bruciore lieve e passeggero nella zona trattata, che poi lascia posto al sollievo.",
    "quando_prenotare": [
      "Hai dolori vertebrali che durano da mesi",
      "I massaggi standard non ti hanno dato risultati",
      "Hai una postura che vorresti correggere progressivamente",
      "Senti tensioni profonde difficili da localizzare"
    ],
    "quando_chiedere_info": [
      "Hai una patologia infiammatoria acuta della colonna (es. ernia in fase acuta)",
      "Hai pelle sensibile con problemi dermatologici in zona",
      "Hai una diagnosi di osteoporosi severa",
      "Sei in gravidanza"
    ],
    "faq": [
      {
        "q": "Perché sento un bruciore durante la seduta?",
        "a": "È normale. È la risposta del tessuto connettivo alla stimolazione. Il bruciore è lieve e passeggero, e indica che si sta lavorando nel modo corretto."
      },
      {
        "q": "Quante sedute servono?",
        "a": "Un ciclo base è di 6-8 sedute. Si fanno 2 volte a settimana per le prime settimane, poi si dirada."
      },
      {
        "q": "Si può fare insieme al massaggio classico?",
        "a": "Sì, spesso si integra bene in un percorso più ampio."
      },
      {
        "q": "Devo portare qualcosa?",
        "a": "No. Si lavora a pelle scoperta sulla zona dorsale. Abbigliamento comodo facilita la seduta."
      }
    ],
    "recensioni": [
      {
        "nome": "Roberto F.",
        "testo": "Ho una lombalgia cronica da 10 anni. Il massaggio connettivale è l'unica cosa che mi ha dato sollievo duraturo, insieme alla fisioterapia.",
        "stelle": 5
      },
      {
        "nome": "Marta B.",
        "testo": "Sensazione strana ma efficacissima. La prima seduta ero scettica, dalla terza ho capito che funzionava davvero.",
        "stelle": 5
      },
      {
        "nome": "Giorgio P.",
        "testo": "Lavoro di qualità. Simone spiega cosa fa e perché — mi ha aiutato anche a capire meglio il mio corpo.",
        "stelle": 5
      }
    ]
  },
  "Kinesiotaping": {
    "slug": "Kinesiotaping",
    "titolo": "Kinesiotaping",
    "sottotitolo": "Nastri elastici funzionali che supportano muscoli e articolazioni, senza bloccare il movimento. Utile in prevenzione e recupero.",
    "tag": "Prevenzione & Recupero",
    "durata": "30–45 min",
    "prezzo": "Consulta il listino",
    "gradient": "from-[#4F6B3A] to-[#9DB57E]",
    "hero_img": img('trattamento-kinesiotaping'),
    "per_chi": [
      "Sportivi che hanno piccoli dolori ma vogliono continuare ad allenarsi",
      "Chi è in fase di recupero da un infortunio e vuole supporto attivo",
      "Chi ha instabilità articolare ricorrente (es. caviglie che si distorcono spesso)",
      "Chi ha dolori posturali durante il lavoro"
    ],
    "problemi": [
      "Distorsioni e instabilità articolari",
      "Tendinopatie e infiammazioni tendinee",
      "Dolori muscolari localizzati da sforzo",
      "Gonfiore localizzato post-trauma",
      "Supporto in fase di recupero da infortuni"
    ],
    "benefici": [
      "Supporto meccanico senza limitare la mobilità naturale",
      "Riduzione del dolore nella zona applicata",
      "Favorisce il drenaggio del gonfiore localizzato",
      "Supporto propriocettivo (aiuta il corpo a 'sentire' meglio l'articolazione)"
    ],
    "come_si_svolge": "Si valuta la zona da trattare e si preparano le strisce di nastro elastico nella misura e tensione corrette. L'applicazione dura 20-30 minuti. Il nastro resta sulla pelle per 3-5 giorni, anche in acqua. Può essere applicato da solo o come parte di una seduta più ampia.",
    "quando_prenotare": [
      "Hai un dolore localizzato che si ripresenta durante l'attività fisica",
      "Stai recuperando da un infortunio e vuoi supporto attivo",
      "Hai un evento sportivo imminente e vuoi prevenire sovraccarichi",
      "Hai gonfiore localizzato da gestire"
    ],
    "quando_chiedere_info": [
      "Hai pelle sensibile, allergie ai cerotti o ferite aperte in zona",
      "Hai un infortunio grave che richiede immobilizzazione",
      "Hai trombosi venosa in zona",
      "Vuoi usarlo come unico trattamento per un problema cronico (è integrativo, non sostitutivo)"
    ],
    "faq": [
      {
        "q": "Per quanto tempo rimane il nastro?",
        "a": "Di norma 3-5 giorni. Si può fare la doccia e anche il bagno in piscina senza problemi."
      },
      {
        "q": "Si può fare lo sport con il kinesiotape?",
        "a": "Sì, è progettato per essere portato durante l'attività. Non limita il movimento."
      },
      {
        "q": "Fa male toglierlo?",
        "a": "No se si rimuove delicatamente, meglio dopo un bagno caldo. Tirarlo di scatto può irritare la pelle."
      },
      {
        "q": "È utile senza massaggio?",
        "a": "Sì, ma combinato con un massaggio specifico l'effetto è maggiore."
      }
    ],
    "recensioni": [
      {
        "nome": "Davide R.",
        "testo": "Uso il kinesiotape da anni per la caviglia. Con l'applicazione di Simone regge molto meglio rispetto a quando lo facevo da solo.",
        "stelle": 5
      },
      {
        "nome": "Cristina M.",
        "testo": "L'ho messo sul ginocchio durante la preparazione alla maratona. Ho corso senza dolore per 5 settimane consecutive.",
        "stelle": 5
      },
      {
        "nome": "Fabio L.",
        "testo": "Scettico all'inizio, ora è parte del mio protocollo di recupero settimanale. Funziona.",
        "stelle": 5
      }
    ]
  },
  "Coppettazione": {
    "slug": "Coppettazione",
    "titolo": "Coppettazione",
    "sottotitolo": "Tecnica con coppe a pressione negativa per sciogliere contratture profonde, migliorare la circolazione e ridurre dolori persistenti.",
    "tag": "Contratture & Recupero",
    "durata": "45–60 min",
    "prezzo": "Consulta il listino",
    "gradient": "from-[#9A5F2A] to-ocra",
    "hero_img": img('trattamento-coppettazione'),
    "per_chi": [
      "Chi ha contratture muscolari profonde che non si sciolgono con il massaggio normale",
      "Chi ha dolori muscolari cronici localizzati",
      "Sportivi con zone di tensione ricorrente",
      "Chi ha cicatrici o aderenze tissutali che limitano il movimento"
    ],
    "problemi": [
      "Contratture muscolari profonde e croniche",
      "Dolori localizzati da tensione persistente",
      "Scarsa circolazione locale",
      "Aderenze fasciali e cicatrici",
      "Recupero da sforzo sportivo intenso"
    ],
    "benefici": [
      "Scioglimento delle contratture profonde che la pressione manuale non raggiunge",
      "Aumento della circolazione locale e ossigenazione del tessuto",
      "Riduzione del dolore nelle zone trattate",
      "Effetto di decompressione sulle fasce muscolari"
    ],
    "come_si_svolge": "Si applicano coppe di silicone o vetro sulla pelle, creando una pressione negativa (aspirazione). Le coppe possono restare ferme (statica) o scorrere sulla pelle (dinamica). La seduta dura 45-60 minuti. Spesso si combina con il massaggio classico. Attenzione: la coppettazione può lasciare segni rossi o viola sulla pelle (petecchie) per 3-7 giorni — è normale e non pericoloso.",
    "quando_prenotare": [
      "Hai una contrattura che dura da settimane",
      "Vuoi accelerare il recupero muscolare dopo sforzo intenso",
      "Hai zone con scarsa circolazione e senso di freddo localizzato",
      "Hai aderenze da cicatrici che limitano il movimento"
    ],
    "quando_chiedere_info": [
      "Hai problemi di coagulazione o prendi anticoagulanti",
      "Hai pelle molto sensibile o capillari fragili",
      "Hai varici importanti nella zona da trattare",
      "Hai febbre o infezioni in corso"
    ],
    "faq": [
      {
        "q": "I segni sulla pelle sono pericolosi?",
        "a": "No. I segni rossi/viola che restano dopo la coppettazione sono dovuti all'afflusso di sangue superficiale — non sono ecchimosi da trauma. Spariscono in 3-7 giorni."
      },
      {
        "q": "Fa male?",
        "a": "La sensazione è di pressione e calore. Può essere intensa nelle zone più contratte ma non dolorosa nel senso classico. Comunica sempre se è troppo."
      },
      {
        "q": "Quante sedute servono?",
        "a": "Spesso 2-4 sedute danno risultati visibili. Per cronici si può fare un ciclo più lungo."
      },
      {
        "q": "Posso farmi vedere in pubblico dopo?",
        "a": "Se hai appuntamenti importanti, pianificala almeno 7-10 giorni prima per far sbiadire i segni."
      }
    ],
    "recensioni": [
      {
        "nome": "Nicola F.",
        "testo": "Mi ha aiutato su una contrattura al trapezio che avevo da 3 mesi. Tre sedute e il dolore è sparito. Tecnica strana da vedere, ma funziona.",
        "stelle": 5
      },
      {
        "nome": "Alessia B.",
        "testo": "Ero preoccupata per i segni, ma spariscono in pochi giorni. I benefici invece durano molto di più.",
        "stelle": 5
      },
      {
        "nome": "Marco D.",
        "testo": "Uso la coppettazione dopo le gare. Recupero notevolmente più veloce. Ormai è parte del mio protocollo.",
        "stelle": 5
      }
    ]
  },
  "Bendaggio": {
    "slug": "Bendaggio",
    "titolo": "Bendaggio Funzionale",
    "sottotitolo": "Stabilizzazione articolare con bende rigide o semi-rigide. Per prevenire distorsioni, supportare il rientro all'attività e gestire il post-infortunio.",
    "tag": "Infortuni & Prevenzione",
    "durata": "30–45 min",
    "prezzo": "Consulta il listino",
    "gradient": "from-sage-700 to-lime-400",
    "hero_img": img('trattamento-bendaggio'),
    "per_chi": [
      "Chi ha avuto distorsioni ripetute alla stessa articolazione",
      "Chi pratica sport di contatto o ad alto rischio di infortuni",
      "Chi è in fase di rientro all'attività dopo un infortunio",
      "Chi ha instabilità articolare diagnosticata"
    ],
    "problemi": [
      "Instabilità di caviglia, polso o ginocchio",
      "Distorsioni ricorrenti",
      "Rientro all'attività sportiva post-infortunio",
      "Protezione preventiva durante gare o allenamenti",
      "Supporto articolare post-chirurgico (con indicazione medica)"
    ],
    "benefici": [
      "Stabilizzazione meccanica dell'articolazione durante il movimento",
      "Riduzione del rischio di nuove distorsioni",
      "Permette di rientrare all'attività con maggior sicurezza",
      "Feedback propriocettivo sull'articolazione trattata"
    ],
    "come_si_svolge": "Si valuta l'articolazione da bendare e il tipo di attività che dovrai svolgere. Si prepara la pelle con uno spray o sottobenda ipoallergenico, poi si applica il bendaggio in più strati con tecnica specifica. Il bendaggio funzionale non immobilizza completamente — permette i movimenti utili e blocca quelli rischiosi.",
    "quando_prenotare": [
      "Prima di una gara o allenamento con articolazione a rischio",
      "Stai riprendendo ad allenarti dopo un infortunio",
      "Hai una caviglia o un polso instabile che si distorce facilmente",
      "Il medico o il fisioterapista ti ha consigliato il supporto articolare"
    ],
    "quando_chiedere_info": [
      "Hai un infortunio acuto grave che richiede valutazione medica prima",
      "Hai allergia ai cerotti o ai materiali del bendaggio",
      "Hai problemi circolatori agli arti",
      "Il dolore è forte anche a riposo — consulta prima un medico"
    ],
    "faq": [
      {
        "q": "Per quanto tempo regge il bendaggio?",
        "a": "Un bendaggio funzionale dura in media 3-5 giorni se fatto bene. Non si dovrebbe bagnarsi eccessivamente."
      },
      {
        "q": "È diverso dal kinesiotaping?",
        "a": "Sì. Il bendaggio funzionale usa bende rigide o semi-rigide per dare un supporto meccanico vero. Il kinesiotaping è elastico e ha un'azione più propriocettiva."
      },
      {
        "q": "Posso giocare con il bendaggio?",
        "a": "Sì, è pensato per essere portato durante l'attività sportiva."
      },
      {
        "q": "Fa male toglierlo?",
        "a": "Si rimuove tagliandolo — non si strappa dalla pelle. Con il sottobenda la pelle è protetta."
      }
    ],
    "recensioni": [
      {
        "nome": "Thomas K.",
        "testo": "Mi distorcevo la caviglia destra praticamente ogni stagione. Con il bendaggio di Simone ho giocato tutta la stagione senza problemi.",
        "stelle": 5
      },
      {
        "nome": "Valentina C.",
        "testo": "Sono tornata a giocare a pallavolo 3 settimane dopo la distorsione, con il bendaggio. Perfetto per la transizione.",
        "stelle": 5
      },
      {
        "nome": "Riccardo M.",
        "testo": "Tecnica precisa e professionale. Si vede che sa quello che fa.",
        "stelle": 5
      }
    ]
  }
};

export default TREATMENTS;
