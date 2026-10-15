#!/usr/bin/env node
/* Numeri e anteprime delle aree (pagina Aree) dai grafi pubblicati dell'app.
     node tools/areas.mjs [--data=../skimap-data]
   Legge data/<id>_core.json e data/comprensori_ref.json del repo skimap-data e scrive:
   - content/areas.json: km di piste per colore, impianti per tipo, quota massima, collegamenti;
   - assets/areas/<id>.svg: la rete di piste e impianti, disegnata in piccolo.
   Il sito non dipende da skimap-data: i due file sono nel repo, e si rigenerano quando cambia un grafo.
   I numeri sono quelli della MAPPA di Ski Maps (OpenStreetMap): possono differire da quelli ufficiali,
   e la pagina lo dice. La quota viene dal modello del terreno, che smussa le cime: si arrotonda
   per difetto alle centinaia («3.100+ m»), così resta vera. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';

const root = resolve(dirname(new URL(import.meta.url).pathname), '..');
const arg = process.argv.find((a) => a.startsWith('--data='));
const DATA = resolve(root, arg ? arg.slice(7) : '../skimap-data', 'data');
const IDS = ['superski', 'ovindoli', 'campofelice', 'vialattea', 'livigno'];

/* tipi OSM → le tre famiglie che la pagina conta */
const LIFT_GROUP = {
  gondola: 'cabin', cable_car: 'cabin', mixed_lift: 'cabin', funicular: 'cabin',
  chair_lift: 'chair',
  platter: 'surface', 't-bar': 'surface', 'j-bar': 'surface', drag_lift: 'surface', rope_tow: 'surface', magic_carpet: 'surface',
};
const DIFF = ['easy', 'intermediate', 'advanced'];
const COLOR = { easy: '#2f7de1', intermediate: '#e5484d', advanced: '#101418' };

/* ---------- disegno ---------- */
const W = 600;
function project(edges) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const e of edges) for (const [lon, lat] of e.coords) { x0 = Math.min(x0, lon); x1 = Math.max(x1, lon); y0 = Math.min(y0, lat); y1 = Math.max(y1, lat); }
  const k = Math.cos(((y0 + y1) / 2) * Math.PI / 180);
  const pad = 16, sx = (W - 2 * pad) / ((x1 - x0) * k);
  const H = Math.round((y1 - y0) * sx + 2 * pad);
  return { H, p: ([lon, lat]) => [pad + (lon - x0) * k * sx, H - pad - (lat - y0) * sx] };
}
/* Douglas-Peucker in pixel */
function simplify(pts, tol) {
  if (pts.length < 3) return pts;
  const [ax, ay] = pts[0], [bx, by] = pts[pts.length - 1];
  let far = 0, idx = 0;
  const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / len;
    if (d > far) { far = d; idx = i; }
  }
  if (far <= tol) return [pts[0], pts[pts.length - 1]];
  return [...simplify(pts.slice(0, idx + 1), tol).slice(0, -1), ...simplify(pts.slice(idx), tol)];
}
const path = (pts) => 'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L');

function svg(edges) {
  const draw = edges.filter((e) => e.coords && e.coords.length > 1);
  /* il riquadro lo fanno piste e impianti: un treno di 27 km rimpicciolirebbe tutto, e oltre il bordo si taglia */
  const { H, p } = project(draw.filter((e) => e.type !== 'transfer'));
  const big = draw.length > 1500;
  const tol = big ? 0.9 : 0.4;
  const layer = (list) => list.map((e) => path(simplify(e.coords.map(p), tol))).join('');
  const piste = (d) => draw.filter((e) => e.type === 'piste' && e.difficulty === d);
  const lifts = draw.filter((e) => e.type === 'lift');
  const links = draw.filter((e) => e.type === 'transfer' && e.mode && !['walk', 'ski'].includes(e.mode));
  const w = big ? 1.7 : 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">`
    + `<rect width="${W}" height="${H}" fill="#eef3f8"/>`
    + `<g fill="none" stroke-linecap="round" stroke-linejoin="round">`
    + (links.length ? `<path d="${layer(links)}" stroke="#ff7a00" stroke-width="${w}" stroke-dasharray="1 ${w * 2.5}"/>` : '')
    + DIFF.map((d) => `<path d="${layer(piste(d))}" stroke="${COLOR[d]}" stroke-width="${w * 1.4}"/>`).join('')
    + `<path d="${layer(lifts)}" stroke="#4c5866" stroke-width="${w * 0.8}" stroke-dasharray="${w * 3} ${w * 1.5}"/>`
    + `</g></svg>\n`;
}

/* ---------- numeri ---------- */
const refs = JSON.parse(readFileSync(join(DATA, 'comprensori_ref.json'), 'utf8')).ref;
const out = {};
mkdirSync(join(root, 'assets/areas'), { recursive: true });
for (const id of IDS) {
  const g = JSON.parse(readFileSync(join(DATA, `${id}_core.json`), 'utf8'));
  const piste = g.edges.filter((e) => e.type === 'piste' && DIFF.includes(e.difficulty));
  const lifts = g.edges.filter((e) => e.type === 'lift' && e.lift_entry !== false); /* un impianto spezzato in più archi conta una volta */
  const km = (list) => Math.round(list.reduce((s, e) => s + e.length, 0) / 1000);
  const groups = { cabin: 0, chair: 0, surface: 0 };
  for (const e of lifts) {
    const k = LIFT_GROUP[e.lift_type];
    if (!k) throw new Error(`${id}: tipo di impianto sconosciuto ${e.lift_type}`);
    groups[k]++;
  }
  const top = Math.max(...g.nodes.map((n) => n.ele).filter((x) => typeof x === 'number'));
  const modes = [...new Set(g.edges.filter((e) => e.type === 'transfer' && e.mode).map((e) => e.mode))];
  out[id] = {
    pisteKm: km(piste),
    byDiff: Object.fromEntries(DIFF.map((d) => [d, km(piste.filter((e) => e.difficulty === d))])),
    lifts: lifts.length,
    liftGroups: groups,
    topFloor: Math.floor(top / 100) * 100,
    bus: modes.includes('bus'), train: modes.includes('train'),
    subAreas: id === 'superski' ? new Set(refs.map((r) => r[2])).size : null,
  };
  writeFileSync(join(root, `assets/areas/${id}.svg`), svg(g.edges));
}
writeFileSync(join(root, 'content/areas.json'), JSON.stringify(out, null, 1) + '\n');
console.log(JSON.stringify(out));
