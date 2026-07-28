// ============================================================
// fetch-tle.js — snapshot de respaldo de TLEs (CelesTrak)
//
// La app usará CelesTrak EN VIVO; este snapshot es el fallback
// (si falla CORS/red) y el dataset de arranque de la vista satélite.
// Set CURADO (no los 30k objetos): planos/constelaciones representativos.
//
// Uso:  node tools/fetch-tle.js   → escribe data/tle-snapshot.json
// ============================================================
const fs = require('fs');
const BASE = 'https://celestrak.org/NORAD/elements/gp.php?FORMAT=tle&GROUP=';

// grupo → límite (null = todos). Starlink/OneWeb/GEO se muestrean para F1.
const GROUPS = [
  ['stations', null],   // ISS + tripuladas
  ['gps-ops', null],    // GPS (MEO, ~31)
  ['galileo', null],    // Galileo (MEO, ~28)
  ['glo-ops', null],    // GLONASS (MEO, ~24)
  ['beidou', 60],       // BeiDou (MEO/GEO/IGSO)
  ['geo', 150],         // geoestacionarios (muestra)
  ['oneweb', 150],      // OneWeb (LEO, muestra)
  ['starlink', 400],    // Starlink (LEO, muestra representativa de planos)
  ['weather', null],    // meteo (LEO/GEO)
  ['science', 80],      // científicos (muestra)
];

function parseTle(text) {
  const lines = text.split(/\r?\n/).map(l => l.replace(/\s+$/, '')).filter(l => l.length);
  const sats = [];
  for (let i = 0; i + 2 < lines.length + 1 && i + 2 <= lines.length; i += 3) {
    const name = lines[i], l1 = lines[i + 1], l2 = lines[i + 2];
    if (!l1 || !l2 || l1[0] !== '1' || l2[0] !== '2') continue;
    sats.push({ n: name.trim(), id: l1.slice(2, 7).trim(), l1, l2 });
  }
  return sats;
}

(async () => {
  const out = { generated: new Date().toISOString(), source: 'celestrak.org', groups: {} };
  let total = 0;
  for (const [g, limit] of GROUPS) {
    try {
      const res = await fetch(BASE + g);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      let sats = parseTle(await res.text());
      if (limit && sats.length > limit) {
        // muestreo uniforme para conservar la cobertura de planos orbitales
        const step = sats.length / limit;
        sats = Array.from({ length: limit }, (_, k) => sats[Math.floor(k * step)]);
      }
      out.groups[g] = sats;
      total += sats.length;
      console.log(g.padEnd(10), sats.length);
    } catch (e) {
      console.error('skip', g, e.message);
      out.groups[g] = [];
    }
  }
  fs.writeFileSync('data/tle-snapshot.json', JSON.stringify(out));
  console.log('TOTAL', total, 'satélites ·', (fs.statSync('data/tle-snapshot.json').size / 1024).toFixed(0), 'KB');
})();
