#!/usr/bin/env node
/* Numeri e cartina della pagina Aree, dai grafi pubblicati dell'app e dai confini ISTAT delle regioni.
     node tools/areas.mjs --geo=limits_IT_regions.geojson --countries=ne_10m_admin_0_countries.geojson [--data=../skimap-data]
   --geo: i confini delle regioni ISTAT, da https://github.com/openpolis/geojson-italy
   (geojson/limits_IT_regions.geojson, CC BY 4.0: la pagina lo cita).
   --countries: i confini dei paesi di Natural Earth (dominio pubblico), da
   https://github.com/nvkelso/natural-earth-vector (geojson/ne_10m_admin_0_countries.geojson): servono
   per disegnare, sbiaditi, i paesi che confinano con l'Italia. I due file non stanno nel repo.
   Legge data/<id>_core.json e data/comprensori_ref.json del repo skimap-data e scrive:
   - content/areas.json: per ogni area km di piste per colore, impianti per tipo, quota massima,
     collegamenti; le regioni in cui sta; e, per un'area divisa fra più regioni (il Superski), gli
     stessi numeri per la parte in ogni regione, coi suoi comprensori;
   - content/italy.json: la cartina dell'Italia per regioni e dei paesi confinanti (solo il pezzo vicino
     al confine), già proiettata e semplificata, e i punti delle aree, che la pagina disegna dentro di
     sé (nessuna richiesta ad altri server).
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
if (!opt('countries')) throw new Error('manca --countries=<confini dei paesi di Natural Earth in GeoJSON>');
const COUNTRIES = JSON.parse(readFileSync(resolve(process.cwd(), opt('countries')), 'utf8'));
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

/* I 12 comprensori ufficiali del Dolomiti Superski. L'app ha i suoi punti di riferimento (comprensori_ref.json),
   pensati per dire «dove sei», e li raggruppa a modo suo: Alpe di Siusi a parte, Alpe Lusia / San Pellegrino
   dentro Fiemme. Qui si parte da quei punti, si rinominano coi nomi ufficiali e si correggono dove sbagliano;
   ogni correzione è stata controllata impianto per impianto (numero e nome dei cartelli). */
const OFFICIAL = {
  'Val Gardena': 'Val Gardena / Alpe di Siusi', 'Alpe di Siusi': 'Val Gardena / Alpe di Siusi', 'Alta Badia': 'Alta Badia',
  'Arabba/Marmolada': 'Arabba / Marmolada', 'Val di Fassa/Carezza': 'Val di Fassa / Carezza', 'Val di Fiemme/Obereggen': 'Val di Fiemme / Obereggen',
  'San Martino': 'San Martino di Castrozza / Passo Rolle', Cortina: 'Cortina d’Ampezzo', Kronplatz: 'Plan de Corones',
  'Rio Pusteria': 'Valle Isarco', '3 Cime': '3 Cime Dolomiti', Civetta: 'Civetta',
};
const EXTRA_REFS = [
  /* Alpe Lusia / San Pellegrino: Passo San Pellegrino, Col Margherita, Falcade, Lusia da Moena e da Bellamonte */
  [46.38, 11.79, 'Alpe Lusia / San Pellegrino'], [46.37, 11.80, 'Alpe Lusia / San Pellegrino'], [46.357, 11.87, 'Alpe Lusia / San Pellegrino'],
  [46.35, 11.66, 'Alpe Lusia / San Pellegrino'], [46.32, 11.67, 'Alpe Lusia / San Pellegrino'],
  /* Passo Pordoi: il lato trentino (Belvedere, Sass Pordoi) è della Val di Fassa, quello veneto (Lezuo, Fodom) di Arabba */
  [46.483, 11.800, 'Val di Fassa / Carezza'], [46.500, 11.808, 'Val di Fassa / Carezza'],
  /* Passo Campolongo: Vallon e Cherz sono dell'Alta Badia, Bec de Roces di Arabba */
  [46.527, 11.852, 'Alta Badia'], [46.518, 11.882, 'Alta Badia'], [46.513, 11.868, 'Arabba / Marmolada'],
];
/* un punto «di Fiemme» che cade fra San Pellegrino e Passo Rolle: lo sostituiscono i punti qui sopra */
const DROP_REFS = ['46.31,11.78'];
const appRefs = JSON.parse(readFileSync(join(DATA, 'comprensori_ref.json'), 'utf8')).ref;
const refs = appRefs.filter(([la, lo]) => !DROP_REFS.includes(`${la},${lo}`)).map(([la, lo, n]) => {
  if (!OFFICIAL[n]) throw new Error(`comprensorio dell'app senza nome ufficiale: ${n}`);
  return [la, lo, OFFICIAL[n]];
}).concat(EXTRA_REFS);
if (new Set(refs.map((r) => r[2])).size !== 12) throw new Error('i comprensori del Superski non sono 12');
/* il comprensorio di un punto è quello del punto di riferimento più vicino */
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
      /* i comprensori ufficiali che nella mappa dell'app non ci sono ancora: la pagina li nomina nella loro regione */
      const missing = [...new Set(refs.map((x) => x[2]))].filter((c) => !home.has(c) && regionOf([refs.find((x) => x[2] === c)[1], refs.find((x) => x[2] === c)[0]]) === r);
      return [r, { ...part, comprensori: mine, border: border > 0 ? border : 0, missing }];
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
/* equirettangolare alla latitudine media dell'Italia: a questa scala non si distingue da una conica.
   Il riquadro è l'Italia più un margine, così dei paesi confinanti si vede il pezzo vicino al confine:
   a ovest c'è più spazio, perché i comprensori di confine (la Vialattea con Montgenèvre) stanno lì */
