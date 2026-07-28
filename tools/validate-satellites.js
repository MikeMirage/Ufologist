// Valida la capa de modelo de js/satellites.js con datos reales (sin navegador).
// Uso:  node tools/validate-satellites.js   (requiere /tmp/satellite.min.js)
const fs = require('fs');
globalThis.satellite = require('/tmp/satellite.min.js');
const M = require('../js/satellites.js');

const snap = JSON.parse(fs.readFileSync('data/tle-snapshot.json', 'utf8'));
const sats = M.buildFromSnapshot(snap);
const now = new Date();
console.log('satélites construidos:', sats.length);

// propagación global
let ok = 0; for (const s of sats) if (M.propagate(s, now)) ok++;
console.log('propagados OK:', ok, '/', sats.length);

// muestreo de órbita (ISS)
const iss = sats.find(s => /ISS \(|ZARYA/.test(s.name)) || sats[0];
const orb = M.sampleOrbit(iss, now, 96);
console.log(`órbita ${iss.name}: ${orb.length} puntos · alt globo ${orb[0][2].toFixed(3)}`);

// AGREGACIÓN POR PLANO — la clave de rendimiento
const reps = M.representativePlanes(sats);
console.log(`\n★ órbitas a dibujar (planos representativos): ${reps.length}  (vs ${sats.length} satélites)`);
// por constelación
const byGroup = {};
sats.forEach(s => (byGroup[s.group] = byGroup[s.group] || []).push(s));
Object.entries(byGroup).forEach(([g, arr]) => {
  const planes = M.representativePlanes(arr).length;
  console.log(`  ${g.padEnd(9)} ${String(arr.length).padStart(3)} sats → ${String(planes).padStart(3)} planos  (${M.constMeta(g).label})`);
});

// estimación de vértices de línea
const ORB_PTS = 96;
const vDrawn = reps.length * ORB_PTS;
const vNaive = sats.length * ORB_PTS;
console.log(`\nvértices de línea: ${vDrawn} (planos) vs ${vNaive} (una órbita por satélite) → ${(100 - vDrawn / vNaive * 100).toFixed(0)}% menos`);
console.log('\nMODELO satellites.js:', ok > sats.length * 0.9 && reps.length < sats.length ? 'VALIDADO ✓' : 'REVISAR ✗');
