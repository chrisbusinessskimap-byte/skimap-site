#!/usr/bin/env node
/* Scrive assets/config.js leggendo la chiave dall'ambiente. La chiave non sta mai nel repo.
     WEB3FORMS_KEY=... node tools/write-config.mjs
     FORMSPREE_URL=https://formspree.io/f/xxxx node tools/write-config.mjs
   In pubblicazione lo esegue il workflow (.github/workflows/pages.yml) con i secret di GitHub.
   In locale: prima `git update-index --skip-worktree assets/config.js`, così non finisce in un commit. */
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const web3formsKey = (process.env.WEB3FORMS_KEY || '').trim();
const formspreeUrl = (process.env.FORMSPREE_URL || '').trim();
if (web3formsKey && !/^[A-Za-z0-9-]{8,64}$/.test(web3formsKey)) { console.error('WEB3FORMS_KEY non sembra una chiave valida'); process.exit(1); }
if (formspreeUrl && !/^https:\/\/formspree\.io\/f\/[A-Za-z0-9]+$/.test(formspreeUrl)) { console.error('FORMSPREE_URL non sembra un URL Formspree valido'); process.exit(1); }
const out = resolve(dirname(new URL(import.meta.url).pathname), '..', 'assets', 'config.js');
writeFileSync(out, `/* Generato da tools/write-config.mjs: non modificare e non committare. */\nwindow.SKIMAP_CONFIG = ${JSON.stringify({ web3formsKey, formspreeUrl })};\n`);
console.log(web3formsKey ? 'config.js: Web3Forms attivo' : formspreeUrl ? 'config.js: Formspree attivo' : 'config.js: nessun servizio (il modulo apre il programma di posta)');
