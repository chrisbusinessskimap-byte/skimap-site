# Ski Maps — sito

Il sito pubblico di Ski Maps (*skimaps.cc*): cinque lingue, nessun cookie, nessuno strumento di tracciamento.
Astro (pagine statiche, JavaScript solo nelle isole), pubblicato da **Cloudflare Pages** collegato a questo repo: ogni ramo ha la sua anteprima, `main` è il dominio vero. **Unire in `main` equivale a pubblicare**: lo fa Christian.

> Dal ramo `feature/p30-sito` il sito è questo (P30, `docs/design/P30.md` nel repo `skimap-data`). Il sito di prima era HTML generato da `tools/build.mjs` e pubblicato con GitHub Pages: sta nella cronologia di `main`.

## Comandi

```
npm ci
npm run dev            # sviluppo
npm run build          # costruisce dist/
npm run check          # controlli statici su dist/ (hreflang, parità delle 5 lingue, frasi, indirizzi di oggi, legali sigillati, link, risorse esterne)
npm run check:release  # come per l'unione: una frase «falsa» o «da verificare» è un errore
npm run check:browser  # Chrome: nessun cookie, nessuna richiesta esterna, axe, scorrimento orizzontale   [--base=https://skimaps.cc sul dominio vero]
npm run lighthouse     # telefono, mediana di 3 prove, quattro categorie ≥ 95, LCP ≤ 2,5 s, CLS ≤ 0,1, TBT ≤ 200 ms   [--runs=1 --preview]
npm test               # la funzione di «/» (lingua del browser)
npm run typecheck      # astro check: tipi, e la parità dei campi fra le cinque lingue
npm run tokens         # rigenera src/design/tokens.css dall'istantanea del Figma (tokens:check per solo controllare)
npm run manifest       # copia i dati dei comprensori dal manifest su R2 (sola lettura) e le foto
npm run relief         # le immagini del rilievo dalle sorgenti di skimap-data
```

## Dove sta cosa

- `src/design/` — **i token vengono dal Figma, mai a mano**: `figma/snapshot.json` (variabili «Ski Maps» Giorno/Notte e stili «Sito/…», letti con l'MCP di Figma in sola lettura) → `tokens.css` generato.
- `src/i18n/` — `langs.ts` (le 5 lingue, `LEGAL_VERSION`), `routes.ts` (**la tabella delle rotte**: stessa struttura in tutte le lingue, nomi tradotti), `redirects.ts` (gli indirizzi di oggi → pagine nuove; scrive `_redirects`).
- `src/content/` — i testi, un file per lingua con la stessa forma (`types.ts`: se una lingua manca un campo, `npm run typecheck` lo dice). **Le frasi-promessa** hanno `<span data-claim="id">` e una voce in `claims.json` (stati chiusi: vera, parziale, falsa, da verificare).
- `src/data/` — `areas.ts` (i tre nomi di ogni comprensorio e la regola dei numeri) e `manifest.snapshot.json`.
- `src/layouts`, `src/components`, `src/views`, `src/pages` — `[...slug].astro` costruisce tutte le pagine delle lingue dalla tabella delle rotte; `scarica` e `download/[id]` sono pagine di servizio leggere.
- `src/legal/` — i testi legali di `main`, **byte per byte** (sigillati in `SHA256SUMS`: il controllo li confronta). Si cambiano solo con l'ok scritto di Christian.
- `public/` — `_headers` (politica dei contenuti: solo il sito), `_redirects` (generato), font con le licenze, rilievo, foto, marchio.
- `functions/index.js` — `/` per lingua del browser (Pages Function); senza `Accept-Language` resta la pagina di scelta della lingua.
- `scripts/check/` — i controlli. `.github/workflows/ci.yml` li esegue; sulle richieste di unione verso `main` anche `--release` e Lighthouse.

## I due moduli (nessun JavaScript)

- **«Avvisami quando esce su Google Play»** (`src/components/Waitlist.astro`, Figma 243:6395 · 243:6402): al posto del pulsante dello store finché `STORE_STATE` non è `play` (home, fascia finale, `/scarica`, `/download/<id>`). POST a `/api/avvisami`: aggiunge l'indirizzo alla lista d'attesa di Brevo.
- **«Per il territorio»** (`src/views/TerritoryPage.astro`, Figma 227:6617): modulo per farsi ricontattare da impianti, consorzi, scuole sci, rifugi e noleggi; fascia di rimando in fondo all'indice e alle pagine dei comprensori (Figma 244:6395). POST a `/api/territorio`: manda un messaggio alla casella di Christian.
- Le due funzioni stanno in `functions/api/` (Pages Functions, prove in `functions/forms.test.mjs`): il browser parla solo con skimaps.cc, Brevo si chiama dal server. La risposta torna alla pagina con `#<id>-ok|-invalid|-fail` e il CSS la mostra con `:target`. Niente cookie, niente archivio, l'email non va nei registri.
- Segreti del progetto Pages (non nel repo): `BREVO_API_KEY` · `BREVO_WAITLIST_ID` (lista d'attesa) · `MAIL_FROM` (mittente verificato su skimaps.cc) · `TERRITORY_TO` (facoltativo, di partenza `chris.business.skimap@gmail.com`) · `TURNSTILE_SECRET` (facoltativo). Variabile di build `PUBLIC_TURNSTILE_SITEKEY`: se c'è, solo la pagina del modulo carica Cloudflare Turnstile (`_headers` le apre la politica dei contenuti, unico scostamento).
- Senza i segreti i moduli rispondono «non siamo riusciti a registrare»: la pagina dice l'indirizzo di posta, mai un errore muto.

## Regole del sito
- Nome: **Ski Maps**. Nessun dato dal vivo o proprietario: ogni schermata e ogni orario è un **esempio dichiarato**. Niente attese, accuratezza, classifiche, grafo aperto, né numeri di utenti.
- Il sito **non usa cookie, archivio del browser né richieste ad altri domini** (unica eccezione scritta: Turnstile sulla pagina del modulo «Per il territorio», solo con la chiave pubblica). Nessuno strumento di statistica: da dove arriva chi scarica lo dice la Play Console, dai parametri sul collegamento allo store.
- Il tema è fisso: home scura, pagine di spiegazione chiare. Telefono e computer alla pari.
- Una frase che promette qualcosa ha un id nel registro e nel contratto (`POSIZIONAMENTO_CONTRATTO.md` del repo `skimap-data`, §6). Una macchina controlla solo le frasi marcate: le altre le cerca chi rilegge.
- Ogni testo nuovo va in tutte e cinque le lingue. I legali di tedesco, francese e spagnolo rimandano all'inglese (eccezione scritta nel controllo di parità).
- Non toccare i testi legali, `CONSENT_VERSION`, chiavi, R2 (solo lettura del manifest). L'informativa del sito è quella dell'app (stessa versione e data): `LEGAL_VERSION` in `src/i18n/langs.ts`.
- Nessun logo di terzi; riga fissa «sito indipendente, non affiliato ai gestori» nel piede e nei comprensori. I consigli dei maestri escono col nome solo con l'approvazione scritta di quel maestro.
- Pagine sotto la linea di taglio (4-12, `live: false` in `src/i18n/routes.ts`): giri, ricerca nell'aiuto, video, transizioni fra pagine. «Per il territorio» e il modulo sono usciti dalla linea il 17-11 (scelta di Christian).

Contatti: chris.business.skimap@gmail.com
