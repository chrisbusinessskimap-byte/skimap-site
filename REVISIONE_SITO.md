# Revisione del sito skimaps.cc — design, contenuti, funzionamento

Revisione del 15-10-2026 sul commit `fa7e04b` (ramo `claude/relaxed-gates-l10sa5`, uguale a `main` per i file del sito).
Nessun file del sito modificato: questo ramo (`revisione/sito`) aggiunge solo questo rapporto e `docs/design-review/`.

## Giudizio in tre righe

1. La base è buona: sito statico, veloce fuori dalla home, senza cookie né richieste ad altri siti, tre lingue allineate, tastiera e contrasti quasi tutti a posto, e una promessa davvero distintiva (il giro tra comprensori, con bus e treni).
2. Oggi però il sito mostra al pubblico 29 segnaposto `[DA CONFERMARE]` e 4 riquadri `[SCREENSHOT]`, non fa mai vedere l'app né la sua icona, e la sua informativa (versione 5, con account e accesso Google) non è quella dell'app (versione 4, senza account).
3. Sul telefono la home spende 255 KB compressi e circa 8 secondi di calcolo per una mappa 3D che quasi non si vede, e che in 18 caricamenti su 20 apre con «Principiante: percorso non disponibile», proprio sotto la promessa «per il tuo livello».

## Le 5 modifiche col miglior rapporto effetto/costo

| # | Modifica | Effetto | Costo | Righe nella tabella |
|---|---|---|---|---|
| 1 | **Niente segnaposto in pubblico.** Togliere dal sito le frasi non confermate (le sezioni sull'account finché l'account non esiste) e far fallire la pubblicazione se resta un `[DA CONFERMARE]` (`node tools/check.mjs --release` nel workflow). Nascondere i riquadri `[SCREENSHOT]` finché non ci sono le schermate. | La pagina che Google Play linkerà come informativa smette di sembrare una bozza; si toglie il segnale peggiore per la fiducia. | S | 1, 2, 3, 20 |
| 2 | **Informativa del sito = informativa dell'app.** Pubblicare ora il testo della versione 4 che l'app mostra (stessa data, 12 ottobre 2026, stesso stato), con il titolare identificato; la versione 5 (account) solo insieme all'app che ha l'account. | Elimina una contraddizione che un revisore di Play o un utente attento notano subito; prepara l'URL da dare a Play. | S | 20, 21, 22, 23 |
| 3 | **Una demo che dà ragione alla promessa.** Nella mappa 3D scegliere solo destinazioni raggiungibili con tutti e tre i livelli. Sul telefono e sul tablet mostrare un'immagine statica della mappa e caricare il 3D solo al tocco su «Prova l'anteprima». | Mobile: Lighthouse da 37 a circa 95 (misurato 99 senza gli script della mappa), LCP da 9,1 s a circa 2 s. La prima cosa che il visitatore legge nella scheda non è più un fallimento. | M | 4, 5 |
| 4 | **Far vedere l'app.** Tre o quattro schermate vere (scelta destinazione, tre percorsi per livello, navigazione con nome e colore della pista) in home e in Come funziona, e l'icona vera dell'app in barra, favicon e immagine di anteprima. | È quello che fanno tutti i riferimenti: chi arriva dal Play Store riconosce il prodotto, chi arriva dal sito sa cosa scaricherà. | M | 3, 9 |
| 5 | **Invito sempre a portata di pollice.** Sul telefono tenere «Avvisami» accanto a «Menu» (oggi sparisce sotto gli 860 px) e, dopo il tocco, mettere il cursore direttamente nel campo email. Appena c'è la scheda Play, sostituire il modulo con la preregistrazione di Google Play. | Da 8,3 schermate a 0 per arrivare all'invito in Come funziona; un tocco in meno per iscriversi; con la preregistrazione niente email da custodire. | S (M per la preregistrazione) | 7, 8, 26 |

---

## 1. Come ho lavorato, e cosa non ho potuto verificare

- **Sito in locale, non skimaps.cc.** Il sito è partito con lo script del README (`python3 -m http.server 8000`, `README.md:36`). skimaps.cc non è raggiungibile da questo ambiente: il proxy di rete rifiuta la connessione (403) e lo strumento di lettura web non risolve nessun dominio, nemmeno quelli dei riferimenti. Quindi: niente verifica del sito pubblicato, delle intestazioni di GitHub Pages, della pagina 404 reale né del certificato.
  Ho controllato che i file nel repo siano quelli che il workflow pubblica: rigenerando con `node tools/build.mjs` in una copia, la differenza è zero. In produzione cambia solo `assets/config.js` (chiave Web3Forms dal secret, `docs/FORM.md:3`), e quindi nell'informativa compare il paragrafo su Web3Forms, con il suo `[DA CONFERMARE]`.
- **Lingue.** Il sito ha italiano, inglese e tedesco (`README.md:4`, `tools/site.mjs:25`). Francese e spagnolo non esistono: li ho trattati come lacuna (riga 24), non come pagine da fotografare. Le pagine legali esistono solo in italiano e in inglese; il tedesco rimanda all'inglese (`tools/site.mjs:9-10,21`).
- **Tema scuro.** Non esiste (`assets/site.css:24`, `color-scheme:light`). L'ho verificato con `prefers-color-scheme: dark`: il fondo resta `#f4f6f9`. Le schermate sono quindi solo col tema chiaro.
- **Strumenti.** Playwright 1.56 con Chromium 141 (WebGL via SwiftShader, cioè grafica emulata dal processore), axe-core 4 per l'accessibilità automatica, Lighthouse 12.8.2 servito da `serve` con compressione gzip, come fa GitHub Pages.
- **Il repo dell'app.** `skimap-mobile` esiste nel tuo account: l'ho clonato in sola lettura e ho letto `src/i18n/catalogs/*.ts` (chiavi `privacy.*`), `src/theme/colors.ts`, `src/config/brand.ts` e `REVISIONE_ACCOUNT.md` dal ramo `revisione/account`.
- **Riferimenti.** Le descrizioni dei siti di riferimento vengono da ricerche web (fonti citate sotto), non dall'apertura diretta delle pagine, per il problema di rete detto sopra. Alcuni risultati hanno qualche mese: lo segnalo dove conta.

### Le schermate (`docs/design-review/`)

