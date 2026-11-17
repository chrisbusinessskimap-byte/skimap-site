/* La forma del contenuto: una sola per tutte e cinque le lingue. Se una lingua manca di un campo, tsc/astro check lo dice
   (è la prima parte del controllo di parità; la seconda guarda le pagine costruite). I campi `html` possono contenere
   <span data-claim="id"> (una frase-promessa, voce in claims.json) e <a>; sono testi nostri, non di terzi. */
import type { Lang } from '../i18n/langs';
import type { Group } from '../data/areas';

export type Hour = 'alba' | 'mezzogiorno' | 'tramonto' | 'notte';
export type Where = 'trentino' | 'piedmont' | 'aosta-piedmont' | 'lombardy' | 'abruzzo' | 'veneto-trentino-southtyrol';
export type Screen = 'percorsi' | 'guida' | 'rientro';

export interface Meta { title: string; description: string }

export interface Content {
  lang: Lang;
  /* gli stessi percorsi nelle altre lingue li dà src/i18n/routes.ts */
  ui: {
    skip: string; menu: string; close: string; language: string; homeAria: string; mainNav: string;
    download: string;
    nav: { how: string; areas: string; tours: string; territory: string; about: string; help: string };
    store: { play: string; soon: string; ios: string };
    wait: { label: string; ph: string; send: string; note: string; privacy: string; ok: string; invalid: string; fail: string };
    example: string;
    hours: Record<Hour, { name: string; time: string; alt: string }>;
    pickerLabel: string;
    footer: {
      product: string; areas: string; app: string; legal: string;
      privacy: string; deleteAccount: string; sources: string; languages: string;
      notAffiliated: string; credits: string; reliefCredit: string; copyright: string; legalNote: string;
    };
    breadcrumbHome: string; seeAll: string; goToArea: string; photoBy: string; photoCrop: string;
  };
  chooser: { title: string; description: string; h1: string; pick: string };
  home: {
    meta: Meta; eyebrow: string; h1: string; lede: string;
    phoneAlt: string; heroAlt: string;
    moments: { eyebrow: string; h: string; lede: string; items: { time: string; title: string; text: string; screen: Screen; alt: string }[] };
    areas: { eyebrow: string; h: string; lede: string; mapAria: string; all: string; groups: Record<Group, string> };
    cta: { h: string; p: string };
  };
  how: {
    meta: Meta; eyebrow: string; h1: string[]; lede: string; toc: string; exampleNote: string;
    chapters: { id: string; title: string; text: string; screen?: Screen; alt?: string; example?: string }[];
    privacyList: string[]; privacyMore: string;
  };
  areas: {
    meta: Meta; eyebrow: string; h1: string; lede: string; filterLabel: string; operators: { h: string; p: string; cta: string };
    where: Record<Where, string>; statKm: string; statLifts: string; statTop: string; statZones: string;
    note: string;
  };
  area: {
    metaTitle: string; metaDescription: string; /* {name} {km} {lifts} */
    km: string; lifts: string; top: string; zones: string;
    download: string; subnav: { zones: string; app: string; reach: string }; zonesTitle: string; zonesSingle: string;
    appTitle: string; appPackZones: string; appPackSingle: string; appReturn: string; appBus: string;
    reachTitle: string; reach: { car: [string, string]; train: [string, string]; plane: [string, string] };
    numbersNote: string; notAffiliated: string;
  };
  about: { meta: Meta; eyebrow: string; h1: string; paras: string[]; photoAlt: string; write: string };
  help: { meta: Meta; eyebrow: string; h1: string; lede: string; items: { q: string; a: string }[] };
  sources: {
    meta: Meta; eyebrow: string; h1: string; lede: string;
    osmTitle: string; osm: string; reliefTitle: string; relief: string;
    fontsTitle: string; fonts: string; photosTitle: string; photos: string; appTitle: string; app: string; todo: string;
  };
  territory: {
    meta: Meta; eyebrow: string; h1: string; lede: string;
    blocks: { h: string; p: string }[];
    form: {
      title: string; name: string; namePh: string; org: string; orgPh: string; mail: string; mailPh: string; area: string; areaPh: string; msg: string; msgPh: string;
      consent: string; send: string; note: string; turnstile: string; ok: string; invalid: string; fail: string;
    };
  };
  legal: { privacy: Meta; delete: Meta; other: string };
  download: {
    title: string; h1: string; lede: string; play: string; soon: string; ios: string; openApp: string; openAppNote: string;
    weight: string; weightNote: string; needApp: string; back: string; qr: string;
  };
  notFound: { title: string; h1: string; text: string; back: string };
}
