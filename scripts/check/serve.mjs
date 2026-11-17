/* Un server statico minimo per i controlli nel browser: serve dist/ come Cloudflare Pages, con le regole di `_redirects`
   (301 e riscritture 200), le intestazioni di `_headers` e `404.html` per gli indirizzi che non esistono. Nessuna dipendenza. */
import { createServer } from 'node:http';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { DIST } from './lib.mjs';

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.avif': 'image/avif', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml' };

const escapeRe = (s) => s.split('').map((ch) => ('.+?^${}()|[]\\'.includes(ch) ? '\\' + ch : ch)).join('');

/* `_headers` come lo applica Pages: blocchi «percorso» seguiti da righe «Nome: valore»; `*` vale qualunque cosa */
function parseHeaders(text) {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.split('\n').map((l) => l.replace(/\s+$/, '')).filter(Boolean))
    .filter((lines) => lines.length > 1)
    .map(([pattern, ...rest]) => ({
      re: new RegExp('^' + escapeRe(pattern.trim()).split('*').join('.*') + '$'),
      headers: Object.fromEntries(rest.map((h) => { const i = h.indexOf(':'); return [h.slice(0, i).trim(), h.slice(i + 1).trim()]; })),
    }));
}

export function serve(port = 0) {
  const read = (name) => (existsSync(join(DIST, name)) ? readFileSync(join(DIST, name), 'utf8') : '');
  const rules = read('_redirects').split('\n').filter((l) => l && !l.startsWith('#')).map((l) => { const [from, to, status] = l.trim().split(/\s+/); return { from, to, status: +status }; });
  const headerRules = parseHeaders(read('_headers'));
  const extra = (p) => Object.assign({}, ...headerRules.filter((r) => r.re.test(p)).map((r) => r.headers));
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
    /* come Pages: i testi viaggiano compressi (brotli o gzip) */
    const type = TYPES[extname(file)] || 'application/octet-stream';
    let body = readFileSync(file);
    const headers = { 'Content-Type': type, ...extra(path) };
    if (/^(text\/|application\/(json|xml)|image\/svg)/.test(type)) {
      const accept = req.headers['accept-encoding'] || '';
      if (accept.includes('br')) { body = brotliCompressSync(body); headers['Content-Encoding'] = 'br'; }
      else if (accept.includes('gzip')) { body = gzipSync(body); headers['Content-Encoding'] = 'gzip'; }
      headers.Vary = 'Accept-Encoding';
    }
    res.writeHead(200, headers);
    res.end(body);
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve({ server, port: server.address().port })));
}
