#!/usr/bin/env node
/* Il controllo nel browser (A9, A10): un Chrome vero apre una pagina per tipo e, sul telefono e sul computer, controlla
   - nessuna intestazione Set-Cookie, niente in document.cookie, localStorage e sessionStorage;
   - nessuna richiesta fuori dal sito (A10: «nessuna richiesta ad altri domini»);
   - axe senza errori (WCAG 2.1 A e AA);
   - nessuno scorrimento orizzontale sul telefono;
   - le pagine di servizio (/scarica, /download/<id>) pesano pochi KB e non caricano né rilievo né video (B10).
     node scripts/check/browser.mjs                      su dist/ servito da qui (anteprima, CI)
     node scripts/check/browser.mjs --base=https://skimaps.cc   sul dominio vero (la prova del 25-11, da riportare nel DIARIO)
   Usa il Chrome del sistema (channel: 'chrome'); in CI c'è già. */
import { chromium } from 'playwright-core';
import AxeBuilder from '@axe-core/playwright';
import { serve } from './serve.mjs';

const arg = (k) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').slice(k.length + 3);
const REMOTE = arg('base');
const PAGES = [
  '/', '/it/', '/en/', '/de/', '/fr/', '/es/',
  '/it/come-funziona/', '/it/comprensori/', '/it/comprensori/dolomiti-superski/', '/it/comprensori/ovindoli/',
  '/it/chi-siamo/', '/it/aiuto/', '/it/fonti-e-licenze/', '/it/privacy/', '/it/elimina-account/', '/en/privacy/',
  '/en/how-it-works/', '/de/so-funktionierts/', '/fr/comment-ca-marche/', '/es/como-funciona/',
  '/scarica/', '/download/superski/', '/404.html',
];
const VIEWPORTS = [{ name: 'telefono', width: 390, height: 844 }, { name: 'computer', width: 1440, height: 900 }];

let local;
const base = REMOTE || (local = await serve()) && `http://127.0.0.1:${local.port}`;
const host = new URL(base).host;
const errors = [];
const browser = await chromium.launch({ channel: 'chrome' });

for (const vp of VIEWPORTS) {
  for (const path of PAGES) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, locale: path.startsWith('/de') ? 'de-DE' : 'it-IT' });
    const page = await ctx.newPage();
    const external = [], cookies = [];
    let bytes = 0;
    const urls = [];
    page.on('request', (r) => { const u = new URL(r.url()); if (u.protocol.startsWith('http') && u.host !== host) external.push(r.url()); urls.push(r.url()); });
    page.on('response', async (r) => {
      const h = r.headers();
      if (h['set-cookie']) cookies.push(r.url());
      try { bytes += (await r.body()).length; } catch { /* risposte senza corpo */ }
    });
    const where = `${vp.name} ${path}`;
    await page.goto(base + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    if (external.length) errors.push(`${where}: richieste fuori dal sito: ${[...new Set(external)].join(', ')}`);
    if (cookies.length) errors.push(`${where}: Set-Cookie da ${cookies.join(', ')}`);
    const store = await page.evaluate(() => ({ cookie: document.cookie, ls: localStorage.length, ss: sessionStorage.length, over: document.documentElement.scrollWidth - window.innerWidth }));
    if (store.cookie) errors.push(`${where}: document.cookie non vuoto`);
    if (store.ls || store.ss) errors.push(`${where}: localStorage o sessionStorage non vuoti`);
    if (vp.name === 'telefono' && store.over > 1) errors.push(`${where}: scorrimento orizzontale di ${store.over}px`);
    if (/^\/(scarica|download)\//.test(path)) {
      if (urls.some((u) => /\/relief\/|\.mp4|\.webm/.test(u))) errors.push(`${where}: carica rilievo o video`);
      if (bytes > 250 * 1024) errors.push(`${where}: pesa ${Math.round(bytes / 1024)} KB (le pagine del QR devono essere leggere)`);
    }
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    for (const v of axe.violations) errors.push(`${where}: axe ${v.id} (${v.impact}): ${v.help} · ${v.nodes.length} elementi, per esempio ${v.nodes[0].target.join(' ')}`);
    await ctx.close();
  }
}
await browser.close();
if (local) local.server.close();
if (errors.length) { console.error(errors.map((e) => 'ERRORE: ' + e).join('\n')); console.error(`\n${errors.length} errori.`); process.exit(1); }
console.log(`OK: ${PAGES.length} pagine su ${VIEWPORTS.length} schermi: niente cookie, niente richieste esterne, axe senza errori.`);
