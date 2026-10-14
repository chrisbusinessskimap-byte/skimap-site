#!/usr/bin/env node
/* Verifica locale del sito statico (nessuna dipendenza): `node tools/check.mjs`
   --list      elenca tutti i segnaposto [DA CONFERMARE] con la domanda
   --release   i segnaposto rimasti diventano errori (da usare prima di pubblicare)
   Controlla: file e ancore dei link interni, risorse esterne, vecchio nome, parità IT/EN,
   segnaposto [DA CONFERMARE], sintassi JS, chiavi nel repo. Esce con codice 1 se trova errori. */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { execSync } from 'node:child_process';

const root = resolve(dirname(new URL(import.meta.url).pathname), '..');
const PAGES = ['index.html', 'privacy.html', 'elimina-account.html', 'en/index.html', 'en/privacy.html', 'en/delete-account.html'];
const RELEASE = process.argv.includes('--release'), LIST = process.argv.includes('--list');
const errors = [], warns = [];
const err = (m) => errors.push(m), warn = (m) => warns.push(m);
const read = (p) => readFileSync(join(root, p), 'utf8');

const ids = {}, hashRoutes = ['home', 'giro', 'come-funziona', 'funzioni', 'fiducia', 'dove', 'domande', 'avvisami', 'pensata', 'mondo', 'pilot', 'motore', 'beta'];
for (const p of PAGES) {
  if (!existsSync(join(root, p))) { err(`manca ${p}`); continue; }
  const h = read(p);
  const idList = [...h.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  ids[p] = new Set(idList);
  for (const d of idList.filter((x, i) => idList.indexOf(x) !== i)) err(`${p}: id duplicato ${d}`);
  if (/SkiMap/.test(h)) err(`${p}: contiene ancora "SkiMap"`);
  if (/\bSlopes\b/.test(h)) err(`${p}: contiene la parola "Slopes"`);
  if (/(index\.html|^)$/.test(p) && /\b(grafo|routing|algoritmo)\b/i.test(h.replace(/<script[\s\S]*?<\/script>/g, ''))) err(`${p}: gergo tecnico (grafo, routing, algoritmo) nel testo`);
  if (!/<html lang="(it|en)"/.test(h)) err(`${p}: manca lang`);
  for (const t of ['<title>', 'name="description"', 'rel="canonical"', 'hreflang="it"', 'hreflang="en"', 'property="og:title"', 'property="og:image"', 'name="twitter:card"', 'rel="icon"']) if (!h.includes(t)) err(`${p}: manca ${t}`);
  // risorse esterne (script, css, font, immagini): non ne servono
  for (const m of h.matchAll(/<(?:script|link|img|source|iframe)\b[^>]*?(?:src|href)="(https?:)?\/\/[^"]+"[^>]*>/g)) {
    if (/rel="(canonical|alternate)"/.test(m[0])) continue;
    err(`${p}: risorsa esterna ${m[0].slice(0, 100)}`);
  }
  if (/fonts\.googleapis|fonts\.gstatic|cdnjs/.test(h)) err(`${p}: riferimento a font/CDN esterni`);
  // alt delle immagini
  for (const m of h.matchAll(/<img\b[^>]*>/g)) if (!/\balt=/.test(m[0])) err(`${p}: <img> senza alt`);
  // link interni
  for (const m of h.matchAll(/(?:href|src)="([^"#]+)(#[^"]*)?"/g)) {
    const [ , target, frag ] = m;
    if (/^(https?:|mailto:|tel:|data:)/.test(target)) continue;
    const f = resolve(root, dirname(p), target);
    if (!existsSync(f)) { err(`${p}: link rotto ${target}`); continue; }
    if (frag && f.endsWith('.html')) {
      const rel = relative(root, f);
      if (!ids[rel]) ids[rel] = new Set([...readFileSync(f, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((x) => x[1]));
      const id = frag.slice(1);
      if (!ids[rel].has(id) && !(rel.endsWith('index.html') && hashRoutes.includes(id))) err(`${p}: ancora ${target}${frag} non esiste`);
    }
  }
  for (const m of h.matchAll(/href="#([^"]+)"/g)) {
    const id = m[1];
    if (!ids[p].has(id) && !(p.endsWith('index.html') && hashRoutes.includes(id))) err(`${p}: ancora locale #${id} non esiste`);
  }
  const todo = (h.match(/\[DA CONFERMARE/g) || []).length;
  if (todo) { if (RELEASE) err(`${p}: ${todo} segnaposto [DA CONFERMARE] ancora da risolvere`); else warn(`${p}: ${todo} segnaposto [DA CONFERMARE]`); }
  if (LIST) for (const m of h.matchAll(/\[DA CONFERMARE: ([^\]]*)\]/g)) console.log(`${p}\t${m[1].replace(/<[^>]+>/g, '')}`);
}
// parità IT/EN: stesse sezioni, stesse ancore
const sec = (p) => [...read(p).matchAll(/<section class="view[^"]*" id="([^"]+)"/g)].map((m) => m[1]).join(',');
if (sec('index.html') !== sec('en/index.html')) err('sezioni diverse tra index.html e en/index.html');
for (const [a, b] of [['privacy.html', 'en/privacy.html'], ['elimina-account.html', 'en/delete-account.html']]) {
  const cnt = (p) => [(read(p).match(/<h3/g) || []).length, (read(p).match(/\[DA CONFERMARE/g) || []).length].join('/');
  if (cnt(a) !== cnt(b)) err(`${a} e ${b} hanno sezioni o segnaposto diversi (${cnt(a)} vs ${cnt(b)})`);
}
// JS
for (const f of readdirSync(join(root, 'assets')).filter((n) => n.endsWith('.js'))) {
  try { execSync(`node --check ${JSON.stringify(join(root, 'assets', f))}`, { stdio: 'pipe' }); } catch (e) { err(`assets/${f}: errore di sintassi`); }
}
// la configurazione del modulo deve restare vuota nel repo
const cfg = read('assets/config.js');
if (/(web3formsKey|formspreeUrl)\s*:\s*"[^"]+"/.test(cfg)) err('assets/config.js contiene una chiave: va tolta dal repo');
// mailto: nessun mailto dentro i moduli
console.log(warns.map((w) => 'avviso: ' + w).join('\n'));
if (errors.length) { console.error(errors.map((e) => 'ERRORE: ' + e).join('\n')); process.exit(1); }
console.log(`OK: ${PAGES.length} pagine controllate, nessun errore.`);
