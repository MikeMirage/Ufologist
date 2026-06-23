# UFOlogist Data Architecture

## Objetivo

La app debe distinguir dos capas:

- **Corpus canonico normalizado**: fuente de verdad para investigacion, patrones, enlaces entre casos y futuras features Pro.
- **Corpus documental adquirido**: archivos oficiales, paginas, ZIPs, guias y stubs que aun no deben tratarse como encuentros completos.
- **Derivados de frontend**: archivos compactos generados para renderizar rapido el globo, heatmap, busqueda y fichas.

Los JSON actuales (`data/nuforc.json`, `data/geipan.json`) son derivados optimizados, no deberian ser el modelo de investigacion definitivo.

## Modelo canonico

### sources

Describe cada archivo o institucion de origen.

Campos principales:

- `id`
- `name`
- `country`
- `source_type`: `official`, `civil`, `official_archive`, `editorial`
- `status`: `active`, `candidate`, `blocked`
- `priority`
- `period`
- `url`
- `rights_note`

### cases

Una fila por evento o reporte normalizado.

Campos principales:

- `id`
- `source_id`
- `source_case_id`
- `canonical_title`
- `event_date`
- `event_time`
- `timezone`
- `datetime_precision`
- `lat`
- `lng`
- `location_name`
- `country`
- `contact_type`
- `shape_type`
- `confidence`
- `summary`
- `official_classification`

### observations

Detalle analitico de cada caso. Permite varios testigos, sensores o capas de interpretacion por caso.

Campos principales:

- `id`
- `case_id`
- `observation_role`
- `witness_type`
- `duration_seconds`
- `behavior_tags`
- `sensor_tags`
- `physical_effect_tags`
- `notes`

### links

Fuentes, PDFs, articulos, archivos y material primario relacionado.

Campos principales:

- `id`
- `case_id`
- `label`
- `url`
- `link_type`

### acquired_documents

Una fila por documento, pagina, miembro ZIP o guia adquirida que todavia no puede promoverse a caso normalizado.

Campos principales:

- `id`
- `source_id`
- `record_type`: `pdf_document`, `archive_pdf`, `source_page`, `research_guide`, `case_catalog_page`, `zip_inventory`, `zip_member`, `full_text_corpus`, `acquisition_status`
- `title`
- `source_file`
- `source_url`
- `country`
- `document_year`
- `text_sample`
- `zip_entry`
- `promotion_status`: `candidate_source`, `case_stub_pending_document`, `catalog_pending`, `needs_filtering`, `blocked`, `not_case`
- `needs_review`

Esta tabla no debe alimentar el mapa directamente. Sirve para auditoria, busqueda documental y siguientes pasadas de extraccion.

### tags

Tags normalizados para buscar patrones.

Ejemplos:

- `season:summer`
- `behavior:hovering`
- `behavior:formation`
- `sensor:radar`
- `environment:night`
- `domain:transmedium`
- `evidence:official`

### relations

Relaciones calculadas o revisadas entre casos.

Campos principales:

- `case_a`
- `case_b`
- `relation_type`
- `score`
- `reason`

Ejemplos:

- `same_wave`
- `similar_shape`
- `same_region_window`
- `same_behavior_profile`
- `possible_mundane_explanation`

## Flujo recomendado

1. Importar cada fuente a tablas normalizadas.
2. Validar fechas, coordenadas, precision y derechos de uso.
3. Mantener separados `acquired_cases` y `acquired_documents`.
4. Promover documentos a casos solo cuando tengan evento, fecha/lugar y trazabilidad suficientes.
5. Geocodificar solo cuando no haya coordenadas publicas.
6. Calcular derivados:
   - `frontend-map-points.json`
   - `case-index.json`
   - `case-details/{id}.json`
   - `patterns.json`
7. La UI consume derivados ligeros; Pattern Explorer consume el corpus canonico y, opcionalmente, el corpus documental como evidencia.

## Comandos

Generar una muestra normalizada:

```bash
node tools/export_normalized.js
```

Generar todo el corpus actual:

```bash
node tools/export_normalized.js --all
```

Normalizar fuentes externas adquiridas:

```bash
node tools/normalize_acquired_sources.js
```

Salidas principales:

```text
data/sources/normalized/acquired_cases.jsonl
data/sources/normalized/acquired_documents.jsonl
data/sources/normalized/acquired_index.json
```

## Decisiones

- La fuente no debe cambiar la estetica visual del punto en el mapa.
- La estetica puede codificar tipo de contacto, forma, evidencia o estado de seleccion.
- La fuente debe existir como metadato, filtro analitico y enlace de auditoria.
- Las bases masivas no deben bloquear el render: se exportan a formatos compactos.
- El corpus canonico debe conservar suficiente informacion para detectar patrones sin depender del texto original completo.
- Una pagina o PDF adquirido no es automaticamente un caso. Primero queda en `acquired_documents`; solo se promueve cuando hay campos de evento fiables.
- Una misma fuente puede producir filas mixtas: por ejemplo NARA genera `skywatch_incident` como caso y `zip_member` como documento; España genera `case_catalog_stub` como caso y `case_catalog_page` como documento de auditoria.
- Las categorias de forma deben usar etiquetas establecidas. Por ahora `shape_reported` usa labels NUFORC cuando el texto encaja claramente.
