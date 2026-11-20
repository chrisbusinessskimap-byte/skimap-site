/* POST /api/avvisami: «avvisami quando esce su Google Play». Aggiunge l'indirizzo alla lista d'attesa di Brevo (BREVO_WAITLIST_ID) e basta:
   un solo messaggio all'uscita, niente newsletter. Segreti del progetto Pages: BREVO_API_KEY, BREVO_WAITLIST_ID. */
import { LANGS, isEmail, clean, safeBack, safeId, reply, brevo, why } from '../_lib/forms.js';

export async function handle({ request, env }, fetchImpl = fetch) {
  let form;
  try { form = await request.formData(); } catch { return new Response(null, { status: 400, headers: { 'Cache-Control': 'no-store' } }); }
  const lang = LANGS.includes(form.get('lang')) ? form.get('lang') : 'en';
  const back = safeBack(form.get('back'), `/${lang}/`);
  const id = safeId(form.get('id'));
  const done = (code, reason) => reply(request, { code, back, id, reason });

  // trappola per i programmi: un campo che una persona non vede; finto successo, niente iscrizione
  if (clean(form.get('website'), 100)) return done('ok');
  const email = clean(form.get('email'), 254).toLowerCase();
  if (!isEmail(email)) return done('invalid');
  if (!env.BREVO_API_KEY || !env.BREVO_WAITLIST_ID) return done('fail', 'no-secrets');

  try {
    const r = await brevo(env, '/contacts', { email, listIds: [Number(env.BREVO_WAITLIST_ID)], updateEnabled: true }, fetchImpl);
    // 201 creato, 204 aggiornato; «già presente» non è un errore per chi si iscrive due volte
    if (r.status === 201 || r.status === 204 || (r.status === 400 && r.json?.code === 'duplicate_parameter')) return done('ok');
    return done('fail', why(r));
  } catch {
    return done('fail', 'network');
  }
}

export const onRequestPost = (ctx) => handle(ctx);
