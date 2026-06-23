#!/usr/bin/env node
// Exporta una capa canónica normalizada desde los datasets actuales.
//
// Por defecto genera una muestra pequeña para revisar contrato y esquema:
//   node tools/export_normalized.js
//
// Para exportar todo el corpus compacto actual:
//   node tools/export_normalized.js --all
//
// Salida:
//   data/normalized/sources.json
//   data/normalized/cases.jsonl
//   data/normalized/observations.jsonl
//   data/normalized/links.jsonl
//   data/normalized/frontend-map-points.json

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'data', 'normalized');
const SAMPLE_LIMIT = 250;
const exportAll = process.argv.includes('--all');

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
}

function loadStaticData() {
  const code = fs.readFileSync(path.join(ROOT, 'js', 'data.js'), 'utf8');
  const sandbox = {};
  const exposed = [
    'TYPE_META',
    'CASES',
    'SHAPE_META',
    'GEIPAN_META',
    'DATA_SOURCE_CATALOG',
  ];
  const result = vm.runInNewContext(`${code}\n;({${exposed.join(',')}});`, sandbox);
  return result;
}

function dateIntToIso(dateInt) {
  const s = String(dateInt).padStart(8, '0');
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJsonl(rel, rows) {
  fs.writeFileSync(path.join(OUT_DIR, rel), rows.map(row => JSON.stringify(row)).join('\n') + '\n');
}

function normalizeSourceType(type) {
  if (type === 'official_archive') return 'official';
  return type;
}

function main() {
  ensureDir(OUT_DIR);
  const { CASES, SHAPE_META, GEIPAN_META, DATA_SOURCE_CATALOG } = loadStaticData();
  const nuforc = readJson('data/nuforc.json').rows;
  const geipan = readJson('data/geipan.json').rows;
  const rowLimit = exportAll ? Infinity : SAMPLE_LIMIT;

  const sources = DATA_SOURCE_CATALOG.map(source => ({
    id: source.id,
    name: source.name,
    country: source.country,
    source_type: normalizeSourceType(source.type),
    status: source.status,
    priority: source.priority,
    period: source.period,
    record_count_label: source.records,
    url: source.url,
    rights_note: 'Revisar licencia/condiciones de cada fuente antes de redistribuir textos completos.',
  }));

  const cases = [];
  const observations = [];
  const links = [];
  const mapPoints = [];

  for (const c of CASES) {
    const id = `curated:${c.id}`;
    cases.push({
      id,
      source_id: c.mine ? 'local_notebook' : 'ufologist_curated',
      source_case_id: c.id,
      canonical_title: c.name,
      event_date: c.date || null,
      event_time: c.time || null,
      timezone: c.timezone || null,
      datetime_precision: c.datetimePrecision || (c.time ? 'reported-local' : 'date-only'),
      lat: c.lat,
      lng: c.lng,
      location_name: c.loc || null,
      country: c.country || null,
      contact_type: c.type || null,
      shape_type: null,
      confidence: c.cred || null,
      summary: c.summary || '',
    });
    observations.push({
      id: `${id}:obs:primary`,
      case_id: id,
      observation_role: 'primary_summary',
      witness_type: c.type === 'MIL' ? 'trained' : null,
      duration_seconds: null,
      behavior_tags: [],
      sensor_tags: c.type === 'RV' ? ['radar', 'visual'] : [],
      physical_effect_tags: c.type === 'CE2' ? ['physical_trace'] : [],
      notes: c.timeNote || null,
    });
    for (const [i, source] of (c.sources || []).entries()) {
      links.push({
        id: `${id}:link:${i + 1}`,
        case_id: id,
        label: source[0],
        url: source[1],
        link_type: 'reference',
      });
    }
    mapPoints.push({
      id,
      lat: c.lat,
      lng: c.lng,
      date: c.date || null,
      source_id: c.mine ? 'local_notebook' : 'ufologist_curated',
      contact_type: c.type || null,
      shape_type: null,
      confidence: c.cred || null,
      label: c.name,
    });
  }

  nuforc.slice(0, rowLimit).forEach((r, i) => {
    const [dateInt, hour, lat, lng, shapeIdx, loc] = r;
    const id = `nuforc:${dateInt}:${i}`;
    const shape = SHAPE_META[shapeIdx]?.code || 'other';
    cases.push({
      id,
      source_id: 'nuforc',
      source_case_id: null,
      canonical_title: loc || 'NUFORC report',
      event_date: dateIntToIso(dateInt),
      event_time: hour >= 0 ? `${String(hour).padStart(2, '0')}:00` : null,
      timezone: null,
      datetime_precision: hour >= 0 ? 'hour-only' : 'date-only',
      lat,
      lng,
      location_name: loc || null,
      country: null,
      contact_type: null,
      shape_type: shape,
      confidence: null,
      summary: '',
    });
    mapPoints.push({
      id,
      lat,
      lng,
      date: dateIntToIso(dateInt),
      source_id: 'nuforc',
      contact_type: null,
      shape_type: shape,
      confidence: null,
      label: loc || 'NUFORC report',
    });
  });

  geipan.slice(0, rowLimit).forEach((r, i) => {
    const [dateInt, lat, lng, classIdx, zone, resume] = r;
    const classification = GEIPAN_META[classIdx]?.code || null;
    const id = `geipan:${dateInt}:${i}`;
    cases.push({
      id,
      source_id: 'geipan',
      source_case_id: null,
      canonical_title: zone || 'GEIPAN case',
      event_date: dateIntToIso(dateInt),
      event_time: null,
      timezone: null,
      datetime_precision: 'date-only',
      lat,
      lng,
      location_name: zone || null,
      country: 'France',
      contact_type: null,
      shape_type: null,
      confidence: null,
      summary: resume || '',
      official_classification: classification,
    });
    observations.push({
      id: `${id}:obs:summary`,
      case_id: id,
      observation_role: 'official_summary',
      witness_type: null,
      duration_seconds: null,
      behavior_tags: [],
      sensor_tags: [],
      physical_effect_tags: [],
      notes: resume || null,
    });
    mapPoints.push({
      id,
      lat,
      lng,
      date: dateIntToIso(dateInt),
      source_id: 'geipan',
      contact_type: null,
      shape_type: null,
      confidence: null,
      label: zone || 'GEIPAN case',
      official_classification: classification,
    });
  });

  sources.unshift({
    id: 'ufologist_curated',
    name: 'UFOlogist curated cases',
    country: 'global',
    source_type: 'editorial',
    status: 'active',
    priority: 1,
    period: '1942-2026',
    record_count_label: `${CASES.length} cases`,
    url: '',
    rights_note: 'Curated metadata created for the app; source links retain their own rights.',
  });

  fs.writeFileSync(path.join(OUT_DIR, 'sources.json'), JSON.stringify(sources, null, 2));
  writeJsonl('cases.jsonl', cases);
  writeJsonl('observations.jsonl', observations);
  writeJsonl('links.jsonl', links);
  fs.writeFileSync(path.join(OUT_DIR, 'frontend-map-points.json'), JSON.stringify(mapPoints));

  console.log(`sources: ${sources.length}`);
  console.log(`cases: ${cases.length}${exportAll ? '' : ` (sample limit ${SAMPLE_LIMIT} per mass dataset)`}`);
  console.log(`observations: ${observations.length}`);
  console.log(`links: ${links.length}`);
  console.log(`map points: ${mapPoints.length}`);
  console.log(`out: ${path.relative(ROOT, OUT_DIR)}`);
}

main();
