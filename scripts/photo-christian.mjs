#!/usr/bin/env node
/* La foto di «Chi siamo» (Christian nella baita): ritaglio a mezzo busto 5:4 (via bicchieri e piatto in basso, l'oggetto a destra e la mano a sinistra),
   un velo di luce in più sul viso, nessun dato nascosto (sharp toglie EXIF e posizione GPS se non gli si chiede di tenerli) e AVIF + WebP a tre larghezze.
   L'originale (4032 × 3024) non sta nel repo.
     node scripts/photo-christian.mjs --src=<percorso>/baita.jpg */
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = (process.argv.find((a) => a.startsWith('--src=')) || '').slice(6);
if (!src) { console.error('Serve --src=<foto originale>'); process.exit(1); }
const OUT = join(root, 'public/team');
mkdirSync(OUT, { recursive: true });
/* ritaglio in px dell'originale 4032 × 3024 */
const BOX = { left: 1020, top: 0, width: 2825, height: 2260 }; /* 5:4 */
const WIDTHS = [480, 720, 960];
const base = () => sharp(src).rotate().extract(BOX).modulate({ brightness: 1.04 });
for (const w of WIDTHS) {
  await base().resize({ width: w }).avif({ quality: 55, effort: 5 }).toFile(join(OUT, `christian-${w}.avif`));
  await base().resize({ width: w }).webp({ quality: 72 }).toFile(join(OUT, `christian-${w}.webp`));
}
const meta = await sharp(join(OUT, 'christian-960.webp')).metadata();
console.log(`christian-{${WIDTHS.join(',')}}.avif/.webp in public/team/ (${meta.width}×${meta.height}), EXIF: ${meta.exif ? 'PRESENTE' : 'assente'}`);
