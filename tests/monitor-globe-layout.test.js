const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const layout = require('../js/monitor-globe-layout.js');
const globe = require('../js/monitor-globe.js');

const item = (id, lat, lng, color = '#61dfef') => ({ id, color, location: { lat, lng } });
const marker = (id, lat, lng, options) => ({ id, lat, lng, count: 1, cluster: false, selected: false, item: item(id, lat, lng), ...options });
const project = point => ({ x: point.lng, y: point.lat });
const viewport = { width: 600, height: 400, padding: 0, reservedPadding: 0 };
const ids = markers => markers.flatMap(point => point.cluster ? point.rows.map(row => row.id) : [point.item.id]).sort();

test('screen clustering preserves IDs and counts across formerly separate geographic cells', () => {
  const input = [marker('a', 10, 10), marker('b', 10, 11), marker('c', 10, 25)];
  const before = JSON.stringify(input);
  const result = layout.layout(input, point => ({ x: point.lng * 10, y: point.lat * 10 }), viewport);
  assert.equal(result.markers.length, 2);
  assert.equal(result.markers.find(point => point.cluster).count, 2);
  assert.deepEqual(ids(result.markers), ['a', 'b', 'c']);
  assert.equal(result.stats.totalCases, 3);
  assert.equal(result.stats.hiddenCases, 0);
  assert.equal(JSON.stringify(input), before);
});

test('isolated small dots are not forced into large fixed grid clusters', () => {
  const input = [marker('a', 100, 100), marker('b', 100, 122), marker('c', 100, 144)];
  const result = layout.layout(input, project, viewport);
  assert.equal(result.markers.length, 3);
  assert.equal(result.stats.clusters, 0);
});

test('uses adaptive radii and reprojects merged spherical centers before checking collisions', () => {
  const input = [marker('a', 10, 10), marker('b', 10, 11), marker('c', 10, 14)];
  const projected = point => ({ x: point.lng * 10, y: point.lat * 10 });
  const result = layout.layout(input, projected, { ...viewport, radius: point => point.cluster ? 25 : 5 });
  assert.deepEqual(ids(result.markers), ['a', 'b', 'c']);
  assert.equal(result.markers.length, 1);
  assert.equal(result.markers[0].count, 3);
  assert.ok(result.stats.passes >= 2);
  assert.ok(Math.abs(result.markers[0].screen.x - result.markers[0].lng * 10) < 0.001);
});

test('a coincident group moves its label while selected geography and all records stay intact', () => {
  const input = [marker('selected', 10, 10, { selected: true }), marker('a', 10, 10), marker('b', 10, 11)];
  const before = JSON.stringify(input);
  const result = layout.layout(input, point => ({ x: point.lng * 10, y: point.lat * 10 }), viewport);
  assert.equal(result.markers.find(point => point.selected).item.id, 'selected');
  assert.deepEqual(result.markers.find(point => point.cluster).rows.map(row => row.id).sort(), ['a', 'b']);
  assert.equal(result.markers.reduce((sum, point) => sum + point.count, 0), 3);
  const selected = result.markers.find(point => point.selected), group = result.markers.find(point => point.cluster);
  assert.equal(result.hidden.length, 0, 'overlap cannot suppress the selected case or its neighbours');
  assert.deepEqual(selected.screen, { x: 100, y: 100 });
  assert.equal(selected.screenOffset, undefined);
  assert.ok(Math.hypot(selected.screen.x - group.screen.x, selected.screen.y - group.screen.y)
    >= layout.defaultRadius(selected) + layout.defaultRadius(group) + 8);
  assert.ok(Math.hypot(group.screenOffset.x, group.screenOffset.y) >= 36);
  assert.ok(Math.hypot(group.screenOffset.x, group.screenOffset.y) <= 48);
  assert.ok(Math.abs(group.screen.x - group.screenOffset.x - group.lng * 10) < 0.001);
  assert.ok(Math.abs(group.screen.y - group.screenOffset.y - group.lat * 10) < 0.001);
  assert.equal(JSON.stringify(input), before);
});

test('selection offsets avoid reserved UI and other visible markers', () => {
  const input = [marker('selected', 10, 10, { selected: true }), marker('near', 10, 10), marker('other', 10, 14)];
  const options = { ...viewport, reserved: [{ x: 60, y: 40, width: 80, height: 40 }] };
  const result = layout.layout(input, point => ({ x: point.lng * 10, y: point.lat * 10 }), options);
  assert.equal(result.hidden.length, 0);
  assert.equal(result.stats.visibleCases, 3);
  const moved = result.markers.find(point => point.id === 'near');
  assert.ok(moved.screenOffset);
  assert.ok(moved.screen.y > 100, 'upper positions are blocked by toolbar; right position is blocked by another point');
  for (const other of result.markers.filter(point => point !== moved)) {
    assert.ok(Math.hypot(moved.screen.x - other.screen.x, moved.screen.y - other.screen.y)
      >= layout.defaultRadius(moved) + layout.defaultRadius(other) + 8);
  }
});

