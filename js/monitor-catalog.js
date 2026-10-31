/* Complete historical catalogue adapters. Publication feeds are a separate corpus.
 * The compact source files remain authoritative; adapters never discard a row
 * because its coordinates/date are incomplete, or turn archive records into
 * editorially curated cases. Browser: UFOMonitorCatalog. Node: require().
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.UFOMonitorCatalog = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const CONTACT_TYPES = Object.freeze({
    NL: { label: 'Luces nocturnas', color: '#ffd166' },
    DD: { label: 'Disco diurno', color: '#8ecae6' },
    RV: { label: 'Radar-Visual', color: '#b388ff' },
    CE1: { label: 'Encuentro cercano I', color: '#80ed99' },
    CE2: { label: 'Encuentro cercano II', color: '#57cc99' },
    CE3: { label: 'Encuentro cercano III', color: '#38a3a5' },
    CE4: { label: 'Encuentro cercano IV', color: '#22577a' },
    MIL: { label: 'Militar / Aviación', color: '#ef476f' },
    USO: { label: 'USO / Transmedio', color: '#118ab2' },
    MASS: { label: 'Avistamiento masivo', color: '#f78c6b' },
    MINE: { label: 'Mis avistamientos', color: '#ffffff' },
  });
  const SHAPES = Object.freeze([
    { code: 'light', label: 'Luz', color: '#ffd166' },
    { code: 'fireball', label: 'Bola de fuego', color: '#ff7b54' },
    { code: 'orb', label: 'Esfera/Orbe', color: '#8ecae6' },
    { code: 'triangle', label: 'Triángulo', color: '#ef476f' },
    { code: 'disk', label: 'Disco', color: '#b388ff' },
    { code: 'cigar', label: 'Cigarro/Cilindro', color: '#57cc99' },
    { code: 'oval', label: 'Óvalo/Lágrima', color: '#f4a8ff' },
    { code: 'geometric', label: 'Geométrico', color: '#80ed99' },
    { code: 'formation', label: 'Formación', color: '#f78c6b' },
    { code: 'other', label: 'Otro/Desc.', color: '#93a1c0' },
  ]);
  const CLASSIFICATIONS = Object.freeze({
    A: { label: 'A · Identificado', color: '#6c8b7f' },
    B: { label: 'B · Prob. identificado', color: '#8ecae6' },
    C: { label: 'C · Sin datos', color: '#ffd166' },
    D: { label: 'D · Inexplicado', color: '#ef476f' },
  });
  const SOURCES = Object.freeze([
    { id: 'ufologist_curated', name: 'Casos seleccionados de UFOlogist', url: '', kind: 'editorial' },
    { id: 'nuforc', name: 'NUFORC', url: 'https://nuforc.org/databank/', kind: 'civil' },
    { id: 'geipan', name: 'GEIPAN / CNES', url: 'https://www.cnes-geipan.fr/fr/recherche/cas', kind: 'official' },
    { id: 'uk_mod', name: 'UK MoD', url: 'https://www.gov.uk/government/publications/ufo-reports-in-the-uk', kind: 'official_archive' },
    { id: 'nara_uap', name: 'NARA / FAA SkyWatch', url: 'https://www.archives.gov/research/topics/uaps', kind: 'official_archive' },
    { id: 'argentina_ciae', name: 'Argentina CIAE', url: 'https://www.argentina.gob.ar/fuerzaaerea/centro-de-identificacion-aeroespacial', kind: 'official' },
    { id: 'chile_sefaa', name: 'Chile SEFAA', url: 'https://sefaa.dgac.gob.cl/', kind: 'official' },
    { id: 'spain_defensa', name: 'España Defensa', url: 'https://bibliotecavirtual.defensa.gob.es/BVMDefensa/exp_ovni/es/consulta/indice_campo.do?campo=idtitulo', kind: 'official_archive' },
    { id: 'local_notebook', name: 'Mis avistamientos', url: '', kind: 'local' },
  ]);
  const sourceById = new Map(SOURCES.map(source => [source.id, source]));
  const shapeByCode = new Map(SHAPES.map(shape => [shape.code, shape]));
  const searchCache = new WeakMap();
  const COUNTRY_ALIASES = {
    us: 'United States', usa: 'United States', eeuu: 'United States', unitedstates: 'United States', estadosunidos: 'United States',
    gb: 'United Kingdom', uk: 'United Kingdom', england: 'United Kingdom', scotland: 'United Kingdom', wales: 'United Kingdom', northernireland: 'United Kingdom', unitedkingdom: 'United Kingdom', reinounido: 'United Kingdom',
    fr: 'France', france: 'France', francia: 'France', es: 'Spain', spain: 'Spain', espana: 'Spain',
    cl: 'Chile', chile: 'Chile', ar: 'Argentina', argentina: 'Argentina', ca: 'Canada', canada: 'Canada',
    br: 'Brazil', brazil: 'Brazil', brasil: 'Brazil', au: 'Australia', australia: 'Australia',
    mx: 'Mexico', mexico: 'Mexico', nz: 'New Zealand', newzealand: 'New Zealand', nuevazelanda: 'New Zealand',
    de: 'Germany', germany: 'Germany', alemania: 'Germany', it: 'Italy', italy: 'Italy', italia: 'Italy',
    be: 'Belgium', belgium: 'Belgium', belgica: 'Belgium', dk: 'Denmark', denmark: 'Denmark', dinamarca: 'Denmark',
    se: 'Sweden', sweden: 'Sweden', suecia: 'Sweden', no: 'Norway', norway: 'Norway', noruega: 'Norway',
    ru: 'Russia', russia: 'Russia', rusia: 'Russia',
  };
  const US_STATES = new Set('al ak az ar ca co ct de fl ga hi ia id il in ks ky la ma md me mi mn mo ms mt nc nd ne nh nj nm nv ny oh ok or pa ri sc sd tn tx ut va vt wa wi wv wy dc'.split(' '));
  // Preserve the original atlas' analytical categories separately from the
  // source's classification/type. These are heuristics, not source assertions.
  const ENCOUNTER_INFERENCE_NOTE = 'Tipo inferido automáticamente con las reglas del catálogo original: texto, hora y proximidad a instalaciones militares. No es una clasificación atribuida por la fuente.';
  const MILITARY_SITES = [
    ['Wright-Patterson AFB', 39.82, -84.05], ['Nellis AFB / Area 51 corridor', 36.24, -115.03],
    ['Edwards AFB', 34.91, -117.88], ['Vandenberg SFB', 34.74, -120.57],
    ['Travis AFB', 38.27, -121.94], ['NAS Miramar', 32.87, -117.14],
    ['Naval Base San Diego', 32.68, -117.12], ['Naval Station Norfolk', 36.95, -76.33],
    ['Eglin AFB', 30.48, -86.53], ['NAS Pensacola', 30.35, -87.32],
    ['Patrick SFB / Cape Canaveral', 28.23, -80.61], ['Malmstrom AFB', 47.50, -111.19],
    ['Minot AFB', 48.42, -101.36], ['Loring AFB', 46.95, -67.88],
    ['Fort Liberty', 35.14, -79.01], ['Fort Cavazos', 31.13, -97.78],
    ['Holloman AFB / White Sands', 32.85, -106.10], ['Kirtland AFB', 35.05, -106.61],
    ['Dugway Proving Ground', 40.18, -112.92], ['Cheyenne Mountain / Peterson', 38.74, -104.85],
    ['Joint Base Andrews', 38.81, -76.87], ['NAS Patuxent River', 38.29, -76.41],
    ['RAF Lakenheath', 52.41, 0.56], ['RAF Mildenhall', 52.36, 0.49],
    ['RAF Bentwaters', 52.13, 1.43], ['RAF Fylingdales', 54.36, -0.67],
    ['RAF Lossiemouth', 57.72, -3.32], ['RAF Brize Norton', 51.75, -1.58],
    ['RAF Waddington', 53.17, -0.52], ['RAF Coningsby', 53.09, -0.18],
    ['HMNB Clyde / Faslane', 56.07, -4.82], ['Base Aerea Torrejon', 40.49, -3.45],
    ['Base Aerea Zaragoza', 41.67, -1.04], ['Base Aerea Moron', 37.17, -5.62],
    ['Naval Station Rota', 36.62, -6.35], ['Base Aerea Gando', 27.93, -15.39],
    ['Base Aerea Los Llanos', 38.95, -1.86], ['Istres Air Base', 43.52, 4.92],
    ['Avord Air Base', 47.05, 2.63], ['Cazaux Air Base', 44.53, -1.13],
    ['Orange-Caritat Air Base', 44.14, 4.87], ['Brest Naval Base', 48.39, -4.49],
    ['Toulon Naval Base', 43.12, 5.93], ['Cerro Moreno Air Base', -23.44, -70.44],
    ['El Bosque Air Base', -33.56, -70.69], ['Quintero Air Base', -32.78, -71.52],
    ['Punta Arenas / Chabunco', -53.00, -70.85], ['El Palomar Air Base', -34.61, -58.61],
    ['Moreno Air Base', -34.56, -58.79], ['Tandil Air Base', -37.23, -59.23],
    ['Rio Gallegos Air Base', -51.61, -69.31], ['Bahia Blanca / Comandante Espora', -38.72, -62.17],
    ['Mar del Plata Naval Air Base', -37.93, -57.57], ['La Joya Air Base', -16.73, -71.87],
  ];

  function legacyEncounterRecord(item) {
    if (item.mass || item.geipan || item.official || !item.sourceId) return item;
    const common = { lat: item.location?.lat, lng: item.location?.lng, h: item.hour ?? -1, type: item.type };
    if (item.sourceId === 'nuforc') return { ...common, mass: true, loc: item.location?.label || '', s: SHAPES.findIndex(shape => shape.code === item.shape) };
    if (item.sourceId === 'geipan') return { ...common, geipan: true, zone: item.location?.label || '', resume: item.summary };
    if (item.editorialStatus === 'official-record') return { ...common, official: true, title: item.title, loc: item.location?.label || '', country: item.country, source: item.sourceName, summary: item.summary, cls: item.classification, system: item.system };
    return { ...item, lat: common.lat, lng: common.lng, name: item.name || item.title, loc: item.loc || item.location?.label || '' };
  }
  function encounterPlainText(value) { return String(value || '').toLowerCase().replace(/&[^;\s]+;/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  function encounterContext(d) {
    if (d.official) return [d.title, d.loc, d.country, d.source, d.summary, d.cls, d.system].map(encounterPlainText).join(' ');
    if (d.geipan) return [d.zone, d.resume, 'france'].map(encounterPlainText).join(' ');
    if (d.mass) return [d.loc].map(encounterPlainText).join(' ');
    return [d.name || d.title, d.loc || d.location?.label, d.country, d.summary, d.type].map(encounterPlainText).join(' ');
  }
  function nearMilitarySite(d) {
    if (!Number.isFinite(d?.lat) || !Number.isFinite(d?.lng)) return false;
    const toRad = value => value * Math.PI / 180;
    for (const [, lat, lng] of MILITARY_SITES) {
      const s1 = Math.sin(toRad(lat - d.lat) / 2), s2 = Math.sin(toRad(lng - d.lng) / 2);
      const a = s1 * s1 + Math.cos(toRad(d.lat)) * Math.cos(toRad(lat)) * s2 * s2;
      if (6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) <= 60) return true;
    }
    return false;
  }
  function encounterType(item) {
    if (!item) return 'DD';
    const d = legacyEncounterRecord(item);
    if (d.type && CONTACT_TYPES[d.type] && d.type !== 'MINE') return d.type;
    const text = encounterContext(d);
    if (/\b(occupant|entity|humanoid|entidad|ocupante|silhouette|etre|personnage)\b/.test(text)) return 'CE3';
    if (/\b(abduction|abduccion|missing time|temps manquant|enlevement)\b/.test(text)) return 'CE4';
    if (/\b(trace|traces|burn|brul|landing|atterr|soil|sol|physical|electromagnetic|interference|huella|quemadura|efecto)\b/.test(text)) return 'CE2';
    if (/\b(radar|radar-visual|radar visual)\b/.test(text)) return 'RV';
    const military = d.type === 'MIL' || /\b(afb|raf|nas|naval|navy|air force|army|military|militar|base aerea|base naval|fuerza aerea|aeronaval|mod|norad|silo|missile|radar|pentagon|defen[cs]e|defensa)\b/.test(text) || nearMilitarySite(d);
    if (military) return 'MIL';
    const water = /\b(ocean|oceano|atlantic|atlantico|pacific|pacifico|sea|mar|gulf|golfo|bay|bahia|baya|lake|lago|river|rio|water|agua|canal|channel|strait|estuary|offshore|caribbean|caribe|mediterranean|mediterraneo|cantabrico)\b/.test(text) || d.type === 'USO';
    if (water && /\b(underwater|submerged|submarine|sous-marin|submerg|uso|mar|sea|ocean|oceano)\b/.test(text)) return 'USO';
    if (d.geipan && /\b(lumiere|lumineux|feu|point lumineux|ovni lumineux)\b/.test(text)) return 'NL';
    if (Number.isFinite(d.h)) {
      if (d.h >= 20 || (d.h >= 0 && d.h <= 6)) return 'NL';
      if (d.h >= 7 && d.h <= 19) return 'DD';
    }
    if (d.mass && [0, 1, 2, 8].includes(d.s)) return 'NL';
    return 'DD';
  }
  function encounterFields(record) {
    const inferred = !(record.type && CONTACT_TYPES[record.type] && record.type !== 'MINE');
    const type = encounterType(record);
    return { encounterType: type, encounterLabel: CONTACT_TYPES[type]?.label || type, encounterInferred: inferred, encounterNote: inferred ? ENCOUNTER_INFERENCE_NOTE : '' };
  }

  function fold(value) { return String(value == null ? '' : value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
  function normalizeCountry(value) {
    const original = String(value || '').trim();
    return COUNTRY_ALIASES[fold(original).replace(/[^a-z0-9]/g, '')] || original || 'Other';
  }
  function countryFromNUFORC(value) {
    const parts = fold(value).split(',').map(part => part.trim().replace(/[^a-z0-9]/g, '')).filter(Boolean);
    const tail = parts[parts.length - 1] || '';
    if (COUNTRY_ALIASES[tail]) return COUNTRY_ALIASES[tail];
    if (US_STATES.has(tail) || US_STATES.has(parts[parts.length - 2])) return 'United States';
    return 'Other';
  }
  function safeURL(value) {
    if (typeof value !== 'string' || /[\u0000-\u001f\u007f]/.test(value)) return null;
    try {
      const url = new URL(value);
      return ['http:', 'https:'].includes(url.protocol) && url.hostname && !url.username && !url.password ? url.href : null;
    } catch (_) { return null; }
  }
  function dateFromInt(value) {
    const s = String(value);
    if (!/^\d{8}$/.test(s)) return null;
    const iso = s.slice(0, 4) + '-' + s.slice(4, 6) + '-' + s.slice(6, 8);
    const ms = Date.parse(iso + 'T00:00:00Z');
    return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === iso ? iso : null;
  }
  function validDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    return dateFromInt(value.replace(/-/g, ''));
  }
  function location(lat, lng, label, precision) {
    if (lat === null || lng === null || lat === undefined || lng === undefined || String(lat).trim() === '' || String(lng).trim() === '') return null;
    const a = Number(lat), b = Number(lng);
    return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a) <= 90 && Math.abs(b) <= 180
      ? { lat: a, lng: b, label: String(label || ''), precision: precision || 'approximate' } : null;
  }
  function geoQuality(value) {
    const precision = typeof value === 'string' ? value : value?.geoPrecision || value?.location?.precision;
    if (precision === 'reported') return 'reported';
    if (['locality', 'city', 'airport', 'facility'].includes(precision)) return 'local';
    if (['department', 'county', 'province', 'region', 'country-region', 'island', 'area'].includes(precision)) return 'regional';
    return 'broad';
  }
  function base(id, sourceId, title, date, loc, status) {
    const source = sourceById.get(sourceId);
    return {
      id, legacyId: id, kind: 'case', category: 'uap', title, name: title,
      date, observedAt: date, publishedAt: null,
      year: date ? Number(date.slice(0, 4)) : null,
      location: loc, country: '', summary: '', type: '', contactType: '', typeInferred: false,
      shape: '', shapeLabel: '', classification: '', classificationLabel: '',
      sourceId, sourceName: source?.name || sourceId,
      sources: source?.url ? [{ name: source.name, url: source.url, kind: source.kind === 'civil' ? 'reference' : 'primary' }] : [],
      editorialStatus: status, datetimePrecision: 'date-only', media: [],
    };
  }
  function rowsOf(input) { return Array.isArray(input) ? input : Array.isArray(input?.rows) ? input.rows : []; }
  function uniqueLegacyId(id, seen) {
    const count = (seen.get(id) || 0) + 1;
    seen.set(id, count);
    return count === 1 ? id : id + ':duplicate:' + count;
  }

  function normalizeNUFORC(input) {
    const shapeCodes = Array.isArray(input?.shapes) ? input.shapes : SHAPES.map(shape => shape.code);
    const seen = new Map();
    return rowsOf(input).filter(Array.isArray).map((row, index) => {
      const [d, h, lat, lng, s, place] = row;
      const date = dateFromInt(d), legacyId = `nuforc:${d}:${h}:${lat}:${lng}:${s}`;
      const shapeCode = shapeCodes[s] || 'other', shape = shapeByCode.get(shapeCode) || SHAPES[9];
      const item = base(uniqueLegacyId(legacyId, seen), 'nuforc', 'Reporte NUFORC' + (place ? ' · ' + place : ''), date, location(lat, lng, place, 'locality'), 'citizen-report');
      return { ...item, ...encounterFields({ mass: true, d, h, lat, lng, s, loc: place }), legacyId, country: countryFromNUFORC(place), shape: shapeCode, shapeLabel: shape.label, color: shape.color,
        hour: Number.isInteger(h) && h >= 0 && h <= 23 ? h : null,
        time: Number.isInteger(h) && h >= 0 && h <= 23 ? String(h).padStart(2, '0') + ':00' : null,
        datetimePrecision: Number.isInteger(h) && h >= 0 && h <= 23 ? 'hour-only' : 'date-only',
        geoPrecision: 'locality', geoApprox: true, geoQuality: 'local',
        sourceCaseId: null, originalDate: d, rawIndex: index,
        provenance: { dataset: 'data/nuforc.json', row: index, sourceUrl: SOURCES[1].url, linkScope: 'catalog' },
        contentNote: 'Metadatos de un reporte ciudadano. La ubicación está geocodificada a nivel de localidad; el testimonio completo se consulta por fecha y lugar en NUFORC.',
      };
    });
  }

  function normalizeGEIPAN(input) {
    const codes = Array.isArray(input?.classes) ? input.classes : ['A', 'B', 'C', 'D'];
    const seen = new Map();
    return rowsOf(input).filter(Array.isArray).map((row, index) => {
      const [d, lat, lng, ci, place, summary] = row;
      const classification = codes[ci] || '', classificationMeta = CLASSIFICATIONS[classification];
      const date = dateFromInt(d), legacyId = `geipan:${d}:${lat}:${lng}:${ci}`;
      return { ...base(uniqueLegacyId(legacyId, seen), 'geipan', 'Caso GEIPAN' + (place ? ' · ' + place : ''), date, location(lat, lng, place, 'department'), 'official-record'),
        ...encounterFields({ geipan: true, d, lat, lng, ci, zone: place, resume: summary }), legacyId, country: 'France', summary: String(summary || ''), classification,
        classificationLabel: classificationMeta?.label || classification, classificationColor: classificationMeta?.color || '#93a1c0',
        officialClassification: classification, cls: classification, system: 'GEIPAN', classificationSystem: 'GEIPAN', color: '#93a1c0',
        geoPrecision: 'department', geoApprox: true, geoQuality: 'regional',
        sourceCaseId: null, originalDate: d, rawIndex: index,
        provenance: { dataset: 'data/geipan.json', row: index, sourceUrl: SOURCES[2].url, linkScope: 'catalog' },
        contentNote: 'Clasificación oficial GEIPAN. La posición representa el departamento, no el punto exacto de observación.',
      };
    });
  }

  function normalizeOfficial(input) {
    const seen = new Map();
    return rowsOf(input).filter(row => row && typeof row === 'object' && !Array.isArray(row)).map((row, index) => {
      const sourceId = String(row.sid || row.sourceId || 'official_archive');
      const sourceName = String(row.source || sourceById.get(sourceId)?.name || sourceId);
      const date = validDate(row.date) || dateFromInt(row.d);
      const id = String(row.id || `official:${sourceId}:${row.date || row.year}:${row.lat}:${row.lng}:${row.title || ''}`);
      const title = String(row.title || row.name || sourceName), precision = String(row.geoPrecision || 'approximate');
      const item = base(uniqueLegacyId(id, seen), sourceId, title, date, location(row.lat, row.lng, row.loc || row.country, precision), 'official-record');
      const sourceURL = safeURL(row.sourceUrl), shape = Number.isInteger(row.s) && row.s >= 0 ? SHAPES[row.s] : null;
      const classification = String(row.cls || ''), type = String(row.type || '');
      return { ...item, ...encounterFields({ ...row, official: true }), legacyId: id, sourceName, sourceCaseId: row.sourceCaseId ?? null,
        summary: String(row.summary || ''), country: String(row.country || ''),
        year: Number.isFinite(Number(row.year)) && row.year !== null ? Number(row.year) : item.year,
        type, contactType: type, typeInferred: false,
        shape: shape?.code || '', shapeLabel: shape?.label || '', shapeReported: String(row.shape || ''), color: shape?.color || '#93a1c0',
        classification, classificationLabel: classification, officialClassification: classification, cls: classification,
        system: String(row.system || ''), classificationSystem: String(row.system || ''), recordType: String(row.recordType || ''),
        needsReview: Boolean(row.needsReview), geoPrecision: precision, geoLabel: String(row.geoLabel || precision),
        geoApprox: row.geoApprox !== false, geoQuality: geoQuality(precision),
        hour: Number.isInteger(row.h) && row.h >= 0 && row.h <= 23 ? row.h : null,
        time: row.time || null, datetimePrecision: row.time ? 'reported-local' : 'date-only',
        sources: sourceURL ? [{ name: sourceName, url: sourceURL, kind: 'primary' }] : item.sources,
        sourceUrl: sourceURL, sourceFile: String(row.sourceFile || ''), originalDate: row.d ?? row.date ?? null, rawIndex: index,
        provenance: { dataset: 'data/official-cases.json', row: index, sourceUrl: sourceURL, sourceFile: String(row.sourceFile || ''), linkScope: sourceURL ? 'record' : 'catalog' },
      };
    });
  }

  // Merge only identical record IDs, never nearby events or rows sharing a date.
  // NUFORC duplicate marker keys receive separate IDs in the adapter above.
  function mergeCatalog(...groups) {
    const seen = new Set(), result = [];
    groups.forEach(group => (Array.isArray(group) ? group : []).forEach(row => {
      if (!row || !row.id || seen.has(String(row.id))) return;
      seen.add(String(row.id));
      const sourceId = row.sourceId || (row.type === 'MINE' ? 'local_notebook' : 'ufologist_curated');
      result.push({ ...row, ...(row.encounterType ? {} : encounterFields(row)), sourceId, sourceName: row.sourceName || sourceById.get(sourceId)?.name || sourceId,
        typeLabel: CONTACT_TYPES[row.type]?.label || row.type || '',
        color: row.color || CONTACT_TYPES[row.type]?.color || '#24c8e9',
        countryKey: normalizeCountry(row.country),
        year: Number.isFinite(row.year) ? row.year : /^\d{4}/.test(row.date || '') ? Number(row.date.slice(0, 4)) : null,
        geoQuality: row.geoQuality || geoQuality(row),
      });
    }));
    return result;
  }

  function searchText(item) {
    if (!searchCache.has(item)) searchCache.set(item, fold([
      item.id, item.title, item.name, item.summary, item.contentNote,
      item.country, item.countryKey, item.location?.label, item.sourceId, item.sourceName,
      item.type, item.typeLabel, CONTACT_TYPES[item.type]?.label, item.encounterType, item.encounterLabel,
      item.shape, item.shapeLabel, item.shapeReported, item.classification, item.classificationLabel,
      item.date, item.year, item.sourceCaseId, item.system,
      ...(Array.isArray(item.sources) ? item.sources.map(source => source.name) : []),
    ].filter(value => value !== null && value !== undefined).join(' ')));
    return searchCache.get(item);
  }
  function matches(item, query) {
    const tokens = Array.isArray(query) ? query : fold(query).trim().split(/\s+/).filter(Boolean);
    return !tokens.length || tokens.every(token => searchText(item).includes(token));
  }
  function selection(value) {
    return value == null || value === 'all' ? null : new Set(typeof value === 'string' ? [value] : value);
  }
  function filterCatalog(rows, options) {
    const opts = options || {}, tokens = fold(opts.query).trim().split(/\s+/).filter(Boolean);
    const sources = selection(opts.sourceIds), types = selection(opts.types), shapes = selection(opts.shapes);
    const classes = selection(opts.classifications), countries = selection(opts.countries), geos = selection(opts.geoQualities);
    const from = opts.yearFrom === '' || opts.yearFrom == null ? null : Number(opts.yearFrom);
    const to = opts.yearTo === '' || opts.yearTo == null ? null : Number(opts.yearTo);
    return (Array.isArray(rows) ? rows : []).filter(item => item
      && (!sources || sources.has(item.sourceId)) && (!types || types.has(item.encounterType || item.type))
      && (!shapes || shapes.has(item.shape)) && (!classes || classes.has(item.classification))
      && (!countries || countries.has(item.countryKey || normalizeCountry(item.country)))
      && (!geos || geos.has(item.geoQuality || geoQuality(item)))
      && (!Number.isFinite(from) || (Number.isFinite(item.year) && item.year >= from))
      && (!Number.isFinite(to) || (Number.isFinite(item.year) && item.year <= to))
      && matches(item, tokens));
  }
  function createIndex(rows) {
    const items = Array.isArray(rows) ? rows : [];
    return { rows: items, byId: new Map(items.map(item => [item.id, item])),
      filter: options => filterCatalog(items, options),
      counts: items.reduce((counts, item) => { counts[item.sourceId] = (counts[item.sourceId] || 0) + 1; return counts; }, {}),
    };
  }

  return { SOURCES, sources: SOURCES, CONTACT_TYPES, SHAPES, CLASSIFICATIONS,
    normalizeNUFORC, normalizeGEIPAN, normalizeOfficial, mergeCatalog, filterCatalog, matches, createIndex,
    normalizeCountry, countryFromNUFORC, geoQuality, dateFromInt, encounterType, ENCOUNTER_INFERENCE_NOTE };
}));
