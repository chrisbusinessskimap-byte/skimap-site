/* Aiuti comuni dei controlli: leggono la cartella dist/ (il sito costruito), mai i sorgenti, così controllano quello che si pubblica. */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const DIST = join(ROOT, 'dist');
export const LANGS = ['it', 'en', 'de', 'fr', 'es'];
export const ORIGIN = 'https://skimaps.cc';

export const walk = (dir) =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

/* "/it/come-funziona/" ↔ dist/it/come-funziona/index.html */
export const urlOf = (file) => '/' + relative(DIST, file).split(sep).join('/').replace(/index\.html$/, '');
export const fileOfUrl = (url) => join(DIST, url.replace(/^\//, ''), url.endsWith('/') || url === '' ? 'index.html' : '');

export function pages() {
  return walk(DIST)
    .filter((f) => f.endsWith('.html'))
    .map((f) => ({ file: f, url: urlOf(f), html: readFileSync(f, 'utf8') }));
}

export const attrs = (tag) => Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
export const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((m) => m[0]);
export const ids = (html) => new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
export const claimsIn = (html) => [...html.matchAll(/data-claim="([^"]+)"/g)].map((m) => m[1]);
export const textOf = (html) => html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ');

export function reportBuilder() {
  const errors = [], warns = [];
  return { err: (m) => errors.push(m), warn: (m) => warns.push(m), errors, warns };
}

export const exists = existsSync;
export const read = (p) => readFileSync(p, 'utf8');