- `‹lingua›-‹pagina›-‹phone|tablet|desktop›-fold.jpg`: la prima schermata nelle tre lingue, a 390×844 (telefono), 768×1024 (tablet) e 1440×900 (desktop). 19 pagine × 3 larghezze = 57. Catturate a densità 2× per telefono e tablet, salvate a 1×; il desktop è ridotto a 1200 px di larghezza.
- `it-‹pagina›-‹…›-full.jpg`: la pagina intera, solo in italiano (7 pagine × 3 larghezze), larga 390, 512 o 960 px. In inglese e tedesco le pagine hanno le stesse sezioni (lo controlla `tools/check.mjs`), quindi per quelle lingue tengo solo la prima schermata, per contenere il peso del repo.
- Prove singole: `it-home-phone-menu.jpg` (menu aperto), `it-home-desktop-kb-skip.jpg` e `-kb-focus.jpg` (tastiera), `it-*-zoom200-fold.jpg` (640 px = zoom 200 % su 1280), `it-*-reflow320-fold.jpg` (320 px), `it-home-phone-nojs-fold.jpg` (senza JavaScript), `it-home-phone-form-error.jpg` e `-form-ok.jpg` (modulo).
- `misure-playwright.json`: per ogni vista, altezza della pagina, posizione del titolo, degli inviti e del modulo, richieste esterne, errori, titoli, risultati di axe.
- `lighthouse/*.json`: i risultati Lighthouse ridotti alle voci usate qui.

---

## 2. Scelte già documentate che contano per questa revisione

| Scelta | Dove | Che effetto ha sui suggerimenti |
|---|---|---|
| Segnaposto visibili in pagina, evidenziati in giallo | `tools/site.mjs:6-7`; il workflow li tratta come avvisi: `.github/workflows/pages.yml:27-28` | Il suggerimento 1 va contro questa scelta |
| Mappa 3D nella home | `README.md:13,26` | Il suggerimento 3 la cambia (sul telefono), non la toglie |
| Riquadri `[SCREENSHOT]` da sostituire con le schermate vere | `README.md:23` | Coerente: chiedo di farlo, o di nasconderli nel frattempo |
| Nessun numero di utenti, recensioni, premi, partner, date; nessun concorrente nominato; niente superlativi né gergo | `README.md:40` | Nessun suggerimento nomina concorrenti nel sito. I riferimenti qui sotto servono solo a questo rapporto |
| «In arrivo su Google Play», iOS «in seguito» | `README.md:41` | La preregistrazione di Play resta coerente con «in arrivo» |
| Nessun cookie né analytics | `README.md:43`, `privacy.html:150` | Verificato: banner dei cookie non necessario |
| Pagine legali scritte a mano, tedesco → inglese | `README.md:19-20`, `tools/build.mjs:454-468`, `tools/site.mjs:9-10` | Le righe 22 e 24 vanno contro questa scelta |
| Font e script serviti dal sito | `README.md:26`, `assets/fonts.css:1` | Da tenere |
| Ambra come colore d'accento («paletto di pista») | `assets/site.css:14` | La riga 9 propone di avvicinarsi all'arancio e al blu notte dell'app: va contro |
| L'app: palette dal logo (blu notte `#132941`, arancio `#F8601C`, verde acqua solo nel logo) | `skimap-mobile/src/theme/colors.ts:21-29` | Riferimento per la coerenza visiva |

---

## 3. Riferimenti best in class

