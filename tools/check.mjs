#!/usr/bin/env node
/* Verifica locale del sito statico (nessuna dipendenza): `node tools/check.mjs`
   --list      elenca tutti i segnaposto [DA CONFERMARE] con la domanda
   --release   i segnaposto rimasti diventano errori
   Controlla: file e ancore dei link interni, id duplicati, meta tag, risorse esterne, vecchio nome,
   parole vietate, parità tra le lingue, segnaposto, sintassi JS, chiavi nel repo. Esce con 1 se trova errori. */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { execSync } from 'node:child_process';
import { ALL_FILES, LANGS, LANG_ORDER, PAGE_KEYS, LEGAL, fileOf } from './site.mjs';

const root = resolve(dirname(new URL(import.meta.url).pathname), '..');
const RELEASE = process.argv.includes('--release'), LIST = process.argv.includes('--list');
const errors = [], warns = [];
const err = (m) => errors.push(m), warn = (m) => warns.push(m);
const read = (p) => readFileSync(join(root, p), 'utf8');
const idsOf = (h) => [...h.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const cache = {};
const idsFile = (rel) => (cache[rel] ||= new Set(idsOf(readFileSync(join(root, rel), 'utf8'))));

/* "/aree/" → aree/index.html; "privacy.html" relativo alla pagina; null se non è un file del sito */
function target(page, href) {
  let f = href.startsWith('/') ? join(root, href) : resolve(root, dirname(page), href);
  if (href.endsWith('/') || (existsSync(f) && statSync(f).isDirectory())) f = join(f, 'index.html');
  return f;
}

for (const p of ALL_FILES) {
  if (!existsSync(join(root, p))) { err(`manca ${p}`); continue; }
  const h = read(p);
  const list = idsOf(h);
  for (const d of list.filter((x, i) => list.indexOf(x) !== i)) err(`${p}: id duplicato ${d}`);
  if (/SkiMap/.test(h)) err(`${p}: contiene ancora "SkiMap"`);
  if (/\bSlopes\b/.test(h)) err(`${p}: contiene la parola "Slopes"`);
  const text = h.replace(/<script[\s\S]*?<\/script>/g, '');
  if (!LEGAL.some((x) => x.file === p) && /\b(grafo|routing|algoritm\w*)\b/i.test(text)) err(`${p}: gergo tecnico (grafo, routing, algoritmo) nel testo`);
  if (!/<html lang="(it|en|de)"/.test(h)) err(`${p}: manca lang`);
  for (const t of ['<title>', 'name="description"', 'rel="canonical"', 'hreflang="it"', 'hreflang="en"', 'property="og:title"', 'property="og:image"', 'name="twitter:card"', 'rel="icon"']) if (!h.includes(t)) err(`${p}: manca ${t}`);
  for (const m of h.matchAll(/<(?:script|link|img|source|iframe)\b[^>]*?(?:src|href)="(https?:)?\/\/[^"]+"[^>]*>/g)) {
    if (/rel="(canonical|alternate)"/.test(m[0])) continue;
    err(`${p}: risorsa esterna ${m[0].slice(0, 100)}`);
  }
  if (/fonts\.googleapis|fonts\.gstatic|cdnjs/.test(h)) err(`${p}: riferimento a font/CDN esterni`);
  for (const m of h.matchAll(/<img\b[^>]*>/g)) if (!/\balt=/.test(m[0])) err(`${p}: <img> senza alt`);
  for (const m of h.matchAll(/(?:href|src)="([^"#]*)(#[^"]*)?"/g)) {
    const [, href, frag] = m;
    if (/^(https?:|mailto:|tel:|data:)/.test(href)) continue;
    if (!href) { /* ancora nella stessa pagina */
      if (frag && frag.length > 1 && !list.includes(frag.slice(1))) err(`${p}: ancora locale ${frag} non esiste`);
      continue;
    }
    const f = target(p, href);
    if (!existsSync(f)) { err(`${p}: link rotto ${href}`); continue; }
    if (frag && frag.length > 1 && f.endsWith('.html') && !idsFile(relative(root, f)).has(frag.slice(1))) err(`${p}: ancora ${href}${frag} non esiste`);
  }
  if (/\[SCREENSHOT/.test(h)) err(`${p}: segnaposto [SCREENSHOT] in pagina`);
  const todo = (h.match(/\[DA CONFERMARE/g) || []).length;
  if (todo) { if (RELEASE) err(`${p}: ${todo} segnaposto [DA CONFERMARE] ancora da risolvere`); else warn(`${p}: ${todo} segnaposto [DA CONFERMARE]`); }
  if (LIST) for (const m of h.matchAll(/\[DA CONFERMARE: ([^\]]*)\]/g)) console.log(`${p}\t${m[1].replace(/<[^>]+>/g, '')}`);
}

/* parità tra le lingue: stesse sezioni e stessi segnaposto in ogni pagina generata */
for (const k of PAGE_KEYS) {
  const sig = (l) => { const h = read(fileOf(LANGS[l].pages[k])); return [...h.matchAll(/<section\b[^>]*\sid="([^"]+)"/g)].map((m) => m[1]).join(',') + ' / ' + (h.match(/\[DA CONFERMARE/g) || []).length; };
  const ref = sig('it');
  for (const l of LANG_ORDER.slice(1)) if (sig(l) !== ref) err(`${fileOf(LANGS[l].pages[k])}: sezioni o segnaposto diversi dall'italiano (${sig(l)} vs ${ref})`);
}
for (const { file, pair } of LEGAL.filter((x) => x.lang === 'it')) {
  const cnt = (p) => [(read(p).match(/<h3/g) || []).length, (read(p).match(/\[DA CONFERMARE/g) || []).length].join('/');
  if (cnt(file) !== cnt(pair)) err(`${file} e ${pair} hanno sezioni o segnaposto diversi (${cnt(file)} vs ${cnt(pair)})`);
}
for (const f of readdirSync(join(root, 'assets')).filter((n) => n.endsWith('.js'))) {
  try { execSync(`node --check ${JSON.stringify(join(root, 'assets', f))}`, { stdio: 'pipe' }); } catch (e) { err(`assets/${f}: errore di sintassi`); }
}
const cfg = read('assets/config.js');
if (/(web3formsKey|formspreeUrl)\s*:\s*"[^"]+"/.test(cfg)) err('assets/config.js contiene una chiave: va tolta dal repo');

console.log(warns.map((w) => 'avviso: ' + w).join('\n'));
if (errors.length) { console.error(errors.map((e) => 'ERRORE: ' + e).join('\n')); process.exit(1); }
console.log(`OK: ${ALL_FILES.length} pagine controllate, nessun errore.`);
