---
description: Controllo delle traduzioni nuove o cambiate (IT contro EN, DE, FR, ES)
agent: ask
---

Sola lettura. Confronta i testi nuovi o cambiati in `src/i18n/ui.*.json` e in `src/content/pages/<lingua>/` fra l'italiano
(lingua di partenza) e inglese, tedesco, francese, spagnolo. Segnala solo:

- senso diverso o contrario, tono diverso;
- una frase **«parziale»** o **«da verificare»** che in un'altra lingua diventa una promessa piena (è il rischio più grave);
- testo oltre 1,3 volte l'italiano in un pulsante o in una voce di menu;
- segnaposti o id di frase mancanti.

Le frasi-promessa hanno un id (`data-claim="…"` nel contenuto, voce in `src/content/claims.json`): si traducono **alla lettera**,
e sono le prime che controlli. Quello che non c'è nell'italiano non va aggiunto in un'altra lingua.
I nomi di comprensori, piste e impianti non si traducono. Le pagine legali di tedesco, francese e spagnolo rimandano a quelle inglesi (eccezione scritta
in `scripts/check/parity.mjs`): non controllarle.

Tabella: chiave o id, lingua, problema, proposta.
