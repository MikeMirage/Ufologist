// ============================================================
// UFOlogist — application core v2
// Globe (globe.gl) · NUFORC mass DB (80k) · heatmap · timeline
// player · shape/time filters · stats · hotspots · journal ·
// expedition tour · permalinks · export
// ============================================================

(function () {
'use strict';

const $ = id => document.getElementById(id);
const LANG_KEY = 'ufologist-lang';
const AUDIO_KEY = 'ufologist-ambient-audio';
const AUDIO_TRACKS = [
  'assets/audio/ufologist-ambient-01.mp3',
  'assets/audio/ufologist-ambient-02.mp3',
];
const I18N = {
  es: {
    metaTitle: 'UFOlogist — Atlas global del fenómeno UAP',
    metaDescription: 'Atlas interactivo de avistamientos OVNI/UAP documentados: globo 3D, 80.000+ reportes, mapa de calor, línea de tiempo y fuentes originales.',
    brandTag: 'Atlas global del fenómeno UAP · 80.000+ reportes',
    searchPlaceholder: 'Buscar caso o lugar...',
    loading: 'Inicializando atlas orbital...',
    landingTag: 'the UFO encounter atlas',
    landingSteps: ['Cargando encuentros...', 'Investigando datos desclasificados...', 'Enlazando con fuentes online...', 'Calibrando el atlas orbital...'],
    landingReady: 'Atlas listo.',
    indexedReports: 'reportes indexados',
    enterAtlas: 'Entrar al atlas ->',
    navKnowledge: 'Conocimiento',
    navStats: 'Análisis',
    navReport: 'Reportar',
    navInfo: 'Info',
    navTour: 'Expedición',
    titleKnowledge: 'Centro de conocimiento',
    titleStats: 'Panel de análisis y tendencias',
    titleReport: 'Reportar o registrar un avistamiento propio',
    titleInfo: 'Información sobre UFOlogist',
    titleTour: 'Tour guiado por los casos esenciales',
    ambientOn: 'Encender ambiente',
    ambientOff: 'Apagar ambiente',
    ambientEnabled: 'Ambiente activado',
    ambientDisabled: 'Ambiente apagado',
    ambientWaiting: 'Pulsa de nuevo si el navegador bloquea el audio',
    ambientLabel: 'Ambiente',
    filters: 'Filtros',
    collapse: 'Plegar',
    expand: 'Mostrar filtros',
    layers: 'Capas',
    both: 'Ambas',
    heat: 'Calor',
    cases: 'Casos',
    hotspots: 'Hotspots legendarios',
    massDb: 'Base masiva NUFORC',
    loadingShort: 'cargando...',
    nuforcSwitch: '80.332 reportes geolocalizados (1906-2014)',
    geipanDb: 'Base GEIPAN · Francia',
    geipanSwitch: 'Casos oficiales del CNES (1937-2018)',
    timeBand: 'Franja horaria',
    timeFilterTitle: 'Filtra los reportes por hora del avistamiento',
    day: 'Día',
    night: 'Noche',
    curatedType: 'Tipo de caso curado',
    all: 'todos',
    none: 'ninguno',
    minCredibility: 'Credibilidad mínima',
    credibilityHint: '5★ = radar + testigos militares + documentación oficial',
    selection: 'Selección',
    exportSelection: 'Exportar selección filtrada',
    permalink: 'Enlace',
    copyFiltersLink: 'Copiar enlace con los filtros actuales',
    statsTitle: 'Análisis de la selección',
    prev: 'Anterior',
    pause: 'Pausa',
    resume: 'Seguir',
    next: 'Siguiente',
    playTimeline: 'Reproducir línea de tiempo (espacio)',
    cumulative: 'Acumulado',
    cumulativeTitle: 'Acumula los casos desde el inicio',
    windowMode: 'Ventana 10a',
    windowModeTitle: 'Ventana móvil de 10 años',
    speed: 'Velocidad',
    sightingTitle: 'Registrar avistamiento',
    sightingHint: 'Se guarda solo en tu navegador (cuaderno de campo local).',
    fieldTitle: 'Título *',
    fieldDate: 'Fecha *',
    fieldTime: 'Hora',
    latitude: 'Latitud',
    longitude: 'Longitud',
    observedShape: 'Forma observada',
    notes: 'Notas',
    saveJournal: 'Guardar en mi cuaderno',
    sightingNamePlaceholder: 'Luz pulsante sobre la sierra',
    notesPlaceholder: 'Duración, dirección, color, testigos, condiciones...',
    pickHint: 'Haz clic en el globo en el lugar exacto del avistamiento',
    cancel: 'cancelar',
    modalTabs: ['Clasificación', 'Anatomía', 'Disclosure USA', 'Glosario', 'Metodología', 'Reportar'],
    appInfoTitle: 'Sobre UFOlogist',
    appInfoIntro: '<b>UFOlogist</b> es un atlas interactivo independiente para explorar el fenómeno UAP con contexto, fuentes y una mirada crítica. La intención no es empujar una conclusión cerrada, sino ordenar el material, separar evidencia de ruido y hacer visible dónde están los patrones.',
    appInfoAuthorTitle: 'Mensaje del autor',
    appInfoAuthor: 'He construido esta herramienta para curiosos exigentes: personas que quieren mirar los casos sin cinismo automático, pero también sin perder el criterio. Si algo te intriga, abre las fuentes, compara versiones y mantén la pregunta viva.',
    appInfoCopyrightTitle: 'Autoría y copyright',
    appInfoCopyright: 'Creado por <b>Miquel Gelabert</b>. © Miquel Gelabert 2026 · UFOlogist.',
    appInfoNote: 'Proyecto divulgativo e independiente. No afiliado a NUFORC, GEIPAN, CNES, AARO ni a ningún organismo oficial. El código se publica bajo licencia MIT. Los datos y fuentes enlazadas pertenecen a sus respectivos titulares y se usan con fines de divulgación e investigación.',
    mobileMenu: 'Menú',
    mobileExport: 'Exportar selección',
    mobileHelp: 'Pulsa un punto del globo para abrir su ficha. Arrastra el globo para girarlo.',
    mobileGlobe: 'Globo',
    mobileFilters: 'Filtros',
    mobileTime: 'Tiempo',
    mobileData: 'Datos',
    mobileMore: 'Más',
    curated: 'curados',
    heatSuffix: 'calor',
    narrowHint: 'acota a <=600 para ver puntos',
    noResults: 'Sin resultados',
    myNotebook: 'mi cuaderno',
    satellite: 'ver en satélite',
    date: 'Fecha',
    origin: 'Origen',
    evidence: 'Evidencia',
    coordinates: 'Coordenadas',
    classification: 'Clasificación',
    localTime: 'Hora local',
    shape: 'Forma',
    originalSources: 'Fuentes originales',
    source: 'Fuente',
    officialSource: 'Fuente oficial',
    copyLink: 'Copiar enlace',
    delete: 'Eliminar',
    noNotes: 'Sin notas.',
    wikipediaImage: 'Imagen de Wikipedia',
    article: 'artículo',
    searchVideos: 'Buscar vídeos',
    searchImages: 'Buscar imágenes',
    nuforcReport: 'Reporte NUFORC',
    geocodedLocation: 'ubicación geocodificada',
    nuforcSummary: 'Reporte ciudadano del National UFO Reporting Center, geocodificado a nivel de localidad. Para leer el testimonio completo, busca por fecha y lugar en la base de datos de NUFORC.',
    nuforcDatabank: 'NUFORC Databank (buscar {date})',
    geipanCase: 'Caso GEIPAN (CNES)',
    france: 'Francia',
    departmentLocation: 'ubicación a nivel de departamento',
    geipanSummary: 'Caso del archivo oficial del GEIPAN (agencia espacial francesa CNES).',
    kpiCurated: 'Casos curados',
    total: 'Total',
    byDecade: 'Por década',
    geipanByClass: 'GEIPAN por clasificación (Francia)',
    byShape: 'Por forma reportada (NUFORC)',
    dayVsNight: 'Día vs Noche',
    daytime: 'Diurnos (7-19h)',
    nighttime: 'Nocturnos (20-6h)',
    unknownTime: 'Hora desconocida',
    topLocations: 'Top 10 localidades',
    massStatsHint: 'Activa la base masiva NUFORC para ver análisis de formas, franjas horarias y localidades.',
    statsBias: 'Sesgo conocido: NUFORC es una base estadounidense y el volumen crece con la llegada de internet (década de 2000). Las tendencias geográficas son más fiables que las comparaciones entre épocas lejanas.',
    exportedJson: '{count} registros exportados a JSON',
    exportedCsv: '{count} registros exportados a CSV',
    exportEmpty: 'Nada que exportar con los filtros actuales',
    filtersCopied: 'Enlace con filtros copiado',
    linkCopied: 'Enlace copiado al portapapeles',
    registerMode: 'Modo registro: haz clic en el lugar del avistamiento',
    missingSighting: 'Faltan título, fecha o coordenadas',
    registeredInNotebook: 'Registrado en mi cuaderno',
    deletedSighting: 'Avistamiento eliminado de tu cuaderno',
    savedSighting: 'Avistamiento guardado en tu cuaderno de campo',
    massLoadError: 'No se pudo cargar la base masiva NUFORC (data/nuforc.js)',
    unavailable: 'no disponible',
    realCase: 'ver caso real',
    anatomyTitle: 'Anatomía de un encuentro',
    anatomyIntro: 'Qué distingue a cada tipo de avistamiento, de una luz lejana a un presunto encuentro con ocupantes. Las escenas son ilustrativas; pulsa <b>"ver caso real"</b> para volar a un ejemplo documentado en el globo.',
    classificationTitle: 'Clasificación de casos',
    classificationIntro: 'UFOlogist usa la clasificación del astrónomo <b>J. Allen Hynek</b> (asesor científico del Proyecto Blue Book), extendida con categorías modernas surgidas de la era UAP (militar, transmedio, masivo).',
    reportedShapesTitle: 'Formas reportadas (base NUFORC)',
    reportedShapesIntro: 'Los 80.332 reportes ciudadanos se agrupan en 10 morfologías. La "luz" nocturna domina el registro — coherente con la categoría NL de Hynek y con la dificultad de estimar forma de noche.',
    disclosureTitle: 'Cronología del disclosure en EE.UU.',
    disclosureIntro: 'Ochenta años de investigación oficial, negación pública y desclasificación gradual: del memo Twining a las audiencias del Congreso. Los rombos ◆ de la línea de tiempo marcan estos hitos y las grandes oleadas.',
    glossaryTitle: 'Glosario esencial',
    methodologyTitle: 'Metodología y escala de evidencia',
    dataLayersTitle: 'Las dos capas de datos',
    curatedLayer: '<b>Casos curados (~100):</b> selección editorial de los casos mejor documentados de la historia, cada uno con fuentes primarias verificables.',
    massLayer: '<b>Base masiva (80.332):</b> reportes ciudadanos del National UFO Reporting Center (1906–2014), geocodificados a nivel de localidad. Sin filtrar: contiene ruido, errores de identificación y sesgos (país, era de internet). Su valor es estadístico — tendencias, formas, franjas horarias y geografía — no probatorio caso a caso.',
    reportTitle: 'Archivos oficiales y cómo reportar',
    reportIntro: '¿Has visto algo? Usa el botón <b>➕ Registrar</b> para anotarlo en tu cuaderno de campo local con coordenadas precisas, y repórtalo después a un organismo: hora exacta, duración, dirección, condiciones, fotos sin zoom digital. Antes, descarta lo prosaico: Starlink, ISS, Venus, bengalas, drones y globos explican la gran mayoría de casos.',
  },
  en: {
    metaTitle: 'UFOlogist — Global Atlas of the UAP Phenomenon',
    metaDescription: 'Interactive atlas of documented UFO/UAP sightings: 3D globe, 80,000+ reports, heatmap, timeline, and original sources.',
    brandTag: 'Global atlas of the UAP phenomenon · 80,000+ reports',
    searchPlaceholder: 'Search case or place...',
    loading: 'Initializing orbital atlas...',
    landingTag: 'the UFO encounter atlas',
    landingSteps: ['Loading encounters...', 'Checking declassified data...', 'Linking online sources...', 'Calibrating the orbital atlas...'],
    landingReady: 'Atlas ready.',
    indexedReports: 'indexed reports',
    enterAtlas: 'Enter the atlas ->',
    navKnowledge: 'Knowledge',
    navStats: 'Analysis',
    navReport: 'Report',
    navInfo: 'Info',
    navTour: 'Expedition',
    titleKnowledge: 'Knowledge center',
    titleStats: 'Analysis and trends panel',
    titleReport: 'Report or register your own sighting',
    titleInfo: 'Information about UFOlogist',
    titleTour: 'Guided tour through essential cases',
    ambientOn: 'Turn ambient sound on',
    ambientOff: 'Turn ambient sound off',
    ambientEnabled: 'Ambient sound on',
    ambientDisabled: 'Ambient sound off',
    ambientWaiting: 'Tap again if the browser blocks audio',
    ambientLabel: 'Ambient',
    filters: 'Filters',
    collapse: 'Collapse',
    expand: 'Show filters',
    layers: 'Layers',
    both: 'Both',
    heat: 'Heat',
    cases: 'Cases',
    hotspots: 'Legendary hotspots',
    massDb: 'NUFORC mass database',
    loadingShort: 'loading...',
    nuforcSwitch: '80,332 geolocated reports (1906-2014)',
    geipanDb: 'GEIPAN database · France',
    geipanSwitch: 'Official CNES cases (1937-2018)',
    timeBand: 'Time of day',
    timeFilterTitle: 'Filter reports by sighting time',
    day: 'Day',
    night: 'Night',
    curatedType: 'Curated case type',
    all: 'all',
    none: 'none',
    minCredibility: 'Minimum credibility',
    credibilityHint: '5★ = radar + military witnesses + official documentation',
    selection: 'Selection',
    exportSelection: 'Export filtered selection',
    permalink: 'Link',
    copyFiltersLink: 'Copy link with current filters',
    statsTitle: 'Selection analysis',
    prev: 'Previous',
    pause: 'Pause',
    resume: 'Resume',
    next: 'Next',
    playTimeline: 'Play timeline (space)',
    cumulative: 'Cumulative',
    cumulativeTitle: 'Accumulate cases from the beginning',
    windowMode: '10y window',
    windowModeTitle: 'Moving 10-year window',
    speed: 'Speed',
    sightingTitle: 'Register sighting',
    sightingHint: 'Saved only in this browser (local field notebook).',
    fieldTitle: 'Title *',
    fieldDate: 'Date *',
    fieldTime: 'Time',
    latitude: 'Latitude',
    longitude: 'Longitude',
    observedShape: 'Observed shape',
    notes: 'Notes',
    saveJournal: 'Save to my notebook',
    sightingNamePlaceholder: 'Pulsing light above the ridge',
    notesPlaceholder: 'Duration, direction, color, witnesses, conditions...',
    pickHint: 'Click the globe at the exact sighting location',
    cancel: 'cancel',
    modalTabs: ['Classification', 'Anatomy', 'Disclosure USA', 'Glossary', 'Methodology', 'Report'],
    appInfoTitle: 'About UFOlogist',
    appInfoIntro: '<b>UFOlogist</b> is an independent interactive atlas for exploring the UAP phenomenon with context, sources, and a critical eye. The goal is not to force a conclusion, but to organize the material, separate evidence from noise, and reveal where patterns appear.',
    appInfoAuthorTitle: 'Author note',
    appInfoAuthor: 'I built this tool for demanding curiosity: people who want to look at the cases without automatic cynicism, but without losing judgment either. If something intrigues you, open the sources, compare versions, and keep the question alive.',
    appInfoCopyrightTitle: 'Authorship and copyright',
    appInfoCopyright: 'Created by <b>Miquel Gelabert</b>. © Miquel Gelabert 2026 · UFOlogist.',
    appInfoNote: 'Independent educational project. Not affiliated with NUFORC, GEIPAN, CNES, AARO, or any official body. Code is published under the MIT license. Linked data and sources belong to their respective owners and are used for education and research.',
    mobileMenu: 'Menu',
    mobileExport: 'Export selection',
    mobileHelp: 'Tap a globe point to open its card. Drag the globe to rotate it.',
    mobileGlobe: 'Globe',
    mobileFilters: 'Filters',
    mobileTime: 'Time',
    mobileData: 'Data',
    mobileMore: 'More',
    curated: 'curated',
    heatSuffix: 'heat',
    narrowHint: 'narrow to <=600 to show points',
    noResults: 'No results',
    myNotebook: 'my notebook',
    satellite: 'satellite view',
    date: 'Date',
    origin: 'Origin',
    evidence: 'Evidence',
    coordinates: 'Coordinates',
    classification: 'Classification',
    localTime: 'Local time',
    shape: 'Shape',
    originalSources: 'Original sources',
    source: 'Source',
    officialSource: 'Official source',
    copyLink: 'Copy link',
    delete: 'Delete',
    noNotes: 'No notes.',
    wikipediaImage: 'Wikipedia image',
    article: 'article',
    searchVideos: 'Search videos',
    searchImages: 'Search images',
    nuforcReport: 'NUFORC report',
    geocodedLocation: 'geocoded location',
    nuforcSummary: 'Citizen report from the National UFO Reporting Center, geocoded at locality level. To read the full testimony, search by date and place in the NUFORC database.',
    nuforcDatabank: 'NUFORC Databank (search {date})',
    geipanCase: 'GEIPAN case (CNES)',
    france: 'France',
    departmentLocation: 'department-level location',
    geipanSummary: 'Case from the official GEIPAN archive (French space agency CNES).',
    kpiCurated: 'Curated cases',
    total: 'Total',
    byDecade: 'By decade',
    geipanByClass: 'GEIPAN by classification (France)',
    byShape: 'By reported shape (NUFORC)',
    dayVsNight: 'Day vs night',
    daytime: 'Daytime (7am-7pm)',
    nighttime: 'Nighttime (8pm-6am)',
    unknownTime: 'Unknown time',
    topLocations: 'Top 10 locations',
    massStatsHint: 'Enable the NUFORC mass database to see shape, time-of-day, and location analysis.',
    statsBias: 'Known bias: NUFORC is a US-heavy database and volume grows with the internet era (2000s). Geographic trends are more reliable than comparisons across distant eras.',
    exportedJson: '{count} records exported to JSON',
    exportedCsv: '{count} records exported to CSV',
    exportEmpty: 'Nothing to export with the current filters',
    filtersCopied: 'Filter link copied',
    linkCopied: 'Link copied to clipboard',
    registerMode: 'Register mode: click the sighting location on the globe',
    missingSighting: 'Missing title, date, or coordinates',
    registeredInNotebook: 'Registered in my notebook',
    deletedSighting: 'Sighting removed from your notebook',
    savedSighting: 'Sighting saved to your field notebook',
    massLoadError: 'Could not load the NUFORC mass database (data/nuforc.js)',
    unavailable: 'unavailable',
    realCase: 'view real case',
    anatomyTitle: 'Anatomy of an encounter',
    anatomyIntro: 'What distinguishes each sighting type, from a distant light to an alleged encounter with occupants. The scenes are illustrative; click <b>"view real case"</b> to fly to a documented example on the globe.',
    classificationTitle: 'Case classification',
    classificationIntro: 'UFOlogist uses the classification created by astronomer <b>J. Allen Hynek</b> (scientific advisor to Project Blue Book), extended with modern categories from the UAP era: military, transmedium, and mass sightings.',
    reportedShapesTitle: 'Reported shapes (NUFORC database)',
    reportedShapesIntro: 'The 80,332 citizen reports are grouped into 10 morphologies. The nocturnal "light" category dominates the record, consistent with Hynek’s NL category and with the difficulty of estimating shape at night.',
    disclosureTitle: 'US disclosure timeline',
    disclosureIntro: 'Eighty years of official investigation, public denial, and gradual declassification: from the Twining memo to Congressional hearings. The timeline diamonds mark these milestones and the major waves.',
    glossaryTitle: 'Essential glossary',
    methodologyTitle: 'Methodology and evidence scale',
    dataLayersTitle: 'The two data layers',
    curatedLayer: '<b>Curated cases (~100):</b> an editorial selection of the best documented cases in history, each linked to verifiable primary sources.',
    massLayer: '<b>Mass database (80,332):</b> citizen reports from the National UFO Reporting Center (1906–2014), geocoded at locality level. Unfiltered: it contains noise, misidentifications, and biases by country and internet era. Its value is statistical — trends, shapes, time bands, and geography — not proof case by case.',
    reportTitle: 'Official archives and how to report',
    reportIntro: 'Seen something? Use the <b>➕ Report</b> button to add it to your local field notebook with precise coordinates, then report it to an organization with exact time, duration, direction, conditions, and unzoomed photos. First rule out prosaic causes: Starlink, ISS, Venus, flares, drones, and balloons explain the vast majority of cases.',
  },
};
const TYPE_TEXT = {
  en: {
    NL: ['Nocturnal lights', 'Anomalous lights observed at night (Hynek: Nocturnal Lights).'],
    DD: ['Daylight disc', 'Object observed in broad daylight (Hynek: Daylight Discs).'],
    RV: ['Radar-Visual', 'Simultaneous radar detection and visual witnesses. The strongest evidentiary category.'],
    CE1: ['Close encounter I', 'Object within roughly 150 m, without interaction with the environment.'],
    CE2: ['Close encounter II', 'Physical evidence: traces, burns, electromagnetic interference, or physiological effects.'],
    CE3: ['Close encounter III', 'Observation of alleged occupants or entities associated with the object.'],
    CE4: ['Close encounter IV', 'Alleged abduction or direct interaction reported by the witness.'],
    MIL: ['Military / Aviation', 'Incidents involving pilots, bases, or defense systems. Often include official documentation.'],
    USO: ['USO / Transmedium', 'Unidentified submerged objects or transmedium behavior (air-water).'],
    MASS: ['Mass sighting', 'Hundreds or thousands of independent witnesses to the same event.'],
    MINE: ['My sightings', 'Sightings registered by you, saved in this browser.'],
  },
};
const SHAPE_TEXT = {
  en: ['Light', 'Fireball', 'Sphere/Orb', 'Triangle', 'Disk', 'Cigar/Cylinder', 'Oval/Teardrop', 'Geometric', 'Formation', 'Other/Unknown'],
};
const GEIPAN_TEXT = {
  en: [
    ['A · Identified', 'Phenomenon identified with certainty (aircraft, balloon, Venus, drone...).'],
    ['B · Probably identified', 'Very probable identification, without full certainty.'],
    ['C · Insufficient data', 'Insufficient data to conclude.'],
    ['D · Unexplained', 'Unexplained despite consistent data (includes D1/D2). The residue of greatest interest.'],
  ],
};
let currentLang = localStorage.getItem(LANG_KEY) || 'es';
if (!I18N[currentLang]) currentLang = 'es';
let audioEnabled = localStorage.getItem(AUDIO_KEY) !== 'off';
function t(key, vars) {
  let value = (I18N[currentLang] && I18N[currentLang][key]) || I18N.es[key] || key;
  if (vars) Object.entries(vars).forEach(([k, v]) => { value = value.replaceAll(`{${k}}`, v); });
  return value;
}
function locale() { return currentLang === 'en' ? 'en-US' : 'es-ES'; }
function fmtNum(n) { return n.toLocaleString(locale()); }
function typeLabel(code) { return currentLang === 'en' && TYPE_TEXT.en[code] ? TYPE_TEXT.en[code][0] : TYPE_META[code].label; }
function typeDesc(code) { return currentLang === 'en' && TYPE_TEXT.en[code] ? TYPE_TEXT.en[code][1] : TYPE_META[code].desc; }
function shapeLabel(i) { return currentLang === 'en' && SHAPE_TEXT.en[i] ? SHAPE_TEXT.en[i] : SHAPE_META[i].label; }
function geipanLabel(i) { return currentLang === 'en' && GEIPAN_TEXT.en[i] ? GEIPAN_TEXT.en[i][0] : GEIPAN_META[i].label; }
function geipanDesc(i) { return currentLang === 'en' && GEIPAN_TEXT.en[i] ? GEIPAN_TEXT.en[i][1] : GEIPAN_META[i].desc; }
function enContent() { return currentLang === 'en' && typeof CONTENT_EN !== 'undefined' ? CONTENT_EN : null; }
function caseContent(c) { return enContent()?.cases?.[c.id] || {}; }
function caseName(c) { return caseContent(c).name || c.name; }
function caseLoc(c) { return caseContent(c).loc || c.loc; }
function caseCountry(c) { return caseContent(c).country || c.country; }
function caseSummary(c) { return caseContent(c).summary || c.summary; }
function caseSourceLabel(c, i) { return caseContent(c).sources?.[i] || c.sources?.[i]?.[0] || ''; }
function caseMediaCaption(c, i, fallback) { return caseContent(c).mediaCaps?.[i] || fallback || ''; }
function hotspotIndex(h) { return HOTSPOTS.indexOf(h); }
function hotspotName(h) { return enContent()?.hotspots?.[hotspotIndex(h)]?.name || h.name; }
function hotspotDesc(h) { return enContent()?.hotspots?.[hotspotIndex(h)]?.desc || h.desc; }
function disclosureTitle(i, d) { return enContent()?.disclosure?.[i]?.title || d.title; }
function disclosureText(i, d) { return enContent()?.disclosure?.[i]?.text || d.text; }
function glossaryRows() { return enContent()?.glossary || GLOSSARY; }
function methodologyNotes() { return enContent()?.methodology?.notes || METHODOLOGY.notes; }
function methodologyCred() { return enContent()?.methodology?.cred || METHODOLOGY.cred; }
function tlEventLabel(i, ev) { return enContent()?.tlEvents?.[i]?.label || ev.label; }
function reportLinks() { return enContent()?.reportLinks || REPORT_LINKS; }
function setText(sel, text) { const el = typeof sel === 'string' ? document.querySelector(sel) : sel; if (el) el.textContent = text; }
function setFirstText(el, text) { if (el && el.childNodes.length) el.childNodes[0].nodeValue = text + ' '; }
function setButton(id, icon, labelKey, titleKey) {
  const el = $(id);
  if (!el) return;
  el.textContent = `${icon} ${t(labelKey)}`;
  if (titleKey) el.title = t(titleKey);
}
function applyStaticI18n() {
  document.documentElement.lang = currentLang;
  document.title = t('metaTitle');
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.content = t('metaDescription');
  setText('.brand-text p', t('brandTag'));
  if ($('search')) $('search').placeholder = t('searchPlaceholder');
  setText('#loading p', t('loading'));
  setText('.landing-tag', t('landingTag'));
  setText('#landing-log', t('loading'));
  setText('.landing-count', '');
  const landingCount = document.querySelector('.landing-count');
  if (landingCount) landingCount.innerHTML = `<span id="landing-count">${$('landing-count')?.textContent || '0'}</span> ${t('indexedReports')}`;
  setText('#landing-skip', t('enterAtlas'));

  setButton('btn-knowledge', '◎', 'navKnowledge', 'titleKnowledge');
  setButton('btn-stats', '⌁', 'navStats', 'titleStats');
  setButton('btn-add', '+', 'navReport', 'titleReport');
  setButton('btn-about', 'ⓘ', 'navInfo', 'titleInfo');
  setButton('btn-tour', '⌖', 'navTour', 'titleTour');
  updateAudioButton();
  document.querySelectorAll('.lang-toggle button').forEach(b => b.classList.toggle('active', b.dataset.lang === currentLang));

  setText('#panel-left .panel-head h2', t('filters'));
  if ($('btn-collapse-left')) $('btn-collapse-left').title = t('collapse');
  if ($('btn-expand-left')) $('btn-expand-left').title = t('expand');
  const blocks = document.querySelectorAll('#panel-left .filter-block');
  if (blocks[0]) {
    setText(blocks[0].querySelector('h3'), t('layers'));
    setText('#layer-mode [data-mode="both"]', t('both'));
    setText('#layer-mode [data-mode="heat"]', t('heat'));
    setText('#layer-mode [data-mode="points"]', t('cases'));
    setText(blocks[0].querySelector('.switch-row span'), `🔥 ${t('hotspots')}`);
  }
  if (blocks[1]) {
    setFirstText(blocks[1].querySelector('h3'), t('massDb'));
    setText(blocks[1].querySelector('.switch-row span'), t('nuforcSwitch'));
  }
  if (blocks[2]) {
    setFirstText(blocks[2].querySelector('h3'), t('geipanDb'));
    setText(blocks[2].querySelector('.switch-row span'), t('geipanSwitch'));
  }
  if (blocks[3]) {
    setText(blocks[3].querySelector('h3'), t('timeBand'));
    const tod = $('tod-filter');
    if (tod) tod.title = t('timeFilterTitle');
    setText('#tod-filter [data-tod="day"]', `☀ ${t('day')}`);
    setText('#tod-filter [data-tod="night"]', `☾ ${t('night')}`);
  }
  if (blocks[4]) {
    setFirstText(blocks[4].querySelector('h3'), t('curatedType'));
    setText('#types-all', t('all'));
    setText('#types-none', t('none'));
  }
  if (blocks[5]) {
    setText(blocks[5].querySelector('h3'), t('minCredibility'));
    setText(blocks[5].querySelector('.hint'), t('credibilityHint'));
  }
  if (blocks[6]) setFirstText(blocks[6].querySelector('h3'), t('selection'));
  ['btn-export-csv', 'btn-export-json'].forEach(id => { if ($(id)) $(id).title = t('exportSelection'); });
  if ($('btn-permalink')) { $('btn-permalink').title = t('copyFiltersLink'); $('btn-permalink').textContent = `🔗 ${t('permalink')}`; }

  setText('.stats-title', `📊 ${t('statsTitle')}`);
  if ($('tour-prev')) $('tour-prev').textContent = `⏮ ${t('prev')}`;
  if ($('tour-pause')) $('tour-pause').textContent = `⏸ ${t('pause')}`;
  if ($('tour-next')) $('tour-next').textContent = `${t('next')} ⏭`;
  if ($('btn-play')) $('btn-play').title = t('playTimeline');
  setText('#play-mode [data-pmode="cumulative"]', t('cumulative'));
  setText('#play-mode [data-pmode="window"]', t('windowMode'));
  const cumulative = document.querySelector('#play-mode [data-pmode="cumulative"]');
  const windowMode = document.querySelector('#play-mode [data-pmode="window"]');
  if (cumulative) cumulative.title = t('cumulativeTitle');
  if (windowMode) windowMode.title = t('windowModeTitle');
  setText('.tl-speed label', t('speed'));

  setText('#sight-form h3', `➕ ${t('sightingTitle')}`);
  setText('#sight-form .hint', t('sightingHint'));
  const labels = document.querySelectorAll('#sight-form label');
  if (labels[0]) { setFirstText(labels[0], t('fieldTitle')); $('sf-name').placeholder = t('sightingNamePlaceholder'); }
  if (labels[1]) setFirstText(labels[1], t('fieldDate'));
  if (labels[2]) setFirstText(labels[2], t('fieldTime'));
  if (labels[3]) setFirstText(labels[3], t('latitude'));
  if (labels[4]) setFirstText(labels[4], t('longitude'));
  if (labels[5]) setFirstText(labels[5], t('observedShape'));
  if (labels[6]) { setFirstText(labels[6], t('notes')); $('sf-notes').placeholder = t('notesPlaceholder'); }
  if ($('sf-save')) $('sf-save').textContent = `💾 ${t('saveJournal')}`;
  if ($('sf-shape') && $('sf-shape').options.length) {
    [...$('sf-shape').options].forEach(opt => { opt.textContent = shapeLabel(+opt.value); });
  }
  if ($('pick-hint') && $('pick-cancel')) {
    $('pick-hint').childNodes[0].nodeValue = `🎯 ${t('pickHint')} `;
    $('pick-cancel').textContent = t('cancel');
  }

  document.querySelectorAll('#modal-tabs button').forEach((b, i) => { b.textContent = t('modalTabs')[i] || b.textContent; });
  setText('#app-info-modal h2', t('appInfoTitle'));
  const appInfo = $('app-info-modal');
  if (appInfo) {
    const ps = appInfo.querySelectorAll('p');
    const hs = appInfo.querySelectorAll('h3');
    if (ps[0]) ps[0].innerHTML = t('appInfoIntro');
    if (hs[0]) hs[0].textContent = t('appInfoAuthorTitle');
    if (ps[1]) ps[1].textContent = t('appInfoAuthor');
    if (hs[1]) hs[1].textContent = t('appInfoCopyrightTitle');
    if (ps[2]) ps[2].innerHTML = t('appInfoCopyright');
    if (ps[3]) ps[3].textContent = t('appInfoNote');
  }

  setText('#mobile-more .more-title', t('mobileMenu'));
  const moreButtons = document.querySelectorAll('#mobile-more .more-grid:first-of-type button span');
  ['navKnowledge', 'navStats', 'navReport', 'navInfo', 'navTour', 'ambientLabel'].forEach((key, i) => { if (moreButtons[i]) moreButtons[i].textContent = t(key); });
  const mobileTitles = document.querySelectorAll('#mobile-more .more-title');
  if (mobileTitles[1]) mobileTitles[1].textContent = t('mobileExport');
  const exportSpans = document.querySelectorAll('#mobile-more .more-grid:nth-of-type(2) button span');
  if (exportSpans[2]) exportSpans[2].textContent = t('permalink');
  setText('#mobile-more .hint', t('mobileHelp'));
  const navs = document.querySelectorAll('#mobile-nav button');
  const navLabels = ['mobileGlobe', 'mobileFilters', 'mobileTime', 'mobileData', 'mobileMore'];
  navs.forEach((b, i) => {
    const icon = b.querySelector('b')?.outerHTML || '';
    b.innerHTML = `${icon}${t(navLabels[i])}`;
  });
}
function setLanguage(lang) {
  if (!I18N[lang] || lang === currentLang) return;
  currentLang = lang;
  localStorage.setItem(LANG_KEY, lang);
  applyStaticI18n();
  if (massData) $('mass-status').textContent = fmtNum(massData.length);
  if (geipanData) $('geipan-status').textContent = fmtNum(geipanData.length);
  buildTypeFilters();
  buildShapeFilters();
  buildGeipanFilters();
  refresh();
  if (!$('panel-stats').classList.contains('hidden')) renderStats();
  if (!$('modal-overlay').classList.contains('hidden')) {
    const active = document.querySelector('#modal-tabs button.active')?.dataset.tab || 'hynek';
    switchTab(active);
  }
  if (state.selectedCase) openCase(state.selectedCase, false);
}
applyStaticI18n();
document.querySelectorAll('.lang-toggle button').forEach(b => {
  b.onclick = () => setLanguage(b.dataset.lang);
});

// ---------- Ambient soundtrack ----------
let ambientAudio = null;
let ambientTrackIndex = 0;
let ambientStarting = false;

function updateAudioButton(pending = false) {
  const btn = $('btn-audio');
  if (!btn) return;
  btn.textContent = audioEnabled ? '◉' : '○';
  btn.classList.toggle('off', !audioEnabled);
  btn.classList.toggle('pending', pending);
  btn.title = t(audioEnabled ? 'ambientOff' : 'ambientOn');
  btn.setAttribute('aria-label', btn.title);
  btn.setAttribute('aria-pressed', String(audioEnabled));
  const moreAudio = document.querySelector('#mobile-more [data-act="audio"]');
  if (moreAudio) {
    moreAudio.childNodes[0].nodeValue = audioEnabled ? '◉' : '○';
    const label = moreAudio.querySelector('span');
    if (label) label.textContent = t('ambientLabel');
    moreAudio.title = btn.title;
  }
}

function ensureAmbientAudio() {
  if (ambientAudio) return ambientAudio;
  ambientAudio = new Audio(AUDIO_TRACKS[ambientTrackIndex]);
  ambientAudio.preload = 'auto';
  ambientAudio.volume = 0.22;
  ambientAudio.addEventListener('ended', () => {
    ambientTrackIndex = (ambientTrackIndex + 1) % AUDIO_TRACKS.length;
    ambientAudio.src = AUDIO_TRACKS[ambientTrackIndex];
    if (audioEnabled) playAmbient({ silent: true });
  });
  return ambientAudio;
}

async function playAmbient({ silent = false } = {}) {
  if (!audioEnabled || ambientStarting) return;
  ambientStarting = true;
  updateAudioButton(true);
  try {
    const audio = ensureAmbientAudio();
    await audio.play();
    updateAudioButton(false);
    if (!silent) toast(t('ambientEnabled'));
  } catch (err) {
    updateAudioButton(false);
    if (!silent) toast(t('ambientWaiting'));
  } finally {
    ambientStarting = false;
  }
}

function pauseAmbient() {
  if (ambientAudio) ambientAudio.pause();
}

function toggleAmbient() {
  audioEnabled = !audioEnabled;
  localStorage.setItem(AUDIO_KEY, audioEnabled ? 'on' : 'off');
  updateAudioButton(false);
  if (audioEnabled) playAmbient();
  else {
    pauseAmbient();
    toast(t('ambientDisabled'));
  }
}

if ($('btn-audio')) $('btn-audio').onclick = toggleAmbient;
['pointerdown', 'keydown'].forEach(evt => {
  window.addEventListener(evt, () => {
    if (audioEnabled && (!ambientAudio || ambientAudio.paused)) playAmbient({ silent: true });
  }, { once: true, passive: true });
});
updateAudioButton();

// ---------- Landing / loading screen (fake load sequence, auto-advance 5s) ----------
(function landing() {
  const el = document.getElementById('landing');
  if (!el) return;
  const bar = document.getElementById('landing-bar');
  const log = document.getElementById('landing-log');
  const count = document.getElementById('landing-count');
  const DURATION = 5000, TARGET = 80432;
  const stepAt = [0.00, 0.28, 0.56, 0.82];
  let t0 = performance.now(), raf = 0, finished = false, lastStep = -1;
  function finish() {
    if (finished) return; finished = true;
    cancelAnimationFrame(raf);
    if (bar) bar.style.width = '100%';
    if (log) log.textContent = t('landingReady');
    el.classList.add('done');
    setTimeout(() => { el.style.display = 'none'; }, 750);
    revealCasesSweep();   // heatmap is already drawn; now sweep-reveal the case hexagons
    playAmbient({ silent: true });
  }
  function frame(now) {
    const p = Math.min(1, (now - t0) / DURATION);
    if (bar) bar.style.width = (p * 100).toFixed(1) + '%';
    if (count) count.textContent = fmtNum(Math.round(p * TARGET));
    let s = 0;
    const steps = t('landingSteps');
    for (let i = 0; i < stepAt.length; i++) if (p >= stepAt[i]) s = i;
    if (s !== lastStep && log) { lastStep = s; log.textContent = steps[s]; }
    if (p >= 1) { finish(); return; }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  setTimeout(finish, DURATION + 250);        // hard backstop (rAF can be throttled when backgrounded)
  el.addEventListener('click', finish);      // tap anywhere / "Entrar" to skip
})();

// ---------- State ----------
const YEAR_MIN = 1942, YEAR_MAX = 2026;
const state = {
  yearFrom: YEAR_MIN,
  yearTo: YEAR_MAX,
  types: new Set(Object.keys(TYPE_META)),
  credMin: 1,
  layerMode: 'both',            // both | heat | points
  playing: false,
  playMode: 'cumulative',       // cumulative | window
  speed: 4,
  selectedCase: null,
  massOn: true,
  shapes: new Set(SHAPE_META.map((_, i) => i)),
  tod: 'all',                   // all | day | night
  geipanOn: true,
  geipanClasses: new Set(GEIPAN_META.map((_, i) => i)),
  hotspots: false,
  pickMode: false,
};

TYPE_META.MINE = { label: 'Mis avistamientos', color: '#ffffff', desc: 'Avistamientos registrados por ti, guardados en este navegador.' };

CASES.forEach(c => { c.year = +c.date.slice(0, 4); });
CASES.sort((a, b) => a.year - b.year);

// ---------- Journal (local field notebook) ----------
const JOURNAL_KEY = 'ufologist-journal';
let journal = [];
try { journal = JSON.parse(localStorage.getItem(JOURNAL_KEY) || '[]'); } catch (e) { journal = [] }
journal.forEach(j => { j.year = +j.date.slice(0, 4); j.mine = true; j.type = 'MINE'; });
function saveJournal() { localStorage.setItem(JOURNAL_KEY, JSON.stringify(journal)); }
function allCuratedPool() { return CASES.concat(journal); }

// ---------- Entry reveal + hex-cap altitudes ----------
let casesReady = false;   // gate: heatmap draws first, cases revealed after the landing
let revealCases = false;  // active during the sweep-in animation

// Place each curated case at the top of its heatmap column (H3 bin), matching the
// hex-bar height so the hexagon sits like the column's lid in hybrid view.
function computeCapAltitudes() {
  if (typeof h3 === 'undefined' || !h3.latLngToCell) return;
  const res = (window.matchMedia('(max-width: 760px)').matches) ? 2 : 3;
  const weight = new Map();
  const bump = (lat, lng) => { const c = h3.latLngToCell(lat, lng, res); weight.set(c, (weight.get(c) || 0) + 1); };
  if (massData) massData.forEach(r => bump(r.lat, r.lng));
  if (geipanData) geipanData.forEach(r => bump(r.lat, r.lng));
  allCuratedPool().forEach(c => bump(c.lat, c.lng));
  const total = (massData ? massData.length : 0) + (geipanData ? geipanData.length : 0);
  const capRef = total > 0 ? Math.max(20, total / 30) : 15;
  const capT = w => Math.min(1, Math.log10(1 + w) / Math.log10(1 + capRef));
  allCuratedPool().forEach(c => {
    const w = weight.get(h3.latLngToCell(c.lat, c.lng, res)) || 1;
    c._capAlt = capT(w) * 0.17 + 0.012 + 0.006;   // top face + small lift so it caps the bar
  });
}

// Reveal the case hexagons with a longitude sweep, after the heatmap is drawn.
function revealCasesSweep() {
  if (casesReady) return;
  casesReady = true;
  revealCases = true;
  computeCapAltitudes();
  refresh();
  setTimeout(() => { revealCases = false; }, 2200);
}

// ---------- Mass DB (NUFORC) ----------
let massData = null;   // array of {d,h,lat,lng,s,loc,year}
function ingestMass(json) {
  massData = json.rows.map(r => ({
    d: r[0], h: r[1], lat: r[2], lng: r[3], s: r[4], loc: r[5],
    year: Math.floor(r[0] / 10000), mass: true,
  }));
  $('mass-status').textContent = fmtNum(massData.length);
  computeCapAltitudes();
  refresh();
}
fetch('data/nuforc.json?v=2')
  .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then(ingestMass)
  .catch(() => {
    // file:// or fetch blocked — fall back to a plain <script> payload, which always loads
    const s = document.createElement('script');
    s.src = 'data/nuforc.js?v=2';
    s.onload = () => window.NUFORC_DATA ? ingestMass(window.NUFORC_DATA)
                                        : ($('mass-status').textContent = t('unavailable'));
    s.onerror = () => {
      $('mass-status').textContent = t('unavailable');
      toast(`⚠ ${t('massLoadError')}`);
    };
    document.head.appendChild(s);
  });

function massFiltered() {
  if (!state.massOn || !massData) return [];
  const { yearFrom, yearTo, shapes, tod } = state;
  return massData.filter(r => {
    if (r.year < yearFrom || r.year > yearTo) return false;
    if (!shapes.has(r.s)) return false;
    if (tod === 'day' && !(r.h >= 7 && r.h <= 19)) return false;
    if (tod === 'night' && !(r.h >= 20 || (r.h >= 0 && r.h <= 6))) return false;
    return true;
  });
}

// ---------- GEIPAN DB (France / CNES) ----------
let geipanData = null;   // array of {d,lat,lng,ci,zone,resume,year,geipan:true}
function ingestGeipan(json) {
  geipanData = json.rows.map(r => ({
    d: r[0], lat: r[1], lng: r[2], ci: r[3], zone: r[4], resume: r[5],
    year: Math.floor(r[0] / 10000), geipan: true,
  }));
  $('geipan-status').textContent = fmtNum(geipanData.length);
  computeCapAltitudes();
  refresh();
}
fetch('data/geipan.json?v=1')
  .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then(ingestGeipan)
  .catch(() => {
    const s = document.createElement('script');
    s.src = 'data/geipan.js?v=1';
    s.onload = () => window.GEIPAN_DATA ? ingestGeipan(window.GEIPAN_DATA)
                                        : ($('geipan-status').textContent = t('unavailable'));
    s.onerror = () => { $('geipan-status').textContent = t('unavailable'); };
    document.head.appendChild(s);
  });

function geipanFiltered() {
  if (!state.geipanOn || !geipanData) return [];
  const { yearFrom, yearTo, geipanClasses } = state;
  return geipanData.filter(r => r.year >= yearFrom && r.year <= yearTo && geipanClasses.has(r.ci));
}

// ---------- Globe ----------
const MASS_POINT_LIMIT = 600;  // show individual mass dots only below this (DOM markers); else heatmap

const globe = Globe()($('globe'))
  .globeImageUrl('https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg')
  .bumpImageUrl('https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png')
  .backgroundImageUrl('https://cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png')
  .atmosphereColor('#4be1c3')
  .atmosphereAltitude(0.18)
  .htmlLat(d => d.lat)
  .htmlLng(d => d.lng)
  .htmlAltitude(d => {
    // hybrid view: curated case hexagons ride on top of their heatmap column
    // (like the lid of the 3D hex). Mass/GEIPAN points and "only cases" view stay low.
    if (d.mass || d.geipan) return 0.007;
    if (state.layerMode === 'both' && d._capAlt != null) return d._capAlt;
    return 0.013;
  })
  .htmlElement(d => buildMarker(d))
  .hexBinPointLat('lat').hexBinPointLng('lng')
  .hexBinPointWeight(1)
  .hexBinResolution(3)
  .hexMargin(0.18)
  .hexAltitude(d => hexT(d.sumWeight) * 0.17 + 0.012)
  .hexTopColor(d => heatColor(d.sumWeight, 0.95))
  .hexSideColor(d => heatColor(d.sumWeight, 0.45))
  .hexLabel(d => `
    <div style="font-family:'JetBrains Mono',monospace;background:rgba(8,12,26,.92);border:1px solid rgba(120,200,255,.25);border-radius:8px;padding:6px 10px;color:#e8eefc;font-size:11px;">
      ${fmtNum(d.sumWeight)} ${currentLang === 'en' ? (d.sumWeight === 1 ? 'report' : 'reports') + ' in this area' : `reporte${d.sumWeight > 1 ? 's' : ''} en la zona`}</div>`)
  .labelLat(d => d.lat).labelLng(d => d.lng)
  .labelText(d => hotspotName(d))
  .labelSize(0.65).labelDotRadius(0.35)
  .labelColor(() => '#ffd166')
  .labelResolution(2)
  .labelLabel(d => `
    <div style="font-family:'Space Grotesk',sans-serif;background:rgba(8,12,26,.94);border:1px solid rgba(255,209,102,.4);border-radius:10px;padding:9px 12px;max-width:260px;">
      <div style="color:#ffd166;font-weight:700;">🔥 ${hotspotName(d)}</div>
      <div style="color:#cdd8ef;font-size:11.5px;margin-top:4px;line-height:1.5;">${hotspotDesc(d)}</div>
    </div>`)
  .onLabelClick(d => {
    globe.controls().autoRotate = false;
    globe.pointOfView({ lat: d.lat, lng: d.lng, altitude: 1.1 }, 900);
  })
  .onGlobeClick(({ lat, lng }) => { if (state.pickMode) pickLocation(lat, lng); });

// Crisp hexagon marker (HTML/screen-space → constant pixel size at any zoom).
// Hexagonal shape rhymes with the hex-bar heatmap; sharp stroke, no diffuse glow.
function buildMarker(d) {
  const el = document.createElement('div');
  el.className = 'globe-marker';
  const isMassLike = d.mass || d.geipan;
  const color = d.geipan ? GEIPAN_META[d.ci].color : (d.mass ? SHAPE_META[d.s].color : TYPE_META[d.type].color);
  const reveal = revealCases && !isMassLike;
  const cls = 'case-hex' + (isMassLike ? ' mass' : '') + (d.mine ? ' mine' : '') + (reveal ? ' reveal' : '');
  const pip = isMassLike ? '' : '<circle class="pip" cx="12" cy="12" r="2.3"/>';
  const delay = reveal ? `;animation-delay:${Math.round(((d.lng + 180) / 360) * 1500)}ms` : '';
  el.innerHTML = `<svg class="${cls}" viewBox="0 0 24 24" style="--c:${color}${delay}">
    <polygon points="12,1.6 21.5,7 21.5,17 12,22.4 2.5,17 2.5,7"/>${pip}</svg>`;
  el.title = d.geipan
    ? `GEIPAN ${GEIPAN_META[d.ci].code} · ${fmtDateInt(d.d)} · ${d.zone || t('france')}`
    : d.mass
      ? `${shapeLabel(d.s)} · ${fmtDateInt(d.d)} · ${d.loc || t('geocodedLocation')}`
      : `${caseName(d)} · ${d.year} · ${caseLoc(d) || ''}`;
  el.onclick = () => d.geipan ? openGeipanReport(d) : (d.mass ? openMassReport(d) : openCase(d.id, true));
  return el;
}

globe.controls().autoRotate = true;
globe.controls().autoRotateSpeed = 0.35;
globe.controls().addEventListener('start', () => { globe.controls().autoRotate = false; });
globe.pointOfView({ lat: 30, lng: -40, altitude: 2.3 });

// adaptive heat scale (log) — recomputed on refresh
let heatRef = 15;
function hexT(w) { return Math.min(1, Math.log10(1 + w) / Math.log10(1 + heatRef)); }
function heatColor(w, alpha) {
  const t = hexT(w);
  const stops = [[75, 225, 195], [160, 235, 120], [255, 209, 102], [255, 130, 80], [239, 71, 111]];
  const x = t * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  const f = x - i;
  const c = stops[i].map((v, k) => Math.round(v + (stops[i + 1][k] - v) * f));
  return `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
}

function fmtDateInt(d) {
  const y = Math.floor(d / 10000), m = Math.floor(d / 100) % 100, da = d % 100;
  return `${String(da).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

function hideLoading() {
  const el = $('loading');
  el.style.opacity = '0';
  setTimeout(() => el.classList.add('hidden'), 650);
}
globe.onGlobeReady ? globe.onGlobeReady(hideLoading) : setTimeout(hideLoading, 1800);
setTimeout(hideLoading, 5000);

window.addEventListener('resize', () => {
  globe.width(window.innerWidth).height(window.innerHeight);
  drawHistogram(); positionHandles(); renderTimelineEvents();
  applyMobileLayout();   // re-applies only when crossing the mobile/desktop breakpoint
});

// ---------- Filtering ----------
function filteredCases() {
  return allCuratedPool().filter(c =>
    c.year >= state.yearFrom && c.year <= state.yearTo &&
    state.types.has(c.type) &&
    (c.mine || c.cred >= state.credMin)
  );
}

let lastMassCount = 0;
function refresh() {
  const curated = filteredCases();
  const mass = massFiltered();
  const geipan = geipanFiltered();
  lastMassCount = mass.length;
  const heatTotal = mass.length + geipan.length;
  heatRef = heatTotal > 0 ? Math.max(20, heatTotal / 30) : 15;

  let points = [];
  if (state.layerMode !== 'heat' && casesReady) {
    points = curated.slice();
    // mobile keeps only the curated dots as DOM markers (heatmap shows mass density);
    // desktop also shows individual mass/GEIPAN reports when each subset is small
    if (!isMobile()) {
      if (mass.length > 0 && mass.length <= MASS_POINT_LIMIT) points = points.concat(mass);
      if (geipan.length > 0 && geipan.length <= MASS_POINT_LIMIT) points = points.concat(geipan);
    }
  }
  globe.htmlElementsData(points);
  globe.hexBinPointsData(state.layerMode !== 'points' ? curated.concat(mass, geipan) : []);
  globe.labelsData(state.hotspots ? HOTSPOTS : []);

  renderCaseList(curated);
  renderTypeCounts();
  renderShapeCounts();
  renderGeipanCounts();
  $('case-count').textContent = fmtNum(curated.length + mass.length + geipan.length);
  const parts = [`${fmtNum(curated.length)} ${t('curated')}`];
  if (mass.length) parts.push(`${fmtNum(mass.length)} NUFORC${mass.length > MASS_POINT_LIMIT ? ` (${t('heatSuffix')})` : ''}`);
  if (geipan.length) parts.push(`${fmtNum(geipan.length)} GEIPAN${geipan.length > MASS_POINT_LIMIT ? ` (${t('heatSuffix')})` : ''}`);
  $('mass-count-hint').textContent = parts.join(' + ') + ((mass.length > MASS_POINT_LIMIT || geipan.length > MASS_POINT_LIMIT) ? ` · ${t('narrowHint')}` : '');
  $('year-from').textContent = state.yearFrom;
  $('year-to').textContent = state.yearTo;
  drawHistogram();
  if (!$('panel-stats').classList.contains('hidden')) renderStats();
  scheduleHashUpdate();
}

// ---------- Type filters (curated) ----------
function buildTypeFilters() {
  const wrap = $('type-filters');
  wrap.innerHTML = '';
  Object.entries(TYPE_META).forEach(([code, meta]) => {
    if (code === 'MINE' && journal.length === 0) return;
    const el = document.createElement('div');
    el.className = 'type-chip' + (state.types.has(code) ? '' : ' off');
    el.dataset.type = code;
    el.title = typeDesc(code);
    el.innerHTML = `<span class="dot" style="background:${meta.color};color:${meta.color}"></span>
                    <span>${typeLabel(code)}</span><span class="t-count"></span>`;
    el.onclick = () => {
      state.types.has(code) ? state.types.delete(code) : state.types.add(code);
      el.classList.toggle('off', !state.types.has(code));
      refresh();
    };
    wrap.appendChild(el);
  });
}
function renderTypeCounts() {
  const counts = {};
  allCuratedPool().forEach(c => {
    if (c.year >= state.yearFrom && c.year <= state.yearTo && (c.mine || c.cred >= state.credMin))
      counts[c.type] = (counts[c.type] || 0) + 1;
  });
  document.querySelectorAll('.type-chip').forEach(el => {
    el.querySelector('.t-count').textContent = counts[el.dataset.type] || 0;
  });
}
$('types-all').onclick = () => {
  Object.keys(TYPE_META).forEach(t => state.types.add(t));
  document.querySelectorAll('.type-chip').forEach(el => el.classList.remove('off'));
  refresh();
};
$('types-none').onclick = () => {
  state.types.clear();
  document.querySelectorAll('.type-chip').forEach(el => el.classList.add('off'));
  refresh();
};

// ---------- Shape filters (mass DB) ----------
function buildShapeFilters() {
  const wrap = $('shape-filters');
  wrap.innerHTML = '';
  SHAPE_META.forEach((s, i) => {
    const el = document.createElement('span');
    el.className = 'shape-pill' + (state.shapes.has(i) ? '' : ' off');
    el.dataset.shape = i;
    el.innerHTML = `<span class="sdot" style="background:${s.color}"></span>${shapeLabel(i)} <span class="s-count"></span>`;
    el.onclick = () => {
      state.shapes.has(i) ? state.shapes.delete(i) : state.shapes.add(i);
      el.classList.toggle('off', !state.shapes.has(i));
      refresh();
    };
    wrap.appendChild(el);
  });
}
function renderShapeCounts() {
  if (!massData) return;
  const counts = new Array(SHAPE_META.length).fill(0);
  massData.forEach(r => { if (r.year >= state.yearFrom && r.year <= state.yearTo) counts[r.s]++; });
  document.querySelectorAll('#shape-filters .shape-pill').forEach(el => {
    const n = counts[+el.dataset.shape];
    el.querySelector('.s-count').textContent = n > 999 ? (n / 1000).toFixed(1) + 'k' : n;
  });
}
$('mass-toggle').onchange = e => { state.massOn = e.target.checked; refresh(); };
document.querySelectorAll('#tod-filter button').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('#tod-filter button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.tod = btn.dataset.tod;
    refresh();
  };
});
$('hotspots-toggle').onchange = e => { state.hotspots = e.target.checked; refresh(); };

// ---------- Classification filters (GEIPAN) ----------
function buildGeipanFilters() {
  const wrap = $('geipan-filters');
  if (!wrap) return;
  wrap.innerHTML = '';
  GEIPAN_META.forEach((g, i) => {
    const el = document.createElement('span');
    el.className = 'shape-pill' + (state.geipanClasses.has(i) ? '' : ' off');
    el.dataset.gclass = i;
    el.title = geipanDesc(i);
    el.innerHTML = `<span class="sdot" style="background:${g.color}"></span>${geipanLabel(i)} <span class="g-count"></span>`;
    el.onclick = () => {
      state.geipanClasses.has(i) ? state.geipanClasses.delete(i) : state.geipanClasses.add(i);
      el.classList.toggle('off', !state.geipanClasses.has(i));
      refresh();
    };
    wrap.appendChild(el);
  });
}
function renderGeipanCounts() {
  if (!geipanData) return;
  const counts = new Array(GEIPAN_META.length).fill(0);
  geipanData.forEach(r => { if (r.year >= state.yearFrom && r.year <= state.yearTo) counts[r.ci]++; });
  document.querySelectorAll('#geipan-filters .shape-pill').forEach(el => {
    el.querySelector('.g-count').textContent = counts[+el.dataset.gclass] || 0;
  });
}
$('geipan-toggle').onchange = e => { state.geipanOn = e.target.checked; refresh(); };

// ---------- Credibility ----------
$('cred-range').oninput = e => {
  state.credMin = +e.target.value;
  $('cred-stars').textContent = '★'.repeat(state.credMin) + '☆'.repeat(5 - state.credMin);
  refresh();
};

// ---------- Layer mode ----------
document.querySelectorAll('#layer-mode button').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('#layer-mode button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.layerMode = btn.dataset.mode;
    refresh();
  };
});

// ---------- Case list ----------
function renderCaseList(data) {
  const wrap = $('case-list');
  wrap.innerHTML = '';
  [...data].sort((a, b) => b.year - a.year).forEach(c => {
    const el = document.createElement('div');
    el.className = 'case-item' + (state.selectedCase === c.id ? ' active' : '');
    el.innerHTML = `
      <div class="ci-top"><span class="ci-dot" style="background:${TYPE_META[c.type].color}"></span>
      <span class="ci-name">${caseName(c)}</span></div>
      <div class="ci-meta">${c.year} · ${caseCountry(c) || t('myNotebook')} · ${c.mine ? '📓' : '★'.repeat(c.cred)}</div>`;
    el.onclick = () => openCase(c.id, true);
    wrap.appendChild(el);
  });
}

// ---------- Media system ----------
function commonsURL(filename) {
  return 'https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(filename);
}
// find a Wikipedia article (lang + title) among a case's sources
function wikiInfo(c) {
  if (!c.sources) return null;
  for (const s of c.sources) {
    const m = (s[1] || '').match(/^https?:\/\/([a-z]+)\.wikipedia\.org\/wiki\/(.+)$/i);
    if (m) return { lang: m[1].toLowerCase(), title: m[2].split('#')[0] };
  }
  return null;
}
const wikiImgCache = new Map();
function fetchWikiImage(c) {
  const info = wikiInfo(c);
  if (!info) return Promise.resolve(null);
  const key = info.lang + ':' + info.title;
  if (wikiImgCache.has(key)) return Promise.resolve(wikiImgCache.get(key));
  const api = `https://${info.lang}.wikipedia.org/api/rest_v1/page/summary/${info.title}`;
  return fetch(api).then(r => r.ok ? r.json() : null).then(j => {
    const src = j && ((j.originalimage && j.originalimage.source) || (j.thumbnail && j.thumbnail.source)) || null;
    const val = src ? { src, page: j.content_urls && j.content_urls.desktop && j.content_urls.desktop.page } : null;
    wikiImgCache.set(key, val);
    return val;
  }).catch(() => { wikiImgCache.set(key, null); return null; });
}
function mediaSearchQuery(c) {
  return encodeURIComponent(caseName(c).replace(/\(.*?\)/g, '').trim() + ' ' + c.year + ' UFO UAP');
}
function renderMediaBlock(c) {
  const items = (c.media || []).map(m => {
    if (m.k === 'video') {
      const cap = caseMediaCaption(c, c.media.indexOf(m), m.cap);
      return `<figure class="media-item"><video class="media-video" controls preload="none"
        poster="${m.poster || ''}" src="${commonsURL(m.commons)}#t=0.1"></video>
        <figcaption>${cap}</figcaption></figure>`;
    }
    if (m.k === 'image') {
      const cap = caseMediaCaption(c, c.media.indexOf(m), m.cap);
      return `<figure class="media-item"><img class="media-img" loading="lazy" src="${m.src}" alt="${cap || caseName(c)}" data-full="${m.full || m.src}">
        <figcaption>${cap}</figcaption></figure>`;
    }
    return '';
  }).join('');
  const q = mediaSearchQuery(c);
  const actions = `<div class="cc-media-actions">
      <a class="btn-ghost small" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${q}">▶ ${t('searchVideos')}</a>
      <a class="btn-ghost small" target="_blank" rel="noopener" href="https://www.google.com/search?tbm=isch&q=${q}">🖼 ${t('searchImages')}</a>
    </div>`;
  return `<div class="cc-media" id="cc-media">${items}</div>${actions}`;
}
// async: pull the Wikipedia lead image and inject it (only if no curated media already)
function hydrateMedia(c) {
  if (c.media && c.media.length) return;       // curated media already shown
  fetchWikiImage(c).then(img => {
    if (!img || state.selectedCase !== c.id) return;
    const wrap = $('cc-media');
    if (!wrap) return;
    const fig = document.createElement('figure');
    fig.className = 'media-item';
    fig.innerHTML = `<img class="media-img" loading="lazy" src="${img.src}" alt="${caseName(c)}" data-full="${img.src}">
      <figcaption>${t('wikipediaImage')}${img.page ? ` · <a href="${img.page}" target="_blank" rel="noopener" class="cc-map-link">${t('article')} ↗</a>` : ''}</figcaption>`;
    wrap.appendChild(fig);
  });
}

// ---------- Lightbox ----------
const lightbox = document.createElement('div');
lightbox.id = 'lightbox';
lightbox.className = 'hidden';
lightbox.innerHTML = '<img alt="" /><button class="lb-close" title="Cerrar">✕</button>';
document.body.appendChild(lightbox);
lightbox.addEventListener('click', () => lightbox.classList.add('hidden'));
function openLightbox(src) {
  lightbox.querySelector('img').src = src;
  lightbox.classList.remove('hidden');
}
// delegated: any media image (curated or async-injected) opens the lightbox
$('case-content').addEventListener('click', e => {
  const img = e.target.closest && e.target.closest('.media-img');
  if (img) openLightbox(img.dataset.full || img.src);
});

// ---------- Case detail ----------
function gmaps(lat, lng) { return `https://maps.google.com/?q=${lat.toFixed(5)},${lng.toFixed(5)}&t=k`; }

function openCase(id, fly) {
  const pool = allCuratedPool();
  const c = pool.find(x => x.id === id);
  if (!c) return;
  closeStats();
  state.selectedCase = id;
  const meta = TYPE_META[c.type];
  const dateFmt = new Date(c.date + 'T12:00:00').toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' });
  $('case-content').innerHTML = `
    <span class="cc-type-badge" style="background:${meta.color}22;color:${meta.color};border:1px solid ${meta.color}55">
      <span class="dot" style="width:8px;height:8px;border-radius:50%;background:${meta.color}"></span>${typeLabel(c.type)}</span>
    <h2 class="cc-title">${caseName(c)}</h2>
    <p class="cc-loc">📍 ${caseLoc(c)}${caseCountry(c) ? ', ' + caseCountry(c) : ''} · <a class="cc-map-link" href="${gmaps(c.lat, c.lng)}" target="_blank" rel="noopener">${t('satellite')} ↗</a></p>
    <div class="cc-row">
      <div class="cc-stat"><label>${t('date')}</label><span class="v">${dateFmt}</span></div>
      <div class="cc-stat"><label>${c.mine ? t('origin') : t('evidence')}</label><span class="v stars">${c.mine ? `📓 ${t('myNotebook')}` : '★'.repeat(c.cred) + '☆'.repeat(5 - c.cred)}</span></div>
    </div>
    <div class="cc-row">
      <div class="cc-stat"><label>${t('coordinates')}</label><span class="v">${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}</span></div>
      <div class="cc-stat"><label>${t('classification')}</label><span class="v">${c.type}</span></div>
    </div>
    <p class="cc-summary">${caseSummary(c) || `<i>${t('noNotes')}</i>`}</p>
    ${c.mine ? '' : renderMediaBlock(c)}
    ${c.sources && c.sources.length ? `<div class="cc-sources"><h4>${t('originalSources')}</h4>
      ${c.sources.map((s, i) => `<a class="cc-source-link" href="${s[1]}" target="_blank" rel="noopener">${caseSourceLabel(c, i)}</a>`).join('')}</div>` : ''}
    <div class="cc-actions">
      <button id="cc-share" class="btn-ghost small">🔗 ${t('copyLink')}</button>
      ${c.mine ? `<button id="cc-delete" class="btn-ghost small" style="color:#ef476f;border-color:#ef476f55">🗑 ${t('delete')}</button>` : ''}
    </div>
    <div class="cc-nav">
      <button id="cc-prev">← ${t('prev')}</button>
      <button id="cc-next">${t('next')} →</button>
    </div>`;
  $('panel-case').classList.remove('hidden');
  mobileOnCaseOpen();
  if (!c.mine) hydrateMedia(c);
  const visible = filteredCases();
  const idx = visible.findIndex(x => x.id === id);
  $('cc-prev').onclick = () => { if (idx > 0) openCase(visible[idx - 1].id, true); };
  $('cc-next').onclick = () => { if (idx >= 0 && idx < visible.length - 1) openCase(visible[idx + 1].id, true); };
  $('cc-share').onclick = () => {
    scheduleHashUpdate.flush && scheduleHashUpdate.flush();
    navigator.clipboard.writeText(location.href).then(() => toast(t('linkCopied')));
  };
  if (c.mine) $('cc-delete').onclick = () => {
    journal = journal.filter(j => j.id !== c.id);
    saveJournal();
    $('panel-case').classList.add('hidden');
    state.selectedCase = null;
    buildTypeFilters();
    refresh();
    toast(t('deletedSighting'));
  };
  if (fly) {
    globe.controls().autoRotate = false;
    globe.pointOfView({ lat: c.lat, lng: c.lng, altitude: 1.4 }, 900);
  }
  renderCaseList(visible);
  scheduleHashUpdate();
}

function openMassReport(d) {
  closeStats();
  state.selectedCase = null;
  const s = SHAPE_META[d.s];
  $('case-content').innerHTML = `
    <span class="cc-type-badge" style="background:${s.color}22;color:${s.color};border:1px solid ${s.color}55">
      <span class="dot" style="width:8px;height:8px;border-radius:50%;background:${s.color}"></span>${shapeLabel(d.s)}</span>
    <h2 class="cc-title">${t('nuforcReport')}</h2>
    <p class="cc-loc">📍 ${d.loc || t('geocodedLocation')} · <a class="cc-map-link" href="${gmaps(d.lat, d.lng)}" target="_blank" rel="noopener">${t('satellite')} ↗</a></p>
    <div class="cc-row">
      <div class="cc-stat"><label>${t('date')}</label><span class="v">${fmtDateInt(d.d)}</span></div>
      <div class="cc-stat"><label>${t('localTime')}</label><span class="v">${d.h >= 0 ? String(d.h).padStart(2, '0') + ':00' : '—'}</span></div>
    </div>
    <div class="cc-row">
      <div class="cc-stat"><label>${t('coordinates')}</label><span class="v">${d.lat.toFixed(3)}, ${d.lng.toFixed(3)}</span></div>
      <div class="cc-stat"><label>${t('shape')}</label><span class="v">${shapeLabel(d.s)}</span></div>
    </div>
    <p class="cc-summary">${t('nuforcSummary')}</p>
    <div class="cc-sources"><h4>${t('source')}</h4>
      <a class="cc-source-link" href="https://nuforc.org/databank/" target="_blank" rel="noopener">${t('nuforcDatabank', { date: fmtDateInt(d.d) })}</a>
    </div>
    <div class="cc-media-actions">
      <a class="btn-ghost small" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${encodeURIComponent((d.loc || '') + ' ' + Math.floor(d.d / 10000) + ' UFO sighting')}">▶ ${t('searchVideos')}</a>
      <a class="btn-ghost small" target="_blank" rel="noopener" href="https://www.google.com/search?tbm=isch&q=${encodeURIComponent((d.loc || '') + ' ' + Math.floor(d.d / 10000) + ' UFO')}">🖼 ${t('searchImages')}</a>
    </div>`;
  $('panel-case').classList.remove('hidden');
  mobileOnCaseOpen();
}

function openGeipanReport(d) {
  closeStats();
  state.selectedCase = null;
  const g = GEIPAN_META[d.ci];
  const q = encodeURIComponent((d.zone || 'France') + ' ' + Math.floor(d.d / 10000) + ' OVNI UAP');
  $('case-content').innerHTML = `
    <span class="cc-type-badge" style="background:${g.color}22;color:${g.color};border:1px solid ${g.color}55">
      <span class="dot" style="width:8px;height:8px;border-radius:50%;background:${g.color}"></span>GEIPAN · ${geipanLabel(d.ci)}</span>
    <h2 class="cc-title">${t('geipanCase')}</h2>
    <p class="cc-loc">📍 ${d.zone || t('france')} · <span style="color:var(--txt-dim)">${t('departmentLocation')}</span></p>
    <div class="cc-row">
      <div class="cc-stat"><label>${t('date')}</label><span class="v">${fmtDateInt(d.d)}</span></div>
      <div class="cc-stat"><label>${t('classification')}</label><span class="v">${g.code}</span></div>
    </div>
    <p class="cc-summary">${d.resume || t('geipanSummary')}</p>
    <p class="hint">${geipanDesc(d.ci)}</p>
    <div class="cc-sources"><h4>${t('officialSource')}</h4>
      <a class="cc-source-link" href="https://www.cnes-geipan.fr/fr/recherche/cas" target="_blank" rel="noopener">GEIPAN — Recherche de cas</a>
    </div>
    <div class="cc-media-actions">
      <a class="btn-ghost small" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${q}">▶ ${t('searchVideos')}</a>
      <a class="btn-ghost small" target="_blank" rel="noopener" href="https://www.google.com/search?tbm=isch&q=${q}">🖼 ${t('searchImages')}</a>
    </div>`;
  $('panel-case').classList.remove('hidden');
  mobileOnCaseOpen();
}
$('btn-close-case').onclick = () => {
  $('panel-case').classList.add('hidden');
  state.selectedCase = null;
  scheduleHashUpdate();
};

// ---------- Search ----------
const searchInput = $('search'), searchResults = $('search-results');
searchInput.oninput = () => {
  const q = searchInput.value.trim().toLowerCase();
  if (q.length < 2) { searchResults.classList.add('hidden'); return; }
  const hits = allCuratedPool().filter(c =>
    caseName(c).toLowerCase().includes(q) || (caseLoc(c) || '').toLowerCase().includes(q) ||
    (caseCountry(c) || '').toLowerCase().includes(q) || c.name.toLowerCase().includes(q) ||
    (c.loc || '').toLowerCase().includes(q) || (c.country || '').toLowerCase().includes(q) || c.year.toString().includes(q)
  ).slice(0, 10);
  searchResults.innerHTML = hits.length
    ? hits.map(c => `
        <div class="sr-item" data-id="${c.id}">
          <span class="sr-dot" style="background:${TYPE_META[c.type].color}"></span>
          <div><div class="sr-name">${caseName(c)}</div>
          <div class="sr-meta">${c.year} · ${caseLoc(c)}${caseCountry(c) ? ', ' + caseCountry(c) : ''}</div></div>
        </div>`).join('')
    : `<div class="sr-item"><div class="sr-meta">${t('noResults')}</div></div>`;
  searchResults.classList.remove('hidden');
  searchResults.querySelectorAll('.sr-item[data-id]').forEach(el => {
    el.onclick = () => {
      searchResults.classList.add('hidden');
      searchInput.value = '';
      const c = allCuratedPool().find(x => x.id === el.dataset.id);
      if (c.year < state.yearFrom || c.year > state.yearTo) { state.yearFrom = YEAR_MIN; state.yearTo = YEAR_MAX; positionHandles(); }
      if (!state.types.has(c.type)) { state.types.add(c.type); document.querySelector(`.type-chip[data-type="${c.type}"]`)?.classList.remove('off'); }
      if (!c.mine && c.cred < state.credMin) { state.credMin = 1; $('cred-range').value = 1; $('cred-stars').textContent = '★☆☆☆☆'; }
      refresh();
      openCase(c.id, true);
    };
  });
};
document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrap')) searchResults.classList.add('hidden');
});

