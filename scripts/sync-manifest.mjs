#!/usr/bin/env node
/* Copia nel repo i dati dei comprensori che il sito mostra, dal manifest pubblico su R2 (sola lettura, GET).
   Il sito non dipende da skimap-data né dalla rete alla build: legge src/data/manifest.snapshot.json e le foto in
   public/areas/. Lo rilanci quando cambiano i dati, e il diff dice cosa è cambiato.
     node scripts/sync-manifest.mjs [--url=https://cdn.skimaps.cc] [--from=manifest.json]
   Se la CDN non risponde esce con 1 senza toccare niente: la build non ne dipende mai. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').slice(k.length + 3) || d;
const CDN = arg('url', 'https://cdn.skimaps.cc');
const FROM = arg('from', '');

let manifest;
try {
  manifest = FROM ? JSON.parse(readFileSync(FROM, 'utf8')) : await (await fetch(`${CDN}/v1/resorts/manifest.json`)).json();
} catch (e) {
  console.error(`Manifest non raggiungibile (${e.message}): non cambio niente.`);
  process.exit(1);
}

mkdirSync(join(root, 'public/areas'), { recursive: true });
const out = { source: `${CDN}/v1/resorts/manifest.json`, generatedAt: manifest.generatedAt, resorts: {} };
for (const r of manifest.resorts) {
  const cov = r.quality?.coverage || {};
  const zones = [...new Set((r.areas || []).map((a) => a[2]))];
  const entry = {
    id: r.id,
    name: r.name,
    pistesKm: cov.pistesKm ?? null,
    lifts: cov.lifts?.lifts ?? null,
    summitM: r.summitM ?? null,
    zones,
    osmDate: cov.osmDate ?? null,
    graphVersion: r.graph?.version ?? null,
    photo: null,
  };
  if (r.photo?.url) {
    const res = await fetch(CDN + r.photo.url);
    if (!res.ok) throw new Error(`foto di ${r.id}: ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    for (const [w, tag] of [[640, 's'], [1600, 'l']]) {
      await sharp(buf).resize({ width: w, withoutEnlargement: true }).webp({ quality: 72 }).toFile(join(root, `public/areas/${r.id}-${tag}.webp`));
    }
    const meta = await sharp(buf).metadata();
    entry.photo = {
      file: `/areas/${r.id}`,
      width: meta.width,
      height: meta.height,
      author: r.photo.author,
      license: r.photo.license,
      licenseUrl: r.photo.licenseUrl,
      sourceUrl: r.photo.sourceUrl,
      modified: !!r.photo.modified,
    };
  }
  out.resorts[r.id] = entry;
}
writeFileSync(join(root, 'src/data/manifest.snapshot.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`Manifest del ${out.generatedAt}: ${Object.keys(out.resorts).length} comprensori, foto in public/areas/.`);
