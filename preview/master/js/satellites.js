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
    stations: { label: 'Tripuladas / ISS', en: 'Crewed / ISS', color: '#ffd166' },
    starlink: { label: 'Starlink', en: 'Starlink', color: '#18d7ff' },
    oneweb:   { label: 'OneWeb', en: 'OneWeb', color: '#4be1c3' },
    'gps-ops':{ label: 'GPS', en: 'GPS', color: '#80ed99' },
    galileo:  { label: 'Galileo', en: 'Galileo', color: '#7fd0ff' },
    'glo-ops':{ label: 'GLONASS', en: 'GLONASS', color: '#ef476f' },
    beidou:   { label: 'BeiDou', en: 'BeiDou', color: '#f78c6b' },
    geo:      { label: 'Geoestacionarios', en: 'Geostationary', color: '#b388ff' },
    weather:  { label: 'Meteorológicos', en: 'Weather', color: '#9d7bff' },
    science:  { label: 'Científicos', en: 'Science', color: '#f4a8ff' },
  };
  function constMeta(group) { return CONSTELLATIONS[group] || { label: group, en: group, color: '#93a1c0' }; }
  function lang() { return (root.__ufologistLang === 'en') ? 'en' : 'es'; }
  function constLabel(group) { const m = constMeta(group); return lang() === 'en' ? (m.en || m.label) : m.label; }

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
  // Año de lanzamiento desde el designador internacional (COSPAR) del TLE:
  // línea 1, columnas 10-11 = últimos 2 dígitos del año (>=57 → 19xx, si no 20xx).
  function launchYear(l1) {
    const yy = parseInt((l1 || '').slice(9, 11), 10);
    if (!isFinite(yy)) return null;
    return yy >= 57 ? 1900 + yy : 2000 + yy;
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
      launchYear: launchYear(l1),
    };
  }
  // histograma de satélites por año de lanzamiento (apilado por constelación)
  function launchHistogram(sats) {
    const byYear = {}; let min = 9999, max = 0;
    for (const s of sats) {
      const y = s.launchYear; if (!y) continue;
      (byYear[y] = byYear[y] || {})[s.group] = ((byYear[y] || {})[s.group] || 0) + 1;
      if (y < min) min = y; if (y > max) max = y;
    }
    return { byYear, minYear: min, maxYear: max };
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
  // muestrea UNA ÓRBITA COMPLETA (elipse inercial), no la traza terrestre.
  // Clave: se usa un gmst FIJO (la rotación de la Tierra en el instante de
  // referencia) para todas las muestras, en vez de gstime(t) por muestra. Así
  // el anillo es la órbita real en el espacio (círculo/elipse cerrada para
  // LEO/MEO/GEO) anclada a la posición actual del satélite; si se usara
  // gstime(t) se restaría la rotación terrestre y saldría la traza (analema
  // en GEO, onda en MEO) → aspecto "extraño" para órbitas lejanas.
  function sampleOrbit(sat, date, n) {
    const S = lib(); if (!S || !sat) return [];
    n = n || 96;
    const periodMin = sat.meanMotion > 0 ? 1440 / sat.meanMotion : 90;
    const gmst = S.gstime(date);
    const pts = [];
    for (let k = 0; k <= n; k++) {
      const t = new Date(date.getTime() + (k / n) * periodMin * 60000);
      let pv; try { pv = S.propagate(sat.satrec, t); } catch (e) { continue; }
      if (!pv || !pv.position) continue;
      const gd = S.eciToGeodetic(pv.position, gmst);
      const lat = S.degreesLat(gd.latitude), lng = S.degreesLong(gd.longitude), alt = gd.height;
      if (isFinite(lat) && isFinite(lng) && isFinite(alt)) pts.push([lat, lng, alt / EARTH_R_KM]);
    }
    return pts;
  }

  // detalle instantáneo de un satélite (posición + cinemática) para la ficha
  function satDetail(sat, date) {
    const S = lib(); if (!S || !sat) return null;
    let pv; try { pv = S.propagate(sat.satrec, date); } catch (e) { return null; }
    if (!pv || !pv.position) return null;
    const gd = S.eciToGeodetic(pv.position, S.gstime(date));
    const lat = S.degreesLat(gd.latitude), lng = S.degreesLong(gd.longitude), alt = gd.height;
    const v = pv.velocity ? Math.sqrt(pv.velocity.x ** 2 + pv.velocity.y ** 2 + pv.velocity.z ** 2) : null;
    return {
      name: sat.name, id: sat.id, group: sat.group, label: constMeta(sat.group).label,
      lat, lng, alt, band: orbitBand(alt),
      periodMin: sat.meanMotion > 0 ? 1440 / sat.meanMotion : null,
      incDeg: sat.incDeg, speedKmS: v,
    };
  }

  // vector unitario geocéntrico (frame arbitrario pero consistente obs↔sat)
  function unitVec(latDeg, lngDeg) {
    const la = latDeg / DEG, lo = lngDeg / DEG, cl = Math.cos(la);
    return [cl * Math.cos(lo), Math.sin(la), cl * Math.sin(lo)];
  }
  // satélites sobre el horizonte de un observador (lat,lng) en un instante:
  // devuelve {sat, elev(°), range(km), alt, band} ordenado por elevación desc.
  function overheadSats(sats, obsLat, obsLng, date, minElev) {
    const R = EARTH_R_KM, u = unitVec(obsLat, obsLng);
    const Ox = u[0] * R, Oy = u[1] * R, Oz = u[2] * R;
    const res = [];
    for (const s of sats) {
      const p = propagate(s, date); if (!p) continue;
      const us = unitVec(p.lat, p.lng), rs = R + p.alt;
      const dx = us[0] * rs - Ox, dy = us[1] * rs - Oy, dz = us[2] * rs - Oz;
      const rng = Math.sqrt(dx * dx + dy * dy + dz * dz); if (!rng) continue;
      const elev = 90 - Math.acos((dx * u[0] + dy * u[1] + dz * u[2]) / rng) * DEG;
      if (elev >= (minElev || 0)) res.push({ sat: s, elev, range: rng, alt: p.alt, band: orbitBand(p.alt) });
    }
    res.sort((a, b) => b.elev - a.elev);
    return res;
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
    propagate, satDetail, overheadSats, sampleOrbit, representativePlanes, planeKey,
    launchYear, launchHistogram, EARTH_R_KM,
  };

  // ---------- Carga de datos (browser: vivo + respaldo) ----------
  const CELESTRAK = 'https://celestrak.org/NORAD/elements/gp.php?FORMAT=tle&GROUP=';
  const LIVE_GROUPS = Object.keys(CONSTELLATIONS);
  const LIVE_CACHE_KEY = 'ufologist-tle-live-cache-v1';
  const LIVE_CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
  function compactSnapshot(sats) {
    const groups = {};
    (sats || []).forEach(s => {
      (groups[s.group] = groups[s.group] || []).push({ n: s.name, id: s.id, l1: s.l1, l2: s.l2 });
    });
    return { groups };
  }
  function readLiveCache() {
    if (!root.localStorage) return [];
    try {
      const cached = JSON.parse(root.localStorage.getItem(LIVE_CACHE_KEY) || 'null');
      if (!cached || Date.now() - cached.savedAt > LIVE_CACHE_MAX_AGE) return [];
      return buildFromSnapshot(cached.snapshot || {});
    } catch (e) { return []; }
  }
  function writeLiveCache(sats) {
    if (!root.localStorage || !sats?.length) return;
    try {
      root.localStorage.setItem(LIVE_CACHE_KEY, JSON.stringify({
        savedAt: Date.now(),
        snapshot: compactSnapshot(sats),
      }));
    } catch (e) {}
  }
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
      const sats = [...byId.values()];
      writeLiveCache(sats);
      return { sats, live: true };
    } catch (e) {
      return { sats: base, live: base.length > 0 ? false : false };
    }
  }
  model.loadData = loadData;

  // ---------- Lanzamientos (LL2 snapshot) ----------
  async function loadLaunches() {
    try { const r = await fetch('data/launches.json'); const j = await r.json(); return (j.launches || []); }
    catch (e) { return []; }
  }
  // agrupa lanzamientos por sitio (pad) → [{lat,lng,padName,launches[]}]
  function groupPads(launches) {
    const m = new Map();
    for (const L of launches) {
      if (typeof L.lat !== 'number' || typeof L.lng !== 'number') continue;
      const key = L.lat.toFixed(3) + ',' + L.lng.toFixed(3);
      if (!m.has(key)) m.set(key, { lat: L.lat, lng: L.lng, padName: L.padName || '', launches: [] });
      m.get(key).launches.push(L);
    }
    return [...m.values()];
  }
  model.loadLaunches = loadLaunches;
  model.groupPads = groupPads;

  // ---------- Vista (SOLO navegador) ----------
  // Órbitas y satélites se dibujan como objetos THREE propios en la escena del
  // globo (LineSegments + Points, 1 draw call cada uno) → sin competir con
  // pathsData (capa política) ni objectsData. Coordenadas vía globe.getCoords.
  let VG = null;
  function TH() { return (typeof THREE !== 'undefined') ? THREE : root.THREE; }
  // --- i18n del UI satelital (lee root.__ufologistLang que fija app.js) ---
  const I18N_SAT = {
    es: {
      sats: 'Satélites', inOrbit: 'en órbita', live: 'CelesTrak (vivo)', cache: 'último catálogo en vivo', backup: 'respaldo local',
      all: 'Todas', ringNote: 'Cada anillo = un plano orbital. Los puntos son satélites en tiempo simulado.',
      launchSites: 'Sitios de lanzamiento', analyzeSky: '🔭 Analizar cielo sobre un lugar',
      skyHint: 'Clic en el globo para ver qué satélites hay sobre ese punto. El tiempo se pausa.',
      simSpeed: 'Velocidad de simulación · ×', regime: 'Régimen', altitude: 'Altitud', speed: 'Velocidad',
      period: 'Periodo', inclination: 'Inclinación', position: 'Posición', close: 'Cerrar',
      launchSite: 'Sitio de lanzamiento', upcoming: 'Próximo', success: 'Éxito', failure: 'Fallo',
      skyTitle: 'Análisis de cielo', highSky: 'Cielo alto &gt;30°', leoOrbit: 'Órbita baja (LEO)',
      nakedEye: 'Candidatos a simple vista (LEO, &gt;10°):', noneVisible: 'Ningún satélite LEO brillante sobre 10° ahora mismo.',
      noteExact: 'Posiciones calculadas para la fecha y hora reales del avistamiento (dentro de la validez del TLE). ',
      noteNow: 'Posiciones para el instante simulado actual: los TLE (~2026) no reconstruyen con precisión fechas fuera de unas semanas. ',
      noteTail: 'Solo los satélites LEO iluminados por el Sol con cielo oscuro son visibles a simple vista; GPS/GEO no lo son.',
      scaleReal: 'Escala de altitud: real', scaleCompressed: 'Escala de altitud: comprimida',
      scaleHint: 'La escala real es fiel a la distancia (LEO pega a la superficie, GEO a 6.6×); la comprimida separa los regímenes para verlos mejor.',
      tlTitle: 'Satélites en órbita por año de lanzamiento',
      tlUpTo: (n, y) => `${n.toLocaleString('es')} lanzados hasta ${y}`,
      tlPlayTitle: 'Reproducir la evolución',
      tlLaunchLine: 'lanzamientos/año',
      launches: n => `${n} lanzamiento${n !== 1 ? 's' : ''}`, more: n => `+${n} más`,
      overHorizon: n => `${n.toLocaleString('es')} satélites sobre el horizonte`,
    },
    en: {
      sats: 'Satellites', inOrbit: 'in orbit', live: 'CelesTrak (live)', cache: 'last live catalog', backup: 'local backup',
      all: 'All', ringNote: 'Each ring is one orbital plane. Dots are satellites in simulated time.',
      launchSites: 'Launch sites', analyzeSky: '🔭 Analyze the sky over a place',
      skyHint: 'Click the globe to see which satellites are above that point. Time is paused.',
      simSpeed: 'Simulation speed · ×', regime: 'Regime', altitude: 'Altitude', speed: 'Speed',
      period: 'Period', inclination: 'Inclination', position: 'Position', close: 'Close',
      launchSite: 'Launch site', upcoming: 'Upcoming', success: 'Success', failure: 'Failure',
      skyTitle: 'Sky analysis', highSky: 'High sky &gt;30°', leoOrbit: 'Low orbit (LEO)',
      nakedEye: 'Naked-eye candidates (LEO, &gt;10°):', noneVisible: 'No bright LEO satellite above 10° right now.',
      noteExact: 'Positions computed for the sighting’s real date and time (within TLE validity). ',
      noteNow: 'Positions for the current simulated instant: TLEs (~2026) don’t accurately reconstruct dates beyond a few weeks. ',
      noteTail: 'Only sunlit LEO satellites under a dark sky are visible to the naked eye; GPS/GEO are not.',
      scaleReal: 'Altitude scale: real', scaleCompressed: 'Altitude scale: compressed',
      scaleHint: 'Real scale is true to distance (LEO hugs the surface, GEO at 6.6×); compressed separates the regimes so they are easier to see.',
      tlTitle: 'Satellites in orbit by launch year',
      tlUpTo: (n, y) => `${n.toLocaleString('en')} launched through ${y}`,
      tlPlayTitle: 'Play the evolution',
      tlLaunchLine: 'launches/yr',
      launches: n => `${n} launch${n !== 1 ? 'es' : ''}`, more: n => `+${n} more`,
      overHorizon: n => `${n.toLocaleString('en')} satellites above the horizon`,
    },
  };
  function L(key) { const d = I18N_SAT[lang()] || I18N_SAT.es; return d[key] !== undefined ? d[key] : I18N_SAT.es[key]; }
  function loc() { return lang() === 'en' ? 'en-US' : 'es-ES'; }
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
  // Altitud VISUAL de los satélites. A escala real, LEO (~0.08 R⊕) se pega a la
  // superficie y MEO/GEO quedan a 4–6.6×, poco legible. Con compresión (raíz)
  // se mantiene el orden pero se separan los regímenes: LEO≈1.2×, MEO≈2.2×,
  // GEO≈2.7×. No afecta a los datos (la ficha muestra la altitud real).
  const SCALE_K = 0.7;
  function vAlt(a) { return (VG && VG.realScale) ? a : SCALE_K * Math.sqrt(Math.max(0, a)); }
  function coordSat(globe, lat, lng, altGlobe) { return coord(globe, lat, lng, vAlt(altGlobe)); }
  function activeSet() {
    let set = VG.filter ? VG.sats.filter(s => s.group === VG.filter) : VG.sats;
    if (VG.yearMax != null) set = set.filter(s => !s.launchYear || s.launchYear <= VG.yearMax);  // acumulativo hasta el año
    return set;
  }

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
        const a = coordSat(globe, pts[i][0], pts[i][1], pts[i][2]);
        const b = coordSat(globe, pts[i + 1][0], pts[i + 1][1], pts[i + 1][2]);
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
    // Los anillos son inerciales, anclados a la orientación de la Tierra en este
    // instante. Al avanzar el tiempo simulado se rotan sobre el eje Y con la
    // rotación terrestre para que los satélites (en ECEF) sigan sobre su anillo.
    const S = lib(); VG.orbitRefGmst = S ? S.gstime(VG.simTime) : 0;
    VG.orbitObj.rotation.y = 0;
    sc.add(VG.orbitObj);
  }
  function updateOrbitSpin() {
    if (!VG.orbitObj || VG.orbitRefGmst === undefined) return;
    const S = lib(); if (!S) return;
    // -Δgmst en el frame de globe.getCoords (valida: el punto permanece sobre
    // el anillo <1% durante 40 min de simulación; +Δgmst lo desvía >15%).
    VG.orbitObj.rotation.y = -(S.gstime(VG.simTime) - VG.orbitRefGmst);
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
    let maxA = 0;
    for (let i = 0; i < VG.pointSats.length; i++) {
      const p = propagate(VG.pointSats[i], VG.simTime);
      if (p) { const v = coordSat(globe, p.lat, p.lng, p.altGlobe); arr[i * 3] = v.x; arr[i * 3 + 1] = v.y; arr[i * 3 + 2] = v.z; if (p.altGlobe > maxA) maxA = p.altGlobe; }
    }
    VG.maxAltGlobe = maxA;
    VG.ptsGeo.attributes.position.needsUpdate = true;
  }
  // Asegura que el zoom-out (OrbitControls.maxDistance) rebase el radio visual del
  // satélite más lejano; también amplía el plano lejano de la cámara si hace falta.
  function ensureZoomRange(globe) {
    const ctrl = globe.controls && globe.controls(); if (!ctrl) return;
    const farR = 100 * (1 + vAlt(VG.maxAltGlobe || 5.7));   // GEO como respaldo
    if (VG._prevMaxDist === undefined) VG._prevMaxDist = ctrl.maxDistance;   // el de la vista Tierra
    ctrl.maxDistance = Math.max(VG._prevMaxDist || 0, farR * 1.8);
    const cam = globe.camera && globe.camera();
    if (cam) {
      if (VG._prevFar === undefined) VG._prevFar = cam.far;
      // al alejar del todo, los satélites del lado opuesto quedan a
      // maxDistance + farR de la cámara → el plano lejano debe superarlo
      const need = ctrl.maxDistance + farR * 1.4;
      if (cam.far < need) { cam.far = need; cam.updateProjectionMatrix(); }
    }
    if (ctrl.update) ctrl.update();
  }
  function restoreZoomRange(globe) {
    const ctrl = globe.controls && globe.controls();
    if (ctrl && VG._prevMaxDist !== undefined) { ctrl.maxDistance = VG._prevMaxDist; if (ctrl.update) ctrl.update(); }
    const cam = globe.camera && globe.camera();
    if (cam && VG._prevFar !== undefined) { cam.far = VG._prevFar; cam.updateProjectionMatrix(); }
    VG._prevMaxDist = undefined; VG._prevFar = undefined;
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
        updateSel(globe);
        updateMissionFollow(globe, false);
        updateSkyLines(globe);
        updateOrbitSpin(globe);
        if ((VG._dcnt = (VG._dcnt || 0) + 1) % 8 === 0) refreshDetail();  // ficha ~2 Hz
        acc = 0;
      }
      VG.raf = requestAnimationFrame(step);
    };
    VG.raf = requestAnimationFrame(step);
  }
  function stopClock() { if (VG && VG.raf) { cancelAnimationFrame(VG.raf); VG.raf = 0; } }

  // ---------- Selección / picking de un satélite ----------
  // ¿la Tierra (esfera R=100 en el origen) tapa el punto P visto desde la cámara?
  function occluded(globe, x, y, z) {
    const C = globe.camera().position;
    const dx = x - C.x, dy = y - C.y, dz = z - C.z;
    const L = Math.sqrt(dx * dx + dy * dy + dz * dz); if (!L) return false;
    const ux = dx / L, uy = dy / L, uz = dz / L;
    const b = 2 * (ux * C.x + uy * C.y + uz * C.z);
    const c = (C.x * C.x + C.y * C.y + C.z * C.z) - 100 * 100;
    const disc = b * b - 4 * c;
    if (disc <= 0) return false;
    const t1 = (-b - Math.sqrt(disc)) / 2;
    return t1 > 0.5 && t1 < L - 0.5;   // la esfera cruza entre cámara y punto
  }
  // satélite más cercano al cursor (espacio de pantalla), no ocluido
  function pickSat(globe, clientX, clientY) {
    if (!VG || !VG.ptsGeo || !VG.pointSats) return null;
    const T = TH(), cam = globe.camera();
    const rect = globe.renderer().domElement.getBoundingClientRect();
    const arr = VG.ptsGeo.attributes.position.array;
    const v = new T.Vector3();
    let best = null, bestD = 14;       // umbral en px
    for (let i = 0; i < VG.pointSats.length; i++) {
      const x = arr[i * 3], y = arr[i * 3 + 1], z = arr[i * 3 + 2];
      if (x === 0 && y === 0 && z === 0) continue;
      v.set(x, y, z).project(cam);
      if (v.z > 1) continue;           // detrás de la cámara
      const sx = rect.left + (v.x * 0.5 + 0.5) * rect.width;
      const sy = rect.top + (-v.y * 0.5 + 0.5) * rect.height;
      const d = Math.hypot(sx - clientX, sy - clientY);
      if (d < bestD && !occluded(globe, x, y, z)) { bestD = d; best = VG.pointSats[i]; }
    }
    return best;
  }
  function ringTexture() {
    if (VG._ringTex) return VG._ringTex;
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = 5;
    g.beginPath(); g.arc(32, 32, 25, 0, Math.PI * 2); g.stroke();
    VG._ringTex = new (TH()).CanvasTexture(c);
    return VG._ringTex;
  }
  function buildSelObj(globe) {
    const T = TH(), sc = globe.scene();
    if (VG.selObj) { sc.remove(VG.selObj); VG.selObj.geometry.dispose(); VG.selObj = null; }
    if (!VG.selSat) return;
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(new Float32Array(3), 3));
    const mat = new T.PointsMaterial({ size: 18, sizeAttenuation: false, map: ringTexture(), transparent: true, depthTest: false });
    VG.selObj = new T.Points(geo, mat);
    VG.selObj.renderOrder = 8;
    sc.add(VG.selObj);
    updateSel(globe);
  }
  function updateSel(globe) {
    if (!VG.selObj || !VG.selSat) return;
    const p = propagate(VG.selSat, VG.simTime); if (!p) return;
    const v = coordSat(globe, p.lat, p.lng, p.altGlobe);
    const a = VG.selObj.geometry.attributes.position.array;
    a[0] = v.x; a[1] = v.y; a[2] = v.z;
    VG.selObj.geometry.attributes.position.needsUpdate = true;
  }
  function missionSatellite(spec) {
    if (!VG?.sats?.length || !spec) return null;
    if (spec.synthetic) return null;
    if (spec.id) {
      const exact = VG.sats.find(s => String(s.id) === String(spec.id));
      if (exact) return exact;
    }
    const names = (spec.names || []).map(name => String(name).toUpperCase());
    return VG.sats.find(s => (!spec.group || s.group === spec.group)
      && names.some(name => String(s.name).toUpperCase().includes(name)))
      || (spec.group ? VG.sats.find(s => s.group === spec.group) : null);
  }
  function heritagePosition(spec, date, fixedGmst) {
    const inc = (spec.incDeg || 0) / DEG;
    const raan = (spec.raanDeg || 0) / DEG;
    const phase = (spec.phaseDeg || 0) / DEG;
    const periodMs = (spec.periodMin || 96) * 60000;
    const theta = phase + ((date.getTime() % periodMs) / periodMs) * Math.PI * 2;
    const x = Math.cos(raan) * Math.cos(theta) - Math.sin(raan) * Math.sin(theta) * Math.cos(inc);
    const y = Math.sin(raan) * Math.cos(theta) + Math.cos(raan) * Math.sin(theta) * Math.cos(inc);
    const z = Math.sin(theta) * Math.sin(inc);
    const gmst = fixedGmst == null ? (lib()?.gstime(date) || 0) : fixedGmst;
    const lat = Math.asin(Math.max(-1, Math.min(1, z))) * DEG;
    let lng = (Math.atan2(y, x) - gmst) * DEG;
    lng = ((lng + 540) % 360) - 180;
    const alt = spec.altKm || 550;
    return { lat, lng, alt, altGlobe: alt / EARTH_R_KM };
  }
  function missionPosition(follow, date) {
    return follow.sat ? propagate(follow.sat, date) : heritagePosition(follow.spec, date);
  }
  function clearMissionObjects() {
    const sc = root.__ufologistGlobe?.scene?.();
    ['followMarkerObj', 'followRouteObj'].forEach(key => {
      const obj = VG?.[key];
      if (sc && obj) sc.remove(obj);
      if (obj?.geometry) obj.geometry.dispose();
      if (obj?.material) obj.material.dispose();
      if (VG) VG[key] = null;
    });
  }
  function buildMissionRoute(globe, follow) {
    const T = TH(), sc = globe.scene?.();
    if (!T || !sc) return;
    clearMissionObjects();
    const samples = follow.sat
      ? sampleOrbit(follow.sat, VG.simTime, 180)
      : (() => {
          const points = [];
          const gmst = lib()?.gstime(VG.simTime) || 0;
          const period = (follow.spec.periodMin || 96) * 60000;
          for (let i = 0; i <= 180; i++) {
            const p = heritagePosition(follow.spec, new Date(VG.simTime.getTime() + period * i / 180), gmst);
            points.push([p.lat, p.lng, p.altGlobe]);
          }
          return points;
        })();
    const routePoints = samples.map(p => {
      const v = coordSat(globe, p[0], p[1], p[2]);
      return new T.Vector3(v.x, v.y, v.z);
    });
    const color = follow.spec.color || constMeta(follow.sat?.group || follow.spec.group).color;
    VG.followRouteObj = new T.Line(
      new T.BufferGeometry().setFromPoints(routePoints),
      new T.LineBasicMaterial({ color, transparent: true, opacity: 0.95, depthTest: false })
    );
    VG.followRouteObj.renderOrder = 9;
    VG.followRouteRefGmst = lib()?.gstime(VG.simTime) || 0;
    sc.add(VG.followRouteObj);
    if (!follow.sat) {
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.BufferAttribute(new Float32Array(3), 3));
      VG.followMarkerObj = new T.Points(geo, new T.PointsMaterial({
        size: 34, sizeAttenuation: false, map: ringTexture(), color,
        transparent: true, depthTest: false,
      }));
      VG.followMarkerObj.renderOrder = 10;
      sc.add(VG.followMarkerObj);
    }
  }
  function showHeritageDetail(follow) {
    let el = document.getElementById('sat-detail');
    if (!el) { el = document.createElement('aside'); el.id = 'sat-detail'; el.className = 'glass'; document.body.appendChild(el); }
    const s = follow.spec;
    el.style.display = '';
    el.innerHTML =
      `<div class="sd-head"><span class="sd-dot" style="background:${s.color};color:${s.color}"></span><h3>${s.label}</h3></div>` +
      `<p class="sd-sub">${lang() === 'en' ? 'Historical orbital reconstruction' : 'Reconstrucción orbital histórica'}</p>` +
      '<dl class="sd-grid">' +
        `<div><dt>${L('regime')}</dt><dd>${orbitBand(s.altKm)}</dd></div>` +
        `<div><dt>${L('altitude')}</dt><dd>≈ ${Math.round(s.altKm).toLocaleString(loc())} km</dd></div>` +
        `<div><dt>${L('period')}</dt><dd>≈ ${s.periodMin} min</dd></div>` +
        `<div><dt>${L('inclination')}</dt><dd>${s.incDeg.toFixed(1)}°</dd></div>` +
      '</dl>';
  }
  function updateMissionFollow(globe, immediate) {
    const follow = VG?.follow;
    const T = TH();
    if (!follow || !T) return;
    const p = missionPosition(follow, VG.simTime);
    if (!p) return;
    if (VG.followRouteObj && VG.followRouteRefGmst != null) {
      VG.followRouteObj.rotation.y = -((lib()?.gstime(VG.simTime) || 0) - VG.followRouteRefGmst);
    }
    const raw = coordSat(globe, p.lat, p.lng, p.altGlobe);
    const target = new T.Vector3(raw.x, raw.y, raw.z);
    if (VG.followMarkerObj) {
      const a = VG.followMarkerObj.geometry.attributes.position.array;
      a[0] = target.x; a[1] = target.y; a[2] = target.z;
      VG.followMarkerObj.geometry.attributes.position.needsUpdate = true;
    }
    const cam = globe.camera?.(), ctrl = globe.controls?.();
    if (!cam || !ctrl) return;
    const radial = target.clone().normalize();
    let tangent = follow.lastTarget ? target.clone().sub(follow.lastTarget) : new T.Vector3(-radial.z, 0, radial.x);
    if (tangent.lengthSq() < 0.0001) tangent.set(-radial.z, 0, radial.x);
    tangent.normalize();
    const side = new T.Vector3().crossVectors(radial, tangent).normalize();
    const ideal = target.clone()
      .add(radial.multiplyScalar(follow.spec.cameraOut || 80))
      .add(tangent.multiplyScalar(-(follow.spec.cameraBack || 95)))
      .add(side.multiplyScalar(follow.spec.cameraSide || 20));
    if (immediate || !follow.lastTarget) {
      cam.position.copy(ideal);
      ctrl.target.copy(target);
    } else {
      cam.position.lerp(ideal, 0.09);
      ctrl.target.lerp(target, 0.24);
    }
    cam.lookAt(ctrl.target);
    ctrl.update?.();
    follow.lastTarget = target;
  }
  model.focusMission = function focusMission(spec) {
    if (!VG || !spec) return null;
    model.stopMissionFocus();
    const sat = missionSatellite(spec);
    VG.follow = { spec, sat, lastTarget: null };
    const ctrl = root.__ufologistGlobe?.controls?.();
    if (ctrl) {
      VG.follow.prevControls = { enablePan: ctrl.enablePan, autoRotate: ctrl.autoRotate };
      ctrl.enablePan = false;
      ctrl.autoRotate = false;
    }
    document.body.classList.add('sat-expedition-active');
    buildMissionRoute(root.__ufologistGlobe, VG.follow);
    if (sat) {
      selectSat(sat);
      if (VG.selObj?.material) {
        VG.selObj.material.size = 34;
        VG.selObj.material.color?.set(spec.color || constMeta(sat.group).color);
      }
    } else { selectSat(null); showHeritageDetail(VG.follow); }
    updateMissionFollow(root.__ufologistGlobe, true);
    return { found: !!sat, name: sat?.name || spec.label, id: sat?.id || null };
  };
  model.stopMissionFocus = function stopMissionFocus() {
    if (!VG) return;
    const ctrl = root.__ufologistGlobe?.controls?.();
    const previous = VG.follow?.prevControls;
    if (ctrl && previous) {
      ctrl.enablePan = previous.enablePan;
      ctrl.autoRotate = previous.autoRotate;
    }
    VG.follow = null;
    clearMissionObjects();
    selectSat(null);
    document.body.classList.remove('sat-expedition-active');
  };
  function refreshDetail() {
    const el = document.getElementById('sat-detail'); if (!el || !VG || !VG.selSat) return;
    const d = satDetail(VG.selSat, VG.simTime); if (!d) return;
    const c = constMeta(d.group).color;
    el.innerHTML =
      `<button id="sat-detail-close" class="sat-detail-close" aria-label="${L('close')}">×</button>` +
      `<div class="sd-head"><span class="sd-dot" style="background:${c};color:${c}"></span><h3>${d.name}</h3></div>` +
      `<p class="sd-sub">${constLabel(d.group)} · NORAD ${d.id}</p>` +
      '<dl class="sd-grid">' +
        `<div><dt>${L('regime')}</dt><dd>${d.band}</dd></div>` +
        `<div><dt>${L('altitude')}</dt><dd>${Math.round(d.alt).toLocaleString(loc())} km</dd></div>` +
        `<div><dt>${L('speed')}</dt><dd>${d.speedKmS ? d.speedKmS.toFixed(2) : '—'} km/s</dd></div>` +
        `<div><dt>${L('period')}</dt><dd>${d.periodMin ? d.periodMin.toFixed(0) : '—'} min</dd></div>` +
        `<div><dt>${L('inclination')}</dt><dd>${d.incDeg.toFixed(1)}°</dd></div>` +
        `<div><dt>${L('position')}</dt><dd>${d.lat.toFixed(1)}°, ${d.lng.toFixed(1)}°</dd></div>` +
      '</dl>';
    const close = el.querySelector('#sat-detail-close');
    if (close) close.onclick = () => selectSat(null);
  }
  function selectSat(sat) {
    if (!VG) return;
    VG.selSat = sat;
    buildSelObj(root.__ufologistGlobe);
    let el = document.getElementById('sat-detail');
    if (sat) {
      if (!el) { el = document.createElement('aside'); el.id = 'sat-detail'; el.className = 'glass'; document.body.appendChild(el); }
      el.style.display = '';
      refreshDetail();
    } else if (el) { el.style.display = 'none'; }
  }
  function attachPick(globe) {
    const dom = globe.renderer().domElement;
    let dx = 0, dy = 0, moved = false;
    VG._onDown = e => { dx = e.clientX; dy = e.clientY; moved = false; };
    VG._onMove = e => { if (Math.hypot(e.clientX - dx, e.clientY - dy) > 5) moved = true; };
    VG._onUp = e => {
      if (moved || e.button !== 0) return;
      if (VG.skyMode) {                                   // modo cielo: clic = fijar observador
        const loc = raycastGlobe(globe, e.clientX, e.clientY);
        if (loc) setSkyLocation(globe, loc.lat, loc.lng);
        return;
      }
      const pad = pickPad(globe, e.clientX, e.clientY);   // los sitios tienen prioridad (marcador mayor)
      if (pad) { selectPad(pad); return; }
      selectPad(null);
      selectSat(pickSat(globe, e.clientX, e.clientY));
    };
    dom.addEventListener('pointerdown', VG._onDown);
    dom.addEventListener('pointermove', VG._onMove);
    dom.addEventListener('pointerup', VG._onUp);
    VG._pickDom = dom;
  }
  function detachPick() {
    const dom = VG && VG._pickDom; if (!dom) return;
    dom.removeEventListener('pointerdown', VG._onDown);
    dom.removeEventListener('pointermove', VG._onMove);
    dom.removeEventListener('pointerup', VG._onUp);
    VG._pickDom = null;
  }

  // ---------- Sitios de lanzamiento (pads) ----------
  const PAD_ALT = 0.01;   // ligeramente sobre la superficie para evitar z-fighting
  function nowMs() { return Date.parse(new Date().toISOString()); }
  function padHasUpcoming(pad) { const n = nowMs(); return pad.launches.some(L => Date.parse(L.net) >= n); }
  function padTexture() {
    if (VG._padTex) return VG._padTex;
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    g.fillStyle = 'rgba(255,255,255,0.97)';
    g.beginPath(); g.moveTo(32, 8); g.lineTo(54, 52); g.lineTo(10, 52); g.closePath(); g.fill();
    VG._padTex = new (TH()).CanvasTexture(c);
    return VG._padTex;
  }
  function buildPads(globe) {
    const T = TH(), sc = globe.scene();
    if (VG.padObj) { sc.remove(VG.padObj); VG.padObj.geometry.dispose(); VG.padObj = null; }
    if (!VG.showPads || !VG.pads || !VG.pads.length) return;
    const pos = new Float32Array(VG.pads.length * 3), col = new Float32Array(VG.pads.length * 3);
    VG.padData = VG.pads;
    for (let i = 0; i < VG.pads.length; i++) {
      const p = VG.pads[i], v = coord(globe, p.lat, p.lng, PAD_ALT);
      pos[i * 3] = v.x; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z;
      const up = padHasUpcoming(p);                     // próximos = ámbar vivo; solo pasados = tenue
      col[i * 3] = 1; col[i * 3 + 1] = up ? 0.68 : 0.5; col[i * 3 + 2] = up ? 0.32 : 0.28;
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(pos, 3));
    geo.setAttribute('color', new T.BufferAttribute(col, 3));
    const mat = new T.PointsMaterial({ size: 13, sizeAttenuation: false, map: padTexture(), vertexColors: true, transparent: true, alphaTest: 0.4 });
    VG.padObj = new T.Points(geo, mat);
    VG.padObj.renderOrder = 7;
    sc.add(VG.padObj);
  }
  function pickPad(globe, clientX, clientY) {
    if (!VG || !VG.padObj || !VG.padData) return null;
    const T = TH(), cam = globe.camera();
    const rect = globe.renderer().domElement.getBoundingClientRect();
    const arr = VG.padObj.geometry.attributes.position.array;
    const v = new T.Vector3();
    let best = null, bestD = 16;
    for (let i = 0; i < VG.padData.length; i++) {
      const x = arr[i * 3], y = arr[i * 3 + 1], z = arr[i * 3 + 2];
      v.set(x, y, z).project(cam);
      if (v.z > 1) continue;
      const sx = rect.left + (v.x * 0.5 + 0.5) * rect.width;
      const sy = rect.top + (-v.y * 0.5 + 0.5) * rect.height;
      const d = Math.hypot(sx - clientX, sy - clientY);
      if (d < bestD && !occluded(globe, x, y, z)) { bestD = d; best = VG.padData[i]; }
    }
    return best;
  }
  function launchRow(lch) {
    const n = nowMs(), up = Date.parse(lch.net) >= n;
    const d = new Date(lch.net);
    const when = isFinite(d) ? d.toLocaleDateString(loc(), { day: '2-digit', month: 'short', year: 'numeric' }) : '';
    const sx = /spacex/i.test(lch.prov || '');
    const stCls = lch.status === 'Failure' ? 'lc-fail' : (up ? 'lc-up' : 'lc-ok');
    const stTxt = up ? L('upcoming') : (lch.status === 'Failure' ? L('failure') : (lch.status === 'Success' ? L('success') : lch.status || ''));
    return `<li class="lc-row${sx ? ' lc-spacex' : ''}">` +
      `<div class="lc-r1"><span class="lc-name">${lch.name || lch.rocket || ''}</span>` +
      `<span class="lc-badge ${stCls}">${stTxt}</span></div>` +
      `<div class="lc-r2">${lch.rocket || ''} · ${lch.prov || ''}${lch.orbit ? ' · ' + lch.orbit : ''}</div>` +
      `<div class="lc-when">${when}</div></li>`;
  }
  function selectPad(pad) {
    if (!VG) return;
    selectSat(null);
    VG.selPad = pad;
    let el = document.getElementById('launch-card');
    if (!pad) { if (el) el.style.display = 'none'; return; }
    if (!el) { el = document.createElement('aside'); el.id = 'launch-card'; el.className = 'glass'; document.body.appendChild(el); }
    const n = nowMs();
    const sorted = pad.launches.slice().sort((a, b) => {
      const ua = Date.parse(a.net) >= n, ub = Date.parse(b.net) >= n;
      if (ua !== ub) return ua ? -1 : 1;                  // próximos primero
      return ua ? Date.parse(a.net) - Date.parse(b.net) : Date.parse(b.net) - Date.parse(a.net);
    });
    const shown = sorted.slice(0, 7), extra = sorted.length - shown.length;
    el.innerHTML =
      `<button id="launch-card-close" class="sat-detail-close" aria-label="${L('close')}">×</button>` +
      `<div class="sd-head"><span class="sd-dot" style="background:#ffae4d;color:#ffae4d"></span><h3>${pad.padName || L('launchSite')}</h3></div>` +
      `<p class="sd-sub">${pad.lat.toFixed(2)}°, ${pad.lng.toFixed(2)}° · ${L('launches')(pad.launches.length)}</p>` +
      `<ul class="lc-list">${shown.map(launchRow).join('')}</ul>` +
      (extra > 0 ? `<p class="sd-sub" style="margin:8px 0 0">${L('more')(extra)}</p>` : '');
    el.style.display = '';
    const close = el.querySelector('#launch-card-close');
    if (close) close.onclick = () => selectPad(null);
  }

  // ---------- F3: análisis de cielo (correlación con satélites sobre un lugar) ----------
  const SKY_TOP = 14;         // nº de líneas de visión a dibujar
  const NAKED_EYE = new Set(['stations', 'starlink', 'oneweb']);  // LEO típicamente visibles
  // clic en la superficie del globo → {lat,lng} (interseca esfera R=100)
  function raycastGlobe(globe, clientX, clientY) {
    const T = TH(), cam = globe.camera();
    const rect = globe.renderer().domElement.getBoundingClientRect();
    const ndc = new T.Vector3(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1, 0.5);
    ndc.unproject(cam);
    const C = cam.position, dir = ndc.sub(C).normalize();
    const b = 2 * (dir.x * C.x + dir.y * C.y + dir.z * C.z);
    const c = (C.x * C.x + C.y * C.y + C.z * C.z) - 100 * 100;
    const disc = b * b - 4 * c; if (disc < 0) return null;
    const t = (-b - Math.sqrt(disc)) / 2; if (t < 0) return null;
    const P = { x: C.x + dir.x * t, y: C.y + dir.y * t, z: C.z + dir.z * t };
    const g = globe.toGeoCoords(P);
    return g ? { lat: g.lat, lng: g.lng } : null;
  }
  function buildSkyPin(globe) {
    const T = TH(), sc = globe.scene();
    if (VG.skyPinObj) { sc.remove(VG.skyPinObj); VG.skyPinObj.geometry.dispose(); VG.skyPinObj = null; }
    if (!VG.skyLoc) return;
    const v = coord(globe, VG.skyLoc.lat, VG.skyLoc.lng, 0.015);
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute([v.x, v.y, v.z], 3));
    const mat = new T.PointsMaterial({ size: 22, sizeAttenuation: false, map: ringTexture(), color: 0x18d7ff, transparent: true, depthTest: false });
    VG.skyPinObj = new T.Points(geo, mat); VG.skyPinObj.renderOrder = 9;
    sc.add(VG.skyPinObj);
  }
  function buildSkyLines(globe) {
    const T = TH(), sc = globe.scene();
    if (VG.skyLinesObj) { sc.remove(VG.skyLinesObj); VG.skyLinesObj.geometry.dispose(); VG.skyLinesObj = null; }
    if (!VG.skyLoc || !VG.skyList || !VG.skyList.length) return;
    VG.skyLineSats = VG.skyList.slice(0, SKY_TOP).map(o => o.sat);
    const n = VG.skyLineSats.length;
    const pos = new Float32Array(n * 6), col = new Float32Array(n * 6);
    for (let i = 0; i < n; i++) {
      const c = hexRgb(constMeta(VG.skyLineSats[i].group).color);
      col[i * 6] = col[i * 6 + 3] = c[0]; col[i * 6 + 1] = col[i * 6 + 4] = c[1]; col[i * 6 + 2] = col[i * 6 + 5] = c[2];
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(pos, 3));
    geo.setAttribute('color', new T.BufferAttribute(col, 3));
    VG.skyLinesGeo = geo;
    const mat = new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.55, depthTest: false });
    VG.skyLinesObj = new T.LineSegments(geo, mat); VG.skyLinesObj.renderOrder = 8;
    sc.add(VG.skyLinesObj);
    updateSkyLines(globe);
  }
  function updateSkyLines(globe) {
    if (!VG.skyLinesGeo || !VG.skyLineSats || !VG.skyLoc) return;
    const o = coord(globe, VG.skyLoc.lat, VG.skyLoc.lng, 0.015);
    const arr = VG.skyLinesGeo.attributes.position.array;
    for (let i = 0; i < VG.skyLineSats.length; i++) {
      const p = propagate(VG.skyLineSats[i], VG.simTime); if (!p) continue;
      const s = coordSat(globe, p.lat, p.lng, p.altGlobe);
      arr[i * 6] = o.x; arr[i * 6 + 1] = o.y; arr[i * 6 + 2] = o.z;
      arr[i * 6 + 3] = s.x; arr[i * 6 + 4] = s.y; arr[i * 6 + 5] = s.z;
    }
    VG.skyLinesGeo.attributes.position.needsUpdate = true;
  }
  function skyCard() {
    let el = document.getElementById('sky-card');
    if (!VG.skyLoc || !VG.skyList) { if (el) el.style.display = 'none'; return; }
    if (!el) { el = document.createElement('aside'); el.id = 'sky-card'; el.className = 'glass'; document.body.appendChild(el); }
    const list = VG.skyList;
    const leo = list.filter(o => o.band === 'LEO');
    const naked = leo.filter(o => NAKED_EYE.has(o.sat.group) && o.elev > 10);
    const high = list.filter(o => o.elev > 30).length;
    const fmtLat = VG.skyLoc.lat.toFixed(2), fmtLng = VG.skyLoc.lng.toFixed(2);
    const rows = naked.slice(0, 6).map(o =>
      `<li class="sk-row"><span class="sk-dot" style="background:${constMeta(o.sat.group).color}"></span>` +
      `<span class="sk-name">${o.sat.name}</span><span class="sk-elev">${o.elev.toFixed(0)}°</span></li>`).join('');
    el.innerHTML =
      `<button id="sky-card-close" class="sat-detail-close" aria-label="${L('close')}">×</button>` +
      `<div class="sd-head"><span class="sd-dot" style="background:#18d7ff;color:#18d7ff"></span><h3>${L('skyTitle')}</h3></div>` +
      `<p class="sd-sub">${fmtLat}°, ${fmtLng}° · ${L('overHorizon')(list.length)}</p>` +
      '<dl class="sd-grid" style="margin-bottom:10px">' +
        `<div><dt>${L('highSky')}</dt><dd>${high}</dd></div>` +
        `<div><dt>${L('leoOrbit')}</dt><dd>${leo.length}</dd></div>` +
      '</dl>' +
      (naked.length
        ? `<p class="sd-sub" style="margin:0 0 6px">${L('nakedEye')}</p><ul class="sk-list">${rows}</ul>`
        : `<p class="sd-sub" style="margin:0">${L('noneVisible')}</p>`) +
      '<p class="sk-note">' +
        (VG.skyExact ? L('noteExact') : L('noteNow')) +
        L('noteTail') + '</p>';
    el.style.display = '';
    const close = el.querySelector('#sky-card-close'); if (close) close.onclick = () => clearSky();
  }
  function setSkyLocation(globe, lat, lng) {
    VG.skyLoc = { lat, lng };
    VG.skyList = overheadSats(VG.sats, lat, lng, VG.simTime, 0);
    buildSkyPin(globe); buildSkyLines(globe); skyCard();
  }
  function clearSky() {
    const globe = root.__ufologistGlobe, sc = globe && globe.scene();
    VG.skyLoc = null; VG.skyList = null; VG.skyLineSats = null;
    if (sc && VG.skyPinObj) sc.remove(VG.skyPinObj);
    if (sc && VG.skyLinesObj) sc.remove(VG.skyLinesObj);
    VG.skyPinObj = null; VG.skyLinesObj = null;
    const el = document.getElementById('sky-card'); if (el) el.style.display = 'none';
  }
  // API pública: analizar el cielo sobre un punto (puente desde una ficha de caso).
  // Si whenISO cae dentro de la validez del TLE (~45 días de hoy), usa ese instante
  // exacto (correlación real); si no, usa el tiempo actual con la advertencia.
  model.analyzeSkyAt = function (lat, lng, whenISO) {
    if (!VG || !VG.sats || !VG.sats.length) { model._pendingSky = { lat, lng, whenISO }; return; }
    if (!VG.skyMode) model.toggleSky(true);
    const globe = root.__ufologistGlobe;
    if (whenISO) {
      const t = Date.parse(whenISO), now = Date.parse(new Date().toISOString());
      if (isFinite(t) && Math.abs(t - now) < 45 * 864e5) { VG.simTime = new Date(t); VG.skyExact = true; }
      else VG.skyExact = false;
    }
    if (globe.pointOfView) globe.pointOfView({ lat, lng, altitude: 2.2 }, 800);
    setSkyLocation(globe, lat, lng);
    buildPanel();
  };
  model.toggleSky = function (on) {
    if (!VG) return;
    VG.skyMode = on;
    document.body.classList.toggle('sky-analyzing', !!on);
    if (on) {                                   // congela el tiempo para que el análisis sea coherente
      if (VG._prevSpeed === undefined) VG._prevSpeed = VG.simSpeed;
      VG.simSpeed = 0;
      selectSat(null); selectPad(null);
    } else {
      if (VG._prevSpeed !== undefined) { VG.simSpeed = VG._prevSpeed; VG._prevSpeed = undefined; }
      clearSky();
    }
  };

  model.enter = async function enter() {
    const globe = root.__ufologistGlobe;
    if (!globe || !TH() || !globe.scene) { console.warn('[UFOSat] globo/THREE no disponible'); return; }
    if (!VG) VG = { sats: [], filter: null, simTime: new Date(), simSpeed: 90, raf: 0, orbitObj: null, ptsObj: null };
    // Fase 1 (rápida): combina el respaldo local con el último catálogo vivo
    // guardado. CelesTrak limita descargas repetidas; conservar una respuesta
    // exitosa evita que la densidad caiga a la muestra local entre sesiones.
    if (!VG.sats.length) {
      try {
        const r = await fetch('data/tle-snapshot.json');
        const base = buildFromSnapshot(await r.json());
        const cached = readLiveCache();
        const byId = new Map(base.map(s => [s.id, s]));
        cached.forEach(s => byId.set(s.id, s));
        VG.sats = [...byId.values()];
        VG.live = false;
        VG.catalogSource = cached.length ? 'cache' : 'backup';
        console.log('[UFOSat]', VG.sats.length, `satélites (${VG.catalogSource})`);
      }
      catch (e) { console.warn('[UFOSat] sin respaldo', e); VG.sats = []; }
    }
    if (!VG.pads) {
      try { VG.pads = groupPads(await loadLaunches()); if (VG.showPads === undefined) VG.showPads = true; console.log('[UFOSat]', VG.pads.length, 'sitios de lanzamiento'); }
      catch (e) { VG.pads = []; }
    }
    VG.hist = launchHistogram(VG.sats);
    VG.yearMax = VG.hist.maxYear;                 // empezar mostrando todo
    VG.active = true;
    buildOrbits(globe);
    buildPoints(globe);
    buildPads(globe);
    ensureZoomRange(globe);
    attachPick(globe);
    startClock();
    showPanel();
    buildTimeline();
    if (model._pendingSky) { const s = model._pendingSky; model._pendingSky = null; model.analyzeSkyAt(s.lat, s.lng, s.whenISO); }
    // Fase 2 (en segundo plano): enriquecer con CelesTrak en vivo (solo una vez)
    if (!VG._liveTried) { VG._liveTried = true; enrichLive(globe); }
  };
  async function enrichLive(globe) {
    let live; try { live = await loadLive(); } catch (e) { return; }   // se queda con el respaldo
    const byId = new Map(VG.sats.map(s => [s.id, s]));
    for (const s of live.sats) byId.set(s.id, s);
    VG.sats = [...byId.values()]; VG.live = true; VG.catalogSource = 'live';
    writeLiveCache(VG.sats);
    console.log('[UFOSat]', VG.sats.length, 'satélites (vivo)');
    const wasAll = VG.hist && VG.yearMax === VG.hist.maxYear;
    VG.hist = launchHistogram(VG.sats);
    if (wasAll || VG.yearMax == null) VG.yearMax = VG.hist.maxYear;   // seguir mostrando todo tras enriquecer
    if (VG.active) { buildOrbits(globe); buildPoints(globe); ensureZoomRange(globe); buildPanel(); drawTimeline(); if (VG.skyLoc) { VG.skyList = overheadSats(VG.sats, VG.skyLoc.lat, VG.skyLoc.lng, VG.simTime, 0); buildSkyLines(globe); skyCard(); } }
  }
  model.exit = function exit() {
    const globe = root.__ufologistGlobe; const sc = globe && globe.scene && globe.scene();
    if (VG) {
      model.stopMissionFocus();
      VG.active = false; stopClock(); detachPick();
      if (sc && VG.orbitObj) sc.remove(VG.orbitObj);
      if (sc && VG.ptsObj) sc.remove(VG.ptsObj);
      if (sc && VG.selObj) sc.remove(VG.selObj);
      if (sc && VG.padObj) sc.remove(VG.padObj);
      VG.orbitObj = null; VG.ptsObj = null; VG.selObj = null; VG.selSat = null;
      VG.padObj = null; VG.selPad = null;
      restoreZoomRange(globe);
      hideTimeline();
      if (VG.skyMode) model.toggleSky(false); else clearSky();
      document.body.classList.remove('sky-analyzing');
      const det = document.getElementById('sat-detail'); if (det) det.style.display = 'none';
      const lc = document.getElementById('launch-card'); if (lc) lc.style.display = 'none';
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
      `<span class="sc-dot"></span>${label}<b>${(n || 0).toLocaleString(loc())}</b></button>`;
    el.innerHTML =
      `<div class="panel-head"><h2>${L('sats')}</h2></div>` +
      `<p class="hint">${total.toLocaleString(loc())} ${L('inOrbit')} · ${VG.live ? L('live') : L(VG.catalogSource === 'cache' ? 'cache' : 'backup')}</p>` +
      '<div class="sat-chips">' +
        chip('', L('all'), total, '#93a1c0') +
        present.map(g => chip(g, constLabel(g), counts[g], constMeta(g).color)).join('') +
      '</div>' +
      `<p class="hint" style="margin-top:10px">${L('ringNote')}</p>` +
      (VG.pads && VG.pads.length
        ? '<label class="sat-toggle"><input type="checkbox" id="sat-pads-toggle"' + (VG.showPads ? ' checked' : '') + '>' +
          `<span class="st-tri"></span>${L('launchSites')}<b>` + VG.pads.length + '</b></label>'
        : '') +
      `<button id="sat-scale-btn" class="sat-sky-btn" title="${L('scaleHint')}">${VG.realScale ? L('scaleReal') : L('scaleCompressed')}</button>` +
      `<button id="sat-sky-btn" class="sat-sky-btn${VG.skyMode ? ' active' : ''}">${L('analyzeSky')}</button>` +
      (VG.skyMode ? `<p class="hint" style="margin-top:6px">${L('skyHint')}</p>` : '') +
      `<label class="sat-speed">${L('simSpeed')}<span id="sat-speed-val">` + VG.simSpeed + '</span>' +
        '<input type="range" id="sat-speed" min="1" max="600" value="' + VG.simSpeed + '"></label>';
    el.querySelectorAll('.sat-chip').forEach(b => b.onclick = () => {
      model.setFilter(b.dataset.g || null);
      el.querySelectorAll('.sat-chip').forEach(x => x.classList.toggle('active', x === b));
    });
    const sp = el.querySelector('#sat-speed');
    if (sp) sp.oninput = () => { model.setSpeed(+sp.value); const v = el.querySelector('#sat-speed-val'); if (v) v.textContent = sp.value; };
    const pt = el.querySelector('#sat-pads-toggle');
    if (pt) pt.onchange = () => model.togglePads(pt.checked);
    const sk = el.querySelector('#sat-sky-btn');
    if (sk) sk.onclick = () => { model.toggleSky(!VG.skyMode); buildPanel(); };
    const scb = el.querySelector('#sat-scale-btn');
    if (scb) scb.onclick = () => model.toggleScale();
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

  // ---------- Línea de tiempo de satélites (por año de lanzamiento) ----------
  const MILESTONES = { 1957: 'Sputnik', 1998: 'ISS', 2019: 'Starlink' };
  function axisRange() {
    const h = VG.hist;
    return { min: VG.lpy ? Math.min(h.minYear, VG.lpy.min) : h.minYear, max: VG.lpy ? Math.max(h.maxYear, VG.lpy.max) : h.maxYear };
  }
  function cumUpTo(y) { let c = 0; const h = VG.hist; for (let k = h.minYear; k <= y; k++) if (h.byYear[k]) for (const gg in h.byYear[k]) c += h.byYear[k][gg]; return c; }
  function buildTimeline() {
    let el = document.getElementById('sat-timeline');
    if (!el) {
      el = document.createElement('div'); el.id = 'sat-timeline'; el.className = 'glass';
      el.innerHTML = '<button id="stl-play" class="stl-play" aria-label="play">▶</button>' +
        '<div class="stl-body"><div class="stl-readout"><span class="stl-title"></span><span id="stl-read"></span></div>' +
        '<canvas id="stl-canvas"></canvas></div>';
      document.body.appendChild(el);
      const cv = el.querySelector('#stl-canvas');
      const onScrub = e => { const y = yearAtX(e.clientX); if (y != null) applyYear(y); };
      cv.addEventListener('pointerdown', e => { stopPlay(); cv.setPointerCapture(e.pointerId); VG._scrub = true; onScrub(e); });
      cv.addEventListener('pointermove', e => { if (VG._scrub) onScrub(e); });
      cv.addEventListener('pointerup', e => { VG._scrub = false; });
      el.querySelector('#stl-play').onclick = () => VG._playing ? stopPlay() : playTimeline();
    }
    el.querySelector('.stl-title').textContent = L('tlTitle');
    el.style.display = '';
    if (VG.lpy === undefined) {                     // lanzamientos/año (LL2), carga única
      VG.lpy = null;
      fetch('data/launches-per-year.json').then(r => r.json()).then(j => {
        const ys = Object.keys(j.byYear || {}).map(Number).filter(isFinite);
        if (ys.length) { VG.lpy = { byYear: j.byYear, min: Math.min(...ys), max: Math.max(...ys) }; if (VG.active) drawTimeline(); }
      }).catch(() => {});
    }
    drawTimeline();
  }
  function yearAtX(clientX) {
    const cv = document.getElementById('stl-canvas'); if (!cv || !VG.hist) return null;
    const r = cv.getBoundingClientRect(); const ax = axisRange();
    const f = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    return Math.round(ax.min + f * (ax.max - ax.min));
  }
  function drawTimeline() {
    const cv = document.getElementById('stl-canvas'); if (!cv || !VG.hist) return;
    const rect = cv.getBoundingClientRect(); if (!rect.width) return;
    const dpr = root.devicePixelRatio || 1;
    cv.width = rect.width * dpr; cv.height = rect.height * dpr;
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const W = rect.width, H = rect.height, padB = 16, padT = 14;
    ctx.clearRect(0, 0, W, H);
    const h = VG.hist;
    // el eje abarca desde el primer lanzamiento histórico (LL2, ~1957) hasta hoy
    const axMin = VG.lpy ? Math.min(h.minYear, VG.lpy.min) : h.minYear;
    const axMax = VG.lpy ? Math.max(h.maxYear, VG.lpy.max) : h.maxYear;
    const span = Math.max(1, axMax - axMin);
    const xOf = y => ((y - axMin) / span) * (W - 2) + 1;
    const light = document.documentElement.getAttribute('data-theme') === 'light';
    // total máximo anual (para normalizar la altura)
    let maxN = 1; for (let y = h.minYear; y <= h.maxYear; y++) { const g = h.byYear[y]; if (!g) continue; let t = 0; for (const k in g) t += g[k]; if (t > maxN) maxN = t; }
    // barras APILADAS por constelación (altura total ∝ raíz del recuento; segmentos
    // proporcionales a cada constelación) → se ve qué impulsó el crecimiento
    const order = Object.keys(CONSTELLATIONS);
    const bw = Math.max(2, (W - 2) / (span + 1) - 1);
    const dim = light ? 'rgba(20,44,70,0.18)' : 'rgba(120,140,180,0.20)';
    for (let y = h.minYear; y <= h.maxYear; y++) {
      const g = h.byYear[y]; if (!g) continue;
      let total = 0; for (const k in g) total += g[k];
      const barH = Math.sqrt(total / maxN) * (H - padB - padT);
      const active = y <= VG.yearMax;
      const x = xOf(y) - bw / 2;
      let yTop = H - padB;
      if (active) {
        ctx.globalAlpha = 0.92;
        for (const grp of order) { const c = g[grp]; if (!c) continue; const segH = (c / total) * barH; ctx.fillStyle = constMeta(grp).color; ctx.fillRect(x, yTop - segH, bw, segH); yTop -= segH; }
      } else {
        ctx.globalAlpha = 1; ctx.fillStyle = dim; ctx.fillRect(x, H - padB - barH, bw, barH);
      }
    }
    ctx.globalAlpha = 1;
    // línea de LANZAMIENTOS/AÑO (ritmo histórico de cohetes, LL2). Normalizada a su
    // propio máximo; tramo hasta el cursor en ámbar vivo, el resto tenue.
    if (VG.lpy) {
      let lpMax = 1; for (const k in VG.lpy.byYear) if (VG.lpy.byYear[k] > lpMax) lpMax = VG.lpy.byYear[k];
      const lyOf = v => H - padB - (v / lpMax) * (H - padB - padT);
      ctx.beginPath(); let started = false;
      for (let y = VG.lpy.min; y <= VG.lpy.max; y++) {
        const v = VG.lpy.byYear[y]; if (v == null) { started = false; continue; }
        const px = xOf(y), py = lyOf(v);
        if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = light ? 'rgba(224,122,40,0.9)' : 'rgba(255,174,77,0.85)'; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.fillStyle = light ? 'rgba(224,122,40,0.95)' : 'rgba(255,174,77,0.95)'; ctx.font = '9px ui-monospace, monospace'; ctx.textAlign = 'left';
      ctx.fillText('— ' + L('tlLaunchLine'), 4, padT + 6);
    }
    // hitos
    ctx.font = '9px ui-monospace, monospace';
    for (const yr in MILESTONES) { const y = +yr; if (y < axMin || y > axMax) continue; const x = xOf(y);
      ctx.strokeStyle = light ? 'rgba(20,44,70,0.3)' : 'rgba(200,210,230,0.3)'; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, H - padB); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = light ? 'rgba(20,44,70,0.7)' : 'rgba(210,220,240,0.75)';
      let tx = x, al = 'center'; if (x < 26) { al = 'left'; tx = x + 4; } else if (x > W - 26) { al = 'right'; tx = x - 4; }
      ctx.textAlign = al; ctx.fillText(MILESTONES[yr], tx, padT - 3);
    }
    // cursor del año seleccionado
    const cx = xOf(VG.yearMax);
    ctx.strokeStyle = light ? '#0a7ea8' : '#18d7ff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx, padT - 2); ctx.lineTo(cx, H - padB); ctx.stroke();
    // eje de años (extremos)
    ctx.fillStyle = light ? 'rgba(20,44,70,0.6)' : 'rgba(190,200,220,0.6)'; ctx.font = '9px ui-monospace, monospace';
    ctx.textAlign = 'left'; ctx.fillText(axMin, 2, H - 4);
    ctx.textAlign = 'right'; ctx.fillText(axMax, W - 2, H - 4);
    // lectura
    const rd = document.getElementById('stl-read'); if (rd) rd.textContent = L('tlUpTo')(cumUpTo(VG.yearMax), VG.yearMax);
  }
  function applyYear(y) {
    if (!VG.hist) return;
    const ax = axisRange();
    VG.yearMax = Math.max(ax.min, Math.min(ax.max, y));
    drawTimeline();
    // reconstrucción del globo con debounce (setTimeout, robusto aunque la
    // pestaña no renderice) para no rehacer geometría en cada evento de arrastre
    if (VG._stlTimer) clearTimeout(VG._stlTimer);
    VG._stlTimer = setTimeout(() => { VG._stlTimer = 0; const g = root.__ufologistGlobe; buildOrbits(g); buildPoints(g); }, 70);
  }
  function playTimeline() {
    if (!VG.hist) return; stopPlay(); VG._playing = true;
    const btn = document.getElementById('stl-play'); if (btn) btn.textContent = '⏸';
    const ax = axisRange();
    if (VG.yearMax >= ax.max) VG.yearMax = ax.min;                    // reinicia si está al final
    const perYear = 240;                                             // ms por año
    const step = () => {
      if (!VG._playing) return;
      applyYear(VG.yearMax + 1);
      if (VG.yearMax >= ax.max) { stopPlay(); return; }
      VG._playTimer = setTimeout(step, perYear);
    };
    VG._playTimer = setTimeout(step, perYear);
  }
  function stopPlay() {
    if (VG._playTimer) clearTimeout(VG._playTimer); VG._playTimer = 0; VG._playing = false;
    const btn = document.getElementById('stl-play'); if (btn) btn.textContent = '▶';
  }
  function hideTimeline() { stopPlay(); const e = document.getElementById('sat-timeline'); if (e) e.style.display = 'none'; }
  model.setFilter = function (g) {
    if (!VG) return; VG.filter = g;
    const globe = root.__ufologistGlobe;
    buildOrbits(globe); buildPoints(globe);
    if (VG.selSat && g && VG.selSat.group !== g) selectSat(null);  // el seleccionado ya no está en el filtro
  };
  model.setSpeed = function (x) {
    if (!VG) return;
    VG.simSpeed = x;
    const input = document.getElementById('sat-speed');
    const value = document.getElementById('sat-speed-val');
    if (input) input.value = x;
    if (value) value.textContent = x;
  };
  model.togglePads = function (on) {
    if (!VG) return; VG.showPads = on;
    buildPads(root.__ufologistGlobe);
    if (!on) selectPad(null);
  };
  model.toggleScale = function () {
    if (!VG) return; VG.realScale = !VG.realScale;
    const globe = root.__ufologistGlobe;
    buildOrbits(globe); buildPoints(globe);
    if (VG.selSat) buildSelObj(globe);
    if (VG.skyLoc) buildSkyLines(globe);
    ensureZoomRange(globe);
    buildPanel();
  };
  // re-render del UI satelital al cambiar de idioma (lo llama app.js)
  model.relang = function () {
    if (!VG || !VG.active) return;
    buildPanel();
    if (VG.selSat) refreshDetail();
    if (VG.selPad) selectPad(VG.selPad);
    if (VG.skyLoc) skyCard();
    const stlTitle = document.querySelector('#sat-timeline .stl-title'); if (stlTitle) { stlTitle.textContent = L('tlTitle'); drawTimeline(); }
  };
  model.constellationsPresent = function () {
    if (!VG) return [];
    const set = new Set(VG.sats.map(s => s.group));
    return Object.keys(CONSTELLATIONS).filter(g => set.has(g));
  };

  model._vg = () => VG;   // accesor de depuración (posición/tiempo simulado)

  // ---------- Export (Node: pruebas · browser: global) ----------
  if (typeof module !== 'undefined' && module.exports) module.exports = model;
  else root.UFOSat = model;

})(typeof globalThis !== 'undefined' ? globalThis : this);
