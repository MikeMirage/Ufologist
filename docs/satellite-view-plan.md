# Plan de implementación — Vista Satélite (reemplaza la vista "Órbita")

> Estado: PROPUESTA para revisión. No implementar hasta aprobación + preview disponible.
> Decisiones tomadas: (1) plan detallado antes de código; (2) TLE en vivo desde CelesTrak con snapshot de respaldo.

## 1. Objetivo
Sustituir la vista "Órbita" (sistema solar, infrautilizada) por una **vista Satélite**: el mismo globo 3D, con capas de **satélites orbitando en tiempo real + rutas + lanzamientos (cohetes, SpaceX incl.)**, coherentes con el tiempo (lanzamiento, órbita real vía SGP4, decaída). Endgame: **vista híbrida satélites + avistamientos** para corroborar/descartar UFOs como Starlink, reentradas o etapas de cohete.

## 2. Principios
- **Capa sobre el mismo globo** (como NUFORC/GEIPAN/oficiales): reutilizar globo, controles, zoom, panel de filtros, timeline, ficha de detalle, i18n, tema.
- **Módulo aislado** `js/satellites.js` (no meter la lógica en el `app.js` gigante y en churn) → menos conflicto con la sesión paralela. Se activa por el toggle de vista.
- **Sin backend**: propagación orbital en el cliente con `satellite.js` (SGP4).

## 3. Datos (fuentes verificadas, todas 200/CORS)
- **Posición/órbita:** CelesTrak GP — `https://celestrak.org/NORAD/elements/gp.php?GROUP=<g>&FORMAT=tle`. Grupos Fase 1: `stations` (ISS), `starlink` (muestra), `gps-ops`, `galileo`, `glo-ops`, `oneweb`, `geo`, `weather`, `last-30-days`. **En vivo** + respaldo `data/tle-snapshot.json`.
- **Metadatos/ciclo de vida:** CelesTrak SATCAT (`satcat.csv`) → `data/satcat.json` (compacto: norad, nombre, país, tipo, fecha lanzamiento, fecha decaída, órbita).
- **Lanzamientos (cohetes/SpaceX):** Launch Library 2 (`ll.thespacedevs.com/2.2.0/launch/`) → `data/launches.json` (rocket, proveedor, fecha, base, cargas, resultado, webcast).
- **Opcional:** UCS Satellite Database (propósito/operador/vida útil esperada).

## 4. Motor de simulación (satellite.js / SGP4)
- CDN: `satellite.js@5`.
- Parseo TLE → `satrec = satellite.twoline2satrec(l1, l2)`.
- Por tick de simulación: `pv = satellite.propagate(satrec, simTime)` → `gd = satellite.eciToGeodetic(pv.position, satellite.gstime(simTime))` → `lat=degrees(gd.latitude)`, `lng=degrees(gd.longitude)`, `altGlobe = gd.height / 6371` (unidades globo.gl).
- **Ruta orbital:** muestrear una órbita (periodo = 1/mean_motion) en ~90 puntos → polilínea `pathsData`. Solo para el satélite seleccionado/hover (dibujar miles de órbitas es inviable).
- **Reloj de simulación:** `simTime` (Date) + `simSpeed` (1×…3600×); rAF avanza `simTime += dt*simSpeed` y re-propaga. **Dos ejes temporales**: (a) timeline de años = historial de **lanzamientos** (como UFOs); (b) control aparte de **velocidad orbital / "ahora"**.

## 5. Rendering (globe.gl) — ÓRBITAS como capa primaria (no heatmap)
Los satélites no son un fenómeno de densidad (a diferencia de los avistamientos): su lenguaje visual son las **trayectorias**. Nada de heatmap aquí.
- **Capa primaria = órbitas (líneas):** una órbita por **plano/shell representativo**, no una por satélite. `THREE.LineSegments` batched (1 draw call) para decenas/cientos de anillos, color por constelación/banda de altitud. Starlink (~6.000 sats en ~72 planos) se representa con unas decenas de anillos, no 6.000 puntos.
- **Satélites (posición viva):** puntos que recorren las órbitas (`THREE.Points`, 1 draw call), **capados/muestreados** y sobre todo para el conjunto filtrado/seleccionado.
- **Seleccionado:** resalta su órbita completa + **ground track** (traza sobre la superficie) → base para el híbrido.
- Bases de lanzamiento: marcadores en el globo (lat/lng del sitio).
- Leyenda: bandas de altitud (LEO/MEO/GEO); firma por régimen (GEO=anillo ecuatorial, MEO=planos, LEO=shells inclinados).

