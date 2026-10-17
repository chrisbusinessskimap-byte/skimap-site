#!/usr/bin/env node
/* Genera le pagine del sito dai testi in content/*.mjs (nessuna dipendenza):
     node tools/build.mjs
   Produce: home, Come funziona, Aree, Domande per ogni lingua (it, en, de) e sitemap.xml.
   Nelle pagine legali scritte a mano (privacy, elimina account) aggiorna SOLO barra in alto,
   piè di pagina e link di ritorno: il testo legale non viene toccato.
   Le pagine generate non vanno modificate a mano: si cambiano i testi in content/ e si rilancia. */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ORIGIN, MAIL, LANGS, LANG_ORDER, PAGE_KEYS, LEGAL, fileOf } from './site.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const C = {};
for (const l of LANG_ORDER) C[l] = (await import(pathToFileURL(join(root, 'content', `${l}.mjs`)).href)).default;

const GENERATED = '<!-- Pagina generata da tools/build.mjs: per cambiare i testi modifica content/*.mjs e rilancia il comando. -->';
/* l'icona dell'app (skimap-mobile/src/assets/brand/skimap-logo.png), la stessa del telefono e del Play Store */
const LOGO = '<img src="/assets/icon-64.png" width="32" height="32" alt="">';
const RIDGE = '<svg class="ridge" viewBox="0 0 1200 140" preserveAspectRatio="none" aria-hidden="true"><path d="M0 140 L0 110 L90 70 L160 96 L250 44 L330 84 L420 30 L500 92 L580 62 L680 110 L760 50 L860 96 L940 36 L1040 86 L1120 60 L1200 90 L1200 140 Z" fill="rgba(255,255,255,.06)"/></svg>';
const SHIELD = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 L19 6 V11 C19 15.5 16 19 12 21 C8 19 5 15.5 5 11 V6 Z"/><path d="M9 12 L11 14 L15 10"/></svg>';
const ICONS = {
  level: '<path d="M3 20 L9 9 L13 15 L16 11 L21 20 Z"/><path d="M7.5 12 L9 9 L10.5 11.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7 V12 L15.5 14"/>',
  voice: '<path d="M4 9 H8 L13 5 V19 L8 15 H4 Z"/><path d="M16.5 9 a4 4 0 0 1 0 6"/><path d="M19 6.5 a7.5 7.5 0 0 1 0 11"/>',
  pocket: '<rect x="7" y="2.5" width="10" height="13" rx="2"/><path d="M4 12 H20 V20 a2 2 0 0 1 -2 2 H6 a2 2 0 0 1 -2 -2 Z"/>',
  offline: '<path d="M12 3 V15"/><path d="M7 10 L12 15 L17 10"/><path d="M4 19 H20"/>',
  sign: '<path d="M12 3 V21"/><path d="M5 5 H17 L20 8 L17 11 H5 Z"/><path d="M19 13 H8 L5 16 L8 19 H19 Z"/>',
  lang: '<path d="M4 5 H16 a2 2 0 0 1 2 2 V13 a2 2 0 0 1 -2 2 H10 L6 19 V15 H4 a2 2 0 0 1 -2 -2 V7 a2 2 0 0 1 2 -2 Z"/><path d="M7 9 H13 M7 12 H11"/>',
  map: '<path d="M3 6 L9 3 L15 6 L21 3 V18 L15 21 L9 18 L3 21 Z"/><path d="M9 3 V18 M15 6 V21"/>',
  person: '<circle cx="12" cy="8" r="4"/><path d="M4 21 c0-4.4 3.6-7 8-7 s8 2.6 8 7"/>',
  ask: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5 a2.5 2.5 0 1 1 3.5 2.3 c-.7 .3 -1 .8 -1 1.5 V14"/><path d="M12 17 h.01"/>',
};
const icon = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[k]}</svg>`;
const attr = (s) => String(s).replace(/<[^>]+>/g, '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const jsq = (s) => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
const enc = encodeURIComponent;

/* Schermate dell'app: un file per schermata in assets/shots/ (WebP, schermo intero senza la barra dei tasti
   di Android; larghezza e altezza in pagina si leggono dal file). Finché il file manca la schermata non compare:
   in pagina non va mai un segnaposto. */
const SHOTS = {
  'scheda del percorso Sellaronda': 'sellaronda.webp',
  'mappa con la destinazione scelta': 'passo-1-destinazione.webp',
  'i tre percorsi per livello verso la stessa destinazione': 'passo-2-livelli.webp',
  'navigazione in corso con l’istruzione «nome e colore della pista»': 'passo-3-navigazione.webp',
};
const missingShots = new Set();
const shotFile = (label) => {
  const file = SHOTS[label];
  if (!file) throw new Error(`schermata senza nome di file: ${label}`);
  if (existsSync(join(root, 'assets/shots', file))) return '/assets/shots/' + file;
  missingShots.add(file);
  return '';
};
/* larghezza e altezza di un WebP, dall'intestazione (VP8, VP8L o VP8X) */
const webpSize = (file) => {
  const b = readFileSync(file), kind = b.toString('ascii', 12, 16);
  if (kind === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
  if (kind === 'VP8L') { const n = b.readUInt32LE(21); return [1 + (n & 0x3fff), 1 + ((n >> 14) & 0x3fff)]; }
  return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
};
const shot = (c, [label, caption]) => {
  const src = shotFile(label);
  const [w, h] = src ? webpSize(join(root, src)) : [];
  return src ? `<figure class="shot"><img src="${src}" alt="${attr(caption)}" width="${w}" height="${h}" loading="lazy" decoding="async"><figcaption>${caption}</figcaption></figure>` : '';
};

/* {home} {privacy} {delete} nei testi → indirizzi della lingua */
const fill = (s, l) => s.replace(/\{home\}/g, LANGS[l].pages.home).replace(/\{privacy\}/g, LANGS[l].legal.privacy).replace(/\{delete\}/g, LANGS[l].legal.delete);

function langSwitch(cls, current, urls, c) {
  return `<nav class="${cls}" aria-label="${c.ui.langs}">` + LANG_ORDER.map((l) =>
    `<a href="${urls[l]}" hreflang="${l}" lang="${l}"${l === current ? ' aria-current="true"' : ''} title="${C[l].name}">${l.toUpperCase()}</a>`).join('') + '</nav>';
}

function header(l, current, urls, { solid = true } = {}) {
  const c = C[l], P = LANGS[l].pages, links = [['how', P.how], ['areas', P.areas], ['faq', P.faq], ['about', P.about], ['privacy', LANGS[l].legal.privacy]];
  const a = (k, href) => `<a href="${href}"${k === current ? ' aria-current="page"' : ''}>${c.nav[k]}</a>`;
  return `<header class="nav${solid ? ' solid' : ''}" id="nav">
  <div class="wrap">
    <a class="logo" href="${P.home}" aria-label="${c.ui.homeAria}">
      ${LOGO}
      Ski Maps
    </a>
    <nav class="nav-links" aria-label="${c.ui.sections}">
      ${links.map(([k, h]) => a(k, h)).join('\n      ')}
    </nav>
    <a class="btn primary" href="${P.home}#avvisami">${c.ui.ctaShort}</a>
    ${langSwitch('langs', l, urls, c)}
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="mobile-menu" id="menu-btn"><svg class="mb-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg><span class="mb-txt">${c.ui.menu}</span></button>
  </div>
  <nav class="mobile-menu" id="mobile-menu" aria-label="${c.ui.sections}">
    ${links.map(([k, h]) => a(k, h)).join('\n    ')}
    <a href="${P.home}#avvisami">${c.ui.cta}</a>
    ${langSwitch('mm-langs', l, urls, c)}
  </nav>
