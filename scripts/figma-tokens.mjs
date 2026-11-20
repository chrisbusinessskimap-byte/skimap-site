#!/usr/bin/env node
/* I token del sito nascono dal file Figma, mai scritti a mano (come `figma_tokens.js` dell'app).
   Sorgente: src/design/figma/snapshot.json (variabili «Ski Maps», modi Giorno e Notte, e stili «Sito/…»,
   letti con l'MCP di Figma, use_figma in sola lettura). Uscita: src/design/tokens.css.
     node scripts/figma-tokens.mjs           rigenera il file
     node scripts/figma-tokens.mjs --check   esce con 1 se tokens.css non è quello che esce dall'istantanea */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const snap = JSON.parse(readFileSync(join(root, 'src/design/figma/snapshot.json'), 'utf8'));
const OUT = join(root, 'src/design/tokens.css');

/* un modo nuovo nel Figma è un errore qui, non un tema che sparisce in silenzio */
const MODES = { Giorno: 'giorno', Notte: 'notte' };
for (const m of snap.modes) if (!MODES[m]) throw new Error(`modo del Figma sconosciuto: ${m}`);

const cssName = (n) => '--' + n.replace(/\//g, '-');
const cssValue = (v, value) => (v.type === 'FLOAT' ? `${value}px` : value);

const day = snap.variables.map((v) => `  ${cssName(v.name)}: ${cssValue(v, v.values.Giorno)};`);
const night = snap.variables
  .filter((v) => v.values.Giorno !== v.values.Notte)
  .map((v) => `  ${cssName(v.name)}: ${cssValue(v, v.values.Notte)};`);

const FAMILIES = {
  'Bricolage Grotesque': 'var(--font-display)',
  'Hanken Grotesk': 'var(--font-body)',
  'IBM Plex Mono': 'var(--font-mono)',
};
const WEIGHTS = { Medium: 500, SemiBold: 600, Bold: 700, ExtraBold: 800 };
const slug = (n) => n.replace(/^Sito\//, '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-');
const num = (x) => String(Math.round(x * 10000) / 10000);

const styles = snap.textStyles.map((s) => {
  const m = /^(?:(\d+)pt\s+)?(\w+)$/.exec(s.style);
  if (!m || !WEIGHTS[m[2]]) throw new Error(`stile di testo non gestito: ${s.name} (${s.style})`);
  if (!FAMILIES[s.family]) throw new Error(`famiglia non gestita: ${s.family}`);
  const lines = [
    `  font-family: ${FAMILIES[s.family]};`,
    `  font-size: ${s.size}px;`,
    `  font-weight: ${WEIGHTS[m[2]]};`,
    `  line-height: ${num(s.lineHeight / 100)};`,
    `  letter-spacing: ${num(s.letterSpacing / 100)}em;`,
  ];
  if (s.family === 'Bricolage Grotesque') lines.push(`  font-variation-settings: 'opsz' ${m[1] ?? 14}, 'wdth' 100;`);
  if (s.case === 'UPPER') lines.push('  text-transform: uppercase;');
  return `.ts-${slug(s.name)} {\n${lines.join('\n')}\n}`;
});

const out = `/* GENERATO da scripts/figma-tokens.mjs dall'istantanea src/design/figma/snapshot.json (Figma ${snap.fileKey}, letta il ${snap.readAt}).
   Non modificare a mano: cambia il Figma, rileggi l'istantanea e rilancia \`npm run tokens\`. */

:root,
[data-theme='giorno'] {
${day.join('\n')}
  --font-display: 'Bricolage Grotesque Variable', system-ui, sans-serif;
  --font-body: 'Hanken Grotesk', system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, monospace;
  --shadow-float: ${snap.effects[0].css};
}

[data-theme='notte'] {
${night.join('\n')}
}

${styles.join('\n\n')}
`;

if (process.argv.includes('--check')) {
  const cur = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  if (cur !== out) { console.error('src/design/tokens.css non è aggiornato: lancia `npm run tokens`.'); process.exit(1); }
  console.log("OK: tokens.css coincide con l'istantanea del Figma.");
} else {
  writeFileSync(OUT, out);
  console.log(`Scritto src/design/tokens.css: ${snap.variables.length} variabili, ${snap.textStyles.length} stili di testo.`);
}
