#!/usr/bin/env node
/* Numeri e anteprime delle aree (pagina Aree) dai grafi pubblicati dell'app.
     node tools/areas.mjs [--data=../skimap-data]
   Legge data/<id>_core.json e data/comprensori_ref.json del repo skimap-data e scrive:
   - content/areas.json: km di piste per colore, impianti per tipo, quota massima, collegamenti;
   - assets/areas/<id>.svg: la rete di piste e impianti, disegnata in piccolo, con i riferimenti per orientarsi:
     i nomi dei comprensori (o, in una rete sola, rifugi e parcheggi), l'area sciabile e la scala.
     Nessuna cartina sotto: il sito non chiede niente ad altri server.
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
const BG = '#e6edf4', SNOW = '#ffffff', INK = '#1b2430';
const FONT = 'font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif"';
function project(edges) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const e of edges) for (const [lon, lat] of e.coords) { x0 = Math.min(x0, lon); x1 = Math.max(x1, lon); y0 = Math.min(y0, lat); y1 = Math.max(y1, lat); }
  const k = Math.cos(((y0 + y1) / 2) * Math.PI / 180);
  const pad = 22, sx = (W - 2 * pad) / ((x1 - x0) * k);
  const H = Math.round((y1 - y0) * sx + 2 * pad);
  /* metri per pixel: un grado di latitudine è ~111,3 km */
  return { H, mpp: 111320 / sx, p: ([lon, lat]) => [pad + (lon - x0) * k * sx, H - pad - (lat - y0) * sx] };
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
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/* Etichette senza sovrapposizioni: per ogni etichetta si provano alcune posizioni attorno al punto,
   e si tiene la prima che non tocca le etichette già messe e resta dentro il disegno.
   La larghezza del testo è stimata (0,56 em a lettera in grassetto): basta per non sovrapporre. */
function placer(H) {
  const boxes = [];
  const free = (b) => b.x0 >= 4 && b.x1 <= W - 4 && b.y0 >= 4 && b.y1 <= H - 4
    && boxes.every((o) => b.x1 < o.x0 || b.x0 > o.x1 || b.y1 < o.y0 || b.y0 > o.y1);
  return {
    reserve: (b) => boxes.push(b),
    /* cand: [dx, dy, ancora] relativi al punto; restituisce {x, y, anchor} o null */
    place(x, y, text, size, cand) {
      const lines = text.split('\n');
      const w = Math.max(...lines.map((t) => t.length)) * size * 0.56, h = size * 1.15 * lines.length;
      for (const [dx, dy, anchor] of cand) {
        const tx = x + dx, ty = y + dy;
        const left = anchor === 'start' ? tx : anchor === 'end' ? tx - w : tx - w / 2;
        const b = { x0: left - 3, x1: left + w + 3, y0: ty - size * 0.8 - 2, y1: ty - size * 0.8 + h + 2 };
        if (free(b)) { boxes.push(b); return { x: tx, y: ty, anchor }; }
      }
      return null;
    },
  };
}
const label = (t, { x, y, anchor }, size, weight = 700) =>
  `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}" font-size="${size}" font-weight="${weight}" fill="${INK}" stroke="${SNOW}" stroke-width="${size / 4}" stroke-linejoin="round" paint-order="stroke">`
  + t.split('\n').map((line, i) => (i ? `<tspan x="${x.toFixed(1)}" dy="${(size * 1.15).toFixed(1)}">${esc(line)}</tspan>` : esc(line))).join('') + `</text>`;

/* barra della scala: la lunghezza tonda più vicina a un sesto della larghezza, nell'angolo in basso più vuoto */
function scaleBar(H, mpp, pl, pts) {
  const steps = [200, 500, 1000, 2000, 5000, 10000, 20000];
  const m = steps.reduce((a, b) => (Math.abs(b / mpp - W / 6) < Math.abs(a / mpp - W / 6) ? b : a));
  const len = m / mpp, t = m >= 1000 ? `${m / 1000} km` : `${m} m`;
  const busy = (x0) => pts.filter(([x, y]) => x >= x0 && x <= x0 + len + 30 && y >= H - 50).length;
  const x = busy(0) <= busy(W - len - 30) ? 14 : W - 14 - len, y = H - 14;
  pl.reserve({ x0: x - 8, x1: x + Math.max(len, 50) + 8, y0: y - 28, y1: H });
  return `<g stroke-linecap="square"><path d="M${x} ${y - 5}V${y}H${(x + len).toFixed(1)}V${y - 5}" fill="none" stroke="${SNOW}" stroke-width="5"/>`
    + `<path d="M${x} ${y - 5}V${y}H${(x + len).toFixed(1)}V${y - 5}" fill="none" stroke="${INK}" stroke-width="2"/></g>`
    + label(t, { x, y: y - 9, anchor: 'start' }, 16, 600);
}

