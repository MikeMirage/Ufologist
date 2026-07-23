// ============================================================
// forum.js — integración con el foro de la comunidad (UFOlogist)
//
// La app es el PUNTO DE ENTRADA: un tablón general (cabecera "Comunidad") y un
// hilo por caso desde cada ficha, para trackear / verificar / investigar
// avistamientos. El backend es un foro Discourse externo (self-host); aquí solo
// enlazamos/embebemos. Dirigido por CONFIG → sin foro configurado, muestra un
// estado "próximamente" en vez de romperse.
//
// PARA ACTIVARLO: pon la URL de tu Discourse en CONFIG.discourseUrl (sin barra
// final). Ver docs/forum-setup.md para desplegar Discourse, el embedding por
// caso y los anuncios.
// ============================================================
(function (root) {
  'use strict';
  var CONFIG = {
    discourseUrl: '',                     // p.ej. 'https://foro.ufologist.app'
    forumName: 'Comunidad UFOlogist',
    caseCategory: 'casos',                // slug de categoría para hilos por caso (opcional)
  };

  function lang() { return root.__ufologistLang === 'en' ? 'en' : 'es'; }
  var T = {
    es: {
      soonTitle: 'Comunidad UFOlogist',
      intro: 'El foro de la comunidad es el punto de encuentro para trackear, verificar e investigar avistamientos entre todos: un hilo por cada caso más tablones generales.',
      soon: 'Aún no está conectado. En cuanto el foro esté desplegado, este botón abrirá la comunidad y cada ficha tendrá su hilo de investigación.',
      features: ['Un hilo por caso: aporta pruebas, testimonios y análisis', 'Corrobora o descarta avistamientos con la comunidad', 'Tablones generales y por región'],
      configHint: 'Admin: define CONFIG.discourseUrl en js/forum.js (ver docs/forum-setup.md).',
      openForum: 'Abrir el foro ↗', close: 'Cerrar',
      caseBtn: '💬 Discutir / investigar este caso',
    },
    en: {
      soonTitle: 'UFOlogist Community',
      intro: 'The community forum is where everyone tracks, verifies and investigates sightings together: a thread per case plus general boards.',
      soon: "It isn't connected yet. Once the forum is deployed, this button will open the community and every case will have its investigation thread.",
      features: ['One thread per case: add evidence, testimony and analysis', 'Corroborate or rule out sightings with the community', 'General and regional boards'],
      configHint: 'Admin: set CONFIG.discourseUrl in js/forum.js (see docs/forum-setup.md).',
      openForum: 'Open the forum ↗', close: 'Close',
      caseBtn: '💬 Discuss / investigate this case',
    },
  };
  function t(k) { return (T[lang()] || T.es)[k]; }
  function enabled() { return !!CONFIG.discourseUrl; }

  // URL del hilo de un caso. Con Discourse: búsqueda por el nombre del caso, que
  // lleva al hilo existente o a crearlo. (Al activar el embedding, cada ficha
  // cargará su tema inline; ver docs.)
  function caseUrl(caseId, caseName) {
    var base = CONFIG.discourseUrl.replace(/\/$/, '');
    return base + '/search?q=' + encodeURIComponent((caseName || caseId) + ' #' + CONFIG.caseCategory);
  }

  function showModal() {
    var m = document.getElementById('forum-modal');
    if (!m) { m = document.createElement('div'); m.id = 'forum-modal'; m.className = 'forum-modal'; document.body.appendChild(m); }
    var feats = t('features').map(function (f) { return '<li>' + f + '</li>'; }).join('');
    m.innerHTML =
      '<div class="forum-modal-card glass" role="dialog" aria-modal="true">' +
        '<button class="forum-modal-close" aria-label="' + t('close') + '">×</button>' +
        '<h2>☷ ' + t('soonTitle') + '</h2>' +
        '<p>' + t('intro') + '</p>' +
        '<ul class="forum-feats">' + feats + '</ul>' +
        '<p class="forum-soon">' + t('soon') + '</p>' +
        '<p class="forum-config-hint">' + t('configHint') + '</p>' +
      '</div>';
    m.style.display = 'flex';
    m.querySelector('.forum-modal-close').onclick = function () { m.style.display = 'none'; };
    m.onclick = function (e) { if (e.target === m) m.style.display = 'none'; };
  }

  root.UFOForum = {
    config: CONFIG,
    isEnabled: enabled,
    label: function (k) { return t(k); },
    openGeneral: function () { if (enabled()) window.open(CONFIG.discourseUrl, '_blank', 'noopener'); else showModal(); },
    openCase: function (caseId, caseName) { if (enabled()) window.open(caseUrl(caseId, caseName), '_blank', 'noopener'); else showModal(); },
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
