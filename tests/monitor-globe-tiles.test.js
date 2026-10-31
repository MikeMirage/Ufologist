const test = require('node:test');
const assert = require('node:assert/strict');
const detail = require('../js/monitor-globe-tiles.js');

class Color {
  constructor(value = '#000000') { this.value = value; }
  set(value) { this.value = value; return this; }
  copy(value) { this.value = value.value; return this; }
  clone() { return new Color(this.value); }
}
class Source { constructor(data) { this.data = data; } }
class Texture {
  constructor(image) { this.source = new Source(image); this.disposals = 0; }
  clone() { const result = new Texture(); result.source = this.source; return result; }
  set image(value) { this.source.data = value; }
  get image() { return this.source.data; }
  dispose() { this.disposals++; }
}
class Material {
  constructor() { this.color = new Color(); this.emissive = new Color(); this.specular = new Color(); this.disposals = 0; }
  copy(source) {
    this.color.copy(source.color); this.emissive.copy(source.emissive); this.specular.copy(source.specular);
    this.map = source.map; this.bumpMap = source.bumpMap; return this;
  }
  dispose() { this.disposals++; }
}
function fakeGlobe() {
  const earthImage = { name: 'local-earth' }, base = new Material();
  base.color = null; base.map = new Texture(earthImage); base.bumpMap = { name: 'earth-topology' };
  const globe = { base, data: [], layers: [], materials: [], globeMaterial() { return base; }, tilesData(rows) { this.data = rows; this.layers.push(rows); return this; } };
  for (const name of ['tileLat', 'tileLng', 'tileWidth', 'tileHeight', 'tileAltitude', 'tileUseGlobeProjection', 'tileCurvatureResolution', 'tilesTransitionDuration']) globe[name] = function (value) { this[name + 'Value'] = value; return this; };
  globe.tileMaterial = function (value) { this.materialFor = value; return this; };
  return globe;
}
function canvasFactory(size) {
  const context = { imageSmoothingEnabled: false, draws: 0, drawImage() { this.draws++; } };
  return { width: size, height: size, context, getContext() { return context; } };
}
const settle = () => new Promise(resolve => setImmediate(resolve));

test('detail is zoom-only and its ordered viewport is bounded and wraps across the antimeridian', () => {
  assert.equal(detail.zoomForAltitude(0.66), null);
  assert.equal(detail.zoomForAltitude(0.65), 5);
  assert.equal(detail.zoomForAltitude(0.35), 6);
  assert.equal(detail.zoomForAltitude(0.24), 7);
  assert.equal(detail.tilesForView({ lat: 42, lng: 2, altitude: 0.5 }).length, 49);
  assert.equal(detail.tilesForView({ lat: 42, lng: 2, altitude: 0.35 }).length, 81);
  assert.deepEqual(detail.tilesForView({ lat: 0, lng: 0, altitude: 2.5 }), []);
  assert.deepEqual(detail.tilesForView({ lat: 90, lng: 0, altitude: 0.18 }), []);
  const rows = detail.tilesForView({ lat: 42, lng: 179.9, altitude: 0.18 });
  assert.equal(rows.length, detail.MAX_VISIBLE);
  assert.equal(new Set(rows.map(row => row.key)).size, detail.MAX_VISIBLE);
  assert.equal(rows[0].priority, 0);
  assert.ok(rows.some(row => row.x === 0));
  assert.ok(rows.every(row => row.x >= 0 && row.x < 128 && row.y >= 0 && row.y < 128));
  assert.deepEqual(detail.tilesForView({ lat: 42, lng: -180.1, altitude: 0.18 }).map(row => row.key), rows.map(row => row.key));
});

test('tile bounds share exact geographic edges and use Web Mercator latitude rather than a linear Y', () => {
  const a = detail.tileBounds(16, 10, 5), b = detail.tileBounds(17, 10, 5), south = detail.tileBounds(16, 11, 5);
  assert.equal(a.east, b.west);
  assert.equal(a.south, south.north);
  assert.equal(a.width, 360 / 32);
  assert.ok(Math.abs(detail.latitudeToY(a.north, 5) - 10) < 1e-12);
  assert.ok(Math.abs(detail.latitudeToY(a.south, 5) - 11) < 1e-12);
  const wrapped = detail.tileBounds(-1, 10, 5);
  assert.equal(wrapped.east, 180);
  assert.equal(wrapped.west, 168.75);
});

test('row resampling maps spherical latitude to the correct Mercator source pixel', () => {
  const tile = { z: 5, y: 4, ...detail.tileBounds(16, 4, 5) };
  assert.ok(Math.abs(detail.sourceRowForLatitude(tile.north, tile)) < 1e-9);
  assert.ok(Math.abs(detail.sourceRowForLatitude(tile.south, tile) - 256) < 1e-9);
  const rows = Array.from({ length: 256 }, (_, row) => detail.sourceRowForOutput(row, tile));
  assert.ok(rows.every((row, index) => row >= 0 && row <= 255 && (!index || row > rows[index - 1])));
  assert.ok(Math.abs(rows[127] - 127) > 1, 'a straight image stretch would misalign the middle rows at high latitude');
  const result = detail.reprojectTile({ imagery: true }, { labels: true }, tile, canvasFactory);
  assert.equal(result.width, 256);
  assert.equal(result.context.draws, 256);
});

