/* I comprensori del sito. Una tabella sola per i tre nomi della stessa cosa (A12):
     id del manifest (`superski`, anche `<id>` in /download/<id>) · nome della pagina (`dolomiti-superski`) · nome mostrato.
   I numeri vengono dal manifest (src/data/manifest.snapshot.json, copia di R2 aggiornata da `npm run manifest`),
   con UNA regola: i chilometri si arrotondano per difetto all'intero, la quota massima per difetto alle centinaia e si
   scrive «3.100+ m» (il modello del terreno smussa le cime: così resta vera). */
import snapshot from './manifest.snapshot.json';
import type { Lang } from '../i18n/langs';

export type Group = 'dolomiti' | 'western-alps' | 'lombardy' | 'apennines';

export interface AreaDef {
  id: string;
  slug: string;
  name: string;
  group: Group;
  /* 'region' = chiave della riga «dove» nel contenuto */
  where: 'trentino' | 'piedmont' | 'aosta-piedmont' | 'lombardy' | 'abruzzo' | 'veneto-trentino-southtyrol';
  /* peso massimo del pacchetto pista in MB: l'obiettivo del piano (sez. 5), non una misura (da verificare, claim `peso-pacchetto`) */
  packMaxMB: number;
  /* le zone di un comprensorio ufficiale (solo dove il sito le elenca) */
  zones?: string[];
}

export const AREAS: AreaDef[] = [
  {
    id: 'superski', slug: 'dolomiti-superski', name: 'Dolomiti Superski', group: 'dolomiti', where: 'veneto-trentino-southtyrol', packMaxMB: 100,
    zones: ['Cortina d’Ampezzo', 'Plan de Corones', 'Alta Badia', 'Val Gardena · Alpe di Siusi', 'Val di Fassa · Carezza', 'Arabba · Marmolada', 'Tre Cime Dolomiti', 'Val di Fiemme · Obereggen', 'San Martino · Passo Rolle', 'Valle Isarco', 'Alpe Lusia · San Pellegrino', 'Civetta'],
  },
  { id: 'vialattea', slug: 'vialattea', name: 'Vialattea', group: 'western-alps', where: 'piedmont', packMaxMB: 25 },
  { id: 'skirama', slug: 'skirama-dolomiti', name: 'Skirama Dolomiti', group: 'dolomiti', where: 'trentino', packMaxMB: 75 },
  { id: 'monterosa', slug: 'monterosa-ski', name: 'Monterosa Ski', group: 'western-alps', where: 'aosta-piedmont', packMaxMB: 40 },
  { id: 'livigno', slug: 'livigno', name: 'Livigno', group: 'lombardy', where: 'lombardy', packMaxMB: 25 },
  { id: 'altosangro', slug: 'alto-sangro', name: 'Alto Sangro', group: 'apennines', where: 'abruzzo', packMaxMB: 25 },
  { id: 'campofelice', slug: 'campo-felice', name: 'Campo Felice', group: 'apennines', where: 'abruzzo', packMaxMB: 25 },
  { id: 'ovindoli', slug: 'ovindoli', name: 'Ovindoli', group: 'apennines', where: 'abruzzo', packMaxMB: 25 },
];

export const GROUPS: Group[] = ['dolomiti', 'western-alps', 'lombardy', 'apennines'];

interface Resort {
  id: string; name: string; pistesKm: number | null; lifts: number | null; summitM: number | null; zones: string[];
  photo: null | { file: string; width: number; height: number; author: string; license: string; licenseUrl: string; sourceUrl: string; modified: boolean };
}
const resorts = (snapshot as { resorts: Record<string, Resort> }).resorts;

export const MANIFEST_DATE = (snapshot as { generatedAt: string }).generatedAt.slice(0, 10);

export interface AreaView extends AreaDef {
  km: number; lifts: number; topM: number; zoneCount: number;
  photo: NonNullable<Resort['photo']>;
}

export function areaView(a: AreaDef): AreaView {
  const r = resorts[a.id];
  if (!r || r.pistesKm == null || r.lifts == null || r.summitM == null || !r.photo) throw new Error(`manifest incompleto per ${a.id}`);
  return {
    ...a,
    km: Math.floor(r.pistesKm),
    lifts: r.lifts,
    topM: Math.floor(r.summitM / 100) * 100,
    zoneCount: a.zones ? a.zones.length : r.zones.length,
    photo: r.photo,
  };
}

export const AREA_VIEWS: AreaView[] = AREAS.map(areaView);
export const bySlug = (slug: string) => AREA_VIEWS.find((a) => a.slug === slug);
export const byId = (id: string) => AREA_VIEWS.find((a) => a.id === id);

/* 3.100+ m: il separatore delle migliaia cambia con la lingua */
export function fmtTop(m: number, lang: Lang): string {
  /* it e de il punto, en la virgola, fr lo spazio stretto; es scrive i numeri di quattro cifre attaccati (RAE) */
  const sep = lang === 'en' ? ',' : lang === 'fr' ? ' ' : lang === 'es' ? '' : '.';
  const s = String(m).replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  return `${s}+ m`;
}
