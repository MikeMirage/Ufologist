const test = require('node:test');
const assert = require('node:assert/strict');
const model = require('../js/monitor-model.js');

const NOW = new Date('2026-10-30T12:00:00Z');
const recent = { id: 'new', sourceId: 'nasa', title: 'Observación y método', category: 'uap', publishedAt: '2026-10-29T12:00:00Z', observedAt: '1947-06-24', ingestedAt: NOW.toISOString() };
const old = { id: 'old', sourceId: 'archive', title: 'Archivo histórico', category: 'uap', publishedAt: '2020-04-27T00:00:00Z', observedAt: '2004-11-14', ingestedAt: NOW.toISOString() };
const context = { id: 'sky', sourceId: 'nasa', title: 'El cielo de noviembre', category: 'sky-context', publishedAt: '2026-10-30T10:00:00Z' };

test('period uses publication date, never observation or ingestion date', () => {
  assert.deepEqual(model.filterItems([old, recent], { period: '7', now: NOW }).map(x => x.id), ['new']);
  assert.equal(old.publishedAt, '2020-04-27T00:00:00Z');
  assert.equal(old.observedAt, '2004-11-14');
});

test('empty source selection means no results and omitted selection means all', () => {
  assert.equal(model.filterItems([recent, old], { sourceIds: [], now: NOW }).length, 0);
  assert.equal(model.filterItems([recent, old], { sourceIds: new Set(), now: NOW }).length, 0);
  assert.equal(model.filterItems([recent, old], { now: NOW }).length, 2);
  assert.deepEqual(model.filterItems([recent, old], { sourceIds: ['archive'], now: NOW }).map(x => x.id), ['old']);
});

test('query ignores accents and category keeps sky context separate', () => {
  assert.equal(model.filterItems([recent], { query: 'observacion METODO', now: NOW }).length, 1);
  assert.equal(model.filterItems([recent, context], { category: 'uap', now: NOW }).length, 1);
  assert.equal(model.filterItems([recent, context], { category: 'sky-context', now: NOW })[0].id, 'sky');
});

test('future records do not appear as published updates', () => {
  const future = { ...recent, id: 'future', publishedAt: '2027-01-01T00:00:00Z' };
  assert.deepEqual(model.filterItems([future, recent], { period: 'all', now: NOW }).map(x => x.id), ['new']);
});

test('cases retain their observation date and never acquire a publication date', () => {
  const input = [{ id: 'case', name: 'Caso de prueba', date: '2004-11-14', lat: 31, lng: -117.6, loc: 'Pacífico', sources: [['Oficial', 'https://www.nasa.gov/report'], ['No seguro', 'javascript:alert(1)']] }];
  const result = model.normalizeCases(input);
  assert.equal(result[0].publishedAt, null);
  assert.equal(result[0].observedAt, '2004-11-14');
  assert.equal(result[0].location.precision, 'approximate');
  assert.equal(result[0].sources.length, 1);
  assert.equal(result[0].sources[0].kind, 'primary');
  assert.equal(input[0].kind, undefined);
});

test('invalid coordinates stay unmapped, duplicate IDs do not duplicate cases', () => {
  const result = model.normalizeCases([{ id: 'bad', lat: null, lng: null }, { id: 'range', lat: 91, lng: 0 }, { id: 'empty', lat: ' ', lng: '' }, { id: 'bad', lat: 2, lng: 2 }]);
  assert.equal(result.length, 3);
  assert.equal(result[0].location, null);
  assert.equal(result[1].location, null);
  assert.equal(result[2].location, null);
});

test('URL validation rejects active protocols, credentials and control characters', () => {
  for (const value of ['javascript:alert(1)', 'data:text/html,x', '//example.com', 'https://user:password@example.com', 'https://example.com\n']) assert.equal(model.safeURL(value), null);
  assert.equal(model.safeURL('https://example.com/source'), 'https://example.com/source');
  assert.equal(model.sourceKind('https://www.nasa.gov.evil.test/source'), 'reference');
  assert.equal(model.sourceKind('https://www.cnes-geipan.fr/source'), 'primary');
});

test('canonical URL strips tracking without deleting meaningful parameters', () => {
  assert.equal(model.canonicalURL('https://example.com/read?id=3&utm_source=feed#part'), 'https://example.com/read?id=3');
});

test('old content does not make a successfully checked source unhealthy', () => {
  const health = model.sourceHealth({ status: 'ok', checkedAt: NOW.toISOString(), lastSuccessAt: NOW.toISOString(), lastPublishedAt: '2025-05-20T00:00:00Z' }, { now: NOW });
  assert.equal(health.status, 'ok');
  assert.equal(health.lastPublishedAt, '2025-05-20T00:00:00Z');
  assert.ok(health.lastPublicationAgeMs > 300 * model.DAY);
});

