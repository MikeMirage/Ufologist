// UFOlogist community catalog: 20 curated spaces, reference sources, and recurring programs.
(function (root) {
  'use strict';

  function text(es, en) { return { es: es, en: en }; }
  function ref(title, url, es, en) {
    return { title: title, url: url, note: text(es, en) };
  }
  function board(id, section, icon, nameEs, nameEn, descriptionEs, descriptionEn, promptsEs, promptsEn, references, format) {
    return {
      id: id,
      slug: id,
      section: section,
      icon: icon,
      name: text(nameEs, nameEn),
      description: text(descriptionEs, descriptionEn),
      prompts: text(promptsEs, promptsEn),
      references: references,
      format: format || 'open',
    };
  }

  var githubBase = 'https://github.com/MikeMirage/Ufologist';
  var githubDocs = githubBase + '/blob/master/docs/';
  var nasaUap = 'https://science.nasa.gov/uap/';
  var naraUap = 'https://www.archives.gov/uap';
  var naraBulk = 'https://www.archives.gov/research/catalog/catalog-bulk-downloads/uap-bulk-download';
  var ukArchive = 'https://www.nationalarchives.gov.uk/help-with-your-research/research-guides/ufos/';
  var geipan = 'https://www.geipan.fr/en/recherche/cas';

  var sections = [
    { id: 'welcome', icon: '◎', name: text('Empezar y participar', 'Start and participate') },
    { id: 'cases', icon: '◇', name: text('Casos y testimonios', 'Cases and testimony') },
    { id: 'analysis', icon: '⌁', name: text('Análisis y verificación', 'Analysis and verification') },
    { id: 'sources', icon: '▤', name: text('Fuentes y método', 'Sources and method') },
    { id: 'regions', icon: '◉', name: text('Regiones y perspectivas', 'Regions and perspectives') },
  ];

  var boards = [
    board(
      'anuncios', 'welcome', '📡', 'Anuncios', 'Announcements',
      'Novedades del atlas, nuevas fuentes, cambios de metodología y convocatorias comunitarias.',
      'Atlas updates, new sources, methodology changes, and community calls.',
      ['¿Qué cambió esta semana en el atlas?', '¿Qué colección o herramienta se incorporará después?'],
      ['What changed in the atlas this week?', 'Which collection or tool should be integrated next?'],
      [
        ref('UFOlogist README', githubBase + '#readme', 'Estado y alcance público del proyecto.', 'Public project status and scope.'),
        ref('GitHub Discussions quickstart', 'https://docs.github.com/en/discussions/quickstart', 'Cómo funciona la comunidad que aloja las conversaciones.', 'How the platform hosting the conversations works.'),
      ],
      'announcement'
    ),
    board(
      'preguntas', 'welcome', '❔', 'Preguntas y orientación', 'Questions and orientation',
      'Ayuda para usar el atlas, interpretar una fuente o preparar una investigación reproducible.',
      'Help using the atlas, interpreting a source, or preparing reproducible research.',
      ['¿Cómo encuentro los datos originales de un caso?', '¿Qué significa realmente “sin resolver”?'],
      ['How do I find a case’s original data?', 'What does “unresolved” actually mean?'],
      [
        ref('NASA UAP FAQ and study', nasaUap, 'Marco científico y preguntas de investigación.', 'Scientific framing and research questions.'),
        ref('Normas UFOlogist', githubDocs + 'forum-guidelines.md', 'Criterios para preguntar, citar y debatir.', 'Criteria for asking, citing, and discussing.'),
      ],
      'qa'
    ),
    board(
      'presentaciones-y-proyectos', 'welcome', '👋', 'Presentaciones y proyectos', 'Introductions and projects',
      'Un lugar para explicar qué investigas, qué sabes hacer y qué colaboración estás buscando.',
      'A place to explain what you research, what you can do, and what collaboration you seek.',
      ['Preséntate con una fuente que te haya enseñado algo.', 'Comparte una herramienta, archivo o proyecto sin convertirlo en publicidad.'],
      ['Introduce yourself through a source that taught you something.', 'Share a tool, archive, or project without turning it into advertising.'],
      [
        ref('Contributing to open source', 'https://opensource.guide/how-to-contribute/', 'Buenas prácticas para colaborar de forma concreta.', 'Good practices for concrete collaboration.'),
        ref('Manual de moderación', githubDocs + 'forum-moderation.md', 'Cómo se cuida la calidad de las conversaciones.', 'How conversation quality is maintained.'),
      ]
    ),
    board(
      'ideas-para-ufologist', 'welcome', '💡', 'Ideas para UFOlogist', 'Ideas for UFOlogist',
      'Propuestas de producto, datos y visualización que puedan convertirse en trabajo verificable.',
      'Product, data, and visualization proposals that can become verifiable work.',
      ['¿Qué comparación ayudaría a investigar mejor?', '¿Qué tarea repetitiva debería automatizar el atlas?'],
      ['Which comparison would improve investigation?', 'Which repetitive task should the atlas automate?'],
      [
        ref('UFOlogist repository', githubBase, 'Código, datos y estado del producto.', 'Code, data, and product status.'),
        ref('GitHub Discussions: ideas to issues', 'https://docs.github.com/en/discussions/managing-discussions-for-your-community/managing-discussions', 'Cómo convertir una propuesta madura en trabajo trazable.', 'How to turn a mature proposal into traceable work.'),
      ]
    ),
    board(
      'casos', 'cases', '🗺', 'Casos', 'Cases',
      'Hilo estable conectado a cada ficha del atlas mediante su identificador `case:<id>`.',
      'A stable thread connected to each atlas record through its `case:<id>` identifier.',
      ['Aporta una fuente primaria que falte.', 'Reproduce o corrige una hipótesis con método y datos.'],
      ['Add a missing primary source.', 'Reproduce or correct a hypothesis with method and data.'],
      [
        ref('UFOlogist live atlas', 'https://mikemirage.github.io/Ufologist/', 'Punto de entrada para abrir el hilo de cada caso.', 'Entry point for each case thread.'),
        ref('NASA UAP study', nasaUap, 'Recomendaciones sobre calidad y recogida de datos.', 'Recommendations on data quality and collection.'),
      ]
    ),
    board(
      'casos-historicos', 'cases', '⌛', 'Casos históricos', 'Historical cases',
      'Cronologías documentales: distinguir registros contemporáneos, memoria posterior y cultura popular.',
      'Documentary timelines separating contemporary records, later memory, and popular culture.',
      ['Reconstruye una cronología solo con documentos fechados.', 'Compara la primera versión pública con relatos posteriores.'],
      ['Rebuild a timeline using only dated records.', 'Compare the first public account with later retellings.'],
      [
        ref('NARA UAP Collection', naraUap, 'Colección oficial estadounidense y contexto archivístico.', 'Official US collection and archival context.'),
        ref('UK National Archives UFO guide', ukArchive, 'Guía para localizar expedientes británicos.', 'Guide to locating British files.'),
      ]
    ),
    board(
      'casos-contemporaneos', 'cases', '◌', 'Casos contemporáneos', 'Contemporary cases',
      'Incidentes recientes con atención a procedencia, cadena de publicación y datos todavía no disponibles.',
      'Recent incidents with attention to provenance, publication chain, and unavailable data.',
      ['Separa lo confirmado de lo atribuido a fuentes anónimas.', 'Crea una lista explícita de datos que faltan.'],
      ['Separate confirmed facts from anonymous attribution.', 'Create an explicit list of missing data.'],
      [
        ref('NASA UAP Independent Study', nasaUap, 'Marco para estudiar observaciones recientes con datos abiertos.', 'Framework for studying recent observations with open data.'),
        ref('NARA UAP bulk downloads', naraBulk, 'Datos oficiales descargables con metadatos.', 'Downloadable official records with metadata.'),
      ]
    ),
    board(
      'testimonios-y-casos-locales', 'cases', '📍', 'Testimonios y casos locales', 'Testimony and local cases',
      'Relatos propios con privacidad, ubicación aproximada y separación clara entre observación e interpretación.',
      'Firsthand reports with privacy, approximate location, and a clear split between observation and interpretation.',
      ['Describe primero lo observado sin proponer una causa.', 'Indica hora, duración, dirección, meteorología y dispositivo.'],
      ['Describe what was observed before proposing a cause.', 'Include time, duration, direction, weather, and device.'],
      [
        ref('NASA Aviation Safety Reporting System', 'https://asrs.arc.nasa.gov/overview/summary.html', 'Ejemplo de recogida estructurada y confidencial de reportes.', 'Example of structured, confidential report collection.'),
        ref('Normas de privacidad UFOlogist', githubDocs + 'forum-guidelines.md#cómo-abrir-un-caso', 'Datos necesarios y datos que deben ocultarse.', 'Required data and data that must be hidden.'),
      ]
    ),
    board(
      'aviacion-y-defensa', 'analysis', '✈', 'Aviación y defensa', 'Aviation and defense',
      'Análisis de operaciones aéreas sin divulgar información sensible ni confundir ausencia de identificación con amenaza.',
      'Air-operations analysis without exposing sensitive information or equating unidentified with threatening.',
      ['¿Qué sabe realmente cada sensor o testigo?', '¿Qué explicación ordinaria debe comprobarse primero?'],
      ['What does each sensor or witness actually establish?', 'Which ordinary explanation should be checked first?'],
      [
        ref('FAA Aviation Data & Statistics', 'https://www.faa.gov/data_research', 'Datos oficiales de aviación civil estadounidense.', 'Official US civil aviation data.'),
        ref('NASA ASRS', 'https://asrs.arc.nasa.gov/overview/summary.html', 'Factores humanos y reportes de seguridad aérea.', 'Human factors and aviation safety reports.'),
      ]
    ),
    board(
      'imagen-y-video', 'analysis', '▣', 'Imagen y vídeo', 'Image and video',
      'Procedencia, metadatos, óptica, compresión y edición antes de interpretar lo que aparece en pantalla.',
      'Provenance, metadata, optics, compression, and editing before interpreting screen content.',
      ['Solicita el archivo original y documenta cada transformación.', 'Distingue movimiento del objeto, cámara y estabilización.'],
      ['Request the original file and document every transformation.', 'Separate object, camera, and stabilization movement.'],
      [
        ref('C2PA technical specifications', 'https://c2pa.org/specifications/specifications/2.2/index.html', 'Estándar de procedencia y autenticidad de contenido digital.', 'Standard for digital content provenance and authenticity.'),
        ref('NIST Open Media Forensics Challenge', 'https://www.nist.gov/itl/iad/mltg/open-media-forensics-challenge', 'Métodos y datasets de análisis forense multimedia.', 'Methods and datasets for multimedia forensics.'),
      ]
    ),
    board(
      'radar-y-sensores', 'analysis', '⌁', 'Radar, sensores y datos', 'Radar, sensors, and data',
      'Qué mide cada instrumento, con qué resolución y qué inferencias no permite hacer por sí solo.',
      'What each instrument measures, at what resolution, and which inferences it cannot support alone.',
      ['Dibuja la cadena sensor → procesamiento → producto publicado.', 'Declara errores, resolución y sincronización temporal.'],
      ['Map the chain from sensor to processing to published product.', 'State error, resolution, and time synchronization.'],
      [
        ref('NOAA satellite data access', 'https://ospo.noaa.gov/resources/data-access/', 'Acceso oficial a observaciones ambientales, satélites y radar.', 'Official access to environmental, satellite, and radar observations.'),
        ref('NASA Earthdata', 'https://www.earthdata.nasa.gov/', 'Datos terrestres, herramientas y documentación de sensores.', 'Earth data, tools, and sensor documentation.'),
      ]
    ),
    board(
      'astronomia-y-satelites', 'analysis', '☄', 'Astronomía y satélites', 'Astronomy and satellites',
      'Comprobación reproducible de planetas, estrellas, lanzamientos, órbitas, reentradas y meteoros.',
      'Reproducible checks of planets, stars, launches, orbits, reentries, and meteors.',
      ['Publica coordenadas aproximadas, hora y zona horaria.', 'Adjunta el cálculo o consulta que permita repetir el resultado.'],
      ['Provide approximate coordinates, time, and timezone.', 'Attach the calculation or query needed to reproduce the result.'],
      [
        ref('JPL HORIZONS', 'https://ssd.jpl.nasa.gov/horizons/', 'Efemérides del Sistema Solar calculadas por JPL.', 'Solar System ephemerides calculated by JPL.'),
        ref('CelesTrak', 'https://celestrak.org/', 'Datos orbitales y documentación de seguimiento satelital.', 'Orbital data and satellite tracking documentation.'),
      ]
    ),
    board(
      'meteorologia-y-atmosfera', 'sources', '☁', 'Meteorología y atmósfera', 'Weather and atmosphere',
      'Nubes, halos, rayos, espejismos y condiciones locales comprobados con observaciones meteorológicas.',
      'Clouds, halos, lightning, mirages, and local conditions checked against weather observations.',
      ['Compara el relato con imágenes de satélite y estaciones cercanas.', 'Explica qué rasgos encajan y cuáles no.'],
      ['Compare the report with satellite imagery and nearby stations.', 'Explain which features fit and which do not.'],
      [
        ref('NOAA Climate Data Online', 'https://www.ncei.noaa.gov/cdo-web/', 'Archivo oficial de clima y meteorología.', 'Official climate and weather archive.'),
        ref('EUMETSAT Data Store', 'https://user.eumetsat.int/data-access/data-store', 'Imágenes y productos meteorológicos europeos.', 'European meteorological imagery and products.'),
      ]
    ),
    board(
      'archivos-oficiales', 'sources', '🏛', 'Archivos oficiales', 'Official archives',
      'Localización, transcripción y contexto de expedientes públicos sin convertir la autoridad en prueba automática.',
      'Locating, transcribing, and contextualizing public records without treating authority as automatic proof.',
      ['Cita organismo, signatura, página y fecha de consulta.', 'Distingue el documento original de su interpretación.'],
      ['Cite agency, archival reference, page, and access date.', 'Separate the original document from its interpretation.'],
      [
        ref('NARA UAP Collection', naraUap, 'Colección oficial creada para registros UAP.', 'Official collection established for UAP records.'),
        ref('UK National Archives UFO guide', ukArchive, 'Series y estrategias de búsqueda del archivo británico.', 'Series and search strategies for the British archive.'),
      ]
    ),
    board(
      'fuentes-y-hemeroteca', 'sources', '📰', 'Fuentes y hemeroteca', 'Sources and press archives',
      'Prensa histórica, catálogos y bibliografía evaluados por fecha, procedencia y dependencia entre publicaciones.',
      'Historical press, catalogs, and bibliography evaluated by date, provenance, and publication dependence.',
      ['Encuentra la publicación más antigua, no la más citada.', 'Señala cuándo varios artículos copian una única fuente.'],
      ['Find the earliest publication, not the most cited.', 'Identify when multiple articles copy a single source.'],
      [
        ref('Library of Congress Chronicling America', 'https://www.loc.gov/collections/chronicling-america/about-this-collection/', 'Prensa histórica digitalizada y metadatos bibliográficos.', 'Digitized historical newspapers and bibliographic metadata.'),
        ref('Europeana Collections', 'https://www.europeana.eu/', 'Patrimonio digital europeo de múltiples instituciones.', 'European digital heritage from multiple institutions.'),
      ]
    ),
    board(
      'metodologia-y-replicacion', 'sources', '🧪', 'Metodología y replicación', 'Methodology and replication',
      'Hipótesis explícitas, cálculos auditables, incertidumbre y resultados que otra persona pueda repetir.',
      'Explicit hypotheses, auditable calculations, uncertainty, and results another person can repeat.',
      ['Publica datos, supuestos y pasos suficientes para replicar.', 'Explica qué resultado refutaría tu hipótesis.'],
      ['Publish enough data, assumptions, and steps to replicate.', 'Explain which result would falsify your hypothesis.'],
      [
        ref('NASA UAP final report', 'https://www.nasa.gov/wp-content/uploads/2023/09/uap-independent-study-team-final-report-0.pdf', 'Recomendaciones sobre datos, ciencia abierta y estigma.', 'Recommendations on data, open science, and stigma.'),
        ref('FAIR Guiding Principles', 'https://doi.org/10.1038/sdata.2016.18', 'Principios para datos localizables, accesibles, interoperables y reutilizables.', 'Principles for findable, accessible, interoperable, reusable data.'),
      ]
    ),
    board(
      'espana-y-europa', 'regions', '🇪🇺', 'España y Europa', 'Spain and Europe',
      'Casos, archivos e instituciones europeas con contexto lingüístico, histórico y administrativo.',
      'European cases, archives, and institutions with linguistic, historical, and administrative context.',
      ['Aporta la referencia archivística, no solo una captura.', 'Indica traducciones y conserva el texto original.'],
      ['Provide the archival reference, not only a screenshot.', 'Identify translations and preserve the original text.'],
      [
        ref('Expedientes OVNI — Biblioteca Virtual de Defensa', 'https://bibliotecavirtual.defensa.gob.es/BVMDefensa/exp_ovni/es/consulta/indice_campo.do?campo=idtitulo', 'Colección oficial española digitalizada.', 'Digitized official Spanish collection.'),
        ref('GEIPAN case search', geipan, 'Casos y clasificación del organismo francés del CNES.', 'Cases and classification from the French CNES body.'),
      ]
    ),
    board(
      'latinoamerica', 'regions', '🌎', 'Latinoamérica', 'Latin America',
      'Archivos, oleadas y testimonios de la región sin reducirlos a traducciones o fuentes secundarias extranjeras.',
      'Regional archives, waves, and testimony without reducing them to translations or foreign secondary sources.',
      ['Prioriza organismos, prensa y testigos de la región.', 'Explica particularidades geográficas y administrativas.'],
      ['Prioritize regional agencies, press, and witnesses.', 'Explain geographic and administrative context.'],
      [
        ref('CIAE — Fuerza Aérea Argentina', 'https://www.argentina.gob.ar/fuerzaaerea/centro-de-identificacion-aeroespacial', 'Informes anuales y resolución de casos argentinos.', 'Annual reports and Argentine case resolutions.'),
        ref('SEFAA — DGAC Chile', 'https://sefaa.dgac.gob.cl/', 'Investigación y publicaciones de la aviación civil chilena.', 'Research and publications from Chilean civil aviation.'),
      ]
    ),
    board(
      'norteamerica-y-mundo', 'regions', '🌐', 'Norteamérica y mundo', 'North America and world',
      'Comparación internacional de políticas, archivos y patrones sin asumir que todos los sistemas reportan igual.',
      'International comparison of policies, archives, and patterns without assuming equal reporting systems.',
      ['Compara definiciones y periodos de cobertura antes de comparar cifras.', 'Documenta sesgos de idioma, acceso y población.'],
      ['Compare definitions and coverage periods before comparing counts.', 'Document language, access, and population biases.'],
      [
        ref('NARA UAP records', naraUap, 'Colección y transferencias de agencias estadounidenses.', 'US agency collection and transfers.'),
        ref('Library and Archives Canada UFO research guide', 'https://library-archives.canada.ca/eng/collection/research-help/military-heritage/Pages/ufos.aspx', 'Orientación archivística para registros canadienses.', 'Archival guidance for Canadian records.'),
      ]
    ),
    board(
      'astrobiologia-y-seti', 'regions', '🔭', 'Astrobiología y SETI', 'Astrobiology and SETI',
      'Vida, biosignaturas y tecnofirmas tratadas como ciencia relacionada, no como explicación automática de un avistamiento.',
      'Life, biosignatures, and technosignatures as related science, not an automatic sighting explanation.',
      ['Distingue posibilidad, indicio y detección confirmada.', 'Relaciona cada afirmación con una observación o publicación.'],
      ['Separate possibility, evidence, and confirmed detection.', 'Tie every claim to an observation or publication.'],
      [
        ref('NASA Astrobiology', 'https://astrobiology.nasa.gov/', 'Programas, misiones y preguntas científicas sobre vida.', 'Programs, missions, and scientific questions about life.'),
        ref('NASA Technosignatures', 'https://science.nasa.gov/universe/search-for-life/searching-for-signs-of-intelligent-life-technosignatures/', 'Contexto científico para la búsqueda de vida y señales.', 'Scientific context for the search for life and signals.'),
      ]
    ),
  ];

  // The full architecture remains available, while eight spaces receive the
  // initial editorial cadence. Missions give newcomers a small, concrete task.
  var focusMissions = {
    preguntas: text(
      'Ayuda a definir “no identificado” con un ejemplo y una fuente.',
      'Help define “unidentified” with one example and one source.'
    ),
    'ideas-para-ufologist': text(
      'Prioriza una mejora indicando usuario, problema y señal de éxito.',
      'Prioritize one improvement by naming the user, problem, and success signal.'
    ),
    casos: text(
      'Revisa GoFast: separa lo medido, lo calculado y lo que aún falta.',
      'Review GoFast: separate measurements, calculations, and remaining unknowns.'
    ),
    'testimonios-y-casos-locales': text(
      'Mejora la plantilla de reporte sin pedir datos personales ni ubicación exacta.',
      'Improve the report template without requesting personal data or an exact location.'
    ),
    'imagen-y-video': text(
      'Construye una checklist mínima para preservar y analizar un vídeo original.',
      'Build a minimum checklist for preserving and analyzing an original video.'
    ),
    'astronomia-y-satelites': text(
      'Documenta una identificación celeste que otra persona pueda repetir.',
      'Document a sky identification another person can reproduce.'
    ),
    'archivos-oficiales': text(
      'Añade un archivo oficial con organismo, signatura, página y límite interpretativo.',
      'Add an official record with agency, reference, page, and interpretive limit.'
    ),
    'metodologia-y-replicacion': text(
      'Propón el paquete mínimo para que un análisis pueda replicarse.',
      'Propose the minimum package needed to reproduce an analysis.'
    ),
  };
  boards.forEach(function (item) {
    if (!focusMissions[item.id]) return;
    item.editorialFocus = true;
    item.mission = focusMissions[item.id];
  });

  var programs = [
    {
      icon: '🔬',
      title: text('Laboratorio de caso semanal', 'Weekly case lab'),
      description: text(
        'Un caso, una pregunta falsable y siete días para aportar fuentes o cálculos reproducibles.',
        'One case, one falsifiable question, and seven days for sources or reproducible calculations.'
      ),
      board: 'casos',
    },
    {
      icon: '🗂',
      title: text('Reto de fuente primaria', 'Primary-source challenge'),
      description: text(
        'Localizar el documento más antiguo o completo detrás de una afirmación muy repetida.',
        'Locate the earliest or most complete document behind a frequently repeated claim.'
      ),
      board: 'fuentes-y-hemeroteca',
    },
    {
      icon: '☄',
      title: text('Clínica de identificación del cielo', 'Sky identification clinic'),
      description: text(
        'Resolver observaciones con hora, lugar y método astronómico u orbital transparente.',
        'Resolve observations with time, place, and a transparent astronomical or orbital method.'
      ),
      board: 'astronomia-y-satelites',
    },
  ];

  root.UFOCommunityCatalog = {
    version: 1,
    sections: sections,
    boards: boards,
    programs: programs,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