</header>`;
}

function footer(l) {
  const c = C[l], P = LANGS[l].pages, G = LANGS[l].legal;
  return `<footer>
  <div class="wrap">
    <span class="season">© 2026 Ski Maps</span>
    <nav aria-label="${c.ui.footer}">
      <a href="${G.privacy}">${c.ui.privacy}</a>
      <a href="${G.delete}">${c.ui.delete}</a>
      <a href="${P.about}">${c.nav.about}</a>
      <a href="${P.areas}#impianti">${c.ui.biz}</a>
    </nav>
    <span>${c.ui.contact} <a href="mailto:${MAIL}">${MAIL}</a></span>
    <span>${c.ui.data} <a href="${G.sources}">${c.ui.sources}</a></span>
  </div>
</footer>`;
}

function head(l, key, { title, desc, ogAlt }) {
  const c = C[l], url = ORIGIN + LANGS[l].pages[key];
  const alts = LANG_ORDER.map((x) => `<link rel="alternate" hreflang="${x}" href="${ORIGIN + LANGS[x].pages[key]}">`).join('\n')
    + `\n<link rel="alternate" hreflang="x-default" href="${ORIGIN + LANGS.it.pages[key]}">`;
  const altLoc = LANG_ORDER.filter((x) => x !== l).map((x) => `<meta property="og:locale:alternate" content="${C[x].locale}">`).join('\n');
  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${GENERATED}
<title>${title}</title>
<meta name="description" content="${attr(desc)}">
<meta name="theme-color" content="#101418">
<link rel="canonical" href="${url}">
${alts}
<link rel="icon" href="/assets/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<meta property="og:site_name" content="Ski Maps">
<meta property="og:type" content="website">
<meta property="og:title" content="${attr(title)}">
<meta property="og:description" content="${attr(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="${c.locale}">
${altLoc}
<meta property="og:image" content="${ORIGIN}/assets/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${attr(ogAlt || C[l].home.ogAlt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${attr(title)}">
<meta name="twitter:description" content="${attr(desc)}">
<meta name="twitter:image" content="${ORIGIN}/assets/og-image.png">
<style>@view-transition{navigation:auto}</style>
<link rel="stylesheet" href="/assets/fonts.css">
<link rel="stylesheet" href="/assets/site.css">
<noscript><style>.menu-btn,.mobile-menu{display:none}.hero canvas,.hero .hint,.routecard,.try3d{display:none}</style></noscript>
</head>`;
}

