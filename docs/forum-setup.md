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
de carga/error. No incluye mensajes privados, chat, reputación propia, anuncios,
subida de archivos propia ni perfiles duplicados.

## Activación (administrador)

1. En `Settings → General → Features`, activa **Discussions**.
2. Crea una categoría **Casos** de tipo “Open-ended discussion”.
3. Instala [Giscus](https://github.com/apps/giscus) únicamente en
   `MikeMirage/Ufologist`.
4. Abre [giscus.app](https://giscus.app/es), introduce el repositorio y selecciona:
   categoría `Casos`, mapping `specific`, strict matching y entrada encima de los
   comentarios.
5. Copia `data-repo-id` y `data-category-id` en `CONFIG` dentro de `js/forum.js`.
6. Incrementa la versión de `js/forum.js` en `index.html`, publica y verifica.

`repoId` y `categoryId` son identificadores públicos, no secretos.

## Moderación mínima antes del lanzamiento

- Fija un hilo “Normas y cómo aportar pruebas”.
- Exige fuente, fecha aproximada, ubicación y contexto para afirmaciones.
- Prohíbe datos personales de testigos sin consentimiento y contenido ofensivo.
- Nombra al menos dos moderadores y activa notificaciones de la categoría Casos.
- Usa respuestas oficiales para marcar `Corroborado`, `Explicado` o `Sin resolver`;
  esas etiquetas editoriales pueden convertirse después en campos del producto.

## Criterios de aceptación

- “Comunidad” abre Discussions; si está desactivado muestra un estado útil.
- “Discutir / investigar” abre siempre el mismo hilo para el mismo `case id`,
  aunque cambie el idioma o el título.
- El modal se cierra con botón, clic exterior y Escape; conserva el foco.
- Si Giscus falla, el usuario puede continuar mediante el enlace a GitHub.
- No hay HTML de datos de casos sin escapar ni errores de consola.

## Evolución posterior

Medir durante 4–6 semanas: participantes activos, casos con aportes, respuestas
útiles, tiempo de moderación y retorno semanal. Solo después priorizar buscador de
comunidad, badges/estado del caso, digest o migración a una plataforma propia.