// ---------- Timeline: histogram ----------
const canvas = $('tl-canvas'), ctx = canvas.getContext('2d');
function drawHistogram() {
  const wrap = canvas.parentElement;
  const W = wrap.clientWidth, H = wrap.clientHeight;
  if (!W || !H) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr; canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);

  const span = YEAR_MAX - YEAR_MIN + 1;
  const counts = new Array(span).fill(0);
  allCuratedPool().forEach(c => {
    if (state.types.has(c.type) && (c.mine || c.cred >= state.credMin) && c.year >= YEAR_MIN && c.year <= YEAR_MAX)
      counts[c.year - YEAR_MIN]++;
  });
  if (state.massOn && massData) {
    massData.forEach(r => {
      if (r.year >= YEAR_MIN && r.year <= YEAR_MAX && state.shapes.has(r.s)) counts[r.year - YEAR_MIN]++;
    });
  }
  if (state.geipanOn && geipanData) {
    geipanData.forEach(r => {
      if (r.year >= YEAR_MIN && r.year <= YEAR_MAX && state.geipanClasses.has(r.ci)) counts[r.year - YEAR_MIN]++;
    });
  }
  // log scale (mass DB is exponentially skewed toward 2000s)
  const max = Math.max(1, ...counts);
  const bw = W / span;
  for (let i = 0; i < span; i++) {
    if (!counts[i]) continue;
    const h = Math.max(2, (Math.log10(1 + counts[i]) / Math.log10(1 + max)) * (H - 6));
    const year = YEAR_MIN + i;
    const inRange = year >= state.yearFrom && year <= state.yearTo;
    ctx.fillStyle = inRange ? 'rgba(75,225,195,0.85)' : 'rgba(120,140,180,0.28)';
    ctx.fillRect(i * bw + 1, H - h, Math.max(1.5, bw - 2), h);
  }
}

