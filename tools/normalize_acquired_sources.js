#!/usr/bin/env node
// Normaliza fuentes adquiridas a JSONL intermedio por fuente.
//
// Salidas:
//   data/sources/normalized/<source_id>.jsonl
//   data/sources/normalized/normalization-summary.json

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const childProcess = require('child_process');
const { PDFParse } = require('pdf-parse');

const ROOT = path.resolve(__dirname, '..');
const RAW_ROOT = path.join(ROOT, 'data', 'sources', 'raw');
const OUT_ROOT = path.join(ROOT, 'data', 'sources', 'normalized');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function hash(input) {
  return crypto.createHash('sha1').update(input).digest('hex').slice(0, 12);
}

function cleanText(text) {
  return String(text || '').replace(/\r/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

function compact(text) {
  return cleanText(text).replace(/\s+/g, ' ').trim();
}

function htmlToText(html) {
  return cleanText(decodeHtmlEntities(String(html || '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<\/(?:p|div|section|article|li|tr|h[1-6]|br)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&gt;/g, '>')));
}

function titleFromHtml(html, fallback) {
  const title = String(html || '').match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return compact(htmlToText(title || fallback || '')).slice(0, 220) || fallback || null;
}

function decodeHtmlEntities(text) {
  const named = {
    nbsp: ' ',
    amp: '&',
    quot: '"',
    apos: "'",
    '#39': "'",
    lt: '<',
    gt: '>',
    rsaquo: '›',
    laquo: '«',
    raquo: '»',
    aacute: 'á',
    eacute: 'é',
    iacute: 'í',
    oacute: 'ó',
    uacute: 'ú',
    Aacute: 'Á',
    Eacute: 'É',
    Iacute: 'Í',
    Oacute: 'Ó',
    Uacute: 'Ú',
    ntilde: 'ñ',
    Ntilde: 'Ñ',
    deg: '°',
  };
  return String(text || '').replace(/&(#x?[0-9a-f]+|[a-zA-Z][a-zA-Z0-9]+);/g, (m, entity) => {
    if (named[entity]) return named[entity];
    if (entity.startsWith('#x')) return String.fromCodePoint(parseInt(entity.slice(2), 16));
    if (entity.startsWith('#')) return String.fromCodePoint(parseInt(entity.slice(1), 10));
    return m;
  });
}

function fileSha1(file) {
  return crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex');
}

function sampleText(text, max = 1400) {
  const one = compact(text);
  return one.length > max ? `${one.slice(0, max)}...` : one;
}

function documentRecord(sourceId, file, assetMap, fields = {}) {
  const rel = path.relative(ROOT, file);
  const stat = fs.existsSync(file) ? fs.statSync(file) : null;
  const ext = path.extname(file).replace('.', '').toLowerCase() || null;
  return {
    id: `${sourceId}:doc:${hash(rel + ':' + (fields.zip_entry || fields.title || fields.text_sample || 'document'))}`,
    source_id: sourceId,
    record_type: 'archive_document',
    title: null,
    source_file: rel,
    source_url: sourceUrlFor(file, sourceId, assetMap),
    file_name: path.basename(file),
    file_ext: ext,
    byte_size: stat?.size || null,
    sha1: stat && stat.size < 60_000_000 ? fileSha1(file) : null,
    country: null,
    document_date: null,
    document_year: null,
    text_chars: null,
    text_sample: null,
    text_hash: null,
    extraction_confidence: 'low',
    needs_review: true,
    promotion_status: 'not_case',
    notes: null,
    ...fields,
  };
}

function documentTextFields(text) {
  const cleaned = cleanText(text);
  return {
    text_chars: cleaned.length,
    text_sample: sampleText(cleaned),
    text_hash: cleaned ? hash(cleaned) : null,
  };
}

function yearFromText(text) {
  const m = String(text || '').match(/\b((?:19|20)\d{2})\b/);
  return m ? Number(m[1]) : null;
}

function listZipEntries(file) {
  const result = childProcess.spawnSync('unzip', ['-l', file], { encoding: 'utf8' });
  if (result.status !== 0) return [];
  const rows = result.stdout.split(/\r?\n/);
  const entries = [];
  for (const line of rows) {
    const m = line.match(/^\s*(\d+)\s+(\d{2}-\d{2}-\d{4})\s+(\d{2}:\d{2})\s+(.+?)\s*$/);
    if (!m) continue;
    if (m[4].endsWith('/')) continue;
    entries.push({
      length: Number(m[1]),
      modified_date: m[2],
      modified_time: m[3],
      name: m[4],
    });
  }
  return entries;
}

function htmlAttr(html, attr) {
  const re = new RegExp(`${attr}="([^"]*)"`, 'i');
  const value = String(html || '').match(re)?.[1] || null;
  return value ? decodeHtmlEntities(value) : null;
}

function firstMatch(text, patterns) {
  for (const pattern of patterns) {
    const match = String(text || '').match(pattern);
    if (match) return match;
  }
  return null;
}

function isoDateFromParts(day, month, year) {
  const y = Number(year);
  const d = Number(day);
  const m = Number(month);
  if (!(y >= 1900 && y <= 2035 && m >= 1 && m <= 12 && d >= 1 && d <= 31)) return null;
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

const MONTHS_EN = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

const MONTHS_ES = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  setiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
};

function isoDateFromSpanishText(text) {
  const m = String(text || '').match(/(\d{1,2})(?:\s+y\s+\d{1,2})?\s+de\s+([A-Za-zÁÉÍÓÚáéíóúñÑ]+)\s+de\s+((?:19|20)\d{2})/i);
  if (!m) return null;
  return isoDateFromParts(m[1], MONTHS_ES[m[2].toLowerCase()], m[3]);
}

const NUFORC_SHAPES = [
  ['Changing', /\bchanging\b/i],
  ['Chevron', /\bchevron\b/i],
  ['Cigar', /\b(?:cigar(?: shaped)?|cigarro|cilindro)\b/i],
  ['Circle', /\b(?:circle|circular|round|redond[ao])\b/i],
  ['Cone', /\b(?:cone(?: shaped)?|cono)\b/i],
  ['Cross', /\bcross(?: shaped)?\b/i],
  ['Cylinder', /\bcylind(?:er|rical)\b/i],
  ['Diamond', /\bdiamond(?: shaped)?\b/i],
  ['Disk', /\b(?:disc|disk|saucer|disco|platillo)(?: shaped)?\b/i],
  ['Egg', /\begg(?: shaped)?\b/i],
  ['Fireball', /\bfireball\b/i],
  ['Flash', /\b(?:flash(?:ing)?|destello)\b/i],
  ['Formation', /\b(?:formation|formaci[oó]n)\b/i],
  ['Light', /\b(?:lights?|luces?|luminos[ao])\b/i],
  ['Oval', /\b[oó]val\b/i],
  ['Rectangle', /\b(?:rectangle|rectangular|rect[aá]ngulo)\b/i],
  ['Sphere', /\b(?:sphere|spherical|orb|esfera|orbe)\b/i],
  ['Teardrop', /\bteardrop\b/i],
  ['Triangle', /\b(?:triang(?:le|ular)|tri[aá]ngulo|triangular)\b/i],
  ['Unknown', /\bunknown\b/i],
  ['Other', /\bother\b/i],
];

function nuforcShapeFromText(text) {
  const found = NUFORC_SHAPES.find(([, re]) => re.test(text || ''));
  return found ? found[0] : null;
}

async function pdfText(file) {
  return pdfTextFromData(fs.readFileSync(file));
}

async function pdfTextFromData(data) {
  const parser = new PDFParse({ data });
  try {
    const result = await parser.getText();
    return { text: cleanText(result.text), pages: result.total };
  } finally {
    await parser.destroy();
  }
}

function manifestAssetByFile(sourceId) {
  const p = path.join(RAW_ROOT, sourceId, 'manifest.json');
  if (!fs.existsSync(p)) return new Map();
  const m = JSON.parse(fs.readFileSync(p, 'utf8'));
  const map = new Map();
  for (const asset of m.assets || []) map.set(asset.file, asset);
  return map;
}

function sourceUrlFor(file, sourceId, assetMap) {
  const rel = path.relative(ROOT, file);
  return assetMap.get(rel)?.url || assetMap.get(rel)?.final_url || null;
}

function baseRecord(sourceId, file, assetMap, fields = {}) {
  const rel = path.relative(ROOT, file);
  return {
    id: `${sourceId}:${hash(rel + ':' + (fields.source_case_id || fields.event_date || fields.raw_text || 'record'))}`,
    source_id: sourceId,
    source_file: rel,
    source_url: sourceUrlFor(file, sourceId, assetMap),
    source_case_id: null,
    event_date: null,
    event_time: null,
    datetime_precision: null,
    location_name: null,
    region: null,
    country: null,
    classification_system: null,
    classification_value: null,
    shape_reported: null,
    description: null,
    raw_text: null,
    extraction_confidence: 'low',
    needs_review: true,
    ...fields,
  };
}

function parseChileCase(text, file, assetMap) {
  const one = compact(text);
  const caseNo = one.match(/Caso\s*N[°o]:\s*([0-9]+)/i)?.[1] || path.basename(file).match(/CASO-[^-]+-(\d+)/i)?.[1] || null;
  const reportDate = one.match(/Fecha\s+Reporte:\s*(\d{2})-(\d{2})-(\d{4})/i);
  const resolutionDate = one.match(/Fecha\s+Resoluci[oó]n:\s*(\d{2})-(\d{2})-(\d{4})/i);
  const location = one.match(/Lugar:\s*(.*?)\s+Regi[oó]n:/i)?.[1] || null;
  const region = one.match(/Regi[oó]n:\s*(.*?)\s+Clasificaci[oó]n:/i)?.[1] || null;
  const classification = one.match(/Clasificaci[oó]n:\s*(.*?)\s+Resumen:/i)?.[1] || null;
  const summary = one.match(/Resumen:\s*(.*?)(?:Descripci[oó]n de usuario\/a:|Testimonios|\z)/i)?.[1] || null;
  const userDesc = one.match(/Descripci[oó]n de usuario\/a:\s*(.*?)(?:Testimonios|An[aá]lisis|Conclusi[oó]n|\z)/i)?.[1] || null;
  const eventDateTime = one.match(/(?:situado|situada|observado|observada).*?a las\s+(\d{1,2}:\d{2})\s+horas\s+del\s+(\d{1,2})\s+de\s+([a-záéíóú]+)\s+de\s+(\d{4})/i);
  const monthMap = {
    enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
    julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
  };
  let eventDate = null;
  let eventTime = null;
  if (eventDateTime) {
    eventTime = eventDateTime[1];
    const month = monthMap[eventDateTime[3].toLowerCase()];
    eventDate = isoDateFromParts(eventDateTime[2], month, eventDateTime[4]);
  }
  if (!eventDate && reportDate) eventDate = isoDateFromParts(reportDate[1], reportDate[2], reportDate[3]);
  return baseRecord('chile_sefaa', file, assetMap, {
    source_case_id: caseNo,
    id: `chile_sefaa:${caseNo || hash(file)}`,
    event_date: eventDate,
    event_time: eventTime,
    datetime_precision: eventTime ? 'reported-local' : 'report-date',
    location_name: location,
    region,
    country: 'Chile',
    classification_system: 'SEFAA',
    classification_value: classification,
    shape_reported: nuforcShapeFromText([summary, userDesc].filter(Boolean).join(' ')),
    description: compact([summary, userDesc].filter(Boolean).join(' ')).slice(0, 2000) || null,
    raw_text: one.slice(0, 6000),
    extraction_confidence: caseNo && (location || region) ? 'high' : 'medium',
    needs_review: !(caseNo && (location || region)),
    report_date: reportDate ? isoDateFromParts(reportDate[1], reportDate[2], reportDate[3]) : null,
    resolution_date: resolutionDate ? isoDateFromParts(resolutionDate[1], resolutionDate[2], resolutionDate[3]) : null,
  });
}

function parseUkRows(text, file, assetMap) {
  const one = compact(text);
  const year = path.basename(file).match(/(?:19|20)\d{2}/)?.[0] || one.match(/UFO Report\s+((?:19|20)\d{2})/i)?.[1] || null;
  const dateRe = /(\d{2})-([A-Za-z]{3})-(\d{2})(?:\s+(\d{1,2}:\d{2}))?\s+/g;
  const matches = [...one.matchAll(dateRe)];
  const rows = [];
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const start = m.index;
    const end = i + 1 < matches.length ? matches[i + 1].index : one.length;
    const row = one.slice(start, end).trim();
    const yy = Number(m[3]);
    const fullYear = yy >= 70 ? 1900 + yy : 2000 + yy;
    const eventDate = isoDateFromParts(m[1], MONTHS_EN[m[2].toLowerCase()], fullYear);
    const after = row.slice(m[0].length).trim();
    const locationMatch = after.match(/^(.{2,80}?)\s+([A-Z][A-Za-z .'-]*(?:shire|Wales|Scotland|Ireland|London|Devon|Essex|Kent|Surrey|Norfolk|Suffolk|Cornwall|Hampshire|Dorset|Lancashire|Yorkshire|Manchester|Berkshire|Cambridgeshire|Merseyside|Oxfordshire|Wiltshire|Cheshire|Durham|Cumbria|Derbyshire|Somerset|Sussex|Gloucestershire|Hertfordshire|Bedfordshire|Northumberland|Lincolnshire|Leicestershire|Warwickshire|Staffordshire|Nottinghamshire|Worcestershire|Herefordshire|Shropshire|Middlesex|Isle of Wight|Channel Islands|Fife|Lothian|Highlands|Aberdeenshire|Angus|Ayrshire|Dumfries and Galloway|Glamorgan|Gwent|Powys|Clwyd|Dyfed|Gwynedd))\s+(.*)$/);
    let town = null;
    let county = null;
    let desc = after;
    if (locationMatch) {
      town = locationMatch[1].trim();
      county = locationMatch[2].trim();
      desc = locationMatch[3].trim();
    }
    rows.push(baseRecord('uk_mod', file, assetMap, {
      id: `uk_mod:${hash(path.basename(file) + ':' + row)}`,
      source_case_id: null,
      event_date: eventDate,
      event_time: m[4] || null,
      datetime_precision: m[4] ? 'reported-local' : 'date-only',
      location_name: town,
      region: county,
      country: 'United Kingdom',
      classification_system: 'UK MoD report table',
      classification_value: null,
      shape_reported: nuforcShapeFromText(desc),
      description: desc.slice(0, 2000),
      raw_text: row.slice(0, 3000),
      extraction_confidence: eventDate && desc ? 'medium' : 'low',
      needs_review: true,
      report_year: year,
    }));
  }
  return rows;
}

function parseArgentinaReport(text, file, assetMap) {
  const one = compact(text);
  const year = path.basename(file).match(/(?:20|19)\d{2}/)?.[0] || one.match(/durante\s+((?:20|19)\d{2})/i)?.[1] || null;
  const count = one.match(/(?:Los|Las)\s+.*?\((\d+)\)\s+casos/i)?.[1] || one.match(/(\d+)\s+casos\s+(?:listados|analizados|recibidos)/i)?.[1] || null;
  const resolvedAll = /totalidad de los casos analizados fueron resueltos/i.test(one);
  const rows = [baseRecord('argentina_ciae', file, assetMap, {
    id: `argentina_ciae:report:${year || hash(file)}`,
    source_case_id: year ? `report-${year}` : null,
    event_date: year ? `${year}-01-01` : null,
    datetime_precision: year ? 'year-report' : null,
    country: 'Argentina',
    classification_system: 'CIAE annual report',
    classification_value: resolvedAll ? 'resolved-known-origin' : null,
    description: one.slice(0, 2200),
    raw_text: one.slice(0, 8000),
    extraction_confidence: 'medium',
    needs_review: true,
    report_year: year,
    reported_case_count: count ? Number(count) : null,
    record_type: 'annual_report',
  })];

  const tocStart = one.indexOf('ÍNDICE');
  const tocEndCandidates = ['CONCLUSIONES FINALES', 'INVESTIGACIÓN DE CAMPO', '1) CASO']
    .map(marker => one.indexOf(marker, tocStart + 12))
    .filter(i => i > tocStart);
  const tocEnd = tocStart >= 0 && tocEndCandidates.length ? Math.max(...tocEndCandidates) : Math.min(one.length, tocStart + 14000);
  const toc = tocStart >= 0 ? one.slice(tocStart, Math.min(one.length, Math.max(tocEnd, tocStart + 8000))) : one.slice(0, 14000);
  const itemRe = /(\d{1,3})\)\s+CASO\s+(.+?)\s+P[aá]g\.\s+(\d{1,3})/gi;
  for (const match of toc.matchAll(itemRe)) {
    const idx = match[1];
    const label = match[2].replace(/\s+/g, ' ').trim();
    const page = Number(match[3]);
    const dateMatch = label.match(/\((\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\)/);
    let eventDate = null;
    if (dateMatch && dateMatch[3]) {
      const yy = Number(dateMatch[3]);
      const fullYear = yy < 100 ? (yy >= 70 ? 1900 + yy : 2000 + yy) : yy;
      eventDate = isoDateFromParts(dateMatch[1], dateMatch[2], fullYear);
    }
    const labelNoDate = label.replace(/\s*\([^)]*\)\s*$/, '').trim();
    const parts = labelNoDate.split(/\s+[–-]\s+/);
    const caseTitle = parts[0]?.trim() || labelNoDate;
    const place = parts.length > 1 ? parts.slice(1).join(' - ').trim() : null;
    rows.push(baseRecord('argentina_ciae', file, assetMap, {
      id: `argentina_ciae:${year || 'unknown'}:${idx}`,
      source_case_id: year ? `${year}-${idx}` : idx,
      event_date: eventDate,
      datetime_precision: eventDate ? 'date-only' : 'listed-case',
      location_name: place,
      country: 'Argentina',
      classification_system: 'CIAE annual report index',
      classification_value: null,
      description: label,
      raw_text: match[0],
      extraction_confidence: eventDate || place ? 'medium' : 'low',
      needs_review: true,
      report_year: year,
      report_page: page,
      record_type: 'case_index',
      case_title: caseTitle,
    }));
  }
  return rows;
}

function parseSpainFullTitle(html) {
  const analyticsTag = String(html || '').match(/<a\b[^>]*data-analytics-recordtitle="[^"]*"[^>]*>/i)?.[0] || '';
  const analyticsTitle = htmlAttr(analyticsTag, 'data-analytics-recordtitle');
  const h1Title = htmlAttr(String(html || '').match(/<h1\b[^>]*title="[^"]*"[^>]*>/i)?.[0] || '', 'title');
  const titleField = firstMatch(html, [
    /<span class="etiqueta">Título:\s*<\/span>[\s\S]*?<bdi>([\s\S]*?)<\/bdi>/i,
    /<span class="titulo" title="([^"]+)"/i,
  ])?.[1];
  return compact(analyticsTitle || h1Title || htmlToText(titleField || ''))
    .replace(/\s*\/\s*Mando Operativo Aéreo.*$/i, '')
    .replace(/\s*\((?:19|20)\d{2}(?:-\d{4})?\)\s*$/i, '');
}

function parseSpainCaseFromPage(row, assetMap) {
  const file = path.join(ROOT, row.source_file);
  const html = fs.readFileSync(file, 'utf8');
  const text = htmlToText(html);
  const fullTitle = parseSpainFullTitle(html) || row.title;
  const recordTag = String(html || '').match(/<a\b[^>]*data-analytics-recordid="[^"]*"[^>]*>/i)?.[0] || '';
  const recordId = htmlAttr(recordTag, 'data-analytics-recordid');
  const mediaPath = String(html || '').match(/catalogo_imagenes\/grupo\.do\?path=([0-9]+)/i)?.[1] || null;
  const publication = firstMatch(text, [/Publicación:\s*([0-9]{4}(?:-[0-9]{4})?)/i])?.[1] || null;
  const physical = firstMatch(text, [/Descripción física:\s*([^:]+?)\s+Tipo de contenido:/i])?.[1] || null;
  const declass = firstMatch(text, [/(Desclasificad[oa][^.]*?(?:19|20)\d{2})/i])?.[1] || null;
  const titleCore = fullTitle.replace(/^Avistamiento de fenómenos extraños\s*/i, '').trim();
  const locationName = titleCore.match(/^en\s+(.+?)(?:\s*:\s*|\s+\d{4}\s*-\s*\d{4}|$)/i)?.[1]?.trim() || row.location_name_hint || null;
  const eventDate = isoDateFromSpanishText(fullTitle);
  const sourceCaseId = recordId || (mediaPath ? `bvd-path-${mediaPath}` : hash(row.source_file));
  return baseRecord('spain_defensa', file, assetMap, {
    id: `spain_defensa:${sourceCaseId}`,
    record_type: 'case_catalog_stub',
    source_case_id: sourceCaseId,
    event_date: eventDate,
    event_time: null,
    datetime_precision: eventDate ? 'date-only' : (publication && /^\d{4}$/.test(publication) ? 'year-catalog' : 'catalog-stub'),
    location_name: locationName,
    region: locationName,
    country: 'Spain',
    classification_system: 'Biblioteca Virtual de Defensa Expedientes OVNI',
    classification_value: 'official-catalog-record',
    shape_reported: null,
    description: fullTitle,
    raw_text: sampleText(text, 5000),
    extraction_confidence: eventDate && locationName ? 'medium' : 'low',
    needs_review: true,
    publication_year: publication,
    physical_description: physical,
    declassification_note: declass,
    media_group_path: mediaPath,
    catalog_title: fullTitle,
    promotion_status: 'case_stub_pending_document',
  });
}

function normalizeAmPmTime(time, ampm) {
  const parts = String(time || '').match(/^(\d{1,2}):(\d{2})/);
  if (!parts) return null;
  let hour = Number(parts[1]);
  const minute = parts[2];
  if (ampm) {
    const marker = ampm.toUpperCase();
    if (marker === 'PM' && hour < 12) hour += 12;
    if (marker === 'AM' && hour === 12) hour = 0;
  }
  if (hour < 0 || hour > 23) return null;
  return `${String(hour).padStart(2, '0')}:${minute}`;
}

function parseNaraIncidentDate(text) {
  const skywatch = String(text || '').match(/\bDate:\s*(\d{1,2}:\d{2})\s+(\d{1,2})\/(\d{1,2})\/((?:19|20)\d{2})/i);
  if (skywatch) {
    return {
      event_date: isoDateFromParts(skywatch[3], skywatch[2], skywatch[4]),
      event_time: normalizeAmPmTime(skywatch[1]),
      timezone_hint: null,
    };
  }
  const ops = String(text || '').match(/\bDate:\s*(\d{1,2})\/(\d{1,2})\/((?:19|20)\d{2})\s+(\d{1,2}:\d{2})(?::\d{2})?\s*(AM|PM)?(?:\s*\(([^)]+)\))?/i);
  if (ops) {
    return {
      event_date: isoDateFromParts(ops[2], ops[1], ops[3]),
      event_time: normalizeAmPmTime(ops[4], ops[5]),
      timezone_hint: ops[6] || null,
    };
  }
  const iso = String(text || '').match(/\bDATE:\s*((?:19|20)\d{2})-(\d{2})-(\d{2})T(\d{2}:\d{2})/i);
  if (iso) {
    return {
      event_date: `${iso[1]}-${iso[2]}-${iso[3]}`,
      event_time: iso[4],
      timezone_hint: null,
    };
  }
  return { event_date: null, event_time: null, timezone_hint: null };
}

function parseNaraSkywatchIncident(text, zipFile, entryName, assetMap) {
  const one = compact(text);
  if (!/\b(?:UAP|UFO|UNIDENTIFIED AERIAL PHENOMENON)\b/i.test(one)) return null;
  const { event_date, event_time, timezone_hint } = parseNaraIncidentDate(one);
  if (!event_date) return null;
  const sourceCaseId = path.basename(entryName, path.extname(entryName));
  const primaryCode = one.match(/PRIMARY CODE:\s*([^:]+?)\s+Date:/i)?.[1]?.trim() || null;
  const status = one.match(/\bStatus:\s*([^:]+?)\s+POD:/i)?.[1]?.trim() || null;
  const pod = one.match(/\bPOD:\s*([A-Z0-9-]+)/i)?.[1] || null;
  const reportingFacility = one.match(/\bReporting Facility:\s*([A-Z0-9-]+)/i)?.[1] || null;
  const callsign = one.match(/\bCallsign:\s*([A-Z0-9-]+)/i)?.[1] || null;
  const aircraft = one.match(/\bAircraft:\s*([A-Z0-9-]+)/i)?.[1] || null;
  const title = one.match(/\bTitle:\s*(.+?)\s+(?:Latitude:|PRELIM INFO|DESCRIPTION|--)/i)?.[1]?.trim() || null;
  const remarks = firstMatch(one, [
    /REMARKS\s+(.+?)(?:SKYWATCH INCIDENT REPORT|\s+--\s+1 of 1|$)/i,
    /(PRELIM INFO FROM FAA OPS:.+?)(?:DESCRIPTION|\s+--\s+1 of 1|$)/i,
  ])?.[1]?.trim() || null;
  const latLng = firstMatch(one, [
    /Latitude:\s*(-?\d+(?:\.\d+)?)\s+(?:Longitude|Latitude):\s*(-?\d+(?:\.\d+)?)/i,
  ]);
  return baseRecord('nara_uap', zipFile, assetMap, {
    id: `nara_uap:${sourceCaseId}`,
    record_type: 'skywatch_incident',
    source_case_id: sourceCaseId,
    event_date,
    event_time,
    timezone: timezone_hint,
    datetime_precision: event_time ? 'reported-local' : 'date-only',
    lat: latLng ? Number(latLng[1]) : null,
    lng: latLng ? Number(latLng[2]) : null,
    location_name: reportingFacility || title || pod,
    region: reportingFacility || pod,
    country: 'United States',
    classification_system: 'FAA SkyWatch / NARA UAP release',
    classification_value: primaryCode,
    shape_reported: nuforcShapeFromText(remarks || one),
    description: (remarks || title || one).slice(0, 2200),
    raw_text: one.slice(0, 5000),
    extraction_confidence: remarks ? 'medium' : 'low',
    needs_review: true,
    zip_entry: entryName,
    status,
    pod,
    reporting_facility: reportingFacility,
    callsign,
    aircraft,
    catalog_title: title,
    promotion_status: 'case_candidate_from_pdf_text',
  });
}

async function normalizeChile() {
  const sourceId = 'chile_sefaa';
  const assetMap = manifestAssetByFile(sourceId);
  const files = walk(path.join(RAW_ROOT, sourceId, 'downloads'))
    .filter(f => /\.pdf$/i.test(f) && /CASO/i.test(path.basename(f)));
  const rows = [];
  for (const file of files) {
    try {
      const { text } = await pdfText(file);
      if (text.length < 80) {
        rows.push(baseRecord(sourceId, file, assetMap, { raw_text: text, extraction_confidence: 'low', needs_review: true, ocr_status: 'needs_ocr' }));
      } else rows.push(parseChileCase(text, file, assetMap));
    } catch (err) {
      rows.push(baseRecord(sourceId, file, assetMap, { extraction_error: err.message, needs_review: true }));
    }
  }
  return rows;
}

async function normalizeUk() {
  const sourceId = 'uk_mod';
  const assetMap = manifestAssetByFile(sourceId);
  const files = walk(path.join(RAW_ROOT, sourceId, 'downloads')).filter(f => /\.pdf$/i.test(f));
  const seenFiles = new Set();
  const rows = [];
  for (const file of files) {
    const canonical = path.basename(file).replace(/-\d+(?=\.pdf$)/i, '');
    if (seenFiles.has(canonical)) continue;
    seenFiles.add(canonical);
    try {
      const { text } = await pdfText(file);
      rows.push(...parseUkRows(text, file, assetMap));
    } catch (err) {
      rows.push(baseRecord(sourceId, file, assetMap, { extraction_error: err.message, needs_review: true }));
    }
  }
  return rows;
}

async function normalizeArgentina() {
  const sourceId = 'argentina_ciae';
  const assetMap = manifestAssetByFile(sourceId);
  const files = walk(path.join(RAW_ROOT, sourceId, 'downloads'))
    .filter(f => /\.pdf$/i.test(f) && /informe/i.test(path.basename(f)));
  const rows = [];
  for (const file of files) {
    try {
      const { text } = await pdfText(file);
      rows.push(...parseArgentinaReport(text, file, assetMap));
    } catch (err) {
      rows.push(baseRecord(sourceId, file, assetMap, { extraction_error: err.message, needs_review: true }));
    }
  }
  return rows;
}

async function normalizePdfDocuments(sourceId, country, options = {}) {
  const assetMap = manifestAssetByFile(sourceId);
  const root = path.join(RAW_ROOT, sourceId);
  const files = walk(root).filter(f => /\.pdf$/i.test(f));
  const rows = [];
  for (const file of files) {
    const title = path.basename(file, path.extname(file)).replace(/[_-]+/g, ' ');
    try {
      const { text, pages } = await pdfText(file);
      rows.push(documentRecord(sourceId, file, assetMap, {
        record_type: options.recordType || 'pdf_document',
        title,
        country,
        document_year: yearFromText(path.basename(file)) || yearFromText(text),
        pages,
        ...documentTextFields(text),
        extraction_confidence: text.length > 200 ? 'medium' : 'low',
        needs_review: true,
        promotion_status: options.promotionStatus || 'candidate_source',
        notes: options.notes || 'Document indexed as source corpus; not promoted to case without reliable event fields.',
      }));
    } catch (err) {
      rows.push(documentRecord(sourceId, file, assetMap, {
        record_type: options.recordType || 'pdf_document',
        title,
        country,
        extraction_error: err.message,
        extraction_confidence: 'low',
        needs_review: true,
        promotion_status: 'not_case',
      }));
    }
  }
  return rows;
}

function normalizeHtmlPages(sourceId, country, options = {}) {
  const assetMap = manifestAssetByFile(sourceId);
  const files = walk(path.join(RAW_ROOT, sourceId, 'pages')).filter(f => /\.(?:html?|do|php|bin)$/i.test(f));
  return files.map(file => {
    const html = fs.readFileSync(file, 'utf8');
    const text = htmlToText(html);
    const title = titleFromHtml(html, path.basename(file));
    return documentRecord(sourceId, file, assetMap, {
      record_type: options.recordType || 'source_page',
      title,
      country,
      document_year: yearFromText(title) || yearFromText(text),
      ...documentTextFields(text),
      extraction_confidence: text.length > 250 ? 'medium' : 'low',
      needs_review: true,
      promotion_status: options.promotionStatus || 'candidate_source',
      notes: options.notes || 'HTML page indexed as source corpus; needs structured extraction before case promotion.',
    });
  });
}

async function normalizeDenmark() {
  const sourceId = 'denmark_files';
  const assetMap = manifestAssetByFile(sourceId);
  const rows = [];
  const textFile = path.join(RAW_ROOT, sourceId, 'downloads', 'Danish_20UFO_20files_djvu.txt');
  if (fs.existsSync(textFile)) {
    const raw = fs.readFileSync(textFile, 'utf8');
    const text = htmlToText(raw);
    rows.push(documentRecord(sourceId, textFile, assetMap, {
      record_type: 'full_text_corpus',
      title: 'Danish UFO Files full text',
      country: 'Denmark',
      document_year: yearFromText(text),
      ...documentTextFields(text),
      extraction_confidence: text.length > 5000 ? 'medium' : 'low',
      needs_review: true,
      promotion_status: 'candidate_source',
      notes: 'Archive.org full-text corpus; chunking and Danish field extraction are pending.',
    }));
  }
  const zipFile = path.join(RAW_ROOT, sourceId, 'downloads', 'Danish_20UFO_20files_jp2.zip');
  if (fs.existsSync(zipFile)) {
    const entries = listZipEntries(zipFile);
    rows.push(documentRecord(sourceId, zipFile, assetMap, {
      record_type: 'image_zip_inventory',
      title: 'Danish UFO Files page images',
      country: 'Denmark',
      zip_entries: entries.length,
      zip_total_uncompressed_bytes: entries.reduce((sum, e) => sum + e.length, 0),
      text_sample: entries.slice(0, 20).map(e => e.name).join('\n'),
      extraction_confidence: entries.length ? 'medium' : 'low',
      needs_review: true,
      promotion_status: 'not_case',
      notes: 'Page-image ZIP inventory; not a case dataset.',
    }));
  }
  rows.push(...await normalizePdfDocuments(sourceId, 'Denmark', {
    recordType: 'pdf_document',
    promotionStatus: 'candidate_source',
    notes: 'Danish UFO archive PDF indexed for later case extraction.',
  }));
  return rows;
}

async function normalizeNara() {
  const sourceId = 'nara_uap';
  const assetMap = manifestAssetByFile(sourceId);
  const rows = [];
  const zipFiles = walk(path.join(RAW_ROOT, sourceId, 'downloads')).filter(f => /\.zip$/i.test(f));
  for (const file of zipFiles) {
    const entries = listZipEntries(file);
    rows.push(documentRecord(sourceId, file, assetMap, {
      record_type: 'zip_inventory',
      title: `${path.basename(file)} inventory`,
      country: 'United States',
      zip_entries: entries.length,
      zip_total_uncompressed_bytes: entries.reduce((sum, e) => sum + e.length, 0),
      text_sample: entries.slice(0, 40).map(e => `${e.name} (${e.length} bytes)`).join('\n'),
      extraction_confidence: entries.length ? 'medium' : 'low',
      needs_review: true,
      promotion_status: 'candidate_source',
      notes: 'NARA UAP bulk ZIP indexed by member file; individual PDF extraction can run after selective expansion.',
    }));
    for (const entry of entries) {
      rows.push(documentRecord(sourceId, file, assetMap, {
        id: `${sourceId}:zip-entry:${hash(path.relative(ROOT, file) + ':' + entry.name)}`,
        record_type: 'zip_member',
        title: entry.name,
        country: 'United States',
        zip_entry: entry.name,
        zip_entry_bytes: entry.length,
        zip_entry_modified: `${entry.modified_date} ${entry.modified_time}`,
        file_name: path.basename(entry.name),
        file_ext: path.extname(entry.name).replace('.', '').toLowerCase() || null,
        byte_size: entry.length,
        sha1: null,
        extraction_confidence: 'medium',
        needs_review: true,
        promotion_status: 'candidate_source',
        notes: 'ZIP member inventoried from NARA UAP release; content not extracted yet.',
      }));
    }
    const incidentEntries = entries.filter(entry => /^(.+\/)?237UAP.+\.pdf$/i.test(entry.name));
    for (const entry of incidentEntries) {
      try {
        const extracted = childProcess.spawnSync('unzip', ['-p', file, entry.name], { maxBuffer: 30 * 1024 * 1024 });
        if (extracted.status !== 0 || !extracted.stdout?.length) continue;
        const { text, pages } = await pdfTextFromData(extracted.stdout);
        const incident = parseNaraSkywatchIncident(text, file, entry.name, assetMap);
        if (incident) rows.push({
          ...incident,
          pages,
          zip_entry_bytes: entry.length,
        });
      } catch (err) {
        rows.push(documentRecord(sourceId, file, assetMap, {
          id: `${sourceId}:pdf-extract-error:${hash(path.relative(ROOT, file) + ':' + entry.name)}`,
          record_type: 'pdf_extraction_error',
          title: entry.name,
          country: 'United States',
          zip_entry: entry.name,
          extraction_error: err.message,
          extraction_confidence: 'low',
          needs_review: true,
          promotion_status: 'not_case',
          notes: 'Failed to extract NARA PDF text from ZIP member.',
        }));
      }
    }
  }
  rows.push(...normalizeHtmlPages(sourceId, 'United States', {
    notes: 'NARA UAP collection page indexed for acquisition provenance.',
  }));
  return rows;
}

async function normalizeSweden() {
  const sourceId = 'sweden_afu';
  const rows = [];
  rows.push(...await normalizePdfDocuments(sourceId, 'Sweden', {
    recordType: 'archive_pdf',
    promotionStatus: 'candidate_source',
    notes: 'AFU archival PDF/list indexed as research corpus; not a structured case feed.',
  }));
  const assetMap = manifestAssetByFile(sourceId);
  const sheets = walk(path.join(RAW_ROOT, sourceId, 'downloads')).filter(f => /\.xlsx$/i.test(f));
  for (const file of sheets) {
    rows.push(documentRecord(sourceId, file, assetMap, {
      record_type: 'spreadsheet_inventory',
      title: path.basename(file, path.extname(file)).replace(/[_-]+/g, ' '),
      country: 'Sweden',
      document_year: yearFromText(path.basename(file)),
      extraction_confidence: 'medium',
      needs_review: true,
      promotion_status: 'candidate_source',
      notes: 'Spreadsheet acquired and inventoried; cell-level normalization pending.',
    }));
  }
  rows.push(...normalizeHtmlPages(sourceId, 'Sweden', {
    notes: 'AFU website page indexed for source provenance.',
  }));
  return rows;
}

async function normalizeBrazil() {
  const sourceId = 'brazil_an';
  const rows = [];
  rows.push(...await normalizePdfDocuments(sourceId, 'Brazil', {
    recordType: 'archive_pdf',
    promotionStatus: 'needs_filtering',
    notes: 'Brazil Arquivo Nacional PDF acquired during UFO fund crawl; many files are general archive reports and need filtering before case extraction.',
  }));
  rows.push(...normalizeHtmlPages(sourceId, 'Brazil', {
    promotionStatus: 'needs_filtering',
    notes: 'Brazil Arquivo Nacional page indexed; needs filtering to isolate UFO fund records.',
  }));
  return rows;
}

function normalizeCanada() {
  return normalizeHtmlPages('canada_lac', 'Canada', {
    notes: 'Library and Archives Canada UFO guide page indexed; catalog/result acquisition still pending.',
  }).map(row => {
    if (/UFOs|ovnis/i.test(row.title || '')) {
      return {
        ...row,
        record_type: 'research_guide',
        promotion_status: 'catalog_pending',
        extraction_confidence: 'medium',
        notes: 'Canada UFO research guide indexed; next step is catalog/result harvesting for individual documents.',
      };
    }
    return {
      ...row,
      record_type: 'support_page',
      promotion_status: 'not_case',
      notes: 'Canada support/navigation page retained for provenance, not a case source.',
    };
  });
}

function normalizeSpain() {
  const assetMap = manifestAssetByFile('spain_defensa');
  return normalizeHtmlPages('spain_defensa', 'Spain', {
    notes: 'Spanish Defensa/Biblioteca Virtual page indexed; document viewer extraction still pending.',
  }).flatMap(row => {
    const title = row.title || '';
    if (/Avistamiento de fenómenos extraños/i.test(title)) {
      const cleanTitle = title.replace(/^Biblioteca Virtual de Defensa\s*>\s*Expedientes OVNI\s*>\s*/i, '').trim();
      const afterIn = cleanTitle.match(/en\s+(.+?)(?:\s*:\s*|\s*\.\.\.|$)/i)?.[1] || null;
      const pageRow = {
        ...row,
        record_type: 'case_catalog_page',
        title: cleanTitle,
        location_name_hint: afterIn,
        promotion_status: 'case_stub_pending_document',
        extraction_confidence: 'medium',
        notes: 'Official Spanish UFO catalog page. Treat as a case stub until the BVD document/PDF viewer is extracted.',
      };
      return [pageRow, parseSpainCaseFromPage(pageRow, assetMap)];
    }
    if (/Consulta|Listado de títulos|Search|Title list/i.test(title)) {
      return {
        ...row,
        record_type: 'catalog_index_page',
        promotion_status: 'catalog_pending',
        notes: 'Spanish UFO catalog index/list page; useful for discovering case stubs.',
      };
    }
    return {
      ...row,
      record_type: 'support_page',
      promotion_status: 'not_case',
      notes: 'Spanish BVD support/navigation page retained for provenance, not a case source.',
    };
  });
}

function normalizeNewZealand() {
  return normalizeHtmlPages('new_zealand_nzdf', 'New Zealand', {
    notes: 'New Zealand Defence Force archive page indexed; downloadable case files still pending.',
  });
}

function normalizeAaro() {
  const sourceId = 'aaro';
  const manifestFile = path.join(RAW_ROOT, sourceId, 'manifest.json');
  const rows = [];
  if (fs.existsSync(manifestFile)) {
    const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
    rows.push(documentRecord(sourceId, manifestFile, new Map(), {
      record_type: 'acquisition_status',
      title: 'AARO acquisition status',
      country: 'United States',
      text_sample: JSON.stringify(manifest.errors || [], null, 2).slice(0, 1400),
      extraction_confidence: 'low',
      needs_review: true,
      promotion_status: 'blocked',
      notes: 'Direct crawler access was blocked; acquisition requires a browser/session path or manual official export.',
    }));
  }
  return rows;
}

function writeJsonl(sourceId, rows) {
  ensureDir(OUT_ROOT);
  const file = path.join(OUT_ROOT, `${sourceId}.jsonl`);
  fs.writeFileSync(file, rows.map(r => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : ''));
  return file;
}

function fieldCoverage(rows, fields) {
  const out = {};
  for (const field of fields) {
    out[field] = rows.filter(row => {
      const value = row[field];
      if (Array.isArray(value)) return value.length > 0;
      return value !== null && value !== undefined && value !== '';
    }).length;
  }
  return out;
}

function isCaseRow(row) {
  return ![
    'archive_document',
    'pdf_document',
    'archive_pdf',
    'pdf_extraction_error',
    'source_page',
    'support_page',
    'research_guide',
    'catalog_index_page',
    'case_catalog_page',
    'zip_inventory',
    'zip_member',
    'full_text_corpus',
    'image_zip_inventory',
    'spreadsheet_inventory',
    'acquisition_status',
  ].includes(row.record_type);
}

async function main() {
  ensureDir(OUT_ROOT);
  const normalizers = {
    chile_sefaa: normalizeChile,
    uk_mod: normalizeUk,
    argentina_ciae: normalizeArgentina,
    denmark_files: normalizeDenmark,
    nara_uap: normalizeNara,
    sweden_afu: normalizeSweden,
    brazil_an: normalizeBrazil,
    canada_lac: normalizeCanada,
    spain_defensa: normalizeSpain,
    new_zealand_nzdf: normalizeNewZealand,
    aaro: normalizeAaro,
  };
  const onlyArg = process.argv.find(a => a.startsWith('--only='));
  const selected = onlyArg ? onlyArg.slice('--only='.length).split(',').map(s => s.trim()) : Object.keys(normalizers);
  const summary = [];
  const combined = [];
  const combinedDocuments = [];
  const normalizedFiles = {};
  for (const sourceId of selected) {
    if (!normalizers[sourceId]) throw new Error(`Unknown normalizer: ${sourceId}`);
    console.log(`== ${sourceId} ==`);
    const rows = await normalizers[sourceId]();
    const caseRows = rows.filter(isCaseRow);
    const documentRows = rows.filter(row => !isCaseRow(row));
    combined.push(...caseRows);
    combinedDocuments.push(...documentRows);
    const out = writeJsonl(sourceId, rows);
    normalizedFiles[sourceId] = path.relative(ROOT, out);
    const high = rows.filter(r => r.extraction_confidence === 'high').length;
    const medium = rows.filter(r => r.extraction_confidence === 'medium').length;
    const low = rows.filter(r => r.extraction_confidence === 'low').length;
    const needsReview = rows.filter(r => r.needs_review).length;
    const item = {
      source_id: sourceId,
      records: rows.length,
      high,
      medium,
      low,
      needs_review: needsReview,
      output_kind: caseRows.length && documentRows.length ? 'mixed' : (caseRows.length ? 'cases' : 'documents'),
      case_records: caseRows.length,
      document_records: documentRows.length,
      file: path.relative(ROOT, out),
    };
    summary.push(item);
    console.log(item);
  }
  fs.writeFileSync(path.join(OUT_ROOT, 'normalization-summary.json'), JSON.stringify({
    generated_at: new Date().toISOString(),
    summary,
  }, null, 2));
  if (!onlyArg) {
    const casesFile = path.join(OUT_ROOT, 'acquired_cases.jsonl');
    const documentsFile = path.join(OUT_ROOT, 'acquired_documents.jsonl');
    fs.writeFileSync(casesFile, combined.map(r => JSON.stringify(r)).join('\n') + '\n');
    fs.writeFileSync(documentsFile, combinedDocuments.map(r => JSON.stringify(r)).join('\n') + (combinedDocuments.length ? '\n' : ''));
    fs.writeFileSync(path.join(OUT_ROOT, 'acquired_index.json'), JSON.stringify({
      generated_at: new Date().toISOString(),
      files: {
        acquired_cases: path.relative(ROOT, casesFile),
        acquired_documents: path.relative(ROOT, documentsFile),
        by_source: normalizedFiles,
      },
      totals: {
        cases: combined.length,
        documents: combinedDocuments.length,
        case_sources: [...new Set(combined.map(row => row.source_id))],
        document_sources: [...new Set(combinedDocuments.map(row => row.source_id))],
      },
      case_field_coverage: fieldCoverage(combined, [
        'source_case_id',
        'event_date',
        'event_time',
        'location_name',
        'region',
        'country',
        'classification_value',
        'shape_reported',
        'description',
      ]),
      document_field_coverage: fieldCoverage(combinedDocuments, [
        'title',
        'source_url',
        'country',
        'document_year',
        'text_sample',
        'zip_entry',
        'extraction_error',
      ]),
      review_counts: {
        cases_needing_review: combined.filter(r => r.needs_review).length,
        documents_needing_review: combinedDocuments.filter(r => r.needs_review).length,
      },
      notes: [
        'Cases are normalized event/report candidates. Most acquired official sources still require review before map ingestion.',
        'Documents are source corpus or inventory records, not encounters.',
        'Only established labels are used for shape_reported where text explicitly matches known NUFORC shape categories.',
      ],
    }, null, 2));
  }
  console.table(summary);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