## 6. UI/UX
- Toggle de vista: `Tierra`/`Órbita` → **`Encuentros`/`Satélites`** (`state.viewMode: 'earth' | 'satellites'`).
- Panel (modo satélite): filtros por **constelación** (Starlink, GPS, Galileo, GLONASS, OneWeb, GEO, meteo, tripuladas), **tipo de órbita** (LEO/MEO/GEO/HEO), **país/operador**, **estado** (activo/decaído), **año de lanzamiento** (timeline).
- Ficha de satélite: nombre, NORAD, desig. internacional, época, inclinación, apogeo/perigeo/altitud, periodo, operador, fecha de lanzamiento, decaída, estado, enlaces (n2yo/Heavens-Above).
- Ficha de lanzamiento: cohete, proveedor, fecha, base, cargas, resultado, webcast.

## 7. Rendimiento (riesgo nº1)
~10k activos, >30k objetos. La estrategia principal es **dibujar la estructura (órbitas/planos), no cada unidad** — eso es a la vez la viz correcta y la mayor optimización.
- **Agregación por planos orbitales, no heatmap**: una órbita por plano/shell representativo (decenas de anillos) en vez de miles de puntos.
- **Órbitas = líneas batched** en una geometría (`THREE.LineSegments`, 1 draw call); **satélites vivos = `THREE.Points`** (1 draw call), solo para el set activo/filtrado.
- **Desacoplar cómputo del render**: propagar posiciones a baja frecuencia (2–5 Hz o keyframes) e **interpolar** entre muestras; o **Kepler simplificado en vertex shader**. SGP4 exacto solo en ficha/híbrido (bajo demanda, nunca por frame).
- **Web Worker** para la propagación del set de puntos vivos si escala.
- **LOD por zoom**: alejado = shells/planos; al acercar/filtrar = satélites individuales + su traza.
- **Culling** del hemisferio trasero; **filter-first** (set curado por defecto) + tier móvil.
Fase 1 limita a un set curado (cientos) con órbitas de los planos + puntos del conjunto filtrado.

## 8. Estructura de archivos
- **Nuevos:** `js/satellites.js` (motor + vista), `tools/fetch-tle.js` (snapshot respaldo), `tools/process-launches.js`, `tools/process-satcat.js`, `data/tle-snapshot.json`, `data/launches.json`, `data/satcat.json`.
- **Modificados (mínimo):** `index.html` (labels del toggle + sección de panel satélite + `<script satellite.js>`), `app.js` (hook del cambio de vista → llama a `satellites.enter()/exit()`), `css/styles.css` (estilos de capa satélite, coherentes con tema claro/oscuro).

## 9. Fases
- **Fase 0 — Pipeline + motor (sin navegador):** scripts `tools/*`, datasets compactos, validar SGP4 en Node (propagar ISS y comprobar lat/lng plausibles).
- **Fase 1 — MVP vista satélite:** set curado (ISS + muestra Starlink + GPS + GEO), propagación, puntos + ruta del seleccionado, reloj de simulación, filtro por constelación, ficha de satélite, timeline de lanzamientos. TLE en vivo + respaldo.
- **Fase 2 — Lanzamientos + escala:** LL2 (cohetes/SpaceX con ficha), SATCAT (decaída/vida útil), más capas, Worker + LOD para miles.
- **Fase 3 — Híbrido:** dado un avistamiento (fecha/hora/lugar), calcular satélites por encima (ángulo de elevación) + lanzamientos cercanos → "posible explicación".

## 10. Riesgos y mitigaciones
- **Rendimiento** → capar + Worker + LOD.
- **TLE caducan (días)** → fetch en vivo + respaldo; cachear en sesión.
- **CORS CelesTrak** → confirmado alcanzable; si fallara, respaldo snapshot cubre.
- **`.git` = 1 GB** → datasets compactos + `data/sources` gitignorado (pendiente `tools/repo-slim.sh`).
- **Concurrencia**: la vista `orbit` la controla la sesión paralela → **coordinar** el reemplazo del `viewMode` o asumir yo ese subsistema. El módulo `satellites.js` se mantiene aislado.
- **Verificación**: 3D en tiempo real → **requiere preview/navegador** (validación parcial de SGP4 posible en Node).

## 11. Dependencias externas nuevas
- `satellite.js@5` (CDN, SGP4). CelesTrak (TLE/SATCAT), Launch Library 2 (lanzamientos) — sin API key.
