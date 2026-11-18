#!/usr/bin/env node
/* Il selettore dell'ora cambia DAVVERO lo scenario: per ogni ora (alba, mezzogiorno, tramonto, notte) una sola immagine è visibile, copre tutta l'apertura e
   il colore medio dell'apertura è diverso dalle altre ore. Nata dal difetto del 18-11: le immagini aggiunte dallo script restavano senza stile e l'alba copriva sempre tutto.
   node scripts/check/hours.mjs [--base=https://…] [--shots=cartella] */
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import fs from 'node:fs';
import { serve } from './serve.mjs';

const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const local = arg('base') ? null : await serve();
const base = arg('base') || `http://127.0.0.1:${local.port}`;
const shots = arg('shots');
if (shots) fs.mkdirSync(shots, { recursive: true });
const HOURS = ['alba', 'mezzogiorno', 'tramonto', 'notte'];
const browser = await chromium.launch({ channel: 'chrome' });
let bad = 0;
for (const [label, vp] of [['computer', { width: 1280, height: 800 }], ['telefono', { width: 412, height: 823 }]]) {
  const page = await browser.newPage({ viewport: vp });
  await page.goto(`${base}/it/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => scrollTo(0, 0));
  const means = {}, side = {}, lum = {};
  for (const h of HOURS) {
    await page.click(`[data-picker] button[data-hour="${h}"]`);
    await page.waitForFunction((hh) => { const i = document.querySelector(`[data-layer="${hh}"] img`); return i && i.complete && i.naturalWidth > 0; }, h);
    await page.waitForTimeout(1100); // la dissolvenza dura 0,7 s
    await page.evaluate(() => scrollTo(0, 0)); // il clic sul selettore fa scorrere la pagina: la foto si fa dall'alto
    await page.waitForTimeout(150);
    const st = await page.evaluate(() => {
      const hero = document.querySelector('[data-hero]').getBoundingClientRect();
      return [...document.querySelectorAll('[data-hero] .layer')].map((l) => { const r = l.getBoundingClientRect(); return { h: l.dataset.layer, o: +getComputedStyle(l).opacity, covers: Math.abs(r.width - hero.width) < 2 && Math.abs(r.height - hero.height) < 2 }; });
    });
    const visible = st.filter((x) => x.o > 0.5).map((x) => x.h);
    if (visible.join() !== h) { bad++; console.log(`ERRORE ${label} ${h}: visibili ${visible.join(',') || 'nessuna'}`); }
    if (st.some((x) => !x.covers)) { bad++; console.log(`ERRORE ${label} ${h}: un'immagine non copre l'apertura`); }
    const hero = await page.locator('[data-hero]').boundingBox();
    const clip = { x: 0, y: 0, width: Math.min(hero.width, vp.width), height: Math.min(hero.height, vp.height) };
    const buf = await page.screenshot({ clip });
    if (shots) fs.writeFileSync(`${shots}/${label}-${h}.png`, buf);
    const s = await sharp(buf).stats();
    means[h] = s.channels.slice(0, 3).map((c) => c.mean);
    lum[h] = 0.299 * means[h][0] + 0.587 * means[h][1] + 0.114 * means[h][2];
    /* il sole: la luminosità del bordo sinistro e di quello destro, nella fascia bassa dove sta il sole (55-85% dell'altezza) */
    const m = await sharp(buf).metadata();
    const band = async (x0, x1) => { const crop = await sharp(buf).extract({ left: Math.round(m.width * x0), top: Math.round(m.height * 0.55), width: Math.round(m.width * (x1 - x0)), height: Math.round(m.height * 0.3) }).toBuffer(); /* stats() ignora il ritaglio: va misurata l'immagine già ritagliata */
    const st = await sharp(crop).stats(); const c = st.channels.slice(0, 3).map((q) => q.mean); return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]; };
    side[h] = { left: await band(0, 0.05), right: await band(0.96, 1) }; /* ai bordi, dove non ci sono testi né telefono */
  }
  for (let i = 0; i < HOURS.length; i++) for (let j = i + 1; j < HOURS.length; j++) {
    const a = means[HOURS[i]], b = means[HOURS[j]];
    const d = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    if (d < 12) { bad++; console.log(`ERRORE ${label}: ${HOURS[i]} e ${HOURS[j]} si assomigliano troppo (distanza colore ${d.toFixed(1)})`); }
  }
  const L = (h) => `${h}: sinistra ${side[h].left.toFixed(0)}, destra ${side[h].right.toFixed(0)}`;
  if (!(side.alba.right - side.alba.left > 25)) { bad++; console.log(`ERRORE ${label}: all'alba il lato destro (est) non è più luminoso del sinistro (${L('alba')})`); }
  if (!(side.tramonto.left - side.tramonto.right > 25)) { bad++; console.log(`ERRORE ${label}: al tramonto il lato sinistro (ovest) non è più luminoso del destro (${L('tramonto')})`); }
  const avg = (h) => (side[h].left + side[h].right) / 2;
  if (!(avg('notte') < avg('mezzogiorno') - 25 && lum.notte < Math.min(lum.alba, lum.mezzogiorno, lum.tramonto))) { bad++; console.log(`ERRORE ${label}: la notte non è la più buia (bordi ${['alba', 'mezzogiorno', 'tramonto', 'notte'].map((h) => `${h} ${side[h].left.toFixed(0)}/${side[h].right.toFixed(0)}`).join(', ')}; luminosità ${Object.entries(lum).map(([k, v]) => k + ' ' + v.toFixed(0)).join(', ')})`); }
  console.log(label, L('alba'), '·', L('tramonto'), '·', L('notte'), '·', L('mezzogiorno'), '·', 'luminosità', Object.entries(lum).map(([k, v]) => k + ' ' + v.toFixed(0)).join(', '));
  console.log(label, Object.entries(means).map(([h, m]) => `${h} rgb(${m.map(Math.round)})`).join(' · '));
  await page.close();
}
await browser.close(); local?.server.close();
if (bad) { console.log(`${bad} problemi`); process.exit(1); }
console.log('OK: alba, mezzogiorno, tramonto e notte si vedono diversi, su computer e su telefono.');
