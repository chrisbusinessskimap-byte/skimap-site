/* Un server statico minimo per i controlli nel browser: serve dist/ come Cloudflare Pages, con le regole di `_redirects`
   (301 e riscritture 200) e `404.html` per gli indirizzi che non esistono. Nessuna dipendenza. */
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { DIST } from './lib.mjs';

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.avif': 'image/avif', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml' };

export function serve(port = 0) {
  const rules = existsSync(join(DIST, '_redirects'))
    ? readFileSync(join(DIST, '_redirects'), 'utf8').split('\n').filter((l) => l && !l.startsWith('#')).map((l) => { const [from, to, status] = l.trim().split(/\s+/); return { from, to, status: +status }; })
    : [];
  const resolveFile = (p) => {
    const f = join(DIST, decodeURIComponent(p));
    if (existsSync(f) && statSync(f).isFile()) return f;
    const idx = join(f, 'index.html');
    return existsSync(idx) ? idx : null;
  };
  const server = createServer((req, res) => {
    let path = req.url.split('?')[0];
    const rule = rules.find((r) => r.from === path);
    if (rule && rule.status === 301) { res.writeHead(301, { Location: rule.to }); return res.end(); }
    if (rule && rule.status === 200) path = rule.to;
    if (!path.endsWith('/') && !extname(path)) { res.writeHead(301, { Location: path + '/' }); return res.end(); }
    const file = resolveFile(path);
    if (!file) {
      res.writeHead(404, { 'Content-Type': TYPES['.html'] });
      return res.end(existsSync(join(DIST, '404.html')) ? readFileSync(join(DIST, '404.html')) : 'not found');
    }
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(readFileSync(file));
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve({ server, port: server.address().port })));
}
