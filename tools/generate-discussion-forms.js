#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const catalogSource = fs.readFileSync(path.join(root, 'js/community.js'), 'utf8');
const context = {};
context.globalThis = context;
vm.runInNewContext(catalogSource, context, { filename: 'js/community.js' });

const catalog = context.UFOCommunityCatalog;
if (!catalog || catalog.boards.length !== 20) {
  throw new Error('The community catalog must contain exactly 20 boards.');
}

const outputDir = path.join(root, '.github', 'DISCUSSION_TEMPLATE');
fs.mkdirSync(outputDir, { recursive: true });

function quote(value) {
  return JSON.stringify(String(value));
}

function field(type, id, label, description, required, placeholder) {
  const lines = [
    `  - type: ${type}`,
    `    id: ${id}`,
    '    attributes:',
    `      label: ${quote(label)}`,
    `      description: ${quote(description)}`,
  ];
  if (placeholder) lines.push(`      placeholder: ${quote(placeholder)}`);
  lines.push('    validations:', `      required: ${required ? 'true' : 'false'}`);
  return lines.join('\n');
}

function checkbox(label) {
  return [
    '  - type: checkboxes',
    '    id: community-check',
    '    attributes:',
    '      label: "Comprobación antes de publicar / Pre-publish check"',
    '      options:',
    `        - label: ${quote(label)}`,
    '          required: true',
  ].join('\n');
}

function templateFor(board) {
  const name = board.name.es;
  const description = board.description.es;
  const commonHeader = [
    `title: ${quote(`[${name}] `)}`,
    'body:',
    '  - type: markdown',
    '    attributes:',
    '      value: |',
    `        ## ${name}`,
    `        ${description}`,
    '',
    '        Separa observación, evidencia, hipótesis e incertidumbre. Añade enlaces directos y explica qué falta por comprobar.',
    ...(board.mission ? [
      '',
      `        **Misión activa:** ${board.mission.es}`,
    ] : []),
  ].join('\n');

  let fields;
  if (board.section === 'cases') {
    fields = [
      field('input', 'when-where', 'Fecha y ubicación aproximada / Date and approximate location', 'Incluye zona horaria cuando sea relevante. No publiques domicilios ni coordenadas privadas.', true, 'AAAA-MM-DD · región o localidad aproximada'),
      field('textarea', 'observation', 'Qué se observó / What was observed', 'Describe duración, dirección, movimiento, condiciones y dispositivo antes de interpretar.', true),
      field('textarea', 'evidence', 'Evidencia y fuentes / Evidence and sources', 'Enlaza originales, documentos fechados, archivos completos o permalinks del atlas.', true),
      field('textarea', 'hypotheses', 'Hipótesis comprobadas / Hypotheses checked', 'Explica qué alternativas se probaron, con qué método y qué resultado obtuviste.', false),
      field('textarea', 'open-question', 'Pregunta concreta / Specific question', '¿Qué dato, cálculo o fuente ayudaría a avanzar?', true),
      checkbox('He retirado datos personales y distingo hechos, hipótesis e incertidumbre. / I removed personal data and distinguish facts, hypotheses, and uncertainty.'),
    ];
  } else if (board.section === 'analysis') {
    fields = [
      field('textarea', 'claim', 'Afirmación o fenómeno a comprobar / Claim or phenomenon to test', 'Formula una pregunta concreta y, cuando sea posible, falsable.', true),
      field('textarea', 'data', 'Datos y procedencia / Data and provenance', 'Enlaza archivos, metadatos, observaciones o fuentes originales.', true),
      field('textarea', 'method', 'Método y supuestos / Method and assumptions', 'Describe pasos, herramientas, parámetros, errores y transformaciones.', true),
      field('textarea', 'result', 'Resultado y límites / Result and limitations', 'Explica qué encaja, qué no y qué incertidumbre permanece.', true),
      field('textarea', 'replication', 'Cómo replicarlo / How to replicate', 'Incluye instrucciones o cálculos suficientes para otra persona.', false),
      checkbox('Puedo distinguir los datos originales de mis transformaciones e interpretación. / I can distinguish original data from my transformations and interpretation.'),
    ];
  } else if (board.section === 'sources') {
    fields = [
      field('input', 'reference', 'Referencia principal / Main reference', 'Título, organismo o autor, fecha, signatura y enlace directo cuando exista.', true),
      field('textarea', 'provenance', 'Procedencia y cadena de publicación / Provenance and publication chain', 'Explica de dónde viene y si es original, copia, transcripción o traducción.', true),
      field('textarea', 'context', 'Contexto y aportación / Context and contribution', 'Resume qué demuestra la fuente y qué no permite concluir.', true),
      field('textarea', 'question', 'Pregunta para la comunidad / Question for the community', 'Pide una verificación, documento relacionado, traducción o revisión concreta.', true),
      checkbox('He enlazado la fuente más directa disponible y declarado traducciones o ediciones. / I linked the most direct source available and declared translations or edits.'),
    ];
  } else if (board.section === 'regions') {
    fields = [
      field('input', 'region', 'País, región e idioma / Country, region, and language', 'Ayuda a localizar instituciones, archivos y contexto local.', true),
      field('textarea', 'context', 'Contexto local / Local context', 'Incluye definiciones, periodo, organismo, particularidades geográficas o culturales.', true),
      field('textarea', 'sources', 'Fuentes regionales / Regional sources', 'Prioriza archivos, prensa, publicaciones y testigos de la región.', true),
      field('textarea', 'comparison', 'Comparación y límites / Comparison and limitations', 'Explica qué puede compararse con otros países y qué sesgos lo impiden.', false),
      field('textarea', 'question', 'Pregunta concreta / Specific question', '¿Qué colaboración o conocimiento local necesitas?', true),
      checkbox('He conservado el idioma y contexto originales o declarado la traducción. / I preserved the original language and context or declared the translation.'),
    ];
  } else {
    fields = [
      field('textarea', 'context', 'Contexto / Context', 'Explica brevemente qué quieres compartir, preguntar o mejorar.', true),
      field('textarea', 'contribution', 'Aportación propuesta / Proposed contribution', 'Sé concreto: qué cambia, para quién y cómo podría comprobarse.', true),
      field('textarea', 'references', 'Referencias o ejemplos / References or examples', 'Añade enlaces directos cuando ayuden a entender la propuesta.', false),
      field('textarea', 'next-step', 'Siguiente paso / Next step', '¿Qué respuesta, decisión o colaboración buscas?', true),
      checkbox('He leído las normas y mantendré la conversación respetuosa y verificable. / I read the guidelines and will keep the conversation respectful and verifiable.'),
    ];
  }

  return `${commonHeader}\n${fields.join('\n')}\n`;
}

const expected = new Set(catalog.boards.map(board => `${board.slug}.yml`));
for (const file of fs.readdirSync(outputDir)) {
  if (file.endsWith('.yml') && !expected.has(file)) {
    fs.unlinkSync(path.join(outputDir, file));
  }
}

for (const board of catalog.boards) {
  fs.writeFileSync(path.join(outputDir, `${board.slug}.yml`), templateFor(board), 'utf8');
}

console.log(`Generated ${catalog.boards.length} GitHub Discussion forms.`);
