# Monitor asset provenance and credits

The Monitor serves the following runtime assets locally. Their licenses remain
separate from the UFOlogist application license. Keep the accompanying license
files when redistributing these assets.

## MapLibre GL JS 5.6.1

- Files: `assets/vendor/maplibre-gl.js`, `assets/vendor/maplibre-gl.css`.
- Project: [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js).
- Distribution: [JavaScript 5.6.1](https://unpkg.com/maplibre-gl@5.6.1/dist/maplibre-gl.js)
  and [CSS 5.6.1](https://unpkg.com/maplibre-gl@5.6.1/dist/maplibre-gl.css).
- License: **BSD 3-Clause**, copyright MapLibre contributors.
- Included license: `assets/vendor/maplibre-LICENSE.txt`.
- [Upstream license](https://github.com/maplibre/maplibre-gl-js/blob/v5.6.1/LICENSE.txt).

MapLibre renders the vector map and its data layers. It does not supply the
underlying geography or the case/publication data.

## Tabler Icons

- Files: `assets/icons/search.svg`, `filter.svg`, `close.svg`,
  `external-link.svg`, `bookmark.svg`, `map.svg`, `globe.svg`, `refresh.svg`,
  `arrow-left.svg`, `file-text.svg`.
- Project and source directory:
  [Tabler Icons / outline](https://github.com/tabler/tabler-icons/tree/main/icons/outline).
- Acquisition URL pattern:
  `https://raw.githubusercontent.com/tabler/tabler-icons/main/icons/outline/{name}.svg`.
  For example, [search.svg](https://raw.githubusercontent.com/tabler/tabler-icons/main/icons/outline/search.svg).
- License: **MIT**, copyright © 2020–2026 Paweł Kuna.
- Included license: `assets/icons/LICENSE`.
- [Upstream license](https://github.com/tabler/tabler-icons/blob/main/LICENSE).

These are standard source icons, rather than generated or hand-drawn UI assets.
The source URL references `main`; retain the committed local files for the
exact version used by this implementation.

## Natural Earth geography

- File: `assets/map/countries.geojson`.
- Dataset: Natural Earth **1:110m Admin 0 – Countries**.
- [Source GeoJSON](https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson).
- [Source repository](https://github.com/nvkelso/natural-earth-vector).
- Terms: **public domain**; [Natural Earth terms of use](https://www.naturalearthdata.com/about/terms-of-use/).

Country boundaries and labels are contextual cartography, not evidence of a
case's position, precision or jurisdiction. The dataset is served locally and
credited in the map attribution. Case coordinates come from UFOlogist's
separate editorial catalogue.

## Noto Sans map glyphs

- Files: `assets/map/fonts/Noto Sans Regular/0-255.pbf` and `256-511.pbf`.
- Glyph provider: [OpenFreeMap](https://openfreemap.org/).
- Acquisition URLs:
  [0–255](https://tiles.openfreemap.org/fonts/Noto%20Sans%20Regular/0-255.pbf),
  [256–511](https://tiles.openfreemap.org/fonts/Noto%20Sans%20Regular/256-511.pbf).
- Typeface: **Noto Sans**, copyright 2022 The Noto Project Authors.
- License: **SIL Open Font License 1.1**.
- Included license: `assets/map/fonts/OFL.txt`.
- [License source](https://raw.githubusercontent.com/google/fonts/main/ofl/notosans/OFL.txt).
- [Noto project](https://github.com/notofonts/latin-greek-cyrillic).

Only the listed glyph ranges are bundled. They cover the current Latin-script
map labels; additional scripts require their own glyph ranges before use.

## Brand, interface fonts and case media

The UFOlogist mark and wordmark use the project's existing brand assets.
The interface loads [Inter](https://fonts.google.com/specimen/Inter) and
[Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) through Google
Fonts; these are distinct from the bundled map glyphs.

Case media remains linked to its original file or Wikimedia Commons page with
attribution. RSS ingestion retains publication metadata and short text only;
it does not bundle publisher photographs or article pages. A feed's
availability does not establish permission to republish its full content.
## Material audiovisual de expedientes

`media/flir1-official.jpg` es la miniatura original de FLIR1 (US Navy / Department of Defense, dominio público), obtenida mediante los metadatos públicos de Wikimedia Commons. No es una recreación. El vídeo se reproduce desde Wikimedia; el enlace al archivo y su atribución permanece visible en la ficha.

- Archivo: https://commons.wikimedia.org/wiki/File:FLIR1_Official_UAP_Footage_from_the_USG_for_Public_Release.webm
- Miniatura: https://thumb.wikimedia.org/wikipedia/commons/thumb/7/70/FLIR1_Official_UAP_Footage_from_the_USG_for_Public_Release.webm/330px--FLIR1_Official_UAP_Footage_from_the_USG_for_Public_Release.webm.jpg

## Integrated globe

The main Monitor uses `assets/vendor/globe-gl-2.32.2.min.js`, the official bundled
[globe.gl 2.32.2 distribution](https://cdn.jsdelivr.net/npm/globe.gl@2.32.2/dist/globe.gl.min.js).
Its MIT license is preserved in `assets/vendor/globe-gl-LICENSE.txt`.
The bundle owns its Three.js instance; the Monitor does not load the legacy
application or a second Three.js global.

Original Earth imagery and topology are served locally from `assets/map/`.
Their upstream URLs and attribution are recorded in
`assets/map/earth-attribution.txt`. These are real geographic textures reused
from the original globe, not generated illustrations. Natural Earth country
boundaries provide the same contextual overlay as the 2D map.
