import test from 'node:test';
import assert from 'node:assert/strict';
import { pickLanguage, onRequest } from './index.js';

test('la lingua del browser fra le cinque', () => {
  assert.equal(pickLanguage('it-IT,it;q=0.9,en;q=0.8'), 'it');
  assert.equal(pickLanguage('de-CH, fr;q=0.8'), 'de');
  assert.equal(pickLanguage('fr;q=0.4, es;q=0.9'), 'es');
  assert.equal(pickLanguage('en-GB'), 'en');
});
test('fuori dalle cinque si apre in inglese, come l\'app', () => {
  assert.equal(pickLanguage('nl-NL,nl;q=0.9'), 'en');
  assert.equal(pickLanguage('*'), 'en');
});
test('senza intestazione resta la pagina di scelta della lingua', async () => {
  assert.equal(pickLanguage(''), null);
  assert.equal(pickLanguage(null), null);
  let passed = false;
  const res = await onRequest({ request: new Request('https://skimaps.cc/'), next: async () => { passed = true; return new Response('scelta'); } });
  assert.ok(passed);
  assert.equal(await res.text(), 'scelta');
});
test('con l\'intestazione: 302 verso la lingua, Vary e niente cache condivisa', async () => {
  const res = await onRequest({ request: new Request('https://skimaps.cc/', { headers: { 'Accept-Language': 'de-DE,de;q=0.9' } }), next: async () => new Response('no') });
  assert.equal(res.status, 302);
  assert.equal(res.headers.get('Location'), '/de/');
  assert.equal(res.headers.get('Vary'), 'Accept-Language');
  assert.match(res.headers.get('Cache-Control'), /no-store/);
});
test('le altre pagine non si toccano', async () => {
  const res = await onRequest({ request: new Request('https://skimaps.cc/it/', { headers: { 'Accept-Language': 'de' } }), next: async () => new Response('avanti') });
  assert.equal(await res.text(), 'avanti');
});
