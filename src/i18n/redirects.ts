/* La tabella dei reindirizzamenti (A3): ogni indirizzo che il sito di oggi serve risponde ancora, e la destinazione risponde 200.
   Qui ci sono i 19 indirizzi della sitemap di oggi. `/` (italiano di oggi) è ora la pagina di scelta della lingua, che resta 200.
   I quattro legali `.html` NON sono 301 ma riscritture (200): Play ha in scheda `/privacy.html` e `/elimina-account.html`
   e non voglio dipendere da come il suo controllo tratta un reindirizzamento (prudenza, non provato). */
import { path } from './routes';

export interface Rule { from: string; to: string; status: 200 | 301 }

/* gli indirizzi di oggi che si spostano o si riscrivono */
export const REDIRECTS: Rule[] = [
  { from: '/come-funziona/', to: path('it', 'how'), status: 301 },
  { from: '/aree/', to: path('it', 'areas'), status: 301 },
  { from: '/domande/', to: path('it', 'help'), status: 301 },
  { from: '/chi-siamo/', to: path('it', 'about'), status: 301 },
  { from: '/en/faq/', to: path('en', 'help'), status: 301 },
  { from: '/de/fragen/', to: path('de', 'help'), status: 301 },
  { from: '/privacy.html', to: path('it', 'privacy'), status: 200 },
  { from: '/elimina-account.html', to: path('it', 'delete'), status: 200 },
  { from: '/en/privacy.html', to: path('en', 'privacy'), status: 200 },
  { from: '/en/delete-account.html', to: path('en', 'delete'), status: 200 },
];

/* i 19 indirizzi di oggi (sitemap del 16-11) e dove devono finire: 'same' = stesso indirizzo, ancora 200 */
export const OLD_URLS: { url: string; expect: 'same' | 'redirect' | 'rewrite' }[] = [
  { url: '/', expect: 'same' },
  { url: '/come-funziona/', expect: 'redirect' },
  { url: '/aree/', expect: 'redirect' },
  { url: '/domande/', expect: 'redirect' },
  { url: '/chi-siamo/', expect: 'redirect' },
  { url: '/en/', expect: 'same' },
  { url: '/en/how-it-works/', expect: 'same' },
  { url: '/en/areas/', expect: 'same' },
  { url: '/en/faq/', expect: 'redirect' },
  { url: '/en/about/', expect: 'same' },
  { url: '/de/', expect: 'same' },
  { url: '/de/so-funktionierts/', expect: 'same' },
  { url: '/de/skigebiete/', expect: 'same' },
  { url: '/de/fragen/', expect: 'redirect' },
  { url: '/de/ueber-uns/', expect: 'same' },
  { url: '/privacy.html', expect: 'rewrite' },
  { url: '/elimina-account.html', expect: 'rewrite' },
  { url: '/en/privacy.html', expect: 'rewrite' },
  { url: '/en/delete-account.html', expect: 'rewrite' },
];

/* le ancore della vecchia home (oggi girate da assets/site.js) → pagina nuova; le legge uno script inline della home e della scelta lingua */
export const OLD_HASHES: Record<string, { page: 'how' | 'areas' | 'help' | 'privacy' | 'delete'; hash?: string }> = {
  giro: { page: 'how' }, 'come-funziona': { page: 'how' }, funzioni: { page: 'how' }, pensata: { page: 'how' },
  dove: { page: 'areas' }, mondo: { page: 'areas' }, pilot: { page: 'areas' }, motore: { page: 'areas' }, impianti: { page: 'areas' },
  domande: { page: 'help' }, fiducia: { page: 'how', hash: 'privacy' }, beta: { page: 'how' },
  privacy: { page: 'privacy' }, 'elimina-account': { page: 'delete' }, 'delete-account': { page: 'delete' },
};

export const toRedirectsFile = (): string =>
  [
    '# Generato da src/i18n/redirects.ts (astro.config.mjs): non modificare a mano.',
    ...REDIRECTS.map((r) => `${r.from} ${r.to} ${r.status}`),
    '',
  ].join('\n');
