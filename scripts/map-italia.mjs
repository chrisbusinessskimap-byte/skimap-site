// Rigenera i tracciati della cartina (Figma 238:9145): Italia, regioni, confinanti. NON fa parte della build: i dati sono fuori dal repo.
// Servono, in una cartella a parte: npm i world-atlas@2.0.2 topojson-client@3.1.0 topojson-server@3.0.1 e il file
// ne_10m_admin_1_states_provinces.geojson di https://github.com/nvkelso/natural-earth-vector (Natural Earth, dominio pubblico) come admin1-10m.geojson.
// Scrive gen2.json (tracciati nel sistema di coordinate dell'Italia, già con lo stesso riquadro degli spilli). Poi si disegna nel Figma e si scaricano gli SVG in public/map/.
// Italia: regioni (Natural Earth admin-1, pubblico dominio) + confinanti (world-atlas 10m). Stessa proiezione e stesso riquadro di gen.mjs.
import fs from 'node:fs';
import { feature, mesh, merge } from 'topojson-client';
import { topology } from 'topojson-server';

const LON0 = 6.0, LAT1 = 47.3, K = Math.cos((42 * Math.PI) / 180), PX = 52;
const proj = ([lon, lat]) => [(lon - LON0) * K * PX, (LAT1 - lat) * PX];

function dp(pts, eps) {
  if (pts.length < 3) return pts;
  const [a, b] = [pts[0], pts[pts.length - 1]];
  let dmax = 0, idx = 0;
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1e-9;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + b[0] * a[1] - b[1] * a[0]) / L;
    if (d > dmax) { dmax = d; idx = i; }
  }
  if (dmax > eps) { const l = dp(pts.slice(0, idx + 1), eps), r = dp(pts.slice(idx), eps); return l.slice(0, -1).concat(r); }
  return [a, b];
}
const dpRing = (r, eps) => { const m = r.length >> 1; return dp(r.slice(0, m + 1), eps).slice(0, -1).concat(dp(r.slice(m), eps)); };
function area(r) { let a = 0; for (let i = 0; i < r.length - 1; i++) a += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1]; return Math.abs(a / 2); }

// --- riquadro di riferimento: identico a gen.mjs (Italia da countries-10m, isole piccole fuori, dp 0.55) ---
const world = JSON.parse(fs.readFileSync('node_modules/world-atlas/countries-10m.json', 'utf8'));
const countries = feature(world, world.objects.countries).features;
const itOld = countries.find((f) => f.id === '380');
const polysOld = itOld.geometry.type === 'MultiPolygon' ? itOld.geometry.coordinates : [itOld.geometry.coordinates];
const ringsOld = [];
for (const poly of polysOld) { const o = poly[0].map(proj); if (area(o) < 90) continue; ringsOld.push(dpRing(o, 0.55)); for (const h of poly.slice(1)) { const hh = h.map(proj); if (area(hh) > 20) ringsOld.push(dpRing(hh, 0.55)); } }
const allOld = ringsOld.flat();
const minX = Math.min(...allOld.map((p) => p[0])), minY = Math.min(...allOld.map((p) => p[1]));
const T = ([x, y]) => [x - minX, y - minY];
const f1 = (n) => n.toFixed(1);
const lineD = (pts) => 'M' + pts.map((p) => `${f1(p[0])} ${f1(p[1])}`).join('L');

