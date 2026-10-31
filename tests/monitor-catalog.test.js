const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const C = require('../js/monitor-catalog.js');
const M = require('../js/monitor-model.js');

const root = path.resolve(__dirname, '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const compactNUFORC = read('data/nuforc.json');
const compactGEIPAN = read('data/geipan.json');
const compactOfficial = read('data/official-cases.json');
const curated = vm.runInNewContext(fs.readFileSync(path.join(root, 'js/data.js'), 'utf8') + ';CASES;', {});
const nu = C.normalizeNUFORC(compactNUFORC);
const ge = C.normalizeGEIPAN(compactGEIPAN);
const official = C.normalizeOfficial(compactOfficial);
const all = C.mergeCatalog(M.normalizeCases(curated), nu, ge, official);

test('restores the complete historical corpus, with a unique selectable ID for every record', () => {
  assert.equal(nu.length, 80332);
  assert.equal(ge.length, 2677);
  assert.equal(official.length, 3799);
  assert.equal(all.length, 86919);
  assert.equal(new Set(all.map(item => item.id)).size, all.length);
  assert.equal(C.createIndex(all).byId.size, all.length);
  assert.deepEqual(C.createIndex(all).counts, {
    ufologist_curated: 111, nuforc: 80332, geipan: 2677,
    chile_sefaa: 53, uk_mod: 2704, argentina_ciae: 428, nara_uap: 574, spain_defensa: 40,
  });
});

test('preserves all NUFORC shapes, local times, locations and legacy marker IDs without deduplicating reports', () => {
  const counts = {};
  for (let i = 0; i < nu.length; i++) {
    const item = nu[i], [d, h, lat, lng, s, place] = compactNUFORC.rows[i];
    assert.equal(item.legacyId, `nuforc:${d}:${h}:${lat}:${lng}:${s}`);
    assert.equal(item.shape, compactNUFORC.shapes[s]);
    assert.equal(item.location.lat, lat);
    assert.equal(item.location.lng, lng);
    assert.equal(item.location.label, place);
    assert.equal(item.hour, h >= 0 && h <= 23 ? h : null);
    assert.equal(item.provenance.row, i);
    counts[item.shape] = (counts[item.shape] || 0) + 1;
  }
  assert.deepEqual(counts, { cigar: 3656, light: 17894, orb: 12997, disk: 5217, fireball: 6208, other: 15128, oval: 5242, geometric: 2708, triangle: 8825, formation: 2457 });
  assert.equal(nu.filter(item => item.id !== item.legacyId).length, 1044);
});

test('preserves every GEIPAN classification and original French summary with regional coordinate precision', () => {
  const counts = {};
  ge.forEach((item, i) => {
    const [d, lat, lng, ci, place, summary] = compactGEIPAN.rows[i];
    assert.equal(item.id, `geipan:${d}:${lat}:${lng}:${ci}`);
    assert.equal(item.classification, compactGEIPAN.classes[ci]);
    assert.equal(item.summary, summary);
    assert.equal(item.location.label, place);
    assert.equal(item.location.precision, 'department');
    assert.equal(item.geoQuality, 'regional');
    counts[item.classification] = (counts[item.classification] || 0) + 1;
  });
  assert.deepEqual(counts, { C: 923, D: 118, A: 563, B: 1073 });
});

test('official archive adapters retain source IDs, classifications, review status, precision and direct evidence links', () => {
  official.forEach((item, i) => {
    const original = compactOfficial.rows[i];
    assert.equal(item.legacyId, original.id);
    assert.ok(item.id === original.id || item.id.startsWith(original.id + ':duplicate:'));
    assert.equal(item.sourceId, original.sid);
    assert.equal(item.sourceCaseId, original.sourceCaseId);
    assert.equal(item.summary, original.summary || '');
    assert.equal(item.classification, original.cls || '');
    assert.equal(item.system, original.system || '');
    assert.equal(item.geoPrecision, original.geoPrecision);
    assert.equal(item.geoApprox, original.geoApprox !== false);
    assert.equal(item.needsReview, Boolean(original.needsReview));
    assert.equal(item.provenance.sourceFile, original.sourceFile || '');
    assert.equal(item.sources[0].url, new URL(original.sourceUrl).href);
    assert.equal(item.editorialStatus, 'official-record');
  });
  assert.equal(official.filter(item => item.geoPrecision === 'country').length, 160);
});

test('archive cases never become live publications or inherit fabricated contact types or dates', () => {
  for (const item of [...nu, ...ge, ...official]) {
    assert.equal(item.publishedAt, null);
    assert.notEqual(item.editorialStatus, 'curated');
    assert.equal(item.type, '');
    assert.equal(item.typeInferred, false);
  }
  assert.equal(C.dateFromInt(20260230), null);
  const invalid = C.normalizeNUFORC({ rows: [[20260230, -1, null, null, 0, 'Unknown']] })[0];
  assert.equal(invalid.date, null);
  assert.equal(invalid.originalDate, 20260230);
  assert.equal(invalid.location, null);
  assert.equal(invalid.datetimePrecision, 'date-only');
});

test('filters preserve the full catalogue and combine its original source/shape/classification/year categories', () => {
  assert.equal(C.filterCatalog(all).length, 86919);
  assert.equal(C.filterCatalog(all, { sourceIds: ['nuforc'], shapes: ['triangle'] }).length, 8825);
  assert.equal(C.filterCatalog(all, { sourceIds: ['geipan'], classifications: ['D'] }).length, 118);
  assert.equal(C.filterCatalog(all, { sourceIds: new Set() }).length, 0);
  assert.equal(C.filterCatalog(all, { sourceIds: 'uk_mod' }).length, 2704);
  assert.equal(C.filterCatalog(all, { countries: ['Spain'] }).every(item => item.countryKey === 'Spain'), true);
  assert.ok(C.filterCatalog(all, { geoQualities: ['reported'] }).length >= 201);
  const result = C.filterCatalog(all, { sourceIds: ['nuforc'], yearFrom: 1949, yearTo: 1949, query: 'SAN marcos cigar' });
  assert.ok(result.length >= 1);
  assert.equal(result.every(item => item.year === 1949 && item.shape === 'cigar'), true);
});

test('search includes original categories, evidence source and accent-insensitive case text', () => {
  assert.equal(C.matches(official.find(item => item.sourceId === 'spain_defensa'), 'Espana Defensa'), true);
  assert.equal(C.matches(nu.find(item => item.shape === 'triangle'), 'triangulo'), true);
  assert.equal(C.matches(ge.find(item => item.classification === 'D'), 'inexplicado GEIPAN'), true);
  assert.equal(C.matches(nu[0], 'no-such-place'), false);
});

test('adapters are side-effect free and do not turn invalid source URLs into links', () => {
  const input = Object.freeze({ rows: Object.freeze([Object.freeze({ id: 'test', sid: 'uk_mod', lat: 51, lng: 0, title: 'Test', date: '2001-01-01', geoPrecision: 'country', sourceUrl: 'javascript:alert(1)' })]) });
  const result = C.normalizeOfficial(input)[0];
  assert.equal(input.rows[0].editorialStatus, undefined);
  assert.equal(result.sourceUrl, null);
  assert.equal(result.provenance.linkScope, 'catalog');
  assert.equal(result.sources[0].url, C.SOURCES.find(source => source.id === 'uk_mod').url);
  assert.equal(C.normalizeNUFORC(null).length, 0);
  assert.equal(C.normalizeGEIPAN({}).length, 0);
});

test('restores exactly the original inferred encounter categories for every historical record', () => {
  const legacySource = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
  const staticSource = fs.readFileSync(path.join(root, 'js/data.js'), 'utf8');
  const constants = ['MILITARY_SITES', 'COASTAL_REFERENCE_POINTS'].map(name => {
    const declaration = legacySource.match(new RegExp('const ' + name + ' = \\[[\\s\\S]*?\\n\\];'));
    assert.ok(declaration, name);
    return declaration[0];
  });
  const functions = ['distKm', 'plainText', 'contextText', 'nearMilitarySite', 'nearCoastalReference', 'geoContextTags', 'encounterKey'].map(name => {
    const declaration = legacySource.match(new RegExp('function ' + name + '\\([^]*?\\n\\}'));
    assert.ok(declaration, name);
    return declaration[0];
  });
  const helpers = `
    function hasCoords(d) { return Number.isFinite(d?.lat) && Number.isFinite(d?.lng); }
    function caseName(d) { return d.name; }
    function caseLoc(d) { return d.loc; }
    function caseCountry(d) { return d.country; }
    function caseSummary(d) { return d.summary; }
  `;
  // Execute the real legacy categorizer and dependencies, not a second copy of
  // the new algorithm. No application DOM/startup code is evaluated.
  const legacy = vm.runInNewContext(staticSource + '\n' + constants.join('\n') + '\n' + helpers + '\n' + functions.join('\n') + '\n;({encounterKey, militaryCount:MILITARY_SITES.length});', {});
  assert.equal(legacy.militaryCount, 54);
  const expectedCounts = {};
  function check(original, adapted) {
    const expected = legacy.encounterKey(original);
    assert.equal(adapted.encounterType, expected, adapted.id);
    assert.equal(C.encounterType(adapted), expected, 'normalized helper: ' + adapted.id);
    expectedCounts[expected] = (expectedCounts[expected] || 0) + 1;
  }
  compactNUFORC.rows.forEach(([d, h, lat, lng, s, loc], i) => check({ d, h, lat, lng, s, loc, mass: true }, nu[i]));
  compactGEIPAN.rows.forEach(([d, lat, lng, ci, zone, resume], i) => check({ d, lat, lng, ci, zone, resume, geipan: true }, ge[i]));
  compactOfficial.rows.forEach((row, i) => check({ ...row, official: true }, official[i]));
  const selected = all.filter(item => item.sourceId === 'ufologist_curated');
  curated.forEach((row, i) => check(row, selected[i]));
  for (const [type, count] of Object.entries(expectedCounts)) {
    assert.equal(C.filterCatalog(all, { types: [type] }).length, count, type + ' filter');
  }
  assert.equal(Object.values(expectedCounts).reduce((sum, n) => sum + n, 0), 86919);
});

test('inferred encounter categories remain separate from the original source classification and type', () => {
  for (const item of [...nu, ...ge, ...official]) {
    assert.equal(item.type, '');
    assert.equal(item.encounterInferred, true);
    assert.equal(item.encounterNote, C.ENCOUNTER_INFERENCE_NOTE);
  }
  assert.equal(all.find(item => item.id === curated[0].id).encounterInferred, false);
  assert.equal(C.filterCatalog(all, { types: ['NL'] }).some(item => item.sourceId === 'nuforc'), true);
  assert.equal(C.filterCatalog(all, { types: ['MIL'] }).some(item => item.sourceId === 'uk_mod'), true);
});