function T(l, extra = '') {
  return `<script>
window.SKIMAP_T = {
  siteTitle: ${jsq(C[l].siteTitle)}${extra}
};
</script>`;
}

function page(l, key, main, { scripts = '', tvars = '', solid = true } = {}) {
  const c = C[l], meta = c[key];
  const urls = Object.fromEntries(LANG_ORDER.map((x) => [x, LANGS[x].pages[key]]));
  return `${head(l, key, meta)}
<body class="site">

<a class="skip" href="#main">${c.ui.skip}</a>
${header(l, key, urls, { solid })}

<main id="main" tabindex="-1">
${main}
</main>

${footer(l)}

${T(l, tvars)}
<script src="/assets/site.js" defer></script>
${scripts}</body>
</html>
`;
}

const secHead = (eyebrow, h, id, lede = '') =>
  `<div class="sec-head">
      <div class="eyebrow"><span class="disc"></span>${eyebrow}</div>
      <h2 id="${id}">${h}</h2>${lede ? `\n      <p class="lede measure">${lede}</p>` : ''}
    </div>`;

const pageHead = (eyebrow, h1, lede = '') =>
  `<div class="view-head"><div class="wrap">
    <div class="eyebrow"><span class="disc"></span>${eyebrow}</div>
    <h1 class="pagetitle">${h1}</h1>${lede ? `\n    <p class="lede measure">${lede}</p>` : ''}
  </div></div>`;

const ctaBand = (l) => `<section class="ctaband" aria-label="${attr(C[l].ui.cta)}"><div class="wrap">
  <p>${C[l].ui.ctaBand}</p>
  <a class="btn primary" href="${LANGS[l].pages.home}#avvisami">${C[l].ui.cta}</a>
</div></section>`;

