import test from 'node:test';
import assert from 'node:assert/strict';
import { handle as avvisami } from './api/avvisami.js';
import { handle as territorio } from './api/territorio.js';
import { safeBack } from './_lib/forms.js';

const req = (fields, headers = {}) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return new Request('https://skimaps.cc/api/x', { method: 'POST', body: fd, headers });
};
const brevoStub = (status, json = null, calls = []) => async (url, init) => {
  calls.push({ url, init });
  return { status, json: async () => { if (json === null) throw new Error('no body'); return json; } };
};
const ENV = { BREVO_API_KEY: 'k', BREVO_WAITLIST_ID: '7', MAIL_FROM: 'sito@skimaps.cc' };

test('avvisami: indirizzo valido → Brevo, poi ritorno alla pagina con #id-ok', async () => {
  const calls = [];
  const r = await avvisami({ request: req({ email: 'Anna@Example.it', lang: 'it', back: '/it/', id: 'avvisami-hero' }), env: ENV }, brevoStub(201, { id: 1 }, calls));
  assert.equal(r.status, 303);
  assert.equal(r.headers.get('Location'), '/it/#avvisami-hero-ok');
  assert.equal(r.headers.get('Cache-Control'), 'no-store');
  assert.equal(r.headers.get('Set-Cookie'), null);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.brevo.com/v3/contacts');
  const body = JSON.parse(calls[0].init.body);
  assert.deepEqual(body, { email: 'anna@example.it', listIds: [7], updateEnabled: true });
  assert.equal(calls[0].init.headers['api-key'], 'k');
});

test('avvisami: con JavaScript risponde JSON', async () => {
  const r = await avvisami({ request: req({ email: 'a@b.it' }, { Accept: 'application/json' }), env: ENV }, brevoStub(204));
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { ok: true, code: 'ok' });
});

test('avvisami: email non valida, trappola compilata, chiavi mancanti, errore di Brevo, già iscritto', async () => {
  let n = 0;
  const count = async () => { n++; return { status: 201, json: async () => ({}) }; };
  assert.equal((await avvisami({ request: req({ email: 'nonvalida', back: '/en/', id: 'x' }), env: ENV }, count)).headers.get('Location'), '/en/#x-invalid');
  const bot = await avvisami({ request: req({ email: 'a@b.it', website: 'http://spam', back: '/en/', id: 'x' }), env: ENV }, count);
  assert.equal(bot.headers.get('Location'), '/en/#x-ok'); // finto successo
  assert.equal(n, 0, 'né email non valida né trappola chiamano Brevo');
  assert.equal((await avvisami({ request: req({ email: 'a@b.it', back: '/en/', id: 'x' }), env: {} }, count)).headers.get('Location'), '/en/#x-fail');
  assert.equal((await avvisami({ request: req({ email: 'a@b.it', back: '/en/', id: 'x' }), env: ENV }, brevoStub(500, { message: 'x' }))).headers.get('Location'), '/en/#x-fail');
  assert.equal((await avvisami({ request: req({ email: 'a@b.it', back: '/en/', id: 'x' }), env: ENV }, brevoStub(400, { code: 'duplicate_parameter' }))).headers.get('Location'), '/en/#x-ok');
  assert.equal((await avvisami({ request: req({ email: 'a@b.it', back: '/en/', id: 'x' }), env: ENV }, async () => { throw new Error('rete'); })).headers.get('Location'), '/en/#x-fail');
});

test('il ritorno è solo un percorso del sito', async () => {
  assert.equal(safeBack('/it/privacy/'), '/it/privacy/');
  for (const bad of ['https://evil.example/', '//evil.example', '/it/..//x', 'javascript:alert(1)', '/it/<x>', undefined, '']) assert.equal(safeBack(bad, '/'), '/');
  const r = await avvisami({ request: req({ email: 'a@b.it', back: 'https://evil.example/' }), env: ENV }, brevoStub(201));
  assert.equal(r.headers.get('Location'), '/en/#modulo-ok');
});

const GOOD = { name: 'Anna Rossi', org: 'Consorzio Alta Badia', email: 'anna@ente.it', area: 'Alta Badia', msg: 'Vorremmo parlarne.', consent: 'on', lang: 'it', back: '/it/territorio/', id: 'territorio' };

