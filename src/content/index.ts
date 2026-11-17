/* Il contenuto per lingua. Un modulo solo, così le pagine non importano a mano ogni lingua. */
import type { Lang } from '../i18n/langs';
import type { Content } from './types';
import it from './it';
import en from './en';
import de from './de';
import fr from './fr';
import es from './es';

export const CONTENT: Record<Lang, Content> = { it, en, de, fr, es };
export const t = (lang: Lang): Content => CONTENT[lang];

/* {chiave} nei testi → valore; {privacy} e {delete} sono gli indirizzi delle pagine legali nella lingua */
export const fill = (s: string, vars: Record<string, string | number>): string =>
  s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
