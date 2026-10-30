# UFOlogist — Observatorio UAP

Monitor de publicaciones y fuentes del fenómeno UAP, con atlas 2D y expedientes
históricos. Distingue la fecha de publicación de la fecha del suceso, conserva
los enlaces originales y muestra cuándo se consultó cada fuente.

- **Monitor**: publicaciones reales de RSS, con filtros de periodo, fuente y tema.
- **Atlas**: mapa 2D y lista de casos del catálogo editorial; coordenadas aproximadas.
- **Casos**: referencias, contexto, material audiovisual cuando existe y enlaces compartibles.
- **Fuentes**: cobertura, última consulta, última publicación y estado del canal.
- **Globo 3D opcional**: la experiencia anterior se conserva en `globe.html`.

El mapa del Monitor ofrece contexto histórico; una noticia sin localización
atribuida no recibe un marcador inventado. Las publicaciones automáticas se
identifican como pendientes de revisión editorial. Los guardados son locales
al navegador y no activan una suscripción ni avisos por correo.

[Sitio publicado](https://mikemirage.github.io/Ufologist/) ·
[Comunidad](https://github.com/MikeMirage/Ufologist/discussions)

## Ejecutar en local

Con Python 3 y Node.js disponibles:

```sh
npm run dev
```

Abrir `http://127.0.0.1:8642/`. Para elegir otro puerto:

```sh
npm run dev -- --port 8643
```

No hay paso de build. El servidor local permite una consulta explícita de los
feeds mediante **Actualizar fuentes**; limita y serializa esas solicitudes.
También se puede servir el frontend con un servidor estático, pero este solo
lee la última copia publicada de `data/monitor-feed.json`. Usar HTTP en lugar de
abrir `index.html` mediante `file://`.

La cartografía 2D, MapLibre, iconos y glifos del mapa se sirven desde `assets/`.
Las tipografías de interfaz, los enlaces multimedia y la vista 3D utilizan
recursos externos. La lista de casos y fuentes ofrece una alternativa si falla
el mapa o WebGL.

## Feeds reales y actualización

El pipeline consulta los RSS de [NASA](https://www.nasa.gov/feed/),
[The Debrief](https://thedebrief.org/feed/),
[The Black Vault](https://www.theblackvault.com/documentarchive/feed/) y
[GEIPAN](https://cnes-geipan.fr/rss.xml). Filtra publicaciones UAP y contexto
del cielo; no importa todos los temas de esas webs. NARA, AARO y NUFORC son
fuentes enlazadas, sin integración automática activa en este pipeline.

```sh
npm run feeds:update
```

Se guardan títulos, URL, fecha y descripciones breves atribuidas; no se descargan
artículos completos ni imágenes periodísticas. En caso de fallo se conserva el
último contenido válido y su fecha original. Un feed sin novedades puede estar
funcionando correctamente. Esto es un monitor de publicaciones, no un servicio
de avistamientos verificados en tiempo real.

El workflow `.github/workflows/monitor-feeds.yml` publica `main` mediante
GitHub Pages y programa consultas a los minutos **17 y 47 de cada hora**.
Cada ejecución valida el producto, consulta los RSS, guarda únicamente el
snapshot actualizado y despliega la web en la misma ejecución. Así los commits
automáticos no dependen de disparar otro workflow para llegar al sitio público.
También se ejecuta al publicar cambios en `main` y se puede lanzar manualmente
desde Actions. GitHub Pages debe estar configurado con **GitHub Actions** como
origen de publicación.

El Monitor comprueba la copia publicada cada minuto mientras está visible.
**Recargar publicaciones** lee esa copia; la consulta a los medios la realiza
el workflow. GitHub puede retrasar las tareas programadas o desactivarlas por
inactividad. El estado de cada fuente permite comprobar la fecha del último
intento y del último éxito; una caída conserva su contenido anterior.

Contrato, reglas de clasificación, límites y comportamiento de errores:
[docs/monitor-feeds.md](docs/monitor-feeds.md).

## Pruebas

```sh
npm run test:monitor
npm run test:community
python3 tools/test_build_public_site.py
```

`test:monitor` comprueba el modelo de contenido, fechas y estado de URL,
parsing/deduplicación de feeds y el endpoint local. Las pruebas de ingestión
son deterministas; no necesitan consultar internet. Para actualizar la copia
con respuestas reales se usa `feeds:update`. La revisión visual y las
interacciones del mapa se comprueban en navegador por separado.

Para generar el mismo artefacto público que se despliega en Pages:

```sh
python3 scripts/build-public-site.py --source . --output _site
```

El empaquetado conserva la app y las previews existentes, y excluye herramientas,
pruebas, informes internos y archivos de adquisición de fuentes.

## Estructura

| Archivo | Función |
| --- | --- |
| `index.html`, `css/monitor.css`, `js/monitor.js` | Monitor, mapa 2D y detalle de casos/fuentes. |
| `js/monitor-model.js` | Normalización, fechas, filtros, procedencia y enlaces compartibles. |
| `data/monitor-feed.json` | Última copia de metadatos recibidos y estado por fuente. |
| `tools/update_monitor_feeds.py` | Ingestión RSS/Atom y publicación del snapshot. |
| `tools/serve_monitor.py` | Servidor local y consulta de feeds bajo demanda. |
| `js/data.js` | Catálogo editorial de casos y referencias históricas. |
| `globe.html`, `js/app.js`, `css/styles.css` | Atlas 3D anterior, con sus filtros, análisis, cuaderno y comunidad. |

Los datasets históricos NUFORC y GEIPAN de la vista 3D no son feeds de actualidad.
Se conservan sus coberturas y precisiones originales; sus permisos y los de
cada medio deben revisarse antes de ampliar la redistribución o explotación.

## Créditos y licencia

Código bajo [licencia MIT](LICENSE). Los datos, textos, medios y dependencias
mantienen sus propias condiciones; la licencia del código no las sustituye.
Los metadatos de publicaciones conservan atribución y enlace al original.

Créditos y procedencia de MapLibre, Tabler, Natural Earth y Noto Sans:
[assets/monitor-assets.md](assets/monitor-assets.md).
La vista 3D usa [globe.gl](https://globe.gl) y texturas de
[three-globe](https://github.com/vasturiano/three-globe).

Proyecto independiente creado por Miquel Gelabert. No afiliado a NASA, NUFORC,
GEIPAN, CNES, AARO ni a ningún organismo oficial.
