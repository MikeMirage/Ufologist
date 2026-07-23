# Foro de la comunidad — despliegue e integración

UFOlogist es un sitio **estático** (GitHub Pages, sin backend). El foro es un
**Discourse externo** que tú alojas; la app solo enlaza/embebe. Este documento
explica cómo levantarlo, conectarlo y monetizarlo con anuncios.

## 1. Desplegar Discourse

Discourse necesita un servidor (no hay hosting gratis sostenible con **tus**
anuncios). Opciones, de más barata a más cómoda:

| Opción | Coste | Notas |
|---|---|---|
| **Oracle Cloud "Always Free"** (VM Ampere, 4 vCPU / 24 GB) | 0 € | Suficiente para Discourse; requiere montarlo tú (Docker). La más barata. |
| VPS (Hetzner CX22, DigitalOcean 2 GB) | ~5-7 €/mes | Instalación estándar de Discourse. |
| Discourse hosting oficial | desde ~20 $/mes | Cero mantenimiento; los anuncios propios pueden estar limitados según plan. |

Instalación estándar (self-host, Docker) — resumen oficial:
```bash
# en un servidor Ubuntu con dominio (p.ej. foro.ufologist.app) apuntando a su IP
git clone https://github.com/discourse/discourse_docker.git /var/discourse
cd /var/discourse && ./discourse-setup   # pide dominio, email admin y SMTP
```
Necesitas un **dominio** y un proveedor **SMTP** (correo). Tras el setup tendrás
el foro en `https://foro.tudominio`.

Crea las categorías base: **Casos** (para los hilos por caso), **General**, y
tablones **por región** (Norteamérica, Europa, LATAM…).

## 2. Conectar la app

Edita `js/forum.js` y pon la URL (sin barra final):
```js
var CONFIG = {
  discourseUrl: 'https://foro.tudominio',
  forumName: 'Comunidad UFOlogist',
  caseCategory: 'casos',   // slug de la categoría de hilos por caso
};
```
Sube el cambio (bump `forum.js?v=` en `index.html`). A partir de ahí:
- El botón **☷ Comunidad** de la cabecera abre el foro.
- El botón **💬 Discutir / investigar** de cada ficha abre el hilo del caso
  (búsqueda por su nombre → lleva al hilo o a crearlo).

## 3. (Opcional, recomendado) Hilos por caso automáticos — Discourse *embedding*

Discourse puede **crear un tema por cada página** automáticamente y mostrarlo
embebido en la ficha (como comentarios). Para activarlo:

1. En Discourse: **Admin → Customize → Embedding**. Añade el host embebible
   `mikemirage.github.io` (o tu dominio) y elige la categoría **Casos**.
2. En la app, sustituir el botón por el embed (pendiente en `forum.js`): inyectar
   `DiscourseEmbed = { discourseUrl, discourseEmbedUrl }` usando la URL canónica
   por caso `…/#case=<id>` y cargar `…/javascripts/embed.js` en un
   `<div id="discourse-comments">` dentro de la ficha.

Así cada avistamiento tiene su hilo real de foro embebido, con moderación y
reputación de Discourse detrás.

## 4. Monetización con anuncios

- Plugin oficial **discourse-adplugin** (`discourse-adplugin`): soporta Google
  AdSense, Google Ad Manager (DFP), Amazon y Carbon. Se instala como plugin y se
  configura desde Admin (posiciones: encima del primer post, entre posts, barra
  lateral, etc.). Es la vía recomendada.
- Alternativa: un **theme component** propio que inserte tus slots de AdSense.
- Los anuncios se muestran en el foro Discourse (donde tú controlas el
  inventario y cobras), no en el widget embebido salvo que lo añadas al tema.

## 5. Notas

- Mientras `discourseUrl` esté vacío, la app muestra un modal
  "próximamente" — no se rompe nada.
- Para máxima accesibilidad puedes habilitar en Discourse el login con Google/
  email además de usuario/contraseña (Admin → Settings → Login).