/* ---------------- home ---------------- */
/* la foto di Christian (home e chi siamo) compare solo se il file esiste (720 × 900 px, JPEG ottimizzato) */
const PHOTO = existsSync(join(root, 'assets/team/christian.jpg')) ? '/assets/team/christian.jpg' : '';
/* immagine della mappa 3D per telefono e tablet (una per lingua: le etichette sono tradotte) */
const poster = (l) => existsSync(join(root, `assets/hero-poster-${l}.webp`)) ? `/assets/hero-poster-${l}.webp` : '';
function home(l) {
  const c = C[l], h = c.home, P = LANGS[l].pages, G = LANGS[l].legal, j = c.js;
  const redirects = l === 'de' ? {} : {
    giro: P.how, 'come-funziona': P.how, funzioni: P.how, pensata: P.how,
    dove: P.areas, mondo: P.areas, pilot: P.areas, motore: P.areas, impianti: P.areas + '#impianti',
    domande: P.faq, fiducia: '#privacy-in-breve', beta: '#avvisami',
    privacy: G.privacy, 'elimina-account': G.delete, 'delete-account': G.delete,
  };
  const subj = enc(h.wl.subject);
  const main = `
<section class="sec" id="home" aria-labelledby="h-home">
  <div class="hero" id="hero">
    <canvas id="net" role="img" aria-label="${attr(h.canvasAria)}"></canvas>
    <div class="veil"></div>
    <div class="databadge" id="databadge"></div>
    <div class="wrap">
      <div class="hero-copy">
        <div class="eyebrow"><span class="disc"></span>${h.eyebrow}</div>
        <h1 id="h-home" class="long">
          <span class="line">${h.h1a}</span>
          <span class="line"><span class="mark">${h.h1b}</span></span>
        </h1>
        <p class="lede measure">${h.lede}</p>
        <div class="cta">
          <a class="btn primary" href="#avvisami">${c.ui.cta}</a>
          <a class="btn ghost" href="${P.how}">${h.howBtn}</a>
        </div>
        <p class="store">${h.store}</p>
        <p class="trustline">${SHIELD}${h.trust} <a href="#privacy-in-breve">${c.nav.privacy}</a></p>
        <div class="hint"><i></i>${h.hint}</div>
      </div>

      <div class="mapbox" id="mapbox">
        ${poster(l) ? `<img class="poster" src="${poster(l)}" width="720" height="720" alt="${attr(h.posterAlt)}" loading="lazy" decoding="async">` : ''}
        <button class="btn primary try3d" type="button" id="try3d">${h.try3d}</button>
      </div>

      <div class="routecard" aria-live="polite">
        <div>
          <div class="dest">${h.rc.dest}</div>
          <div class="name" id="rc-name">—</div>
          <div class="from">${h.rc.from} <span id="rc-from">—</span></div>
        </div>
        <div class="levels">
          <div class="lvl" id="rc-beg"><span class="sk" style="background:#3fb950"></span><div class="t"><b>${h.rc.beg}</b><small id="rc-beg-s">${h.rc.begS}</small></div><div class="n" id="rc-beg-n">—</div></div>
          <div class="lvl" id="rc-int"><span class="sk" style="background:#f0883e"></span><div class="t"><b>${h.rc.int}</b><small id="rc-int-s">${h.rc.intS}</small></div><div class="n" id="rc-int-n">—</div></div>
          <div class="lvl sel" id="rc-adv"><span class="sk" style="background:#f85149"></span><div class="t"><b>${h.rc.adv}</b><small>${h.rc.advS}</small></div><div class="n" id="rc-adv-n">—</div></div>
        </div>
        <div class="legs" id="rc-legs" aria-label="${attr(h.rc.legs)}"></div>
        <a class="go" href="${P.how}">▶ &nbsp;${h.howBtn}</a>
      </div>
    </div>
  </div>
  <p class="mapcredit phone-only">${c.ui.mapdata} <a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a> (ODbL)</p>
</section>

<section class="sec points" id="cosa-fa" aria-labelledby="h-points">
  <div class="wrap">
    <h2 id="h-points" class="sr-only">${h.pointsTitle}</h2>
    <ul class="features three">
${h.points.map(([k, t, p]) => `      <li class="feat"><span class="ico">${icon(k)}</span><h3>${t}</h3><p>${p}</p></li>`).join('\n')}
    </ul>
  </div>
</section>

<section class="doors" id="scopri" aria-labelledby="h-doors">
  <h2 id="h-doors" class="sr-only">${h.doorsTitle}</h2>
  <div class="wrap">
${[['how', 'map'], ['areas', 'level'], ['faq', 'ask']].map(([k, ic]) => {
    const [ey, t, p] = h.doors[k];
    return `    <a class="door" href="${P[k]}">
      <span class="ico">${icon(ic)}</span>
      <div class="eyebrow">${ey}</div>
      <h3>${t}</h3>
      <p>${p}</p>
      <span class="go">${h.open}</span>
    </a>`;
  }).join('\n')}
  </div>
</section>

<section class="sec" id="privacy-in-breve" aria-labelledby="h-trust">
  <div class="wrap">
    ${secHead(h.trustBox.eyebrow, h.trustBox.h, 'h-trust')}
    <ul class="cols4">
${h.trustBox.items.map(([t, p]) => `      <li class="col"><h3>${t}</h3><p>${fill(p, l)}</p></li>`).join('\n')}
    </ul>
    <p class="more"><a class="btn ghost" href="${G.privacy}">${h.trustBox.link}</a></p>
  </div>
</section>

<section class="sec founder" id="chi-siamo" aria-labelledby="h-founder">
  <div class="wrap">
    <div class="founder-card">
      ${PHOTO ? `<img class="founder-photo" src="${PHOTO}" alt="${attr(c.about.photoAlt)}" width="720" height="900" loading="lazy" decoding="async">` : `<span class="founder-photo initial" aria-hidden="true">C</span>`}
      <div class="founder-text">
        <div class="eyebrow"><span class="disc"></span>${c.about.eyebrow}</div>
        <h2 id="h-founder">${c.about.band.h}</h2>
        <p>${c.about.band.p}</p>
        <p class="founder-links"><a class="btn ghost" href="${P.about}">${c.about.band.more}</a><a href="mailto:${MAIL}?subject=${enc('Ski Maps')}">${c.about.band.mail}</a></p>
      </div>
    </div>
  </div>
</section>

<section class="sec" id="avvisami" aria-labelledby="h-wl">
  <div class="beta">
    ${RIDGE}
    <div class="wrap">
      <div class="eyebrow"><span class="disc amber"></span>${h.wl.eyebrow}</div>
      <h2 id="h-wl">${h.wl.h}</h2>
      <p class="lede measure">${h.wl.lede}</p>
      <form id="beta-form" novalidate>
        <label for="email" class="sr-only">${h.wl.label}</label>
        <input id="email" name="email" type="email" required placeholder="${h.wl.ph}" autocomplete="email" aria-describedby="beta-fine">
        <input type="checkbox" name="botcheck" id="botcheck" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">
        <button class="btn primary" type="submit" id="beta-submit">${h.wl.send}</button>
      </form>
      <p class="ok" id="beta-ok" role="status" hidden>${h.wl.ok}</p>
      <p class="ok" id="beta-mailto" role="status" hidden>${h.wl.mailto} <a href="mailto:${MAIL}?subject=${subj}" style="color:inherit">${MAIL}</a>.</p>
      <p class="ok warn" id="beta-invalid" role="alert" hidden>${h.wl.invalid}</p>
      <p class="ok warn" id="beta-err" role="alert" hidden>${h.wl.err} <a href="mailto:${MAIL}?subject=${subj}" style="color:inherit">${MAIL}</a>.</p>
      <p class="fine" id="beta-fine">${h.wl.fine} <a href="${G.privacy}" style="color:inherit">${c.ui.privacy}</a>.</p>
    </div>
  </div>
</section>
`;
  const tvars = `,
  redirects: ${JSON.stringify(redirects)},
  decimal: ${jsq(j.decimal)}, thousands: ${jsq(j.thousands)},
  routeUnavailable: ${jsq(j.routeUnavailable)}, indirect: ${jsq(j.indirect)},
  easyOnly: ${jsq(j.easyOnly)}, easyMedium: ${jsq(j.easyMedium)},
  fromLabel: ${j.fromLabel},
  badge: ${j.badge},
  youAre: ${jsq(j.youAre)},
  noWebGL: ${jsq(j.noWebGL)},
  beta: {
    subject: ${jsq(h.wl.subject)}, send: ${jsq(h.wl.send)}, sending: ${jsq(j.sending)},
    mailBody: ${j.mailBody},
    formSubject: ${jsq(j.formSubject)}, fromName: ${jsq(j.fromName)},
    formMessage: ${j.formMessage}
  }`;
  /* three.js, grafo e mappa 3D li carica hero.js: subito su computer, al tocco su telefono e tablet */
  const scripts = `<script src="/assets/hero.js" defer></script>
<script src="/assets/config.js" defer></script>
<script src="/assets/beta.js" defer></script>
`;
  return page(l, 'home', main, { scripts, tvars, solid: false });
}