(function buildAxis() {
  const ax = $('tl-axis');
  for (let y = 1945; y <= YEAR_MAX; y += 10) {
    const s = document.createElement('span');
    s.textContent = y;
    ax.appendChild(s);
  }
})();

// ---------- Timeline: event markers ----------
function renderTimelineEvents() {
  const wrap = $('tl-events');
  wrap.innerHTML = '';
  TL_EVENTS.forEach((ev, i) => {
    const el = document.createElement('div');
    el.className = 'tl-event';
    el.style.left = yearToX(ev.year) + 'px';
    el.title = `${ev.year} — ${tlEventLabel(i, ev)}`;
    el.onclick = () => { openModal('disclosure'); };
    wrap.appendChild(el);
  });
}

// ---------- Timeline: range handles ----------
const range = $('tl-range'), hMin = $('handle-min'), hMax = $('handle-max'), fill = $('tl-fill');
function yearToX(year) {
  return ((year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * range.clientWidth;
}
function xToYear(x) {
  const t = Math.min(1, Math.max(0, x / range.clientWidth));
  return Math.round(YEAR_MIN + t * (YEAR_MAX - YEAR_MIN));
}
function positionHandles() {
  hMin.style.left = yearToX(state.yearFrom) + 'px';
  hMax.style.left = yearToX(state.yearTo) + 'px';
  fill.style.left = yearToX(state.yearFrom) + 'px';
  fill.style.width = (yearToX(state.yearTo) - yearToX(state.yearFrom)) + 'px';
}
function attachDrag(handle, isMin) {
  handle.addEventListener('pointerdown', e => {
    e.preventDefault();
    stopPlayback();
    handle.setPointerCapture(e.pointerId);
    const move = ev => {
      const rect = range.getBoundingClientRect();
      const y = xToYear(ev.clientX - rect.left);
      if (isMin) state.yearFrom = Math.min(y, state.yearTo);
      else state.yearTo = Math.max(y, state.yearFrom);
      positionHandles();
      refresh();
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  });
  handle.addEventListener('keydown', e => {
    const d = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
    if (!d) return;
    if (isMin) state.yearFrom = Math.min(Math.max(YEAR_MIN, state.yearFrom + d), state.yearTo);
    else state.yearTo = Math.max(Math.min(YEAR_MAX, state.yearTo + d), state.yearFrom);
    positionHandles(); refresh();
  });
}
attachDrag(hMin, true);
attachDrag(hMax, false);

range.addEventListener('pointerdown', e => {
  if (e.target.classList.contains('tl-handle')) return;
  const rect = range.getBoundingClientRect();
  const y = xToYear(e.clientX - rect.left);
  if (Math.abs(y - state.yearFrom) < Math.abs(y - state.yearTo)) state.yearFrom = Math.min(y, state.yearTo);
  else state.yearTo = Math.max(y, state.yearFrom);
  positionHandles(); refresh();
});

// ---------- Timeline: playback ----------
let rafId = null, lastT = 0, playCursor = 0, lastAppliedYear = null;
const WINDOW_YEARS = 10;

document.querySelectorAll('#play-mode button').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('#play-mode button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.playMode = btn.dataset.pmode;
  };
});
$('speed').oninput = e => { state.speed = +e.target.value; };

function startPlayback() {
  if (state.playing) return;
  state.playing = true;
  $('btn-play').textContent = '⏸';
  $('btn-play').classList.add('playing');
  globe.controls().autoRotate = false;
  playCursor = YEAR_MIN;
  lastAppliedYear = null;
  lastT = performance.now();
  rafId = requestAnimationFrame(tick);
}
function stopPlayback() {
  if (!state.playing) return;
  state.playing = false;
  $('btn-play').textContent = '▶';
  $('btn-play').classList.remove('playing');
  cancelAnimationFrame(rafId);
}
function tick(t) {
  if (!state.playing) return;
  const dt = (t - lastT) / 1000;
  lastT = t;
  playCursor += dt * state.speed;
  const y = Math.floor(playCursor);
  if (y > YEAR_MAX) { stopPlayback(); return; }
  if (y !== lastAppliedYear) {       // only re-filter when the year actually changes
    lastAppliedYear = y;
    if (state.playMode === 'cumulative') {
      state.yearFrom = YEAR_MIN;
      state.yearTo = Math.min(y, YEAR_MAX);
    } else {
      state.yearTo = Math.min(y, YEAR_MAX);
      state.yearFrom = Math.max(YEAR_MIN, state.yearTo - WINDOW_YEARS + 1);
    }
    positionHandles();
    refresh();
  }
  rafId = requestAnimationFrame(tick);
}
$('btn-play').onclick = () => state.playing ? stopPlayback() : startPlayback();

// ---------- Left panel collapse ----------
$('btn-collapse-left').onclick = () => {
  $('panel-left').classList.add('collapsed');
  $('btn-expand-left').classList.remove('hidden');
};
$('btn-expand-left').onclick = () => {
  $('panel-left').classList.remove('collapsed');
  $('btn-expand-left').classList.add('hidden');
};

// ---------- Stats panel ----------
function hbar(label, n, max, suffix) {
  return `<div class="hbar-row"><span class="hbar-label" title="${label}">${label}</span>
    <div class="hbar-track"><div class="hbar-fill" style="width:${Math.max(1, (n / Math.max(1, max)) * 100)}%"></div></div>
    <span class="hbar-n">${fmtNum(n)}${suffix || ''}</span></div>`;
}
function renderStats() {
  const curated = filteredCases();
  const mass = massFiltered();
  const geipan = geipanFiltered();
  // decades
  const dec = {};
  curated.forEach(c => { const d = Math.floor(c.year / 10) * 10; dec[d] = (dec[d] || 0) + 1; });
  mass.forEach(r => { const d = Math.floor(r.year / 10) * 10; dec[d] = (dec[d] || 0) + 1; });
  geipan.forEach(r => { const d = Math.floor(r.year / 10) * 10; dec[d] = (dec[d] || 0) + 1; });
  const decKeys = Object.keys(dec).map(Number).sort((a, b) => a - b);
  const decMax = Math.max(1, ...Object.values(dec));
  // GEIPAN by classification
  const gc = new Array(GEIPAN_META.length).fill(0);
  geipan.forEach(r => gc[r.ci]++);
  const gcMax = Math.max(1, ...gc);
  // shapes
  const sh = new Array(SHAPE_META.length).fill(0);
  mass.forEach(r => sh[r.s]++);
  const shMax = Math.max(1, ...sh);
  // top locations
  const locs = {};
  mass.forEach(r => { if (r.loc) locs[r.loc] = (locs[r.loc] || 0) + 1; });
  const topLocs = Object.entries(locs).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const locMax = topLocs.length ? topLocs[0][1] : 1;
  // day vs night
  let day = 0, night = 0, unk = 0;
  mass.forEach(r => { if (r.h < 0) unk++; else if (r.h >= 7 && r.h <= 19) day++; else night++; });

  $('stats-content').innerHTML = `
    <div class="kpi-row">
      <div class="kpi"><span class="n">${fmtNum(curated.length)}</span><label>${t('kpiCurated')}</label></div>
      <div class="kpi"><span class="n">${fmtNum(mass.length)}</span><label>NUFORC</label></div>
      <div class="kpi"><span class="n">${fmtNum(geipan.length)}</span><label>GEIPAN</label></div>
      <div class="kpi"><span class="n">${fmtNum(curated.length + mass.length + geipan.length)}</span><label>${t('total')}</label></div>
    </div>
    <div class="chart-block"><h4>${t('byDecade')}</h4>
      ${decKeys.map(d => hbar(d + 's', dec[d], decMax)).join('')}</div>
    ${geipan.length ? `
    <div class="chart-block"><h4>${t('geipanByClass')}</h4>
      ${GEIPAN_META.map((g, i) => ({ g, i, n: gc[i] })).filter(x => x.n).map(x => hbar(geipanLabel(x.i), x.n, gcMax)).join('')}</div>` : ''}
    ${mass.length ? `
    <div class="chart-block"><h4>${t('byShape')}</h4>
      ${SHAPE_META.map((s, i) => ({ s, i, n: sh[i] })).filter(x => x.n).sort((a, b) => b.n - a.n)
        .map(x => hbar(shapeLabel(x.i), x.n, shMax)).join('')}</div>
    <div class="chart-block"><h4>☀ ${t('dayVsNight')}</h4>
      ${hbar(t('daytime'), day, Math.max(day, night))}
      ${hbar(t('nighttime'), night, Math.max(day, night))}
      ${unk ? hbar(t('unknownTime'), unk, Math.max(day, night)) : ''}</div>
    <div class="chart-block"><h4>${t('topLocations')}</h4>
      ${topLocs.map(([l, n]) => hbar(l, n, locMax)).join('')}</div>` : `<p class="hint">${t('massStatsHint')}</p>`}
    <p class="hint">⚠ ${t('statsBias')}</p>`;
}
function openStats() {
  $('panel-case').classList.add('hidden');
  $('panel-stats').classList.remove('hidden');
  renderStats();
}
function closeStats() { $('panel-stats').classList.add('hidden'); }
$('btn-stats').onclick = () => $('panel-stats').classList.contains('hidden') ? openStats() : closeStats();
$('btn-close-stats').onclick = closeStats;

// ---------- Export ----------
function exportRows() {
  const curated = filteredCases().map(c => ({
    source: c.mine ? t('myNotebook') : `UFOlogist (${t('curated')})`,
    name: caseName(c), date: c.date, time: c.time || '', lat: c.lat, lng: c.lng,
    type: c.mine ? 'MINE' : c.type, type_label: typeLabel(c.type),
    location: (caseLoc(c) || '') + (caseCountry(c) ? ', ' + caseCountry(c) : ''),
    credibility: c.mine ? '' : c.cred, summary: caseSummary(c) || '',
    sources: (c.sources || []).map(s => s[1]).join(' | '),
  }));
  const mass = massFiltered().map(r => ({
    source: 'NUFORC',
    name: r.loc || 'reporte', date: `${Math.floor(r.d / 10000)}-${String(Math.floor(r.d / 100) % 100).padStart(2, '0')}-${String(r.d % 100).padStart(2, '0')}`,
    time: r.h >= 0 ? String(r.h).padStart(2, '0') + ':00' : '',
    lat: r.lat, lng: r.lng, type: SHAPE_META[r.s].code, type_label: shapeLabel(r.s),
    location: r.loc || '', credibility: '', summary: '', sources: 'https://nuforc.org/databank/',
  }));
  const geipan = geipanFiltered().map(r => ({
    source: 'GEIPAN (CNES)',
    name: (r.zone || 'France') + ' ' + Math.floor(r.d / 10000), date: `${Math.floor(r.d / 10000)}-${String(Math.floor(r.d / 100) % 100).padStart(2, '0')}-${String(r.d % 100).padStart(2, '0')}`,
    time: '', lat: r.lat, lng: r.lng, type: GEIPAN_META[r.ci].code, type_label: geipanLabel(r.ci),
    location: r.zone || '', credibility: '', summary: r.resume || '', sources: 'https://www.cnes-geipan.fr/fr/recherche/cas',
  }));
  return curated.concat(mass, geipan);
}
function download(filename, text, mime) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: mime }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
$('btn-export-json').onclick = () => {
  const rows = exportRows();
  download(`ufologist-export-${state.yearFrom}-${state.yearTo}.json`, JSON.stringify(rows, null, 1), 'application/json');
  toast(t('exportedJson', { count: fmtNum(rows.length) }));
};
$('btn-export-csv').onclick = () => {
  const rows = exportRows();
  if (!rows.length) { toast(t('exportEmpty')); return; }
  const cols = Object.keys(rows[0]);
  const esc = v => '"' + String(v).replace(/"/g, '""') + '"';
  const csv = cols.join(',') + '\n' + rows.map(r => cols.map(c => esc(r[c])).join(',')).join('\n');
  download(`ufologist-export-${state.yearFrom}-${state.yearTo}.csv`, csv, 'text/csv');
  toast(t('exportedCsv', { count: fmtNum(rows.length) }));
};

// ---------- Permalink (URL hash state) ----------
let hashTimer = null, applyingHash = false;
function encodeHash() {
  const p = new URLSearchParams();
  if (state.yearFrom !== YEAR_MIN || state.yearTo !== YEAR_MAX) p.set('y', state.yearFrom + '-' + state.yearTo);
  if (state.types.size !== Object.keys(TYPE_META).length) p.set('t', [...state.types].join('.'));
  if (state.credMin > 1) p.set('c', state.credMin);
  if (state.layerMode !== 'both') p.set('l', state.layerMode);
  if (!state.massOn) p.set('m', '0');
  if (state.shapes.size !== SHAPE_META.length) p.set('s', [...state.shapes].join('.'));
  if (state.tod !== 'all') p.set('h', state.tod);
  if (!state.geipanOn) p.set('g', '0');
  if (state.geipanClasses.size !== GEIPAN_META.length) p.set('gc', [...state.geipanClasses].join('.'));
  if (state.hotspots) p.set('hs', '1');
  if (state.selectedCase) p.set('case', state.selectedCase);
  return p.toString();
}
function scheduleHashUpdate() {
  if (applyingHash) return;
  clearTimeout(hashTimer);
  hashTimer = setTimeout(() => { history.replaceState(null, '', '#' + encodeHash()); }, 300);
}
scheduleHashUpdate.flush = () => { clearTimeout(hashTimer); history.replaceState(null, '', '#' + encodeHash()); };
function applyHash() {
  if (!location.hash || location.hash.length < 2) return null;
  applyingHash = true;
  try {
    const p = new URLSearchParams(location.hash.slice(1));
    if (p.get('y')) {
      const [a, b] = p.get('y').split('-').map(Number);
      if (a >= YEAR_MIN && b <= YEAR_MAX && a <= b) { state.yearFrom = a; state.yearTo = b; }
    }
    if (p.get('t')) state.types = new Set(p.get('t').split('.').filter(t => TYPE_META[t]));
    if (p.get('c')) state.credMin = Math.min(5, Math.max(1, +p.get('c')));
    if (p.get('l') && ['both', 'heat', 'points'].includes(p.get('l'))) state.layerMode = p.get('l');
    if (p.get('m') === '0') state.massOn = false;
    if (p.get('s')) state.shapes = new Set(p.get('s').split('.').map(Number).filter(i => i >= 0 && i < SHAPE_META.length));
    if (p.get('h') && ['day', 'night'].includes(p.get('h'))) state.tod = p.get('h');
    if (p.get('g') === '0') state.geipanOn = false;
    if (p.get('gc')) state.geipanClasses = new Set(p.get('gc').split('.').map(Number).filter(i => i >= 0 && i < GEIPAN_META.length));
    if (p.get('hs') === '1') state.hotspots = true;
    return p.get('case');
  } finally { applyingHash = false; }
}
$('btn-permalink').onclick = () => {
  scheduleHashUpdate.flush();
  navigator.clipboard.writeText(location.href).then(() => toast(t('filtersCopied')));
};

// ---------- Toast ----------
let toastTimer = null;
function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 2600);
}

