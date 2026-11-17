#!/usr/bin/env node
/* Le schermate dei telefoni esportate dal Figma arrivano con lo sfondo bianco dietro i bordi arrotondati.
   Questo script lo toglie: riempie dai quattro angoli i pixel quasi bianchi (alfa = 0) e ammorbidisce il bordo.
     node scripts/phone-alpha.mjs */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const dir = join(dirname(fileURLToPath(import.meta.url)), '../src/assets/phones');
for (const f of readdirSync(dir).filter((n) => n.endsWith('.webp'))) {
  const { data, info } = await sharp(readFileSync(join(dir, f))).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const px = (x, y) => (y * w + x) * 4;
  const white = (i) => Math.min(data[i], data[i + 1], data[i + 2]) >= 238 && data[i + 3] > 0;
  const seen = new Uint8Array(w * h);
  const stack = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]];
  const bg = [];
  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= w || y >= h || seen[y * w + x]) continue;
    seen[y * w + x] = 1;
    if (!white(px(x, y))) continue;
    bg.push([x, y]);
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  for (const [x, y] of bg) data[px(x, y) + 3] = 0;
  /* il bordo: i pixel a contatto con lo sfondo tolto, mescolati col bianco, prendono un'alfa proporzionale al loro scuro */
  const edge = [];
  for (const [x, y] of bg) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const i = px(x + dx, y + dy);
    if (x + dx >= 0 && y + dy >= 0 && x + dx < w && y + dy < h && data[i + 3] !== 0) edge.push(i);
  }
  for (const i of new Set(edge)) {
    const lum = Math.min(data[i], data[i + 1], data[i + 2]);
    data[i + 3] = Math.max(0, Math.min(255, Math.round(((255 - lum) / (255 - 20)) * 255)));
    if (lum > 200) data[i + 3] = 0;
  }
  const out = await sharp(data, { raw: { width: w, height: h, channels: 4 } }).webp({ quality: 88, alphaQuality: 100 }).toBuffer();
  writeFileSync(join(dir, f), out);
  console.log(f, `${bg.length} pixel di sfondo tolti`);
}
