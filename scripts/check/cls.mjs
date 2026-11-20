#!/usr/bin/env node
/* Dove si sposta il layout: apre la pagina come un telefono (412 × 823) con rete lenta e stampa ogni spostamento con l'elemento e il prima/dopo.
   node scripts/check/cls.mjs --base=https://… /de/ /fr/   (senza --base usa il sito locale di `serve`) */
import { chromium } from 'playwright-core';
import { serve } from './serve.mjs';

const base0 = process.argv.find((a) => a.startsWith('--base='))?.slice(7);
const paths = process.argv.slice(2).filter((a) => a.startsWith('/'));
const local = base0 ? null : await serve();
const base = base0 || `http://127.0.0.1:${local.port}`;
const browser = await chromium.launch({ channel: 'chrome' });
for (const p of paths) {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
  await page.addInitScript(() => {
    window.__shifts = [];
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        if (e.hadRecentInput) continue;
        window.__shifts.push({ t: Math.round(e.startTime), v: +e.value.toFixed(4), s: e.sources.map((s) => ({ n: (s.node?.className || s.node?.nodeName || '?').toString().slice(0, 40), a: [s.previousRect.x, s.previousRect.y, s.previousRect.width, s.previousRect.height].map(Math.round), b: [s.currentRect.x, s.currentRect.y, s.currentRect.width, s.currentRect.height].map(Math.round) })) });
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto(base + p, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => window.__shifts);
  console.log(`\n== ${p}  CLS ${r.reduce((a, x) => a + x.v, 0).toFixed(3)}`);
  for (const x of r) console.log(` t=${x.t}ms valore ${x.v}`, JSON.stringify(x.s));
  await ctx.close();
}
await browser.close(); local?.server.close();