// ---------- Journal: add sighting ----------
$('btn-add').onclick = () => {
  state.pickMode = true;
  $('pick-hint').classList.remove('hidden');
  globe.controls().autoRotate = false;
  toast(t('registerMode'));
};
$('pick-cancel').onclick = () => { state.pickMode = false; $('pick-hint').classList.add('hidden'); };
function pickLocation(lat, lng) {
  state.pickMode = false;
  $('pick-hint').classList.add('hidden');
  $('sf-lat').value = lat.toFixed(4);
  $('sf-lng').value = lng.toFixed(4);
  $('sf-date').value = new Date().toISOString().slice(0, 10);
  const sel = $('sf-shape');
  sel.innerHTML = '';
  SHAPE_META.forEach((s, i) => sel.add(new Option(shapeLabel(i), i)));
  $('sight-overlay').classList.remove('hidden');
  $('sf-name').focus();
}
$('sight-close').onclick = () => $('sight-overlay').classList.add('hidden');
$('sight-overlay').addEventListener('click', e => { if (e.target === $('sight-overlay')) $('sight-overlay').classList.add('hidden'); });
$('sf-save').onclick = () => {
  const name = $('sf-name').value.trim();
  const date = $('sf-date').value;
  const lat = parseFloat($('sf-lat').value), lng = parseFloat($('sf-lng').value);
  if (!name || !date || !isFinite(lat) || !isFinite(lng)) { toast(t('missingSighting')); return; }
  const entry = {
    id: 'my-' + Date.now(),
    name, date, time: $('sf-time').value || '',
    lat, lng,
    loc: t('registeredInNotebook') + ($('sf-time').value ? ' · ' + $('sf-time').value : ''),
    country: '', type: 'MINE', cred: 0, mine: true,
    year: +date.slice(0, 4),
    summary: ($('sf-notes').value.trim() || '') + ' [' + t('shape') + ': ' + shapeLabel(+$('sf-shape').value) + ']',
    sources: [],
  };
  journal.push(entry);
  saveJournal();
  state.types.add('MINE');
  $('sight-overlay').classList.add('hidden');
  ['sf-name', 'sf-notes', 'sf-time'].forEach(i => $(i).value = '');
  buildTypeFilters();
  refresh();
  openCase(entry.id, true);
  toast(`${t('savedSighting')} 📓`);
};

