const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const globe = require('../js/monitor-globe.js');
const model = require('../js/monitor-model.js');

function entry(id, lat, lng) {
  return { id, title: String(id), location: { lat, lng, precision: 'approximate' } };
}

test('globe markers reject missing/invalid geography instead of treating null as zero', () => {
  for (const location of [null, {}, { lat: null, lng: null }, { lat: '', lng: 0 },
    { lat: 91, lng: 0 }, { lat: 0, lng: 181 }, { lat: NaN, lng: 0 }]) {
    assert.equal(globe.locationOf({ location }), null);
  }
  assert.deepEqual(globe.locationOf(entry('zero', 0, 0)), { lat: 0, lng: 0 });
  assert.deepEqual(globe.locationOf(entry('south', -90, -180)), { lat: -90, lng: -180 });
});

test('clustering preserves case counts and exact case IDs at each zoom level', () => {
  const rows = [entry('a', 37, -118), entry('b', 37.2, -118.2), entry('c', 50, 2), entry('d', -33, 151)];
  for (const altitude of [2.5, 1.2, 0.5]) {
    const markers = globe.buildMarkers(rows, altitude, null);
    assert.equal(markers.reduce((count, marker) => count + marker.count, 0), rows.length);
    const ids = markers.flatMap(marker => marker.cluster ? marker.rows.map(row => row.id) : [marker.item.id]);
    assert.deepEqual(ids.sort(), rows.map(row => row.id).sort());
  }
});

test('the selected case stays separate and other cluster counts do not include it', () => {
  const rows = [entry('a', 37, -118), entry('b', 37.2, -118.2), entry('c', 37.4, -118.1)];
  const markers = globe.buildMarkers(rows, 2.5, 'b');
  const selected = markers.find(marker => marker.selected);
  assert.equal(selected.item.id, 'b');
  assert.equal(selected.count, 1);
  assert.equal(markers.find(marker => marker.cluster).count, 2);
  assert.equal(markers.reduce((sum, marker) => sum + marker.count, 0), 3);
});

test('spherical centers handle the antimeridian without placing a group at Greenwich', () => {
  const center = globe.centerOf([entry('a', 0, 179), entry('b', 0, -179)]);
  assert.ok(Math.abs(Math.abs(center.lng) - 180) < 0.01);
  assert.ok(Math.abs(center.lat) < 0.01);
});

test('duplicate IDs are removed, close zoom preserves original coordinates and no HTML is generated', () => {
  const item = entry('<img src=x onerror=bad()>', 41.123, 2.456);
  const rows = [item, { ...item }, entry('other', 48.8, 2.3)];
  const markers = globe.buildMarkers(rows, 0.5, null);
  assert.equal(markers.length, 2);
  const marker = markers.find(marker => marker.id === item.id);
  assert.equal(marker.lat, item.location.lat);
  assert.equal(marker.lng, item.location.lng);
  assert.equal(marker.item, item);
  assert.equal(typeof marker.id, 'string');
});

test('real curated corpus is represented once without mutation or fabricated publication locations', () => {
  const source = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');
  const raw = vm.runInNewContext(source + '\nCASES;', {}, { timeout: 1000 });
  const rows = model.normalizeCases(raw);
  const before = JSON.stringify(rows);
  const valid = globe.safeCases(rows);
  assert.ok(valid.length > 100 && valid.length <= 128);
  for (const altitude of [2.5, 1.35, 0.5]) {
    const markers = globe.buildMarkers(rows, altitude, 'nimitz-2004');
    assert.equal(markers.reduce((sum, marker) => sum + marker.count, 0), valid.length);
    assert.ok(markers.length <= valid.length);
    assert.ok(markers.every(marker => Number.isFinite(marker.lat) && Number.isFinite(marker.lng)));
  }
  assert.equal(JSON.stringify(rows), before);
  assert.deepEqual(globe.buildMarkers([{ id: 'news', title: 'New NASA publication', location: null }], 2.5), []);
});

test('the complete NUFORC archive is retained across globe zoom levels without a data cap', () => {
  const archive = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/nuforc.json'), 'utf8'));
  const rows = archive.rows.map((row, index) => entry('nuforc-' + index, row[2], row[3]));
  assert.ok(rows.length > 80000);
  const valid = globe.safeCases(rows);
  assert.equal(valid.length, rows.length);
  for (const altitude of [2.5, 1.2, 0.5, 0.18]) {
    const markers = globe.buildMarkers(rows, altitude, rows[rows.length - 1].id, { lat: 37, lng: -98 });
    assert.equal(markers.reduce((sum, marker) => sum + marker.count, 0), rows.length);
    assert.ok(markers.length <= globe.MAX_MARKERS, 'only rendered markers are bounded');
    const ids = markers.flatMap(marker => marker.cluster ? marker.rows.map(row => row.id) : [marker.item.id]);
    assert.equal(new Set(ids).size, rows.length);
    assert.equal(markers.find(marker => marker.selected).item.id, rows[rows.length - 1].id);
  }
});

test('coincident reports remain an exact accessible group at maximum zoom', () => {
  const rows = Array.from({ length: 5000 }, (_, index) => entry('same-location-' + index, 40.7, -74));
  const markers = globe.buildMarkers(rows, 0.18, rows[4999].id, { lat: 40.7, lng: -74 });
  const group = markers.find(marker => marker.cluster);
  assert.equal(group.count, 4999);
  assert.equal(group.rows.length, 4999);
  assert.ok(group.rows.some(row => row.id === rows[0].id));
  assert.equal(markers.find(marker => marker.selected).item.id, rows[4999].id);
  assert.equal(markers.reduce((sum, marker) => sum + marker.count, 0), 5000);
});

test('points and clusters retain safe category colors with the selected case highlighted', () => {
  const first = { ...entry('first', 40, -74), color: '#AABBCC' };
  const second = { ...entry('second', 40, -74), color: '#aabbcc' };
  const third = { ...entry('third', 40, -74), color: '#12ab34' };
  const markers = globe.buildMarkers([first, second, third], 2.5, third.id);
  assert.equal(globe.markerColor(markers.find(marker => marker.cluster)), '#aabbcc');
  assert.equal(globe.markerColor(markers.find(marker => marker.selected)), '#ffffff');
  assert.equal(globe.markerColor({ item: third }), '#12ab34');
  for (const color of ['red', '#fff', '#123456;display:none', 'url(https://example.test)', null]) {
    assert.equal(globe.caseColor({ color }), '#61dfef');
  }
  assert.equal(globe.dominantColor([first, second, third]), '#aabbcc');
});

test('close views show discreet groups while global views retain counts', () => {
  const small = { cluster: true, count: 30 }, dense = { cluster: true, count: 20000 };
  assert.equal(globe.compactMarker(small, 2.5), false);
  assert.equal(globe.compactMarker(small, 0.8), true);
  assert.equal(globe.compactMarker(dense, 0.8), false);
  assert.equal(globe.compactMarker(dense, 0.18), true);
  assert.equal(globe.compactMarker({ cluster: false, count: 1 }, 0.18), false);
});