// --- regioni: le province di admin-1 raggruppate per regione ---
const adm = JSON.parse(fs.readFileSync('admin1-10m.geojson', 'utf8'));
const fc = { type: 'FeatureCollection', features: adm.features.filter((f) => f.properties.adm0_a3 === 'ITA').map((f) => ({ type: 'Feature', properties: { region: f.properties.region, name: f.properties.name }, geometry: f.geometry })) };
const topo = topology({ prov: fc }, 1e5);
const obj = topo.objects.prov;
// silhouette = unione di tutte le province; bordi regionali = linee fra province di regioni diverse
const sil = merge(topo, obj.geometries);
const polys = sil.coordinates; // MultiPolygon
const rings = [];
for (const poly of polys) {
  const o = poly[0].map(proj);
  if (area(o) < 40) continue; // le isolette sotto ~40 px² non servono (Elba resta)
  rings.push(dpRing(o, 0.5).map(T));
}
const inner = mesh(topo, obj, (a, b) => a !== b && a.properties.region !== b.properties.region);
const innerLines = inner.coordinates.map((l) => dp(l.map(proj), 0.5).map(T)).filter((l) => l.length > 1);
const outer = mesh(topo, obj, (a, b) => a === b);

const silD = rings.map((r) => lineD(r) + 'Z').join('');
const innerD = innerLines.map(lineD).join('');

// --- confinanti: ritagliati al riquadro 520×600 (Italia a 30,40 => in coordinate Italia [-30..490] × [-40..560]) ---
const BOX = [-74, -84, 526, 596];
function clipRect(poly, [x0, y0, x1, y1]) {
  let out = poly;
  const edges = [
    [(p) => p[0] >= x0, (a, b) => [x0, a[1] + ((b[1] - a[1]) * (x0 - a[0])) / (b[0] - a[0])]],
    [(p) => p[0] <= x1, (a, b) => [x1, a[1] + ((b[1] - a[1]) * (x1 - a[0])) / (b[0] - a[0])]],
    [(p) => p[1] >= y0, (a, b) => [a[0] + ((b[0] - a[0]) * (y0 - a[1])) / (b[1] - a[1]), y0]],
    [(p) => p[1] <= y1, (a, b) => [a[0] + ((b[0] - a[0]) * (y1 - a[1])) / (b[1] - a[1]), y1]],
  ];
  for (const [inside, inter] of edges) {
    const inp = out; out = [];
    for (let i = 0; i < inp.length; i++) {
      const cur = inp[i], prev = inp[(i + inp.length - 1) % inp.length];
      if (inside(cur)) { if (!inside(prev)) out.push(inter(prev, cur)); out.push(cur); } else if (inside(prev)) out.push(inter(prev, cur));
    }
    if (!out.length) break;
  }
  return out;
}
const NEIGH = { 250: 'Francia', 756: 'Svizzera', 40: 'Austria', 705: 'Slovenia', 191: 'Croazia', 276: 'Germania', 70: 'Bosnia', 438: 'Liechtenstein', 492: 'Monaco' };
let neighD = '';
const used = {};
for (const c of countries) {
  const id = +c.id; if (!(id in NEIGH)) continue;
  const polysN = c.geometry.type === 'MultiPolygon' ? c.geometry.coordinates : [c.geometry.coordinates];
  for (const poly of polysN) {
    const o = poly[0].map(proj).map(T);
    // scarta quel che è tutto fuori dal riquadro
    const xs = o.map((p) => p[0]), ys = o.map((p) => p[1]);
    if (Math.max(...xs) < BOX[0] || Math.min(...xs) > BOX[2] || Math.max(...ys) < BOX[1] || Math.min(...ys) > BOX[3]) continue;
    const cl = clipRect(o, BOX);
    if (cl.length < 3 || area(cl.concat([cl[0]])) < 80) continue;
    const s = dpRing(cl, 0.9);
    neighD += lineD(s) + 'Z';
    used[NEIGH[id]] = (used[NEIGH[id]] || 0) + 1;
  }
}
const all = rings.flat();
const W = Math.max(...all.map((p) => p[0])), H = Math.max(...all.map((p) => p[1]));
fs.writeFileSync('gen2.json', JSON.stringify({ W, H, silD, innerD, neighD, used, sizes: [silD.length, innerD.length, neighD.length] }));
console.log({ W: f1(W), H: f1(H), sizes: [silD.length, innerD.length, neighD.length], used, rings: rings.length, innerLines: innerLines.length });
