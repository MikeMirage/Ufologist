// ============================================================
// validate-sgp4.js — comprueba el motor orbital sin navegador.
// Propaga el ISS + una muestra desde data/tle-snapshot.json y
// verifica que las posiciones son plausibles. También genera una
// órbita completa (una vuelta) para confirmar que podemos dibujar rutas.
//
// Requiere satellite.js en /tmp/satellite.min.js (lo baja el runner).
// Uso:  node tools/validate-sgp4.js
// ============================================================
const fs = require('fs');
const satellite = require('/tmp/satellite.min.js');

const snap = JSON.parse(fs.readFileSync('data/tle-snapshot.json', 'utf8'));
const all = Object.values(snap.groups).flat();
console.log('satélites en snapshot:', all.length);

function geo(rec, when) {
  const pv = satellite.propagate(rec, when);
  if (!pv || !pv.position) return null;
  const gmst = satellite.gstime(when);
  const gd = satellite.eciToGeodetic(pv.position, gmst);
  return {
    lat: satellite.degreesLat(gd.latitude),
    lng: satellite.degreesLong(gd.longitude),
    alt: gd.height, // km
  };
}

// 1) ISS: alt ~400-430 km, |lat| <= ~52 (inclinación 51.6°)
const iss = all.find(s => /ZARYA|ISS \(/.test(s.n)) || all[0];
const rec = satellite.twoline2satrec(iss.l1, iss.l2);
const now = new Date();
const p = geo(rec, now);
console.log(`\nISS → ${iss.n}`);
console.log(`  lat ${p.lat.toFixed(2)}  lng ${p.lng.toFixed(2)}  alt ${p.alt.toFixed(0)} km`);
const issOk = p.alt > 350 && p.alt < 460 && Math.abs(p.lat) <= 53;
console.log('  plausible:', issOk ? 'SÍ ✓' : 'NO ✗');

// 2) órbita completa (una vuelta) → confirma que podemos muestrear rutas
const meanMotion = parseFloat(iss.l2.slice(52, 63)); // revs/día
const periodMin = 1440 / meanMotion;
const N = 90;
let minAlt = Infinity, maxAlt = -Infinity, valid = 0;
for (let k = 0; k < N; k++) {
  const t = new Date(now.getTime() + (k / N) * periodMin * 60000);
  const g = geo(rec, t);
  if (g) { valid++; minAlt = Math.min(minAlt, g.alt); maxAlt = Math.max(maxAlt, g.alt); }
}
console.log(`\nÓrbita ISS: periodo ${periodMin.toFixed(1)} min · ${valid}/${N} puntos · alt ${minAlt.toFixed(0)}–${maxAlt.toFixed(0)} km`);

// 3) muestra global: cuántos satélites propagan sin error + rango de altitudes
let ok = 0, fail = 0;
const bands = { LEO: 0, MEO: 0, GEO: 0, HEO: 0, other: 0 };
for (const s of all) {
  try {
    const r = satellite.twoline2satrec(s.l1, s.l2);
    const g = geo(r, now);
    if (g && isFinite(g.lat) && isFinite(g.alt)) {
      ok++;
      const a = g.alt;
      if (a < 2000) bands.LEO++; else if (a < 35000) bands.MEO++;
      else if (a < 37000) bands.GEO++; else if (a > 0) bands.HEO++; else bands.other++;
    } else fail++;
  } catch (e) { fail++; }
}
console.log(`\nPropagación global: ${ok} OK · ${fail} fallos`);
console.log('  bandas de altitud:', JSON.stringify(bands));
console.log('\nMOTOR SGP4:', issOk && ok > all.length * 0.9 ? 'VALIDADO ✓' : 'REVISAR ✗');
