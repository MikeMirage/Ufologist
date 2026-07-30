# Foro UFOlogist — MVP con GitHub Discussions y Giscus

## Decisión

UFOlogist es una aplicación estática publicada en GitHub Pages. El MVP usa:

- **GitHub Discussions** como foro, cuentas, moderación, reacciones y alertas.
- **Giscus** para mostrar un hilo dentro de cada ficha de caso.
- Un identificador estable (`case:<id>`) como clave del hilo. El nombre traducido
  del caso es solo presentación y no puede crear conversaciones duplicadas.

Esto evita operar un backend, almacenar credenciales o construir anti-spam. Un
foro propio o Discourse se reconsiderará solo si el volumen o la monetización
justifican su coste operativo.

## Alcance del MVP

Incluye un tablón general, un hilo por caso, participación con cuenta de GitHub,
moderación nativa, interfaz ES/EN, tema claro/oscuro, enlace de respaldo y estados
de carga/error. Los casos del cuaderno local requieren una revisión de privacidad
antes de abrir su conversación pública. No incluye mensajes privados, chat, reputación propia, anuncios,
subida de archivos propia ni perfiles duplicados.

El botón “Comunidad” abre primero un hub integrado en UFOlogist con 20 subforos,
contexto editorial, preguntas iniciales y referencias. GitHub Discussions sigue
siendo la capa pública de cuentas, publicación, moderación y notificaciones.

## Activación (administrador)

1. En `Settings → General → Features`, activa **Discussions**.
2. Crea una categoría **Casos** de tipo “Open-ended discussion”.
3. Instala [Giscus](https://github.com/apps/giscus) únicamente en
   `MikeMirage/Ufologist`.
4. Abre [giscus.app](https://giscus.app/es), introduce el repositorio y selecciona:
   categoría `Casos`, mapping `specific`, strict matching y entrada encima de los
   comentarios.
5. Copia `data-repo-id` y `data-category-id` en `CONFIG` dentro de `js/forum.js`.
6. Aplica la [arquitectura de 20 subforos](forum-categories.md), conservando el
   `categoryId` actual de `Casos`.
7. Ejecuta `node tools/generate-discussion-forms.js` y fusiona los 20 formularios
   de `.github/DISCUSSION_TEMPLATE/` en la rama por defecto (`master`).
8. Incrementa las versiones de `community.js`, `forum.js` y CSS en `index.html`,
   publica y verifica.

`repoId` y `categoryId` son identificadores públicos, no secretos.

## Moderación mínima antes del lanzamiento

- Fija un hilo “Normas y cómo aportar pruebas”.
- Exige fuente, fecha aproximada, ubicación y contexto para afirmaciones.
- Prohíbe datos personales de testigos sin consentimiento y contenido ofensivo.
- Nombra al menos dos moderadores y activa notificaciones de la categoría Casos.
- Usa respuestas oficiales para marcar `Corroborado`, `Explicado` o `Sin resolver`;
  esas etiquetas editoriales pueden convertirse después en campos del producto.

Documentación editorial:

- [Normas, do's y don'ts](forum-guidelines.md)
- [Manual de moderación](forum-moderation.md)
- [60 entradas iniciales](forum-launch-topics.md)
- [12 publicaciones semilla listas para publicar](forum-seed-content.md)
- [Estrategia de comunicación y engagement](community-communication-strategy.md)

## Criterios de aceptación

- “Comunidad” abre Discussions; si está desactivado muestra un estado útil.
- “Comunidad” abre el hub interno, permite buscar entre 20 espacios y conserva
  un acceso directo al índice completo de GitHub Discussions.
- “Discutir / investigar” abre siempre el mismo hilo para el mismo `case id`,
  aunque cambie el idioma o el título.
- “Comunidad” está disponible tanto en escritorio como en el menú móvil.
- Los casos del cuaderno muestran un aviso de privacidad antes de abrir Giscus y
  no transmiten automáticamente notas, coordenadas ni archivos.
- El modal se cierra con botón, clic exterior y Escape; conserva el foco.
- Si Giscus falla, el usuario puede continuar mediante el enlace a GitHub.
- No hay HTML de datos de casos sin escapar ni errores de consola.
- Cada subforo tiene propósito, preguntas iniciales, al menos dos referencias y
  un formulario nativo con contexto y criterios de publicación.

Antes de publicar en producción, completa también la
[lista de lanzamiento](forum-release-checklist.md).

## Evolución posterior

Medir durante 4–6 semanas: participantes activos, casos con aportes, respuestas
útiles, tiempo de moderación y retorno semanal. Solo después priorizar buscador de
comunidad, badges/estado del caso, digest o migración a una plataforma propia.
