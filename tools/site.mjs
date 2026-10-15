/* Mappa del sito: lingue, pagine e indirizzi. La usano tools/build.mjs e tools/check.mjs. */

export const ORIGIN = 'https://skimaps.cc';
export const MAIL = 'chris.business.skimap@gmail.com';

/* Segnaposto per i fatti non ancora confermati: in anteprima locale si vede evidenziato,
   ma la pubblicazione si ferma finché ne resta uno (check.mjs --release nel workflow).
   Le domande aperte stanno in docs/DA_CONFERMARE.md. */
export const todo = (q) => `<span class="todo">[DA CONFERMARE: ${q}]</span>`;

/* Indirizzi (sempre con la barra iniziale) delle pagine generate, per lingua.
   Le pagine legali sono scritte a mano: il tedesco rimanda a quelle inglesi. */
export const LANGS = {
  it: {
    pages: { home: '/', how: '/come-funziona/', areas: '/aree/', faq: '/domande/', about: '/chi-siamo/' },
    legal: { privacy: '/privacy.html', delete: '/elimina-account.html', sources: '/privacy.html#fonti' },
  },
  en: {
    pages: { home: '/en/', how: '/en/how-it-works/', areas: '/en/areas/', faq: '/en/faq/', about: '/en/about/' },
    legal: { privacy: '/en/privacy.html', delete: '/en/delete-account.html', sources: '/en/privacy.html#sources' },
  },
  de: {
    pages: { home: '/de/', how: '/de/so-funktionierts/', areas: '/de/skigebiete/', faq: '/de/fragen/', about: '/de/ueber-uns/' },
    legal: { privacy: '/en/privacy.html', delete: '/en/delete-account.html', sources: '/en/privacy.html#sources' },
  },
};
export const LANG_ORDER = ['it', 'en', 'de'];
export const PAGE_KEYS = ['home', 'how', 'areas', 'faq', 'about'];

/* Pagine legali scritte a mano (testo non generato): build.mjs aggiorna solo barra in alto e piè di pagina. */
export const LEGAL = [
  { file: 'privacy.html', lang: 'it', key: 'privacy', pair: 'en/privacy.html' },
  { file: 'elimina-account.html', lang: 'it', key: 'delete', pair: 'en/delete-account.html' },
  { file: 'en/privacy.html', lang: 'en', key: 'privacy', pair: 'privacy.html' },
  { file: 'en/delete-account.html', lang: 'en', key: 'delete', pair: 'elimina-account.html' },
];

/* "/come-funziona/" → "come-funziona/index.html" */
export const fileOf = (url) => (url.endsWith('/') ? url + 'index.html' : url).replace(/^\//, '');

/* Tutte le pagine HTML del sito, per i controlli. */
export const ALL_FILES = [
  ...LANG_ORDER.flatMap((l) => PAGE_KEYS.map((k) => fileOf(LANGS[l].pages[k]))),
  ...LEGAL.map((p) => p.file),
];
