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
const RESEARCH_PASS_EMAIL = 'mgrconcept@gmail.com';
const PASS_INTENT_KEY = 'ufologist-research-pass-intent';
const I18N = {
  es: {
    metaTitle: 'UFOlogist — Atlas global del fenómeno UAP',
    metaDescription: 'Atlas interactivo de avistamientos OVNI/UAP documentados: globo 3D, 80.000+ reportes, mapa de calor, línea de tiempo y fuentes originales.',
    brandTag: 'Observing the Unknown.',
    searchPlaceholder: 'Buscar caso o lugar...',
    loading: 'Inicializando atlas orbital...',
    landingTag: 'Observing the Unknown.',
    landingSteps: ['Cargando encuentros...', 'Investigando datos desclasificados...', 'Enlazando con fuentes online...', 'Calibrando el atlas orbital...'],
    landingReady: 'Atlas listo.',
    indexedReports: 'reportes indexados',
    enterAtlas: 'Entrar al atlas ->',
    navKnowledge: 'Conocimiento',
    navStats: 'Análisis',
    navReport: 'Reportar',
    navInfo: 'Info',
    navTour: 'Expedición',
    navPass: 'Pass',
    viewEarth: 'Tierra',
    viewOrbit: 'Órbita',
    titleKnowledge: 'Centro de conocimiento',
    titleStats: 'Panel de análisis y tendencias',
    titleReport: 'Reportar o registrar un avistamiento propio',
    titleInfo: 'Información sobre UFOlogist',
    titleTour: 'Tour guiado por los casos esenciales',
    titlePass: 'UFOlogist Research Pass',
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
    heat: 'Densidad',
    cases: 'Casos',
    hotspots: 'Hotspots legendarios',
    massDb: 'Base masiva NUFORC',
    loadingShort: 'cargando...',
    nuforcSwitch: '80.332 reportes geolocalizados (1906-2014)',
    geipanDb: 'Base GEIPAN · Francia',
    geipanSwitch: 'Casos oficiales del CNES (1937-2018)',
    officialArchives: 'Archivos oficiales',
    officialSwitch: 'Candidatos normalizados en revisión',
    officialHint: 'Incluye casos aún no publicados: NARA, UK MoD, España, Chile y Argentina.',
    officialCase: 'Caso oficial en revisión',
    officialReview: 'Pendiente de revisión',
    officialNoCoords: 'sin coordenadas todavía',
    officialGeoHint: '{geo} geolocalizados de {total}',
    officialShort: 'oficiales',
    mapShort: 'mapa',
    geoQuality: 'Precisión geográfica',
    geoQualityHint: 'Separa coordenadas reportadas, locales, regionales y amplias para no mezclar patrones fuertes con ubicaciones aproximadas.',
    geoReported: 'Reportada',
    geoReportedDesc: 'Coordenadas reportadas por la fuente o por el cuaderno local.',
    geoLocal: 'Local',
    geoLocalDesc: 'Ubicación a nivel de localidad, ciudad, aeropuerto o instalación.',
    geoRegional: 'Regional',
    geoRegionalDesc: 'Ubicación aproximada a nivel de condado, provincia, región, isla o área.',
    geoBroad: 'Amplia',
    geoBroadDesc: 'Solo país o ubicación muy amplia. Útil para inventario, débil para patrones finos.',
    geoContext: 'Contexto geográfico',
    geoContextHint: 'Filtra encuentros cerca de bases militares, sobre agua/mar, en costa o claramente interiores.',
    ctxMilitary: 'Base militar',
    ctxMilitaryDesc: 'Caso etiquetado como militar o situado cerca de una base, aeródromo o instalación naval conocida.',
    ctxWater: 'Mar / agua',
    ctxWaterDesc: 'Ubicación o descripción sobre océano, mar, lago, bahía, río o zona marítima.',
    ctxCoastal: 'Costa',
    ctxCoastalDesc: 'Lugar costero, isla, puerto, cabo, playa o área próxima a litoral.',
    ctxInland: 'Interior',
    ctxInlandDesc: 'Sin señal clara de costa, mar o agua cercana en los datos disponibles.',
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
    modalTabs: ['Clasificación', 'Anatomía', 'Disclosure USA', 'Glosario', 'Metodología', 'Fuentes', 'Reportar'],
    appInfoTitle: 'Sobre UFOlogist',
    appInfoIntro: '<b>UFOlogist</b> es un atlas interactivo independiente para explorar el fenómeno UAP con contexto, fuentes y una mirada crítica. La intención no es empujar una conclusión cerrada, sino ordenar el material, separar evidencia de ruido y hacer visible dónde están los patrones.',
    appInfoAuthorTitle: 'Mensaje del autor',
    appInfoAuthor: 'He construido esta herramienta para curiosos exigentes: personas que quieren mirar los casos sin cinismo automático, pero también sin perder el criterio. Si algo te intriga, abre las fuentes, compara versiones y mantén la pregunta viva.',
    appInfoCopyrightTitle: 'Autoría y copyright',
    appInfoCopyright: 'Creado por <b>Miquel Gelabert</b>. © Miquel Gelabert 2026 · UFOlogist.',
    appInfoNote: 'Proyecto divulgativo e independiente. No afiliado a NUFORC, GEIPAN, CNES, AARO ni a ningún organismo oficial. El código se publica bajo licencia MIT. Los datos y fuentes enlazadas pertenecen a sus respectivos titulares y se usan con fines de divulgación e investigación.',
    passEyebrow: 'UFOlogist Research Pass',
    passTitle: 'Financia herramientas de investigación, no un muro de pago.',
    passIntro: 'El atlas seguirá abierto. El pass está pensado para quienes quieran apoyar el proyecto y recibir utilidades avanzadas cuando estén listas.',
    passFeatures: [
      ['Exportaciones limpias', 'CSV/JSON extendidos, paquetes por caso y bibliografía preparada para investigación.'],
      ['Cuadernos avanzados', 'Colecciones, notas cruzadas, seguimiento de fuentes y preparación para sincronización.'],
      ['Alertas y dossiers', 'Notificaciones de nuevas fuentes, comparativas por oleada y dossiers descargables.'],
    ],
    passPlans: ['4 €/mes', '29 €/año', 'Fundador'],
    passEmail: 'Email',
    passEmailPlaceholder: 'tu@email.com',
    passCta: 'Solicitar acceso',
    passNote: 'Sin popups, sin bloqueo de datos, sin publicidad invasiva. Primero se valida interés; después se puede conectar Stripe o Lemon Squeezy.',
    passEmailMissing: 'Añade un email para solicitar acceso',
    passInterestSaved: 'Solicitud preparada',
    passMailSubject: 'UFOlogist Research Pass',
    passMailBody: 'Hola Miquel,\n\nQuiero solicitar acceso al UFOlogist Research Pass.\nPlan: {plan}\nEmail: {email}\n\nGracias.',
    mobileMenu: 'Menú',
    mobileExport: 'Exportar selección',
    mobileHelp: 'Pulsa un punto del globo para abrir su ficha. Arrastra el globo para girarlo.',
    mobileGlobe: 'Globo',
    mobileFilters: 'Filtros',
    mobileTime: 'Tiempo',
    mobileData: 'Datos',
    mobileMore: 'Más',
    curated: 'curados',
    heatSuffix: 'densidad',
    densityLegend: 'Densidad de encuentros',
    densityLow: 'baja',
    densityMid: 'media',
    densityHigh: 'alta',
    narrowHint: 'acota para ver puntos individuales',
    sampledPointsHint: 'mostrando {shown} puntos de {total} casos filtrados',
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
    sourceAtlasTitle: 'Atlas de fuentes',
    sourceAtlasIntro: 'La app renderiza datasets compactos para velocidad, pero la capa de investigación debe vivir en un modelo normalizado: fuentes, casos, observaciones, enlaces, tags y relaciones. Esta cola prioriza qué archivos añadir sin confundir fuente con estética visual.',
    sourceLoaded: 'cargado',
    sourceCandidate: 'candidato',
    sourceOfficial: 'oficial',
    sourceCivil: 'civil',
    sourceOfficialArchive: 'archivo oficial',
    sourcePriority: 'prioridad',
    sourcePeriod: 'periodo',
    sourceRecords: 'registros',
    sourceWhy: 'valor',
    sourceCaveat: 'cuidado',
    sourceIntegration: 'integración',
    sourceOpen: 'abrir fuente',
    reportTitle: 'Archivos oficiales y cómo reportar',
    reportIntro: '¿Has visto algo? Usa el botón <b>➕ Registrar</b> para anotarlo en tu cuaderno de campo local con coordenadas precisas, y repórtalo después a un organismo: hora exacta, duración, dirección, condiciones, fotos sin zoom digital. Antes, descarta lo prosaico: Starlink, ISS, Venus, bengalas, drones y globos explican la gran mayoría de casos.',
  },
  en: {
    metaTitle: 'UFOlogist — Global Atlas of the UAP Phenomenon',
    metaDescription: 'Interactive atlas of documented UFO/UAP sightings: 3D globe, 80,000+ reports, heatmap, timeline, and original sources.',
    brandTag: 'Observing the Unknown.',
    searchPlaceholder: 'Search case or place...',
    loading: 'Initializing orbital atlas...',
    landingTag: 'Observing the Unknown.',
    landingSteps: ['Loading encounters...', 'Checking declassified data...', 'Linking online sources...', 'Calibrating the orbital atlas...'],
    landingReady: 'Atlas ready.',
    indexedReports: 'indexed reports',
    enterAtlas: 'Enter the atlas ->',
    navKnowledge: 'Knowledge',
    navStats: 'Analysis',
    navReport: 'Report',
    navInfo: 'Info',
    navTour: 'Expedition',
    navPass: 'Pass',
    viewEarth: 'Earth',
    viewOrbit: 'Orbit',
    titleKnowledge: 'Knowledge center',
    titleStats: 'Analysis and trends panel',
    titleReport: 'Report or register your own sighting',
    titleInfo: 'Information about UFOlogist',
    titleTour: 'Guided tour through essential cases',
    titlePass: 'UFOlogist Research Pass',
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
    heat: 'Density',
    cases: 'Cases',
    hotspots: 'Legendary hotspots',
    massDb: 'NUFORC mass database',
    loadingShort: 'loading...',
    nuforcSwitch: '80,332 geolocated reports (1906-2014)',
    geipanDb: 'GEIPAN database · France',
    geipanSwitch: 'Official CNES cases (1937-2018)',
    officialArchives: 'Official archives',
    officialSwitch: 'Normalized candidates under review',
    officialHint: 'Includes unpublished cases: NARA, UK MoD, Spain, Chile and Argentina.',
    officialCase: 'Official case under review',
    officialReview: 'Needs review',
    officialNoCoords: 'coordinates pending',
    officialGeoHint: '{geo} geolocated of {total}',
    officialShort: 'official',
    mapShort: 'map',
    geoQuality: 'Geographic precision',
    geoQualityHint: 'Separate reported, local, regional, and broad coordinates so strong patterns are not mixed with approximate locations.',
    geoReported: 'Reported',
    geoReportedDesc: 'Coordinates reported by the source or the local notebook.',
    geoLocal: 'Local',
    geoLocalDesc: 'Location at locality, city, airport, or facility level.',
    geoRegional: 'Regional',
    geoRegionalDesc: 'Approximate location at county, province, region, island, or area level.',
    geoBroad: 'Broad',
    geoBroadDesc: 'Country-level or very broad location. Useful for inventory, weak for fine patterns.',
    geoContext: 'Geographic context',
    geoContextHint: 'Filter encounters near military bases, over water/sea, on the coast, or clearly inland.',
    ctxMilitary: 'Military base',
    ctxMilitaryDesc: 'Case tagged as military or located near a known base, airfield, or naval installation.',
    ctxWater: 'Sea / water',
    ctxWaterDesc: 'Location or description over ocean, sea, lake, bay, river, or maritime area.',
    ctxCoastal: 'Coastal',
    ctxCoastalDesc: 'Coastal place, island, port, cape, beach, or shoreline area.',
    ctxInland: 'Inland',
    ctxInlandDesc: 'No clear sign of nearby coast, sea, or water in the available data.',
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
    modalTabs: ['Classification', 'Anatomy', 'Disclosure USA', 'Glossary', 'Methodology', 'Sources', 'Report'],
    appInfoTitle: 'About UFOlogist',
    appInfoIntro: '<b>UFOlogist</b> is an independent interactive atlas for exploring the UAP phenomenon with context, sources, and a critical eye. The goal is not to force a conclusion, but to organize the material, separate evidence from noise, and reveal where patterns appear.',
    appInfoAuthorTitle: 'Author note',
    appInfoAuthor: 'I built this tool for demanding curiosity: people who want to look at the cases without automatic cynicism, but without losing judgment either. If something intrigues you, open the sources, compare versions, and keep the question alive.',
    appInfoCopyrightTitle: 'Authorship and copyright',
    appInfoCopyright: 'Created by <b>Miquel Gelabert</b>. © Miquel Gelabert 2026 · UFOlogist.',
    appInfoNote: 'Independent educational project. Not affiliated with NUFORC, GEIPAN, CNES, AARO, or any official body. Code is published under the MIT license. Linked data and sources belong to their respective owners and are used for education and research.',
    passEyebrow: 'UFOlogist Research Pass',
    passTitle: 'Fund research tools, not a paywall.',
    passIntro: 'The atlas stays open. The pass is for people who want to support the project and receive advanced utilities as they ship.',
    passFeatures: [
      ['Clean exports', 'Extended CSV/JSON, case bundles, and research-ready source lists.'],
      ['Advanced notebooks', 'Collections, cross-notes, source tracking, and a path toward sync.'],
      ['Alerts and dossiers', 'Source updates, wave comparisons, and downloadable research dossiers.'],
    ],
    passPlans: ['€4/month', '€29/year', 'Founder'],
    passEmail: 'Email',
    passEmailPlaceholder: 'you@email.com',
    passCta: 'Request access',
    passNote: 'No popups, no locked data, no invasive ads. First validate demand; later connect Stripe or Lemon Squeezy.',
    passEmailMissing: 'Add an email to request access',
    passInterestSaved: 'Request prepared',
    passMailSubject: 'UFOlogist Research Pass',
    passMailBody: 'Hi Miquel,\n\nI want to request access to the UFOlogist Research Pass.\nPlan: {plan}\nEmail: {email}\n\nThanks.',
    mobileMenu: 'Menu',
    mobileExport: 'Export selection',
    mobileHelp: 'Tap a globe point to open its card. Drag the globe to rotate it.',
    mobileGlobe: 'Globe',
    mobileFilters: 'Filters',
    mobileTime: 'Time',
    mobileData: 'Data',
    mobileMore: 'More',
    curated: 'curated',
    heatSuffix: 'density',
    densityLegend: 'Encounter density',
    densityLow: 'low',
    densityMid: 'medium',
    densityHigh: 'high',
    narrowHint: 'narrow to show individual points',
    sampledPointsHint: 'showing {shown} points from {total} filtered cases',
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
    sourceAtlasTitle: 'Source atlas',
    sourceAtlasIntro: 'The app renders compact datasets for speed, but the research layer should live in a normalized model: sources, cases, observations, links, tags, and relations. This queue prioritizes which archives to add without confusing source with visual style.',
    sourceLoaded: 'loaded',
    sourceCandidate: 'candidate',
    sourceOfficial: 'official',
    sourceCivil: 'civil',
    sourceOfficialArchive: 'official archive',
    sourcePriority: 'priority',
    sourcePeriod: 'period',
    sourceRecords: 'records',
    sourceWhy: 'value',
    sourceCaveat: 'caveat',
    sourceIntegration: 'integration',
    sourceOpen: 'open source',
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
let selectedPassPlan = 'monthly';
function t(key, vars) {
  let value = (I18N[currentLang] && I18N[currentLang][key]) || I18N.es[key] || key;
  if (vars) Object.entries(vars).forEach(([k, v]) => { value = value.replaceAll(`{${k}}`, v); });
  return value;
}
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}
function hasCoords(d) { return Number.isFinite(d?.lat) && Number.isFinite(d?.lng); }
function locale() { return currentLang === 'en' ? 'en-US' : 'es-ES'; }
function fmtNum(n) { return n.toLocaleString(locale()); }
function typeLabel(code) { return currentLang === 'en' && TYPE_TEXT.en[code] ? TYPE_TEXT.en[code][0] : TYPE_META[code].label; }
function typeDesc(code) { return currentLang === 'en' && TYPE_TEXT.en[code] ? TYPE_TEXT.en[code][1] : TYPE_META[code].desc; }
function shapeLabel(i) { return currentLang === 'en' && SHAPE_TEXT.en[i] ? SHAPE_TEXT.en[i] : SHAPE_META[i].label; }
function reportVisualColor(d) {
  if (d?.mass && Number.isInteger(d.s) && SHAPE_META[d.s]) return SHAPE_META[d.s].color;
  if (d?.official && Number.isInteger(d.s) && SHAPE_META[d.s]) return SHAPE_META[d.s].color;
  if (d?.geipan) return SHAPE_META[9].color;
  return TYPE_META[d?.type]?.color || SHAPE_META[9].color;
}
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
const GEO_QUALITY_META = [
  { id: 'reported', color: '#f8fbff' },
  { id: 'local', color: '#4be1c3' },
  { id: 'regional', color: '#8ecae6' },
  { id: 'broad', color: '#b388ff' },
];
const GEO_CONTEXT_META = [
  { id: 'military', color: '#ef476f' },
  { id: 'water', color: '#118ab2' },
  { id: 'coastal', color: '#8ecae6' },
  { id: 'inland', color: '#80ed99' },
];
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
const COASTAL_REFERENCE_POINTS = [
  ['Seattle', 47.61, -122.33], ['San Francisco Bay', 37.77, -122.42],
  ['Los Angeles', 34.05, -118.24], ['San Diego', 32.72, -117.16],
  ['Santa Barbara', 34.42, -119.70], ['Monterey', 36.60, -121.89],
  ['Miami', 25.76, -80.19], ['Tampa Bay', 27.95, -82.46],
  ['Jacksonville', 30.33, -81.66], ['Cape Canaveral', 28.39, -80.61],
  ['Pensacola', 30.42, -87.22], ['New Orleans', 29.95, -90.07],
  ['Galveston', 29.30, -94.80], ['Corpus Christi', 27.80, -97.40],
  ['Savannah', 32.08, -81.09], ['Charleston', 32.78, -79.93],
  ['Wilmington NC', 34.21, -77.89], ['Norfolk', 36.85, -76.29],
  ['Atlantic City', 39.36, -74.42], ['New York Harbor', 40.71, -74.01],
  ['Boston', 42.36, -71.06], ['Portland ME', 43.66, -70.25],
  ['Honolulu', 21.31, -157.86], ['Anchorage', 61.22, -149.90],
  ['Plymouth', 50.38, -4.14], ['Portsmouth', 50.82, -1.09],
  ['Dover', 51.13, 1.31], ['Brighton', 50.82, -0.14],
  ['Liverpool', 53.41, -2.99], ['Newcastle', 54.98, -1.62],
  ['Edinburgh', 55.95, -3.19], ['Aberdeen', 57.15, -2.09],
  ['Belfast', 54.60, -5.93], ['Barcelona', 41.39, 2.17],
  ['Valencia', 39.47, -0.38], ['Alicante', 38.35, -0.49],
  ['Malaga', 36.72, -4.42], ['Cadiz', 36.53, -6.29],
  ['A Coruna', 43.36, -8.41], ['Vigo', 42.24, -8.72],
  ['Bilbao', 43.26, -2.94], ['Santander', 43.46, -3.81],
  ['Palma', 39.57, 2.65], ['Las Palmas', 28.12, -15.44],
  ['Brest', 48.39, -4.49], ['Cherbourg', 49.64, -1.62],
  ['Le Havre', 49.49, 0.11], ['Calais', 50.95, 1.86],
  ['La Rochelle', 46.16, -1.15], ['Saint-Nazaire', 47.27, -2.21],
  ['Marseille', 43.30, 5.37], ['Toulon', 43.12, 5.93],
  ['Nice', 43.71, 7.26], ['Buenos Aires', -34.60, -58.38],
  ['Mar del Plata', -38.00, -57.55], ['Bahia Blanca', -38.72, -62.27],
  ['Rio Gallegos', -51.62, -69.22], ['Punta Arenas', -53.16, -70.91],
  ['Valparaiso', -33.05, -71.62], ['Antofagasta', -23.65, -70.40],
  ['Iquique', -20.21, -70.15], ['Callao', -12.06, -77.15],
  ['Trujillo', -8.11, -79.03],
];
function geoQualityLabel(id) {
  return {
    reported: t('geoReported'),
    local: t('geoLocal'),
    regional: t('geoRegional'),
    broad: t('geoBroad'),
  }[id] || id;
}
function geoQualityDesc(id) {
  return {
    reported: t('geoReportedDesc'),
    local: t('geoLocalDesc'),
    regional: t('geoRegionalDesc'),
    broad: t('geoBroadDesc'),
  }[id] || '';
}
function geoContextLabel(id) {
  return {
    military: t('ctxMilitary'),
    water: t('ctxWater'),
    coastal: t('ctxCoastal'),
    inland: t('ctxInland'),
  }[id] || id;
}
function geoContextDesc(id) {
  return {
    military: t('ctxMilitaryDesc'),
    water: t('ctxWaterDesc'),
    coastal: t('ctxCoastalDesc'),
    inland: t('ctxInlandDesc'),
  }[id] || '';
}
function geoQuality(d) {
  if (d?.mine) return 'reported';
  if (d?.official) {
    if (d.geoPrecision === 'reported') return 'reported';
    if (['locality', 'city', 'airport', 'facility'].includes(d.geoPrecision)) return 'local';
    if (['county', 'province', 'region', 'country-region', 'island', 'area'].includes(d.geoPrecision)) return 'regional';
    return 'broad';
  }
  if (d?.mass) return 'local';
  if (d?.geipan) return 'regional';
  return 'local';
}
function geoAllowed(d) { return state.geoQuality.has(geoQuality(d)); }
function distKm(aLat, aLng, bLat, bLng) {
  const R = 6371, toRad = v => v * Math.PI / 180;
  const dLat = toRad(bLat - aLat), dLng = toRad(bLng - aLng);
  const s1 = Math.sin(dLat / 2), s2 = Math.sin(dLng / 2);
  const a = s1 * s1 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * s2 * s2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function plainText(value) {
  return String(value || '').toLowerCase()
    .replace(/&[^;\s]+;/g, ' ')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function contextText(d) {
  if (d?.official) return [d.title, d.loc, d.country, d.source, d.summary, d.cls, d.system].map(plainText).join(' ');
  if (d?.geipan) return [d.zone, d.resume, 'france'].map(plainText).join(' ');
  if (d?.mass) return [d.loc].map(plainText).join(' ');
  return [caseName(d), caseLoc(d), caseCountry(d), caseSummary(d), d.type].map(plainText).join(' ');
}
function nearMilitarySite(d) {
  if (!hasCoords(d)) return false;
  for (const [, lat, lng] of MILITARY_SITES) {
    if (distKm(d.lat, d.lng, lat, lng) <= 60) return true;
  }
  return false;
}
function nearCoastalReference(d) {
  if (!hasCoords(d)) return false;
  for (const [, lat, lng] of COASTAL_REFERENCE_POINTS) {
    if (distKm(d.lat, d.lng, lat, lng) <= 85) return true;
  }
  return false;
}
function geoContextTags(d) {
  if (d._geoCtx) return d._geoCtx;
  const text = contextText(d);
  const tags = new Set();
  const militaryText = /\b(afb|raf|nas|naval|navy|air force|army|military|militar|base aerea|base naval|fuerza aerea|aeronaval|mod|norad|silo|missile|radar|pentagon|defen[cs]e|defensa)\b/.test(text);
  const waterText = /\b(ocean|oceano|atlantic|atlantico|pacific|pacifico|sea|mar|gulf|golfo|bay|bahia|baya|lake|lago|river|rio|water|agua|canal|channel|strait|estuary|offshore|caribbean|caribe|mediterranean|mediterraneo|cantabrico)\b/.test(text);
  const coastText = waterText || /\b(coast|coastal|costa|shore|litoral|beach|playa|harbor|harbour|port|puerto|cape|cabo|key|cayo|island|isla|peninsula|naval|marina|faro)\b/.test(text);
  const coastGeo = nearCoastalReference(d);
  if (d.type === 'MIL' || militaryText || nearMilitarySite(d)) tags.add('military');
  if (waterText || d.type === 'USO') tags.add('water');
  if (coastText || coastGeo || d.type === 'USO') tags.add('coastal');
  if (!tags.has('water') && !tags.has('coastal')) tags.add('inland');
  d._geoCtx = tags;
  return tags;
}
function contextAllowed(d) {
  if (state.geoContexts.size === GEO_CONTEXT_META.length) return true;
  if (!state.geoContexts.size) return false;
  const tags = geoContextTags(d);
  for (const tag of tags) if (state.geoContexts.has(tag)) return true;
  return false;
}
function sourceStatusLabel(status) {
  return status === 'active' ? t('sourceLoaded') : t('sourceCandidate');
}
function sourceTypeLabel(type) {
  if (type === 'official') return t('sourceOfficial');
  if (type === 'official_archive') return t('sourceOfficialArchive');
  return t('sourceCivil');
}
function setText(sel, text) { const el = typeof sel === 'string' ? document.querySelector(sel) : sel; if (el) el.textContent = text; }
function setFirstText(el, text) { if (el && el.childNodes.length) el.childNodes[0].nodeValue = text + ' '; }
function setButton(id, icon, labelKey, titleKey) {
  const el = $(id);
  if (!el) return;
  el.textContent = `${icon} ${t(labelKey)}`;
  if (titleKey) el.title = t(titleKey);
}
function applyPassI18n() {
  const modal = $('pass-modal');
  if (!modal) return;
  setText('.pass-eyebrow', t('passEyebrow'));
  setText('#pass-modal h2', t('passTitle'));
  setText('.pass-intro', t('passIntro'));
  const features = t('passFeatures');
  document.querySelectorAll('.pass-grid article').forEach((article, i) => {
    const item = Array.isArray(features) ? features[i] : null;
    if (!item) return;
    const title = article.querySelector('b');
    const body = article.querySelector('p');
    if (title) title.textContent = item[0];
    if (body) body.textContent = item[1];
  });
  const plans = t('passPlans');
  document.querySelectorAll('.pass-plans button').forEach((button, i) => {
    if (Array.isArray(plans) && plans[i]) button.textContent = plans[i];
  });
  const emailLabel = document.querySelector('.pass-form label');
  if (emailLabel) setFirstText(emailLabel, t('passEmail'));
  if ($('pass-email')) $('pass-email').placeholder = t('passEmailPlaceholder');
  const submit = document.querySelector('#pass-form button[type="submit"]');
  if (submit) submit.textContent = t('passCta');
  setText('.pass-note', t('passNote'));
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
  setButton('btn-pass', '◇', 'navPass', 'titlePass');
  setText('#btn-view-earth', t('viewEarth'));
  setText('#btn-view-orbit', t('viewOrbit'));
  setText('#density-legend .density-title', t('densityLegend'));
  const densityScale = document.querySelectorAll('#density-legend .density-scale span');
  if (densityScale[0]) densityScale[0].textContent = t('densityLow');
  if (densityScale[1]) densityScale[1].textContent = t('densityMid');
  if (densityScale[2]) densityScale[2].textContent = t('densityHigh');
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
    setFirstText(blocks[3].querySelector('h3'), t('officialArchives'));
    setText(blocks[3].querySelector('.switch-row span'), t('officialSwitch'));
    setText('#official-hint', t('officialHint'));
  }
  if (blocks[4]) {
    setText('#geo-quality-title', t('geoQuality'));
    setText('#geo-quality-hint', t('geoQualityHint'));
  }
  if (blocks[5]) {
    setText('#geo-context-title', t('geoContext'));
    setText('#geo-context-hint', t('geoContextHint'));
  }
  if (blocks[6]) {
    setText(blocks[6].querySelector('h3'), t('timeBand'));
    const tod = $('tod-filter');
    if (tod) tod.title = t('timeFilterTitle');
    setText('#tod-filter [data-tod="day"]', `☀ ${t('day')}`);
    setText('#tod-filter [data-tod="night"]', `☾ ${t('night')}`);
  }
  if (blocks[7]) {
    setFirstText(blocks[7].querySelector('h3'), t('curatedType'));
    setText('#types-all', t('all'));
    setText('#types-none', t('none'));
  }
  if (blocks[8]) {
    setText(blocks[8].querySelector('h3'), t('minCredibility'));
    setText(blocks[8].querySelector('.hint'), t('credibilityHint'));
  }
  if (blocks[9]) setFirstText(blocks[9].querySelector('h3'), t('selection'));
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
  applyPassI18n();

  setText('#mobile-more .more-title', t('mobileMenu'));
  const moreButtons = document.querySelectorAll('#mobile-more .more-grid:first-of-type button span');
  ['navKnowledge', 'navStats', 'navReport', 'navInfo', 'navTour', 'navPass', 'ambientLabel'].forEach((key, i) => { if (moreButtons[i]) moreButtons[i].textContent = t(key); });
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
  buildGeoQualityFilters();
  buildGeoContextFilters();
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
  officialOn: true,
  officialSources: new Set(),
  geoQuality: new Set(GEO_QUALITY_META.map(g => g.id)),
  geoContexts: new Set(GEO_CONTEXT_META.map(g => g.id)),
  hotspots: false,
  pickMode: false,
  viewMode: 'earth',             // earth | orbit
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

// ---------- Entry reveal + case cap altitudes ----------
let casesReady = false;   // gate: density layer draws first, cases revealed after the landing
let revealCases = false;  // active during the sweep-in animation
let officialData = null;  // normalized official/archive candidates loaded from compact JSON

// Legacy H3 column support: keep curated cases aligned with old bar heights when
// the weather-density layer is disabled.
function computeCapAltitudes() {
  if (typeof h3 === 'undefined' || !h3.latLngToCell) return;
  const res = (window.matchMedia('(max-width: 760px)').matches) ? 2 : 3;
  const weight = new Map();
  const bump = (lat, lng) => { const c = h3.latLngToCell(lat, lng, res); weight.set(c, (weight.get(c) || 0) + 1); };
  if (massData) massData.forEach(r => bump(r.lat, r.lng));
  if (geipanData) geipanData.forEach(r => bump(r.lat, r.lng));
  if (officialData) officialData.forEach(r => { if (hasCoords(r)) bump(r.lat, r.lng); });
  allCuratedPool().forEach(c => bump(c.lat, c.lng));
  const total = (massData ? massData.length : 0) + (geipanData ? geipanData.length : 0) + (officialData ? officialData.filter(hasCoords).length : 0);
  const capRef = total > 0 ? Math.max(20, total / 30) : 15;
  const capT = w => Math.min(1, Math.log10(1 + w) / Math.log10(1 + capRef));
  allCuratedPool().forEach(c => {
    const w = weight.get(h3.latLngToCell(c.lat, c.lng, res)) || 1;
    c._capAlt = capT(w) * 0.17 + 0.012 + 0.006;   // top face + small lift for H3 columns
  });
}

// Reveal the case hexagons with a longitude sweep, after the density layer is drawn.
function revealCasesSweep() {
  if (casesReady) return;
  casesReady = true;
  revealCases = true;
  computeCapAltitudes();
  refresh();
  setTimeout(() => { revealCases = false; }, 2200);
}

function pointSampleKey(d) {
  if (d.official) return `o:${d.id || d.sourceCaseId || ''}:${d.lat}:${d.lng}`;
  if (d.geipan) return `g:${d.d}:${d.ci}:${d.lat}:${d.lng}:${d.zone || ''}`;
  if (d.mass) return `m:${d.d}:${d.h}:${d.s}:${d.lat}:${d.lng}:${d.loc || ''}`;
  return `c:${d.id || d.name || ''}:${d.lat}:${d.lng}`;
}
function hashKey(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function deterministicSample(rows, limit) {
  if (rows.length <= limit) return rows.slice();
  return rows
    .map(row => ({ row, h: hashKey(pointSampleKey(row)) }))
    .sort((a, b) => a.h - b.h)
    .slice(0, limit)
    .map(x => x.row);
}
function circularMeanLng(rows) {
  let sx = 0, cx = 0;
  rows.forEach(r => {
    const a = (r.lng || 0) * Math.PI / 180;
    sx += Math.sin(a);
    cx += Math.cos(a);
  });
  return Math.atan2(sx, cx) * 180 / Math.PI;
}

function angularDistanceDeg(a, b) {
  const lat1 = (a.lat || 0) * Math.PI / 180;
  const lat2 = (b.lat || 0) * Math.PI / 180;
  const dLat = lat2 - lat1;
  const dLng = ((b.lng || 0) - (a.lng || 0)) * Math.PI / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * Math.asin(Math.min(1, Math.sqrt(s))) * 180 / Math.PI;
}

function markerLodCellDegrees(altitude) {
  const a = Number.isFinite(altitude) ? altitude : 2.3;
  const m = isMobile();
  if (a > 2.2) return m ? 18 : 12;
  if (a > 1.55) return m ? 12 : 8;
  if (a > 1.08) return m ? 8 : 5;
  if (a > 0.78) return m ? 5 : 3;
  if (a > 0.55) return m ? 3 : 1.6;
  if (a > 0.38) return m ? 1.6 : 0.8;
  return m ? 0.9 : 0.45;
}

function markerFocusRadiusDeg(altitude) {
  const a = Number.isFinite(altitude) ? altitude : 2.3;
  if (a > 2.2) return 999;
  if (a > 1.55) return 74;
  if (a > 1.08) return 48;
  if (a > 0.78) return 30;
  if (a > 0.55) return 19;
  if (a > 0.38) return 12;
  return 8;
}

function clusterColor(rows) {
  const counts = new Map();
  rows.forEach(r => {
    const c = reportVisualColor(r);
    counts.set(c, (counts.get(c) || 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '#18d7ff';
}

function makeCluster(rows, key, cellDeg, inFocus) {
  const lat = rows.reduce((sum, r) => sum + r.lat, 0) / rows.length;
  const lng = circularMeanLng(rows);
  const years = rows.map(r => r.year).filter(Number.isFinite);
  return {
    cluster: true,
    _key: `cluster:${key}:${rows.length}`,
    lat,
    lng,
    count: rows.length,
    rows,
    cellDeg,
    inFocus,
    color: clusterColor(rows),
    yearMin: years.length ? Math.min(...years) : null,
    yearMax: years.length ? Math.max(...years) : null,
  };
}

function expandedRowsForCluster(cluster) {
  const rows = deterministicSample(cluster.rows, cluster.expandLimit || CASE_CLUSTER_EXPAND_LIMIT);
  const radius = Math.max(0.035, Math.min(0.32, (cluster.cellDeg || 1) * 0.16));
  return rows.map((r, i) => {
    const a = (i / Math.max(1, rows.length)) * Math.PI * 2;
    const latScale = 1;
    const lngScale = 1 / Math.max(0.22, Math.cos((cluster.lat || 0) * Math.PI / 180));
    return {
      ...r,
      _displayLat: Math.max(-89.8, Math.min(89.8, cluster.lat + Math.sin(a) * radius * latScale)),
      _displayLng: cluster.lng + Math.cos(a) * radius * lngScale,
      _expandedFrom: cluster._key,
    };
  });
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
    if (!geoAllowed(r)) return false;
    if (!contextAllowed(r)) return false;
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
  return geipanData.filter(r => r.year >= yearFrom && r.year <= yearTo && geipanClasses.has(r.ci) && geoAllowed(r) && contextAllowed(r));
}

// ---------- Official archive candidates ----------
function ingestOfficial(json) {
  officialData = (json.rows || []).map(r => ({ ...r, official: true }));
  state.officialSources = new Set((json.sources || []).map(s => s.id));
  $('official-status').textContent = fmtNum(officialData.length);
  $('official-hint').textContent = t('officialGeoHint', {
    geo: fmtNum(json.geolocated || officialData.filter(hasCoords).length),
    total: fmtNum(officialData.length),
  });
  buildOfficialFilters(json.sources || []);
  computeCapAltitudes();
  refresh();
}
fetch('data/official-cases.json?v=1')
  .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then(ingestOfficial)
  .catch(() => {
    const s = document.createElement('script');
    s.src = 'data/official-cases.js?v=1';
    s.onload = () => window.OFFICIAL_CASES_DATA ? ingestOfficial(window.OFFICIAL_CASES_DATA)
                                                : ($('official-status').textContent = t('unavailable'));
    s.onerror = () => { $('official-status').textContent = t('unavailable'); };
    document.head.appendChild(s);
  });

function officialFiltered() {
  if (!state.officialOn || !officialData) return [];
  const { yearFrom, yearTo, officialSources, tod } = state;
  return officialData.filter(r => {
    if (r.year < yearFrom || r.year > yearTo) return false;
    if (!officialSources.has(r.sid)) return false;
    if (!geoAllowed(r)) return false;
    if (!contextAllowed(r)) return false;
    if (tod === 'day' && !(r.h >= 7 && r.h <= 19)) return false;
    if (tod === 'night' && !(r.h >= 20 || (r.h >= 0 && r.h <= 6))) return false;
    return true;
  });
}

// ---------- Globe ----------
const CASE_MARKER_NODE_BUDGET = 1600; // max DOM markers/clusters in desktop globe view
const MOBILE_CASE_MARKER_NODE_BUDGET = 720;
const CASE_CLUSTER_EXPAND_LIMIT = 18;
const CASE_CLUSTER_INLINE_EXPAND_LIMIT = 6;
const CASE_CLUSTER_LIST_LIMIT = 220;
const WEATHER_HEATMAP_ENABLED = true;
const WEATHER_HEATMAP_WIDTH = 512;
const WEATHER_HEATMAP_HEIGHT = 256;
const WEATHER_HEATMAP_MESH_ROTATION_Y = -Math.PI / 2;
const EARTH_MIN_ALTITUDE = 0.08;
const EARTH_MAX_ALTITUDE = 5.4;
const EARTH_DAY_TEXTURE = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/planets/earth_atmos_2048.jpg';
const EARTH_DAY_TEXTURE_HI = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/planets/earth_atmos_4096.jpg';
const EARTH_NIGHT_TEXTURE = 'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg';
const EARTH_TILE_URL = (x, y, l) => `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${l}/${y}/${x}`;
const POLITICAL_GEOJSON_URL = 'https://cdn.jsdelivr.net/gh/johan/world.geo.json@master/countries.geo.json';
const STREAMING_TILE_MAX_NODES = 361;

const globe = Globe()($('globe'))
  .globeImageUrl(EARTH_DAY_TEXTURE)
  .bumpImageUrl('https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png')
  .backgroundImageUrl('https://cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png')
  .atmosphereColor('#7fd8ff')
  .atmosphereAltitude(0.155)
  .htmlLat(d => d._displayLat ?? d.lat)
  .htmlLng(d => d._displayLng ?? d.lng)
  .htmlAltitude(d => {
    if (d.cluster) return 0.016;
    // hybrid view: curated case hexagons ride on top of their heatmap column
    // (like the lid of the 3D hex). Mass/GEIPAN points and "only cases" view stay low.
    if (d.mass || d.geipan) return 0.007;
    if (!WEATHER_HEATMAP_ENABLED && state.layerMode === 'both' && d._capAlt != null) return d._capAlt;
    return 0.013;
  })
  .htmlElement(d => buildMarker(d))
  .pointLat(d => d.lat)
  .pointLng(d => d.lng)
  .pointAltitude(0.008)
  .pointRadius(0.055)
  .pointResolution(8)
  .pointColor(d => reportVisualColor(d))
  .pointLabel(d => d.geipan
    ? `<div style="font-family:'JetBrains Mono',monospace;background:rgba(8,12,26,.94);border:1px solid rgba(255,255,255,.16);border-radius:8px;padding:6px 9px;color:#e8eefc;font-size:11px;">GEIPAN ${GEIPAN_META[d.ci].code} · ${fmtDateInt(d.d)} · ${d.zone || t('france')}</div>`
    : d.official
      ? `<div style="font-family:'JetBrains Mono',monospace;background:rgba(8,12,26,.94);border:1px solid rgba(255,255,255,.16);border-radius:8px;padding:6px 9px;color:#e8eefc;font-size:11px;">${esc(d.source)} · ${d.date || d.year} · ${esc(d.loc || d.country || t('officialNoCoords'))}</div>`
    : `<div style="font-family:'JetBrains Mono',monospace;background:rgba(8,12,26,.94);border:1px solid rgba(255,255,255,.16);border-radius:8px;padding:6px 9px;color:#e8eefc;font-size:11px;">${shapeLabel(d.s)} · ${fmtDateInt(d.d)} · ${d.loc || t('geocodedLocation')}</div>`)
  .onPointClick(d => d.official ? openOfficialReport(d, true) : (d.geipan ? openGeipanReport(d) : openMassReport(d)))
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
      <div style="color:#ffd166;font-weight:700;">${d.solar ? '☉' : '🔥'} ${hotspotName(d)}</div>
      <div style="color:#cdd8ef;font-size:11.5px;margin-top:4px;line-height:1.5;">${hotspotDesc(d)}</div>
    </div>`)
  .onLabelClick(d => {
    globe.controls().autoRotate = false;
    globe.pointOfView({ lat: d.lat, lng: d.lng, altitude: 1.1 }, 900);
  })
  .onGlobeClick(({ lat, lng }) => { if (state.pickMode) pickLocation(lat, lng); });

window.__globeTileSupport = !!globe.globeTileEngineUrl;
window.__ufologistGlobe = globe;
window.__ufologistGetPov = () => globe.pointOfView();
if (globe.globeTileEngineUrl) {
  globe.globeTileEngineUrl((x, y, l) => EARTH_TILE_URL(x, y, l));
}
if (globe.controls && globe.controls()) {
  globe.controls().minDistance = 100 + EARTH_MIN_ALTITUDE * 100;
  globe.controls().maxDistance = 100 + EARTH_MAX_ALTITUDE * 100;
}

function loadHighResolutionEarthTexture() {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    globe.globeImageUrl(EARTH_DAY_TEXTURE_HI);
    document.body.dataset.earthTexture = 'hires';
  };
  img.onerror = () => { document.body.dataset.earthTexture = 'base'; };
  img.src = EARTH_DAY_TEXTURE_HI;
}

function geoJsonLinePaths(geojson) {
  const paths = [];
  const pushRing = ring => {
    if (!Array.isArray(ring) || ring.length < 2) return;
    paths.push(ring.map(([lng, lat]) => ({ lat, lng })));
  };
  (geojson.features || []).forEach(feature => {
    const g = feature.geometry || {};
    if (g.type === 'Polygon') (g.coordinates || []).forEach(pushRing);
    if (g.type === 'MultiPolygon') (g.coordinates || []).forEach(poly => (poly || []).forEach(pushRing));
  });
  return paths;
}

function loadPoliticalOverlay() {
  if (!globe.pathsData) return;
  fetch(POLITICAL_GEOJSON_URL)
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(geojson => {
      politicalBoundaryPaths = geoJsonLinePaths(geojson);
      configurePoliticalOverlay();
      document.body.dataset.politicalOverlay = 'on';
    })
    .catch(() => { document.body.dataset.politicalOverlay = 'unavailable'; });
}

function configurePoliticalOverlay() {
  if (!globe.pathsData) return;
  const g = globe
    .pathsData(state.viewMode === 'earth' ? politicalBoundaryPaths : [])
    .pathPoints(d => d)
    .pathPointLat('lat')
    .pathPointLng('lng')
    .pathColor(() => 'rgba(205,232,255,0.34)');
  if (g.pathStroke) g.pathStroke(0.42);
  if (g.pathAltitude) g.pathAltitude(0.006);
  if (g.pathTransitionDuration) g.pathTransitionDuration(0);
  window.__ufologistPoliticalPathCount = state.viewMode === 'earth' ? politicalBoundaryPaths.length : 0;
}

function tileZoomForAltitude(altitude) {
  const a = Number.isFinite(altitude) ? altitude : 2.3;
  if (a > 0.92) return null;
  if (a > 0.56) return 4;
  if (a > 0.34) return 5;
  if (a > 0.11) return 6;
  return 7;
}

function lonToTileX(lng, z) {
  const n = 2 ** z;
  return Math.floor((((lng + 180) / 360) * n + n) % n);
}

function latToTileY(lat, z) {
  const n = 2 ** z;
  const clamped = Math.max(-85.0511, Math.min(85.0511, lat));
  const rad = clamped * Math.PI / 180;
  return Math.max(0, Math.min(n - 1, Math.floor((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2 * n)));
}

function tileYToLat(y, z) {
  const n = Math.PI - 2 * Math.PI * y / (2 ** z);
  return Math.atan(Math.sinh(n)) * 180 / Math.PI;
}

function tileBounds(x, y, z) {
  const n = 2 ** z;
  const west = x / n * 360 - 180;
  const east = (x + 1) / n * 360 - 180;
  const north = tileYToLat(y, z);
  const south = tileYToLat(y + 1, z);
  return {
    lat: (north + south) / 2,
    lng: (west + east) / 2,
    width: east - west,
    height: Math.max(0.01, north - south),
  };
}

function streamingTileMaterial(tile) {
  if (typeof THREE === 'undefined') return null;
  const key = `${tile.z}/${tile.x}/${tile.y}`;
  if (streamingTileMaterialCache.has(key)) return streamingTileMaterialCache.get(key);
  if (!streamingTileLoader) {
    streamingTileLoader = new THREE.TextureLoader();
    streamingTileLoader.setCrossOrigin('anonymous');
  }
  const material = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
  });
  streamingTileMaterialCache.set(key, material);
  streamingTileLoader.load(EARTH_TILE_URL(tile.x, tile.y, tile.z), texture => {
    texture.anisotropy = 4;
    if ('colorSpace' in texture && THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
    material.map = texture;
    material.needsUpdate = true;
  });
  return material;
}

function updateStreamingMapTiles() {
  if (!globe.tilesData) return;
  if (state.viewMode !== 'earth') {
    if (lastStreamingTileSignature) globe.tilesData([]);
    lastStreamingTileSignature = '';
    window.__ufologistTileState = { enabled: false, count: 0 };
    return;
  }
  const pov = globe.pointOfView();
  const z = tileZoomForAltitude(pov.altitude);
  if (!z) {
    if (lastStreamingTileSignature) globe.tilesData([]);
    lastStreamingTileSignature = '';
    window.__ufologistTileState = { enabled: false, count: 0, altitude: pov.altitude };
    return;
  }
  const n = 2 ** z;
  const cx = lonToTileX(pov.lng || 0, z);
  const cy = latToTileY(pov.lat || 0, z);
  const radius = z >= 7 ? 9 : (z >= 6 ? 8 : 2);
  const tiles = [];
  for (let dy = -radius; dy <= radius; dy++) {
    const y = cy + dy;
    if (y < 0 || y >= n) continue;
    for (let dx = -radius; dx <= radius; dx++) {
      const x = (cx + dx + n) % n;
      tiles.push({ z, x, y, ...tileBounds(x, y, z) });
    }
  }
  const selected = tiles.slice(0, STREAMING_TILE_MAX_NODES);
  const signature = selected.map(t => `${t.z}/${t.x}/${t.y}`).join('|');
  if (signature === lastStreamingTileSignature) {
    window.__ufologistTileState = { enabled: true, reused: true, z, count: selected.length, altitude: pov.altitude };
    return;
  }
  lastStreamingTileSignature = signature;
  globe
    .tilesData(selected)
    .tileLat('lat')
    .tileLng('lng')
    .tileWidth('width')
    .tileHeight('height')
    .tileMaterial(streamingTileMaterial);
  if (globe.tileAltitude) globe.tileAltitude(0.004);
  if (globe.tileUseGlobeProjection) globe.tileUseGlobeProjection(true);
  if (globe.tileCurvatureResolution) globe.tileCurvatureResolution(6);
  window.__ufologistTileState = { enabled: true, z, count: selected.length, altitude: pov.altitude };
}
window.updateStreamingMapTiles = updateStreamingMapTiles;

let activeMarkerKey = null;
let currentCaseMarkerRows = [];
let currentCaseMarkerRender = { markers: 0, clusters: 0, expanded: 0, total: 0 };
let markerLodTimer = null;
let expandedClusterKey = null;
let expandedClusterRows = [];
let expandedClusterLimit = CASE_CLUSTER_EXPAND_LIMIT;
let preserveClusterDrilldownUntil = 0;
let inspectedMarker = null;
let currentSelectionHintBase = '';
let currentSelectionMarkerTotal = 0;
let politicalBoundaryPaths = [];
const streamingTileMaterialCache = new Map();
let streamingTileLoader = null;
let lastStreamingTileSignature = '';

function reportMarkerKey(d) {
  if (!d) return '';
  if (d.cluster) return d._key;
  if (d.id) return String(d.id);
  if (d.official) return `official:${d.sid || d.source}:${d.date || d.year}:${d.lat}:${d.lng}:${d.title || ''}`;
  if (d.geipan) return `geipan:${d.d}:${d.lat}:${d.lng}:${d.ci}`;
  if (d.mass) return `nuforc:${d.d}:${d.h}:${d.lat}:${d.lng}:${d.s}`;
  return `${d.lat}:${d.lng}`;
}

function markerPrimaryText(d) {
  if (d.cluster) return currentLang === 'en' ? `${fmtNum(d.count)} sightings` : `${fmtNum(d.count)} encuentros`;
  if (d.geipan) return `GEIPAN ${GEIPAN_META[d.ci].code}`;
  if (d.official) return d.source || t('officialCase');
  if (d.mass) return shapeLabel(d.s);
  return caseName(d);
}

function markerSecondaryText(d) {
  if (d.cluster) {
    const years = d.yearMin && d.yearMax ? (d.yearMin === d.yearMax ? d.yearMin : `${d.yearMin}-${d.yearMax}`) : '—';
    return currentLang === 'en'
      ? `${years} · click to zoom into this area`
      : `${years} · clic para acercarte a esta zona`;
  }
  if (d.geipan) return `${fmtDateInt(d.d)} · ${d.zone || t('france')}`;
  if (d.official) return `${d.date || d.year || '—'} · ${d.loc || d.country || t('officialNoCoords')}`;
  if (d.mass) return `${fmtDateInt(d.d)} · ${d.loc || t('geocodedLocation')}`;
  return `${d.year} · ${caseLoc(d) || ''}`;
}

function ensureMarkerHoverCard() {
  let card = $('globe-hover-card');
  if (card) return card;
  card = document.createElement('div');
  card.id = 'globe-hover-card';
  document.body.appendChild(card);
  return card;
}

function moveMarkerHoverCard(ev) {
  const card = $('globe-hover-card');
  if (!card || !ev) return;
  const pad = 18;
  const w = card.offsetWidth || 240;
  const h = card.offsetHeight || 70;
  let x = ev.clientX + 16;
  let y = ev.clientY + 16;
  if (x + w + pad > window.innerWidth) x = ev.clientX - w - 16;
  if (y + h + pad > window.innerHeight) y = ev.clientY - h - 16;
  card.style.transform = `translate3d(${Math.max(pad, x)}px, ${Math.max(pad, y)}px, 0)`;
}

function showMarkerHover(d, ev) {
  const card = ensureMarkerHoverCard();
  card.innerHTML = `<b>${esc(markerPrimaryText(d))}</b><span>${esc(markerSecondaryText(d))}</span>`;
  card.classList.add('visible');
  moveMarkerHoverCard(ev);
}

function hideMarkerHover() {
  const card = $('globe-hover-card');
  if (card) card.classList.remove('visible');
}

function focusCameraOnReport(d, altitude = (isMobile() ? 1.28 : 1.08), duration = 950, mode = 'navigate') {
  if (!hasCoords(d)) return;
  const currentAlt = globe.pointOfView?.().altitude;
  const targetAltitude = mode === 'inspect' && Number.isFinite(currentAlt)
    ? Math.max(EARTH_MIN_ALTITUDE, Math.min(currentAlt, altitude))
    : altitude;
  if (mode === 'inspect') preserveClusterDrilldownUntil = performance.now() + duration + 350;
  else clearInspectedMarker();
  globe.controls().autoRotate = false;
  globe.pointOfView({ lat: d.lat, lng: d.lng, altitude: targetAltitude }, duration);
  setTimeout(() => {
    updateWeatherHeatmapOpacity();
    updateStreamingMapTiles();
    if (mode === 'inspect') renderCaseMarkersFromCurrent();
  }, duration + 20);
}

function activateMarker(d, el) {
  activeMarkerKey = reportMarkerKey(d);
  document.querySelectorAll('.globe-marker.is-active').forEach(node => node.classList.remove('is-active'));
  if (el) el.classList.add('is-active');
}

function pinInspectedMarker(d) {
  inspectedMarker = d && hasCoords(d) ? { ...d, _inspected: true } : null;
  if (inspectedMarker) activeMarkerKey = reportMarkerKey(inspectedMarker);
}

function clearInspectedMarker() {
  inspectedMarker = null;
}

function clusterCaseMarkers(rows) {
  if (!rows.length) return { markers: [], clusters: 0, expanded: 0, total: 0 };
  const pov = globe.pointOfView ? globe.pointOfView() : { lat: 20, lng: -40, altitude: 2.3 };
  const budget = isMobile() ? MOBILE_CASE_MARKER_NODE_BUDGET : CASE_MARKER_NODE_BUDGET;
  const focus = { lat: Number.isFinite(pov.lat) ? pov.lat : 20, lng: Number.isFinite(pov.lng) ? pov.lng : -40 };
  const baseCell = markerLodCellDegrees(pov.altitude);
  const focusRadius = markerFocusRadiusDeg(pov.altitude);
  const inspectedKey = inspectedMarker ? pointSampleKey(inspectedMarker) : '';
  const inspectedRow = inspectedKey ? rows.find(r => pointSampleKey(r) === inspectedKey) : null;
  const expandedKeys = new Set(expandedClusterRows.map(pointSampleKey));
  const expanded = expandedClusterRows.length ? expandedRowsForCluster({
    ...(expandedClusterRows[0]?._clusterMeta || {}),
    rows: expandedClusterRows,
    count: expandedClusterRows.length,
    expandLimit: expandedClusterLimit,
  }).filter(r => pointSampleKey(r) !== inspectedKey) : [];

  function build(cellMultiplier = 1) {
    const groups = new Map();
    const add = (r, inFocus) => {
      const cell = (inFocus ? baseCell : Math.max(baseCell * 4, 8)) * cellMultiplier;
      const latBand = Math.floor((r.lat + 90) / cell);
      const lngBand = Math.floor((r.lng + 180) / cell);
      const key = `${inFocus ? 'f' : 'g'}:${cell.toFixed(3)}:${latBand}:${lngBand}`;
      if (!groups.has(key)) groups.set(key, { key, cell, inFocus, rows: [] });
      groups.get(key).rows.push(r);
    };
    rows.forEach(r => {
      const key = pointSampleKey(r);
      if (key === inspectedKey || expandedKeys.has(key)) return;
      const inFocus = focusRadius >= 360 || angularDistanceDeg(focus, r) <= focusRadius;
      add(r, inFocus);
    });
    const markers = inspectedRow ? [{ ...inspectedRow, _inspected: true }] : [];
    markers.push(...expanded);
    let clusters = 0;
    groups.forEach(g => {
      if (g.rows.length === 1 && g.inFocus && g.cell <= 1.7) {
        markers.push(g.rows[0]);
      } else {
        clusters++;
        markers.push(makeCluster(g.rows, g.key, g.cell, g.inFocus));
      }
    });
    return { markers, clusters, expanded: expanded.length, total: rows.length };
  }

  let multiplier = 1;
  let result = build(multiplier);
  while (result.markers.length > budget && multiplier < 10) {
    multiplier *= 1.45;
    result = build(multiplier);
  }
  if (result.markers.length > budget) {
    const expandedMarkers = result.markers.filter(m => m._expandedFrom);
    const clusters = result.markers.filter(m => m.cluster);
    const singles = result.markers.filter(m => !m.cluster && !m._expandedFrom);
    result.markers = expandedMarkers
      .concat(clusters.slice(0, Math.max(0, budget - expandedMarkers.length)))
      .concat(singles.slice(0, Math.max(0, budget - expandedMarkers.length - clusters.length)))
      .slice(0, budget);
    result.clusters = result.markers.filter(m => m.cluster).length;
  }
  return result;
}

function renderCaseMarkersFromCurrent() {
  if (!(state.viewMode === 'earth' && state.layerMode !== 'heat' && casesReady)) {
    currentCaseMarkerRender = { markers: 0, clusters: 0, expanded: 0, total: currentCaseMarkerRows.length };
    globe.htmlElementsData([]);
    updateSelectionHint();
    return currentCaseMarkerRender;
  }
  const result = clusterCaseMarkers(currentCaseMarkerRows);
  currentCaseMarkerRender = {
    markers: result.markers.length,
    clusters: result.clusters,
    expanded: result.expanded,
    total: result.total,
  };
  globe.htmlElementsData(result.markers);
  window.__ufologistMarkerLod = currentCaseMarkerRender;
  updateSelectionHint();
  return currentCaseMarkerRender;
}

function updateSelectionHint() {
  const el = $('mass-count-hint');
  if (!el || !currentSelectionHintBase) return;
  const info = currentCaseMarkerRender;
  const lodHint = state.layerMode !== 'heat' && info.markers < currentSelectionMarkerTotal
    ? ` · ${t('sampledPointsHint', { shown: fmtNum(info.markers), total: fmtNum(currentSelectionMarkerTotal) })}${info.clusters ? ` · ${fmtNum(info.clusters)} ${currentLang === 'en' ? 'groups' : 'grupos'}` : ''}`
    : '';
  el.textContent = currentSelectionHintBase + lodHint;
}

function scheduleMarkerLodRender(delay = 120) {
  clearTimeout(markerLodTimer);
  markerLodTimer = setTimeout(() => { renderCaseMarkersFromCurrent(); }, delay);
}

function zoomToCluster(cluster) {
  if (!cluster?.rows?.length) return;
  const currentAlt = globe.pointOfView()?.altitude || 2.3;
  const targetAlt = Math.max(EARTH_MIN_ALTITUDE, Math.min(currentAlt * 0.55, Math.max(0.1, (cluster.cellDeg || 3) / 12)));
  globe.controls().autoRotate = false;
  globe.pointOfView({ lat: cluster.lat, lng: cluster.lng, altitude: targetAlt }, 950);
  setTimeout(() => {
    updateWeatherHeatmapOpacity();
    updateStreamingMapTiles();
    const nearDrilldown = targetAlt <= 0.24 || cluster.cellDeg <= 0.9;
    if (cluster.count <= CASE_CLUSTER_INLINE_EXPAND_LIMIT && targetAlt <= 0.85) {
      expandedClusterKey = cluster._key;
      expandedClusterRows = cluster.rows.map(r => ({ ...r, _clusterMeta: cluster }));
      expandedClusterLimit = CASE_CLUSTER_INLINE_EXPAND_LIMIT;
    } else if (cluster.count > CASE_CLUSTER_INLINE_EXPAND_LIMIT && nearDrilldown) {
      expandedClusterKey = null;
      expandedClusterRows = [];
      expandedClusterLimit = CASE_CLUSTER_EXPAND_LIMIT;
      openClusterBrowser(cluster);
    }
    renderCaseMarkersFromCurrent();
  }, 980);
}

function openReportFromMarker(d, fly = true) {
  if (!d) return;
  if (fly === 'inspect') pinInspectedMarker(d);
  else clearInspectedMarker();
  d.official ? openOfficialReport(d, fly) : (d.geipan ? openGeipanReport(d, fly) : (d.mass ? openMassReport(d, fly) : openCase(d.id, fly)));
}

function markerListDate(d) {
  if (d.mass || d.geipan) return fmtDateInt(d.d);
  return d.date || d.year || '—';
}

function markerListLocation(d) {
  if (d.geipan) return d.zone || t('france');
  if (d.official) return d.loc || d.country || t('officialNoCoords');
  if (d.mass) return d.loc || t('geocodedLocation');
  return `${caseLoc(d) || ''}${caseCountry(d) ? `, ${caseCountry(d)}` : ''}`;
}

function openClusterBrowser(cluster) {
  if (!cluster?.rows?.length) return;
  closeStats();
  state.selectedCase = null;
  const center = { lat: cluster.lat, lng: cluster.lng };
  const rows = deterministicSample(cluster.rows, CASE_CLUSTER_LIST_LIMIT)
    .sort((a, b) => {
      const byDistance = angularDistanceDeg(center, a) - angularDistanceDeg(center, b);
      if (Math.abs(byDistance) > 0.0001) return byDistance;
      return (b.year || Math.floor((b.d || 0) / 10000) || 0) - (a.year || Math.floor((a.d || 0) / 10000) || 0);
    });
  const hidden = Math.max(0, cluster.rows.length - rows.length);
  const years = cluster.yearMin && cluster.yearMax
    ? (cluster.yearMin === cluster.yearMax ? cluster.yearMin : `${cluster.yearMin}-${cluster.yearMax}`)
    : '—';
  $('case-content').innerHTML = `
    <span class="cc-type-badge cluster-badge">
      <span class="dot" style="width:8px;height:8px;border-radius:50%;background:${cluster.color}"></span>${currentLang === 'en' ? 'Area group' : 'Grupo de zona'}</span>
    <h2 class="cc-title">${fmtNum(cluster.count)} ${currentLang === 'en' ? 'encounters in this area' : 'encuentros en esta zona'}</h2>
    <p class="cc-loc">📍 ${cluster.lat.toFixed(3)}, ${cluster.lng.toFixed(3)} · ${years}</p>
    <p class="cc-summary">${currentLang === 'en'
      ? 'This area is too dense for precise marker picking. Open any row to see the full case record.'
      : 'Esta zona es demasiado densa para seleccionar marcadores con precisión. Abre cualquier fila para ver la ficha completa del caso.'}</p>
    <div class="cluster-case-list">
      ${rows.map((r, i) => `
        <button class="cluster-case-row" data-i="${i}">
          <span class="ci-dot" style="background:${reportVisualColor(r)}"></span>
          <span class="cluster-case-copy">
            <b>${esc(markerPrimaryText(r))}</b>
            <small>${esc(markerListDate(r))} · ${esc(markerListLocation(r))}</small>
          </span>
        </button>`).join('')}
    </div>
    ${hidden ? `<p class="hint">${currentLang === 'en'
      ? `${fmtNum(hidden)} more filtered records are in this group. Zoom or narrow the filters to inspect all of them.`
      : `${fmtNum(hidden)} registros filtrados más están en este grupo. Acércate o ajusta filtros para inspeccionarlos todos.`}</p>` : ''}`;
  $('panel-case').classList.remove('hidden');
  mobileOnCaseOpen();
  $('case-content').querySelectorAll('.cluster-case-row').forEach(btn => {
    btn.onclick = () => openReportFromMarker(rows[+btn.dataset.i], 'inspect');
  });
}

function handleClusterClick(cluster, el) {
  activateMarker(cluster, el);
  hideMarkerHover();
  const currentAlt = globe.pointOfView()?.altitude || 2.3;
  const nearDrilldown = currentAlt <= 0.24 || cluster.cellDeg <= 0.9;
  const shouldListDenseCluster = cluster.count > CASE_CLUSTER_INLINE_EXPAND_LIMIT && nearDrilldown;
  if (shouldListDenseCluster) {
    expandedClusterKey = null;
    expandedClusterRows = [];
    expandedClusterLimit = CASE_CLUSTER_EXPAND_LIMIT;
    renderCaseMarkersFromCurrent();
    openClusterBrowser(cluster);
    return;
  }
  if (cluster.count <= CASE_CLUSTER_INLINE_EXPAND_LIMIT && currentAlt <= 0.85) {
    expandedClusterKey = cluster._key;
    expandedClusterRows = cluster.rows.map(r => ({ ...r, _clusterMeta: cluster }));
    expandedClusterLimit = CASE_CLUSTER_INLINE_EXPAND_LIMIT;
    renderCaseMarkersFromCurrent();
    return;
  }
  if (nearDrilldown) {
    expandedClusterKey = null;
    expandedClusterRows = [];
    expandedClusterLimit = CASE_CLUSTER_EXPAND_LIMIT;
    renderCaseMarkersFromCurrent();
    openClusterBrowser(cluster);
    return;
  }
  zoomToCluster(cluster);
}

// Crisp UI marker (HTML/screen-space -> constant pixel size at any zoom).
function buildMarker(d) {
  const el = document.createElement('div');
  const key = reportMarkerKey(d);
  el.className = 'globe-marker' + (activeMarkerKey === key ? ' is-active' : '');
  const color = d.cluster ? d.color : reportVisualColor(d);
  const reveal = revealCases && !(d.cluster || d.mass || d.geipan || d.official);
  const cls = 'case-hex' + (d.cluster ? ' cluster' : '') + (d.mine ? ' mine' : '') + (d._expandedFrom ? ' expanded' : '') + (d._inspected ? ' inspected' : '') + (reveal ? ' reveal' : '');
  const pip = '<circle class="pip" cx="12" cy="12" r="2.2"/>';
  const delay = reveal ? `;animation-delay:${Math.round(((d.lng + 180) / 360) * 1500)}ms` : '';
  const clusterText = d.cluster
    ? `<text class="cluster-count" x="12" y="13.8">${d.count >= 1000 ? Math.round(d.count / 1000) + 'k' : d.count}</text>`
    : pip;
  el.innerHTML = `<svg class="${cls}" viewBox="0 0 24 24" style="--c:${color}${delay}">
    <polygon points="12,1.8 20.8,6.9 20.8,17.1 12,22.2 3.2,17.1 3.2,6.9"/>${clusterText}</svg>`;
  el.setAttribute('aria-label', `${markerPrimaryText(d)} · ${markerSecondaryText(d)}`);
  el.onmouseenter = ev => {
    el.classList.add('is-hovered');
    showMarkerHover(d, ev);
  };
  el.onmousemove = moveMarkerHoverCard;
  el.onmouseleave = () => {
    el.classList.remove('is-hovered');
    hideMarkerHover();
  };
  el.onclick = ev => {
    ev.stopPropagation();
    if (d.cluster) {
      handleClusterClick(d, el);
      return;
    }
    activateMarker(d, el);
    hideMarkerHover();
    openReportFromMarker(d, 'inspect');
  };
  return el;
}

globe.controls().autoRotate = true;
globe.controls().autoRotateSpeed = 0.35;
globe.controls().addEventListener('start', () => {
  globe.controls().autoRotate = false;
  if (performance.now() < preserveClusterDrilldownUntil) return;
  clearInspectedMarker();
  expandedClusterKey = null;
  expandedClusterRows = [];
  expandedClusterLimit = CASE_CLUSTER_EXPAND_LIMIT;
});
globe.controls().addEventListener('end', () => {
  updateWeatherHeatmapOpacity();
  updateStreamingMapTiles();
  scheduleMarkerLodRender(90);
});
globe.pointOfView({ lat: 30, lng: -40, altitude: 2.3 });
if (globe.customLayerData && globe.customThreeObject) {
  globe
    .customLayerData([])
    .customThreeObject(() => {
      ensureWeatherHeatmapLayer();
      return weatherHeatmapMesh;
    })
    .customThreeObjectUpdate(obj => {
      if (obj && weatherHeatmapMesh) obj.visible = weatherHeatmapMesh.visible;
    });
}
loadHighResolutionEarthTexture();
loadPoliticalOverlay();
updateStreamingMapTiles();

let solarSystemGroup = null;
let solarBodies = {};
let currentAstroContext = null;
let orbitSystemGroup = null;

let weatherHeatmapMesh = null;
let weatherHeatmapCanvas = null;
let weatherHeatmapTexture = null;
let weatherHeatmapMaterial = null;
let weatherHeatmapLastSignature = '';
let weatherHeatmapStats = null;

function setWeatherHeatmapDebug(extra = {}) {
  const root = document.documentElement;
  Object.entries(extra).forEach(([key, value]) => {
    root.dataset[`weatherHeatmap${key}`] = String(value);
  });
}

function ensureWeatherHeatmapLayer() {
  if (!WEATHER_HEATMAP_ENABLED || weatherHeatmapMesh || typeof THREE === 'undefined') return;
  weatherHeatmapCanvas = document.createElement('canvas');
  weatherHeatmapCanvas.width = WEATHER_HEATMAP_WIDTH;
  weatherHeatmapCanvas.height = WEATHER_HEATMAP_HEIGHT;
  weatherHeatmapTexture = new THREE.CanvasTexture(weatherHeatmapCanvas);
  weatherHeatmapTexture.wrapS = THREE.RepeatWrapping;
  weatherHeatmapTexture.wrapT = THREE.ClampToEdgeWrapping;
  weatherHeatmapTexture.anisotropy = 2;
  if ('colorSpace' in weatherHeatmapTexture && THREE.SRGBColorSpace) weatherHeatmapTexture.colorSpace = THREE.SRGBColorSpace;
  weatherHeatmapMaterial = new THREE.MeshBasicMaterial({
    map: weatherHeatmapTexture,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    depthTest: true,
    blending: THREE.NormalBlending,
  });
  const geo = new THREE.SphereGeometry(100.7, 128, 64);
  weatherHeatmapMesh = new THREE.Mesh(geo, weatherHeatmapMaterial);
  weatherHeatmapMesh.name = 'ufo-weather-heatmap';
  weatherHeatmapMesh.rotation.y = WEATHER_HEATMAP_MESH_ROTATION_Y;
  weatherHeatmapMesh.renderOrder = 4;
  weatherHeatmapMesh.visible = false;
}

function weatherHeatColor(t) {
  const stops = [
    [0.00, 22, 178, 255],
    [0.24, 0, 232, 209],
    [0.48, 170, 239, 92],
    [0.68, 255, 218, 70],
    [0.84, 255, 136, 38],
    [1.00, 243, 45, 71],
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i], b = stops[i + 1];
    if (t <= b[0]) {
      const f = (t - a[0]) / Math.max(0.0001, b[0] - a[0]);
      return [
        Math.round(a[1] + (b[1] - a[1]) * f),
        Math.round(a[2] + (b[2] - a[2]) * f),
        Math.round(a[3] + (b[3] - a[3]) * f),
      ];
    }
  }
  return [239, 71, 111];
}

function blurDensity(src, w, h, radius) {
  const tmp = new Float32Array(src.length);
  const dst = new Float32Array(src.length);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      let sum = 0, weight = 0;
      for (let k = -radius; k <= radius; k++) {
        const xx = (x + k + w) % w;
        const f = radius + 1 - Math.abs(k);
        sum += src[row + xx] * f;
        weight += f;
      }
      tmp[row + x] = sum / weight;
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0, weight = 0;
      for (let k = -radius; k <= radius; k++) {
        const yy = Math.max(0, Math.min(h - 1, y + k));
        const f = radius + 1 - Math.abs(k);
        sum += tmp[yy * w + x] * f;
        weight += f;
      }
      dst[y * w + x] = sum / weight;
    }
  }
  return dst;
}

function drawWeatherHeatmap(points) {
  ensureWeatherHeatmapLayer();
  if (!weatherHeatmapCanvas || !weatherHeatmapTexture) return;
  const w = WEATHER_HEATMAP_WIDTH, h = WEATHER_HEATMAP_HEIGHT;
  const density = new Float32Array(w * h);
  points.forEach(p => {
    if (!hasCoords(p)) return;
    const u = ((((p.lng + 180) % 360) + 360) % 360) / 360;
    const x = Math.floor(u * w);
    const y = Math.floor(((90 - p.lat) / 180) * h);
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    density[y * w + x] += 1;
  });
  let blurred = blurDensity(density, w, h, isMobile() ? 4 : 6);
  blurred = blurDensity(blurred, w, h, isMobile() ? 3 : 5);

  const positives = [];
  for (let i = 0; i < blurred.length; i += 2) if (blurred[i] > 0) positives.push(blurred[i]);
  positives.sort((a, b) => a - b);
  const ref = positives.length ? positives[Math.floor(positives.length * 0.982)] || positives[positives.length - 1] : 1;
  const ctx = weatherHeatmapCanvas.getContext('2d');
  const img = ctx.createImageData(w, h);
  const data = img.data;
  const logRef = Math.log1p(Math.max(1, ref));
  let activePixels = 0;
  let maxRaw = 0;
  for (let i = 0; i < blurred.length; i++) {
    const raw = blurred[i];
    if (raw > maxRaw) maxRaw = raw;
    const px = i * 4;
    if (raw <= 0.01) {
      data[px + 3] = 0;
      continue;
    }
    activePixels++;
    const t = Math.min(1, Math.log1p(raw) / logRef);
    const c = weatherHeatColor(Math.pow(t, 0.76));
    data[px] = c[0];
    data[px + 1] = c[1];
    data[px + 2] = c[2];
    data[px + 3] = Math.round(Math.min(0.66, 0.08 + Math.pow(t, 0.68) * 0.58) * 255);
  }
  ctx.putImageData(img, 0, 0);
  weatherHeatmapTexture.needsUpdate = true;
  weatherHeatmapStats = { activePixels, maxRaw: +maxRaw.toFixed(3), ref: +ref.toFixed(3), width: w, height: h };
}

function weatherHeatmapOpacityForAltitude() {
  const altitude = globe.pointOfView?.().altitude;
  const a = Number.isFinite(altitude) ? altitude : 2.3;
  if (a <= 0.14) return 0.08;
  if (a <= 0.22) return 0.16;
  if (a <= 0.34) return 0.28;
  if (a <= 0.55) return 0.48;
  if (a <= 0.85) return 0.68;
  return 0.9;
}

function updateWeatherHeatmapOpacity() {
  if (!weatherHeatmapMaterial) return;
  weatherHeatmapMaterial.opacity = weatherHeatmapOpacityForAltitude();
  window.__ufologistWeatherOpacity = () => weatherHeatmapMaterial.opacity;
}
window.updateWeatherHeatmapOpacity = updateWeatherHeatmapOpacity;

function updateWeatherHeatmap(points, visible) {
  ensureWeatherHeatmapLayer();
  const supported = !!weatherHeatmapMesh && !!(globe.customLayerData && globe.customThreeObject);
  if (!weatherHeatmapMesh) {
    setWeatherHeatmapDebug({
      Enabled: WEATHER_HEATMAP_ENABLED,
      Visible: false,
      Supported: supported,
      Points: points.length,
      ActivePixels: weatherHeatmapStats?.activePixels || 0,
    });
    return;
  }
  weatherHeatmapMesh.visible = !!visible && points.length > 0 && supported;
  updateWeatherHeatmapOpacity();
  if (globe.customLayerData) globe.customLayerData(weatherHeatmapMesh.visible ? [{ id: 'weather-heatmap' }] : []);
  setWeatherHeatmapDebug({
    Enabled: WEATHER_HEATMAP_ENABLED,
    Visible: weatherHeatmapMesh.visible,
    Supported: supported,
    Points: points.length,
    ActivePixels: weatherHeatmapStats?.activePixels || 0,
  });
  if (!weatherHeatmapMesh.visible) return;
  const signature = [
    state.viewMode, state.layerMode, state.yearFrom, state.yearTo, points.length,
    [...state.types].join(','), [...state.shapes].join(','), [...state.geipanClasses].join(','),
    [...state.officialSources].join(','), [...state.geoQuality].join(','), [...state.geoContexts].join(','),
    state.massOn ? 1 : 0, state.geipanOn ? 1 : 0, state.officialOn ? 1 : 0, state.tod,
    isMobile() ? 'm' : 'd',
  ].join('|');
  if (signature === weatherHeatmapLastSignature) return;
  weatherHeatmapLastSignature = signature;
  drawWeatherHeatmap(points);
  setWeatherHeatmapDebug({
    ActivePixels: weatherHeatmapStats?.activePixels || 0,
    MaxRaw: weatherHeatmapStats?.maxRaw || 0,
    Ref: weatherHeatmapStats?.ref || 0,
  });
}
let orbitBodies = {};
let orbitLines = {};
let orbitLabels = {};
let orbitEventMarker = null;
let orbitConnectors = {};
let orbitBackdrop = null;
let earthSceneVisibility = null;
function globeVector(lat, lng, radius = 1) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lng + 180) * Math.PI / 180;
  return {
    x: -radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta),
  };
}
function astroVectorToScene(v, radius) {
  const len = Math.hypot(v.x, v.y, v.z) || 1;
  return new THREE.Vector3(
    -(v.x / len) * radius,
    (v.z / len) * radius,
    (v.y / len) * radius
  );
}
function helioVectorToOrbitScene(v) {
  const len = Math.hypot(v.x, v.y, v.z) || 1;
  const radius = Math.pow(Math.max(0.04, len), 0.46) * 2.05;
  return new THREE.Vector3(
    -(v.x / len) * radius,
    (v.z / len) * radius,
    (v.y / len) * radius
  );
}
function scaledBodyRadius(dist, kind) {
  if (kind === 'sun') return 4.8;
  if (kind === 'moon') return 1.55;
  return 2.05 + Math.min(2.1, Math.log10(1 + Math.max(0, dist)) * 1.35);
}
function orbitBodySpec(name) {
  const specs = {
    Mercury: { color: 0xb9aa92, size: 0.065, days: 87.969, samples: 120, au: '0,39 UA' },
    Venus: { color: 0xf0d38a, size: 0.082, days: 224.701, samples: 160, au: '0,72 UA' },
    Earth: { color: 0x5cb7ff, size: 0.12, days: 365.256, samples: 220, au: '1,00 UA' },
    Mars: { color: 0xf0785a, size: 0.078, days: 686.98, samples: 240, au: '1,52 UA' },
    Jupiter: { color: 0xe0b075, size: 0.235, days: 4332.59, samples: 320, au: '5,20 UA' },
    Saturn: { color: 0xd6c08a, size: 0.205, days: 10759.22, samples: 320, au: '9,58 UA' },
    Uranus: { color: 0x8fd7d7, size: 0.145, days: 30688.5, samples: 340, au: '19,20 UA' },
    Neptune: { color: 0x6f8ee8, size: 0.145, days: 60182, samples: 360, au: '30,05 UA' },
  };
  return specs[name];
}
function configureTexture(texture) {
  if (!texture || !window.THREE) return texture;
  if ('colorSpace' in texture && THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
function ensureSolarSystemScene() {
  if (solarSystemGroup || !window.THREE || !globe.scene) return;
  const scene = globe.scene();
  solarSystemGroup = new THREE.Group();
  solarSystemGroup.name = 'ufologist-solar-system';
  scene.add(solarSystemGroup);

  const specs = [
    ['Sun', 0xffd166, 0.085],
    ['Moon', 0xdce7ff, 0.035],
    ['Mercury', 0xb9aa92, 0.026],
    ['Venus', 0xf0d38a, 0.034],
    ['Mars', 0xf0785a, 0.032],
    ['Jupiter', 0xe0b075, 0.052],
    ['Saturn', 0xd6c08a, 0.048],
    ['Uranus', 0x8fd7d7, 0.04],
    ['Neptune', 0x6f8ee8, 0.04],
  ];
  specs.forEach(([name, color, size]) => {
    const geo = new THREE.SphereGeometry(size, 16, 12);
    const mat = new THREE.MeshBasicMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = `astro-${name}`;
    solarSystemGroup.add(mesh);
    solarBodies[name] = mesh;
  });
}
function updateSolarSystemScene(ctx) {
  if (!ctx || !ctx.available) return;
  ensureSolarSystemScene();
  if (!solarSystemGroup) return;
  solarSystemGroup.visible = state.viewMode === 'earth';
  if (solarBodies.Sun && ctx.sunGeo) {
    solarBodies.Sun.position.copy(astroVectorToScene(ctx.sunGeo, scaledBodyRadius(ctx.sunGeo.dist, 'sun')));
  }
  if (solarBodies.Moon && ctx.moon?.geo) {
    solarBodies.Moon.position.copy(astroVectorToScene(ctx.moon.geo, scaledBodyRadius(ctx.moon.geo.dist, 'moon')));
  }
  (ctx.planets || []).forEach(p => {
    const mesh = solarBodies[p.name];
    if (mesh && p.geo) mesh.position.copy(astroVectorToScene(p.geo, scaledBodyRadius(p.geo.dist, 'planet')));
  });
}
function makeTextSprite(text, color = '#d9e8ff') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,.85)';
  ctx.shadowBlur = 8;
  ctx.fillStyle = color;
  const lines = String(text).split('\\n');
  lines.forEach((line, i) => {
    ctx.font = i === 0 ? '700 23px Space Grotesk, Arial, sans-serif' : '500 17px JetBrains Mono, monospace';
    ctx.fillText(line.toUpperCase(), canvas.width / 2, 36 + i * 27);
  });
  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.renderOrder = 30;
  sprite.scale.set(1.04, 0.39, 1);
  return sprite;
}
function isOrbitObject(obj) {
  let cursor = obj;
  while (cursor) {
    if (cursor === orbitSystemGroup) return true;
    cursor = cursor.parent;
  }
  return false;
}
function setEarthSceneVisible(visible) {
  const scene = globe.scene && globe.scene();
  if (!scene) return;
  if (!earthSceneVisibility) earthSceneVisibility = new Map();
  scene.traverse(obj => {
    if (obj === scene || isOrbitObject(obj) || obj.isLight) return;
    if (!earthSceneVisibility.has(obj)) earthSceneVisibility.set(obj, obj.visible);
    obj.visible = visible ? earthSceneVisibility.get(obj) : false;
  });
}
function makeOrbitEllipse(points, color, opacity, dashed = false) {
  const mat = dashed
    ? new THREE.LineDashedMaterial({ color, transparent: true, opacity, dashSize: 0.075, gapSize: 0.065, depthWrite: false, depthTest: false })
    : new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false, depthTest: false });
  const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), mat);
  if (dashed) line.computeLineDistances();
  return line;
}
function makeBelt(name, inner, outer, color, count, opacity) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = inner + Math.random() * (outer - inner);
    const y = (Math.random() - 0.5) * 0.05;
    positions[i * 3] = Math.cos(a) * r;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = Math.sin(a) * r * 0.72;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color,
    size: 0.018,
    transparent: true,
    opacity,
    depthWrite: false,
    depthTest: false,
  });
  const points = new THREE.Points(geo, mat);
  points.name = name;
  return points;
}
function ensureOrbitSystemScene() {
  if (orbitSystemGroup || !window.THREE || !globe.scene) return;
  const scene = globe.scene();
  const loader = new THREE.TextureLoader();
  orbitSystemGroup = new THREE.Group();
  orbitSystemGroup.name = 'ufologist-orbit-view';
  orbitSystemGroup.scale.setScalar(33);
  orbitSystemGroup.visible = false;
  scene.add(orbitSystemGroup);

  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(0.26, 48, 28),
    new THREE.MeshBasicMaterial({ color: 0xffd166 })
  );
  sun.name = 'orbit-Sun';
  orbitSystemGroup.add(sun);
  orbitBodies.Sun = sun;
  const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: (() => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      const g = ctx.createRadialGradient(128, 128, 5, 128, 128, 126);
      g.addColorStop(0, 'rgba(255,218,102,0.95)');
      g.addColorStop(0.35, 'rgba(255,160,64,0.28)');
      g.addColorStop(1, 'rgba(255,160,64,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 256);
      return new THREE.CanvasTexture(canvas);
    })(),
    transparent: true,
    depthWrite: false,
    depthTest: false,
  }));
  sunGlow.name = 'orbit-Sun-glow';
  sunGlow.scale.set(1.3, 1.3, 1);
  orbitSystemGroup.add(sunGlow);

  const earthMap = configureTexture(loader.load(EARTH_DAY_TEXTURE));
  const earthMat = new THREE.MeshBasicMaterial({ map: earthMap });
  ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'].forEach(name => {
    const spec = orbitBodySpec(name);
    const mat = name === 'Earth'
      ? earthMat
      : new THREE.MeshBasicMaterial({ color: spec.color });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(spec.size, 24, 16), mat);
    mesh.name = `orbit-${name}`;
    orbitSystemGroup.add(mesh);
    orbitBodies[name] = mesh;

    if (name === 'Saturn') {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(spec.size * 1.35, spec.size * 2.1, 64),
        new THREE.MeshBasicMaterial({ color: 0xd6c08a, transparent: true, opacity: 0.36, side: THREE.DoubleSide, depthWrite: false })
      );
      ring.rotation.x = Math.PI / 2.5;
      mesh.add(ring);
    }
    if (name === 'Earth') {
      const focusRing = new THREE.Mesh(
        new THREE.RingGeometry(spec.size * 1.45, spec.size * 1.78, 48),
        new THREE.MeshBasicMaterial({ color: 0x7fd0ff, transparent: true, opacity: 0.62, side: THREE.DoubleSide, depthWrite: false, depthTest: false })
      );
      focusRing.rotation.x = Math.PI / 2.05;
      mesh.add(focusRing);
      const earthGlow = new THREE.Sprite(new THREE.SpriteMaterial({
        color: 0x7fd0ff,
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
        depthTest: false,
      }));
      earthGlow.scale.set(spec.size * 4.8, spec.size * 4.8, 1);
      mesh.add(earthGlow);
    }

    const label = makeTextSprite(`${planetLabel(name)}\\n${spec.au}`, name === 'Earth' ? '#7fd0ff' : '#cdd8ef');
    label.scale.set(name === 'Earth' ? 1.25 : 1.02, name === 'Earth' ? 0.46 : 0.38, 1);
    orbitSystemGroup.add(label);
    orbitLabels[name] = label;

    const lineMat = new THREE.LineBasicMaterial({
      color: name === 'Earth' ? 0x59caff : (['Mercury', 'Venus', 'Mars'].includes(name) ? 0xd99058 : 0x3598d3),
      transparent: true,
      opacity: name === 'Earth' ? 0.72 : 0.44,
      depthWrite: false,
      depthTest: false,
    });
    const line = new THREE.LineLoop(new THREE.BufferGeometry(), lineMat);
    line.name = `orbit-line-${name}`;
    orbitSystemGroup.add(line);
    orbitLines[name] = line;
  });

  orbitBodies.Moon = new THREE.Mesh(
    new THREE.SphereGeometry(0.046, 18, 12),
    new THREE.MeshBasicMaterial({ color: 0xdce7ff })
  );
  orbitSystemGroup.add(orbitBodies.Moon);
  orbitLabels.Moon = makeTextSprite(currentLang === 'en' ? 'Moon' : 'Luna', '#dce7ff');
  orbitSystemGroup.add(orbitLabels.Moon);

  orbitEventMarker = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 18, 12),
    new THREE.MeshBasicMaterial({ color: 0xff5a8a })
  );
  orbitSystemGroup.add(orbitEventMarker);

  orbitBackdrop = new THREE.Group();
  orbitBackdrop.name = 'orbit-belts-and-guides';
  orbitBackdrop.add(makeBelt('asteroid-belt', 3.55, 4.25, 0xd8a453, 1300, 0.26));
  orbitBackdrop.add(makeBelt('kuiper-belt', 8.5, 10.4, 0x4aa9e8, 1600, 0.16));
  orbitSystemGroup.add(orbitBackdrop);

  orbitConnectors.sunEarth = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.58, depthWrite: false, depthTest: false })
  );
  orbitSystemGroup.add(orbitConnectors.sunEarth);
  orbitConnectors.earthMoon = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0xdce7ff, transparent: true, opacity: 0.72, depthWrite: false, depthTest: false })
  );
  orbitSystemGroup.add(orbitConnectors.earthMoon);
}
function updateOrbitLines(date) {
  if (!window.Astronomy || !orbitSystemGroup) return;
  const A = window.Astronomy;
  const center = new Date(date);
  ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'].forEach(name => {
    const spec = orbitBodySpec(name);
    const points = [];
    for (let i = 0; i < spec.samples; i++) {
      const f = (i / spec.samples) - 0.5;
      const d = new Date(center.getTime() + f * spec.days * 86400000);
      const v = A.HelioVector(A.Body[name], new A.AstroTime(d));
      points.push(helioVectorToOrbitScene(v));
    }
    orbitLines[name].geometry.dispose();
    orbitLines[name].geometry = new THREE.BufferGeometry().setFromPoints(points);
  });
}
function updateOrbitSystemScene(ctx) {
  if (!ctx || !ctx.available || !window.Astronomy) return;
  ensureOrbitSystemScene();
  if (!orbitSystemGroup) return;
  const A = window.Astronomy;
  orbitSystemGroup.visible = state.viewMode === 'orbit';
  updateOrbitLines(ctx.date);

  const earthVector = A.HelioVector(A.Body.Earth, new A.AstroTime(ctx.date));
  const earthPos = helioVectorToOrbitScene(earthVector);
  orbitBodies.Earth.position.copy(earthPos);

  (ctx.planets || []).forEach(p => {
    const mesh = orbitBodies[p.name];
    if (mesh && p.helio) mesh.position.copy(helioVectorToOrbitScene(p.helio));
  });

  if (orbitBodies.Moon && ctx.moon?.geo) {
    const moonDir = astroVectorToScene(ctx.moon.geo, 1).normalize();
    orbitBodies.Moon.position.copy(earthPos).add(moonDir.multiplyScalar(0.42));
  }
  Object.entries(orbitLabels).forEach(([name, label]) => {
    const body = orbitBodies[name];
    if (!body) return;
    const offset = name === 'Moon' ? 0.18 : (name === 'Earth' ? 0.36 : 0.28);
    label.position.copy(body.position).add(new THREE.Vector3(0, offset, 0));
  });
  if (orbitEventMarker && currentAstroContext?.caseLatLng) {
    const v = globeVector(currentAstroContext.caseLatLng.lat, currentAstroContext.caseLatLng.lng, 0.18);
    orbitEventMarker.position.copy(earthPos).add(new THREE.Vector3(v.x, v.y, v.z));
  }
  if (orbitConnectors.sunEarth) {
    orbitConnectors.sunEarth.geometry.dispose();
    orbitConnectors.sunEarth.geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), earthPos]);
  }
  if (orbitConnectors.earthMoon && orbitBodies.Moon) {
    orbitConnectors.earthMoon.geometry.dispose();
    orbitConnectors.earthMoon.geometry = new THREE.BufferGeometry().setFromPoints([earthPos, orbitBodies.Moon.position]);
  }
}
function applySolarContext(ctx) {
  if (!ctx || !ctx.subsolar) return;
  currentAstroContext = ctx;
  updateSolarSystemScene(ctx);
  updateOrbitSystemScene(ctx);
  refresh();
}

function zoomGlobe(direction) {
  const pov = globe.pointOfView();
  const current = Number.isFinite(pov.altitude) ? pov.altitude : 2.3;
  const factor = direction > 0 ? 0.62 : 1.42;
  const altitude = Math.max(EARTH_MIN_ALTITUDE, Math.min(EARTH_MAX_ALTITUDE, current * factor));
  globe.controls().autoRotate = false;
  globe.pointOfView({ lat: pov.lat, lng: pov.lng, altitude }, 420);
  setTimeout(() => {
    updateWeatherHeatmapOpacity();
    updateStreamingMapTiles();
  }, 430);
  scheduleMarkerLodRender(460);
}
$('btn-zoom-in').onclick = () => zoomGlobe(1);
$('btn-zoom-out').onclick = () => zoomGlobe(-1);
function setGlobeSurfaceVisible(visible) {
  const material = globe.globeMaterial && globe.globeMaterial();
  if (material) material.visible = visible;
}
function setViewMode(mode) {
  if (!['earth', 'orbit'].includes(mode)) return;
  state.viewMode = mode;
  document.querySelectorAll('#view-toggle button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === mode);
  });
  configurePoliticalOverlay();
  updateStreamingMapTiles();
  setEarthSceneVisible(mode === 'earth');
  setGlobeSurfaceVisible(mode === 'earth');
  if (globe.showAtmosphere) globe.showAtmosphere(mode === 'earth');
  globe.atmosphereAltitude(mode === 'earth' ? 0.155 : 0);
  if (solarSystemGroup) solarSystemGroup.visible = mode === 'earth';
  if (orbitSystemGroup) orbitSystemGroup.visible = mode === 'orbit';
  if (mode === 'orbit') {
    ensureOrbitSystemScene();
    if (!currentAstroContext && window.UFOAstro) {
      const now = new Date();
      const ctx = UFOAstro.computeCaseContext({ datetimeUtc: now.toISOString(), date: now.toISOString().slice(0, 10), lat: 0, lng: 0 }, currentLang);
      if (ctx) ctx.caseLatLng = { lat: 0, lng: 0 };
      applySolarContext(ctx);
    }
    if (currentAstroContext) updateOrbitSystemScene(currentAstroContext);
    globe.controls().autoRotate = false;
    globe.pointOfView({ lat: 48, lng: -58, altitude: 5.9 }, 900);
  } else {
    setEarthSceneVisible(true);
    if (currentAstroContext) updateSolarSystemScene(currentAstroContext);
    globe.pointOfView({ lat: 30, lng: -40, altitude: 2.3 }, 900);
  }
  refresh();
}
$('btn-view-earth').onclick = () => setViewMode('earth');
$('btn-view-orbit').onclick = () => setViewMode('orbit');

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
function isoFromDateInt(d) {
  const y = Math.floor(d / 10000), m = Math.floor(d / 100) % 100, da = d % 100;
  return `${y}-${String(m).padStart(2, '0')}-${String(da).padStart(2, '0')}`;
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
    (c.mine || c.cred >= state.credMin) &&
    geoAllowed(c) &&
    contextAllowed(c)
  );
}

let lastMassCount = 0;
function refresh() {
  const curated = filteredCases();
  const mass = massFiltered();
  const geipan = geipanFiltered();
  const official = officialFiltered();
  const officialGeo = official.filter(hasCoords);
  lastMassCount = mass.length;
  const heatPoints = curated.concat(mass, geipan, officialGeo);
  const showHeatLayer = state.viewMode === 'earth' && state.layerMode !== 'points';
  document.body.dataset.viewMode = state.viewMode;
  document.body.dataset.layerMode = state.layerMode;
  const heatTotal = mass.length + geipan.length + officialGeo.length;
  heatRef = heatTotal > 0 ? Math.max(20, heatTotal / 30) : 15;

  currentCaseMarkerRows = [];
  currentCaseMarkerRender = { markers: 0, clusters: 0, expanded: 0, total: 0 };
  clearInspectedMarker();
  expandedClusterKey = null;
  expandedClusterRows = [];
  expandedClusterLimit = CASE_CLUSTER_EXPAND_LIMIT;
  if (state.viewMode === 'earth' && state.layerMode !== 'heat' && casesReady) {
    currentCaseMarkerRows = curated.concat(mass, geipan, officialGeo);
  }
  const markerInfo = renderCaseMarkersFromCurrent();
  globe.pointsData([]);
  updateWeatherHeatmap(heatPoints, WEATHER_HEATMAP_ENABLED && showHeatLayer);
  globe.hexBinPointsData([]);
  const labels = (state.viewMode === 'earth' && state.hotspots ? HOTSPOTS.slice() : []);
  globe.labelsData(labels);

  renderCaseList(curated, official);
  renderTypeCounts();
  renderShapeCounts();
  renderGeipanCounts();
  renderOfficialCounts();
  renderGeoQualityCounts();
  renderGeoContextCounts();
  $('case-count').textContent = fmtNum(curated.length + mass.length + geipan.length + official.length);
  const parts = [`${fmtNum(curated.length)} ${t('curated')}`];
  if (mass.length) parts.push(`${fmtNum(mass.length)} NUFORC`);
  if (geipan.length) parts.push(`${fmtNum(geipan.length)} GEIPAN`);
  if (official.length) parts.push(`${fmtNum(official.length)} ${t('officialShort')}${officialGeo.length !== official.length ? ` (${fmtNum(officialGeo.length)} ${t('mapShort')})` : ''}`);
  const sourceTotal = mass.length + geipan.length + officialGeo.length;
  currentSelectionHintBase = parts.join(' + ');
  currentSelectionMarkerTotal = curated.length + sourceTotal;
  currentCaseMarkerRender = markerInfo;
  updateSelectionHint();
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

// ---------- Source filters (official archive candidates) ----------
function buildOfficialFilters(sources) {
  const wrap = $('official-filters');
  if (!wrap) return;
  wrap.innerHTML = '';
  sources.forEach(src => {
    const el = document.createElement('span');
    el.className = 'shape-pill' + (state.officialSources.has(src.id) ? '' : ' off');
    el.dataset.officialSource = src.id;
    el.title = `${src.label} · ${fmtNum(src.geolocated)} ${currentLang === 'en' ? 'geolocated' : 'geolocalizados'}`;
    el.innerHTML = `<span class="sdot" style="background:${SHAPE_META[9].color}"></span>${esc(src.label)} <span class="o-count"></span>`;
    el.onclick = () => {
      state.officialSources.has(src.id) ? state.officialSources.delete(src.id) : state.officialSources.add(src.id);
      el.classList.toggle('off', !state.officialSources.has(src.id));
      refresh();
    };
    wrap.appendChild(el);
  });
  renderOfficialCounts();
}
function renderOfficialCounts() {
  if (!officialData) return;
  const counts = {};
  officialData.forEach(r => {
    if (r.year >= state.yearFrom && r.year <= state.yearTo) counts[r.sid] = (counts[r.sid] || 0) + 1;
  });
  document.querySelectorAll('#official-filters .shape-pill').forEach(el => {
    el.querySelector('.o-count').textContent = counts[el.dataset.officialSource] || 0;
  });
}
$('official-toggle').onchange = e => { state.officialOn = e.target.checked; refresh(); };

// ---------- Geographic precision filters ----------
function buildGeoQualityFilters() {
  const wrap = $('geo-quality-filters');
  if (!wrap) return;
  wrap.innerHTML = '';
  GEO_QUALITY_META.forEach(g => {
    const el = document.createElement('span');
    el.className = 'shape-pill' + (state.geoQuality.has(g.id) ? '' : ' off');
    el.dataset.geoQuality = g.id;
    el.title = geoQualityDesc(g.id);
    el.innerHTML = `<span class="sdot" style="background:${g.color}"></span>${geoQualityLabel(g.id)} <span class="q-count"></span>`;
    el.onclick = () => {
      state.geoQuality.has(g.id) ? state.geoQuality.delete(g.id) : state.geoQuality.add(g.id);
      el.classList.toggle('off', !state.geoQuality.has(g.id));
      refresh();
    };
    wrap.appendChild(el);
  });
  renderGeoQualityCounts();
}
function renderGeoQualityCounts() {
  const counts = Object.fromEntries(GEO_QUALITY_META.map(g => [g.id, 0]));
  allCuratedPool().forEach(c => {
    if (c.year >= state.yearFrom && c.year <= state.yearTo && state.types.has(c.type) && (c.mine || c.cred >= state.credMin) && contextAllowed(c))
      counts[geoQuality(c)]++;
  });
  if (state.massOn && massData) {
    massData.forEach(r => {
      if (r.year >= state.yearFrom && r.year <= state.yearTo && state.shapes.has(r.s) && contextAllowed(r)) counts[geoQuality(r)]++;
    });
  }
  if (state.geipanOn && geipanData) {
    geipanData.forEach(r => {
      if (r.year >= state.yearFrom && r.year <= state.yearTo && state.geipanClasses.has(r.ci) && contextAllowed(r)) counts[geoQuality(r)]++;
    });
  }
  if (state.officialOn && officialData) {
    officialData.forEach(r => {
      if (r.year >= state.yearFrom && r.year <= state.yearTo && state.officialSources.has(r.sid) && contextAllowed(r)) counts[geoQuality(r)]++;
    });
  }
  document.querySelectorAll('#geo-quality-filters .shape-pill').forEach(el => {
    const n = counts[el.dataset.geoQuality] || 0;
    el.querySelector('.q-count').textContent = n > 999 ? (n / 1000).toFixed(1) + 'k' : n;
  });
}

// ---------- Geographic context filters ----------
function buildGeoContextFilters() {
  const wrap = $('geo-context-filters');
  if (!wrap) return;
  wrap.innerHTML = '';
  GEO_CONTEXT_META.forEach(g => {
    const el = document.createElement('span');
    el.className = 'shape-pill' + (state.geoContexts.has(g.id) ? '' : ' off');
    el.dataset.geoContext = g.id;
    el.title = geoContextDesc(g.id);
    el.innerHTML = `<span class="sdot" style="background:${g.color}"></span>${geoContextLabel(g.id)} <span class="x-count"></span>`;
    el.onclick = () => {
      state.geoContexts.has(g.id) ? state.geoContexts.delete(g.id) : state.geoContexts.add(g.id);
      el.classList.toggle('off', !state.geoContexts.has(g.id));
      refresh();
    };
    wrap.appendChild(el);
  });
  renderGeoContextCounts();
}
function renderGeoContextCounts() {
  const counts = Object.fromEntries(GEO_CONTEXT_META.map(g => [g.id, 0]));
  const addTags = d => geoContextTags(d).forEach(tag => { if (tag in counts) counts[tag]++; });
  allCuratedPool().forEach(c => {
    if (c.year >= state.yearFrom && c.year <= state.yearTo && state.types.has(c.type) && (c.mine || c.cred >= state.credMin) && geoAllowed(c))
      addTags(c);
  });
  if (state.massOn && massData) {
    massData.forEach(r => {
      if (r.year >= state.yearFrom && r.year <= state.yearTo && state.shapes.has(r.s) && geoAllowed(r)) addTags(r);
    });
  }
  if (state.geipanOn && geipanData) {
    geipanData.forEach(r => {
      if (r.year >= state.yearFrom && r.year <= state.yearTo && state.geipanClasses.has(r.ci) && geoAllowed(r)) addTags(r);
    });
  }
  if (state.officialOn && officialData) {
    officialData.forEach(r => {
      if (r.year >= state.yearFrom && r.year <= state.yearTo && state.officialSources.has(r.sid) && geoAllowed(r)) addTags(r);
    });
  }
  document.querySelectorAll('#geo-context-filters .shape-pill').forEach(el => {
    const n = counts[el.dataset.geoContext] || 0;
    el.querySelector('.x-count').textContent = n > 999 ? (n / 1000).toFixed(1) + 'k' : n;
  });
}

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
function renderCaseList(data, official = []) {
  const wrap = $('case-list');
  wrap.innerHTML = '';
  const rows = [
    ...data.map(c => ({ kind: 'curated', year: c.year, item: c })),
    ...official.map(o => ({ kind: 'official', year: o.year, item: o })),
  ].sort((a, b) => b.year - a.year).slice(0, 900);
  rows.forEach(row => {
    const c = row.item;
    const el = document.createElement('div');
    el.className = 'case-item' + (state.selectedCase === c.id ? ' active' : '');
    if (row.kind === 'official') {
      const color = reportVisualColor(c);
      el.innerHTML = `
        <div class="ci-top"><span class="ci-dot" style="background:${color}"></span>
        <span class="ci-name">${esc(c.title)}</span></div>
        <div class="ci-meta">${c.year} · ${esc(c.source)} · ${hasCoords(c) ? esc(c.loc || c.country || '') : t('officialNoCoords')}</div>`;
      el.onclick = () => openOfficialReport(c, true);
    } else {
      el.innerHTML = `
        <div class="ci-top"><span class="ci-dot" style="background:${TYPE_META[c.type].color}"></span>
        <span class="ci-name">${caseName(c)}</span></div>
        <div class="ci-meta">${c.year} · ${caseCountry(c) || t('myNotebook')} · ${c.mine ? '📓' : '★'.repeat(c.cred)}</div>`;
      el.onclick = () => openCase(c.id, true);
    }
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
function deg(v) { return `${v >= 0 ? '+' : ''}${v.toFixed(1)}°`; }
function pct(v) { return `${Math.round(v * 100)}%`; }
function planetLabel(name) {
  const es = { Mercury: 'Mercurio', Venus: 'Venus', Mars: 'Marte', Jupiter: 'Júpiter', Saturn: 'Saturno', Uranus: 'Urano', Neptune: 'Neptuno' };
  return currentLang === 'en' ? name : (es[name] || name);
}
function renderAstroBlock(ctx) {
  if (!ctx) return '';
  const dt = ctx.date.toLocaleString(locale(), {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short',
  });
  const brightPlanetNames = new Set(['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']);
  const visiblePlanets = (ctx.planets || []).filter(p => p.visible && brightPlanetNames.has(p.name)).slice(0, 4);
  const visibleText = visiblePlanets.length
    ? visiblePlanets.map(p => `${planetLabel(p.name)} ${deg(p.altitude)}`).join(' · ')
    : (currentLang === 'en' ? 'None above horizon' : 'Ninguno sobre el horizonte');
  const timeNote = ctx.timeNote ? `<p class="astro-note">${ctx.timeNote}</p>` : '';
  if (!ctx.available) {
    return `<div class="astro-card">
      <h4>${currentLang === 'en' ? 'Celestial context' : 'Contexto celeste'}</h4>
      <p class="hint">${currentLang === 'en' ? 'Astronomy engine unavailable.' : 'Motor astronómico no disponible.'}</p>
      <div class="astro-grid">
        <div><label>${currentLang === 'en' ? 'Case time' : 'Tiempo del caso'}</label><span>${dt}</span></div>
        <div><label>${currentLang === 'en' ? 'Precision' : 'Precisión'}</label><span>${ctx.precisionLabel}</span></div>
      </div>
      ${timeNote}
    </div>`;
  }
  return `<div class="astro-card">
    <h4>${currentLang === 'en' ? 'Celestial context' : 'Contexto celeste'}</h4>
    <div class="astro-grid">
      <div><label>${currentLang === 'en' ? 'Case time' : 'Tiempo del caso'}</label><span>${dt}</span></div>
      <div><label>${currentLang === 'en' ? 'Precision' : 'Precisión'}</label><span>${ctx.precisionLabel}</span></div>
      <div><label>${currentLang === 'en' ? 'Sun altitude' : 'Altura solar'}</label><span>${deg(ctx.sun.altitude)} · ${ctx.sun.visible ? (currentLang === 'en' ? 'daylight' : 'día') : (currentLang === 'en' ? 'below horizon' : 'bajo horizonte')}</span></div>
      <div><label>${currentLang === 'en' ? 'Moon' : 'Luna'}</label><span>${ctx.moon.phaseName} · ${pct(ctx.moon.illuminated)} · ${deg(ctx.moon.altitude)}</span></div>
      <div><label>${currentLang === 'en' ? 'Bright planets above horizon' : 'Planetas brillantes sobre horizonte'}</label><span>${visibleText}</span></div>
      <div><label>${currentLang === 'en' ? 'Subsolar point' : 'Punto subsolar'}</label><span>${ctx.subsolar.lat.toFixed(1)}, ${ctx.subsolar.lng.toFixed(1)}</span></div>
    </div>
    ${timeNote}
    <p class="hint">${currentLang === 'en'
      ? 'Astronomical context is computed from the recorded date. Date-only cases are rendered at 12:00 UTC. Solar-system body positions update in the 3D scene; visual distances and sizes are compressed for readability.'
      : 'El contexto astronómico se calcula desde la fecha registrada. Los casos sin hora se renderizan a las 12:00 UTC. Las posiciones de cuerpos del sistema solar se actualizan en la escena 3D; distancias y tamaños son visuales.'}</p>
  </div>`;
}

function openCase(id, fly) {
  const pool = allCuratedPool();
  const c = pool.find(x => x.id === id);
  if (!c) return;
  closeStats();
  state.selectedCase = id;
  const meta = TYPE_META[c.type];
  const astroContext = window.UFOAstro ? UFOAstro.computeCaseContext(c, currentLang) : null;
  if (astroContext) astroContext.caseLatLng = { lat: c.lat, lng: c.lng };
  applySolarContext(astroContext);
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
    ${renderAstroBlock(astroContext)}
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
    const inspect = fly === 'inspect';
    focusCameraOnReport(c, isMobile() ? 1.35 : 1.14, inspect ? 520 : 950, inspect ? 'inspect' : 'navigate');
  }
  renderCaseList(visible, officialFiltered());
  scheduleHashUpdate();
}

function openMassReport(d, fly = false) {
  closeStats();
  state.selectedCase = null;
  const s = SHAPE_META[d.s];
  const astroContext = window.UFOAstro ? UFOAstro.computeCaseContext({
    date: isoFromDateInt(d.d),
    time: d.h >= 0 ? `${String(d.h).padStart(2, '0')}:00` : undefined,
    lat: d.lat,
    lng: d.lng,
  }, currentLang) : null;
  if (astroContext) astroContext.caseLatLng = { lat: d.lat, lng: d.lng };
  applySolarContext(astroContext);
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
    ${renderAstroBlock(astroContext)}
    <div class="cc-sources"><h4>${t('source')}</h4>
      <a class="cc-source-link" href="https://nuforc.org/databank/" target="_blank" rel="noopener">${t('nuforcDatabank', { date: fmtDateInt(d.d) })}</a>
    </div>
    <div class="cc-media-actions">
      <a class="btn-ghost small" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${encodeURIComponent((d.loc || '') + ' ' + Math.floor(d.d / 10000) + ' UFO sighting')}">▶ ${t('searchVideos')}</a>
      <a class="btn-ghost small" target="_blank" rel="noopener" href="https://www.google.com/search?tbm=isch&q=${encodeURIComponent((d.loc || '') + ' ' + Math.floor(d.d / 10000) + ' UFO')}">🖼 ${t('searchImages')}</a>
    </div>`;
  $('panel-case').classList.remove('hidden');
  mobileOnCaseOpen();
  if (fly) {
    const inspect = fly === 'inspect';
    focusCameraOnReport(d, isMobile() ? 1.28 : 1.06, inspect ? 520 : 950, inspect ? 'inspect' : 'navigate');
  }
}

function openGeipanReport(d, fly = false) {
  closeStats();
  state.selectedCase = null;
  const g = GEIPAN_META[d.ci];
  const astroContext = window.UFOAstro ? UFOAstro.computeCaseContext({
    date: isoFromDateInt(d.d),
    lat: d.lat,
    lng: d.lng,
  }, currentLang) : null;
  if (astroContext) astroContext.caseLatLng = { lat: d.lat, lng: d.lng };
  applySolarContext(astroContext);
  const q = encodeURIComponent((d.zone || 'France') + ' ' + Math.floor(d.d / 10000) + ' OVNI UAP');
  const color = reportVisualColor(d);
  $('case-content').innerHTML = `
    <span class="cc-type-badge" style="background:${color}22;color:${color};border:1px solid ${color}55">
      <span class="dot" style="width:8px;height:8px;border-radius:50%;background:${color}"></span>${geipanLabel(d.ci)}</span>
    <h2 class="cc-title">${t('geipanCase')}</h2>
    <p class="cc-loc">📍 ${d.zone || t('france')} · <span style="color:var(--txt-dim)">${t('departmentLocation')}</span></p>
    <div class="cc-row">
      <div class="cc-stat"><label>${t('date')}</label><span class="v">${fmtDateInt(d.d)}</span></div>
      <div class="cc-stat"><label>${t('classification')}</label><span class="v">${g.code}</span></div>
    </div>
    <p class="cc-summary">${d.resume || t('geipanSummary')}</p>
    <p class="hint">${geipanDesc(d.ci)}</p>
    ${renderAstroBlock(astroContext)}
    <div class="cc-sources"><h4>${t('officialSource')}</h4>
      <a class="cc-source-link" href="https://www.cnes-geipan.fr/fr/recherche/cas" target="_blank" rel="noopener">GEIPAN — Recherche de cas</a>
    </div>
    <div class="cc-media-actions">
      <a class="btn-ghost small" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${q}">▶ ${t('searchVideos')}</a>
      <a class="btn-ghost small" target="_blank" rel="noopener" href="https://www.google.com/search?tbm=isch&q=${q}">🖼 ${t('searchImages')}</a>
    </div>`;
  $('panel-case').classList.remove('hidden');
  mobileOnCaseOpen();
  if (fly) {
    const inspect = fly === 'inspect';
    focusCameraOnReport(d, isMobile() ? 1.28 : 1.06, inspect ? 520 : 950, inspect ? 'inspect' : 'navigate');
  }
}

function openOfficialReport(d, fly) {
  closeStats();
  state.selectedCase = d.id;
  const color = reportVisualColor(d);
  const coords = hasCoords(d);
  const astroContext = (coords && window.UFOAstro && d.date) ? UFOAstro.computeCaseContext({
    date: d.date,
    time: d.time || undefined,
    lat: d.lat,
    lng: d.lng,
  }, currentLang) : null;
  if (astroContext) astroContext.caseLatLng = { lat: d.lat, lng: d.lng };
  applySolarContext(astroContext);
  const dateLabel = d.d ? fmtDateInt(d.d) : (d.date || d.year || '—');
  const q = encodeURIComponent(`${d.title} ${d.year || ''} UFO UAP`);
  const sourceHref = d.sourceUrl || '';
  const geoText = coords ? `${d.lat.toFixed(4)}, ${d.lng.toFixed(4)}${d.geoApprox ? ` · ${esc(d.geoPrecision || 'approx')}` : ''}` : '—';
  const geoNote = coords && d.geoApprox ? ` · <span style="color:var(--txt-dim)">${esc(d.geoLabel || d.geoPrecision || 'approx')}</span>` : '';
  $('case-content').innerHTML = `
    <span class="cc-type-badge" style="background:${color}22;color:${color};border:1px solid ${color}55">
      <span class="dot" style="width:8px;height:8px;border-radius:50%;background:${color}"></span>${t('officialCase')}</span>
    <h2 class="cc-title">${esc(d.title)}</h2>
    <p class="cc-loc">📍 ${esc(d.loc || d.country || t('officialNoCoords'))}${coords ? ` · <a class="cc-map-link" href="${gmaps(d.lat, d.lng)}" target="_blank" rel="noopener">${t('satellite')} ↗</a>${geoNote}` : ` · <span style="color:var(--txt-dim)">${t('officialNoCoords')}</span>`}</p>
    <div class="cc-row">
      <div class="cc-stat"><label>${t('date')}</label><span class="v">${dateLabel}</span></div>
      <div class="cc-stat"><label>${t('source')}</label><span class="v">${esc(d.source)}</span></div>
    </div>
    <div class="cc-row">
      <div class="cc-stat"><label>${t('classification')}</label><span class="v">${esc(d.cls || d.recordType || t('officialReview'))}</span></div>
      <div class="cc-stat"><label>${t('coordinates')}</label><span class="v">${geoText}</span></div>
    </div>
    <p class="cc-summary">${esc(d.summary || t('officialReview'))}</p>
    ${renderAstroBlock(astroContext)}
    <div class="cc-sources"><h4>${t('officialSource')}</h4>
      ${sourceHref ? `<a class="cc-source-link" href="${sourceHref}" target="_blank" rel="noopener">${esc(d.source)}</a>` : ''}
      ${d.sourceFile ? `<span class="cc-source-link" style="display:block;opacity:.78">${esc(d.sourceFile)}</span>` : ''}
    </div>
    <div class="cc-media-actions">
      <a class="btn-ghost small" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${q}">▶ ${t('searchVideos')}</a>
      <a class="btn-ghost small" target="_blank" rel="noopener" href="https://www.google.com/search?tbm=isch&q=${q}">🖼 ${t('searchImages')}</a>
    </div>`;
  $('panel-case').classList.remove('hidden');
  mobileOnCaseOpen();
  if (fly && coords) {
    const inspect = fly === 'inspect';
    focusCameraOnReport(d, isMobile() ? 1.28 : 1.06, inspect ? 520 : 950, inspect ? 'inspect' : 'navigate');
  }
}
$('btn-close-case').onclick = () => {
  $('panel-case').classList.add('hidden');
  state.selectedCase = null;
  clearInspectedMarker();
  renderCaseMarkersFromCurrent();
  scheduleHashUpdate();
};

// ---------- Search ----------
const searchInput = $('search'), searchResults = $('search-results');
searchInput.oninput = () => {
  const q = searchInput.value.trim().toLowerCase();
  if (q.length < 2) { searchResults.classList.add('hidden'); return; }
  const curatedHits = allCuratedPool().filter(c =>
    caseName(c).toLowerCase().includes(q) || (caseLoc(c) || '').toLowerCase().includes(q) ||
    (caseCountry(c) || '').toLowerCase().includes(q) || c.name.toLowerCase().includes(q) ||
    (c.loc || '').toLowerCase().includes(q) || (c.country || '').toLowerCase().includes(q) || c.year.toString().includes(q)
  ).map(c => ({ kind: 'curated', item: c }));
  const officialHits = (officialData || []).filter(o =>
    (o.title || '').toLowerCase().includes(q) || (o.loc || '').toLowerCase().includes(q) ||
    (o.country || '').toLowerCase().includes(q) || (o.source || '').toLowerCase().includes(q) ||
    (o.sourceCaseId || '').toLowerCase().includes(q) || String(o.year || '').includes(q)
  ).map(o => ({ kind: 'official', item: o }));
  const hits = curatedHits.concat(officialHits).slice(0, 10);
  searchResults.innerHTML = hits.length
    ? hits.map(hit => {
      const c = hit.item;
      const isOfficial = hit.kind === 'official';
      const color = isOfficial ? reportVisualColor(c) : TYPE_META[c.type].color;
      return `
        <div class="sr-item" data-kind="${hit.kind}" data-id="${esc(c.id)}">
          <span class="sr-dot" style="background:${color}"></span>
          <div><div class="sr-name">${isOfficial ? esc(c.title) : caseName(c)}</div>
          <div class="sr-meta">${c.year} · ${isOfficial ? esc(c.source) : `${caseLoc(c)}${caseCountry(c) ? ', ' + caseCountry(c) : ''}`}</div></div>
        </div>`;
    }).join('')
    : `<div class="sr-item"><div class="sr-meta">${t('noResults')}</div></div>`;
  searchResults.classList.remove('hidden');
  searchResults.querySelectorAll('.sr-item[data-id]').forEach(el => {
    el.onclick = () => {
      searchResults.classList.add('hidden');
      searchInput.value = '';
      if (el.dataset.kind === 'official') {
        const o = (officialData || []).find(x => x.id === el.dataset.id);
        if (!o) return;
        if (o.year < state.yearFrom || o.year > state.yearTo) { state.yearFrom = YEAR_MIN; state.yearTo = YEAR_MAX; positionHandles(); }
        if (!state.officialSources.has(o.sid)) { state.officialSources.add(o.sid); document.querySelector(`.shape-pill[data-official-source="${o.sid}"]`)?.classList.remove('off'); }
        const oq = geoQuality(o);
        if (!state.geoQuality.has(oq)) { state.geoQuality.add(oq); document.querySelector(`.shape-pill[data-geo-quality="${oq}"]`)?.classList.remove('off'); }
        geoContextTags(o).forEach(tag => {
          if (!state.geoContexts.has(tag)) {
            state.geoContexts.add(tag);
            document.querySelector(`.shape-pill[data-geo-context="${tag}"]`)?.classList.remove('off');
          }
        });
        state.officialOn = true; $('official-toggle').checked = true;
        refresh();
        openOfficialReport(o, true);
        return;
      }
      const c = allCuratedPool().find(x => x.id === el.dataset.id);
      if (c.year < state.yearFrom || c.year > state.yearTo) { state.yearFrom = YEAR_MIN; state.yearTo = YEAR_MAX; positionHandles(); }
      if (!state.types.has(c.type)) { state.types.add(c.type); document.querySelector(`.type-chip[data-type="${c.type}"]`)?.classList.remove('off'); }
      if (!c.mine && c.cred < state.credMin) { state.credMin = 1; $('cred-range').value = 1; $('cred-stars').textContent = '★☆☆☆☆'; }
      const cq = geoQuality(c);
      if (!state.geoQuality.has(cq)) { state.geoQuality.add(cq); document.querySelector(`.shape-pill[data-geo-quality="${cq}"]`)?.classList.remove('off'); }
      geoContextTags(c).forEach(tag => {
        if (!state.geoContexts.has(tag)) {
          state.geoContexts.add(tag);
          document.querySelector(`.shape-pill[data-geo-context="${tag}"]`)?.classList.remove('off');
        }
      });
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
    if (state.types.has(c.type) && (c.mine || c.cred >= state.credMin) && geoAllowed(c) && contextAllowed(c) && c.year >= YEAR_MIN && c.year <= YEAR_MAX)
      counts[c.year - YEAR_MIN]++;
  });
  if (state.massOn && massData) {
    massData.forEach(r => {
      if (r.year >= YEAR_MIN && r.year <= YEAR_MAX && state.shapes.has(r.s) && geoAllowed(r) && contextAllowed(r)) counts[r.year - YEAR_MIN]++;
    });
  }
  if (state.geipanOn && geipanData) {
    geipanData.forEach(r => {
      if (r.year >= YEAR_MIN && r.year <= YEAR_MAX && state.geipanClasses.has(r.ci) && geoAllowed(r) && contextAllowed(r)) counts[r.year - YEAR_MIN]++;
    });
  }
  if (state.officialOn && officialData) {
    officialData.forEach(r => {
      if (r.year >= YEAR_MIN && r.year <= YEAR_MAX && state.officialSources.has(r.sid) && geoAllowed(r) && contextAllowed(r)) counts[r.year - YEAR_MIN]++;
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
  const official = officialFiltered();
  // decades
  const dec = {};
  curated.forEach(c => { const d = Math.floor(c.year / 10) * 10; dec[d] = (dec[d] || 0) + 1; });
  mass.forEach(r => { const d = Math.floor(r.year / 10) * 10; dec[d] = (dec[d] || 0) + 1; });
  geipan.forEach(r => { const d = Math.floor(r.year / 10) * 10; dec[d] = (dec[d] || 0) + 1; });
  official.forEach(r => { const d = Math.floor(r.year / 10) * 10; dec[d] = (dec[d] || 0) + 1; });
  const decKeys = Object.keys(dec).map(Number).sort((a, b) => a - b);
  const decMax = Math.max(1, ...Object.values(dec));
  // GEIPAN by classification
  const gc = new Array(GEIPAN_META.length).fill(0);
  geipan.forEach(r => gc[r.ci]++);
  const gcMax = Math.max(1, ...gc);
  // shapes
  const sh = new Array(SHAPE_META.length).fill(0);
  mass.forEach(r => sh[r.s]++);
  official.forEach(r => sh[r.s]++);
  const shMax = Math.max(1, ...sh);
  // top locations
  const locs = {};
  mass.forEach(r => { if (r.loc) locs[r.loc] = (locs[r.loc] || 0) + 1; });
  official.forEach(r => { if (r.loc) locs[r.loc] = (locs[r.loc] || 0) + 1; });
  const topLocs = Object.entries(locs).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const locMax = topLocs.length ? topLocs[0][1] : 1;
  // day vs night
  let day = 0, night = 0, unk = 0;
  mass.forEach(r => { if (r.h < 0) unk++; else if (r.h >= 7 && r.h <= 19) day++; else night++; });
  official.forEach(r => { if (r.h < 0) unk++; else if (r.h >= 7 && r.h <= 19) day++; else night++; });
  const officialBySource = {};
  official.forEach(r => { officialBySource[r.source] = (officialBySource[r.source] || 0) + 1; });
  const officialTop = Object.entries(officialBySource).sort((a, b) => b[1] - a[1]);
  const officialMax = officialTop.length ? officialTop[0][1] : 1;

  $('stats-content').innerHTML = `
    <div class="kpi-row">
      <div class="kpi"><span class="n">${fmtNum(curated.length)}</span><label>${t('kpiCurated')}</label></div>
      <div class="kpi"><span class="n">${fmtNum(mass.length)}</span><label>NUFORC</label></div>
      <div class="kpi"><span class="n">${fmtNum(geipan.length)}</span><label>GEIPAN</label></div>
      <div class="kpi"><span class="n">${fmtNum(official.length)}</span><label>${t('officialShort')}</label></div>
      <div class="kpi"><span class="n">${fmtNum(curated.length + mass.length + geipan.length + official.length)}</span><label>${t('total')}</label></div>
    </div>
    <div class="chart-block"><h4>${t('byDecade')}</h4>
      ${decKeys.map(d => hbar(d + 's', dec[d], decMax)).join('')}</div>
    ${geipan.length ? `
    <div class="chart-block"><h4>${t('geipanByClass')}</h4>
      ${GEIPAN_META.map((g, i) => ({ g, i, n: gc[i] })).filter(x => x.n).map(x => hbar(geipanLabel(x.i), x.n, gcMax)).join('')}</div>` : ''}
    ${official.length ? `
    <div class="chart-block"><h4>${t('officialArchives')}</h4>
      ${officialTop.map(([l, n]) => hbar(l, n, officialMax)).join('')}</div>` : ''}
    ${(mass.length || official.length) ? `
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
  const official = officialFiltered().map(r => ({
    source: r.source || 'Official archive',
    name: r.title || r.sourceCaseId || 'Official UAP record',
    date: r.date || '',
    time: r.time || '',
    lat: r.lat,
    lng: r.lng,
    type: r.shape || '',
    type_label: r.shape ? shapeLabel(r.s) : '',
    location: (r.loc || '') + (r.country ? ', ' + r.country : ''),
    credibility: r.geoApprox ? `geo:${r.geoPrecision || 'approx'}` : '',
    summary: r.summary || '',
    sources: r.sourceUrl || r.sourceFile || '',
  }));
  return curated.concat(mass, geipan, official);
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
  if (state.geoQuality.size !== GEO_QUALITY_META.length) p.set('q', [...state.geoQuality].join('.'));
  if (state.geoContexts.size !== GEO_CONTEXT_META.length) p.set('x', [...state.geoContexts].join('.'));
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
    if (p.get('q')) state.geoQuality = new Set(p.get('q').split('.').filter(q => GEO_QUALITY_META.some(g => g.id === q)));
    if (p.get('x')) state.geoContexts = new Set(p.get('x').split('.').filter(x => GEO_CONTEXT_META.some(g => g.id === x)));
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
function buildSourceAtlas() {
  const sorted = [...DATA_SOURCE_CATALOG].sort((a, b) => {
    const byPriority = a.priority - b.priority;
    if (byPriority) return byPriority;
    const byStatus = (a.status === 'active' ? 0 : 1) - (b.status === 'active' ? 0 : 1);
    if (byStatus) return byStatus;
    return a.name.localeCompare(b.name);
  });
  return `
    <h3>${t('sourceAtlasTitle')}</h3>
    <p>${t('sourceAtlasIntro')}</p>
    <div class="source-atlas-grid">
      ${sorted.map(s => `
        <article class="source-card ${s.status === 'active' ? 'is-active' : ''}">
          <div class="source-card-head">
            <div>
              <b>${esc(s.name)}</b>
              <span>${esc(s.country)}</span>
            </div>
            <em>${sourceStatusLabel(s.status)}</em>
          </div>
          <div class="source-meta-row">
            <span>${sourceTypeLabel(s.type)}</span>
            <span>${t('sourcePriority')} ${esc(s.priority)}</span>
            <span>${esc(s.period)}</span>
          </div>
          <dl class="source-facts">
            <div><dt>${t('sourceRecords')}</dt><dd>${esc(s.records)}</dd></div>
            <div><dt>${t('sourceWhy')}</dt><dd>${esc(s.value)}</dd></div>
            <div><dt>${t('sourceCaveat')}</dt><dd>${esc(s.caveat)}</dd></div>
            <div><dt>${t('sourceIntegration')}</dt><dd>${esc(s.integration)}</dd></div>
          </dl>
          <a class="cc-source-link" href="${esc(s.url)}" target="_blank" rel="noopener">${t('sourceOpen')}</a>
        </article>`).join('')}
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
  sources: () => buildSourceAtlas(),
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

function openPassModal() {
  applyPassI18n();
  $('pass-overlay').classList.remove('hidden');
}
function closePassModal() { $('pass-overlay').classList.add('hidden'); }
function selectedPassLabel() {
  const active = document.querySelector(`.pass-plans button[data-plan="${selectedPassPlan}"]`);
  return active ? active.textContent.trim() : selectedPassPlan;
}
if ($('btn-pass')) $('btn-pass').onclick = openPassModal;
if ($('btn-close-pass')) $('btn-close-pass').onclick = closePassModal;
if ($('pass-overlay')) $('pass-overlay').addEventListener('click', e => {
  if (e.target === $('pass-overlay')) closePassModal();
});
document.querySelectorAll('.pass-plans button').forEach(button => {
  button.onclick = () => {
    selectedPassPlan = button.dataset.plan || 'monthly';
    document.querySelectorAll('.pass-plans button').forEach(b => b.classList.toggle('active', b === button));
  };
});
if ($('pass-form')) $('pass-form').onsubmit = e => {
  e.preventDefault();
  const email = $('pass-email').value.trim();
  if (!email) { toast(t('passEmailMissing')); return; }
  const plan = selectedPassLabel();
  localStorage.setItem(PASS_INTENT_KEY, JSON.stringify({ email, plan, lang: currentLang, at: new Date().toISOString() }));
  const subject = encodeURIComponent(t('passMailSubject'));
  const body = encodeURIComponent(t('passMailBody', { plan, email }));
  toast(t('passInterestSaved'));
  window.location.href = `mailto:${RESEARCH_PASS_EMAIL}?subject=${subject}&body=${body}`;
};

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    $('modal-overlay').classList.add('hidden');
    closeAppInfo();
    closePassModal();
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
    pass: 'btn-pass', audio: 'btn-audio', csv: 'btn-export-csv', json: 'btn-export-json', permalink: 'btn-permalink' };
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
buildGeoQualityFilters();
buildGeoContextFilters();
positionHandles();
renderTimelineEvents();
refresh();
applyMobileLayout();
if (startCase) setTimeout(() => openCase(startCase, true), 800);
setTimeout(() => { positionHandles(); drawHistogram(); renderTimelineEvents(); }, 300);

})();