test('a label with no safe selection offset stays in hidden with its exact count and rows', () => {
  const input = [marker('selected', 10, 10, { selected: true }), marker('a', 10, 10), marker('b', 10, 10)];
  const result = layout.layout(input, () => ({ x: 30, y: 30 }), { width: 60, height: 60, padding: 0 });
  assert.deepEqual(ids(result.markers), ['selected']);
  assert.equal(result.hidden.length, 1);
  assert.equal(result.hidden[0].hiddenReason, 'selection');
  assert.deepEqual(ids(result.hidden), ['a', 'b']);
  assert.equal(result.stats.totalCases, 3);
  assert.equal(result.stats.visibleCases + result.stats.hiddenCases, 3);
});

test('viewport, hemisphere and reserved areas hide representations without losing any records', () => {
  const input = [marker('visible', 100, 100), marker('toolbar', 20, 200), marker('edge', 100, 2), marker('back', 100, 350)];
  const result = layout.layout(input, point => ({ ...project(point), visible: point.id !== 'back' }), {
    ...viewport, padding: 8, reserved: [{ x: 180, y: 0, width: 70, height: 40 }],
  });
  assert.deepEqual(ids(result.markers), ['visible']);
  assert.deepEqual(ids(result.hidden), ['back', 'edge', 'toolbar']);
  assert.deepEqual(result.hidden.map(point => point.hiddenReason).sort(), ['hemisphere', 'reserved', 'viewport']);
  assert.equal(result.stats.totalCases, 4);
  assert.equal(result.stats.visibleCases + result.stats.hiddenCases, 4);
});

test('antimeridian groups use spherical geographic centers, not a false Greenwich anchor', () => {
  const input = [marker('a', 0, 179), marker('b', 0, -179)];
  const projected = point => ({ x: 200 + (point.lng < 0 ? point.lng + 180 : point.lng - 180) * 2, y: 100 + point.lat });
  const result = layout.layout(input, projected, viewport);
  assert.equal(result.markers.length, 1);
  assert.ok(Math.abs(Math.abs(result.markers[0].lng) - 180) < 0.01);
  assert.deepEqual(ids(result.markers), ['a', 'b']);
});

test('invalid projection stays auditable in hidden and unsafe IDs never generate HTML', () => {
  const value = '<img src=x onerror=bad()>';
  const input = [marker(value, 10, 10), marker('b', 10, 11), marker('bad', 10, 50)];
  const result = layout.layout(input, point => point.id === 'bad' ? null : ({ x: point.lng * 10, y: point.lat * 10 }), viewport);
  assert.equal(result.stats.totalCases, 3);
  assert.deepEqual(ids(result.markers), [value, 'b'].sort());
  assert.deepEqual(ids(result.hidden), ['bad']);
  assert.equal(typeof result.markers[0].id, 'string');
});

test('a dense archive keeps every record while bounding visible badge collisions', () => {
  const data = JSON.parse(fs.readFileSync(require.resolve('../data/nuforc.json'), 'utf8'));
  const rows = data.rows.map((row, index) => item('nuforc-' + index, row[2], row[3]));
  const geographic = globe.buildMarkers(rows, 0.18, null, { lat: 37, lng: -98 });
  const result = layout.layout(geographic, point => ({ x: (point.lng + 180) * 1.6 + 8, y: (90 - point.lat) * 2 + 8 }), {
    width: 600, height: 400, padding: 0, gap: 8,
  });
  assert.equal(result.stats.totalCases, 80332);
  assert.equal(result.stats.visibleCases + result.stats.hiddenCases, 80332);
  assert.equal(new Set(ids(result.markers.concat(result.hidden))).size, 80332);
  for (let i = 0; i < result.markers.length; i++) for (let j = i + 1; j < result.markers.length; j++) {
    const first = result.markers[i], second = result.markers[j];
    const distance = Math.hypot(first.screen.x - second.screen.x, first.screen.y - second.screen.y);
    assert.ok(distance + 0.0001 >= layout.defaultRadius(first) + layout.defaultRadius(second) + 8, 'visible badges do not collide');
  }
});

test('the complete categorized catalogue survives geographic and screen grouping together', () => {
  const vm = require('node:vm');
  const catalog = require('../js/monitor-catalog.js');
  const model = require('../js/monitor-model.js');
  const read = file => JSON.parse(fs.readFileSync(require.resolve(file), 'utf8'));
  const curated = vm.runInNewContext(fs.readFileSync(require.resolve('../js/data.js'), 'utf8') + '\nCASES;', {});
  const rows = catalog.mergeCatalog(model.normalizeCases(curated),
    catalog.normalizeNUFORC(read('../data/nuforc.json')),
    catalog.normalizeGEIPAN(read('../data/geipan.json')),
    catalog.normalizeOfficial(read('../data/official-cases.json')));
  assert.equal(rows.length, 86919);
  for (const altitude of [2.5, 0.8, 0.18]) {
    const geographic = globe.buildMarkers(rows, altitude, rows[rows.length - 1].id, { lat: 37, lng: -95 });
    const result = layout.layout(geographic, point => ({ x: (point.lng + 180) * 2, y: (90 - point.lat) * 3 }), {
      width: 720, height: 540, reserved: [{ x: 0, y: 0, width: 720, height: 60 }],
    });
    const represented = result.markers.concat(result.hidden);
    assert.equal(result.stats.totalCases, 86919);
    assert.equal(result.stats.visibleCases + result.stats.hiddenCases, 86919);
    assert.equal(new Set(ids(represented)).size, 86919);
    assert.ok(represented.some(point => point.selected && point.item.id === rows[rows.length - 1].id));
  }
});
