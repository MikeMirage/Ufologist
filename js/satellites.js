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
        updateSel(globe);
        updateSkyLines(globe);
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
    const v = coord(globe, p.lat, p.lng, p.altGlobe);
    const a = VG.selObj.geometry.attributes.position.array;
    a[0] = v.x; a[1] = v.y; a[2] = v.z;
    VG.selObj.geometry.attributes.position.needsUpdate = true;
  }
  function refreshDetail() {
    const el = document.getElementById('sat-detail'); if (!el || !VG || !VG.selSat) return;
    const d = satDetail(VG.selSat, VG.simTime); if (!d) return;
    const c = constMeta(d.group).color;
    el.innerHTML =
      '<button id="sat-detail-close" class="sat-detail-close" aria-label="Cerrar">×</button>' +
      `<div class="sd-head"><span class="sd-dot" style="background:${c};color:${c}"></span><h3>${d.name}</h3></div>` +
      `<p class="sd-sub">${d.label} · NORAD ${d.id}</p>` +
      '<dl class="sd-grid">' +
        `<div><dt>Régimen</dt><dd>${d.band}</dd></div>` +
        `<div><dt>Altitud</dt><dd>${Math.round(d.alt).toLocaleString('es')} km</dd></div>` +
        `<div><dt>Velocidad</dt><dd>${d.speedKmS ? d.speedKmS.toFixed(2) : '—'} km/s</dd></div>` +
        `<div><dt>Periodo</dt><dd>${d.periodMin ? d.periodMin.toFixed(0) : '—'} min</dd></div>` +
        `<div><dt>Inclinación</dt><dd>${d.incDeg.toFixed(1)}°</dd></div>` +
        `<div><dt>Posición</dt><dd>${d.lat.toFixed(1)}°, ${d.lng.toFixed(1)}°</dd></div>` +
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
  function launchRow(L) {
    const n = nowMs(), up = Date.parse(L.net) >= n;
    const d = new Date(L.net);
    const when = isFinite(d) ? d.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
    const sx = /spacex/i.test(L.prov || '');
    const stCls = L.status === 'Failure' ? 'lc-fail' : (up ? 'lc-up' : 'lc-ok');
    const stTxt = up ? 'Próximo' : (L.status === 'Failure' ? 'Fallo' : (L.status === 'Success' ? 'Éxito' : L.status || ''));
    return `<li class="lc-row${sx ? ' lc-spacex' : ''}">` +
      `<div class="lc-r1"><span class="lc-name">${L.name || L.rocket || ''}</span>` +
      `<span class="lc-badge ${stCls}">${stTxt}</span></div>` +
      `<div class="lc-r2">${L.rocket || ''} · ${L.prov || ''}${L.orbit ? ' · ' + L.orbit : ''}</div>` +
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
      '<button id="launch-card-close" class="sat-detail-close" aria-label="Cerrar">×</button>' +
      `<div class="sd-head"><span class="sd-dot" style="background:#ffae4d;color:#ffae4d"></span><h3>${pad.padName || 'Sitio de lanzamiento'}</h3></div>` +
      `<p class="sd-sub">${pad.lat.toFixed(2)}°, ${pad.lng.toFixed(2)}° · ${pad.launches.length} lanzamiento${pad.launches.length !== 1 ? 's' : ''}</p>` +
      `<ul class="lc-list">${shown.map(launchRow).join('')}</ul>` +
      (extra > 0 ? `<p class="sd-sub" style="margin:8px 0 0">+${extra} más</p>` : '');
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
      const s = coord(globe, p.lat, p.lng, p.altGlobe);
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
      '<button id="sky-card-close" class="sat-detail-close" aria-label="Cerrar">×</button>' +
      '<div class="sd-head"><span class="sd-dot" style="background:#18d7ff;color:#18d7ff"></span><h3>Análisis de cielo</h3></div>' +
      `<p class="sd-sub">${fmtLat}°, ${fmtLng}° · ${list.length.toLocaleString('es')} satélites sobre el horizonte</p>` +
      '<dl class="sd-grid" style="margin-bottom:10px">' +
        `<div><dt>Cielo alto &gt;30°</dt><dd>${high}</dd></div>` +
        `<div><dt>Órbita baja (LEO)</dt><dd>${leo.length}</dd></div>` +
      '</dl>' +
      (naked.length
        ? `<p class="sd-sub" style="margin:0 0 6px">Candidatos a simple vista (LEO, &gt;10°):</p><ul class="sk-list">${rows}</ul>`
        : '<p class="sd-sub" style="margin:0">Ningún satélite LEO brillante sobre 10° ahora mismo.</p>') +
      '<p class="sk-note">' +
        (VG.skyExact
          ? 'Posiciones calculadas para la fecha y hora reales del avistamiento (dentro de la validez del TLE). '
          : 'Posiciones para el instante simulado actual: los TLE (~2026) no reconstruyen con precisión fechas fuera de unas semanas. ') +
        'Solo los satélites LEO iluminados por el Sol con cielo oscuro son visibles a simple vista; GPS/GEO no lo son.</p>';
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
    if (!VG.sats.length) {
      try { const d = await loadData(); VG.sats = d.sats; VG.live = d.live; console.log('[UFOSat]', VG.sats.length, 'satélites', d.live ? '(vivo)' : '(respaldo)'); }
      catch (e) { console.warn('[UFOSat] sin datos', e); VG.sats = []; }
    }
    if (!VG.pads) {
      try { VG.pads = groupPads(await loadLaunches()); if (VG.showPads === undefined) VG.showPads = true; console.log('[UFOSat]', VG.pads.length, 'sitios de lanzamiento'); }
      catch (e) { VG.pads = []; }
    }
    VG.active = true;
    buildOrbits(globe);
    buildPoints(globe);
    buildPads(globe);
    attachPick(globe);
    startClock();
    showPanel();
    if (model._pendingSky) { const s = model._pendingSky; model._pendingSky = null; model.analyzeSkyAt(s.lat, s.lng, s.whenISO); }
  };
  model.exit = function exit() {
    const globe = root.__ufologistGlobe; const sc = globe && globe.scene && globe.scene();
    if (VG) {
      VG.active = false; stopClock(); detachPick();
      if (sc && VG.orbitObj) sc.remove(VG.orbitObj);
      if (sc && VG.ptsObj) sc.remove(VG.ptsObj);
      if (sc && VG.selObj) sc.remove(VG.selObj);
      if (sc && VG.padObj) sc.remove(VG.padObj);
      VG.orbitObj = null; VG.ptsObj = null; VG.selObj = null; VG.selSat = null;
      VG.padObj = null; VG.selPad = null;
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
      `<span class="sc-dot"></span>${label}<b>${(n || 0).toLocaleString('es')}</b></button>`;
    el.innerHTML =
      '<div class="panel-head"><h2>Satélites</h2></div>' +
      `<p class="hint">${total.toLocaleString('es')} en órbita · ${VG.live ? 'CelesTrak (vivo)' : 'respaldo local'}</p>` +
      '<div class="sat-chips">' +
        chip('', 'Todas', total, '#93a1c0') +
        present.map(g => chip(g, constMeta(g).label, counts[g], constMeta(g).color)).join('') +
      '</div>' +
      '<p class="hint" style="margin-top:10px">Cada anillo = un plano orbital. Los puntos son satélites en tiempo simulado.</p>' +
      (VG.pads && VG.pads.length
        ? '<label class="sat-toggle"><input type="checkbox" id="sat-pads-toggle"' + (VG.showPads ? ' checked' : '') + '>' +
          '<span class="st-tri"></span>Sitios de lanzamiento<b>' + VG.pads.length + '</b></label>'
        : '') +
      '<button id="sat-sky-btn" class="sat-sky-btn' + (VG.skyMode ? ' active' : '') + '">🔭 Analizar cielo sobre un lugar</button>' +
      (VG.skyMode ? '<p class="hint" style="margin-top:6px">Clic en el globo para ver qué satélites hay sobre ese punto. El tiempo se pausa.</p>' : '') +
      '<label class="sat-speed">Velocidad de simulación · ×<span id="sat-speed-val">' + VG.simSpeed + '</span>' +
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
    if (VG.selSat && g && VG.selSat.group !== g) selectSat(null);  // el seleccionado ya no está en el filtro
  };
  model.setSpeed = function (x) { if (VG) VG.simSpeed = x; };
  model.togglePads = function (on) {
    if (!VG) return; VG.showPads = on;
    buildPads(root.__ufologistGlobe);
    if (!on) selectPad(null);
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