/* ---------------- come funziona ---------------- */
function how(l) {
  const c = C[l], h = c.how;
  const pillar = ([k, t, p]) => `<div class="pillar"><span class="k">${k}</span><h3>${t}</h3><p>${p}</p></div>`;
  const main = `
${pageHead(h.eyebrow, h.h1, h.lede)}

<section class="sec dark" id="giro" aria-labelledby="h-giro">
  ${RIDGE}
  <h2 id="h-giro" class="sr-only">${h.toursTitle}</h2>
  <div class="wrap split${shotFile(h.shotTour[0]) ? '' : ' solo'}">
    <div>
      <div class="pillars">
        ${pillar(h.prob)}
        ${pillar(h.sol)}
      </div>
      <h3 class="listh">${h.toursTitle}</h3>
      <ul class="tours">
${h.tours.map(([t, p]) => `        <li><b>${t}</b><span>${p}</span></li>`).join('\n')}
      </ul>
    </div>
    ${shotFile(h.shotTour[0]) ? `<div class="shotcol">
      ${shot(c, h.shotTour)}
    </div>` : ''}
  </div>
</section>

<section class="sec" id="passi" aria-labelledby="h-steps">
  <div class="wrap">
    ${secHead(h.stepsEyebrow, h.stepsH, 'h-steps')}
    <ol class="steps">
${h.steps.map(([t, p, s], k, all) => `      <li class="step">
        <div class="num"><span class="pnum ${['blue', 'red', 'adv'][k]}" aria-hidden="true">${k + 1}</span><small>${h.step} ${k + 1}</small></div>
        <h3>${t}</h3>
        <p>${p}</p>
        ${all.every((x) => shotFile(x[2][0])) ? shot(c, s) : ''}
      </li>`).join('\n').replace(/\n\s*\n(\s*<\/li>)/g, '\n$1')}
    </ol>
  </div>
</section>

<section class="sec tint" id="funzioni" aria-labelledby="h-feat">
  <div class="wrap">
    ${secHead(h.featEyebrow, h.featH, 'h-feat', h.featLede)}
    <ul class="features">
${h.feats.map(([k, t, p]) => `      <li class="feat"><span class="ico">${icon(k)}</span><h3>${t}</h3><p>${p}</p></li>`).join('\n')}
    </ul>
  </div>
</section>

${ctaBand(l)}
`;
  return page(l, 'how', main);
}

