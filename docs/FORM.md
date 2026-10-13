# Modulo di iscrizione alla beta: cosa fare

**Oggi** il modulo non invia nulla dal sito: apre il programma di posta del visitatore con un'email già scritta.
Per far arrivare le iscrizioni direttamente nella casella `chris.business.skimap@gmail.com` serve un servizio di form esterno.
Il codice è già pronto (`assets/beta.js`): supporta **Web3Forms** (consigliato) o **Formspree**. Manca solo la chiave.

## Cosa devi fare tu

1. **Crea la chiave.** Vai su <https://web3forms.com>, inserisci `chris.business.skimap@gmail.com`: ricevi per email una *access key*.
2. **Salvala come secret** (non nel repo): su GitHub, nel repo → *Settings → Secrets and variables → Actions → New repository secret*, nome `WEB3FORMS_KEY`, valore la chiave.
   (In alternativa Formspree: crea il modulo su <https://formspree.io> e salva l'URL `https://formspree.io/f/xxxx` come secret `FORMSPREE_URL`.)
3. **Attiva la pubblicazione con i secret.** GitHub Pages da solo non può usare i secret. Sposta `docs/pages-deploy.example.yml` in `.github/workflows/pages.yml` e in *Settings → Pages → Source* scegli **GitHub Actions**.
   Questo cambia come viene pubblicato il sito: non l'ho fatto io, è una tua scelta.
   Il workflow esegue i controlli, scrive `assets/config.js` con la chiave dal secret e pubblica.
4. **Completa l'informativa.** Quando il servizio è attivo, la pagina privacy mostra da sola il paragrafo che nomina Web3Forms (o Formspree). Rispondi ai `[DA CONFERMARE]` di quel paragrafo (conservazione, ruolo, sede del servizio).
5. **Prova.** Apri il sito pubblicato, iscriviti con una tua email e controlla che arrivi la notifica.

Se non fai nulla, il modulo continua a funzionare con il programma di posta e l'informativa lo dice.

## Cose da sapere
- Un form che parte dal browser mostra sempre la chiave a chi guarda il codice della pagina: non è una password, serve solo a indicare dove consegnare le email. Tenerla fuori dal repo evita che resti nella cronologia e che finisca per sbaglio in altri progetti.
  Controlla nel pannello del servizio le protezioni anti-spam disponibili (limite ai domini, captcha): non ho verificato quali offre il tuo piano.
- Il modulo ha già una trappola anti-bot (campo nascosto).
- In locale, per provare con una chiave senza rischiare di committarla:
  ```
  git update-index --skip-worktree assets/config.js
  WEB3FORMS_KEY=la-tua-chiave node tools/write-config.mjs
  python3 -m http.server 8000
  ```
  Per tornare allo stato pulito: `git checkout -- assets/config.js` dopo `git update-index --no-skip-worktree assets/config.js`.
- `node tools/check.mjs` segnala un errore se in `assets/config.js` c'è una chiave.
