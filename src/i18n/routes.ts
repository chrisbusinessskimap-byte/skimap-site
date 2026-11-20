/* La tabella delle rotte (A3). Stessa struttura in tutte le lingue, nomi tradotti come oggi
   (`/en/how-it-works/`, `/de/so-funktionierts/`). La parità lavora sugli id di pagina, non sui nomi.
   Nomi fissi, fuori dalle lingue e dalla parità: /download/*, /.well-known/*, /g/* e /scarica. */
import { LANGS, type Lang } from './langs';
import { AREA_VIEWS, bySlug } from '../data/areas';

export type PageId = 'home' | 'how' | 'areas' | 'about' | 'help' | 'sources' | 'privacy' | 'delete' | 'tours' | 'territory';

/* `live: false` = sotto la linea di taglio (4-12): la pagina non si costruisce e la navigazione non la mostra */
export const PAGES: Record<PageId, { live: boolean; slugs: Record<Lang, string> }> = {
  home: { live: true, slugs: { it: '', en: '', de: '', fr: '', es: '' } },
  how: { live: true, slugs: { it: 'come-funziona', en: 'how-it-works', de: 'so-funktionierts', fr: 'comment-ca-marche', es: 'como-funciona' } },
  areas: { live: true, slugs: { it: 'comprensori', en: 'areas', de: 'skigebiete', fr: 'domaines', es: 'zonas' } },
  about: { live: true, slugs: { it: 'chi-siamo', en: 'about', de: 'ueber-uns', fr: 'a-propos', es: 'quienes-somos' } },
  help: { live: true, slugs: { it: 'aiuto', en: 'help', de: 'hilfe', fr: 'aide', es: 'ayuda' } },
  sources: { live: true, slugs: { it: 'fonti-e-licenze', en: 'sources-and-licenses', de: 'quellen-und-lizenzen', fr: 'sources-et-licences', es: 'fuentes-y-licencias' } },
  /* i legali esistono in italiano e in inglese; de, fr, es rimandano all'inglese (A4) */
  privacy: { live: true, slugs: { it: 'privacy', en: 'privacy', de: 'privacy', fr: 'privacy', es: 'privacy' } },
  delete: { live: true, slugs: { it: 'elimina-account', en: 'delete-account', de: 'delete-account', fr: 'delete-account', es: 'delete-account' } },
  tours: { live: false, slugs: { it: 'giri', en: 'tours', de: 'touren', fr: 'circuits', es: 'rutas' } },
  territory: { live: true, slugs: { it: 'territorio', en: 'for-resorts', de: 'fuer-skigebiete', fr: 'pour-les-domaines', es: 'para-las-zonas' } },
};

export const LEGAL_LANGS: Lang[] = ['it', 'en'];
export const hasLegal = (lang: Lang) => LEGAL_LANGS.includes(lang);

/* l'indirizzo di una pagina, sempre con la barra iniziale e finale */
export function path(lang: Lang, page: PageId, area?: string): string {
  const legal = page === 'privacy' || page === 'delete';
  const l = legal && !hasLegal(lang) ? 'en' : lang;
  const slug = PAGES[page].slugs[l];
  const base = `/${l}/${slug ? slug + '/' : ''}`;
  return area ? `${base}${area}/` : base;
}

export const areaPath = (lang: Lang, slug: string) => path(lang, 'areas', slug);

/* tutte le pagine da costruire: { lang, page, area? } */
export interface Entry { lang: Lang; page: PageId; area?: string; url: string }

export function allEntries(): Entry[] {
  const out: Entry[] = [];
  for (const lang of LANGS) {
    for (const [page, def] of Object.entries(PAGES) as [PageId, (typeof PAGES)[PageId]][]) {
      if (!def.live) continue;
      if ((page === 'privacy' || page === 'delete') && !hasLegal(lang)) continue;
      out.push({ lang, page, url: path(lang, page) });
      if (page === 'areas') for (const a of AREA_VIEWS) out.push({ lang, page, area: a.slug, url: path(lang, page, a.slug) });
    }
  }
  return out;
}

/* per l'hreflang e il selettore di lingua: la stessa pagina nelle altre lingue (i legali di de/fr/es non esistono) */
export function alternates(page: PageId, area?: string): { lang: Lang; url: string }[] {
  return LANGS.filter((l) => !((page === 'privacy' || page === 'delete') && !hasLegal(l))).map((l) => ({ lang: l, url: path(l, page, area) }));
}

export { bySlug };