| Riferimento | Perché è un riferimento | Per quale parte del sito | Fonti |
|---|---|---|---|
| **Slopes** (getslopes.com) | App di sci con home essenziale: frase d'azione («Track, relive, and share your days skiing and snowboarding»), badge App Store e Google Play subito, schermate dell'app. Pagina dati in parole semplici: «senza account il GPS resta sul telefono», titolare nominato (Breakpoint Studio LLC), percorso di cancellazione esatto (Account → Edit Account & Profile → Delete). Supporto su help.getslopes.com | Home, download, privacy, elimina account, supporto | [getslopes.com](https://getslopes.com/), [getslopes.com/data](https://getslopes.com/data), [App Store](https://apps.apple.com/us/app/slopes-ski-snowboard/id643351983), [About Slopes](https://news.getslopes.com/about-slopes/) |
| **Skitude** | Mappe 3D dei comprensori filtrabili per colore e apertura, più contenuti della comunità (neve, webcam): il modello per raccontare segnalazioni e tempi di attesa. La descrizione della mappa 3D viene da un post del 2019 | Pagina funzioni, aree | [skitude.com/skitude-app](https://skitude.com/skitude-app/), [App Store](https://apps.apple.com/app/skitude/id493933087), [post sulla mappa 3D](https://skitude.com/skitude-premium-your-skiing-experiences-without-limits-2/) |
| **Ski Tracks** (Core Coders) | Prodotto con una sola promessa, spiegata con numeri e schermate, e funzionamento senza rete come argomento | Home (chiarezza), FAQ (batteria, rete) | [scheda Google Play (App Pricing Lab)](https://www.apppricinglab.com/app/google_play/com.corecoders.skitracks), [Engadget](https://www.engadget.com/2014-03-01-weekend-app-ski-tracks-logs-your-performance-when-you-hit-the-s.html) |
| **Google Maps** | Il modello mentale che il visitatore porta con sé: «navigatore» con guida vocale, ETA, mappe offline. Ogni funzione è mostrata da una schermata della funzione stessa. La pagina ufficiale non è emersa dalle ricerche: uso la descrizione della scheda dello store | Come funziona, promessa principale | [descrizione della scheda (APKMirror)](https://www.apkmirror.com/apk/google-inc/maps/maps-10-51-0-release), [blog Google Maps, mappe offline](https://maps.googleblog.com/2011/07/download-map-area-added-to-labs-in.html?m=0) |
| **Dolomiti Superski** (dolomitisuperski.com) | Il comprensorio principale del lancio: una pagina mappa per ogni area, giri (Sellaronda, Grande Guerra) in entrambi i sensi, ricerca percorso con filtro per piste blu, rosse e nere, distanza, durata, numero di piste e impianti. App MyDolomiti in italiano, tedesco e inglese, con link ai due store | Aree, coerenza dei colori di pista, lingue | [mappa Alta Badia](https://www.dolomitisuperski.com/en/live-info/ski-map/dolomiti-superski/map-for-alta-badia), [mappa Val Gardena](https://www.dolomitisuperski.com/en/Experience/Ski-areas/Val-Gardena/Ski-map), [pagina app](https://www.dolomitisuperski.com/en/dolomiti-superski-world/app), [My Dolomiti Winter](https://apps.apple.com/us/app/my-dolomiti-winter/id1483954376) |
| **Google Play** (regole, non un sito di prodotto) | Cosa servirà per il download: preregistrazione con notifica al lancio e badge ufficiale; badge «Disponibile su Google Play» localizzato, non modificato, link alla scheda; cancellazione dell'account sia nell'app sia da un link web, da indicare in «Sicurezza dei dati» | Download, elimina account | [Preregistrazione](https://support.google.com/googleplay/android-developer/answer/9859047), [badge](https://developer.android.com/distribute/tools/promote/badges), [cancellazione account](https://support.google.com/googleplay/android-developer/answer/13327111), [annuncio 2023](https://android-developers.googleblog.com/2023/04/giving-people-more-control-over-their-data.html?hl=en) |

---

## 4. Tabella dei rilievi

Legenda costo: **S** = meno di mezza giornata; **M** = da mezza giornata a due giorni; **L** = di più.

### 4.A Verificato sulle schermate e con le misure

| n. | pagina | larghezza/lingua | test | cosa succede (con la schermata) | riferimento best in class | suggerimento in due righe | file:riga da toccare | priorità | costo | va contro una scelta già fatta? |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Privacy, Elimina account | tutte; it, en (il de usa l'en) | privacy e obblighi, ux-copy | 21 segnaposto `[DA CONFERMARE]` nella privacy e 7 in Elimina account, ben visibili. La prima frase dell'informativa è un segnaposto. Sulla pagina inglese i segnaposto sono in italiano. Al telefono la privacy è lunga 13,5 schermate. `it-privacy-phone-fold.jpg`, `en-privacy-desktop-fold.jpg`, `it-elimina-account-phone-full.jpg` | Slopes /data: niente parti in sospeso, titolare e cancellazione dichiarati | Pubblicare solo frasi confermate: togliere le sezioni sull'account (vedi 20) e chiudere le altre domande. Mettere `node tools/check.mjs --release` nel workflow, così un segnaposto blocca la pubblicazione | `privacy.html:66,87-92,109,112,134,139-141,146-147,150,154,158,161`; le stesse righe in `en/privacy.html`; `elimina-account.html:75-90`, `en/delete-account.html:75-90`; `.github/workflows/pages.yml:27-28` | alta | S | sì: `tools/site.mjs:6-7`, `pages.yml:27` |
| 2 | Home | tutte; it, en, de | ux-copy, privacy | Nella sezione «La tua posizione resta tua» la scheda «Account facoltativo» finisce con «[DA CONFERMARE: account facoltativo nella v1?]». `it-home-phone-full.jpg`, `it-home-desktop-full.jpg` | Slopes: «accounts are optional», detto senza riserve | Se la v1 esce senza account, sostituire la scheda con «Nessun account: Ski Maps funziona senza registrarti»; altrimenti scrivere la risposta vera | `content/it.mjs:53`, `content/en.mjs:51`, `content/de.mjs:52` | alta | S | sì: `tools/site.mjs:6-7` |
| 3 | Come funziona | tutte; it, en, de | design-critique | Quattro riquadri tratteggiati «[SCREENSHOT: …] 1080 × 2340 px» al posto dell'app. Al telefono occupano circa tre schermate su 8,8. In tutto il sito l'app non si vede mai. `it-come-funziona-desktop-full.jpg`, `it-come-funziona-phone-full.jpg` | Google Maps, Slopes: ogni funzione ha la sua schermata vera | Mettere 3-4 schermate vere, in WebP, con `width`/`height` e `loading="lazy"`, in una cornice telefono (la classe `.phone` esiste già). Finché non ci sono, non generare i riquadri | `tools/build.mjs:38-39,332,345`; `content/it.mjs:79,82-84` (e en, de) | alta | M | no (`README.md:23` li prevede da sostituire) |
| 4 | Home (anteprima 3D) | tutte; it, en, de | design-critique, funzionamento | La destinazione d'esempio è scelta a caso: su 20 caricamenti, in 18 la riga «Principiante» dice «Percorso non disponibile», e spesso Intermedio e Avanzato hanno lo stesso tempo. Sta subito sotto la promessa «Per il tuo livello». `it-home-desktop-fold.jpg` (Cherz), `it-home-tablet-fold.jpg` (La Villa · Gardenaccia) | Dolomiti Superski: la ricerca percorso mostra distanza, durata, piste e impianti per un esempio che funziona | Scegliere solo destinazioni con un percorso per tutti e tre i livelli e tempi diversi, oppure partire sempre da un esempio scelto a mano e lasciare il caso al tocco | `assets/map3d.js:268-270` | alta | S | no |
| 5 | Home | telefono e tablet; tutte le lingue | Lighthouse | Mobile: prestazioni 37, LCP 9,1 s, TBT 16,2 s, `map3d.js` 8,4 s di calcolo. `three.min.js` (145 KB gzip) + `graph-data.js` (110 KB) caricati per una mappa che sul telefono si vede appena, dietro il testo e la scheda. `it-home-phone-full.jpg`, `it-home-tablet-fold.jpg`. Con i tre script bloccati: 99, LCP 2,0 s, TBT 0 | Slopes: home con immagini statiche, l'app la provi scaricandola | Sotto i 900 px un'immagine statica della mappa (WebP, circa 60 KB) con il pulsante «Prova l'anteprima», che carica il 3D solo al tocco. Su desktop avviare la mappa con `requestIdleCallback`. Il Dijkstra cerca il minimo a ogni passo su tutti i nodi: con una coda a priorità costa molto meno | `tools/build.mjs:301-306`; `assets/map3d.js:41-52`; `assets/site.css:143-148` | alta | M | sì: `README.md:13,26` (mappa 3D in home) |
| 6 | Home | desktop; tutte le lingue | Lighthouse, ui-typography | CLS 0,177. Il blocco del titolo si sposta quando arriva il font Big Shoulders: 0,14 anche senza la mappa. Nessun font è precaricato | — | `<link rel="preload" as="font" type="font/woff2" crossorigin>` solo per `big-shoulders-display.woff2`, più un `@font-face` di riserva con `size-adjust` sul font di sistema. Riservare l'altezza della scheda percorso | `tools/build.mjs:124-125`; `assets/fonts.css:5`; `assets/site.css:38,109,120` | media | S | no |
| 7 | Tutte | telefono (sotto 860 px); tablet (sotto 1040 px) | design-critique, ux | Sotto gli 860 px il pulsante «Avvisami» della barra sparisce; sotto i 1040 px spariscono anche i link (tablet: solo lingue e «Menu»). Sulle pagine interne il primo invito sta in fondo: Come funziona a 6.996 px (8,3 schermate), Aree 1,9, Domande 1,4, Chi siamo 1,3. Privacy ed Elimina account non hanno inviti (solo nel menu). `it-come-funziona-phone-full.jpg`, `it-home-tablet-fold.jpg`, `misure-playwright.json` | Slopes: i badge degli store sono sempre a portata | Al telefono, «Avvisami» piccolo accanto a «Menu» (la barra ha spazio: logo circa 170 px e «Menu» circa 75 px, su 390). In Come funziona, ripetere l'invito dopo i tre passi | `assets/site.css:86,425`; `tools/build.mjs:61,337-349` | alta | S | no |
| 8 | Home | tutte; tutte le lingue | ux, funzionamento modulo | Il modulo funziona: errore chiaro su un indirizzo non valido, «Grazie» dopo l'invio (provato con una chiave finta e la rete intercettata). Ma dopo il tocco su «Avvisami quando esce» il cursore resta sulla pagina (focus su `BODY`): serve un altro tocco sul campo. Al telefono il modulo sta a 4.961 px. `it-home-phone-form-error.jpg`, `it-home-phone-form-ok.jpg` | Preregistrazione di Play: un solo tocco | Spostare il focus su `#email` quando si arriva a `#avvisami` (clic o `hashchange`) | `assets/beta.js:10-11`, `assets/site.js:6-8`; `tools/build.mjs:202` | media | S | no |
| 9 | Tutte | tutte | design-critique, design-system | L'icona del sito (una «M» ambra su nero con un punto blu) non è l'icona dell'app (spillo arancio su montagne verde acqua, fondo blu notte); l'accento del sito è ambra `#ffb300`, quello dell'app arancio `#F8601C` e blu notte `#132941`. Chi arriva dal Play Store non riconosce il prodotto. `it-home-desktop-fold.jpg`; icona dell'app: `skimap-mobile/android/app/src/main/res/mipmap-*/ic_launcher.png` | Slopes, Skitude, MyDolomiti: stessa icona su sito, store e telefono | Usare l'icona dell'app nella barra, nella favicon, nell'icona Apple e nell'immagine di anteprima. Valutare l'arancio e il blu notte dell'app come accento e inchiostro | `tools/build.mjs:17`; `assets/favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `og-image.png`; `assets/site.css:8,14` | alta | M | sì: `assets/site.css:14` (ambra «paletto di pista») |
| 10 | Home (scheda percorso) | tutte | design-system, coerenza | Nella scheda i livelli sono verde, arancio e rosso; le tratte usano il blu e il rosso delle piste; in Come funziona i passi sono blu, rosso e nero. In Italia le piste sono blu, rosse e nere, come nella mappa del comprensorio. `it-home-desktop-fold.jpg` | Dolomiti Superski: filtro per piste blu, rosse e nere | Colorare i tre livelli con blu, rosso e nero (lo stesso schema di `pisteColors.ts` nell'app) | `tools/build.mjs:217-219`; `assets/site.css:137` | media | S | no |
| 11 | Aree | tutte; it, en, de | design-critique | Pagina sottile: cinque schede, quattro vuote (solo il nome). L'etichetta «Al lancio» è solo sulla prima, e sembra che le altre non ci siano al lancio. Non c'è una mappa, la regione, né cosa copre ogni area (bus e treni valgono solo per le Dolomiti?). `it-aree-desktop-full.jpg`, `it-aree-phone-fold.jpg` | Dolomiti Superski: una pagina per area, con mappa, giri e ricerca percorso | Per ogni area: regione, una riga su cosa c'è (piste e impianti, collegamenti, orari) e una piccola mappa statica. «Al lancio» nel titolo della pagina, non sulla scheda | `content/it.mjs:101-104` (e en, de); `tools/build.mjs:374-375` | media | M | no (`README.md:40` vieta numeri di utenti, non i dati delle aree) |
| 12 | Privacy | telefono soprattutto; it, en | accessibilità, ux-copy | 11.400 px senza indice. I titoli saltano da `h1` a `h3` (axe: `heading-order`, 8 viste). `it-privacy-phone-full.jpg` | Slopes /data: riassunto breve, poi le sezioni | Indice con ancore in cima, titoli di sezione in `h2`, «In breve» in un riquadro come «Cosa cambia» | `privacy.html:72-169`, `en/privacy.html:72-169`; `assets/site.css:47` | media | S | no |
| 13 | Tutte | tutte | accessibility-review | L'anello del focus `#ff7a00` sul fondo chiaro `#f4f6f9` è a 2,41:1 (WCAG 1.4.11 chiede 3:1). Sul pulsante ambra si vede meno ancora (1,46:1 contro il pulsante). Axe: il testo della riga «Principiante» disattivata è a 2,32:1 (opacità 0,5). `it-home-desktop-kb-focus.jpg` | — | Anello scuro (`--ink`) con un bordo chiaro intorno, che si vede su chiaro, su scuro e sull'ambra. Riga disattivata: testo a 4,5:1, l'opacità solo sulla barretta colorata | `assets/site.css:64,133` | media | S | no |
| 14 | Home (anteprima 3D) | desktop | accessibility-review (tastiera) | Ordine di tabulazione corretto e focus visibile: salto al contenuto, logo, sezioni, «Avvisami», lingue, inviti. La mappa però si usa solo col puntatore (`canvas` con `tabindex -1`): da tastiera non si cambia destinazione. `it-home-desktop-kb-skip.jpg` | — | Sotto la scheda, tre o quattro pulsanti «Prova: Arabba, Selva, Corvara…»: utili anche col dito, dove toccare una stazione 3D è difficile | `assets/map3d.js:241`; `tools/build.mjs:210-223` | bassa | S | no |
| 15 | Tutte | telefono, senza JavaScript | robustezza | Senza JavaScript il pulsante «Menu» viene nascosto e sotto i 1040 px non resta nessuna navigazione, a parte il piè di pagina (che non ha Come funziona e Domande). `it-home-phone-nojs-fold.jpg` | — | Nel `<noscript>`, mostrare i link invece di nasconderli | `tools/build.mjs:126` | bassa | S | no |
| 16 | Tutte | telefono | accessibilità, ui-surfaces | I link del piè di pagina sono alti 22 px (WCAG 2.5.8 chiede 24). «Chi siamo» non è né nella barra né nel menu: solo nel piè di pagina e nelle porte della home. `it-home-phone-menu.jpg` | — | `padding: 12px 0` sui link del piè di pagina; «Chi siamo» nel menu del telefono | `assets/site.css:345-346`; `tools/build.mjs:50,65-69` | bassa | S | no |
| 17 | Come funziona | desktop | design-critique | Sette funzioni in una griglia da quattro: la seconda riga resta con un buco. `it-come-funziona-desktop-full.jpg` | — | Arrivare a otto, aggiungendo «Code agli impianti» (vedi 27), oppure griglia da quattro più tre centrata | `assets/site.css:494`; `content/it.mjs:87-95` | bassa | S | no |
| 18 | Tutte | tutte | SEO | Titolo, descrizione, canonical, Open Graph e Twitter ci sono in tutte le 19 pagine; hreflang reciproci (it/en/de più x-default) e sitemap con le alternative; `robots.txt` corretto; favicon SVG e PNG 32, icona Apple 180. Mancano: dati strutturati (0 JSON-LD su 19 pagine) e una pagina 404 (`404.html` non c'è). L'`x-default` punta all'italiano, per cui uno spagnolo o un francese finisce sulla home italiana. Il testo alternativo dell'immagine di anteprima cambia da pagina a pagina (le legali dicono «mappa 3D», le altre «logo») per la stessa immagine | — | JSON-LD `MobileApplication` nella home (nome, `operatingSystem: Android`, `applicationCategory: TravelApplication`, lingue; `offers` e link Play quando ci sono). `x-default` sull'inglese. Una `404.html` con le tre home | `tools/build.mjs:90-127` (JSON-LD), `:93` (x-default); `privacy.html:26`, `en/privacy.html:26`, `elimina-account.html:26`; nuova `404.html` e `pages.yml:34` | media | S | no |
| 19 | Tutte | 640 px (zoom 200 %) e 320 px | accessibility-review | Nessuno scorrimento orizzontale a 640 e a 320 px, nessun testo tagliato (gli unici elementi "tagliati" sono i titoli nascosti per i lettori di schermo). `lang` corretto su tutte le pagine; i link delle lingue hanno il loro `lang`. `it-home-reflow320-fold.jpg`, `it-privacy-zoom200-fold.jpg` | — | Nulla da fare: è un punto di forza da mantenere | — | — | — | — |

### 4.B Dedotto dal codice e dal confronto con l'app (non visibile da una schermata)

| n. | pagina | larghezza/lingua | test | cosa succede | riferimento best in class | suggerimento in due righe | file:riga da toccare | priorità | costo | va contro una scelta già fatta? |
|---|---|---|---|---|---|---|---|---|---|---|
| 20 | Privacy, Elimina account | tutte; it, en | privacy: sito contro app | Il sito pubblica la «versione 5», con account, accesso con Google ed eliminazione dell'account, e dice «La stessa informativa che trovi dentro l'app». L'app mostra la **versione 4** (`CONSENT_VERSION = 4`, `skimap-mobile/src/utils/consentRecord.ts:15`), aggiornata il 12 ottobre 2026 (`it.ts:451`), senza nessuna sezione sull'account; e secondo `REVISIONE_ACCOUNT.md` (B1) il codice dell'account non esiste in nessun ramo | Slopes: una sola informativa, uguale nell'app e sul sito | Oggi: sul sito il testo della v4 con la stessa data. La v5 si pubblica lo stesso giorno dell'app che ha l'account | `privacy.html:66-95`, `en/privacy.html:66-95`, `elimina-account.html` | alta | S | sì: `privacy.html:71-78` («Cosa cambia in questa versione») |
| 21 | Privacy | tutte; it, en | privacy: sito contro app | Stato diverso: il sito dice «in arrivo su Google Play», l'app «in beta chiusa» (`it.ts:452,526`). Il titolare non è identificato in nessuno dei due («arriveranno con la pubblicazione»: `privacy.html:161`, `it.ts:526`). `REVISIONE_ACCOUNT.md` (I4) lo indica come da fare prima di Play (art. 13 GDPR) | Slopes: titolare nominato (Breakpoint Studio LLC) | Nome o ragione sociale e indirizzo del titolare, nello stesso giorno nell'app (5 lingue) e sul sito; stessa frase sullo stato | `privacy.html:161`, `en/privacy.html:161` | alta | S | no (il testo stesso dice che arriverà) |
| 22 | Privacy | tutte; it, en | privacy: sito contro app | Il testo è scritto a mano due volte e già diverge. La diagnostica sul sito non dice «da quel momento non si accumula e non si invia più nulla» (`it.ts:464`); il primo campo degli eventi perde la spiegazione «serve a distinguere un problema che si ripete…» (`it.ts:473`); le segnalazioni perdono «non sono coperte dall'interruttore della diagnostica: le mandi perché scegli di votare» (`it.ts:489`); i fornitori aggiungono «e l'account» (`privacy.html:134` contro `it.ts:514`) | — | Generare le pagine privacy del sito dalle chiavi `privacy.*` dei cataloghi dell'app (lo script legge `it.ts`, `en.ts`… e scrive l'HTML). Le parti solo del sito (questo sito, lista d'attesa, fonti) restano a mano | `tools/build.mjs:454-468`; `privacy.html:81-161` | media | M | sì: `README.md:19-20`, `tools/build.mjs:454` (pagine legali scritte a mano) |
| 23 | Home, Domande, Privacy | tutte | privacy, ux-copy | «La tua posizione GPS resta sul telefono» è nella hero, nella sezione privacy della home, nelle domande e nella privacy («nessuno, guardando i voti, può risalire a te»). `REVISIONE_ACCOUNT.md` (I2) trova che al server arrivano dati che localizzano: il bivio entro 50 m dalla partenza, il tratto, l'impianto con l'ora | — | Correggere insieme all'app: «Le coordinate GPS non lasciano il telefono; alcuni dati dicono su quale pista o impianto eri». Stessa frase nelle 3 lingue del sito | `content/it.mjs:31,51,121` (e en, de); `privacy.html:81,84,112` | alta | S | no |
| 24 | Tutte | fr, es; de per la privacy | lingue | L'app parla 5 lingue (`src/i18n/catalogs/{it,en,de,fr,es}.ts`, `brand.ts` ha già lo slogan in francese e spagnolo); il sito 3, e la privacy 2. Un visitatore francese o spagnolo finisce sull'italiano (`x-default`); un tedesco legge la privacy in inglese | MyDolomiti: italiano, tedesco, inglese ovunque | Prima la privacy in tedesco, francese e spagnolo (generata dai cataloghi, vedi 22), poi home e domande in francese e spagnolo. Il tedesco va riletto da una persona di madrelingua (`README.md:44`) | `tools/site.mjs:11-25`; `content/` (nuovi `fr.mjs`, `es.mjs`) | media | M | sì: `README.md:4,20`, `tools/site.mjs:21,25` |
| 25 | Elimina account | tutte; it, en | privacy e obblighi Play | Google Play chiederà un link web per la cancellazione quando arriverà l'account. La pagina c'è, ma descrive un account che non esiste ancora e ha 7 segnaposto. Anche senza account, la scheda «Sicurezza dei dati» chiede come cancellare i dati: oggi diagnostica, voti e tempi (`REVISIONE_ACCOUNT.md` I3: «Cancella i miei dati» non tocca il server) | Regola di Play; Slopes indica il percorso esatto nell'app | Senza account: rinominarla «Cancellare i tuoi dati», con i passi veri (codice in Impostazioni, email, «Cancella i miei dati») e i tempi. Con l'account: percorso nell'app e modulo via email | `elimina-account.html:63-97`, `en/delete-account.html:63-97`; `tools/site.mjs:14,18` | alta | S | no |
| 26 | Home (download) | tutte | download | Nessun link al Play Store: è corretto, l'app non è pubblicata (`README.md:41`). Il pacchetto sarà `com.skimap` (`skimap-mobile/android/app/build.gradle:82`). Quando ci sarà la scheda, la preregistrazione di Play avvisa e può installare l'app al lancio. Toglierebbe il modulo Web3Forms, l'email da custodire e un paragrafo dell'informativa | Preregistrazione Play e badge ufficiale | Badge «Preregistrati su Google Play» localizzato (it/en/de), collegato a `https://play.google.com/store/apps/details?id=com.skimap`; tenere il modulo email solo per iOS | `tools/build.mjs:264-284`; `content/*.mjs` (`wl`) | alta | M | in parte: `docs/FORM.md:3` (scelta di Web3Forms) |
| 27 | Home, Come funziona | tutte | ux-copy, design-critique | Le funzioni che distinguono di più l'app sono raccontate solo nell'informativa: quanto si aspetta agli impianti, misurato da chi scia (`it.ts:493`); le segnalazioni di piste chiuse; l'avviso «gli impianti chiudono alle…» (`it.ts:175-177`); gli orari veri di skibus e treni (`it.ts:649`) | Skitude: la comunità come funzione | Un punto in home, «Code agli impianti: sai quanto aspetterai, misurato da chi scia», e una scheda in Come funziona; anche «Ultima corsa». Senza superlativi (`README.md:40`) | `content/it.mjs:36-40,87-95` (e en, de) | media | S | no |
| 28 | Home | tutte; it, en (de a campione) | ux-copy: promessa | «Tutto il giro. Anche tra i comprensori.» funziona per chi conosce il Sellaronda; per uno straniero o un principiante la parola «navigatore» è solo nella riga piccola in maiuscolo spaziato sopra il titolo. In inglese «The whole tour. Across ski areas too.» suona tradotto | Google Maps: «navigatore» è la categoria che il visitatore conosce | Tenere il titolo e rendere leggibile la riga sopra: «Il navigatore GPS per chi scia» in tondo, 18-20 px. In inglese: «Turn-by-turn directions for skiers. Across linked ski areas.» (vedi §7) | `content/it.mjs:26-28`, `content/en.mjs:24-26`; `assets/site.css:55` | media | S | no |
| 29 | Home | tutte | ux-copy: inviti | Nella hero ci sono due «Come funziona» (pulsante e fondo della scheda) e la scheda dice «▶ Come funziona» come se avviasse qualcosa | — | Nella scheda: «Vedi tutti i passi →» oppure togliere il pulsante | `tools/build.mjs:222` | bassa | S | no |
| 30 | Tutte | tutte | design-system | Nel CSS: 91 colori esadecimali fuori dai token (44 diversi), 25 `rgba` diversi, 35 dimensioni di carattere, 17 raggi, 15 punti di rottura diversi. Circa 50 classi su 169 non sono usate da nessuna pagina (`.ticker`, `.world`, `.phone`, `.bivio`, `.liftline`, `.stats`, `.road`, `.engine`, `.sella`, `.langsw`…); regole riscritte più volte (`.hero h1.long` alle righe 533 e 551). Il CSS è 51 KB (12 KB gzip) e blocca la prima pittura insieme a `fonts.css` | — | Token per scala dei caratteri (6 passi), raggi (3) e punti di rottura (3: 560, 900, 1040). Togliere le regole morte (circa un terzo del file) e unire `fonts.css` dentro `site.css` | `assets/site.css` (codice morto, per esempio: 151-155, 158-169, 198-229, 232-236, 265-275, 287-320, 365-372, 380-394, 402-405); `tools/build.mjs:124-125` | bassa | M | no |
| 31 | Tutte | tutte | ui-typography, ui-surfaces, ui-interactions, ui-motion | Titoli con `text-wrap: balance` (bene), paragrafi senza `text-wrap: pretty`. Raggi non concentrici nella scheda percorso (fuori 20 px, padding 16, dentro 12 e 10). Pulsanti senza stato `:active` (l'unico effetto è al passaggio del mouse, che al telefono non c'è) né `:disabled` («Invio…» non cambia aspetto). Le pagine legali rifanno l'animazione `fade` a ogni caricamento. Movimento ridotto rispettato (`prefers-reduced-motion` ferma animazioni, rotazione e neve) | — | `p{text-wrap:pretty}`; `.btn:active{transform:scale(.96)}`; `.btn:disabled{opacity:.6;cursor:default}`; scheda percorso con raggio 28 (12 + 16); togliere l'animazione da `.view.active` | `assets/site.css:30,62-68,90,120,125,135,142` | bassa | S | no |
| 32 | Domande | tutte | ux-copy | Le domande sono chiare e brevi. Mancano quelle che uno sciatore fa prima di scaricare: costa qualcosa? Quale versione di Android serve? Quanta batteria consuma? Come segnalo un errore della mappa? | Ski Tracks, Slopes: batteria e rete trattate apertamente | Aggiungere 3-4 domande con risposte confermate, e un «Scrivici» in fondo come pagina di supporto | `content/it.mjs:112-122` (e en, de) | bassa | S | no |

Non ho dato una riga a Tailwind: il sito non lo usa (CSS scritto a mano in `assets/site.css`).

---

## 5. Pagina per pagina: confronto col riferimento, secondi e scroll

Le altezze sono misurate (`misure-playwright.json`). I secondi per capire il prodotto sono una **stima** (titolo più prima frase, circa 4 parole al secondo).

| Pagina | Riferimento | Cosa fa meglio lui | Cosa facciamo meglio noi | Per capire il prodotto | Per arrivare all'invito (telefono / desktop) |
|---|---|---|---|---|---|
| Home | Slopes | Fa vedere l'app (schermate, icona) e il download è un badge nella prima schermata | Promessa più specifica (tra comprensori, bus e treni); privacy detta subito («la posizione GPS resta sul telefono»); nessun tracciamento | circa 5 s, nella prima schermata a tutte le larghezze | **0 scroll**: l'invito è a 452 px (telefono) e nella barra (desktop). Il modulo però è a 4.961 px sul telefono (5,9 schermate) e 2.643 px su desktop: un tocco porta lì, poi un secondo tocco sul campo |
| Come funziona | Google Maps (funzione = schermata), Dolomiti Superski (ricerca percorso) | Ogni passo è mostrato con l'interfaccia vera | Problema e soluzione detti bene («Bloccati a metà giro»); tre passi chiari | circa 4 s per il titolo; il "come" resta astratto senza schermate | **8,3 schermate** al telefono (6.996 px), 6,1 sul tablet; desktop 0 (barra) |
| Aree | Dolomiti Superski | Mappa di ogni area, giri, filtri per colore | Elenco chiaro e onesto delle cinque aree | circa 3 s | 1,9 schermate al telefono; desktop 0 |
| Domande | Slopes (help center) | Centro di supporto con ricerca e contatto | Risposte brevi, una per riga, `details` accessibili | — | 1,4 schermate al telefono |
| Chi siamo | — (i riferimenti sono aziende) | — | Persona vera, contatto diretto | — | 1,3 schermate al telefono |
| Privacy | Slopes /data | Corta, titolare nominato, cancellazione in un passo | Molto più precisa e onesta (eventi elencati, scadenze, guida vocale, telefono in tasca): è un punto di forza, una volta tolti i segnaposto | — | nessun invito nella pagina; 13,5 schermate di lettura al telefono |
| Elimina account | regola di Play; Slopes | Percorso esatto nell'app | Distingue «dall'app» e «senza l'app», cita l'account Google | — | — |

---

## 6. Privacy e obblighi

- **Raggiungibile da ogni pagina.** Sì: barra in alto («Privacy»), menu del telefono, piè di pagina («Informativa privacy») e home (riga sotto gli inviti, sezione dedicata). Verificato su tutte le 19 pagine.
- **Titolare identificato.** No, né nel sito né nell'app (righe 1 e 21). Va fatto prima di Play.
- **Stessi dati e stesse scadenze dell'app.** Le scadenze coincidono parola per parola: diagnostica 12 mesi; voti 12 ore nell'app e 30 giorni sul server; attese 60 giorni; tappe 12 mesi; utenza anonima 12 mesi senza uso. Anche i fornitori coincidono (Supabase, Cloudflare R2, MapTiler). Divergono invece la versione (5 contro 4), l'account e Google (solo nel sito), lo stato (in arrivo contro beta chiusa) e tre frasi (righe 20, 22).
- **Cookie banner.** Non serve. Verificato: nessuna richiesta a domini esterni su 57 viste; nessun cookie, `localStorage`, `sessionStorage` o IndexedDB nel codice. L'unico invio esterno è il modulo, dopo il clic (§8).
- **Pagina per cancellare i dati.** C'è (`elimina-account.html`) ma va riscritta per la versione senza account (riga 25). Quando arriverà l'account, Play la chiederà come link web nella scheda «Sicurezza dei dati».
- **Hosting.** L'informativa chiede ancora chi ospita il sito (`privacy.html:150`): oggi è GitHub Pages (`README.md:4`, `pages.yml`), che vede l'indirizzo IP dei visitatori.

---

## 7. Testi: proposte (ux-copy)

**Riga sopra il titolo della home** (oggi in maiuscolo spaziato da 12 px):

| Lingua | Oggi | Proposta |
|---|---|---|
| it | SKI MAPS · NAVIGATORE GPS PER SCIATORI | Il navigatore GPS per chi scia |
| en | SKI MAPS · GPS NAVIGATOR FOR SKIERS | Turn-by-turn GPS navigation for skiers |

**Titolo inglese**

| Opzione | Testo | Quando |
|---|---|---|
| A | The whole tour. Even across ski areas. | Ritocco minimo, mantiene la struttura italiana |
| B | Every piste, every lift. Across linked ski areas. | Mette in primo piano il "come" |
| C | Your whole ski day, mapped. Lifts, pistes and buses. | Più vicino a come ne parla uno straniero |

**Invito**: «Avvisami quando esce» va bene. Con la preregistrazione: «Preregistrati su Google Play» (it), «Pre-register on Google Play» (en), «Auf Google Play vorregistrieren» (de).

**Privacy, prima riga** (oggi è un segnaposto): «Questa è l'informativa che trovi nell'app, in Impostazioni → Privacy. Versione 4, aggiornata il 12 ottobre 2026.»

**Controllo a campione sul tedesco** (da far rivedere a una persona di madrelingua, come chiede `README.md:44`):
- «Beim Start benachrichtigen» si può leggere come «avvisami quando avvio»: meglio «Zum Marktstart benachrichtigen» o, più breve, «Benachrichtige mich».
- «Die Runde um den Sella» (`de.mjs:76`): in tedesco si dice «um die Sellagruppe» o «um den Sellastock».
- Livelli «Anfänger / Fortgeschritten / Experte»: il secondo è un aggettivo tra due nomi; «Fortgeschrittene» o «Mittel» sono più regolari.
- Le etichette «Datenschutz (Englisch)» e «Konto löschen (Englisch)» sono oneste; meglio però tradurre le pagine (riga 24).

Francese e spagnolo: non ci sono pagine da controllare (riga 24).

---

## 8. Prestazioni (Lighthouse) e richieste esterne

### Condizioni

Lighthouse 12.8.2, Chromium 141 senza interfaccia, server locale con gzip. Mobile: dispositivo emulato, CPU rallentata 4×, rete 4G lenta simulata. Desktop: preset desktop.
**Attenzione:** qui la grafica 3D è emulata dal processore (SwiftShader). Sulla home mobile il tempo "non attribuito" (19 s) è quasi tutto questa emulazione, e su un telefono vero sarà molto minore. Restano reali gli 8,4 s di calcolo di `map3d.js` al telefono (3,2 s su desktop) e i 255 KB compressi di script.
L'INP non si misura in laboratorio: uso il TBT come indicatore. Sulla home mobile il ritardo massimo di un primo tocco stimato da Lighthouse è 10 s.

### Prima (misurato) e dopo (stimato)

| Pagina | Formato | Prestazioni | LCP | TBT | CLS | Dopo (stima) | Su cosa si basa la stima |
|---|---|---|---|---|---|---|---|
| Home | mobile | **37** | **9,1 s** | **16.150 ms** | 0 | 90-98 · LCP circa 2,0 s · TBT sotto 100 ms | misurato 99 / 2,0 s / 0 ms con i tre script della mappa bloccati; il poster aggiunge circa 60 KB |
| Home | desktop | 53 | 1,8 s | 1.490 ms | **0,177** | circa 90 · LCP circa 0,6 s · TBT sotto 300 ms · CLS sotto 0,05 | misurato 95 / 0,5 s / 0 ms / 0,14 senza mappa; il CLS che resta è del font (riga 6) |
| Come funziona | mobile / desktop | 98 / 100 | 1,8 s / 0,5 s | 0 | 0,007 / 0,009 | FCP mobile circa 1,3 s | Lighthouse stima 1,06 s di CSS e font che bloccano la pittura (riga 30) |
| Aree | mobile / desktop | 98 / 100 | 1,8 s / 0,5 s | 0 | 0,019 / 0,009 | come sopra | |
| Privacy | mobile / desktop | 96 / 100 | 2,0 s / 0,5 s | 0 | 0,079 / 0,015 | come sopra | il "redirect" che Lighthouse segnala dipende dal server locale (`serve` toglie `.html`), non da GitHub Pages |

Accessibilità (Lighthouse): 96 in home (contrasto della riga disattivata), 98 in privacy (ordine dei titoli), 100 altrove. Buone pratiche e SEO: 100 dappertutto.

### Pesi trasferiti

| Voce | Home | Altre pagine |
|---|---|---|
| HTML | 5 KB | 3-8 KB |
| CSS (`site.css` + `fonts.css`) | 13 KB | 13 KB |
| Script | 268 KB (`three.min.js` 145, `graph-data.js` 110, `map3d.js` 10, altri 3) | 1-3 KB |
| Font (Barlow 400/500/600, Big Shoulders, IBM Plex Mono 500/600) | 110 KB mobile, 131 KB desktop | uguale |
| Immagini | 0 (nessun `<img>` nel sito; `og-image.png` 47 KB la usano solo i social) | 0 |
| Totale | 397 KB mobile, 419 KB desktop | 127-156 KB |

I font sono 6 file per 3 famiglie. Se il titolo restasse il solo carattere speciale, togliendo IBM Plex Mono (usata solo per le righe piccole in maiuscolo) si risparmiano circa 31 KB.

### Richieste verso domini esterni

| Quando | Dominio | Cosa parte | Prima di un consenso? |
|---|---|---|---|
| Navigazione di tutte le 19 pagine, 3 larghezze | — | **nessuna** (verificato con Playwright su 57 viste) | — |
| Clic su «Avvisami», con la chiave configurata (produzione) | `api.web3forms.com` | `POST /submit` con email, oggetto, pagina di provenienza, `botcheck`; il servizio vede l'IP | parte solo all'azione dell'utente; nessun cookie; l'informativa lo descrive (`privacy.html:146`, con un segnaposto) |
| Clic su «Avvisami» senza chiave | — | si apre il programma di posta (`mailto:`) | — |
| Solo se si clicca il link | `openstreetmap.org`, `opendatacommons.org`, `doi.org`, `garanteprivacy.it`, `policies.google.com` | normale navigazione | — |
| Sempre | GitHub Pages (hosting) | vede IP e dati tecnici di ogni richiesta | inevitabile; da nominare nell'informativa (`privacy.html:150`) |

Non ci sono analytics, font o incorporamenti esterni: corrisponde a quanto dichiarato in `README.md:26,43` e `privacy.html:150`.

---

## 9. Sintesi per skill

- **design:design-critique.** Primo colpo d'occhio: il titolo enorme in maiuscolo e la sottolineatura ambra, giusto. Poi, su desktop, la scheda scura della demo, che però apre spesso con un fallimento (riga 4). Gerarchia chiara, molto spazio, carattere riconoscibile. Il punto debole è l'assenza dell'app (righe 3, 9) e, al telefono, l'invito che sparisce (riga 7).
- **design:accessibility-review (WCAG 2.1 AA).** 0 critici, 3 medi (anello del focus a 2,41:1, demo non usabile da tastiera, ordine dei titoli nella privacy), 3 minori (link del piè di pagina a 22 px, riga disattivata a 2,32:1, niente navigazione senza JavaScript). Da mantenere: salto al contenuto, focus visibile, `lang` dichiarato, nessun problema a 200 % e a 320 px, `aria-current`, `role=status` e `role=alert` nel modulo, movimento ridotto rispettato. Non ho fatto prove con un lettore di schermo vero (VoiceOver, TalkBack).
- **design:ux-copy.** Promessa specifica e senza gergo; testi brevi; il modulo spiega cosa succede, anche col programma di posta. Da correggere: segnaposto (righe 1, 2), la parola «navigatore» poco visibile (riga 28), le funzioni distintive non raccontate (riga 27), l'inglese che suona tradotto, alcuni punti del tedesco (§7).
- **design:design-system.** Token di colore ben nominati in `:root`, ma 91 colori scritti a mano fuori dai token, 35 dimensioni di carattere, circa un terzo di CSS morto, nessuna corrispondenza con i token dell'app (riga 30). Componenti coerenti: pulsante (primario, secondario), scheda, riga sopra il titolo, porta.
- **hzblj-skills:ui-typography / ui-surfaces / ui-interactions / ui-motion.** Riga 31, più il CLS dovuto al font (riga 6) e il colore del focus (riga 13).

---

## 10. Cosa resta da verificare

- Il sito pubblicato su skimaps.cc: dominio, HTTPS, 404 di GitHub Pages, contenuto di `config.js` in produzione, indicizzazione. Una ricerca per `"skimaps.cc"` non restituisce pagine del sito: forse non è ancora indicizzato.
- Le prestazioni su un telefono Android vero (GPU reale), soprattutto il calcolo della demo 3D.
- La disponibilità del nome di pacchetto `com.skimap` e della scheda Play (serve la Play Console).
- La rilettura del tedesco da parte di una persona di madrelingua.