test('parent-level references crop the exact matching quadrant without moving geographic labels', () => {
  const tile = { z: 7, x: 66, y: 43, ...detail.tileBounds(66, 43, 7) };
  const parent = detail.referenceTileFor(tile), crop = detail.referenceCrop(tile);
  assert.deepEqual(parent, { z: 6, x: 33, y: 21 });
  assert.deepEqual(crop, { x: 0, y: 128, width: 128, height: 128 });
  assert.match(detail.tileURL('imagery', tile), /\/World_Imagery\/MapServer\/tile\/7\/43\/66$/);
  assert.match(detail.tileURL('reference', tile), /\/Reference\/World_Boundaries_and_Places\/MapServer\/tile\/6\/21\/33$/);
  assert.deepEqual(detail.referenceCrop({ z: 7, x: 67, y: 42 }), { x: 128, y: 0, width: 128, height: 128 });
  assert.deepEqual(detail.referenceCrop({ z: 0, x: 0, y: 0 }), { x: 0, y: 0, width: 256, height: 256 });
  for (const lat of [tile.north, tile.lat, tile.south]) {
    const childY = detail.sourceRowForLatitude(lat, tile);
    const parentY = detail.sourceRowForLatitude(lat, parent);
    assert.ok(Math.abs(crop.y + childY / 2 - parentY) < 1e-9);
  }
  const canvases = [], imagery = { imagery: true }, labels = { labels: true };
  const factory = size => {
    const draws = [], context = { drawImage(...args) { draws.push(args); } };
    const canvas = { width: size, height: size, draws, getContext() { return context; } }; canvases.push(canvas); return canvas;
  };
  detail.reprojectTile(imagery, labels, tile, factory);
  assert.deepEqual(canvases[0].draws[1], [labels, 0, 128, 128, 128, 0, 0, 256, 256]);
  assert.equal(canvases[1].draws.length, 256);
});

test('tile resources never modify or dispose the local planet material, texture or shared Source', () => {
  const globe = fakeGlobe(), originalSource = globe.base.map.source, originalImage = globe.base.map.image;
  const resources = detail.cloneResources(globe.base);
  assert.notEqual(resources.material, globe.base);
  assert.notEqual(resources.texture, globe.base.map);
  assert.notEqual(resources.texture.source, originalSource);
  resources.texture.image = { newTile: true };
  assert.equal(globe.base.color, null);
  assert.equal(globe.base.map.source, originalSource);
  assert.equal(globe.base.map.image, originalImage);
  assert.equal(resources.material.bumpMap, null);
  assert.equal(resources.material.map, null);
  assert.equal(resources.material.emissiveMap, resources.texture);
  resources.texture.dispose(); resources.material.dispose();
  assert.equal(globe.base.disposals, 0);
  assert.equal(globe.base.map.disposals, 0);
});

test('scheduler bounds requests/cache, prioritizes the center and keeps imagery when optional labels fail', async () => {
  const globe = fakeGlobe(), states = [], calls = [];
  let concurrent = 0, maximum = 0;
  const controller = detail.create(globe, {
    onState: state => states.push(state), createCanvas: canvasFactory,
    loadImage: async url => {
      calls.push(url); concurrent++; maximum = Math.max(maximum, concurrent);
      await settle(); concurrent--;
      if (url.includes('/Reference/')) throw new Error('Reference unavailable');
      return { width: 256, height: 256 };
    },
  });
  controller.update({ lat: 42, lng: 2, altitude: 2.5 });
  assert.equal(calls.length, 0);
  const view = { lat: 42, lng: 2, altitude: 0.18 }, center = detail.tilesForView(view)[0];
  controller.update(view);
  assert.ok(calls[0].endsWith(`/tile/${center.z}/${center.y}/${center.x}`));
  for (let i = 0; i < 100 && states.at(-1).tileCount < detail.MAX_VISIBLE; i++) await settle();
  assert.equal(states.at(-1).state, 'ready');
  assert.equal(states.at(-1).tileCount, detail.MAX_VISIBLE);
  assert.equal(states.at(-1).referenceTileCount, 0);
  assert.ok(maximum <= detail.CONCURRENCY);
  assert.equal(globe.tileUseGlobeProjectionValue, true);
  assert.ok(globe.data.every(tile => globe.materialFor(tile).visible));
  for (const lng of [40, 80, 120, 160, -160, -120]) {
    controller.update({ ...view, lng });
    assert.ok(states.at(-1).cacheSize <= detail.MAX_CACHE);
  }
  controller.destroy();
  await settle();
  assert.deepEqual(globe.data, []);
  assert.equal(globe.base.disposals, 0);
  assert.equal(globe.base.map.disposals, 0);
});