/* ---------------- aree ---------------- */
/* numeri e cartina da tools/areas.mjs (grafi dell'app, confini ISTAT): qui si leggono soltanto */
const AREAS = JSON.parse(readFileSync(join(root, 'content/areas.json'), 'utf8'));
const ITALY = JSON.parse(readFileSync(join(root, 'content/italy.json'), 'utf8'));
/* da ovest a est e da nord a sud, come si legge la cartina */
const REGION_IDS = ['piemonte', 'lombardia', 'trentino-alto-adige', 'veneto', 'abruzzo'];
if (REGION_IDS.join() !== [...REGION_IDS].filter((r) => AREAS.regions[r]).join() || Object.keys(AREAS.regions).length !== REGION_IDS.length) throw new Error('le regioni di content/areas.json non sono quelle di REGION_IDS');
function areas(l) {
  const c = C[l], a = c.areas, L = a.l, n = (x) => x.toLocaleString(c.locale.replace('_', '-'));
  const rname = (r) => a.regionNames[r];
  const areaName = (id) => a.items[id][0];
  /* i numeri di un'area in una regione: tutta l'area, o la sua parte se l'area sta in più regioni */
  const statsIn = (id, r) => (AREAS.areas[id].parts || {})[r] || AREAS.areas[id];
  const regionTotal = (r) => AREAS.regions[r].reduce((t, id) => ({ km: t.km + statsIn(id, r).pisteKm, lifts: t.lifts + statsIn(id, r).lifts }), { km: 0, lifts: 0 });
  const allKm = Object.values(AREAS.areas).reduce((t, x) => t + x.pisteKm, 0), allLifts = Object.values(AREAS.areas).reduce((t, x) => t + x.lifts, 0);

  const card = (id, r) => {
    const area = AREAS.areas[id], st = statsIn(id, r), split = !!area.parts;
    const [name, where, desc] = a.items[id];
    /* l'id della scheda tiene vivi i vecchi indirizzi (/aree/#livigno); un'area divisa lo dà alla sua parte più grande */
    const cardId = !split || area.regions[0] === r ? id : `${id}-${r}`;
    const total = st.byDiff.easy + st.byDiff.intermediate + st.byDiff.advanced;
    const lifts = ['cabin', 'chair', 'surface'].filter((k) => st.liftGroups[k]).map((k) => `<li><b>${n(st.liftGroups[k])}</b> ${L[k]}</li>`).join('');
    const extra = [area.subAreas && !split ? L.sub(area.subAreas) : '', area.train ? L.busTrain : (area.bus ? L.bus : '')].filter(Boolean);
    const rows = split ? `
          <p class="area-k">${a.comprensori}</p>
          <ul class="area-rows">${[...st.comprensori, ...(st.border ? [[a.border, st.border]] : [])].map(([cn, km]) => `<li><span>${cn}</span><i style="--w:${(km / st.comprensori[0][1] * 100).toFixed(0)}%"></i><b>${n(km)} km</b></li>`).join('')}</ul>${st.missing.length ? `
          <p class="area-missing">${a.notYet(st.missing.join(', '))}</p>` : ''}` : '';
    const elsewhere = split ? area.regions.filter((o) => o !== r).map((o) => `<a href="#${o}" data-region="${o}">${a.continues(name, rname(o), n(area.parts[o].pisteKm))}</a>`).join(' ') : '';
    return `        <article class="area-panel" id="${cardId}">
        <div class="area-body">
          <h3>${name}</h3>
          <p class="area-where">${split ? a.part(rname(r)) : `${where}${desc ? ` · ${desc}` : ''}`}</p>
          <dl class="area-stats">
            <div><dt>${L.km}</dt><dd>${n(st.pisteKm)}</dd></div>
            <div><dt>${L.lifts}</dt><dd>${n(st.lifts)}</dd></div>
            <div><dt>${L.top}</dt><dd>${n(st.topFloor)}+ m</dd></div>
          </dl>
          <p class="area-k">${L.colors}</p>
          <div class="area-bar" aria-hidden="true">${['easy', 'intermediate', 'advanced'].map((d) => `<i class="${d}" style="flex-grow:${st.byDiff[d]}"></i>`).join('')}</div>
          <ul class="area-legend">${['easy', 'intermediate', 'advanced'].map((d) => `<li class="${d}"><b>${n(st.byDiff[d])} km</b> ${L[d]} · ${Math.round(st.byDiff[d] / total * 100)}%</li>`).join('')}</ul>
          <ul class="area-lifts">${lifts}</ul>${rows}${extra.length ? `
          <p class="area-extra">${extra.join(' · ')}</p>` : ''}${elsewhere ? `
          <p class="area-extra">${elsewhere}</p>` : ''}
        </div>
      </article>`;
  };
  const regionPanel = (r) => {
    const t = regionTotal(r);
    return `      <article class="it-region" id="${r}" aria-labelledby="h-${r}">
        <a class="it-back" href="#elenco">← ${a.back}</a>
        <div class="it-head"><h2 id="h-${r}">${rname(r)}</h2><p>${n(t.km)} ${L.km} · ${n(t.lifts)} ${L.lifts}</p></div>
        <div class="it-cards">
${AREAS.regions[r].map((id) => card(id, r)).join('\n')}
        </div>
      </article>`;
  };
  const svg = () => {
    /* le regioni sono definite una volta e disegnate due: sotto con un tratto spesso (che fuori resta come
       contorno marcato dell'Italia), sopra col riempimento e il tratto sottile dei confini fra regioni */
    const defs = ITALY.regions.map(({ id, d }) => `<path id="it-${id}" d="${d}"/>`).join('');
    const outline = ITALY.regions.map(({ id }) => `<use href="#it-${id}"/>`).join('');
    const regs = ITALY.regions.map(({ id }) => AREAS.regions[id]
      ? `<a class="it-reg" href="#${id}" data-region="${id}" aria-label="${attr(`${rname(id)}: ${AREAS.regions[id].map(areaName).join(', ')}`)}"><use href="#it-${id}"/></a>`
      : `<use href="#it-${id}"/>`).join('');
    const near = ITALY.neighbors.map(({ d }) => `<path d="${d}"/>`).join('');
    const nearNames = Object.entries(ITALY.countryLabels).map(([iso, { x, y, anchor }]) => `<text x="${x}" y="${y}" text-anchor="${anchor}">${a.countries[iso]}</text>`).join('');
    const pins = ITALY.pins.map(({ region, x, y }) => `<g class="it-pin" data-region="${region}" transform="translate(${x} ${y})"><circle class="it-pulse" r="5"/><circle r="5"/></g>`).join('');
    const labels = REGION_IDS.map((r) => {
      const { x, y, anchor } = ITALY.labels[r];
      return `<text x="${x}" y="${y}" text-anchor="${anchor}">${rname(r)}<tspan x="${x}" dy="16">${AREAS.regions[r].map(areaName).join(' · ')}</tspan></text>`;
    }).join('');
    return `<svg class="italy" viewBox="0 0 ${ITALY.width} ${ITALY.height}" role="group" aria-label="${attr(a.mapLabel)}">
          <defs><linearGradient id="it-ski" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc94a"/><stop offset="1" stop-color="#ff9a1f"/></linearGradient>
            <radialGradient id="it-fade-g" cx=".52" cy=".26" r=".46"><stop offset=".55" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient>
            <mask id="it-fade"><rect width="${ITALY.width}" height="${ITALY.height}" fill="url(#it-fade-g)"/></mask>
            <linearGradient id="it-edge-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset=".08" stop-color="#fff"/></linearGradient>
            <mask id="it-edge"><rect width="${ITALY.width}" height="${ITALY.height}" fill="url(#it-edge-g)"/></mask>${defs}</defs>
          <g aria-hidden="true" mask="url(#it-edge)"><g class="it-near" mask="url(#it-fade)">${near}</g></g><g class="it-near-names" aria-hidden="true">${nearNames}</g>
          <g class="it-outline" aria-hidden="true">${outline}</g><g class="it-regs">${regs}</g><g class="it-pins" aria-hidden="true">${pins}</g><g class="it-labels" aria-hidden="true">${labels}</g>
        </svg>`;
  };
  const list = REGION_IDS.map((r) => `<li><a href="#${r}" data-region="${r}"><b>${rname(r)}</b><span>${AREAS.regions[r].map(areaName).join(' · ')}</span><small>${n(regionTotal(r).km)} km</small></a></li>`).join('\n          ');
  const main = `
${pageHead(a.eyebrow, a.h1, a.lede)}

<section class="sec" id="elenco" aria-label="${attr(a.eyebrow)}">
  <div class="wrap">
    <div class="it-x">
      <div class="it-map">
        ${svg()}
        <div class="it-side">
          <h2 class="it-h">${a.pick}</h2>
          <p class="it-hint">${a.hint}</p>
          <ul class="it-list">
          ${list}
          </ul>
          <dl class="it-tot">
            <div><dd>${n(allKm)}</dd><dt>${L.km}</dt></div>
            <div><dd>${n(allLifts)}</dd><dt>${L.lifts}</dt></div>
            <div><dd>${REGION_IDS.length}</dd><dt>${a.regionsWord}</dt></div>
          </dl>
        </div>
      </div>
      <div class="it-panels">
${REGION_IDS.map(regionPanel).join('\n')}
      </div>
    </div>
    <p class="area-note">${a.note} ${c.ui.mapdata} <a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a> (ODbL). <a href="https://github.com/openpolis/geojson-italy">${a.istat}</a> ${a.ne}</p>
  </div>
</section>

<section class="sec" id="impianti" aria-labelledby="h-biz">
  <div class="wrap">
    <div class="bizcard">
      <div>
        <div class="eyebrow"><span class="disc"></span>${a.biz.eyebrow}</div>
        <h2 id="h-biz">${a.biz.h}</h2>
        <p>${a.biz.p}</p>
      </div>
      <a class="mail" href="mailto:${MAIL}?subject=${enc(a.biz.subject)}">${MAIL}</a>
    </div>
  </div>
</section>

${ctaBand(l)}
`;
  return page(l, 'areas', main, { scripts: '<script src="/assets/areas.js" defer></script>\n' });
}

