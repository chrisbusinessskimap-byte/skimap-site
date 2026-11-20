/* POST /api/territorio: il modulo «Per il territorio». Manda un messaggio alla casella di Christian (TERRITORY_TO, di partenza la stessa del sito),
   con la risposta indirizzata a chi ha scritto. Brevo è solo il mezzo di invio (posta transazionale), non tiene una lista.
   Segreti del progetto Pages: BREVO_API_KEY, MAIL_FROM (un mittente verificato su skimaps.cc); facoltativi: TERRITORY_TO, TURNSTILE_SECRET. */
import { LANGS, DEFAULT_TO, isEmail, clean, safeBack, safeId, reply, brevo, turnstileOk, why } from '../_lib/forms.js';

export async function handle({ request, env }, fetchImpl = fetch) {
  let form;
  try { form = await request.formData(); } catch { return new Response(null, { status: 400, headers: { 'Cache-Control': 'no-store' } }); }
  const lang = LANGS.includes(form.get('lang')) ? form.get('lang') : 'en';
  const back = safeBack(form.get('back'), `/${lang}/`);
  const id = safeId(form.get('id'));
  const done = (code, reason) => reply(request, { code, back, id, reason });

  if (clean(form.get('website'), 100)) return done('ok');
  const name = clean(form.get('name'), 120);
  const org = clean(form.get('org'), 160);
  const email = clean(form.get('email'), 254);
  const area = clean(form.get('area'), 160);
  const msg = clean(form.get('msg'), 2000);
  if (!name || !org || !isEmail(email) || !msg) return done('invalid');
  const human = await turnstileOk(env, form.get('cf-turnstile-response'), request.headers.get('CF-Connecting-IP'), fetchImpl).catch(() => false);
  if (!human) return done('invalid');
  if (!env.BREVO_API_KEY || !env.MAIL_FROM) return done('fail', 'no-secrets');

  const text = [`Nome: ${name}`, `Ente: ${org}`, `Email: ${email}`, `Comprensorio: ${area || '—'}`, `Lingua della pagina: ${lang}`, '', msg].join('\n');
  try {
    const r = await brevo(env, '/smtp/email', {
      sender: { email: env.MAIL_FROM, name: 'Sito Ski Maps' },
      to: [{ email: env.TERRITORY_TO || DEFAULT_TO }],
      replyTo: { email, name },
      subject: `Per il territorio: ${org}`.slice(0, 200),
      textContent: text,
    }, fetchImpl);
    return r.status === 201 ? done('ok') : done('fail', why(r));
  } catch {
    return done('fail', 'network');
  }
}

export const onRequestPost = (ctx) => handle(ctx);
