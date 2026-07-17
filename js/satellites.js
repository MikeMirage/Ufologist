// ============================================================
// satellites.js — motor + modelo de la vista Satélite (UFOlogist)
//
// Diseño: la capa de MODELO (parseo TLE, propagación SGP4, muestreo de
// órbitas, agregación por plano orbital) es PURA y testeable en Node.
// La capa de VISTA (globe.gl / THREE) va al final, aislada y solo se
// ejecuta en navegador (no toca globals de browser al cargar el módulo).
//
// Estrategia clave de rendimiento: dibujar ÓRBITAS por PLANO representativo
// (no una por satélite) + puntos vivos solo del set filtrado.
// SGP4 exacto se usa para posiciones/rutas; nunca hay que dibujar los 30k.
// ============================================================
(function (root) {
  'use strict';

  // Resolución perezosa de satellite.js (global en browser, o inyectado en Node)
  function lib() {
    if (typeof satellite !== 'undefined') return satellite;
    if (root && root.satellite) return root.satellite;
    return null;
  }
  const DEG = 180 / Math.PI;
  const EARTH_R_KM = 6371;

  // --- Constelaciones: grupo CelesTrak → metadatos (label, color, régimen) ---
  const CONSTELLATIONS = {
    stations: { label: 'Tripuladas / ISS', color: '#ffd166' },
    starlink: { label: 'Starlink', color: '#18d7ff' },
    oneweb:   { label: 'OneWeb', color: '#4be1c3' },
    'gps-ops':{ label: 'GPS', color: '#80ed99' },
    galileo:  { label: 'Galileo', color: '#7fd0ff' },
    'glo-ops':{ label: 'GLONASS', color: '#ef476f' },
    beidou:   { label: 'BeiDou', color: '#f78c6b' },
    geo:      { label: 'Geoestacionarios', color: '#b388ff' },
    weather:  { label: 'Meteorológicos', color: '#9d7bff' },
    science:  { label: 'Científicos', color: '#f4a8ff' },
  };
  function constMeta(group) { return CONSTELLATIONS[group] || { label: group, color: '#93a1c0' }; }

  function orbitBand(altKm) {
    if (altKm < 2000) return 'LEO';
    if (altKm < 34000) return 'MEO';
    if (altKm < 37000) return 'GEO';
    return 'HEO';
  }

  // --- Parseo ---
  function parseTleText(text, group) {
    const lines = text.split(/\r?\n/).map(l => l.replace(/\s+$/, '')).filter(l => l.length);
    const out = [];
    for (let i = 0; i + 2 <= lines.length; i += 3) {
      const n = lines[i], l1 = lines[i + 1], l2 = lines[i + 2];
      if (!l1 || !l2 || l1[0] !== '1' || l2[0] !== '2') { i -= 2; continue; }
      out.push(buildSat(n.trim(), l1.slice(2, 7).trim(), group, l1, l2));
    }
    return out.filter(Boolean);
  }
  // snapshot { groups: { g: [{n,id,l1,l2}] } } → array de sats
  function buildFromSnapshot(json) {
    const sats = [];
    Object.entries(json.groups || {}).forEach(([g, arr]) => {
      (arr || []).forEach(s => { const b = buildSat(s.n, s.id, g, s.l1, s.l2); if (b) sats.push(b); });
    });
    return sats;
  }
  function buildSat(name, id, group, l1, l2) {
    const S = lib(); if (!S) return null;
    let satrec;
    try { satrec = S.twoline2satrec(l1, l2); } catch (e) { return null; }
    if (!satrec || satrec.error) return null;
    return {
      name, id, group, l1, l2, satrec,
      incDeg: satrec.inclo * DEG,
      raanDeg: satrec.nodeo * DEG,
      meanMotion: satrec.no ? (satrec.no * 1440 / (2 * Math.PI)) : 0, // revs/día
    };
  }

  // --- Propagación ---
  function propagate(sat, date) {
    const S = lib(); if (!S || !sat) return null;
    let pv;
    try { pv = S.propagate(sat.satrec, date); } catch (e) { return null; }
    if (!pv || !pv.position) return null;
    const gd = S.eciToGeodetic(pv.position, S.gstime(date));
    const lat = S.degreesLat(gd.latitude), lng = S.degreesLong(gd.longitude), alt = gd.height;
    if (!isFinite(lat) || !isFinite(lng) || !isFinite(alt)) return null;
    return { lat, lng, alt, altGlobe: alt / EARTH_R_KM };
  }
  // muestrea una vuelta completa → polilínea [[lat,lng,altGlobe],...]
  function sampleOrbit(sat, date, n) {
    n = n || 96;
    const periodMin = sat.meanMotion > 0 ? 1440 / sat.meanMotion : 90;
    const pts = [];
    for (let k = 0; k <= n; k++) {
      const t = new Date(date.getTime() + (k / n) * periodMin * 60000);
      const p = propagate(sat, t);
      if (p) pts.push([p.lat, p.lng, p.altGlobe]);
    }
    return pts;
  }

  // --- Agregación por PLANO orbital (para dibujar planos, no 30k órbitas) ---
  // bucket de plano = constelación + inclinación (1°) + RAAN (~5°)
  function planeKey(sat, raanBucket) {
    const rb = raanBucket || 6;
    return sat.group + '|' + Math.round(sat.incDeg) + '|' + Math.round(sat.raanDeg / rb) * rb;
  }
  function representativePlanes(sats, raanBucket) {
    const seen = new Map();
    for (const s of sats) {
      const k = planeKey(s, raanBucket);
      if (!seen.has(k)) seen.set(k, s); // un satélite representante por plano
    }
    return [...seen.values()];
  }

  const model = {
    CONSTELLATIONS, constMeta, orbitBand,
    parseTleText, buildFromSnapshot, buildSat,
    propagate, sampleOrbit, representativePlanes, planeKey,
    EARTH_R_KM,
  };

  // ---------- Carga de datos (browser: vivo + respaldo) ----------
  const CELESTRAK = 'https://celestrak.org/NORAD/elements/gp.php?FORMAT=tle&GROUP=';
  const LIVE_GROUPS = Object.keys(CONSTELLATIONS);
  async function loadLive() {
    const groups = {};
    await Promise.all(LIVE_GROUPS.map(async g => {
      try {
        const r = await fetch(CELESTRAK + g);
        if (!r.ok) throw 0;
        groups[g] = parseTleText(await r.text(), g);
      } catch (e) { groups[g] = null; }
    }));
    const sats = Object.values(groups).filter(Boolean).flat();
    if (sats.length > 50) return { sats, live: true };
    throw new Error('live TLE unavailable');
  }
  async function loadData() {
    // Base fiable (respaldo local, siempre incluye muestra de Starlink), luego
    // enriquecer con CelesTrak en vivo (prioridad a lo vivo por NORAD id). Así
    // ninguna constelación desaparece si un grupo en vivo falla/limita.
    let base = [];
    try { const r = await fetch('data/tle-snapshot.json'); base = buildFromSnapshot(await r.json()); } catch (e) {}
    try {
      const live = await loadLive();
      const byId = new Map(base.map(s => [s.id, s]));
      for (const s of live.sats) byId.set(s.id, s);
      return { sats: [...byId.values()], live: true };
    } catch (e) {
      return { sats: base, live: base.length > 0 ? false : false };
    }
  }
  model.loadData = loadData;

  // ---------- Vista (SOLO navegador) ----------
  // Órbitas y satélites se dibujan como objetos THREE propios en la escena del
  // globo (LineSegments + Points, 1 draw call cada uno) → sin competir con
  // pathsData (capa política) ni objectsData. Coordenadas vía globe.getCoords.
  let VG = null;
  function TH() { return (typeof THREE !== 'undefined') ? THREE : root.THREE; }
  function hexRgb(hex) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  function coord(globe, lat, lng, alt) {
    if (globe.getCoords) return globe.getCoords(lat, lng, alt);
    const R = 100 * (1 + alt), phi = (90 - lat) * Math.PI / 180, th = (lng + 180) * Math.PI / 180;
    return { x: -R * Math.sin(phi) * Math.cos(th), y: R * Math.cos(phi), z: R * Math.sin(phi) * Math.sin(th) };
  }
  function activeSet() { return VG.filter ? VG.sats.filter(s => s.group === VG.filter) : VG.sats; }

  function buildOrbits(globe) {
    const T = TH(); const sc = globe.scene && globe.scene();
    if (!T || !sc) return;
    if (VG.orbitObj) { sc.remove(VG.orbitObj); VG.orbitObj.geometry.dispose(); VG.orbitObj = null; }
    const reps = representativePlanes(activeSet());
    const pos = [], col = [];
    for (const s of reps) {
      const pts = sampleOrbit(s, VG.simTime, 72);
      const c = hexRgb(constMeta(s.group).color);
      for (let i = 0; i < pts.length - 1; i++) {
        const a = coord(globe, pts[i][0], pts[i][1], pts[i][2]);
        const b = coord(globe, pts[i + 1][0], pts[i + 1][1], pts[i + 1][2]);
        pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
        col.push(c[0], c[1], c[2], c[0], c[1], c[2]);
      }
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    const mat = new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.4 });
    VG.orbitObj = new T.LineSegments(geo, mat);
    VG.orbitObj.renderOrder = 5;
    sc.add(VG.orbitObj);
  }
  function buildPoints(globe) {
    const T = TH(); const sc = globe.scene && globe.scene();
    if (!T || !sc) return;
    if (VG.ptsObj) { sc.remove(VG.ptsObj); VG.ptsObj.geometry.dispose(); VG.ptsObj = null; }
    const set = activeSet();
    VG.pointSats = set;
    const pos = new Float32Array(set.length * 3), col = new Float32Array(set.length * 3);
    for (let i = 0; i < set.length; i++) {
      const c = hexRgb(constMeta(set[i].group).color);
      col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2];
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(pos, 3));
    geo.setAttribute('color', new T.BufferAttribute(col, 3));
    VG.ptsGeo = geo;
    updatePoints(globe);
    const mat = new T.PointsMaterial({ size: 2.6, sizeAttenuation: false, vertexColors: true });
    VG.ptsObj = new T.Points(geo, mat);
    VG.ptsObj.renderOrder = 6;
    sc.add(VG.ptsObj);
  }
  function updatePoints(globe) {
    if (!VG.ptsGeo || !VG.pointSats) return;
    const arr = VG.ptsGeo.attributes.position.array;
    for (let i = 0; i < VG.pointSats.length; i++) {
      const p = propagate(VG.pointSats[i], VG.simTime);
      if (p) { const v = coord(globe, p.lat, p.lng, p.altGlobe); arr[i * 3] = v.x; arr[i * 3 + 1] = v.y; arr[i * 3 + 2] = v.z; }
    }
    VG.ptsGeo.attributes.position.needsUpdate = true;
  }
  function startClock() {
    stopClock();
    const globe = root.__ufologistGlobe;
    let lastReal = (typeof performance !== 'undefined' ? performance.now() : 0), acc = 0;
    const step = (ts) => {
      if (!VG || !VG.active) return;
      const dt = ts - lastReal; lastReal = ts;
      acc += dt;
      if (acc >= 66) {                       // reposicionar ~15 Hz (12k propagaciones/frame es caro)
        VG.simTime = new Date(VG.simTime.getTime() + acc * VG.simSpeed);  // simSpeed× tiempo real
        updatePoints(globe);
        acc = 0;
      }
      VG.raf = requestAnimationFrame(step);
    };
    VG.raf = requestAnimationFrame(step);
  }
  function stopClock() { if (VG && VG.raf) { cancelAnimationFrame(VG.raf); VG.raf = 0; } }

  model.enter = async function enter() {
    const globe = root.__ufologistGlobe;
    if (!globe || !TH() || !globe.scene) { console.warn('[UFOSat] globo/THREE no disponible'); return; }
    if (!VG) VG = { sats: [], filter: null, simTime: new Date(), simSpeed: 90, raf: 0, orbitObj: null, ptsObj: null };
    if (!VG.sats.length) {
      try { const d = await loadData(); VG.sats = d.sats; VG.live = d.live; console.log('[UFOSat]', VG.sats.length, 'satélites', d.live ? '(vivo)' : '(respaldo)'); }
      catch (e) { console.warn('[UFOSat] sin datos', e); VG.sats = []; }
    }
    VG.active = true;
    buildOrbits(globe);
    buildPoints(globe);
    startClock();
    showPanel();
  };
  model.exit = function exit() {
    const globe = root.__ufologistGlobe; const sc = globe && globe.scene && globe.scene();
    if (VG) {
      VG.active = false; stopClock();
      if (sc && VG.orbitObj) sc.remove(VG.orbitObj);
      if (sc && VG.ptsObj) sc.remove(VG.ptsObj);
      VG.orbitObj = null; VG.ptsObj = null;
    }
    hidePanel();
  };
  // --- Panel contextual del modo satélite (constelaciones + leyenda + velocidad) ---
  function groupCounts() { const c = {}; if (VG) VG.sats.forEach(s => c[s.group] = (c[s.group] || 0) + 1); return c; }
  function buildPanel() {
    let el = document.getElementById('sat-panel');
    if (!el) { el = document.createElement('aside'); el.id = 'sat-panel'; el.className = 'glass'; document.body.appendChild(el); }
    const counts = groupCounts(), present = model.constellationsPresent(), total = VG.sats.length;
    const chip = (g, label, n, color) =>
      `<button class="sat-chip${(VG.filter || '') === g ? ' active' : ''}" data-g="${g}" style="--c:${color}">` +
      `<span class="sc-dot"></span>${label}<b>${(n || 0).toLocaleString('es')}</b></button>`;
    el.innerHTML =
      '<div class="panel-head"><h2>Satélites</h2></div>' +
      `<p class="hint">${total.toLocaleString('es')} en órbita · ${VG.live ? 'CelesTrak (vivo)' : 'respaldo local'}</p>` +
      '<div class="sat-chips">' +
        chip('', 'Todas', total, '#93a1c0') +
        present.map(g => chip(g, constMeta(g).label, counts[g], constMeta(g).color)).join('') +
      '</div>' +
      '<p class="hint" style="margin-top:10px">Cada anillo = un plano orbital. Los puntos son satélites en tiempo simulado.</p>' +
      '<label class="sat-speed">Velocidad de simulación · ×<span id="sat-speed-val">' + VG.simSpeed + '</span>' +
        '<input type="range" id="sat-speed" min="1" max="600" value="' + VG.simSpeed + '"></label>';
    el.querySelectorAll('.sat-chip').forEach(b => b.onclick = () => {
      model.setFilter(b.dataset.g || null);
      el.querySelectorAll('.sat-chip').forEach(x => x.classList.toggle('active', x === b));
    });
    const sp = el.querySelector('#sat-speed');
    if (sp) sp.oninput = () => { model.setSpeed(+sp.value); const v = el.querySelector('#sat-speed-val'); if (v) v.textContent = sp.value; };
    el.style.display = '';
  }
  function showPanel() {
    buildPanel();
    const p = document.getElementById('panel-left');
    if (p) { if (VG._panelPrev === undefined) VG._panelPrev = p.style.display; p.style.display = 'none'; }
  }
  function hidePanel() {
    const e = document.getElementById('sat-panel'); if (e) e.style.display = 'none';
    const p = document.getElementById('panel-left'); if (p) p.style.display = (VG && VG._panelPrev !== undefined) ? VG._panelPrev : '';
  }
  model.setFilter = function (g) {
    if (!VG) return; VG.filter = g;
    const globe = root.__ufologistGlobe;
    buildOrbits(globe); buildPoints(globe);
  };
  model.setSpeed = function (x) { if (VG) VG.simSpeed = x; };
  model.constellationsPresent = function () {
    if (!VG) return [];
    const set = new Set(VG.sats.map(s => s.group));
    return Object.keys(CONSTELLATIONS).filter(g => set.has(g));
  };

  // ---------- Export (Node: pruebas · browser: global) ----------
  if (typeof module !== 'undefined' && module.exports) module.exports = model;
  else root.UFOSat = model;

})(typeof globalThis !== 'undefined' ? globalThis : this);
