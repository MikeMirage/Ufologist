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
    try { return await loadLive(); }
    catch (e) {
      const r = await fetch('data/tle-snapshot.json');
      const json = await r.json();
      return { sats: buildFromSnapshot(json), live: false };
    }
  }
  model.loadData = loadData;

  // ---------- Vista (SOLO navegador — no se ejecuta al cargar el módulo) ----------
  // Se conecta desde app.js cuando viewMode === 'satellites'. Requiere globe.gl + THREE.
  // NOTA: pendiente de verificación en navegador (F1); aquí queda la estructura.
  model.mountView = function (globe, opts) {
    opts = opts || {};
    const state = { sats: [], planes: [], filter: null, simTime: new Date(), simSpeed: 60, playing: false, raf: 0 };

    function activeSats() {
      return state.filter ? state.sats.filter(s => s.group === state.filter) : state.sats;
    }
    // Órbitas = líneas por plano representativo (barato + estructural)
    function orbitPaths() {
      const reps = representativePlanes(activeSats());
      return reps.map(s => ({
        group: s.group, color: constMeta(s.group).color,
        coords: sampleOrbit(s, state.simTime, 96),
      }));
    }
    // Puntos vivos = posición de cada satélite del set activo
    function livePoints() {
      const now = state.simTime, out = [];
      for (const s of activeSats()) {
        const p = propagate(s, now);
        if (p) out.push({ sat: s, lat: p.lat, lng: p.lng, alt: p.altGlobe, color: constMeta(s.group).color });
      }
      return out;
    }
    function render() {
      if (globe.pathsData) globe.pathsData(orbitPaths())
        .pathPointLat(d => d[0]).pathPointLng(d => d[1]).pathPointAlt(d => d[2])
        .pathColor(p => p.color).pathStroke(1.2);
      // puntos vivos → capa de objetos/points (globe.gl); wiring exacto en F1
      if (typeof opts.onPoints === 'function') opts.onPoints(livePoints());
    }
    function tick(t) {
      if (!state.playing) return;
      state.simTime = new Date(state.simTime.getTime() + 1000 * state.simSpeed / 60);
      render();
      state.raf = requestAnimationFrame(tick);
    }
    return {
      setSats(sats) { state.sats = sats; render(); },
      setFilter(g) { state.filter = g; render(); },
      setSpeed(x) { state.simSpeed = x; },
      play() { if (!state.playing) { state.playing = true; state.raf = requestAnimationFrame(tick); } },
      pause() { state.playing = false; cancelAnimationFrame(state.raf); },
      render, activeSats, orbitPaths, livePoints, state,
    };
  };

  // ---------- Export (Node: pruebas · browser: global) ----------
  if (typeof module !== 'undefined' && module.exports) module.exports = model;
  else root.UFOSat = model;

})(typeof globalThis !== 'undefined' ? globalThis : this);