test('territorio: manda la posta a Christian con la risposta a chi ha scritto', async () => {
  const calls = [];
  const r = await territorio({ request: req(GOOD), env: ENV }, brevoStub(201, { messageId: 'm' }, calls));
  assert.equal(r.headers.get('Location'), '/it/territorio/#territorio-ok');
  assert.equal(calls[0].url, 'https://api.brevo.com/v3/smtp/email');
  const body = JSON.parse(calls[0].init.body);
  assert.deepEqual(body.to, [{ email: 'chris.business.skimap@gmail.com' }]);
  assert.deepEqual(body.replyTo, { email: 'anna@ente.it', name: 'Anna Rossi' });
  assert.equal(body.sender.email, 'sito@skimaps.cc');
  assert.match(body.textContent, /Vorremmo parlarne\./);
  assert.match(body.subject, /Consorzio Alta Badia/);
});

test('territorio: servono nome, ente, email valida, messaggio e consenso', async () => {
  const none = async () => { throw new Error('non si deve chiamare'); };
  for (const drop of ['name', 'org', 'msg', 'consent']) {
    const f = { ...GOOD }; delete f[drop];
    assert.equal((await territorio({ request: req(f), env: ENV }, none)).headers.get('Location'), '/it/territorio/#territorio-invalid', drop);
  }
  assert.equal((await territorio({ request: req({ ...GOOD, email: 'x' }), env: ENV }, none)).headers.get('Location'), '/it/territorio/#territorio-invalid');
  assert.equal((await territorio({ request: req({ ...GOOD, consent: 'no' }), env: ENV }, none)).headers.get('Location'), '/it/territorio/#territorio-invalid');
});

test('territorio: con il segreto di Turnstile serve la prova, senza no', async () => {
  const calls = [];
  const stub = async (url, init) => {
    calls.push(url);
    if (String(url).includes('siteverify')) { const ok = String(init.body).includes('response=buono'); return { status: 200, json: async () => ({ success: ok }) }; }
    return { status: 201, json: async () => ({}) };
  };
  const env = { ...ENV, TURNSTILE_SECRET: 's' };
  assert.equal((await territorio({ request: req(GOOD), env }, stub)).headers.get('Location'), '/it/territorio/#territorio-invalid');
  assert.equal((await territorio({ request: req({ ...GOOD, 'cf-turnstile-response': 'cattivo' }), env }, stub)).headers.get('Location'), '/it/territorio/#territorio-invalid');
  assert.equal((await territorio({ request: req({ ...GOOD, 'cf-turnstile-response': 'buono' }), env }, stub)).headers.get('Location'), '/it/territorio/#territorio-ok');
  assert.ok(calls.some((u) => String(u).includes('smtp/email')));
});

test('il rifiuto dice perché, senza email né chiave (solo JSON)', async () => {
  const json = { Accept: 'application/json' };
  const run = async (env, stub) => (await avvisami({ request: req({ email: 'segreta@example.it' }, json), env }, stub)).json();
  assert.deepEqual(await run({}, brevoStub(201)), { ok: false, code: 'fail', reason: 'no-secrets' });
  assert.deepEqual(await run(ENV, brevoStub(401, { code: 'unauthorized', message: 'Key not found' })), { ok: false, code: 'fail', reason: 'brevo-401-unauthorized' });
  assert.deepEqual(await run(ENV, brevoStub(400, { code: 'invalid_parameter' })), { ok: false, code: 'fail', reason: 'brevo-400-invalid_parameter' });
  assert.deepEqual(await run(ENV, async () => { throw new Error('rete'); }), { ok: false, code: 'fail', reason: 'network' });
  const t = await territorio({ request: req({ name: 'A', org: 'B', email: 'a@b.it', msg: 'm', consent: 'on' }, json), env: ENV }, brevoStub(403, { code: 'permission_denied' }));
  assert.deepEqual(await t.json(), { ok: false, code: 'fail', reason: 'brevo-403-permission_denied' });
  assert.ok(!JSON.stringify(await (await avvisami({ request: req({ email: 'segreta@example.it' }, json), env: ENV }, brevoStub(500, { message: 'segreta@example.it k' })) ).json()).includes('segreta'));
});
