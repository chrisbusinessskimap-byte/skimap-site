#!/usr/bin/env node
/* Numeri e cartina della pagina Aree, dai grafi pubblicati dell'app e dai confini ISTAT delle regioni.
     node tools/areas.mjs --geo=limits_IT_regions.geojson [--data=../skimap-data]
   --geo: i confini delle regioni ISTAT, da https://github.com/openpolis/geojson-italy
   (geojson/limits_IT_regions.geojson, CC BY 4.0: la pagina lo cita). Non sta nel repo: serve solo qui.
   Legge data/<id>_core.json e data/comprensori_ref.json del repo skimap-data e scrive:
   - content/areas.json: per ogni area km di piste per colore, impianti per tipo, quota massima,
     collegamenti; le regioni in cui sta; e, per un'area divisa fra più regioni (il Superski), gli
     stessi numeri per la parte in ogni regione, coi suoi comprensori;
   - content/italy.json: la cartina dell'Italia per regioni, già proiettata e semplificata, e i
     punti delle aree, che la pagina disegna dentro di sé (nessuna richiesta ad altri server).
   Una pista o un impianto stanno nella regione in cui cade il punto a metà della loro linea.
   Il sito non dipende da skimap-data né dai confini: i due file sono nel repo, e si rigenerano
   quando cambia un grafo.
   I numeri sono quelli della MAPPA di Ski Maps (OpenStreetMap): possono differire da quelli ufficiali,
   e la pagina lo dice. La quota viene dal modello del terreno, che smussa le cime: si arrotonda
   per difetto alle centinaia («3.100+ m»), così resta vera. */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';

const root = resolve(dirname(new URL(import.meta.url).pathname), '..');
const opt = (k) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a && a.slice(k.length + 3); };
const DATA = resolve(root, opt('data') || '../skimap-data', 'data');
if (!opt('geo')) throw new Error('manca --geo=<confini delle regioni ISTAT in GeoJSON>');
const GEO = JSON.parse(readFileSync(resolve(process.cwd(), opt('geo')), 'utf8'));
const IDS = ['superski', 'ovindoli', 'campofelice', 'vialattea', 'livigno'];

/* tipi OSM → le tre famiglie che la pagina conta */
const LIFT_GROUP = {
  gondola: 'cabin', cable_car: 'cabin', mixed_lift: 'cabin', funicular: 'cabin',
  chair_lift: 'chair',
  platter: 'surface', 't-bar': 'surface', 'j-bar': 'surface', drag_lift: 'surface', rope_tow: 'surface', magic_carpet: 'surface',
};