// ---------- Expedition tour ----------
const TOUR_DWELL = 14000; // ms per stop
let tour = { active: false, idx: 0, timer: null, paused: false, t0: 0, remaining: 0 };

function tourStart() {
  tour.active = true; tour.idx = 0; tour.paused = false;
  stopPlayback();
  $('tour-card').classList.remove('hidden');
  tourGo(0);
}
function tourGo(i) {
  const ids = TOUR_IDS.filter(id => CASES.some(c => c.id === id));
  if (i < 0) i = 0;
  if (i >= ids.length) { tourEnd(); return; }
  tour.idx = i;
  const c = CASES.find(x => x.id === ids[i]);
  $('tour-progress').textContent = (i + 1) + '/' + ids.length;
  $('tour-title').textContent = c.year + ' — ' + caseName(c);
  $('tour-text').textContent = caseSummary(c);
  openCase(c.id, false);
  globe.pointOfView({ lat: c.lat, lng: c.lng, altitude: 1.25 }, 1600);
  clearTimeout(tour.timer);
  tour.t0 = performance.now();
  tour.remaining = TOUR_DWELL;
  if (!tour.paused) tour.timer = setTimeout(() => tourGo(i + 1), TOUR_DWELL);
  animateTourBar();
}
let tourBarRaf = null;
function animateTourBar() {
  cancelAnimationFrame(tourBarRaf);
  const step = () => {
    if (!tour.active) return;
    const el = $('tour-bar-fill');
    if (tour.paused) { el.style.width = (100 - (tour.remaining / TOUR_DWELL) * 100) + '%'; }
    else {
      const elapsed = performance.now() - tour.t0;
      el.style.width = Math.min(100, (elapsed / TOUR_DWELL) * 100) + '%';
    }
    tourBarRaf = requestAnimationFrame(step);
  };
  step();
}
function tourEnd() {
  tour.active = false;
  clearTimeout(tour.timer);
  cancelAnimationFrame(tourBarRaf);
  $('tour-card').classList.add('hidden');
}
$('btn-tour').onclick = () => tour.active ? tourEnd() : tourStart();
$('tour-close').onclick = tourEnd;
$('tour-next').onclick = () => { tour.paused = false; $('tour-pause').textContent = `⏸ ${t('pause')}`; tourGo(tour.idx + 1); };
$('tour-prev').onclick = () => { tour.paused = false; $('tour-pause').textContent = `⏸ ${t('pause')}`; tourGo(tour.idx - 1); };
$('tour-pause').onclick = () => {
  if (tour.paused) {
    tour.paused = false;
    $('tour-pause').textContent = `⏸ ${t('pause')}`;
    tour.t0 = performance.now() - (TOUR_DWELL - tour.remaining);
    tour.timer = setTimeout(() => tourGo(tour.idx + 1), tour.remaining);
  } else {
    tour.paused = true;
    $('tour-pause').textContent = `▶ ${t('resume')}`;
    clearTimeout(tour.timer);
    tour.remaining = Math.max(0, TOUR_DWELL - (performance.now() - tour.t0));
  }
};

