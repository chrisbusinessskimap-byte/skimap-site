/* Testi del sito in italiano. Ogni frase deve venire dalla scheda fatti di Ski Maps:
   ciò che non è confermato va scritto con todo('domanda'), che lo segna come [DA CONFERMARE].
   Dopo una modifica: node tools/build.mjs && node tools/check.mjs */
import { todo } from '../tools/site.mjs';

export default {
  lang: 'it', locale: 'it_IT', name: 'Italiano',
  siteTitle: 'Ski Maps · Navigatore GPS per sciatori',
  tagline: 'Navigatore GPS per sciatori',
  ui: {
    skip: 'Vai al contenuto', homeAria: 'Ski Maps, torna alla home', menu: 'Menu', sections: 'Sezioni', langs: 'Lingua',
    footer: 'Piè di pagina', cta: 'Avvisami quando esce', ctaShort: 'Avvisami',
    contact: 'Contatti:', privacy: 'Informativa privacy', delete: 'Elimina account', biz: 'Per le società impianti',
    sources: 'Fonti e licenze', home: 'Home',
    data: 'Dati mappa © OpenStreetMap contributors, licenza ODbL · Mappe di sfondo nell’app © MapTiler · Rilievo: INGV TINITALY e Copernicus EU-DEM (dati modificati) · Orari: open data STA Südtirolmobil e Trentino Trasporti ·',
    mapdata: 'Dati mappa:',
    ctaBand: 'Ski Maps è in arrivo su Google Play. Ti avvisiamo quando esce.',
    shotSize: (w, h) => `${w} × ${h} px`,
  },
  nav: { how: 'Come funziona', areas: 'Aree', faq: 'Domande', privacy: 'Privacy', about: 'Chi siamo' },

  home: {
    title: 'Ski Maps · Navigatore GPS per sciatori',
    desc: 'Ski Maps, navigatore GPS per sciatori: ti dice dove andare, pista per pista e impianto per impianto, per tutto il giro, anche tra un comprensorio e l’altro con bus e treni. In arrivo su Google Play.',
    ogAlt: 'Logo di Ski Maps con la scritta «GPS Navigator for Skiers · Navigatore GPS per sciatori»',
    eyebrow: 'Ski Maps · Navigatore GPS per sciatori',
    h1a: 'Tutto il giro.', h1b: 'Anche tra i comprensori.',
    lede: 'Ski Maps ti dice dove andare, pista per pista e impianto per impianto, dal punto dove sei a quello dove vuoi arrivare. Compresi i bus e i treni di collegamento.',
    howBtn: 'Come funziona',
    store: 'In arrivo su Google Play · iOS in seguito',
    trust: 'La tua posizione GPS resta sul telefono.',
    hint: 'Anteprima: tocca una stazione sulla montagna',
    canvasAria: 'Anteprima 3D dimostrativa del gruppo del Sella con piste e impianti: tocca una stazione per vedere un percorso di esempio per ogni livello',
    rc: { dest: 'Destinazione', from: 'da', beg: 'Principiante', begS: 'Solo piste facili', int: 'Intermedio', intS: 'Facili + medie', adv: 'Avanzato', advS: 'Tutte le piste', legs: 'Tratte del percorso' },
    pointsTitle: 'Cosa fa Ski Maps',
    points: [
      ['level', 'Per il tuo livello', 'Principiante, intermedio o avanzato: il percorso segue il tuo livello.'],
      ['clock', 'Impianti e orari', 'Conosce chiusure e orari degli impianti e ti avvisa se riesci a tornare in tempo.'],
      ['pocket', 'Telefono in tasca', 'Guida vocale con nome e colore della pista. Funziona anche offline.'],
    ],
    doorsTitle: 'Scopri Ski Maps',
    open: 'Apri',
    doors: {
      how: ['Come funziona', 'Un percorso.<br>Tutto il giro.', 'Il giro tra comprensori, i tre passi e tutte le funzioni.'],
      areas: ['Aree', 'Cinque aree<br>al lancio.', 'Dolomiti Superski, Ovindoli, Campo Felice, Vialattea e Livigno.'],
      faq: ['Domande', 'Domande<br>e risposte.', 'Quando esce, iPhone, rete, lingue, posizione.'],
    },
    trustBox: {
      eyebrow: 'Privacy', h: 'La tua posizione<br><em>resta tua.</em>',
      items: [
        ['GPS sul telefono', 'La posizione GPS resta sul telefono.'],
        ['Diagnostica solo con il consenso', 'I dati di diagnostica partono solo se dai il consenso.'],
        ['Account facoltativo', 'Puoi usare Ski Maps senza account. ' + todo('account facoltativo nella v1?')],
        ['Cancellazione dell’account', 'Se hai un account, puoi eliminarlo: <a href="{delete}">come fare</a>.'],
      ],
      link: 'Leggi l’informativa privacy',
    },
    wl: {
      eyebrow: 'In arrivo su Google Play', h: 'Avvisami quando esce.',
      lede: 'Lascia la tua email: ti scriviamo quando Ski Maps è disponibile su Google Play. La versione per iOS arriverà in seguito.',
      label: 'La tua email', ph: 'la-tua@email.it', send: 'Avvisami',
      ok: 'Grazie. Ti scriviamo quando Ski Maps esce.',
      mailto: 'Si è aperto il tuo programma di posta: l’iscrizione parte quando premi <b>Invia</b>. Non si è aperto? Scrivici a',
      invalid: 'Serve un indirizzo email valido.', err: 'Non siamo riusciti a registrare l’iscrizione. Scrivici a',
      fine: 'Niente newsletter: la tua email serve solo per avvisarti dell’uscita.',
      subject: 'Ski Maps: avvisami quando esce',
    },
  },

  how: {
    title: 'Come funziona · Ski Maps',
    desc: 'Come funziona Ski Maps: il giro tra comprensori con bus e treni, tre passi per partire e le funzioni già provate sul telefono.',
    eyebrow: 'Come funziona', h1: 'Un percorso.<br><em>Tutto il giro.</em>',
    lede: 'I giri più belli passano da un comprensorio all’altro. Ski Maps li tiene insieme in un solo percorso, compresi i bus e i treni di collegamento.',
    prob: ['Il problema', 'Bloccati a metà giro', 'Tra un comprensorio e l’altro non è sempre chiaro quale pista, quale impianto o quale bus prendere per andare avanti o tornare indietro.'],
    sol: ['Con Ski Maps', 'Sai sempre il prossimo passo', 'Dal punto dove sei a quello dove vuoi arrivare: piste, impianti, bus e treni, uno dopo l’altro.'],
    toursTitle: 'Giri tra comprensori',
    tours: [['Sellaronda', 'Il giro attorno al Sella'], ['Cortina – Alta Badia', 'Tra Ampezzo e Badia'], ['Fassa – Fiemme', 'Tra le due valli'], ['Bus e treni', 'I collegamenti tra i comprensori']],
    shotTour: ['scheda del percorso Sellaronda', 'La scheda del percorso Sellaronda nell’app'],
    stepsEyebrow: 'In tre passi', stepsH: 'Tre passi.<br>Poi si scia.', step: 'Passo',
    steps: [
      ['Scegli dove vuoi arrivare', 'Indica sulla mappa il punto dove vuoi arrivare: un impianto, un rifugio, il paese.', ['mappa con la destinazione scelta', 'Scegliere la destinazione sulla mappa']],
      ['Scegli il tuo livello', 'Principiante, intermedio o avanzato: il percorso segue il tuo livello.', ['i tre percorsi per livello verso la stessa destinazione', 'I percorsi per principiante, intermedio e avanzato']],
      ['Segui le indicazioni', 'Pista per pista e impianto per impianto, con il nome e il colore della pista e la guida vocale. Il telefono può restare in tasca.', ['navigazione in corso con l’istruzione «nome e colore della pista»', 'La navigazione con il nome e il colore della pista']],
    ],
    featEyebrow: 'Funzioni', featH: 'Quello che fa,<br>sulla neve.', featLede: 'Funzioni già provate sul telefono.',
    feats: [
      ['level', 'Percorsi per livello', 'Principiante, intermedio o avanzato: scegli tu, il percorso si adatta.'],
      ['clock', 'Chiusure e orari degli impianti', 'L’app conosce chiusure e orari degli impianti e ti avvisa se riesci a tornare in tempo.'],
      ['voice', 'Guida vocale', 'Le indicazioni arrivano a voce, mentre scii.'],
      ['pocket', 'Telefono in tasca', 'La navigazione continua anche con il telefono in tasca.'],
      ['offline', 'Funziona offline', 'Mappe e percorsi si scaricano: li usi anche senza rete.'],
      ['sign', 'Nome e colore della pista', 'Ogni istruzione dice il nome della pista e il suo colore.'],
      ['lang', 'In cinque lingue', 'Italiano, inglese, tedesco, francese e spagnolo.'],
    ],
  },

  areas: {
    title: 'Aree · Ski Maps',
    desc: 'Dove funziona Ski Maps al lancio: Dolomiti Superski, Ovindoli, Campo Felice, Vialattea con Bardonecchia e Livigno.',
    eyebrow: 'Aree', h1: 'Cinque aree<br><em>al lancio.</em>',
    lede: 'Al lancio Ski Maps funziona in Dolomiti Superski, Ovindoli, Campo Felice, Vialattea e Livigno.',
    main: ['Al lancio', 'Dolomiti Superski', 'Compresi Sellaronda, Cortina – Alta Badia e Fassa – Fiemme.'],
    list: [['Ovindoli', ''], ['Campo Felice', ''], ['Vialattea', 'Con Bardonecchia.'], ['Livigno', '']],
    biz: { eyebrow: 'Per le società impianti', h: 'Gestite impianti?', p: 'Se gestite un comprensorio e volete parlare di una possibile collaborazione, scriveteci.', subject: 'Ski Maps · società impianti' },
  },

  faq: {
    title: 'Domande frequenti · Ski Maps',
    desc: 'Domande frequenti su Ski Maps: quando esce, iPhone, uso senza rete, guida vocale, impianti chiusi, livelli, lingue e posizione.',
    eyebrow: 'Domande frequenti', h1: 'Domande<br><em>e risposte.</em>',
    items: [
      ['Quando esce?', 'È in arrivo su Google Play. <a href="{home}#avvisami">Lascia la tua email</a> e ti avvisiamo quando esce.'],
      ['C’è anche per iPhone?', 'La versione per iOS arriverà in seguito.'],
      ['Dove funziona?', 'Al lancio in Dolomiti Superski, Ovindoli, Campo Felice, Vialattea (con Bardonecchia) e Livigno.'],
      ['Funziona senza rete?', 'Sì. Mappe e percorsi si scaricano prima e funzionano anche offline.'],
      ['Devo guardare il telefono mentre scio?', 'No. Con la guida vocale le indicazioni arrivano a voce, e la navigazione continua con il telefono in tasca.'],
      ['E se un impianto chiude?', 'Ski Maps conosce chiusure e orari degli impianti e ti avvisa se riesci a tornare in tempo.'],
      ['Va bene anche per chi inizia?', 'Sì. Scegli il livello principiante e il percorso segue quello.'],
      ['In che lingue è?', 'Italiano, inglese, tedesco, francese e spagnolo.'],
      ['Dove finisce la mia posizione?', 'Resta sul telefono. La diagnostica parte solo con il tuo consenso. Dettagli nell’<a href="{privacy}">informativa privacy</a>.'],
    ],
  },

  about: {
    title: 'Chi siamo · Ski Maps',
    desc: 'Chi c’è dietro Ski Maps: Christian, 22 anni, di Roma. Ingegneria energetica alle spalle, oggi la laurea magistrale in Strategic Management alla LUISS Guido Carli.',
    eyebrow: 'Chi siamo', h1: 'Dietro<br><em>Ski Maps.</em>',
    paras: [
      'Ski Maps è il progetto di <strong>Christian</strong>, 22 anni, di Roma.',
      'Viene dall’ingegneria energetica e oggi frequenta la laurea magistrale in Strategic Management alla LUISS Guido Carli: competenze tecniche e visione di prodotto, messe al servizio di chi scia.',
      'Lo sviluppa con un obiettivo chiaro: dare a chi scia un navigatore che lo porti dove vuole arrivare, pista dopo pista e impianto dopo impianto, ovunque si trovi.',
      'Si parte dalle cinque aree del lancio. Il traguardo sono le piste di tutto il mondo.',
    ],
    photoAlt: 'Foto di Christian, che sviluppa Ski Maps',
    write: 'Vuoi scrivergli?',
    door: ['Chi siamo', 'Dietro<br>Ski Maps.', 'Christian, 22 anni, di Roma: ingegneria energetica e Strategic Management alla LUISS.'],
  },

  /* testi per la mappa 3D e per il modulo (assets/map3d.js, assets/beta.js) */
  js: {
    decimal: ',', thousands: '.',
    routeUnavailable: 'Percorso non disponibile', indirect: ' · percorso indiretto',
    easyOnly: 'Solo piste facili', easyMedium: 'Facili + medie',
    fromLabel: "function(legs, lifts){ return 'Corvara (Boè) · ' + legs + ' tratte · ' + lifts + (lifts === 1 ? ' impianto' : ' impianti'); }",
    badge: "function(){ return '<b>Anteprima dimostrativa</b> · area del Sella · © OpenStreetMap contributors · rilievo INGV TINITALY'; }",
    youAre: 'Sei qui · Corvara', noWebGL: 'La mappa 3D richiede WebGL: apri la pagina in un browser recente.',
    sending: 'Invio…', fromName: 'Sito Ski Maps', formSubject: 'Nuova iscrizione: avvisami quando esce',
    mailBody: "function(email){ return 'Avvisatemi quando Ski Maps esce su Google Play. Email: ' + email; }",
    formMessage: "function(email, page){ return 'Lista d’attesa dal sito (avvisami quando esce). Email: ' + email + ' | Pagina: ' + page; }",
  },
};