/* ---------------- domande ---------------- */
function faq(l) {
  const c = C[l], f = c.faq;
  const main = `
${pageHead(f.eyebrow, f.h1)}

<section class="sec" id="elenco-domande" aria-label="${attr(f.eyebrow)}">
  <div class="wrap">
    <div class="faq">
${f.items.map(([q, a]) => `      <details><summary>${q}</summary><p>${fill(a, l)}</p></details>`).join('\n')}
    </div>
  </div>
</section>

${ctaBand(l)}
`;
  return page(l, 'faq', main);
}

/* ---------------- chi siamo ---------------- */
function about(l) {
  const c = C[l], a = c.about;
  const main = `
${pageHead(a.eyebrow, a.h1)}

<section class="sec" id="team" aria-label="${attr(a.eyebrow)}">
  <div class="wrap">
    <div class="about${PHOTO ? ' with-photo' : ''}">
      <div class="about-text">
${a.paras.map((p, i) => `        <p${i === 0 ? ' class="lead"' : ''}>${p}</p>`).join('\n')}
        <p class="write">${a.write} <a href="mailto:${MAIL}?subject=${enc('Ski Maps')}">${MAIL}</a></p>
      </div>${PHOTO ? `
      <figure class="about-photo"><img src="${PHOTO}" alt="${attr(a.photoAlt)}" width="720" height="900" loading="lazy" decoding="async"></figure>` : ''}
    </div>
  </div>
</section>

${ctaBand(l)}
`;
  return page(l, 'about', main);
}

