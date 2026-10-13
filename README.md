# Ski Maps — sito

Landing e pagine pubbliche di Ski Maps (*Navigatore GPS per sciatori* / *GPS Navigator for Skiers*), dominio `skimaps.cc`.
Sito statico in italiano e inglese, senza cookie né strumenti di tracciamento, pubblicato con GitHub Pages dal ramo `main`.

## Struttura

| Pagina IT | Pagina EN | Contenuto |
|---|---|---|
| `index.html` | `en/index.html` | landing a sezioni (`#home`, `#come-funziona`, `#pensata`, `#mondo`, `#pilot`, `#beta`) |
| `privacy.html` | `en/privacy.html` | informativa privacy (versione 5) |
| `elimina-account.html` | `en/delete-account.html` | come eliminare l'account |

I vecchi indirizzi `/#privacy` e `/#elimina-account` (EN: `/en/#privacy`, `/en/#delete-account`) portano alle pagine a sé.

- `assets/`: CSS, JS, font (`fonts/`), three.js (`vendor/`), dati del grafo (`graph-data.js`), icone e immagine social.
  Nessuna risorsa viene caricata da altri siti.
- `docs/FORM.md`: come attivare il modulo di iscrizione. `docs/pages-deploy.example.yml`: esempio di pubblicazione (non attivo).
- `tools/check.mjs`: verifica locale. `tools/write-config.mjs`: scrive la configurazione del modulo da variabili d'ambiente.

## Verifica

```
node tools/check.mjs            # link, ancore, risorse esterne, vecchio nome, parità IT/EN
node tools/check.mjs --list     # elenca i segnaposto [DA CONFERMARE]
node tools/check.mjs --release  # come sopra, ma i segnaposto rimasti sono errori: da lanciare prima di pubblicare
python3 -m http.server 8000     # anteprima su http://localhost:8000
```

## Regole del sito
- Nome: **Ski Maps**. Nessun numero di utenti, recensioni o premi; nessun concorrente nominato.
- Dove compare una mappa: attribuzione «© OpenStreetMap contributors».
- Nessun cookie né analytics senza una richiesta esplicita.
- Le pagine IT e EN vanno tenute allineate (stesse sezioni): `tools/check.mjs` lo controlla.

Contatti: chris.business.skimap@gmail.com
