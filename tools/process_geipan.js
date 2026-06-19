// ============================================================
// Regenera data/geipan.json a partir del CSV oficial de GEIPAN (CNES).
//
// El CSV público "export_cas_pub" trae la columna de coordenadas vacía,
// así que geolocalizamos cada caso por el CENTROIDE de su departamento
// francés (cas_zone_code), que es la unidad de geolocalización de GEIPAN.
// Se añade un jitter determinista (±~0.18°) sembrado por id_cas para que
// los puntos del mismo departamento no se solapen exactamente.
// Precisión = nivel de departamento (se etiqueta como tal en la app).
//
// Uso:
//   curl -sL -o /tmp/geipan.csv "<URL export_cas_pub_*.csv de geipan.fr>"
//   curl -sL -o /tmp/fr_dep.geojson \
//     https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements-version-simplifiee.geojson
//   node tools/process_geipan.js data/geipan.json
//
// Salida por fila: [dateInt(yyyymmdd), lat, lng, classIdx(0..3 A/B/C/D), "zona", "resumen corto"]
// ============================================================
const fs = require('fs');

const CSV_IN = process.env.GEIPAN_CSV || '/tmp/geipan.csv';
const GEO_IN = process.env.FR_DEP || '/tmp/fr_dep.geojson';
const OUT = process.argv[2] || 'data/geipan.json';

// ---- 1) centroides de departamentos metropolitanos (bbox center) ----
const geo = JSON.parse(fs.readFileSync(GEO_IN, 'utf8'));
const centroid = {};   // code -> [lat, lng]
function bbox(coords, b) {
  for (const c of coords) {
    if (typeof c[0] === 'number') {
      if (c[0] < b[0]) b[0] = c[0]; if (c[0] > b[2]) b[2] = c[0];
      if (c[1] < b[1]) b[1] = c[1]; if (c[1] > b[3]) b[3] = c[1];
    } else bbox(c, b);
  }
  return b;
}
geo.features.forEach(f => {
  const b = bbox(f.geometry.coordinates, [180, 90, -180, -90]);
  centroid[f.properties.code] = [(b[1] + b[3]) / 2, (b[0] + b[2]) / 2];
});
// ---- departamentos/territorios de ultramar (no incluidos en el geojson) ----
Object.assign(centroid, {
  '971': [16.25, -61.55],  // Guadalupe
  '972': [14.64, -61.02],  // Martinica
  '973': [3.93, -53.13],   // Guayana Francesa
  '974': [-21.13, 55.53],  // Reunión
  '975': [46.88, -56.32],  // San Pedro y Miquelón
  '976': [-12.83, 45.16],  // Mayotte
  '977': [17.90, -62.83],  // San Bartolomé
  '978': [18.07, -63.05],  // San Martín
  '986': [-13.28, -176.18],// Wallis y Futuna
  '987': [-17.68, -149.41],// Polinesia Francesa
  '988': [-21.13, 165.45], // Nueva Caledonia
});

// ---- 2) parser CSV robusto (delimitador ';', comillas multi-línea, latin1) ----
function parse(s) {
  const rows = []; let row = [], cur = '', inQ = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inQ) {
      if (ch === '"') { if (s[i + 1] === '"') { cur += '"'; i++; } else inQ = false; }
      else cur += ch;
    } else {
      if (ch === '"') inQ = true;
      else if (ch === ';') { row.push(cur); cur = ''; }
      else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
      else if (ch === '\r') { /* skip */ }
      else cur += ch;
    }
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

const txt = fs.readFileSync(CSV_IN).toString('latin1');
const rows = parse(txt);
rows.shift(); // header

const CLASS_IDX = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'D1': 3, 'D2': 3 };
// deterministic jitter from id (so points within a department spread, reproducibly)
function jitter(id, salt) {
  let h = 2166136261 ^ salt;
  const s = String(id);
  for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 16777619); }
  return (((h >>> 0) / 4294967295) - 0.5) * 0.36; // ±0.18°
}
function clean(html) {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ').trim().slice(0, 240);
}

const out = [];
let skipNoGeo = 0, skipNoYear = 0, skipNoClass = 0;
rows.forEach(r => {
  const id = r[0];
  const code = (r[3] || '').trim();
  const cls = (r[32] || '').trim();
  const ci = CLASS_IDX[cls];
  if (ci === undefined) { skipNoClass++; return; }
  const cen = centroid[code];
  if (!cen) { skipNoGeo++; return; }
  const y = parseInt(r[5], 10);
  if (!(y >= 1900 && y <= 2030)) { skipNoYear++; return; }
  let mm = parseInt(r[6], 10); if (!(mm >= 1 && mm <= 12)) mm = 1;
  let jj = parseInt(r[7], 10); if (!(jj >= 1 && jj <= 31)) jj = 1;
  const dateInt = y * 10000 + mm * 100 + jj;
  const lat = +(cen[0] + jitter(id, 7)).toFixed(3);
  const lng = +(cen[1] + jitter(id, 13)).toFixed(3);
  const zone = (r[2] || '').trim();
  const resume = clean(r[9] || r[8]);
  out.push([dateInt, lat, lng, ci, zone, resume]);
});

const payload = { classes: ['A', 'B', 'C', 'D'], rows: out };
fs.writeFileSync(OUT, JSON.stringify(payload));
console.log('GEIPAN casos:', out.length, '| sin geo:', skipNoGeo, '| sin año:', skipNoYear, '| sin clase:', skipNoClass);
console.log('bytes:', fs.statSync(OUT).size);
const byClass = [0, 0, 0, 0]; out.forEach(r => byClass[r[3]]++);
console.log('por clase A/B/C/D:', byClass);