test('zooming out invalidates in-flight work and late images cannot restore the tile layer', async () => {
  const globe = fakeGlobe(), states = [], pending = [];
  const controller = detail.create(globe, { onState: state => states.push(state), createCanvas: canvasFactory,
    loadImage: (url, signal) => new Promise(resolve => pending.push({ resolve, signal })),
  });
  controller.update({ lat: 45, lng: 2, altitude: 0.18 });
  assert.equal(pending.length, detail.CONCURRENCY);
  controller.update({ lat: 45, lng: 2, altitude: 1 });
  assert.equal(states.at(-1).state, 'base');
  assert.ok(pending.every(request => request.signal.aborted));
  pending.forEach(request => request.resolve({ width: 256 }));
  await settle();
  assert.deepEqual(globe.data, []);
  assert.equal(states.at(-1).state, 'base');
  controller.destroy();
  const count = states.length;
  controller.update({ lat: 45, lng: 2, altitude: 0.18 });
  assert.equal(states.length, count);
});

test('an imagery outage preserves the globe and exposes a recoverable fallback instead of throwing', async () => {
  const globe = fakeGlobe(), states = [];
  const controller = detail.create(globe, { onState: state => states.push(state), createCanvas: canvasFactory,
    loadImage: async () => { throw new Error('HTTP unavailable'); },
  });
  assert.doesNotThrow(() => controller.update({ lat: 45, lng: 2, altitude: 0.18 }));
  await settle();
  assert.equal(states.at(-1).state, 'fallback');
  assert.equal(states.at(-1).tileCount, 0);
  assert.ok(globe.data.every(tile => !globe.materialFor(tile).visible));
  assert.equal(globe.base.map.image.name, 'local-earth');
  controller.destroy();
});

test('resuming after a pause during reference loading finishes labels without changing the planet', async () => {
  const globe = fakeGlobe(), states = [], pendingReference = [];
  const earthSource = globe.base.map.source, earthImage = globe.base.map.image;
  let holdReference = true;
  const controller = detail.create(globe, { onState: state => states.push(state), createCanvas: canvasFactory,
    loadImage: (url, signal) => {
      if (!url.includes('/Reference/') || !holdReference) return Promise.resolve({ width: 256, height: 256 });
      return new Promise((resolve, reject) => {
        pendingReference.push({ resolve, signal });
        signal.addEventListener('abort', () => { const error = new Error('Paused'); error.name = 'AbortError'; reject(error); }, { once: true });
      });
    },
  });
  const view = { lat: 37, lng: -95, altitude: 0.18 };
  controller.update(view);
  await settle();
  assert.equal(pendingReference.length, detail.CONCURRENCY);
  assert.equal(states.at(-1).tileCount, detail.CONCURRENCY);
  assert.equal(states.at(-1).referenceTileCount, 0);
  const visibleMaterials = globe.data.slice(0, detail.CONCURRENCY).map(tile => globe.materialFor(tile));
  controller.update({ ...view, altitude: 2.5 });
  await settle();
  assert.equal(states.at(-1).state, 'base');
  assert.ok(pendingReference.every(request => request.signal.aborted));
  assert.ok(visibleMaterials.every(material => material.visible), 'the already composed imagery remains reusable');
  holdReference = false;
  controller.update(view);
  for (let i = 0; i < 100 && states.at(-1).referenceTileCount < detail.MAX_VISIBLE; i++) await settle();
  assert.equal(states.at(-1).state, 'ready');
  assert.equal(states.at(-1).tileCount, detail.MAX_VISIBLE);
  assert.equal(states.at(-1).referenceTileCount, detail.MAX_VISIBLE);
  assert.equal(globe.base.map.source, earthSource);
  assert.equal(globe.base.map.image, earthImage);
  assert.equal(globe.base.color, null);
  controller.destroy();
});

test('a material preparation failure can recover on the next update after the Earth image is ready', async () => {
  const globe = fakeGlobe(), states = [], originalTexture = globe.base.map;
  globe.base.map = null;
  const controller = detail.create(globe, { onState: state => states.push(state), createCanvas: canvasFactory,
    loadImage: async () => ({ width: 256, height: 256 }),
  });
  const view = { lat: 37, lng: -95, altitude: 0.18 };
  assert.doesNotThrow(() => controller.update(view));
  assert.equal(states.at(-1).state, 'fallback');
  assert.deepEqual(globe.data, []);
  globe.base.map = originalTexture;
  controller.update(view);
  for (let i = 0; i < 100 && states.at(-1).referenceTileCount < detail.MAX_VISIBLE; i++) await settle();
  assert.equal(states.at(-1).state, 'ready');
  assert.equal(states.at(-1).referenceTileCount, detail.MAX_VISIBLE);
  assert.equal(globe.base.map, originalTexture);
  assert.equal(globe.base.map.image.name, 'local-earth');
  controller.destroy();
});
