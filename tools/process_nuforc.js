// ============================================================
// Regenera data/nuforc.json a partir del CSV público de NUFORC.
//
// Uso:
//   1) Descarga el CSV geocodificado (dataset público planetsig/ufo-reports):
//      curl -sL -o /tmp/ufo-nuforc.csv \
//        https://raw.githubusercontent.com/planetsig/ufo-reports/master/csv-data/ufo-scrubbed-geocoded-time-standardized.csv
//   2) node tools/process_nuforc.js data/nuforc.json
//   3) (opcional, fallback file://) genera data/nuforc.js:
//      node -e "const fs=require('fs');fs.writeFileSync('data/nuforc.js','window.NUFORC_DATA='+fs.readFileSync('data/nuforc.json','utf8')+';')"
//
// Salida por fila: [dateInt(yyyymmdd), hour(-1..23), lat, lng, shapeIdx, "city, st, cc"]
// ============================================================
const fs = require('fs');

const SHAPE_GROUPS = [
  ['light', ['light', 'flash', 'flare']],
  ['fireball', ['fireball']],
  ['orb', ['circle', 'sphere', 'round', 'orb']],
  ['triangle', ['triangle', 'delta', 'pyramid', 'chevron']],
  ['disk', ['disk', 'dome', 'saucer', 'crescent', 'hexagon']],
  ['cigar', ['cigar', 'cylinder', 'cone']],
  ['oval', ['oval', 'egg', 'teardrop']],
  ['geometric', ['rectangle', 'diamond', 'cross']],
  ['formation', ['formation']],
  ['other', ['other', 'unknown', 'changing', 'changed', '']],
];
const shapeIdx = {};
SHAPE_GROUPS.forEach(([g, members], i) => members.forEach(m => shapeIdx[m] = i));

function parseCSVLine(line) {
  const out = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else inQ = false; }
      else cur += ch;
    } else {
      if (ch === '"') inQ = true;
      else if (ch === ',') { out.push(cur); cur = ''; }
      else cur += ch;
    }
  }
  out.push(cur);
  return out;
}

const CSV_IN = process.env.NUFORC_CSV || '/tmp/ufo-nuforc.csv';
const OUT = process.argv[2] || 'data/nuforc.json';
const raw = fs.readFileSync(CSV_IN, 'utf8');
const lines = raw.split('\n');
const rows = [];
let skipped = 0;
for (const line of lines) {
  if (!line.trim()) continue;
  const f = parseCSVLine(line);
  if (f.length < 11) { skipped++; continue; }
  const dt = f[0].trim();                       // M/D/YYYY HH:MM
  const m = dt.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/);
  if (!m) { skipped++; continue; }
  const [, mo, da, yr, hh] = m;
  const year = +yr;
  if (year < 1900 || year > 2015) { skipped++; continue; }
  const lat = parseFloat(f[9]), lng = parseFloat(f[10]);
  if (!isFinite(lat) || !isFinite(lng) || (lat === 0 && lng === 0) || Math.abs(lat) > 90 || Math.abs(lng) > 180) { skipped++; continue; }
  const shape = (f[4] || '').trim().toLowerCase();
  const si = shapeIdx[shape] !== undefined ? shapeIdx[shape] : 9;
  const city = (f[1] || '').trim().replace(/\s+/g, ' ');
  const st = (f[2] || '').trim();
  const cc = (f[3] || '').trim();
  const loc = [city, st, cc].filter(Boolean).join(', ');
  const dateInt = year * 10000 + (+mo) * 100 + (+da);
  let hour = parseInt(hh, 10);
  if (!(hour >= 0 && hour <= 23)) hour = -1;
  rows.push([dateInt, hour, +lat.toFixed(3), +lng.toFixed(3), si, loc]);
}

const out = { shapes: SHAPE_GROUPS.map(g => g[0]), rows };
fs.writeFileSync(OUT, JSON.stringify(out));
console.log('rows:', rows.length, 'skipped:', skipped, 'bytes:', fs.statSync(OUT).size);