/* ---------------- scrittura ---------------- */
const out = [];
const write = (file, html) => { mkdirSync(dirname(join(root, file)), { recursive: true }); writeFileSync(join(root, file), html); out.push(file); };
for (const l of LANG_ORDER) {
  write(fileOf(LANGS[l].pages.home), home(l));
  write(fileOf(LANGS[l].pages.how), how(l));
  write(fileOf(LANGS[l].pages.areas), areas(l));
  write(fileOf(LANGS[l].pages.faq), faq(l));
  write(fileOf(LANGS[l].pages.about), about(l));
}

/* pagine legali: solo barra in alto, piè di pagina, link di ritorno e script del menu */
for (const p of LEGAL) {
  const f = join(root, p.file);
  let s = readFileSync(f, 'utf8');
  const urls = { it: LANGS.it.legal[p.key], en: LANGS.en.legal[p.key], de: LANGS.de.pages.home };
  const rep = (re, html, what) => { if (!re.test(s)) throw new Error(`${p.file}: non trovo ${what}`); s = s.replace(re, () => html); };
  rep(/<header class="nav[^"]*" id="nav">[\s\S]*?<\/header>/, header(p.lang, 'privacy', urls), 'la barra in alto');
  rep(/<footer>[\s\S]*?<\/footer>/, footer(p.lang), 'il piè di pagina');
  rep(/<div class="view-nav">[\s\S]*?<\/div><\/div>/, `<div class="view-nav"><div class="wrap">
    <a href="${LANGS[p.lang].pages.home}" class="prev"><small>←</small><b>${C[p.lang].ui.home}</b></a>
  </div></div>`, 'il link di ritorno');
  if (!s.includes('/assets/site.js')) s = s.replace('</body>', '<script src="/assets/site.js" defer></script>\n</body>');
  writeFileSync(f, s);
  out.push(p.file + ' (solo barra e piè di pagina)');
}

/* sitemap */
const urlEntry = (loc, alts) => `  <url>
    <loc>${ORIGIN}${loc}</loc>
${alts.map(([hl, u]) => `    <xhtml:link rel="alternate" hreflang="${hl}" href="${ORIGIN}${u}"/>`).join('\n')}
  </url>`;
const entries = [];
for (const k of PAGE_KEYS) {
  const alts = [...LANG_ORDER.map((l) => [l, LANGS[l].pages[k]]), ['x-default', LANGS.it.pages[k]]];
  for (const l of LANG_ORDER) entries.push(urlEntry(LANGS[l].pages[k], alts));
}
for (const key of ['privacy', 'delete']) {
  const alts = [['it', LANGS.it.legal[key]], ['en', LANGS.en.legal[key]], ['x-default', LANGS.it.legal[key]]];
  entries.push(urlEntry(LANGS.it.legal[key], alts), urlEntry(LANGS.en.legal[key], alts));
}
writeFileSync(join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`);
out.push('sitemap.xml');
if (missingShots.size) out.push(`(schermate che mancano in assets/shots/, quindi non mostrate: ${[...missingShots].join(', ')})`);
console.log('Generati:\n  ' + out.join('\n  '));
