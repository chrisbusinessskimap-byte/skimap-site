/* Favicon grandi per Google e i browser (20-11-2026): Google chiede un'icona quadrata e consiglia più di 48×48 px,
   il sito dichiarava solo favicon-32.png. Disegna lo stesso quadrato di favicon-32.png (Abisso #0b1430, angoli al 21%,
   segno alto il 47% del lato, centrato: misurati su quel file) a partire dal vettore public/brand/mark.svg, senza
   ingrandire pixel. Scrive public/icon-192.png e public/favicon.ico (16, 32 e 48 px, PNG dentro l'ICO).
   favicon-32.png e apple-touch-icon.png restano quelli di prima.
     node scripts/favicon.mjs */
import { readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const ROOT = new URL('../', import.meta.url);
const mark = readFileSync(new URL('public/brand/mark.svg', ROOT), 'utf8');
const paths = mark.match(/<path[^>]*\/>/g).join('');

/* il segno occupa x 18–82, y 14–84 nel sistema di mark.svg */
const square = (S) => {
  const h = 0.47 * S, w = h * 64 / 70;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">`
    + `<rect width="${S}" height="${S}" rx="${0.21 * S}" fill="#0b1430"/>`
    + `<svg x="${(S - w) / 2}" y="${(S - h) / 2}" width="${w}" height="${h}" viewBox="18 14 64 70">${paths}</svg></svg>`;
};
const png = (S) => sharp(Buffer.from(square(S)), { density: 72 * Math.max(1, 192 / S) }).resize(S, S).png().toBuffer();

writeFileSync(new URL('public/icon-192.png', ROOT), await png(192));

/* ICO: intestazione, una voce per immagine, poi i PNG */
const sizes = [16, 32, 48];
const imgs = await Promise.all(sizes.map(png));
const head = Buffer.alloc(6 + 16 * sizes.length);
head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(sizes.length, 4);
let offset = head.length;
sizes.forEach((s, i) => {
  const e = 6 + 16 * i;
  head.writeUInt8(s, e); head.writeUInt8(s, e + 1); head.writeUInt8(0, e + 2); head.writeUInt8(0, e + 3);
  head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6);
  head.writeUInt32LE(imgs[i].length, e + 8); head.writeUInt32LE(offset, e + 12);
  offset += imgs[i].length;
});
writeFileSync(new URL('public/favicon.ico', ROOT), Buffer.concat([head, ...imgs]));
console.log('scritti public/icon-192.png e public/favicon.ico (16, 32, 48)');
