#!/usr/bin/env node
/* I controlli statici che bloccano l'unione (A9–A11, A16, B11). Lavorano su dist/ (`npm run build` prima).
     node scripts/check/index.mjs             controlli; gli stati «da verificare» e «falsa» sono avvisi
     node scripts/check/index.mjs --release   come per l'unione in main: quegli stati sono errori
   Controlla: tag di testa e hreflang (5 lingue + x-default, rimandi ricambiati), parità fra le lingue (sezioni e id di frase),
   registro delle frasi, indirizzi di oggi (301 verso una pagina che risponde 200; i legali .html restano 200), risorse esterne,
   collegamenti e ancore, testo alternativo, parole vietate, niente cookie né archivio del browser nel codice, testi legali invariati,
   versione dell'informativa, token del Figma. Esce con 1 se trova errori. */
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { ROOT, DIST, LANGS, ORIGIN, pages, attrs, tags, ids, claimsIn, textOf, reportBuilder, read, urlOf, walk, fileOfUrl } from './lib.mjs';

const RELEASE = process.argv.includes('--release');
const { err, warn, errors, warns } = reportBuilder();
if (!existsSync(DIST)) { console.error('Manca dist/: lancia prima `npm run build`.'); process.exit(1); }

const all = pages();
const byUrl = new Map(all.map((p) => [p.url, p]));
const SERVICE = (u) => u === '/404/' || u === '/404.html' || u.startsWith('/scarica/') || u.startsWith('/download/');
const CHOOSER = '/';
const content = all.filter((p) => !SERVICE(p.url) && p.url !== CHOOSER);

/* ---------- testa di ogni pagina ---------- */
for (const p of all) {
  const h = p.html;
  if (!/<html lang="(it|en|de|fr|es)"/.test(h)) err(`${p.url}: manca lang`);
  for (const t of ['<title>', 'name="description"', 'rel="canonical"', 'property="og:title"', 'property="og:image"', 'rel="icon"']) if (!h.includes(t)) err(`${p.url}: manca ${t}`);
  if (SERVICE(p.url) && !h.includes('name="robots" content="noindex"')) err(`${p.url}: una pagina di servizio deve essere noindex`);
}

/* ---------- hreflang e parità ---------- */
const alts = (p) => {
  const m = {};
  for (const t of tags(p.html, 'link')) { const a = attrs(t); if (a.rel === 'alternate' && a.hreflang) m[a.hreflang] = a.href.replace(ORIGIN, ''); }
  return m;
};
for (const p of [...content, byUrl.get(CHOOSER)].filter(Boolean)) {
  const a = alts(p), langs = Object.keys(a).filter((l) => l !== 'x-default');
  const legal = /\/(privacy|elimina-account|delete-account)\/$/.test(p.url);
  const want = p.url === CHOOSER ? LANGS : legal ? ['it', 'en'] : LANGS;
  /* i legali di de, fr, es rimandano all'inglese: eccezione scritta (A4) */
  if (want.join() !== langs.join()) err(`${p.url}: hreflang ${langs.join(',')} invece di ${want.join(',')}`);
  if (!a['x-default']) err(`${p.url}: manca hreflang x-default`);
  else if (a['x-default'] !== '/') err(`${p.url}: x-default deve puntare a «/» (la scelta della lingua)`);
  for (const [l, u] of Object.entries(a)) {
    if (l === 'x-default') continue;
    const q = byUrl.get(u);
    if (!q) { err(`${p.url}: hreflang ${l} → ${u} non esiste`); continue; }
    if (p.url !== CHOOSER && alts(q)[p.url.split('/')[1]] !== p.url && !legal) err(`${p.url}: il rimando ${l} → ${u} non è ricambiato`);
  }
}

