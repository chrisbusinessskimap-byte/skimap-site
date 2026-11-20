# Cosa aspetta una conferma (P30)

Dal sito Astro le frasi non confermate non sono più segnaposto in pagina: stanno in `src/content/claims.json` con uno **stato**. `npm run check:release` (e la CI sulle richieste di unione verso `main`) **fallisce** finché c'è una frase `falsa` o `da verificare`; in anteprima si vedono comunque. Quando Christian conferma una frase, si cambia lo stato (e la riga del contratto in `skimap-data`, §6).

Elenco aggiornato al 20-11-2026 (il 20-11 Christian ha deciso: titolare, iscrizione semplice, tolto «meno chiamate», de/fr/es rilette; vedi in fondo) (la lista vera è `npm run check` senza `--release`):

| id | stato | cosa serve |
|---|---|---|
| `pacchetto-comprensorio` | vera | «Scarichi le mappe del comprensorio una volta, a casa»: vale per la v2; dipende da quale interfaccia esce il 26-11 e dalla decisione del 20-11 sulle tessere. | Messa «vera» da Christian il 20-11: esce la v2.
| `no-cookie-sito` | da verificare | La prova sul dominio vero dopo il cambio: `npm run check:browser -- --base=https://skimaps.cc`, esito nel DIARIO. |
| `rilievo-crediti` | da verificare | 20-11 sera: dal parere, aggiunti la licenza CC BY 3.0 AT dei dati austriaci (con link; fonte Joerd attribution.md) e «dati modificati» sulla riga USGS. **Christian riconferma il testo.** |
| `avvisami-una-volta` | da verificare | 20-11: **iscrizione semplice scelta**. Resta la riga nell'informativa («Questo sito») e la campagna del lancio a mano, una sola, a quella lista. |
| `territorio-benefici` | vera | 20-11: tolti «meno chiamate» e «giri» (non escono il 26-11); ora «ospiti che sanno a che ora rientrare e se fanno in tempo per l'ultimo impianto, dove l'orario è annunciato». Confermata da Christian il 20-11 (de/fr/es scritte da Claude il 20-11, da rileggere). |
| `territorio-dati-risposta` | da verificare | 20-11: tolta la casella di consenso (decisione di Christian); sotto il modulo c’è il link all’informativa e «non scrivere dati di altre persone». La casella dei messaggi resta chris.business.skimap@gmail.com (scelta di Christian): il parere segnala l’assenza di un contratto da responsabile (art. 28). Da scrivere nell’informativa e nel registro, e portare al legale. |
| `informativa-sito` | falsa | Le sezioni «Questo sito» dell'informativa (GitHub Pages, «nessuno strumento di analisi», lista d'attesa) diventano false il giorno del cambio di dominio: le riscrive una sessione a parte, con l'ok scritto di Christian, nello stesso commit. |

Altre domande, fuori dal registro:
- **Titolare del trattamento**: 20-11 Christian ha indicato *Christian Daniele, Via Alessandro Poerio 112, Roma* (persona fisica: non c'è la società che `LEGALE_F1.md` §10 prevede). La frase unica e la domanda sull'indirizzo di residenza pubblico sono nella Domanda 11 dell'appendice legale. **Non toccata l'informativa.**
- **I due moduli** (usciti il 17-11): in Brevo servono una lista d'attesa (il suo numero va in `BREVO_WAITLIST_ID`) e un mittente verificato su skimaps.cc (`MAIL_FROM`); la chiave in `BREVO_API_KEY`. Per «Per il territorio»: registro dei trattamenti, domanda al legale con quelle del 20-11, conservazione dei messaggi (nella casella di Christian); **niente Turnstile (scelta del 20-11)**: il codice lo ammette solo se si mettono `PUBLIC_TURNSTILE_SITEKEY` e `TURNSTILE_SECRET`, che non si mettono. Per la lista d'attesa: **iscrizione semplice (scelta del 20-11)**; la lingua dell'iscritto oggi non si salva (una lista sola).
- **Maestri**: modulo di consenso (nome, foto, frase, durata, ritiro) da far vedere al legale; nessun consiglio col nome senza l'approvazione scritta.
- **Lingue**: 20-11 Christian ha rilette e confermate le pagine in tedesco, francese e spagnolo. Le due frasi riscritte il 20-11 (benefici del territorio, riga SRTM del credito) vanno rilette di nuovo.
