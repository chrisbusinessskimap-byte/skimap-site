/* I due moduli del sito («avvisami quando esce» e «Per il territorio») passano da qui, sul server di Pages: il telefono parla solo con skimaps.cc
   (nessuna richiesta ad altri domini, la politica dei contenuti resta «solo il sito»). Brevo si chiama da questo lato, con la chiave nei segreti
   del progetto Pages (BREVO_API_KEY), mai nel browser. Niente cookie, niente archivio: la risposta o è JSON (chi ha JavaScript) o è un ritorno
   alla pagina con un'àncora (`#<id>-ok`, `#<id>-invalid`, `#<id>-fail`) che il CSS della pagina mostra con :target.
   L'indirizzo email non finisce mai nei registri. */

export const LANGS = ['it', 'en', 'de', 'fr', 'es'];
export const DEFAULT_TO = 'chris.business.skimap@gmail.com';
const EMAIL_RE = /^[^\s@<>"',;:]{1,64}@[^\s@<>"',;:]{1,190}\.[^\s@<>"',;:]{2,}$/;

export const isEmail = (v) => typeof v === 'string' && v.length <= 254 && EMAIL_RE.test(v.trim());
export const clean = (v, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max) : '');

/* la pagina da cui si torna: un percorso del sito e basta (niente indirizzi esterni, niente `//`) */
export function safeBack(v, fallback = '/') {
  return typeof v === 'string' && /^\/[a-z0-9\-_/]{0,120}$/i.test(v) && !v.includes('//') ? v : fallback;
}
export const safeId = (v) => (typeof v === 'string' && /^[a-z0-9-]{1,40}$/.test(v) ? v : 'modulo');

export function wantsJson(request) {
  return (request.headers.get('Accept') || '').includes('application/json');
}

const NO_STORE = { 'Cache-Control': 'no-store' };

/* code: 'ok' | 'invalid' | 'fail' */
export function reply(request, { code, back, id }) {
  const status = code === 'ok' ? 200 : code === 'invalid' ? 400 : 502;
  if (wantsJson(request)) return new Response(JSON.stringify({ ok: code === 'ok', code }), { status, headers: { 'Content-Type': 'application/json', ...NO_STORE } });
  return new Response(null, { status: 303, headers: { Location: `${back}#${id}-${code}`, ...NO_STORE } });
}

/* Brevo: una chiamata, un esito. `fetchImpl` si sostituisce nei test. */
export async function brevo(env, path, body, fetchImpl = fetch) {
  const res = await fetchImpl(`https://api.brevo.com/v3${path}`, {
    method: 'POST',
    headers: { 'api-key': env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(body),
  });
  let json = null;
  try { json = await res.json(); } catch { /* 204: nessun corpo */ }
  return { status: res.status, json };
}

/* Cloudflare Turnstile, solo se il progetto ha il segreto: senza segreto il controllo è spento (anteprime e prove) */
export async function turnstileOk(env, token, ip, fetchImpl = fetch) {
  if (!env.TURNSTILE_SECRET) return true;
  if (!token) return false;
  const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token });
  if (ip) body.set('remoteip', ip);
  const res = await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  const json = await res.json().catch(() => ({}));
  return json.success === true;
}
