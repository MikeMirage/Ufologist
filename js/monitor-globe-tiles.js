/* UFOlogist globe detail. ArcGIS imagery/reference tiles, reprojected to the
 * latitude-linear UVs used by globe.gl's spherical tile geometry. The bundled
 * renderer owns Three.js; materials/textures are cloned from its own instances.
 * Detail is optional: failures always leave the local Earth texture available.
 */
(function (root, factory) {
  'use strict';
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.UFOMonitorGlobeTiles = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const MAX_LAT = 85.0511287798066;
  const MAX_VISIBLE = 81;
  const MAX_CACHE = 81;
  const CONCURRENCY = 5;
  const DETAIL_ALTITUDE = 0.65;
  const SIZE = 256;
  const SOURCES = Object.freeze({
    imagery: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
    reference: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer',
  });
  const ATTRIBUTION = 'Imagery: Esri, Vantor, Earthstar Geographics, GIS User Community. Reference: Esri, HERE, Garmin, © OpenStreetMap contributors, GIS User Community.';

  function zoomForAltitude(altitude) {
    return !Number.isFinite(altitude) || altitude < 0 || altitude > DETAIL_ALTITUDE ? null
      : altitude > 0.35 ? 5 : altitude > 0.24 ? 6 : 7;
  }
  function wrapX(x, z) { const n = 2 ** z; return ((x % n) + n) % n; }
  function longitudeToX(lng, z) { return wrapX(Math.floor((lng + 180) / 360 * 2 ** z), z); }
  function latitudeToY(lat, z) {
    const value = Math.max(-MAX_LAT, Math.min(MAX_LAT, lat)) * Math.PI / 180;
    return (1 - Math.log(Math.tan(value) + 1 / Math.cos(value)) / Math.PI) / 2 * 2 ** z;
  }
  function tileYToLatitude(y, z) { return Math.atan(Math.sinh(Math.PI * (1 - 2 * y / 2 ** z))) * 180 / Math.PI; }
  function tileBounds(x, y, z) {
    const n = 2 ** z, column = wrapX(x, z);
    const north = tileYToLatitude(y, z), south = tileYToLatitude(y + 1, z);
    const west = column / n * 360 - 180, east = (column + 1) / n * 360 - 180;
    return { north, south, west, east, lat: (north + south) / 2, lng: (west + east) / 2, width: east - west, height: north - south };
  }
  function tilesForView(view) {
    if (!view || !Number.isFinite(view.lat) || !Number.isFinite(view.lng)) return [];
    const z = zoomForAltitude(view.altitude);
    if (z === null || Math.abs(view.lat) > MAX_LAT) return [];
    const n = 2 ** z, cx = longitudeToX(view.lng, z);
    const cy = Math.max(0, Math.min(n - 1, Math.floor(latitudeToY(view.lat, z))));
    // Close views need wider coverage, especially in a landscape panel. Keep a
    // smaller 7×7 region at the initial detail level and a 9×9 region below it.
    const radius = z >= 6 ? 4 : 3;
    const tiles = [];
    for (let dy = -radius; dy <= radius; dy++) {
      const y = cy + dy;
      if (y < 0 || y >= n) continue;
      for (let dx = -radius; dx <= radius; dx++) {
        const x = wrapX(cx + dx, z);
        tiles.push({ key: `${z}/${x}/${y}`, x, y, z, priority: dx * dx + dy * dy, ...tileBounds(x, y, z) });
      }
    }
    return tiles.sort((a, b) => a.priority - b.priority || a.y - b.y || a.x - b.x);
  }
  // Canvas rows run north→south. SphereGeometry UVs are linear in latitude,
  // while each source image is linear in Web Mercator Y. This lookup aligns
  // imagery, labels, boundaries and geographic case coordinates.
  function sourceRowForLatitude(lat, tile, size = SIZE) { return (latitudeToY(lat, tile.z) - tile.y) * size; }
  function sourceRowForOutput(row, tile, size = SIZE) {
    const lat = tile.north - (row + 0.5) / size * (tile.north - tile.south);
    return Math.max(0, Math.min(size - 1, sourceRowForLatitude(lat, tile, size) - 0.5));
  }
  function referenceTileFor(tile) {
    return tile.z > 0 ? { z: tile.z - 1, x: Math.floor(wrapX(tile.x, tile.z) / 2), y: Math.floor(tile.y / 2) }
      : { z: 0, x: 0, y: 0 };
  }
  function referenceCrop(tile, size = SIZE) {
    return tile.z > 0 ? { x: wrapX(tile.x, tile.z) % 2 * size / 2, y: tile.y % 2 * size / 2, width: size / 2, height: size / 2 }
      : { x: 0, y: 0, width: size, height: size };
  }
  function tileURL(kind, tile) {
    const source = kind === 'reference' ? referenceTileFor(tile) : tile;
    return SOURCES[kind] + `/tile/${source.z}/${source.y}/${source.x}`;
  }

  function loadImage(url, signal, timeoutMs) {
    return new Promise((resolve, reject) => {
      const image = new root.Image();
      let settled = false;
      const timeout = root.setTimeout(() => finish(new Error('Cartografía no disponible a tiempo.')), timeoutMs);
      function finish(error) {
        if (settled) return;
        settled = true; root.clearTimeout(timeout);
        image.onload = image.onerror = null;
        signal?.removeEventListener('abort', abort);
        if (error) { image.src = ''; reject(error); } else resolve(image);
      }
      function abort() { const error = new Error('Carga cancelada'); error.name = 'AbortError'; finish(error); }
      if (signal?.aborted) { abort(); return; }
      image.crossOrigin = 'anonymous';
      image.onload = () => finish(image.naturalWidth ? null : new Error('Tesela vacía.'));
      image.onerror = () => finish(new Error('No se ha podido cargar la cartografía.'));
      signal?.addEventListener('abort', abort, { once: true });
      image.src = url;
    });
  }
  function makeCanvas(size) {
    const canvas = root.document.createElement('canvas'); canvas.width = canvas.height = size; return canvas;
  }
  function reprojectTile(imagery, reference, tile, canvasFactory = makeCanvas) {
    const source = canvasFactory(SIZE), output = canvasFactory(SIZE);
    const sourceContext = source.getContext('2d'), outputContext = output.getContext('2d');
    if (!sourceContext || !outputContext) throw new Error('Canvas no disponible.');
    sourceContext.drawImage(imagery, 0, 0, SIZE, SIZE);
    if (reference) {
      // Reference is fetched one zoom level below imagery. Crop the matching
      // quadrant before reprojection: text becomes legible at twice the source
      // size while every label stays at its true Web Mercator coordinate.
      const crop = referenceCrop(tile);
      sourceContext.drawImage(reference, crop.x, crop.y, crop.width, crop.height, 0, 0, SIZE, SIZE);
    }
    outputContext.imageSmoothingEnabled = true;
    for (let row = 0; row < SIZE; row++) {
      outputContext.drawImage(source, 0, sourceRowForOutput(row, tile), SIZE, 1, 0, row, SIZE, 1);
    }
    return output;
  }
  function cloneResources(base) {
    const original = base?.map || base?.emissiveMap;
    if (!original?.clone || !original.source?.constructor || !base?.constructor) throw new Error('Material de detalle no disponible.');
    // The vendor sets base.color=null after its Earth image loads. A normal
    // MeshPhongMaterial.clone() would try Color.copy(null). Supply a valid color
    // through a wrapper, without changing the actual globe material.
    const source = base.color ? base : Object.assign(Object.create(base), { color: base.emissive.clone().set('#ffffff') });
    const material = new base.constructor().copy(source);
    const texture = original.clone();
    // Texture.clone() shares Source with the Earth texture in Three r161. Give
    // this tile its own Source before assigning an image, preserving the planet.
    texture.source = new original.source.constructor(null);
    material.map = null;
    material.emissiveMap = texture;
    material.color.set('#000000');
    material.emissive.set('#ffffff');
    material.emissiveIntensity = 1;
    material.specular?.set('#000000');
    material.bumpMap = material.normalMap = material.displacementMap = material.lightMap = material.aoMap = null;
    material.bumpScale = 0;
    material.transparent = false; material.opacity = 1; material.depthWrite = true;
    material.visible = false;
    return { material, texture };
  }

  function create(globe, options) {
    const opts = options || {}, fetchImage = opts.loadImage || loadImage;
    const canvasFactory = opts.createCanvas || makeCanvas;
    const now = opts.now || Date.now;
    const cache = new Map();
    let active = new Set(), queue = [], inflight = 0, destroyed = false, enabled = false, signature = '', stateKey = '', clock = 0;
    let configured = false, lastError = '';
    function emit() {
      if (destroyed || typeof opts.onState !== 'function') return;
      const visible = [...active].map(key => cache.get(key)).filter(Boolean);
      const ready = visible.filter(entry => entry.ready).length;
      const loading = visible.some(entry => entry.loading || entry.queued);
      const state = !enabled ? 'base' : ready ? 'ready' : loading ? 'loading' : 'fallback';
      const key = [state, ready, active.size, visible.filter(entry => entry.labels).length, lastError].join(':');
      if (key === stateKey) return;
      stateKey = key;
      opts.onState({ state, tileCount: ready, requestedTileCount: active.size, referenceTileCount: visible.filter(entry => entry.labels).length, cacheSize: cache.size, attribution: ready ? ATTRIBUTION : '', error: lastError || null });
    }
    function dispose(entry) {
      entry.controller?.abort();
      entry.resources.texture.dispose(); entry.resources.material.dispose();
      entry.canvas = null;
    }
    function trim() {
      if (cache.size <= MAX_CACHE) return;
      const candidates = [...cache.values()].filter(entry => !active.has(entry.tile.key)).sort((a, b) => a.used - b.used);
      while (cache.size > MAX_CACHE && candidates.length) {
        const entry = candidates.shift(); cache.delete(entry.tile.key); dispose(entry);
      }
    }
    function configure() {
      if (configured) return;
      globe.tileLat('lat').tileLng('lng').tileWidth('width').tileHeight('height')
        .tileAltitude(0.0007).tileUseGlobeProjection(true).tileCurvatureResolution(0.5)
        .tilesTransitionDuration(0).tileMaterial(tile => cache.get(tile.key)?.resources.material);
      configured = true;
    }
    function display(entry, imagery, reference) {
      if (destroyed || cache.get(entry.tile.key) !== entry || !enabled || !active.has(entry.tile.key)) return;
      const canvas = reprojectTile(imagery, reference, entry.tile, canvasFactory);
      entry.resources.texture.image = canvas;
      entry.resources.texture.needsUpdate = true;
      entry.resources.material.visible = true;
      entry.resources.material.needsUpdate = true;
      entry.canvas = canvas; entry.ready = true; entry.labels = Boolean(reference); entry.failedAt = null;
      emit();
    }
    function pump() {
      if (destroyed || !enabled) return;
      while (inflight < CONCURRENCY && queue.length) {
        const entry = queue.shift(); entry.queued = false;
        if (!active.has(entry.tile.key) || cache.get(entry.tile.key) !== entry || entry.loading || entry.ready) continue;
        const controller = new root.AbortController(); entry.controller = controller; entry.loading = true; inflight++;
        (async () => {
          try {
            const imagery = await fetchImage(tileURL('imagery', entry.tile), controller.signal, 12000);
            if (controller.signal.aborted) return;
            display(entry, imagery, null);
            // Sequential images keep total concurrent network requests bounded.
            // Labels are optional and never delay showing usable imagery.
            try {
              const reference = await fetchImage(tileURL('reference', entry.tile), controller.signal, 6000);
              if (!controller.signal.aborted) display(entry, imagery, reference);
            } catch (_) { /* Keep imagery if the optional reference layer fails. */ }
          } catch (error) {
            if (error.name !== 'AbortError' && !controller.signal.aborted && cache.get(entry.tile.key) === entry) {
              entry.failedAt = now(); lastError = 'La cartografía de detalle no está disponible; se mantiene la imagen del planeta.';
            }
          } finally {
            // A pause can arrive after imagery is displayed but before optional
            // references complete. Preserve the visible canvas/material, but
            // schedule the tile again on return so labels are not lost forever.
            if (controller.signal.aborted && entry.ready && !entry.labels) entry.ready = false;
            entry.loading = false; entry.controller = null; inflight--;
            if (!destroyed && enabled && active.has(entry.tile.key) && !entry.ready && entry.failedAt === null) enqueue(entry);
            emit(); pump();
          }
        })();
      }
      emit();
    }
    function enqueue(entry) {
      if (entry.queued || entry.loading || entry.ready || (entry.failedAt !== null && now() - entry.failedAt < 60000)) return;
      entry.queued = true; queue.push(entry);
    }
    function base() {
      if (!enabled && !signature && !active.size) { emit(); return; }
      enabled = false; signature = ''; active = new Set(); queue.forEach(entry => { entry.queued = false; }); queue = [];
      cache.forEach(entry => entry.controller?.abort());
      if (configured) globe.tilesData([]);
      emit();
    }
    function update(view) {
      if (destroyed) return;
      const tiles = tilesForView(view);
      if (!tiles.length) { base(); return; }
      const next = tiles.map(tile => tile.key).join('|');
      enabled = true;
      if (next === signature) {
        tiles.forEach(tile => { const entry = cache.get(tile.key); if (entry) enqueue(entry); });
        pump(); return;
      }
      signature = next; lastError = '';
      active = new Set(tiles.map(tile => tile.key));
      queue.forEach(entry => { entry.queued = false; }); queue = [];
      cache.forEach(entry => { if (!active.has(entry.tile.key)) entry.controller?.abort(); });
      try {
        configure();
        const selected = tiles.map(tile => {
          let entry = cache.get(tile.key);
          if (!entry) {
            entry = { tile, resources: cloneResources(globe.globeMaterial()), used: ++clock, ready: false, labels: false, loading: false, queued: false, failedAt: null, controller: null, canvas: null };
            cache.set(tile.key, entry);
          }
          entry.used = ++clock;
          // globe.gl disposes material GPU state when a tile leaves the scene;
          // the cached canvas remains owned here and can be uploaded again.
          if (entry.ready) { entry.resources.texture.needsUpdate = true; entry.resources.material.needsUpdate = true; }
          enqueue(entry);
          return entry.tile;
        });
        globe.tilesData(selected);
        trim(); pump();
      } catch (error) {
        signature = '';
        lastError = 'Se conserva la imagen del planeta: no se pudo preparar la cartografía de detalle.';
        active = new Set(); queue.forEach(entry => { entry.queued = false; }); queue = [];
        if (configured) globe.tilesData([]);
        emit();
      }
    }
    function destroy() {
      if (destroyed) return;
      destroyed = true; enabled = false; queue = []; active = new Set();
      if (configured) globe.tilesData([]);
      cache.forEach(dispose); cache.clear();
    }
    emit();
    return { update, destroy };
  }

  return { create, zoomForAltitude, wrapX, longitudeToX, latitudeToY, tileYToLatitude, tileBounds, tilesForView, sourceRowForLatitude, sourceRowForOutput, referenceTileFor, referenceCrop, tileURL, reprojectTile, cloneResources, SOURCES, ATTRIBUTION, MAX_VISIBLE, MAX_CACHE, CONCURRENCY, DETAIL_ALTITUDE };
}));