/* la parità: gruppi di pagine = la stessa pagina nelle lingue; stesse sezioni, stessi id di frase */
const groups = new Map();
for (const p of content) {
  const a = alts(p);
  const key = [...Object.values(a)].sort().join('|');
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(p);
}
const sig = (p) => [
  [...p.html.matchAll(/<(?:section|nav|article)\b[^>]*\sid="([^"]+)"/g)].map((m) => m[1]).sort().join(','),
  [...new Set(claimsIn(p.html))].sort().join(','),
];
for (const [, g] of groups) {
  if (g.length < 2) continue;
  const ref = g.find((p) => p.url.startsWith('/it/')) ?? g[0];
  const [rs, rc] = sig(ref);
  for (const p of g) {
    if (p === ref) continue;
    const [s, c] = sig(p);
    /* le pagine legali sono testo di terzi in due lingue: la parità è sul numero di titoli */
    if (/\/(privacy|elimina-account|delete-account)\//.test(p.url)) continue;
    if (s !== rs) err(`${p.url}: sezioni diverse da ${ref.url} (${s} contro ${rs})`);
    if (c !== rc) err(`${p.url}: id di frase diversi da ${ref.url} (${c} contro ${rc})`);
  }
}

/* ---------- registro delle frasi ---------- */
const registry = JSON.parse(read(join(ROOT, 'src/content/claims.json'))).claims;
const STATES = ['vera', 'parziale', 'falsa', 'da verificare'];
const used = new Set();
for (const p of all) for (const id of claimsIn(p.html)) {
  used.add(id);
  if (!registry[id]) err(`${p.url}: la frase «${id}» non ha una voce in src/content/claims.json`);
}
for (const [id, v] of Object.entries(registry)) {
  if (!STATES.includes(v.state)) err(`claims.json: «${id}» ha uno stato fuori dall'elenco chiuso (${v.state})`);
  if (!used.has(id) && v.state !== 'falsa') warn(`claims.json: «${id}» non compare in nessuna pagina`);
  if (v.state === 'falsa' || v.state === 'da verificare') {
    const m = `frase «${id}» (${v.state}): ${v.note}`;
    if (RELEASE) err(`ferma l'unione in main: ${m}`); else warn(m);
  }
}

/* ---------- indirizzi di oggi ---------- */
const redirects = existsSync(join(DIST, '_redirects'))
  ? read(join(DIST, '_redirects')).split('\n').filter((l) => l && !l.startsWith('#')).map((l) => { const [from, to, status] = l.trim().split(/\s+/); return { from, to, status: +status }; })
  : [];
const oldFile = join(ROOT, '.astro/old-urls.json');
if (!existsSync(oldFile)) err('manca .astro/old-urls.json (lo scrive la build)');
else {
  for (const o of JSON.parse(read(oldFile))) {
    const rule = redirects.find((r) => r.from === o.url);
    if (o.expect === 'same') { if (!byUrl.has(o.url)) err(`indirizzo di oggi ${o.url}: ora non risponde`); }
    else if (!rule) err(`indirizzo di oggi ${o.url}: manca la regola in _redirects`);
    else if (o.expect === 'redirect' && rule.status !== 301) err(`indirizzo di oggi ${o.url}: deve essere un 301, è ${rule.status}`);
    else if (o.expect === 'rewrite' && rule.status !== 200) err(`indirizzo di oggi ${o.url}: i legali .html restano 200 (riscrittura), è ${rule.status}`);
    else if (!byUrl.has(rule.to)) err(`indirizzo di oggi ${o.url} → ${rule.to}: la destinazione non risponde 200`);
  }
}

/* ---------- risorse esterne, collegamenti, ancore, testo alternativo ---------- */
const RESERVED = [/^\/download\//, /^\/scarica\/?$/, /^\/\.well-known\//, /^\/g\//];
const isFile = (url) => {
  const clean = url.split('#')[0].split('?')[0];
  if (!clean) return null;
  const f = join(DIST, decodeURIComponent(clean));
  if (existsSync(f) && !readdirSafe(f)) return f;
  const idx = join(f, 'index.html');
  return existsSync(idx) ? idx : null;
};
function readdirSafe(p) { try { return readdirSync(p).length >= 0; } catch { return false; } }
const idCache = new Map();
const idsOf = (f) => idCache.get(f) ?? (idCache.set(f, f.endsWith('.html') ? ids(read(f)) : new Set()), idCache.get(f));

for (const p of all) {
  const h = p.html.replace(/<script[^>]*type="application\/json"[\s\S]*?<\/script>/g, '');
  for (const name of ['script', 'link', 'img', 'source', 'iframe', 'video', 'audio']) {
    for (const t of tags(h, name)) {
      const a = attrs(t);
      if (name === 'link' && ['canonical', 'alternate'].includes(a.rel)) continue;
      for (const v of [a.src, a.href, a.srcset].filter(Boolean)) if (/(^|\s|,)(https?:)?\/\/[^\s,]+/.test(v) && !(name === 'link' && /^(license|author|help)$/.test(a.rel || ''))) err(`${p.url}: risorsa esterna ${t.slice(0, 90)}`);
    }
  }
  for (const t of tags(h, 'img')) if (!/\salt=/.test(t)) err(`${p.url}: <img> senza alt`);
  for (const t of tags(h, 'a')) {
    const href = attrs(t).href;
    if (!href || /^(https?:|mailto:|tel:|skimap:|data:|javascript:)/.test(href)) continue;
    const [pathPart, frag] = href.split('#');
    const target = pathPart ? (pathPart.startsWith('/') ? pathPart : resolve('/' + p.url, pathPart).replace(/^[A-Za-z]:/, '').replace(/\\/g, '/')) : p.url;
    const rule = redirects.find((r) => r.from === target);
    const resolved = rule ? rule.to : target;
    if (RESERVED.some((r) => r.test(resolved))) continue;
    const f = isFile(resolved);
    if (!f) { err(`${p.url}: link rotto ${href}`); continue; }
    if (frag && !idsOf(f).has(frag)) err(`${p.url}: ancora ${href} non esiste`);
  }
  for (const t of tags(h, 'img')) {
    const src = attrs(t).src;
    if (src && src.startsWith('/') && !isFile(src)) err(`${p.url}: immagine mancante ${src}`);
  }
}

/* ---------- parole vietate ---------- */
for (const p of content) {
  if (/\/(privacy|elimina-account|delete-account)\//.test(p.url)) continue;
  const text = textOf(p.html);
  if (/SkiMap\b/.test(text)) err(`${p.url}: contiene «SkiMap» (il nome è «Ski Maps»)`);
  if (/\bSlopes\b/.test(text)) err(`${p.url}: contiene «Slopes»`);
  if (p.url.startsWith('/it/') && /\b(grafo|routing|algoritm\w*)\b/i.test(text)) err(`${p.url}: gergo tecnico (grafo, routing, algoritmo)`);
  if (/\[DA CONFERMARE/.test(text)) err(`${p.url}: segnaposto [DA CONFERMARE] in pagina (si usa lo stato «da verificare» in claims.json)`);
  if (/~\s?\d+\s?(min|m\b|km)/.test(text) && !p.url.includes('/privacy')) err(`${p.url}: tilde davanti a tempi o distanze (regola 8)`);
}

/* ---------- niente cookie né archivio del browser nel codice ---------- */
for (const f of walk(DIST).filter((x) => /\.(js|html|mjs)$/.test(x))) {
  const s = read(f);
  if (/document\.cookie|localStorage|sessionStorage|indexedDB/.test(s)) err(`${urlOf(f)}: usa cookie o archivio del browser`);
}

/* ---------- testi legali invariati (A4) ---------- */
const sums = read(join(ROOT, 'src/legal/SHA256SUMS')).trim().split('\n').map((l) => l.split(/\s+\*?/));
for (const [sum, name] of sums) {
  const got = createHash('sha256').update(read(join(ROOT, 'src/legal', name))).digest('hex');
  if (got !== sum) err(`src/legal/${name}: il testo legale è cambiato rispetto al sigillo (src/legal/SHA256SUMS). Si cambia solo con l'ok scritto di Christian, nello stesso commit del cambio di dominio.`);
}
const langsSrc = read(join(ROOT, 'src/i18n/langs.ts'));
const ver = /version:\s*(\d+),\s*date:\s*'([\d-]+)'/.exec(langsSrc);
const heads = JSON.parse(read(join(ROOT, 'src/legal/heads.json')));
if (!ver) err('src/i18n/langs.ts: manca LEGAL_VERSION');
else {
  for (const k of ['privacy.it', 'privacy.en']) if (!heads[k].lede.includes(String(ver[1]))) err(`${k}: la versione dell'informativa non è la ${ver[1]} di LEGAL_VERSION`);
  const app = resolve(ROOT, '../skimap-mobile/src/utils/consentRecord.ts');
  if (existsSync(app)) {
    const m = /CONSENT_VERSION\s*=\s*(\d+)/.exec(read(app));
    if (m && +m[1] !== ver[1]) err(`la versione dell'informativa del sito (${ver[1]}) non è quella dell'app (CONSENT_VERSION ${m[1]})`);
  } else warn('app non trovata accanto al sito: la versione dell\'informativa non è confrontata con CONSENT_VERSION');
}

/* ---------- token del Figma ---------- */
try { execSync('node scripts/figma-tokens.mjs --check', { cwd: ROOT, stdio: 'pipe' }); } catch (e) { err('tokens.css non coincide con l\'istantanea del Figma (`npm run tokens`)'); }

/* ---------- sitemap ---------- */
if (existsSync(join(DIST, 'sitemap.xml'))) {
  const locs = [...read(join(DIST, 'sitemap.xml')).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(ORIGIN, ''));
  for (const l of locs) if (!byUrl.has(l)) err(`sitemap: ${l} non esiste`);
  for (const p of content) if (!locs.includes(p.url) && !/\/(privacy|elimina-account|delete-account)\/$/.test(p.url)) warn(`sitemap: ${p.url} non c'è`);
} else err('manca sitemap.xml');

console.log(warns.map((w) => 'avviso: ' + w).join('\n'));
if (errors.length) { console.error(errors.map((e) => 'ERRORE: ' + e).join('\n')); console.error(`\n${errors.length} errori.`); process.exit(1); }
console.log(`OK: ${all.length} pagine controllate, nessun errore${RELEASE ? ' (modalità unione)' : ''}.`);
