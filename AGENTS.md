# AGENTS.md

Le regole del progetto stanno in `CLAUDE.md` (nel repo `skimap-data`, `../skimap-data/CLAUDE.md`): leggilo sempre per primo. Questo file ne riprende solo l'essenziale per gli strumenti che non leggono `CLAUDE.md`. Claude Code legge `CLAUDE.md`; GitHub Copilot legge anche `.github/copilot-instructions.md`.

## Regole
1. Un solo agente per branch alla volta. Non toccare branch su cui sta lavorando l'altro strumento.
2. Mai `git push`, mai pubblicazione su R2, mai modifica a chiavi/keystore/`gradle.properties`: lo fa Christian.
3. Non cambiare `CONSENT_VERSION`, informativa o testi legali senza chiedere.
4. Non dichiarare "provato sul telefono" ciò che non lo è: scrivilo sotto "Non verificato".
5. Task fuori dal tuo perimetro (tabella sotto): fermati e segnalalo nel diario.

## I modelli: chi scrive e chi rilegge
Regola di base: **un ramo, un worktree, uno strumento che scrive**. Gli altri leggono e lasciano note.

| Modello | Ruolo | Su cosa | Dove |
|---|---|---|---|
| **Fable 5.2** (Claude Code) | Progettista e revisore. **Non scrive codice** | Disegno e revisione dei blocchi costosi da sbagliare: piano dell'inventario di P17, disegno di P26, soglie di P27, macchina a stati di P28; il diff di P13a e di P18 prima dell'unione | PC1. Per i blocchi di PC2 legge il documento di disegno o il ramo, quando è stato spinto con l'ok di Christian |
| **Opus 5.5** (Claude Code) | Esecutore principale | I blocchi con logica delicata: P13, P14, P17, P18, P26, P27, P28, i residui della fase 1 | PC1 e PC2 |
| **Sonnet 5.5** (Claude Code) | Esecutore dei blocchi ben specificati | P15, P16, P29, la costruzione del sito (P30), le regole comuni degli strumenti, lavori di pulizia | PC1 e PC2 |
| **GitHub Copilot** (VS Code) | Aiuto nell'editor | Completamenti e piccole modifiche sul ramo aperto; revisione di una PR | PC1, solo su un ramo dove Claude Code **non** sta scrivendo |
| **GPT** (dentro Copilot, modalità Ask) | Secondo parere, sola lettura | Diff di `dijkstra` e `navFlow`, migrazioni e RLS, le 5 lingue prima di ogni unione che tocca i cataloghi | PC1 |
