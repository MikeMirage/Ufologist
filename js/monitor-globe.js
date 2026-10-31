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
      let active = !root.document.hidden, markerView = null, raf = null;
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
      }

      function resize() {
        if (!globe || destroyed) return;
        const box = container.getBoundingClientRect();
        // A hidden tab may have zero dimensions during initial creation.
        globe.width(Math.max(1, Math.round(box.width))).height(Math.max(1, Math.round(box.height)));
      }

      function updateMarkers(force) {
        if (!globe || destroyed) return;
        const view = globe.pointOfView(), altitude = view.altitude;
        const cell = markerCellForAltitude(altitude);
        const movement = Math.max(1, cell);
        const radiusBand = Math.floor(Math.max(5, altitude * 45) / Math.max(2, cell));
        const key = cell + ':' + radiusBand + ':' + (altitude <= MIN_ALTITUDE + 0.01)
          + ':' + Math.floor(view.lat / movement) + ':' + Math.floor(view.lng / movement);
        if (!force && key === markerView) return;
        markerView = key;
        const rows = selected && locationOf(selected) && !cases.some(item => item.id === selected.id)
          ? cases.concat(selected) : cases;
        const markers = buildMarkers(rows, altitude, selected && selected.id, view);
        globe.pointsData(markers.filter(marker => !marker.cluster));
        globe.htmlElementsData(markers.filter(marker => marker.cluster));
        globe.labelsData([]);
      }

      function tooltip(marker) {
        const element = root.document.createElement('div');
        element.className = 'monitor-globe-tooltip';
        element.textContent = marker.cluster
          ? marker.count + ' registros agrupados del archivo · explorar región'
          : String(marker.item.title || marker.item.name || 'Caso del archivo');
        return element;
      }

      function activate(marker) {
        if (!marker || destroyed) return;
        if (marker.cluster) {
          const view = globe.pointOfView();
          if (view.altitude <= MIN_ALTITUDE + 0.01
            && angularDistance(view, marker) < Math.max(1, marker.cell || 1)) {
            if (typeof opts.onCluster === 'function') opts.onCluster(marker.rows.slice(), marker);
            return;
          }
          const altitude = Math.max(MIN_ALTITUDE, view.altitude * 0.53);
          globe.pointOfView({ lat: marker.lat, lng: marker.lng, altitude }, reducedMotion ? 0 : 350);
          updateMarkers(true);
          container.focus({ preventScroll: true });
        } else if (typeof opts.onCase === 'function') opts.onCase(marker.item.id);
      }

      function clusterBadge(marker) {
        const button = root.document.createElement('button');
        button.type = 'button';
        button.className = 'monitor-globe-cluster';
        button.textContent = marker.count >= 1000
          ? new Intl.NumberFormat('es-ES', { notation: 'compact', maximumFractionDigits: 1 }).format(marker.count)
          : String(marker.count);
        const action = globe.pointOfView().altitude <= MIN_ALTITUDE + 0.01 ? 'ver fichas de esta región' : 'acercar esta región';
        button.title = marker.count + ' registros agrupados del archivo · ' + action;
        button.setAttribute('aria-label', 'Explorar ' + marker.count + ' casos en esta región · ' + action);
        button.style.cssText = 'width:34px;height:34px;min-width:34px;padding:0;display:grid;place-items:center;border:1px solid #41cde4;border-radius:50%;background:rgba(7,23,38,.94);color:#b5f4ff;font:600 13px/1 Inter,sans-serif;cursor:pointer;pointer-events:auto;box-shadow:0 1px 6px rgba(0,0,0,.32)';
        button.style.borderColor = markerColor(marker);
        button.style.color = markerColor(marker);
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
          .pointLat('lat').pointLng('lng')
          .pointColor(markerColor)
          .pointRadius(marker => marker.selected ? 1 : 0.65)
          .pointAltitude(marker => marker.selected ? 0.027 : 0.012)
          .pointResolution(mobile ? 6 : 10)
          .pointsMerge(false)
          .pointsTransitionDuration(0)
          .pointLabel(tooltip)
          .onPointClick(activate)
          .htmlLat('lat').htmlLng('lng')
          .htmlAltitude(0.025)
          .htmlElement(clusterBadge)
          .htmlTransitionDuration(0)
          .onZoom(() => {
            if (raf !== null) return;
            raf = root.requestAnimationFrame(() => { raf = null; updateMarkers(false); });
          })
          .onGlobeReady(() => {
            if (destroyed) return;
            ready = true;
            root.clearTimeout(timeout);
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
        root.document.addEventListener('visibilitychange', updatePlayback);
        root.addEventListener('resize', resize);
      } catch (error) { fail(error); }
    });
  }

  return { create, locationOf, safeCases, caseColor, dominantColor, markerColor, centerOf, markerCellForAltitude, buildMarkers, HOME, MAX_MARKERS };
}));
