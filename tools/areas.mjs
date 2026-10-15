#!/usr/bin/env node
/* Numeri delle aree (pagina Aree) dai grafi pubblicati dell'app.
     node tools/areas.mjs [--data=../skimap-data]
   Legge data/<id>_core.json e data/comprensori_ref.json del repo skimap-data e scrive
   content/areas.json: km di piste per colore, impianti per tipo, quota massima, collegamenti.
   Il sito non dipende da skimap-data: il file è nel repo, e si rigenera quando cambia un grafo.
   I numeri sono quelli della MAPPA di Ski Maps (OpenStreetMap): possono differire da quelli ufficiali,
   e la pagina lo dice. La quota viene dal modello del terreno, che smussa le cime: si arrotonda
   per difetto alle centinaia («3.100+ m»), così resta vera. */
import { readFileSync, writeFileSync } from 'node:fs';
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

/* ---------- numeri ---------- */
const refs = JSON.parse(readFileSync(join(DATA, 'comprensori_ref.json'), 'utf8')).ref;
const out = {};
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
}
writeFileSync(join(root, 'content/areas.json'), JSON.stringify(out, null, 1) + '\n');
console.log(JSON.stringify(out));
