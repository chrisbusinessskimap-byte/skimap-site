# Ski Maps — sito

Landing e pagine pubbliche di Ski Maps (*Navigatore GPS per sciatori* / *GPS Navigator for Skiers*), dominio `skimaps.cc`.
Sito statico in italiano, inglese e tedesco, senza cookie né strumenti di tracciamento, pubblicato con GitHub Pages dal ramo `main` tramite il workflow `.github/workflows/pages.yml` (scrive la chiave Web3Forms dal secret `WEB3FORMS_KEY`).

## Struttura

Pagine generate da `tools/build.mjs` con i testi di `content/it.mjs`, `content/en.mjs`, `content/de.mjs`
(**non modificarle a mano**: cambia i testi e rilancia `node tools/build.mjs`):

| | Italiano | English | Deutsch |
|---|---|---|---|
| Home (mappa 3D, punti chiave, privacy in breve, «Avvisami») | `/` | `/en/` | `/de/` |
| Come funziona (giro, tre passi, funzioni) | `/come-funziona/` | `/en/how-it-works/` | `/de/so-funktionierts/` |
| Aree (+ società impianti, `#impianti`) | `/aree/` | `/en/areas/` | `/de/skigebiete/` |
| Domande | `/domande/` | `/en/faq/` | `/de/fragen/` |
| Chi siamo | `/chi-siamo/` | `/en/about/` | `/de/ueber-uns/` |

Pagine legali scritte a mano (il generatore aggiorna solo barra in alto e piè di pagina):
`privacy.html`, `elimina-account.html`, `en/privacy.html`, `en/delete-account.html`. Il tedesco rimanda a quelle inglesi.

I vecchi indirizzi con l'ancora (`/#beta`, `/#giro`, `/#pilot`, `/#privacy`…) portano alla pagina giusta (`assets/site.js`).
Le schermate dell'app vanno in `assets/shots/` con i nomi elencati in `tools/build.mjs` (WebP, schermo intero senza la barra dei tasti di Android, tutte della stessa misura; i tre passi compaiono solo quando ci sono tutte e tre): finché un file manca, quella schermata non compare. `node tools/build.mjs` dice quali mancano.

- Pagina Aree: una cartina dell'Italia per regioni; toccandone una compaiono i suoi comprensori (`assets/areas.js`). Numeri e cartina vengono dai grafi dell'app e dai confini ISTAT delle regioni: `node tools/areas.mjs --data=../skimap-data --geo=limits_IT_regions.geojson` riscrive `content/areas.json` e `content/italy.json`, da rilanciare quando cambia un grafo (i 12 comprensori ufficiali del Superski sono in `tools/areas.mjs`, a partire dai punti dell’app; il file dei confini è in [openpolis/geojson-italy](https://github.com/openpolis/geojson-italy), CC BY 4.0, e non sta nel repo). Il Superski sta in due regioni: ognuna ha i numeri della sua parte. La quota è arrotondata per difetto alle centinaia: il modello del terreno smussa le cime.
- `tools/site.mjs`: lingue, pagine e indirizzi. `tools/build.mjs`: genera pagine e `sitemap.xml`. `tools/check.mjs`: controlli.
- `assets/`: `site.css`, `site.js` (menu), `hero.js` (carica la mappa 3D: subito su computer, al tocco su telefono e tablet, dove al suo posto c'è `hero-poster-‹lingua›.webp`) + `map3d.js` + `graph-data.js` + `vendor/three.min.js`, `icon-64.png` e le favicon (l'icona dell'app), `beta.js` + `config.js` (modulo), font e icone. Nessuna risorsa da altri siti.
- `.github/workflows/pages.yml`: a ogni push su `main` genera le pagine, fa i controlli, scrive la chiave Web3Forms dal secret `WEB3FORMS_KEY` e pubblica.
- `docs/FORM.md`: il modulo di iscrizione.

## Verifica

```
node tools/build.mjs            # rigenera le pagine dai testi
node tools/check.mjs            # link, ancore, id duplicati, meta, risorse esterne, parole vietate, parità tra le lingue
node tools/check.mjs --list     # elenca i segnaposto [DA CONFERMARE]
node tools/check.mjs --release  # come in pubblicazione: un segnaposto è un errore
python3 -m http.server 8000     # anteprima su http://localhost:8000
```

## Regole del sito
- Nome: **Ski Maps**. Nessun numero di utenti, recensioni, premi, partner o date d'uscita; nessun concorrente nominato; niente superlativi né gergo tecnico.
- Disponibilità: «In arrivo su Google Play», iOS «in seguito». Aree al lancio: Dolomiti Superski, Ovindoli, Campo Felice, Vialattea (con Bardonecchia), Livigno.
- Dove compare una mappa: attribuzione «© OpenStreetMap contributors».
- Nessun cookie né analytics senza una richiesta esplicita.
- Niente segnaposto in pubblico: un `[DA CONFERMARE]` ferma la pubblicazione. Le domande aperte stanno in `docs/DA_CONFERMARE.md`.
- L'informativa del sito è quella dell'app (`skimap-mobile`, chiavi `privacy.*` dei cataloghi, stessa versione e data), più le sezioni che riguardano solo il sito (lista d'attesa, questo sito, fonti).
- Le lingue vanno tenute allineate (stesse sezioni e stessi segnaposto): `tools/check.mjs` lo controlla. Il tedesco va fatto rileggere da una persona di madrelingua.

Contatti: chris.business.skimap@gmail.com
