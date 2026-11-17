# Istruzioni per GitHub Copilot

- Rispondi in italiano.
- Leggi `CLAUDE.md` (nel repo `skimap-data`, `../skimap-data/CLAUDE.md`) e `AGENTS.md`: le regole sono le stesse di Claude Code.
- Un solo strumento che scrive per ramo. Se su questo ramo sta scrivendo Claude Code, non modificare file: leggi e commenta.
- Niente `git push`.
- Non toccare `CONSENT_VERSION`, testi legali (`src/legal/*.html`), chiavi, migrazioni, pubblicazione su R2: quelle passano da Claude Code, con l'ok di Christian.
- Il sito è Astro (dal ramo `feature/p30-sito`): i testi stanno in `src/i18n/ui.*.json` e `src/content/pages/<lingua>/`, non più in `content/*.mjs`.
- Ogni testo nuovo va in **tutte e cinque** le lingue (it, en, de, fr, es). I testi legali di de, fr, es rimandano all'inglese.
- Una frase che promette qualcosa (offline, tempi, gratis, iPhone…) ha un id in `src/content/claims.json` e un `data-claim` nel contenuto: non la cambiare senza aggiornare la voce.
- Prima di dire «fatto»: `npm run build` e `npm run check` verdi. Se qualcosa non è provato, scrivilo sotto «Non verificato».
- Il messaggio di commit comincia col prefisso dello strumento: `[copilot-sonnet]`, `[copilot-gpt]`.
