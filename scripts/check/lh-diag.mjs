#!/usr/bin/env node
/* Diagnostica una pagina con Lighthouse (una prova): che cosa è l'LCP, da dove vengono i millisecondi, che cosa pesa sul thread principale e
   quali controlli di accessibilità non passano. Serve a capire PRIMA di cambiare: node scripts/check/lh-diag.mjs /it/ /it/privacy/ [--base=https://…] */
import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';
import { serve } from './serve.mjs';

const paths = process.argv.slice(2).filter((a) => a.startsWith('/'));
const baseArg = process.argv.find((a) => a.startsWith('--base='))?.slice(7);
const local = baseArg ? null : await serve();
const base = baseArg || `http://127.0.0.1:${local.port}`;
const chrome = await launch({ chromePath: process.env.CHROME_PATH, chromeFlags: ['--headless=new', '--no-sandbox'] });
for (const p of paths) {
  const { lhr } = await lighthouse(base + p, { port: chrome.port, logLevel: 'error', output: 'json', onlyCategories: ['performance', 'accessibility'] });
  const a = lhr.audits;
  const lcp = a['largest-contentful-paint-element']?.details?.items?.[0]?.items?.[0]?.node;
  const phases = a['largest-contentful-paint-element']?.details?.items?.[1]?.items || [];
  console.log(`\n== ${p}  perf ${Math.round(lhr.categories.performance.score * 100)}  LCP ${Math.round(a['largest-contentful-paint'].numericValue)}  TBT ${Math.round(a['total-blocking-time'].numericValue)}  FCP ${Math.round(a['first-contentful-paint'].numericValue)}`);
  console.log('LCP elemento:', lcp?.snippet?.slice(0, 160) || '—');
  console.log('fasi LCP:', phases.map((x) => `${x.phase}=${Math.round(x.timing)}`).join(' '));
  const shifts = (a['layout-shifts']?.details?.items || []).slice(0, 4).map((x) => `${(x.score ?? 0).toFixed(3)} ${x.node?.snippet?.slice(0, 80) || ''}`);
  console.log('CLS', a['cumulative-layout-shift'].numericValue.toFixed(3), shifts.join(' | ') || '—');
  console.log('elementi che si spostano:', (a['layout-shift-elements']?.details?.items || []).slice(0, 4).map((x) => `${x.node?.snippet?.slice(0, 80)} ${x.score?.toFixed?.(3)}`).join(' | ') || '—');
  const mt = a['mainthread-work-breakdown']?.details?.items || [];
  console.log('thread principale:', mt.slice(0, 5).map((x) => `${x.groupLabel}=${Math.round(x.duration)}`).join(' '));
  const lt = a['long-tasks']?.details?.items || [];
  console.log('attività lunghe:', lt.slice(0, 5).map((x) => `${Math.round(x.duration)}ms@${Math.round(x.startTime)}`).join(' '));
  const bad = Object.values(a).filter((x) => lhr.categories.accessibility.auditRefs.some((r) => r.id === x.id) && x.score !== null && x.score < 1 && x.scoreDisplayMode !== 'notApplicable' && x.scoreDisplayMode !== 'manual');
  console.log('accessibilità non passa:', bad.map((x) => x.id).join(', ') || '—');
  const net = (a['network-requests']?.details?.items || []).filter((x) => x.transferSize > 30000).map((x) => `${x.url.split('/').slice(-1)[0]} ${Math.round(x.transferSize / 1024)}KB`);
  console.log('richieste > 30 KB:', net.join(' · '));
}
await chrome.kill(); local?.server.close();