/* ---------- regioni ---------- */
/* «Trentino-Alto Adige/Südtirol» → trentino-alto-adige: l'id è l'indirizzo della regione nella pagina (/aree/#veneto) */
const slug = (name) => name.split('/')[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');
const REGIONS = GEO.features.map((f) => ({ id: slug(f.properties.reg_name), polys: f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates }));
const inRing = ([x, y], r) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const regionOf = (pt) => (REGIONS.find((r) => r.polys.some((p) => inRing(pt, p[0]) && !p.slice(1).some((h) => inRing(pt, h)))) || {}).id || null;
const mid = (e) => e.coords[e.coords.length >> 1];

/* ---------- numeri ---------- */
const DIFFS = ['easy', 'intermediate', 'advanced'];
const kmOf = (list) => Math.round(list.reduce((s, e) => s + e.length, 0) / 1000);
/* i numeri di un insieme di archi: le piste che l'app instrada, un impianto spezzato in più archi conta una volta */
function stats(id, edges, nodes) {
  const piste = edges.filter((e) => e.type === 'piste' && DIFFS.includes(e.difficulty));
  const lifts = edges.filter((e) => e.type === 'lift' && e.lift_entry !== false);
  const groups = { cabin: 0, chair: 0, surface: 0 };
  for (const e of lifts) {
    const k = LIFT_GROUP[e.lift_type];
    if (!k) throw new Error(`${id}: tipo di impianto sconosciuto ${e.lift_type}`);
    groups[k]++;
  }
  const ends = new Set(edges.filter((e) => e.type !== 'transfer').flatMap((e) => e.id.split('__')));
  const top = Math.max(...nodes.filter((n) => ends.has(n.id) && typeof n.ele === 'number').map((n) => n.ele));
  return {
    pisteKm: kmOf(piste),
    byDiff: Object.fromEntries(DIFFS.map((d) => [d, kmOf(piste.filter((e) => e.difficulty === d))])),
    lifts: lifts.length,
    liftGroups: groups,
    topFloor: Math.floor(top / 100) * 100,
  };
}
const median = (a) => { const s = [...a].sort((u, v) => u - v); return s[s.length >> 1]; };

const refs = JSON.parse(readFileSync(join(DATA, 'comprensori_ref.json'), 'utf8')).ref;
/* il comprensorio del Superski di un punto è quello del punto di riferimento più vicino, come nell'app */
const comprensorioOf = ([lon, lat]) => {
  let best = null, bd = Infinity;
  for (const [rl, rn, name] of refs) { const d = (rl - lat) ** 2 + ((rn - lon) * 0.7) ** 2; if (d < bd) { bd = d; best = name; } }
  return best;
};
const out = { areas: {}, regions: {} }, pins = [];
for (const id of IDS) {
  const g = JSON.parse(readFileSync(join(DATA, `${id}_core.json`), 'utf8'));
  const modes = [...new Set(g.edges.filter((e) => e.type === 'transfer' && e.mode).map((e) => e.mode))];
  const area = {
    ...stats(id, g.edges, g.nodes),
    bus: modes.includes('bus'), train: modes.includes('train'),
    subAreas: id === 'superski' ? new Set(refs.map((r) => r[2])).size : null,
  };
  /* le regioni dell'area: quelle italiane con almeno il 5% dei suoi km di piste (Montgenèvre è in Francia: non è una regione) */
  const skied = g.edges.filter((e) => e.type === 'piste' || e.type === 'lift');
  const routed = (e) => e.type === 'piste' && DIFFS.includes(e.difficulty); /* il freeride non si conta: l'app non lo instrada */
  const byRegion = new Map();
  for (const e of skied) { const r = regionOf(mid(e)); if (r) { if (!byRegion.has(r)) byRegion.set(r, []); byRegion.get(r).push(e); } }
  const total = skied.filter(routed).reduce((s, e) => s + e.length, 0);
  const regions = [...byRegion].filter(([, list]) => list.filter(routed).reduce((s, e) => s + e.length, 0) >= total * 0.05)
    .sort((x, y) => y[1].length - x[1].length);
  if (!regions.length) throw new Error(`${id}: nessuna regione`);
  area.regions = regions.map(([r]) => r);
  /* un'area divisa fra più regioni ha i numeri della parte in ognuna, coi comprensori che ci stanno per la maggior parte */
  if (regions.length > 1) {
    const home = new Map(); /* comprensorio → { regione → km } */
    for (const [r, list] of regions) for (const e of list) if (routed(e)) {
      const c = comprensorioOf(mid(e));
      if (!home.has(c)) home.set(c, {});
      home.get(c)[r] = (home.get(c)[r] || 0) + e.length;
    }
    area.parts = Object.fromEntries(regions.map(([r, list]) => {
      const part = stats(id, list, g.nodes);
      const mine = [...home].filter(([, by]) => Object.entries(by).sort((x, y) => y[1] - x[1])[0][0] === r)
        .map(([c, by]) => [c, Math.round(by[r] / 1000)]).sort((x, y) => y[1] - x[1]);
      /* le piste dei comprensori che stanno per lo più nella regione accanto: una riga sola, così le righe fanno il totale */
      const border = part.pisteKm - mine.reduce((s, [, km]) => s + km, 0);
      return [r, { ...part, comprensori: mine, border: border > 0 ? border : 0 }];
    }));
  }
  for (const [r, list] of regions) {
    (out.regions[r] ||= []).push(id);
    const pts = list.map(mid);
    pins.push({ area: id, region: r, lon: median(pts.map((q) => q[0])), lat: median(pts.map((q) => q[1])) });
  }
  out.areas[id] = area;
}
writeFileSync(join(root, 'content/areas.json'), JSON.stringify(out, null, 1) + '\n');

/* ---------- cartina ---------- */
/* equirettangolare alla latitudine media dell'Italia: a questa scala non si distingue da una conica */
const [gx0, gy0, gx1, gy1] = GEO.bbox, K = Math.cos(42 * Math.PI / 180), MAP_W = 520;
const S = MAP_W / ((gx1 - gx0) * K), MAP_H = Math.round((gy1 - gy0) * S);
const proj = ([lon, lat]) => [(lon - gx0) * K * S, (gy1 - lat) * S];
/* Douglas-Peucker; un anello chiuso si divide in due, perché primo e ultimo punto coincidono */
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
const ring = (r) => {
  const q = r.map(proj), m = q.length >> 1;
  const p = [...simplify(q.slice(0, m + 1), 0.55).slice(0, -1), ...simplify(q.slice(m), 0.55)];
  return p.length < 4 ? '' : 'M' + p.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L') + 'Z';
};
/* dove scrivere il nome delle regioni con aree, e da che parte: a mano, perché il posto libero lo decide la forma */
const LABEL_AT = {
  'trentino-alto-adige': [12.2, 46.86, 'start'], veneto: [12.75, 45.5, 'start'], lombardia: [9.25, 46.6, 'end'],
  piemonte: [7.75, 44.12, 'start'], abruzzo: [14.25, 42.0, 'start'],
};
const italy = {
  width: MAP_W, height: MAP_H,
  regions: REGIONS.map((r) => ({ id: r.id, d: r.polys.map((p) => ring(p[0])).join('') })),
  labels: Object.fromEntries(Object.keys(out.regions).map((r) => {
    if (!LABEL_AT[r]) throw new Error(`regione senza posto per il nome: ${r}`);
    const [x, y] = proj(LABEL_AT[r]);
    return [r, { x: +x.toFixed(1), y: +y.toFixed(1), anchor: LABEL_AT[r][2] }];
  })),
  pins: pins.map(({ area, region, lon, lat }) => { const [x, y] = proj([lon, lat]); return { area, region, x: +x.toFixed(1), y: +y.toFixed(1) }; }),
};
writeFileSync(join(root, 'content/italy.json'), JSON.stringify(italy) + '\n');
console.log(JSON.stringify(out, null, 1));
console.log('cartina:', JSON.stringify(italy).length, 'byte');
