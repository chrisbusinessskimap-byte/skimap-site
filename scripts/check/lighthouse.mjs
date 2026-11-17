#!/usr/bin/env node
/* Lighthouse come lo definisce A9: profilo telefono di Lighthouse, mediana di 3 prove, ≥ 95 in tutte e quattro le categorie, su una pagina
   per tipo in italiano più la home nelle altre quattro lingue. In laboratorio, al posto dei «Core Web Vitals verdi»:
   disegno del contenuto principale (LCP) ≤ 2,5 s, spostamento del layout (CLS) ≤ 0,1, tempo di blocco (TBT) ≤ 200 ms.
   I dati veri (28 giorni di visite) non esistono il 26-11: si guardano a fine dicembre.
     node scripts/check/lighthouse.mjs                       su dist/ servito da qui
     node scripts/check/lighthouse.mjs --base=https://…      su un indirizzo (anteprima o dominio vero)
     --preview    salta il controllo «la pagina si può indicizzare»: le anteprime di Cloudflare Pages rispondono con noindex,
                  e la categoria SEO si misura sul dominio vero dopo il cambio (A9) */
import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';
import { serve } from './serve.mjs';

const arg = (k) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').slice(k.length + 3);
const PREVIEW = process.argv.includes('--preview');
const RUNS = +(arg('runs') || 3);
const PAGES = [
  '/it/', '/en/', '/de/', '/fr/', '/es/',
  '/it/come-funziona/', '/it/comprensori/', '/it/comprensori/dolomiti-superski/', '/it/chi-siamo/', '/it/aiuto/', '/it/fonti-e-licenze/', '/it/privacy/',
  '/scarica/', '/download/superski/',
];
const median = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];

let local;
const base = arg('base') || ((local = await serve()) && `http://127.0.0.1:${local.port}`);
const chrome = await launch({ chromePath: process.env.CHROME_PATH, chromeFlags: ['--headless=new', '--no-sandbox'] });
const errors = [];
const rows = [];
for (const path of PAGES) {
  const runs = [];
  for (let i = 0; i < RUNS; i++) {
    const r = await lighthouse(base + path, { port: chrome.port, logLevel: 'error', output: 'json', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'] });
    runs.push(r.lhr);
  }
  const cat = (k) => Math.round(median(runs.map((l) => l.categories[k].score ?? 0)) * 100);
  const aud = (k) => median(runs.map((l) => l.audits[k].numericValue ?? 0));
  const row = { path, perf: cat('performance'), a11y: cat('accessibility'), bp: cat('best-practices'), seo: cat('seo'), lcp: Math.round(aud('largest-contentful-paint')), cls: +aud('cumulative-layout-shift').toFixed(3), tbt: Math.round(aud('total-blocking-time')) };
  rows.push(row);
  for (const [k, label] of [['perf', 'prestazioni'], ['a11y', 'accessibilità'], ['bp', 'buone pratiche'], ['seo', 'SEO']]) {
    if (row[k] < 95) {
      /* sulle pagine di servizio (noindex di proposito) e sulle anteprime il controllo di indicizzazione non si può passare */
      const noindex = /^\/(scarica|download)\//.test(path) || PREVIEW;
      if (k === 'seo' && noindex) continue;
      errors.push(`${path}: ${label} ${row[k]} (< 95)`);
    }
  }
  if (row.lcp > 2500) errors.push(`${path}: LCP ${row.lcp} ms (> 2500)`);
  if (row.cls > 0.1) errors.push(`${path}: CLS ${row.cls} (> 0,1)`);
  if (row.tbt > 200) errors.push(`${path}: TBT ${row.tbt} ms (> 200)`);
}
await chrome.kill();
if (local) local.server.close();
console.table(rows);
if (errors.length) { console.error(errors.map((e) => 'ERRORE: ' + e).join('\n')); process.exit(1); }
console.log(`OK: Lighthouse, mediana di ${RUNS} prove, tutte le categorie ≥ 95 su ${PAGES.length} pagine.`);
