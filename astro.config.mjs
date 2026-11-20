import { defineConfig } from 'astro/config';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { toRedirectsFile, OLD_URLS } from './src/i18n/redirects.ts';
import { allEntries, alternates } from './src/i18n/routes.ts';
import { ORIGIN } from './src/i18n/langs.ts';

/* `_redirects` di Cloudflare Pages: lo scrive la tabella in src/i18n/redirects.ts, insieme alla build. */
const redirectsFile = () => ({
  name: 'skimap-redirects',
  hooks: {
    'astro:build:done': ({ dir }) => {
      writeFileSync(fileURLToPath(new URL('_redirects', dir)), toRedirectsFile());
      /* la tabella degli indirizzi di oggi, per i controlli (non va nel sito): .astro/old-urls.json */
      mkdirSync('.astro', { recursive: true });
      writeFileSync('.astro/old-urls.json', JSON.stringify(OLD_URLS, null, 2));
    },
  },
});

/* sitemap: hreflang per tutte le lingue della pagina + x-default sulla pagina di scelta della lingua */
const sitemap = () => ({
  name: 'skimap-sitemap',
  hooks: {
    'astro:build:done': ({ dir }) => {
      const seen = new Set();
      const blocks = [];
      for (const e of allEntries()) {
        const alts = alternates(e.page, e.area);
        const key = e.url;
        if (seen.has(key)) continue;
        seen.add(key);
        const links = alts.map((a) => `    <xhtml:link rel="alternate" hreflang="${a.lang}" href="${ORIGIN}${a.url}"/>`);
        if (e.page === 'home') links.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${ORIGIN}/"/>`);
        blocks.push(`  <url>\n    <loc>${ORIGIN}${e.url}</loc>\n${links.join('\n')}\n  </url>`);
      }
      blocks.unshift(`  <url>\n    <loc>${ORIGIN}/</loc>\n  </url>`);
      writeFileSync(
        fileURLToPath(new URL('sitemap.xml', dir)),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${blocks.join('\n')}\n</urlset>\n`,
      );
    },
  },
});

export default defineConfig({
  site: ORIGIN,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  compressHTML: true,
  prefetch: false,
  devToolbar: { enabled: false },
  integrations: [redirectsFile(), sitemap()],
});
