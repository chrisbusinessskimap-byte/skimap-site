/* `/` per lingua (A3). Cloudflare Pages Function, solo sull'indirizzo «/».
   Chi manda `Accept-Language` va alla sua lingua fra le cinque (302, `Vary: Accept-Language`, mai in cache condivisa);
   fuori dalle cinque, all'inglese, come l'app. Chi non lo manda (motori di ricerca, richieste senza intestazione) vede la pagina
   di scelta della lingua, che è anche l'`x-default` dell'hreflang. */
const SUPPORTED = ['it', 'en', 'de', 'fr', 'es'];

/* l'intestazione → la prima lingua supportata per peso (q); null se manca; 'en' se nessuna delle cinque */
export function pickLanguage(header) {
  if (!header || !header.trim()) return null;
  const items = header
    .split(',')
    .map((part, i) => {
      const [tag, ...params] = part.trim().split(';');
      const q = params.map((p) => /^\s*q=([\d.]+)/.exec(p)).find(Boolean);
      return { lang: tag.trim().toLowerCase().slice(0, 2), q: q ? parseFloat(q[1]) : 1, i };
    })
    .filter((x) => x.lang && x.lang !== '*' && x.q > 0)
    .sort((a, b) => b.q - a.q || a.i - b.i);
  return items.find((x) => SUPPORTED.includes(x.lang))?.lang ?? 'en';
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.pathname !== '/') return context.next();
  const lang = pickLanguage(context.request.headers.get('Accept-Language'));
  if (!lang) return context.next();
  return new Response(null, {
    status: 302,
    headers: { Location: `/${lang}/${url.hash}`, Vary: 'Accept-Language', 'Cache-Control': 'private, no-store' },
  });
}
