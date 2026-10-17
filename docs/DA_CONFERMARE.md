# Domande aperte (prima erano segnaposto in pagina)

Fino al 15-10-2026 queste domande comparivano sul sito come `[DA CONFERMARE: …]`. Ora la pubblicazione si ferma se in pagina resta un segnaposto (`node tools/check.mjs --release` in `.github/workflows/pages.yml`), quindi le frasi non confermate sono state tolte e le domande stanno qui.
Quando una risposta arriva, si scrive la frase vera nella pagina e si toglie la domanda da questo elenco.

## Prima di Google Play (valgono già oggi)

- **Titolare del trattamento**: nome o ragione sociale, indirizzo e recapiti. Va scritto nello stesso giorno nell'app (`privacy.controller`, 5 lingue in `skimap-mobile`) e sul sito (`privacy.html`, `en/privacy.html`).
- **Base giuridica** di ogni trattamento: diagnostica (consenso), contributi automatici (segnalazioni, tempi di attesa e delle tappe: consenso o legittimo interesse?), email della lista d'attesa. Oggi non è scritta né nell'app né sul sito.
- **Lista d'attesa**: per quanto tempo si conserva l'email? Web3Forms (o Formspree) ne conserva una copia, per quanto tempo, con quale ruolo (responsabile del trattamento?) e dove ha sede?
- **Questo sito**: GitHub Pages conserva i log con l'indirizzo IP? Per quanto tempo?

## Account (versione 5 dell'informativa) — ONLINE dal 17-10-2026

**Fatto il 17-10:** informativa v5 su `privacy.html` e `en/privacy.html` (sezioni «L'account», «Le preferenze che seguono l'account», Brevo e Google fra i fornitori, conservazione 24 mesi, diritti), generata dai testi dell'app (`skimap-mobile`, chiavi `privacy.*`); `elimina-account.html` e `en/delete-account.html` riscritte per l'account (dall'app, senza l'app, cosa si cancella e cosa no). **Restano aperti:** il titolare (sul sito c'è la formula provvisoria «la persona raggiungibile all'indirizzo …»: va sostituita con nome e indirizzo, lo stesso giorno dell'app in `src/config/legal.ts`) e la base giuridica dei contributi automatici (`LEGALE_F1.md` §9b nel repo dati). L'elenco qui sotto è la storia delle domande: le risposte sono nell'informativa v5.

Le sezioni «L'account», «Accesso con Google» ed «Eliminare l'account» sono state tolte perché l'app di oggi (versione 4 dell'informativa) non ha un account. Il testo che c'era è nella cronologia: `git show fa7e04b:privacy.html` (e `en/privacy.html`, `elimina-account.html`, `en/delete-account.html`). Prima di rimetterlo servono queste risposte:

- L'account è facoltativo nella v1? Che cosa vuol dire «facoltativo»: si può usare l'app senza account? L'email si può non fornire? Quali funzioni chiedono di accedere?
- A che cosa serve l'account: quali funzioni abilita?
- ID utente ed email sono collegati a diagnostica, segnalazioni, tempi di attesa e tempi delle tappe, o restano separati? (L'informativa oggi dice che non sono collegati a te: se con l'account cambia, va corretta.) L'utenza anonima resta separata o si unisce all'account quando accedi?
- Accesso con Google: quali dati arrivano (solo email e ID, o anche nome e foto)? Chi gestisce l'accesso (Supabase?) e che ruolo ha Google (titolare autonomo?)? Ci sono altri fornitori, per esempio per le email dell'account?
- Base giuridica dei dati dell'account.
- Per quanto tempo si conservano ID ed email se l'account non viene usato? Entro quanti giorni si cancellano dopo la richiesta?
- Accesso, correzione e portabilità dei dati dell'account: come e in quanto tempo.
- Eliminazione: percorso esatto nell'app (per esempio Impostazioni → Account → Elimina account); conferma, password o nuovo accesso con Google; è immediata? Per email: come si verifica che l'account è tuo? Che cosa viene cancellato e che cosa resta (copie di sicurezza, obblighi di legge), per quanto tempo?
- Quando c'è l'account, Google Play chiede la cancellazione sia nell'app sia da un link web: `elimina-account.html` va riscritta per l'account e indicata nella scheda «Sicurezza dei dati».
