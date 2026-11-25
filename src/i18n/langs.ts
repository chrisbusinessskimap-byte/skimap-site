/* Le cinque lingue del sito. L'ordine è quello del selettore e dell'hreflang. */
export const LANGS = ['it', 'en', 'de', 'fr', 'es'] as const;
export type Lang = (typeof LANGS)[number];

export const NAMES: Record<Lang, string> = { it: 'Italiano', en: 'English', de: 'Deutsch', fr: 'Français', es: 'Español' };
export const LOCALES: Record<Lang, string> = { it: 'it_IT', en: 'en_GB', de: 'de_DE', fr: 'fr_FR', es: 'es_ES' };

export const ORIGIN = 'https://skimaps.cc';
export const MAIL = 'chris.business.skimap@gmail.com';

/* Fuori dalle cinque lingue si apre in inglese, come l'app. */
export const FALLBACK: Lang = 'en';

export const isLang = (x: string): x is Lang => (LANGS as readonly string[]).includes(x);

/* L'informativa del sito è quella dell'app (stessa versione e stessa data): un controllo la confronta con
   `CONSENT_VERSION`/`legal.ts` dell'app. Si aggiorna quando `main` riceve una versione nuova. */
export const LEGAL_VERSION = { version: 12, date: '2026-11-30' } as const;
