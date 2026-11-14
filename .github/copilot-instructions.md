# Istruzioni per GitHub Copilot

- Rispondi in italiano.
- Leggi `CLAUDE.md` (nel repo `skimap-data`, `../skimap-data/CLAUDE.md`) e `AGENTS.md`: le regole sono le stesse di Claude Code.
- Un solo strumento che scrive per ramo. Se su questo ramo sta scrivendo Claude Code, non modificare file: leggi e commenta.
- Niente `git push`.
- Non toccare `CONSENT_VERSION`, testi legali (`privacy.html`, `elimina-account.html` e le versioni inglesi), chiavi, migrazioni, pubblicazione su R2: quelle passano da Claude Code, con l'ok di Christian.
- Ogni testo nuovo va in tutte le lingue del sito (it, en, de; il sito non ha fr ed es).
- Prima di dire «fatto»: `node tools/build.mjs` e `node tools/check.mjs` verdi. Se qualcosa non è provato, scrivilo sotto «Non verificato».
- Il messaggio di commit comincia col prefisso dello strumento: `[copilot-sonnet]`, `[copilot-gpt]`.
