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
I riquadri `[SCREENSHOT: …]` sono segnaposto: vanno sostituiti con le schermate vere dell'app.

- `tools/site.mjs`: lingue, pagine e indirizzi. `tools/build.mjs`: genera pagine e `sitemap.xml`. `tools/check.mjs`: controlli.
- `assets/`: `site.css`, `site.js` (menu), `map3d.js` + `graph-data.js` + `vendor/three.min.js` (mappa 3D della home), `beta.js` + `config.js` (modulo), font e icone. Nessuna risorsa da altri siti.
- `.github/workflows/pages.yml`: a ogni push su `main` genera le pagine, fa i controlli, scrive la chiave Web3Forms dal secret `WEB3FORMS_KEY` e pubblica.
- `docs/FORM.md`: il modulo di iscrizione.

## Verifica

```
node tools/build.mjs            # rigenera le pagine dai testi
node tools/check.mjs            # link, ancore, id duplicati, meta, risorse esterne, parole vietate, parità tra le lingue
node tools/check.mjs --list     # elenca i segnaposto [DA CONFERMARE]
python3 -m http.server 8000     # anteprima su http://localhost:8000
```

## Regole del sito
- Nome: **Ski Maps**. Nessun numero di utenti, recensioni, premi, partner o date d'uscita; nessun concorrente nominato; niente superlativi né gergo tecnico.
- Disponibilità: «In arrivo su Google Play», iOS «in seguito». Aree al lancio: Dolomiti Superski, Ovindoli, Campo Felice, Vialattea (con Bardonecchia), Livigno.
- Dove compare una mappa: attribuzione «© OpenStreetMap contributors».
- Nessun cookie né analytics senza una richiesta esplicita.
- Le lingue vanno tenute allineate (stesse sezioni e stessi segnaposto): `tools/check.mjs` lo controlla. Il tedesco va fatto rileggere da una persona di madrelingua.

Contatti: chris.business.skimap@gmail.com
