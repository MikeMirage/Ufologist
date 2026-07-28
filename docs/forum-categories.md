# Arquitectura de 20 subforos UFOlogist

GitHub admite un máximo de 25 categorías por repositorio. UFOlogist utiliza 20,
agrupadas en cinco secciones de cuatro espacios. La categoría `Casos` se conserva
porque Giscus la usa para conectar cada ficha mediante `case:<id>`.

## Secciones y categorías

| Sección | Categoría | Formato |
|---|---|---|
| Empezar y participar | 📡 Anuncios | Announcement |
| Empezar y participar | ❔ Preguntas y orientación | Question and answer |
| Empezar y participar | 👋 Presentaciones y proyectos | Open-ended |
| Empezar y participar | 💡 Ideas para UFOlogist | Open-ended |
| Casos y testimonios | 🗺 Casos | Open-ended |
| Casos y testimonios | ⌛ Casos históricos | Open-ended |
| Casos y testimonios | ◌ Casos contemporáneos | Open-ended |
| Casos y testimonios | 📍 Testimonios y casos locales | Open-ended |
| Análisis y verificación | ✈ Aviación y defensa | Open-ended |
| Análisis y verificación | ▣ Imagen y vídeo | Open-ended |
| Análisis y verificación | ⌁ Radar y sensores | Open-ended |
| Análisis y verificación | ☄ Astronomía y satélites | Open-ended |
| Fuentes y método | ☁ Meteorología y atmósfera | Open-ended |
| Fuentes y método | 🏛 Archivos oficiales | Open-ended |
| Fuentes y método | 📰 Fuentes y hemeroteca | Open-ended |
| Fuentes y método | 🧪 Metodología y replicación | Open-ended |
| Regiones y perspectivas | 🇪🇺 España y Europa | Open-ended |
| Regiones y perspectivas | 🌎 Latinoamérica | Open-ended |
| Regiones y perspectivas | 🌐 Norteamérica y mundo | Open-ended |
| Regiones y perspectivas | 🔭 Astrobiología y SETI | Open-ended |

La tabla contiene exactamente las 20 categorías definidas en `js/community.js`;
el catálogo del site es la fuente de verdad para nombres, slugs y contexto.

## Migración desde las categorías actuales

La comunidad existente está vacía, por lo que no hay conversaciones que mover.
La configuración recomendada es:

1. Conservar y editar `Casos`, manteniendo intacto su `categoryId`.
2. Reutilizar las categorías predeterminadas `Announcements`, `General`, `Ideas`,
   `Q&A` y `Show and tell` mediante cambio de nombre, icono, descripción y formato.
3. Eliminar `Polls` si no se utiliza.
4. Crear las categorías restantes hasta alcanzar exactamente 20.
5. Crear las cinco secciones y asignar cada categoría.
6. Fusionar los formularios de `.github/DISCUSSION_TEMPLATE/` en `main`.

## Programación editorial

- Lunes: laboratorio de un caso con una pregunta falsable.
- Miércoles: reto de fuente primaria o transcripción.
- Viernes: clínica de identificación astronómica, orbital o meteorológica.
- Mensual: resumen de casos actualizados, explicados y aún abiertos.

La actividad se mide por fuentes aportadas, análisis replicados y casos
actualizados; nunca por el número bruto de publicaciones.
