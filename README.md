# UFOlogist — Observatorio UAP

Monitor de publicaciones y fuentes del fenómeno UAP, con globo 3D y expedientes
históricos. Distingue la fecha de publicación de la fecha del suceso, conserva
los enlaces originales y muestra cuándo se consultó cada fuente.

- **Monitor**: publicaciones reales de RSS, con filtros de periodo, fuente y tema.
- **Atlas**: globo 3D como vista principal y mapa 2D opcional, con la misma lista
  completa de **86.919 registros**: 80.332 NUFORC, 2.677 GEIPAN, 3.799 de
  archivos oficiales y 111 del catálogo editorial.
- **Casos**: referencias, contexto, material audiovisual cuando existe y enlaces compartibles.
- **Fuentes**: cobertura, última consulta, última publicación y estado del canal.
- **Una interfaz compartida**: cambiar entre Globo 3D y Mapa 2D conserva la
  búsqueda, los filtros y las fichas. Los enlaces 2D incluyen `spatial=map`.

El globo y el mapa del Monitor ofrecen contexto histórico; una noticia sin localización
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

El motor 3D, las texturas terrestres, la cartografía 2D, MapLibre, los iconos
y los glifos del mapa se sirven desde `assets/`. El mapa 2D se carga al elegirlo
o al abrir el contexto de una ficha. El globo agrupa los casos según el zoom,
mantiene una cámara estable y pausa su renderizado al ocultarse, abrir una
ficha o cambiar de sección. Su resolución se limita en pantallas de alta densidad.
Los grupos conservan todos los registros; el límite se aplica únicamente a los
marcadores visuales. Acercar un grupo permite consultar sus fichas, también
cuando varios reportes comparten las mismas coordenadas. Las listas se paginan
sin recortar los resultados de búsqueda ni los puntos del globo y del mapa.
Los símbolos conservan un tamaño fijo en pantalla, sin columnas 3D. El globo
agrupa también los marcadores que se pisan en pantalla y reserva espacio para
los controles. Al acercar, los recuentos quedan disponibles al pasar el cursor,
enfocar o abrir un grupo, y los puntos individuales conservan su categoría.
En el zoom cercano se carga cartografía de detalle y referencias de Esri,
reutilizando la fuente del globo anterior; los créditos aparecen en el mapa.
La carga y la caché están acotadas, se detienen al ocultar el globo y un fallo
del proveedor conserva la textura local y el acceso a los casos.
**Casos** en la barra del globo abre los filtros por procedencia, tipo, forma,
clasificación de origen, país, precisión geográfica y años del suceso. Estos
filtros son independientes de los periodos y fuentes de las publicaciones RSS.
**Herramientas avanzadas** conserva la cronología, el cuaderno y los controles
originales en `globe.html`; sus enlaces antiguos siguen funcionando.
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
la integridad de los 86.919 registros, sus categorías y los conteos del globo,
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
| `index.html`, `css/monitor.css`, `js/monitor.js` | Monitor, selector 3D/2D y detalle de casos/fuentes. |
| `js/monitor-globe.js` | Globo 3D integrado, agrupación de casos y control de renderizado. |
| `js/monitor-globe-layout.js` | Agrupación en píxeles y separación de controles y selección, sin recortar datos. |
| `js/monitor-globe-tiles.js` | Cartografía de detalle, reproyección y caché acotada con fallback local. |
| `js/monitor-model.js` | Normalización, fechas, filtros, procedencia y enlaces compartibles. |
| `js/monitor-catalog.js` | Adaptadores del catálogo completo, IDs estables, categorías originales y búsqueda. |
| `data/monitor-feed.json` | Última copia de metadatos recibidos y estado por fuente. |
| `tools/update_monitor_feeds.py` | Ingestión RSS/Atom y publicación del snapshot. |
| `tools/serve_monitor.py` | Servidor local y consulta de feeds bajo demanda. |
| `js/data.js` | Catálogo editorial de casos y referencias históricas. |
| `globe.html`, `js/app.js`, `css/styles.css` | Experiencia anterior conservada para enlaces y funciones históricas. |

Los datasets históricos NUFORC, GEIPAN y archivos oficiales del atlas no son feeds de actualidad.
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
