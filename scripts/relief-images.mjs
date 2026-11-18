#!/usr/bin/env node
/* Le quattro immagini del rilievo «all'ora giusta» (alba, mezzogiorno, tramonto, notte) in AVIF e WebP a più larghezze.
   Sorgenti: skimap-data/docs/brand/v2/rilievo/rilievo_<ora>.jpg (2880 px, Dolomiti 11,35–12,45 E, 46,33–46,80 N, DEM Terrain Tiles z12,
   rigenerabili con relief.py + imhof.py). Crediti: pagina «Fonti e licenze» e piede (A13): nessuna immagine online senza.
     node scripts/relief-images.mjs --src=../skimap-data/docs/brand/v2/rilievo [--hours=alba,tramonto] [--force] */
import { mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').slice(k.length + 3) || d;
const SRC = resolve(root, arg('src', '../skimap-data/docs/brand/v2/rilievo'));
const OUT = join(root, 'public/relief');
const HOURS = (arg('hours', '') ? arg('hours', '').split(',') : ['alba', 'mezzogiorno', 'tramonto', 'notte']);
const FORCE = process.argv.includes('--force');
/* alba e tramonto: sole radente, ombre lunghe. Nei file sorgente la luce c'è ma sotto il velo si perde: più contrasto (le ombre si scuriscono, le facce illuminate si accendono) e un po' più di colore, così la direzione del sole si legge (18-11). */
const TONE = { alba: { a: 1.3, b: -34, sat: 0.9 }, tramonto: { a: 1.3, b: -34, sat: 1.05 } };
const WIDTHS = [640, 960, 1200, 1800, 2400];

mkdirSync(OUT, { recursive: true });
let bytes = 0;
for (const h of HOURS) {
  for (const w of WIDTHS) {
    if (!FORCE && existsSync(join(OUT, `${h}-${w}.avif`)) && existsSync(join(OUT, `${h}-${w}.webp`))) continue; /* già fatti */
    let img = sharp(join(SRC, `rilievo_${h}.jpg`)).resize({ width: w, withoutEnlargement: true });
    if (TONE[h]) img = img.linear(TONE[h].a, TONE[h].b).modulate({ saturation: TONE[h].sat });
    const a = await img.clone().avif({ quality: 52, effort: 5 }).toFile(join(OUT, `${h}-${w}.avif`));
    const b = await img.clone().webp({ quality: 66 }).toFile(join(OUT, `${h}-${w}.webp`));
    bytes += a.size + b.size;
  }
}
console.log(`Rilievo (${HOURS.join(', ')}): ${HOURS.length * WIDTHS.length * 2} file in public/relief/, ${(bytes / 1048576).toFixed(1)} MB in tutto.`);
