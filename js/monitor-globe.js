/* UFOlogist Monitor · primary, isolated globe renderer.
 * globe.gl owns its bundled Three.js instance; no legacy app/THREE globals load.
 * Browser: UFOMonitorGlobe.create(options) -> Promise<renderer>.
 * Node: pure marker helpers are exported for deterministic tests.
 */
(function (root, factory) {
  'use strict';
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.UFOMonitorGlobe = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const HOME = Object.freeze({ lat: 22, lng: -30, altitude: 2.5 });
  const MIN_ALTITUDE = 0.18;
  // This bounds rendered objects, never the records represented by their counts.
  const MAX_MARKERS = 768;
  const sourceScript = root.document && root.document.currentScript;
  const baseURL = sourceScript ? new URL('../', sourceScript.src).href : null;
  let vendorPromise = null;

  function locationOf(item) {
    const value = item && item.location;
    if (!value || value.lat === null || value.lng === null || value.lat === undefined || value.lng === undefined
      || String(value.lat).trim() === '' || String(value.lng).trim() === '') return null;
    const lat = Number(value.lat), lng = Number(value.lng);
    return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
      ? { lat, lng } : null;
  }

  function safeCases(items) {
    const seen = new Set();
    return (Array.isArray(items) ? items : []).filter(item => {
      if (!item || !item.id || !locationOf(item) || seen.has(String(item.id))) return false;
      seen.add(String(item.id));
      return true;
    });
  }

  function caseColor(item) {
    return item && /^#[0-9a-f]{6}$/i.test(item.color) ? item.color.toLowerCase() : '#61dfef';
  }

  function dominantColor(rows) {
    const counts = new Map();
    let winner = '#61dfef', maximum = 0;
    rows.forEach(item => {
      const color = caseColor(item), count = (counts.get(color) || 0) + 1;
      counts.set(color, count);
      if (count > maximum) { winner = color; maximum = count; }
    });
    return winner;
  }

  function markerColor(marker) {
    return marker && marker.selected ? '#ffffff'
      : marker && marker.cluster ? caseColor(marker) : caseColor(marker && marker.item);
  }

  function compactMarker(marker, altitude) {
    return !!marker.cluster && (altitude < 0.55 || (altitude < 1.5 && marker.count < 1000));
  }

  function centerOf(rows) {
    let x = 0, y = 0, z = 0;
    rows.forEach(item => {
      const location = locationOf(item), lat = location.lat * Math.PI / 180, lng = location.lng * Math.PI / 180;
      x += Math.cos(lat) * Math.cos(lng);
      y += Math.cos(lat) * Math.sin(lng);
      z += Math.sin(lat);
    });
    return { lat: Math.atan2(z, Math.hypot(x, y)) * 180 / Math.PI, lng: Math.atan2(y, x) * 180 / Math.PI };
  }

  function markerCellForAltitude(altitude) {
    return altitude >= 1.8 ? 28 : altitude >= 0.9 ? 14 : altitude >= 0.55 ? 7
      : altitude >= 0.35 ? 3.5 : altitude >= 0.24 ? 1 : 0.25;
  }

  function angularDistance(a, b) {
    const radians = Math.PI / 180;
    const first = a.lat * radians, second = b.lat * radians;
    const cosine = Math.sin(first) * Math.sin(second)
      + Math.cos(first) * Math.cos(second) * Math.cos((a.lng - b.lng) * radians);
    return Math.acos(Math.max(-1, Math.min(1, cosine))) / radians;
  }

  function buildMarkers(items, altitude, selectedId, view) {
    const cases = safeCases(items);
    const selectedKey = selectedId === null || selectedId === undefined ? null : String(selectedId);
    let cell = markerCellForAltitude(altitude);
    const focus = view && Number.isFinite(view.lat) && Number.isFinite(view.lng) ? view : null;
    const radius = Math.max(5, Number(altitude) * 45);
    // Refinement follows the camera. The rest of the world remains represented in
    // coarse groups, instead of creating thousands of off-screen DOM/3D objects.
    const entries = cases.map(item => {
      const location = locationOf(item);
      return { item, location, focused: !focus || angularDistance(location, focus) <= radius };
    });
    let markers;
    do {
      const buckets = new Map();
      markers = [];
      entries.forEach(({ item, location, focused }) => {
        if (String(item.id) === selectedKey) {
          markers.push({ id: String(item.id), lat: location.lat, lng: location.lng, count: 1,
            item, selected: true, cluster: false });
          return;
        }
        const size = focused ? cell : Math.max(28, cell);
        const key = size + ':' + Math.floor((location.lat + 90) / size) + ':' + Math.floor((location.lng + 180) / size);
        if (!buckets.has(key)) buckets.set(key, { rows: [], size });
        buckets.get(key).rows.push(item);
      });
      buckets.forEach(({ rows, size }, key) => {
        if (rows.length === 1) {
          const item = rows[0], location = locationOf(item);
          markers.push({ id: String(item.id), lat: location.lat, lng: location.lng,
            count: 1, item, selected: false, cluster: false });
        } else {
          markers.push({ id: 'cluster:' + key, ...centerOf(rows), cell: size,
            count: rows.length, rows, color: dominantColor(rows), selected: false, cluster: true });
        }
      });
      if (markers.length <= MAX_MARKERS || cell >= 180) return markers;
      cell = Math.min(180, cell * 2);
    } while (true);
  }

  function loadVendor() {
    if (typeof root.Globe === 'function') return Promise.resolve();
    if (vendorPromise) return vendorPromise;
    vendorPromise = new Promise((resolve, reject) => {
      const script = root.document.createElement('script');
      script.src = new URL('assets/vendor/globe-gl-2.32.2.min.js', baseURL || root.document.baseURI).href;
      script.async = true;
      const timeout = root.setTimeout(() => finish(new Error('Tiempo de carga del globo agotado.')), 15000);
      function finish(error) {
        root.clearTimeout(timeout);
        script.onload = script.onerror = null;
        if (error) {
          script.remove();
          vendorPromise = null;
          reject(error);
        } else resolve();
      }
      script.onload = () => finish(typeof root.Globe === 'function' ? null : new Error('No se pudo cargar el motor 3D.'));
      script.onerror = () => finish(new Error('No se pudo cargar el motor 3D.'));
      root.document.head.appendChild(script);
    });
    return vendorPromise;
  }

  function imageReady(url) {
    return new Promise((resolve, reject) => {
      const image = new root.Image();
      const timeout = root.setTimeout(() => finish(new Error('No se pudo preparar la textura terrestre.')), 12000);
      function finish(error) {
        root.clearTimeout(timeout);
        image.onload = image.onerror = null;
        if (error) reject(error); else resolve();
      }
      image.onload = () => finish(image.naturalWidth ? null : new Error('La textura terrestre no es válida.'));
      image.onerror = () => finish(new Error('No se pudo cargar la textura terrestre.'));
      image.src = url;
    });
  }

  async function create(options) {
    const opts = options || {}, container = opts.container;
    if (!root.document || !container || typeof container.appendChild !== 'function') {
      throw new Error('Falta el contenedor del globo.');
    }
    if (!root.UFOMonitorGlobeLayout || typeof root.UFOMonitorGlobeLayout.layout !== 'function') {
      throw new Error('No se pudo preparar la agrupación del globo.');
    }
    const resourceURL = path => new URL(path, baseURL || root.document.baseURI).href;
    const earthURL = resourceURL('assets/map/earth-blue-marble.jpg');
    const bumpURL = resourceURL('assets/map/earth-topology.png');
    try {
      await Promise.all([loadVendor(), imageReady(earthURL), imageReady(bumpURL)]);
    } catch (error) {
      if (typeof opts.onError === 'function') opts.onError(error);
      throw error;
    }
    return new Promise((resolve, reject) => {
      let globe, ready = false, destroyed = false, cases = [], selected = null;
      let active = !root.document.hidden, markerView = null, layoutView = null, raf = null;
      let geographicMarkers = [], layoutTimer = null, lastLayoutAt = 0;
      let cartography = null;
      const credit = container.parentElement.querySelector('#globe-imagery-credit');
      const renderedMarkers = new Map();
      const mobile = root.matchMedia && root.matchMedia('(max-width: 760px)').matches;
      const reducedMotion = opts.reducedMotion === undefined
        ? !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches)
        : !!opts.reducedMotion;
      const timeout = root.setTimeout(() => fail(new Error('El globo no ha podido inicializarse.')), 15000);
      const resizeObserver = root.ResizeObserver ? new root.ResizeObserver(() => resize()) : null;

      function fail(error) {
        if (destroyed) return;
        root.clearTimeout(timeout);
        if (globe) globe.pauseAnimation();
        if (typeof opts.onError === 'function') opts.onError(error);
        if (!ready) {
          destroy();
          reject(error);
        }
      }

      function updatePlayback() {
        if (!globe || destroyed) return;
        const playing = ready && active && !root.document.hidden;
        container.dataset.renderState = playing ? 'active' : 'paused';
        if (playing) globe.resumeAnimation();
        else globe.pauseAnimation();
        updateCartography();
      }

      function updateCartography() {
        if (cartography) cartography.update(ready && active && !root.document.hidden ? globe.pointOfView() : null);
      }

      function cartographyState(value) {
        container.dataset.cartography = value.state;
        container.dataset.detailTileCount = String(value.tileCount);
        container.dataset.referenceTileCount = String(value.referenceTileCount);
        if (credit) {
          credit.hidden = value.tileCount === 0;
          const reference = credit.querySelector('[data-credit-layer="reference"]');
          if (reference) reference.hidden = value.referenceTileCount === 0;
        }
        layoutView = null;
        if (raf === null) raf = root.requestAnimationFrame(() => { raf = null; updateMarkers(false); });
      }

      function creditChanged() { layoutView = null; updateMarkers(false); }

      function resize() {
        if (!globe || destroyed) return;
        const box = container.getBoundingClientRect();
        // A hidden tab may have zero dimensions during initial creation.
        globe.width(Math.max(1, Math.round(box.width))).height(Math.max(1, Math.round(box.height)));
        updateMarkers(false);
      }

      function reservedAreas() {
        const box = container.getBoundingClientRect();
        return [...container.parentElement.querySelectorAll('.map-toolbar,.map-legend,.map-caption,.globe-hint,#globe-zoom-controls,#globe-imagery-credit')]
          .map(element => element.getBoundingClientRect())
          .filter(rect => rect.width > 0 && rect.height > 0)
          .map(rect => ({ x: rect.left - box.left, y: rect.top - box.top, width: rect.width, height: rect.height }));
      }

      function projectMarker(marker) {
        const point = globe.getCoords(marker.lat, marker.lng, 0);
        const camera = globe.camera().position;
        const radiusSquared = point.x * point.x + point.y * point.y + point.z * point.z;
        const facing = point.x * camera.x + point.y * camera.y + point.z * camera.z;
        return { ...globe.getScreenCoords(marker.lat, marker.lng, 0.001), visible: facing > radiusSquared * 1.01 };
      }

      function updateMarkers(force) {
        if (!globe || destroyed || !ready) return;
        updateCartography();
        const view = globe.pointOfView(), altitude = view.altitude;
        const cell = markerCellForAltitude(altitude);
        const movement = Math.max(1, cell);
        const radiusBand = Math.floor(Math.max(5, altitude * 45) / Math.max(2, cell));
        const key = cell + ':' + radiusBand + ':' + (altitude <= MIN_ALTITUDE + 0.01)
          + ':' + Math.floor(view.lat / movement) + ':' + Math.floor(view.lng / movement);
        const box = container.getBoundingClientRect(), camera = globe.camera().position;
        const reserved = reservedAreas();
        const screenKey = [camera.x, camera.y, camera.z, box.width, box.height].map(value => Math.round(value * 100)).join(':')
          + ':' + JSON.stringify(reserved);
        if (!force && key === markerView && screenKey === layoutView) return;
        // CSS2D keeps anchors moving with the camera. Limit the heavier collision
        // pass while dragging, and always run once more after the final movement.
        const elapsed = root.performance.now() - lastLayoutAt;
        if (!force && elapsed < 60) {
          if (layoutTimer === null) layoutTimer = root.setTimeout(() => { layoutTimer = null; updateMarkers(false); }, 60 - elapsed);
          return;
        }
        if (force || key !== markerView) {
          const rows = selected && locationOf(selected) && !cases.some(item => item.id === selected.id)
            ? cases.concat(selected) : cases;
          geographicMarkers = buildMarkers(rows, altitude, selected && selected.id, view);
          markerView = key;
        }
        layoutView = screenKey;
        lastLayoutAt = root.performance.now();
        const result = root.UFOMonitorGlobeLayout.layout(geographicMarkers, projectMarker, {
          width: box.width, height: box.height, gap: mobile ? 10 : 8, padding: 8,
          reserved, reservedPadding: 6,
          radius: marker => marker.cluster && !compactMarker(marker, altitude) ? (mobile ? 18 : 16) : 12,
        });
        const next = new Map();
        const markers = result.markers.map(marker => {
          const stable = renderedMarkers.get(marker.id);
          if (stable) stable.screenOffset = null;
          const value = stable ? Object.assign(stable, marker) : marker;
          if (value.button) refreshMarkerButton(value);
          next.set(value.id, value);
          return value;
        });
        renderedMarkers.clear(); next.forEach((marker, id) => renderedMarkers.set(id, marker));
        // No angular-radius cylinders: all symbols use fixed CSS pixel sizes.
        globe.htmlElementsData(markers);
        container.dataset.sourceCaseCount = String(cases.length);
        container.dataset.representedCaseCount = String(result.stats.totalCases);
        container.dataset.visibleMarkerCount = String(markers.length);
        container.dataset.cameraLat = String(view.lat);
        container.dataset.cameraLng = String(view.lng);
        container.dataset.cameraAltitude = String(view.altitude);
      }

      function activate(marker) {
        if (!marker || destroyed) return;
        if (marker.cluster) {
          const view = globe.pointOfView();
          if (view.altitude <= MIN_ALTITUDE + 0.01) {
            if (typeof opts.onCluster === 'function') opts.onCluster(marker.rows.slice(), marker);
            return;
          }
          const altitude = Math.max(MIN_ALTITUDE, view.altitude * 0.53);
          globe.pointOfView({ lat: marker.lat, lng: marker.lng, altitude }, reducedMotion ? 0 : 350);
          updateMarkers(true);
          container.focus({ preventScroll: true });
        } else if (typeof opts.onCase === 'function') opts.onCase(marker.item.id);
      }

      function refreshMarkerButton(marker) {
        const button = marker.button;
        button.className = 'monitor-globe-marker ' + (marker.cluster ? 'monitor-globe-cluster' : 'monitor-globe-point') + (marker.selected ? ' is-selected' : '') + (compactMarker(marker, globe.pointOfView().altitude) ? ' is-compact' : '');
        button.style.setProperty('--case-color', caseColor(marker.item));
        const face = button.firstElementChild;
        face.textContent = marker.cluster ? marker.count >= 10000 ? Math.round(marker.count / 1000) + 'k'
          : marker.count >= 1000 ? new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(marker.count / 1000) + 'k' : String(marker.count) : '';
        const action = globe.pointOfView().altitude <= MIN_ALTITUDE + 0.01 ? 'ver fichas de esta región' : 'acercar esta región';
        const label = marker.cluster ? 'Explorar ' + marker.count + ' casos en esta región · ' + action
          : 'Abrir caso: ' + String(marker.item.title || marker.item.name || 'Caso del archivo');
        button.title = label;
        button.setAttribute('aria-label', label);
        button.dataset.markerCount = String(marker.count);
        button.dataset.markerCountLabel = new Intl.NumberFormat('es-ES', { useGrouping: true }).format(marker.count) + ' casos';
        button.dataset.markerId = marker.id;
        button.style.setProperty('--marker-offset-x', (marker.screenOffset?.x || 0) + 'px');
        button.style.setProperty('--marker-offset-y', (marker.screenOffset?.y || 0) + 'px');
      }

      function markerButton(marker) {
        const button = root.document.createElement('button');
        button.type = 'button';
        const face = root.document.createElement('span');
        face.className = 'monitor-globe-marker-face';
        face.setAttribute('aria-hidden', 'true');
        button.appendChild(face);
        marker.button = button;
        refreshMarkerButton(marker);
        button.addEventListener('pointerdown', event => event.stopPropagation());
        button.addEventListener('click', event => {
          event.stopPropagation();
          activate(marker);
        });
        return button;
      }

      function onContextLost(event) {
        event.preventDefault();
        fail(new Error('Se ha perdido el contexto gráfico del globo. Puedes continuar en el mapa 2D.'));
      }

      function destroy() {
        if (destroyed) return;
        destroyed = true;
        container.dataset.renderState = 'destroyed';
        root.clearTimeout(timeout);
        if (raf !== null) root.cancelAnimationFrame(raf);
        if (layoutTimer !== null) root.clearTimeout(layoutTimer);
        cartography?.destroy(); cartography = null;
        if (credit) { credit.removeEventListener('toggle', creditChanged); credit.hidden = true; }
        if (resizeObserver) resizeObserver.disconnect();
        root.document.removeEventListener('visibilitychange', updatePlayback);
        root.removeEventListener('resize', resize);
        if (globe) {
          const renderer = globe.renderer();
          renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
          globe.pauseAnimation();
          if (typeof globe._destructor === 'function') globe._destructor();
          if (globe.controls() && typeof globe.controls().dispose === 'function') globe.controls().dispose();
          renderer.dispose();
        }
        container.replaceChildren();
      }

      const api = {
        setCases(items) { cases = safeCases(items); updateMarkers(true); },
        select(item) {
          selected = item && locationOf(item) ? item : null;
          if (selected && globe && !destroyed) globe.pointOfView({ ...locationOf(selected), altitude: 1.35 }, 0);
          updateMarkers(true);
        },
        reset() {
          selected = null;
          if (globe && !destroyed) globe.pointOfView({ ...HOME }, 0);
          updateMarkers(true);
        },
        resize,
        setActive(value) { active = !!value; updatePlayback(); if (active) resize(); },
        zoom(direction) {
          if (!globe || destroyed) return;
          const view = globe.pointOfView();
          const inward = direction === 'in' || direction === 1 || direction === '+';
          globe.pointOfView({ ...view, altitude: Math.max(MIN_ALTITUDE, Math.min(4.5, view.altitude * (inward ? 0.7 : 1.4))) }, 0);
          updateMarkers(true);
        },
        destroy,
      };

      try {
        globe = root.Globe({
          animateIn: false, waitForGlobeReady: true,
          rendererConfig: { antialias: !mobile, alpha: true, powerPreference: 'low-power' },
        })
          .backgroundColor('#030b14')
          .globeImageUrl(earthURL)
          .bumpImageUrl(bumpURL)
          .showAtmosphere(true)
          .atmosphereColor('#7eb9dc')
          .atmosphereAltitude(0.12)
          .pointsData([])
          .htmlLat('lat').htmlLng('lng')
          .htmlAltitude(0.001)
          .htmlElement(markerButton)
          .htmlTransitionDuration(0)
          .onZoom(() => {
            if (raf !== null) return;
            raf = root.requestAnimationFrame(() => { raf = null; updateMarkers(false); });
          })
          .onGlobeReady(() => {
            if (destroyed) return;
            ready = true;
            root.clearTimeout(timeout);
            if (root.UFOMonitorGlobeTiles) cartography = root.UFOMonitorGlobeTiles.create(globe, { onState: cartographyState });
            resize();
            updateMarkers(true);
            updatePlayback();
            resolve(api);
            if (typeof opts.onReady === 'function') opts.onReady(api);
          });
        globe(container);
        globe.renderer().setPixelRatio(Math.min(root.devicePixelRatio || 1, mobile ? 1.25 : 1.5));
        globe.renderer().domElement.addEventListener('webglcontextlost', onContextLost);
        globe.globeMaterial().bumpScale = 0.4;
        const controls = globe.controls();
        controls.autoRotate = false;
        controls.enableDamping = !reducedMotion;
        controls.dampingFactor = 0.14;
        controls.minDistance = 118;
        controls.maxDistance = 550;
        globe.pointOfView({ ...HOME }, 0);
        const features = opts.world && Array.isArray(opts.world.features) ? opts.world.features : [];
        if (features.length) {
          globe.polygonsData(features)
            .polygonCapColor(() => 'rgba(0,0,0,0)')
            .polygonSideColor(() => 'rgba(0,0,0,0)')
            .polygonStrokeColor(() => 'rgba(181,213,231,0.28)')
            .polygonAltitude(0.003)
            .polygonLabel(() => '');
        }
        resize();
        updatePlayback();
        if (resizeObserver) resizeObserver.observe(container);
        credit?.addEventListener('toggle', creditChanged);
        root.document.addEventListener('visibilitychange', updatePlayback);
        root.addEventListener('resize', resize);
      } catch (error) { fail(error); }
    });
  }

  return { create, locationOf, safeCases, caseColor, dominantColor, markerColor, compactMarker, centerOf, markerCellForAltitude, buildMarkers, HOME, MAX_MARKERS };
}));
