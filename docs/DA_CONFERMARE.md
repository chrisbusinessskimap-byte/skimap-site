# Cosa aspetta una conferma (P30)

Dal sito Astro le frasi non confermate non sono più segnaposto in pagina: stanno in `src/content/claims.json` con uno **stato**. `npm run check:release` (e la CI sulle richieste di unione verso `main`) **fallisce** finché c'è una frase `falsa` o `da verificare`; in anteprima si vedono comunque. Quando Christian conferma una frase, si cambia lo stato (e la riga del contratto in `skimap-data`, §6).

Elenco aggiornato al 20-11-2026 (il 20-11 Christian ha deciso: titolare, iscrizione semplice, tolto «meno chiamate», de/fr/es rilette; vedi in fondo) (la lista vera è `npm run check` senza `--release`):

| id | stato | cosa serve |
|---|---|---|
| `pacchetto-comprensorio` | da verificare | «Scarichi le mappe del comprensorio una volta, a casa»: vale per la v2; dipende da quale interfaccia esce il 26-11 e dalla decisione del 20-11 sulle tessere. |
| `peso-pacchetto` | da verificare | I pesi massimi su `/download/<id>` sono gli obiettivi del piano (100, 75, 40, 25 MB), non misure. |
| `no-cookie-sito` | da verificare | La prova sul dominio vero dopo il cambio: `npm run check:browser -- --base=https://skimaps.cc`, esito nel DIARIO. |
| `rilievo-crediti` | da verificare | 20-11: aggiunta la riga SRTM/USGS (alla scala usata, zoom 12, le quote sulla terraferma sono SRTM; Austria DGM per il tratto austriaco), da documentazione delle Terrain Tiles; non verificato pixel per pixel. **Christian conferma il nuovo testo.** |
| `avvisami-una-volta` | da verificare | 20-11: **iscrizione semplice scelta**. Resta la riga nell'informativa («Questo sito») e la campagna del lancio a mano, una sola, a quella lista. |
| `territorio-benefici` | da verificare | 20-11: tolti «meno chiamate» e «giri» (non escono il 26-11); ora «ospiti che sanno a che ora rientrare e se fanno in tempo per l'ultimo impianto, dove l'orario è annunciato». **Christian conferma la nuova frase** (de/fr/es scritte da Claude il 20-11, da rileggere). |
| `territorio-dati-risposta` | da verificare | Informativa, registro dei trattamenti e Domanda 13 dell'appendice legale (`skimap-data/docs/LEGALE_P30_SITO.md`, 20-11). |
| `informativa-sito` | falsa | Le sezioni «Questo sito» dell'informativa (GitHub Pages, «nessuno strumento di analisi», lista d'attesa) diventano false il giorno del cambio di dominio: le riscrive una sessione a parte, con l'ok scritto di Christian, nello stesso commit. |

Altre domande, fuori dal registro:
- **Titolare del trattamento**: 20-11 Christian ha indicato *Christian Daniele, Via Alessandro Poerio 112, Roma* (persona fisica: non c'è la società che `LEGALE_F1.md` §10 prevede). La frase unica e la domanda sull'indirizzo di residenza pubblico sono nella Domanda 11 dell'appendice legale. **Non toccata l'informativa.**
- **I due moduli** (usciti il 17-11): in Brevo servono una lista d'attesa (il suo numero va in `BREVO_WAITLIST_ID`) e un mittente verificato su skimaps.cc (`MAIL_FROM`); la chiave in `BREVO_API_KEY`. Per «Per il territorio»: registro dei trattamenti, domanda al legale con quelle del 20-11, conservazione dei messaggi (nella casella di Christian), e se si vuole Turnstile la chiave (nel pannello di Cloudflare: `PUBLIC_TURNSTILE_SITEKEY` e `TURNSTILE_SECRET`). Per la lista d'attesa: **iscrizione semplice (scelta del 20-11)**; la lingua dell'iscritto oggi non si salva (una lista sola).
- **Maestri**: modulo di consenso (nome, foto, frase, durata, ritiro) da far vedere al legale; nessun consiglio col nome senza l'approvazione scritta.
- **Lingue**: 20-11 Christian ha rilette e confermate le pagine in tedesco, francese e spagnolo. Le due frasi riscritte il 20-11 (benefici del territorio, riga SRTM del credito) vanno rilette di nuovo.