// ---------- Knowledge modal ----------
// ---------- "Anatomía de un encuentro" — animated SVG dioramas ----------
const SAUCER = (cls) => `<g class="${cls}">
  <ellipse cx="0" cy="0" rx="22" ry="6.5" fill="var(--c)" fill-opacity=".85"/>
  <path d="M-11,-2.5 A11,8 0 0 1 11,-2.5 Z" fill="var(--c)" fill-opacity=".5"/>
  <circle cx="-9" cy="2" r="1.5" fill="#fff"/><circle cx="0" cy="2.6" r="1.5" fill="#fff"/><circle cx="9" cy="2" r="1.5" fill="#fff"/></g>`;
const BEING = (fill) => `<ellipse cx="0" cy="-9" rx="3.5" ry="4.5" fill="${fill}"/><rect x="-3" y="-5" width="6" height="13" rx="2.5" fill="${fill}"/>`;

const ANATOMY = [
  { code:'NL', caseId:'hessdalen-1984', scene:`
    <rect class="an-ground" x="0" y="112" width="240" height="28"/>
    <circle class="an-pulse" cx="78" cy="48" r="6" fill="var(--c)"/>
    <circle class="an-pulse d2" cx="138" cy="38" r="5" fill="var(--c)"/>
    <circle class="an-pulse d3" cx="170" cy="62" r="4" fill="var(--c)"/>` },
  { code:'DD', caseId:'mcminnville-1950', day:true, scene:`
    <circle cx="200" cy="34" r="14" fill="#ffe9a8" fill-opacity=".8"/>
    <g class="an-cross">${SAUCER('')}</g>` },
  { code:'RV', caseId:'washington-1952', scene:`
    <circle cx="70" cy="72" r="46" fill="none" stroke="var(--c)" stroke-opacity=".3"/>
    <circle cx="70" cy="72" r="28" fill="none" stroke="var(--c)" stroke-opacity=".18"/>
    <line x1="24" y1="72" x2="116" y2="72" stroke="var(--c)" stroke-opacity=".15"/>
    <line x1="70" y1="26" x2="70" y2="118" stroke="var(--c)" stroke-opacity=".15"/>
    <g class="an-sweep"><path d="M70,72 L70,26 A46,46 0 0 1 103,40 Z" fill="var(--c)" fill-opacity=".2"/></g>
    <circle class="an-pulse" cx="94" cy="50" r="3.5" fill="var(--c)"/>
    <g transform="translate(185,58)"><path d="M-16,0 L12,0 L18,-1.5 M0,0 L-6,-9 M0,0 L-6,9 M-12,0 L-17,-6" stroke="#cdd8ef" stroke-width="1.4" fill="none"/></g>` },
  { code:'CE1', caseId:'exeter-1965', scene:`
    <rect class="an-ground" x="0" y="112" width="240" height="28"/>
    <g transform="translate(120,52)">${SAUCER('an-bob')}</g>
    <line x1="120" y1="66" x2="120" y2="108" stroke="var(--c)" stroke-dasharray="3 3" stroke-opacity=".6"/>
    <line x1="113" y1="108" x2="127" y2="108" stroke="var(--c)"/>
    <line x1="113" y1="66" x2="127" y2="66" stroke="var(--c)" stroke-opacity=".6"/>
    <text x="134" y="92" class="an-label">&lt;150 m</text>` },
  { code:'CE2', caseId:'trans-en-provence-1981', scene:`
    <rect class="an-ground" x="0" y="112" width="240" height="28"/>
    <g transform="translate(126,50)">${SAUCER('an-bob')}</g>
    <ellipse class="an-trace" cx="126" cy="113" rx="30" ry="5" fill="none" stroke="var(--c)" stroke-width="1.5"/>
    <path class="an-em" d="M44,34 l9,11 l-7,4 l11,13" stroke="var(--c)" fill="none" stroke-width="2.2"/>` },
  { code:'CE3', caseId:'socorro-1964', scene:`
    <rect class="an-ground" x="0" y="112" width="240" height="28"/>
    <g transform="translate(92,96)">${SAUCER('')}<line x1="-11" y1="5" x2="-14" y2="16" stroke="var(--c)"/><line x1="11" y1="5" x2="14" y2="16" stroke="var(--c)"/></g>
    <g class="an-sway" transform="translate(156,110)">${BEING('#cdd8ef')}</g>
    <g class="an-sway d2" transform="translate(174,111)">${BEING('#9fb0d0')}</g>` },
  { code:'CE4', caseId:'travis-walton-1975', scene:`
    <rect class="an-ground" x="0" y="112" width="240" height="28"/>
    <g transform="translate(120,40)">${SAUCER('an-bob')}</g>
    <path class="an-beam" d="M104,46 L136,46 L150,112 L90,112 Z" fill="var(--c)"/>
    <g class="an-rise">${BEING('#fff')}</g>` },
  { code:'MIL', caseId:'nimitz-2004', scene:`
    <g transform="translate(58,72)"><path d="M-18,0 L12,0 L20,-1.5 L12,1.5 Z M-2,0 L7,-10 M-2,1 L7,11 M-12,0 L-18,-7" stroke="#cdd8ef" stroke-width="1.5" fill="#cdd8ef" fill-opacity=".5"/></g>
    <g transform="translate(172,56)">${SAUCER('an-bob')}</g>
    <g class="an-pulse" transform="translate(172,56)"><circle r="21" fill="none" stroke="var(--c)" stroke-width="1.2"/><line x1="-27" y1="0" x2="-23" y2="0" stroke="var(--c)"/><line x1="23" y1="0" x2="27" y2="0" stroke="var(--c)"/><line x1="0" y1="-27" x2="0" y2="-23" stroke="var(--c)"/><line x1="0" y1="23" x2="0" y2="27" stroke="var(--c)"/></g>` },
  { code:'USO', caseId:'shag-harbour-1967', scene:`
    <rect class="an-water" x="0" y="94" width="240" height="46"/>
    <g class="an-dive"><circle cx="120" cy="0" r="8" fill="var(--c)"/><circle cx="120" cy="0" r="3" fill="#fff" fill-opacity=".7"/></g>
    <ellipse class="an-ripple" cx="120" cy="94" rx="7" ry="2.4" fill="none" stroke="var(--c)" stroke-width="1.5"/>
    <ellipse class="an-ripple d2" cx="120" cy="94" rx="7" ry="2.4" fill="none" stroke="var(--c)" stroke-width="1.5"/>` },
  { code:'MASS', caseId:'phoenix-1997', scene:`
    <rect class="an-ground" x="0" y="116" width="240" height="24"/>
    <g transform="translate(120,46) scale(1.55)">${SAUCER('an-bob')}</g>
    <g class="an-crowd" fill="#8595b8">
      <g transform="translate(70,116)"><circle cy="-7" r="3"/><rect x="-2.5" y="-4" width="5" height="11" rx="2"/></g>
      <g transform="translate(96,116)"><circle cy="-7" r="3"/><rect x="-2.5" y="-4" width="5" height="11" rx="2"/></g>
      <g transform="translate(122,116)"><circle cy="-7" r="3"/><rect x="-2.5" y="-4" width="5" height="11" rx="2"/></g>
      <g transform="translate(148,116)"><circle cy="-7" r="3"/><rect x="-2.5" y="-4" width="5" height="11" rx="2"/></g>
      <g transform="translate(174,116)"><circle cy="-7" r="3"/><rect x="-2.5" y="-4" width="5" height="11" rx="2"/></g>
    </g>` },
];
function buildAnatomy() {
  return `
    <h3>${t('anatomyTitle')}</h3>
    <p>${t('anatomyIntro')}</p>
    <div class="anatomy-grid">
      ${ANATOMY.map(a => {
        const m = TYPE_META[a.code];
        return `<div class="anatomy-card" style="--c:${m.color}">
          <div class="anatomy-scene${a.day ? ' scene-day' : ''}">
            <svg class="anat-svg" viewBox="0 0 240 140" preserveAspectRatio="xMidYMid slice">${a.scene}</svg>
          </div>
          <div class="anatomy-meta">
            <b>${typeLabel(a.code)} <span class="an-code">[${a.code}]</span></b>
            <p>${typeDesc(a.code)}</p>
            <button class="anatomy-go" data-go="${a.caseId}">${t('realCase')} →</button>
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

const TABS = {
  hynek: () => `
    <h3>${t('classificationTitle')}</h3>
    <p>${t('classificationIntro')}</p>
    ${Object.entries(TYPE_META).filter(([c]) => c !== 'MINE').map(([code, m]) => `
      <div class="k-type-card">
        <span class="dot" style="background:${m.color};color:${m.color}"></span>
        <div><b>${typeLabel(code)} <span style="color:#5b6886;font-family:'JetBrains Mono',monospace;font-size:11px">[${code}]</span></b>
        <span>${typeDesc(code)}</span></div>
      </div>`).join('')}
    <h3>${t('reportedShapesTitle')}</h3>
    <p>${t('reportedShapesIntro')}</p>
    ${SHAPE_META.map((s, i) => `<span class="shape-pill" style="cursor:default;margin:2px"><span class="sdot" style="background:${s.color}"></span>${shapeLabel(i)}</span>`).join(' ')}`,
  anatomy: () => buildAnatomy(),
  disclosure: () => `
    <h3>${t('disclosureTitle')}</h3>
    <p>${t('disclosureIntro')}</p>
    ${DISCLOSURE_TIMELINE.map((d, i) => `
      <div class="dt-item">
        <div class="dt-year">${d.year}</div>
        <div class="dt-body"><b>${disclosureTitle(i, d)}</b><p>${disclosureText(i, d)}</p></div>
      </div>`).join('')}`,
  glossary: () => `
    <h3>${t('glossaryTitle')}</h3>
    ${glossaryRows().map(([term, def]) => `<div class="gl-item"><b>${term}</b><p>${def}</p></div>`).join('')}`,
  method: () => `
    <h3>${t('methodologyTitle')}</h3>
    <p>${methodologyNotes()}</p>
    <table class="cred-table">
      ${methodologyCred().map(([n, txt]) => `<tr><td>${'★'.repeat(n)}${'☆'.repeat(5 - n)}</td><td>${txt}</td></tr>`).join('')}
    </table>
    <h3>${t('dataLayersTitle')}</h3>
    <p>${t('curatedLayer')}</p>
    <p>${t('massLayer')}</p>`,
  report: () => `
    <h3>${t('reportTitle')}</h3>
    <p>${t('reportIntro')}</p>
    ${reportLinks().map(([label, url]) => `<a class="cc-source-link" href="${url}" target="_blank" rel="noopener">${label}</a>`).join('')}`,
};

function openModal(tab) {
  $('modal-overlay').classList.remove('hidden');
  switchTab(tab || 'hynek');
}
function switchTab(tab) {
  if (!TABS[tab]) tab = 'hynek';
  document.querySelectorAll('#modal-tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  $('modal-body').innerHTML = TABS[tab]();
  $('modal-body').scrollTop = 0;
}
document.querySelectorAll('#modal-tabs button').forEach(b => { b.onclick = () => switchTab(b.dataset.tab); });
// "ver caso real" in the Anatomy tab → close modal and fly to the example case
$('modal-body').addEventListener('click', e => {
  const b = e.target.closest('.anatomy-go');
  if (!b) return;
  $('modal-overlay').classList.add('hidden');
  openCase(b.dataset.go, true);
});
$('btn-knowledge').onclick = () => openModal('hynek');
$('btn-close-modal').onclick = () => $('modal-overlay').classList.add('hidden');
$('modal-overlay').addEventListener('click', e => {
  if (e.target === $('modal-overlay')) $('modal-overlay').classList.add('hidden');
});

function openAppInfo() { $('app-info-overlay').classList.remove('hidden'); }
function closeAppInfo() { $('app-info-overlay').classList.add('hidden'); }
$('btn-about').onclick = openAppInfo;
$('btn-close-app-info').onclick = closeAppInfo;
$('app-info-overlay').addEventListener('click', e => {
  if (e.target === $('app-info-overlay')) closeAppInfo();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    $('modal-overlay').classList.add('hidden');
    closeAppInfo();
    $('panel-case').classList.add('hidden');
    $('sight-overlay').classList.add('hidden');
    closeStats();
    if (state.pickMode) { state.pickMode = false; $('pick-hint').classList.add('hidden'); }
  }
  if (e.key === ' ' && !e.target.closest('input,textarea,select')) { e.preventDefault(); $('btn-play').click(); }
});

// ---------- Mobile: bottom-sheet navigation ----------
const mq = window.matchMedia('(max-width: 760px)');
function isMobile() { return mq.matches; }
const SHEET_IDS = ['panel-left', 'timeline', 'panel-stats', 'panel-case', 'mobile-more'];

function setNav(active) {
  document.querySelectorAll('#mobile-nav button').forEach(b =>
    b.classList.toggle('active', b.dataset.sheet === active));
}
function closeSheets() {
  SHEET_IDS.forEach(id => $(id).classList.add('hidden'));
  state.selectedCase = null;
  $('sheet-backdrop').classList.remove('show');
  setNav('globe');
}
function openSheet(id) {
  SHEET_IDS.forEach(s => { if (s !== id) $(s).classList.add('hidden'); });
  $('panel-left').classList.remove('collapsed');
  $(id).classList.remove('hidden');
  $('sheet-backdrop').classList.add('show');
  setNav(id);
  if (id === 'timeline') requestAnimationFrame(() => { positionHandles(); drawHistogram(); renderTimelineEvents(); });
  if (id === 'panel-stats') renderStats();
}
// openCase()/openMassReport() call this so the case sheet behaves like the rest
function mobileOnCaseOpen() {
  if (!isMobile()) return;
  ['panel-left', 'timeline', 'panel-stats', 'mobile-more'].forEach(id => $(id).classList.add('hidden'));
  $('sheet-backdrop').classList.add('show');
  setNav(null);
}
function mobileOnSheetClose() {
  if (!isMobile()) return;
  $('sheet-backdrop').classList.remove('show');
  setNav('globe');
}

document.querySelectorAll('#mobile-nav button').forEach(b => {
  b.onclick = () => {
    const t = b.dataset.sheet;
    if (t === 'globe') { closeSheets(); return; }
    $(t).classList.contains('hidden') ? openSheet(t) : closeSheets();
  };
});
$('sheet-backdrop').onclick = closeSheets;
$('btn-close-more').onclick = closeSheets;

// "Más" sheet reuses the existing (hidden on mobile) top-bar handlers
document.querySelectorAll('#mobile-more .more-grid button').forEach(b => {
  const map = { add: 'btn-add', tour: 'btn-tour', knowledge: 'btn-knowledge', about: 'btn-about',
    audio: 'btn-audio', csv: 'btn-export-csv', json: 'btn-export-json', permalink: 'btn-permalink' };
  b.onclick = () => {
    const act = b.dataset.act;
    closeSheets();
    if (act === 'stats') { openSheet('panel-stats'); return; }
    const id = map[act];
    if (id) $(id).click();
  };
});

// keep backdrop/nav in sync when a sheet is closed via its own ✕
$('btn-close-stats').addEventListener('click', mobileOnSheetClose);
$('btn-close-case').addEventListener('click', mobileOnSheetClose);

let wasMobile = null;
function applyPerfTier(m) {
  // m = mobile. Phones: cap pixel ratio (the #1 cost on retina), drop the
  // bump-map shader and the night-sky background sphere, and coarsen the
  // heatmap so far fewer extruded hexagons are generated.
  try { globe.renderer().setPixelRatio(Math.min(window.devicePixelRatio || 1, m ? 1.5 : 2)); } catch (e) {}
  globe.bumpImageUrl(m ? null : 'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png')
       .backgroundImageUrl(m ? null : 'https://cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png')
       .backgroundColor(m ? 'rgba(0,0,0,0)' : '#000011')
       .hexBinResolution(m ? 2 : 3);
}
function applyMobileLayout() {
  const m = isMobile();
  if (m === wasMobile) return;   // only act when crossing the breakpoint
  wasMobile = m;
  document.body.classList.toggle('is-mobile', m);
  applyPerfTier(m);
  if (m) {
    closeSheets();
    globe.controls().autoRotate = true;
    globe.pointOfView({ lat: 22, lng: -30, altitude: 2.9 }, 0);
  } else {
    $('sheet-backdrop').classList.remove('show');
    $('panel-left').classList.remove('hidden', 'collapsed');
    $('timeline').classList.remove('hidden');
    ['panel-stats', 'panel-case', 'mobile-more'].forEach(id => $(id).classList.add('hidden'));
  }
  refresh();   // rebins the heatmap at the new resolution + re-applies marker rules
}
mq.addEventListener ? mq.addEventListener('change', applyMobileLayout) : mq.addListener(applyMobileLayout);

// ---------- Init ----------
// browsers restore form values across reloads — force controls to match state
const startCase = applyHash();
$('speed').value = state.speed;
$('cred-range').value = state.credMin;
$('cred-stars').textContent = '★'.repeat(state.credMin) + '☆'.repeat(5 - state.credMin);
$('mass-toggle').checked = state.massOn;
$('geipan-toggle').checked = state.geipanOn;
$('hotspots-toggle').checked = state.hotspots;
document.querySelectorAll('#layer-mode button').forEach(b => b.classList.toggle('active', b.dataset.mode === state.layerMode));
document.querySelectorAll('#tod-filter button').forEach(b => b.classList.toggle('active', b.dataset.tod === state.tod));
buildTypeFilters();
buildShapeFilters();
buildGeipanFilters();
positionHandles();
renderTimelineEvents();
refresh();
applyMobileLayout();
if (startCase) setTimeout(() => openCase(startCase, true), 800);
setTimeout(() => { positionHandles(); drawHistogram(); renderTimelineEvents(); }, 300);

})();