test('failed source keeps last successful and publication dates visible', () => {
  const source = { status: 'error', checkedAt: NOW.toISOString(), lastSuccessAt: '2026-10-29T00:00:00Z', lastPublishedAt: '2026-10-16T00:00:00Z' };
  const health = model.sourceHealth(source, { now: NOW });
  assert.equal(health.status, 'error');
  assert.equal(health.lastSuccessAt, source.lastSuccessAt);
  assert.equal(health.isStale, true);
  assert.equal(health.lastPublishedAt, source.lastPublishedAt);
  assert.equal(model.sourceHealth({ status: 'manual' }, { now: NOW }).status, 'manual');
});

test('stale successful copies are marked independently of published dates', () => {
  assert.equal(model.sourceHealth({ status: 'ok', lastSuccessAt: '2026-10-29T00:00:00Z' }, { now: NOW }).status, 'stale');
});

test('state roundtrip preserves no-source filter and selected case', () => {
  const state = { view: 'atlas', spatial: 'globe', period: 'all', query: 'Observación & NASA', category: 'uap', sources: [], selectedId: 'nimitz-2004', selectedKind: 'case' };
  assert.deepEqual(model.readState(model.writeState(state)), state);
  assert.equal(model.readState('#view=monitor').sources, null);
  assert.deepEqual(model.readState('#view=monitor&sources=').sources, []);
});

test('spatial state defaults to globe for old links and invalid modes', () => {
  assert.equal(model.DEFAULT_STATE.spatial, 'globe');
  assert.equal(model.normalizeState({}).spatial, 'globe');
  assert.equal(model.readState('#view=atlas&id=nimitz-2004&kind=case').spatial, 'globe');
  for (const spatial of ['', 'invalid', '3d', 'MAP', null]) {
    assert.equal(model.normalizeState({ spatial }).spatial, 'globe');
    assert.equal(model.readState('#spatial=' + encodeURIComponent(spatial)).spatial, 'globe');
  }
});

test('2D map deep links restore search, selected case and all filters', () => {
  const state = { view: 'atlas', spatial: 'map', period: '7', query: 'Observación & NASA', category: 'uap', sources: ['nasa', 'archive'], selectedId: 'nimitz-2004', selectedKind: 'case' };
  const hash = model.writeState(state);
  assert.equal(new URLSearchParams(hash.slice(1)).get('spatial'), 'map');
  assert.deepEqual(model.readState('https://example.com/' + hash), state);
});

test('switching from map to globe removes the override without losing selection', () => {
  const map = model.readState('#view=atlas&spatial=map&q=Nimitz&id=nimitz-2004&kind=case&sources=');
  const globe = { ...map, spatial: 'globe' };
  const hash = model.writeState(globe);
  assert.equal(new URLSearchParams(hash.slice(1)).has('spatial'), false);
  assert.deepEqual(model.readState(hash), globe);
  assert.deepEqual(model.readState(model.writeState({ ...globe, spatial: 'map' })), map);
});

test('state validation rejects unknown surfaces and serializes source filters', () => {
  const state = model.readState('https://example.com/#view=unknown&period=bad&sources=nasa,archive,nasa&kind=script&id=x');
  assert.equal(state.view, 'monitor');
  assert.equal(state.period, '30');
  assert.equal(state.selectedKind, null);
  assert.deepEqual(state.sources, ['nasa', 'archive']);
});

test('date-only formatting stays in the recorded day and invalid dates are explicit', () => {
  assert.equal(model.timestamp('2026-02-31'), null);
  assert.equal(model.timestamp('2026-02-31T12:00:00Z'), null);
  assert.equal(model.timestamp('2026-10-30T22:00:00'), null);
  assert.match(model.formatDate('2004-11-14'), /14/);
  assert.equal(model.formatDate('nonsense'), 'Fecha no disponible');
  assert.equal(model.relativeTime('2026-10-30T11:30:00Z', { now: NOW }), 'Hace 30 min');
});

test('archive categories survive switching visualizations and deep-link reloads independently of feed filters', () => {
  const state = model.normalizeState({ view: 'atlas', spatial: 'map', period: '7', sources: ['nasa'], category: 'sky-context', query: 'Avistamiento', caseFilters: { source: 'nuforc', shape: 'triangle', classification: 'D', country: 'United States', geo: 'locality', from: 1947, to: 2014 } });
  assert.deepEqual(model.readState(model.writeState(state)), state);
  const globe = { ...state, spatial: 'globe' };
  assert.deepEqual(model.readState(model.writeState(globe)), globe);
  assert.equal(model.readState(model.writeState(globe)).caseFilters.shape, 'triangle');
  assert.deepEqual(model.normalizeCaseFilters({ source: 'all', type: '', from: '', to: 'NaN' }), {});
  assert.deepEqual(model.normalizeCaseFilters({ from: '1947', to: '2101', geo: 'country' }), { geo: 'country', from: 1947 });
});

test('legacy case permalinks work for archive IDs that load asynchronously', () => {
  const state = model.readState('#case=uk_mod%3Ab0d46846eea9');
  assert.equal(state.view, 'atlas');
  assert.equal(state.selectedKind, 'case');
  assert.equal(state.selectedId, 'uk_mod:b0d46846eea9');
  assert.deepEqual(model.readState(model.writeState(state)), state);
});
