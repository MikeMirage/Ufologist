# 🛸 UFOlogist — Atlas global del fenómeno UAP

Aplicación web interactiva para explorar avistamientos OVNI/UAP documentados (1942–2024) sobre un globo 3D con mapa de calor y línea de tiempo reproducible. **80.000+ reportes geolocalizados.**

🔭 **Demo en vivo:** **https://mikemirage.github.io/Ufologist/**

## Ejecutar en local

Es una web 100% estática (sin build, sin backend). Cualquier servidor de archivos vale:

```bash
npx http-server -p 8642
# o
python3 -m http.server 8642
```

Y abrir `http://localhost:8642`. Requiere internet (CDN de globe.gl y texturas).
También funciona abriendo `index.html` directamente (`file://`): la base masiva carga
desde `data/nuforc.js` como respaldo cuando `fetch()` está bloqueado.

## Funcionalidades

- **Globo 3D** con capa de puntos (color por tipo/forma) y **mapa de calor hexagonal** (escala logarítmica adaptativa) para ver tendencias geográficas.
- **Base masiva NUFORC**: 80.332 reportes ciudadanos geolocalizados (1906–2014) integrados como capa conmutables; se muestran como puntos individuales cuando la selección baja de 1.800.
- **Filtros de la base masiva**: 10 morfologías (luz, triángulo, disco, esfera…) y franja horaria (24h / día / noche).
- **Línea de tiempo 1942–2025**: histograma anual (log), rombos ◆ con los hitos del fenómeno, rango ajustable y modo reproducción (▶ o espacio) acumulado o ventana de 10 años.
- **📊 Análisis**: KPIs, distribución por década, por forma, día vs noche y top-10 localidades de la selección actual.
- **🧭 Expedición**: tour guiado cinemático por 16 casos esenciales (1947–2023).
- **🔥 Hotspots legendarios**: capa de 13 lugares míticos (Área 51, Skinwalker, Hessdalen…).
- **➕ Cuaderno de campo**: registra tus avistamientos con clic en el globo (coordenadas precisas), guardados en localStorage.
- **🔗 Permalinks**: el estado completo (filtros + caso) vive en la URL; botón de copiar enlace.
- **⬇ Export**: descarga CSV/JSON de la selección filtrada (curados + NUFORC + cuaderno).
- **Ficha de caso**: resumen riguroso, evidencia 1–5★, enlace a vista satélite (Google Maps) y fuentes originales.
- **🎬 Multimedia por caso**: vídeos oficiales de dominio público embebidos (metraje FLIR de la Navy y de las tandas PURSUE 2026), **imagen principal de Wikipedia cargada en tiempo real** (API REST, sin hardcodear), lightbox y botones de búsqueda dirigida (YouTube / Google Imágenes) para cobertura total sin enlaces rotos.
- **Centro de conocimiento** (📚): clasificación Hynek, cronología del disclosure en EE.UU. (1947–2026, incluida la desclasificación **PURSUE**), glosario, metodología y dónde reportar.

## Datos

- `js/data.js` — ~100 casos canónicos curados con coordenadas, fecha, tipo, evidencia y fuentes; más hotspots, eventos de timeline y guion del tour. Para añadir un caso, copia una entrada de `CASES`.
- `data/nuforc.json` — 80.332 reportes NUFORC geocodificados (formato compacto `[fechaInt, hora, lat, lng, formaIdx, "ciudad, estado, país"]`).
- `data/nuforc.js` — el mismo dataset envuelto en `window.NUFORC_DATA` para el respaldo `file://`.
- `tools/process_nuforc.js` — regenera ambos a partir del CSV original (instrucciones en la cabecera del script).

## Stack

HTML/CSS/JS vanilla + [globe.gl](https://globe.gl) (Three.js) vía CDN. Tipografías: Space Grotesk, Inter, JetBrains Mono. Sin dependencias de build.

## Créditos y datos

- **Reportes masivos:** National UFO Reporting Center (NUFORC), vía el dataset público [`planetsig/ufo-reports`](https://github.com/planetsig/ufo-reports). Geocodificados a nivel de localidad. Son testimonios ciudadanos sin verificar: su valor es estadístico (tendencias, geografía, formas), no probatorio caso a caso.
- **Casos curados:** selección editorial con fuentes primarias enlazadas en cada ficha (archivos desclasificados, NICAP, Black Vault, GEIPAN, prensa de la época).
- **Render 3D:** [globe.gl](https://globe.gl) · texturas de [three-globe](https://github.com/vasturiano/three-globe).

> ⚠️ Proyecto divulgativo e independiente. No afiliado a NUFORC ni a ningún organismo oficial.

## Licencia

Código bajo licencia MIT (ver `LICENSE`). Los datos de NUFORC pertenecen a sus respectivos titulares y se incluyen con fines divulgativos y de investigación.
