# Lista de lanzamiento de la comunidad UFOlogist

## 1. Código y despliegue

- [ ] La rama del foro se revisó mediante pull request y se fusionó en `main`.
- [ ] Producción carga la versión configurada de `js/forum.js`.
- [ ] “Comunidad” funciona en escritorio y en el menú móvil.
- [ ] El hub muestra exactamente 20 subforos agrupados en cinco secciones.
- [ ] La búsqueda del hub filtra por nombre, descripción y preguntas iniciales.
- [ ] Un caso abre el mismo término `case:<id>` en español e inglés.
- [ ] Giscus carga en tema claro y oscuro y responde a un cambio de tema abierto.
- [ ] El enlace “Abrir hilo en GitHub” sigue disponible cuando falla el embed.
- [ ] No aparecen errores del foro en la consola.
- [ ] Las 20 categorías existen en GitHub y sus slugs coinciden con
      `js/community.js`.
- [ ] Los 20 formularios de `.github/DISCUSSION_TEMPLATE/` están activos.

## 2. Privacidad y seguridad

- [ ] Los casos del cuaderno muestran la revisión previa de privacidad.
- [ ] La aplicación no envía automáticamente notas, coordenadas ni archivos.
- [ ] Las normas prohíben doxxing, datos personales e información operacional sensible.
- [ ] Existe un procedimiento para retirar datos personales con rapidez.
- [ ] Al menos dos personas pueden atender una incidencia grave de moderación.

## 3. Contenido inicial

- [ ] Hay una bienvenida fijada con enlaces al atlas, las normas y el método.
- [ ] Hay un hilo fijado que explica cómo aportar pruebas.
- [ ] Se publicaron entre 8 y 12 temas iniciales representativos.
- [ ] Los temas iniciales utilizan el
      [paquete de contenido semilla](forum-seed-content.md) y tienen responsable.
- [ ] Las 20 categorías están disponibles, pero la promoción y los temas semilla
      se concentran inicialmente en las ocho áreas prioritarias.
- [ ] Están programados el laboratorio semanal, el reto de fuente primaria y la
      clínica de identificación del cielo.
- [ ] Cada tema inicial enlaza de vuelta al permalink de su caso en el atlas.
- [ ] Existen hilos generales para dudas, propuestas y presentación de miembros.
- [ ] Hay cuatro semanas de publicaciones preparadas con responsable, canal,
      CTA, fecha y enlace canónico.
- [ ] Cada pieza social conduce a un caso o una tarea concreta, no solo al perfil.
- [ ] Hay una persona responsable de responder cada día y una segunda para
      privacidad o escalado.

No publiques los 60 temas iniciales de una vez. Empieza con una muestra pequeña,
revisa la carga de moderación y amplía el catálogo en varias tandas.

## 4. Prueba de aceptación

Prueba como visitante sin sesión y como participante con GitHub:

1. Abrir la comunidad desde escritorio.
2. Abrir la comunidad desde un teléfono de 390 px de ancho.
3. Buscar un caso, abrir su ficha y entrar en “Discutir / investigar”.
4. Confirmar que el término del hilo contiene el identificador estable del caso.
5. Cambiar idioma y comprobar que no se crea otro hilo.
6. Cambiar tema con Giscus abierto.
7. Abrir un caso del cuaderno y comprobar la revisión de privacidad.
8. Cerrar cada modal con botón, fondo y Escape; comprobar el retorno del foco.

## 5. Seguimiento durante 4–6 semanas

Registra semanalmente:

- aportaciones verificables por participante activo;
- participantes activos;
- casos con al menos una aportación útil;
- tiempo hasta la primera respuesta;
- fuentes primarias añadidas;
- casos actualizados o explicados;
- retornos desde Discussions al atlas;
- horas de moderación e incidencias de privacidad.

Verifica además que los eventos definidos en la
[estrategia de comunicación y engagement](community-communication-strategy.md)
no incluyan testimonios, coordenadas privadas ni otros datos sensibles.

Revisa el MVP al final del periodo. Una plataforma propia solo se justifica si
GitHub demuestra ser una barrera relevante para participar o moderar.