const [gx0, gy0, gx1, gy1] = [5.0, 35.3, 18.9, 47.8], K = Math.cos(42 * Math.PI / 180), MAP_W = 560;
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
/* Sutherland-Hodgman: taglia un anello già proiettato sul riquadro (più un filo, perché il bordo non si veda) */
function clip(pts) {
  const edges = [[(p) => p[0] >= -2, (a, b) => cut(a, b, 0, -2)], [(p) => p[0] <= MAP_W + 2, (a, b) => cut(a, b, 0, MAP_W + 2)],
    [(p) => p[1] >= -2, (a, b) => cut(a, b, 1, -2)], [(p) => p[1] <= MAP_H + 2, (a, b) => cut(a, b, 1, MAP_H + 2)]];
  function cut(a, b, axis, v) { const t = (v - a[axis]) / (b[axis] - a[axis]); return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]; }
  let out = pts;
  for (const [inside, at] of edges) {
    const src = out; out = [];
    for (let i = 0; i < src.length; i++) {
      const cur = src[i], prev = src[(i + src.length - 1) % src.length];
      if (inside(cur)) { if (!inside(prev)) out.push(at(prev, cur)); out.push(cur); } else if (inside(prev)) out.push(at(prev, cur));
    }
    if (!out.length) return out;
  }
  return out;
}
const ring = (r, cut = false) => {
  const q = cut ? clip(r.map(proj)) : r.map(proj), m = q.length >> 1;
  const p = [...simplify(q.slice(0, m + 1), 0.55).slice(0, -1), ...simplify(q.slice(m), 0.55)];
  return p.length < 4 ? '' : 'M' + p.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L') + 'Z';
};
/* dove scrivere il nome delle regioni con aree, e da che parte: a mano, perché il posto libero lo decide la forma */
const LABEL_AT = {
  'trentino-alto-adige': [12.2, 46.86, 'start'], veneto: [12.75, 45.5, 'start'], lombardia: [9.25, 46.6, 'end'],
  piemonte: [7.75, 44.12, 'start'], abruzzo: [14.25, 42.0, 'start'],
};
/* i paesi che confinano con l'Italia (e i piccoli stati dentro e accanto), sbiaditi; il nome solo ai quattro grandi */
const NEIGHBORS = ['FRA', 'CHE', 'AUT', 'SVN', 'LIE', 'MCO', 'SMR', 'VAT'];
const COUNTRY_LABEL_AT = { FRA: [5.4, 43.75, 'start'], CHE: [7.9, 47.4, 'middle'], AUT: [12.9, 47.45, 'middle'], SVN: [14.75, 46.2, 'middle'] };
const neighbors = NEIGHBORS.map((iso) => {
  const f = COUNTRIES.features.find((x) => x.properties.ADM0_A3 === iso);
  if (!f) throw new Error(`paese assente nei confini: ${iso}`);
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  return { id: iso, d: polys.map((p) => ring(p[0], true)).join('') };
}).filter((c) => c.d);
const italy = {
  width: MAP_W, height: MAP_H,
  neighbors,
  countryLabels: Object.fromEntries(Object.entries(COUNTRY_LABEL_AT).map(([iso, [lon, lat, anchor]]) => { const [x, y] = proj([lon, lat]); return [iso, { x: +x.toFixed(1), y: +y.toFixed(1), anchor }]; })),
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
