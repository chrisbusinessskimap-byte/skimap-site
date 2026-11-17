# Cosa aspetta una conferma (P30)

Dal sito Astro le frasi non confermate non sono più segnaposto in pagina: stanno in `src/content/claims.json` con uno **stato**. `npm run check:release` (e la CI sulle richieste di unione verso `main`) **fallisce** finché c'è una frase `falsa` o `da verificare`; in anteprima si vedono comunque. Quando Christian conferma una frase, si cambia lo stato (e la riga del contratto in `skimap-data`, §6).

Elenco al 17-11-2026 (la lista vera è `npm run check` senza `--release`):

| id | stato | cosa serve |
|---|---|---|
| `pacchetto-comprensorio` | da verificare | «Scarichi le mappe del comprensorio una volta, a casa»: vale per la v2; dipende da quale interfaccia esce il 26-11 e dalla decisione del 20-11 sulle tessere. |
| `peso-pacchetto` | da verificare | I pesi massimi su `/download/<id>` sono gli obiettivi del piano (100, 75, 40, 25 MB), non misure. |
| `no-cookie-sito` | da verificare | La prova sul dominio vero dopo il cambio: `npm run check:browser -- --base=https://skimaps.cc`, esito nel DIARIO. |
| `rilievo-crediti` | da verificare | Quale fonte copre le Dolomiti nelle Terrain Tiles; il credito di `fonti-e-licenze` è una bozza. |
| `informativa-sito` | falsa | Le sezioni «Questo sito» dell'informativa (GitHub Pages, «nessuno strumento di analisi», lista d'attesa) diventano false il giorno del cambio di dominio: le riscrive una sessione a parte, con l'ok scritto di Christian, nello stesso commit. |

Altre domande, fuori dal registro:
- **Titolare del trattamento**: una frase sola, uguale in app e sito, prima della richiesta di produzione (nome o ragione sociale e indirizzo).
- **Modulo «Per il territorio»** (dal 4-12): registro dei trattamenti, domanda al legale con quelle del 20-11, chi spedisce (proposta: Brevo), conservazione.
- **Maestri**: modulo di consenso (nome, foto, frase, durata, ritiro) da far vedere al legale; nessun consiglio col nome senza l'approvazione scritta.
- **Lingue**: chi rilegge tedesco, francese e spagnolo.