/* Una regione con più comprensori: il nome di ognuno sul nodo della sua rete più vicino al suo centro.
   Il comprensorio di un nodo è quello del punto di riferimento più vicino, come nell'app. */
function areaLabels(edges, refs, p, pl) {
  const pts = new Map();
  for (const e of edges) if (e.type !== 'transfer') for (const c of [e.coords[0], e.coords[e.coords.length - 1]]) pts.set(c.join(), c);
  const by = new Map();
  for (const [lon, lat] of pts.values()) {
    let best = null, bd = Infinity;
    for (const [rl, rn, name] of refs) { const d = (rl - lat) ** 2 + ((rn - lon) * 0.7) ** 2; if (d < bd) { bd = d; best = name; } }
    if (!by.has(best)) by.set(best, []);
    by.get(best).push(p([lon, lat]));
  }
  const med = (a) => { const s = [...a].sort((u, v) => u - v); return s[s.length >> 1]; };
  const size = 19, out = []; /* al telefono il disegno scende a ~0,6: 19 diventa ~11 px */
  /* prima i comprensori più grandi: se non c'è posto per tutti, resta fuori il più piccolo */
  for (const [name, list] of [...by].sort((a, b) => b[1].length - a[1].length)) {
    const mx = med(list.map((q) => q[0])), my = med(list.map((q) => q[1]));
    const [x, y] = list.reduce((a, q) => (Math.hypot(q[0] - mx, q[1] - my) < Math.hypot(a[0] - mx, a[1] - my) ? q : a));
    const text = name.replace(/\//g, ' /\n'); /* «Val di Fiemme/Obereggen» su due righe: una sola è più larga di mezzo disegno */
    const cand = [[0, 0, 'middle']];
    for (const k of [1, 2, 3]) cand.push([0, -k * size, 'middle'], [0, k * size, 'middle'], [-k * size, 0, 'end'], [k * size, 0, 'start']);
    /* se a grandezza piena non c'è posto, un po' più piccola: meglio che senza nome */
    let at = pl.place(x, y + size * 0.35, text, size, cand), sz = size;
    if (!at) at = pl.place(x, y + (sz = size * 0.85) * 0.35, text, sz, cand.map(([dx, dy, a]) => [dx * 0.85, dy * 0.85, a]));
    if (at) out.push(label(text, at, sz));
    else console.warn(`  etichetta senza posto: ${name}`);
  }
  return out.join('');
}

/* Una regione di una rete sola: rifugi e parcheggi, che sono i posti dove si arriva e ci si ferma */
function poiLabels(nodes, p, pl) {
  const size = 18, r = 9, out = [];
  const list = nodes.filter((n) => n.poi === 'parking' || n.poi === 'hut').sort((a, b) => (a.poi === 'parking' ? -1 : 1) - (b.poi === 'parking' ? -1 : 1));
  /* prima tutti i segni, poi i nomi: un nome non copre il segno di un altro posto */
  for (const n of list) { const [x, y] = p([n.lon, n.lat]); pl.reserve({ x0: x - r, x1: x + r, y0: y - r, y1: y + r }); }
  for (const n of list) {
    const [x, y] = p([n.lon, n.lat]);
    const mark = n.poi === 'parking'
      ? `<rect x="${(x - r).toFixed(1)}" y="${(y - r).toFixed(1)}" width="${2 * r}" height="${2 * r}" rx="4" fill="#2b5fae" stroke="${SNOW}" stroke-width="2"/><text x="${x.toFixed(1)}" y="${(y + 5.5).toFixed(1)}" text-anchor="middle" font-size="15" font-weight="800" fill="#fff">P</text>`
      : `<path d="M${(x - r).toFixed(1)} ${(y + 7).toFixed(1)}L${x.toFixed(1)} ${(y - 8).toFixed(1)}L${(x + r).toFixed(1)} ${(y + 7).toFixed(1)}Z" fill="#7a4a1e" stroke="${SNOW}" stroke-width="2" stroke-linejoin="round"/>`;
    const at = pl.place(x, y + size * 0.35, n.name, size, [[r + 5, 0, 'start'], [-r - 5, 0, 'end'], [0, -r - 8, 'middle'], [0, r + 14, 'middle']]);
    out.push(mark + (at ? label(n.name, at, size, 600) : ''));
    if (!at) console.warn(`  etichetta senza posto: ${n.name}`);
  }
  return out.join('');
}

function svg(g, refs) {
  const draw = g.edges.filter((e) => e.coords && e.coords.length > 1);
  /* il riquadro lo fanno piste e impianti: un treno di 27 km rimpicciolirebbe tutto, e oltre il bordo si taglia */
  /* in una rete sola entrano anche rifugi e parcheggi: un parcheggio è spesso oltre l'ultima pista */
  const pois = refs ? [] : g.nodes.filter((n) => n.poi === 'parking' || n.poi === 'hut').map((n) => ({ coords: [[n.lon, n.lat]] }));
  const { H, mpp, p } = project([...draw.filter((e) => e.type !== 'transfer'), ...pois]);
  const big = draw.length > 1500;
  const tol = big ? 0.9 : 0.4;
  const layer = (list) => list.map((e) => path(simplify(e.coords.map(p), tol))).join('');
  const piste = (d) => draw.filter((e) => e.type === 'piste' && e.difficulty === d); /* il freeride non si disegna: non si instrada */
  const lifts = draw.filter((e) => e.type === 'lift');
  const links = draw.filter((e) => e.type === 'transfer' && e.mode && !['walk', 'ski'].includes(e.mode));
  const w = big ? 1.7 : 2;
  const pl = placer(H);
  const bar = scaleBar(H, mpp, pl, draw.flatMap((e) => e.coords.map(p)));
  const names = refs ? areaLabels(draw, refs, p, pl) : poiLabels(g.nodes, p, pl);
  /* l'alone bianco attorno a piste e impianti è l'area sciabile, come sulle cartine dei comprensori */
  const halo = big ? 12 : 16;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">`
    + `<rect width="${W}" height="${H}" fill="${BG}"/>`
    + `<g fill="none" stroke-linecap="round" stroke-linejoin="round">`
    + `<path d="${layer([...DIFF.flatMap(piste), ...lifts])}" stroke="${SNOW}" stroke-width="${halo}"/>`
    + (links.length ? `<path d="${layer(links)}" stroke="#ff7a00" stroke-width="${w}" stroke-dasharray="1 ${w * 2.5}"/>` : '')
    + DIFF.map((d) => `<path d="${layer(piste(d))}" stroke="${COLOR[d]}" stroke-width="${w * 1.4}"/>`).join('')
    + `<path d="${layer(lifts)}" stroke="#4c5866" stroke-width="${w * 0.8}" stroke-dasharray="${w * 3} ${w * 1.5}"/>`
    + `</g><g ${FONT}>${names}${bar}</g></svg>\n`;
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
  /* i comprensori di una regione: per il Superski stanno in comprensori_ref.json, per le altre nel file della regione */
  const region = JSON.parse(readFileSync(join(DATA, `regions/${id}.json`), 'utf8'));
  const areaRefs = id === 'superski' ? refs : region.areas;
  const multi = areaRefs && new Set(areaRefs.map((r) => r[2])).size > 1;
  out[id].labels = multi ? 'areas' : 'pois'; /* la pagina lo usa per il testo alternativo e la chiave dei simboli */
  writeFileSync(join(root, `assets/areas/${id}.svg`), svg(g, multi ? areaRefs : null));
}
writeFileSync(join(root, 'content/areas.json'), JSON.stringify(out, null, 1) + '\n');
console.log(JSON.stringify(out));
