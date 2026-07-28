// ============================================================
// forum.js — comunidad de UFOlogist sobre GitHub Discussions (Giscus)
//
// La app es el PUNTO DE ENTRADA: un tablón general (cabecera "Comunidad" → la
// página de Discussions del repo) y un HILO POR CASO embebido en cada ficha vía
// giscus (mapping=specific, un discussion por caso) para trackear / verificar /
// investigar avistamientos. Los usuarios participan con su cuenta de GitHub.
//
// PARA ACTIVARLO (ver docs/forum-setup.md):
//   1. En el repo: Settings → General → Features → activar "Discussions".
//   2. Instalar la app giscus en el repo: https://github.com/apps/giscus
//   3. En https://giscus.app configurar el repo y copiar repoId y categoryId.
//   4. Pegarlos abajo en CONFIG. (El botón "Comunidad" ya funciona con solo el
//      paso 1; los hilos embebidos por caso necesitan repoId + categoryId.)
// ============================================================
(function (root) {
  'use strict';
  var CONFIG = {
    repo: 'MikeMirage/Ufologist',
    repoId: '',                    // de giscus.app (p.ej. 'R_kgD...')
    category: 'Casos',             // categoría de Discussions para hilos por caso
    categoryId: '',                // de giscus.app (p.ej. 'DIC_kwD...')
    termPrefix: 'caso: ',          // título del discussion por caso
  };
  var DISCUSSIONS_URL = 'https://github.com/' + CONFIG.repo + '/discussions';

  function lang() { return root.__ufologistLang === 'en' ? 'en' : 'es'; }
  var T = {
    es: {
      title: 'Comunidad UFOlogist', close: 'Cerrar', openGh: 'Ver en GitHub Discussions ↗',
      caseTitle: 'Investigación del caso', caseHint: 'Aporta pruebas, testimonios o análisis. Corrobora o descarta el caso con la comunidad (se participa con cuenta de GitHub).',
      soonTitle: 'Comunidad UFOlogist',
      intro: 'La comunidad usa GitHub Discussions: un hilo por cada caso para trackear, verificar e investigar avistamientos, más tablones generales.',
      soon: 'Aún no está activado. Cuando se habiliten las Discussions del repositorio, este botón abrirá la comunidad y cada ficha tendrá su hilo embebido.',
      features: ['Un hilo por caso: pruebas, testimonios y análisis', 'Corrobora o descarta avistamientos entre todos', 'Tablones generales y por región'],
      configHint: 'Admin: activa Discussions y pega repoId/categoryId en js/forum.js (ver docs/forum-setup.md).',
    },
    en: {
      title: 'UFOlogist Community', close: 'Close', openGh: 'View on GitHub Discussions ↗',
      caseTitle: 'Case investigation', caseHint: 'Add evidence, testimony or analysis. Corroborate or rule out the case with the community (sign in with GitHub).',
      soonTitle: 'UFOlogist Community',
      intro: 'The community runs on GitHub Discussions: a thread per case to track, verify and investigate sightings, plus general boards.',
      soon: "Not enabled yet. Once the repository's Discussions are turned on, this button opens the community and every case gets its embedded thread.",
      features: ['One thread per case: evidence, testimony and analysis', 'Corroborate or rule out sightings together', 'General and regional boards'],
      configHint: 'Admin: enable Discussions and paste repoId/categoryId in js/forum.js (see docs/forum-setup.md).',
    },
  };
  function t(k) { return (T[lang()] || T.es)[k]; }
  function giscusReady() { return !!(CONFIG.repoId && CONFIG.categoryId); }
  function ghTheme() { return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; }

  // ---- overlay reutilizable ----
  function overlay() {
    var m = document.getElementById('forum-modal');
    if (!m) { m = document.createElement('div'); m.id = 'forum-modal'; m.className = 'forum-modal'; document.body.appendChild(m); }
    return m;
  }
  function closeOverlay() { var m = document.getElementById('forum-modal'); if (m) m.style.display = 'none'; }

  function showSoon() {
    var m = overlay();
    var feats = t('features').map(function (f) { return '<li>' + f + '</li>'; }).join('');
    m.innerHTML =
      '<div class="forum-modal-card glass" role="dialog" aria-modal="true">' +
        '<button class="forum-modal-close" aria-label="' + t('close') + '">×</button>' +
        '<h2>☷ ' + t('soonTitle') + '</h2><p>' + t('intro') + '</p>' +
        '<ul class="forum-feats">' + feats + '</ul>' +
        '<p class="forum-soon">' + t('soon') + '</p>' +
        '<p class="forum-config-hint">' + t('configHint') + '</p>' +
      '</div>';
    m.style.display = 'flex';
    m.querySelector('.forum-modal-close').onclick = closeOverlay;
    m.onclick = function (e) { if (e.target === m) closeOverlay(); };
  }

  // hilo por caso embebido (giscus). Si aún no hay repoId/categoryId, enlaza a
  // GitHub Discussions buscando el caso.
  function openCaseThread(caseId, caseName) {
    var term = CONFIG.termPrefix + (caseName || caseId);
    var m = overlay();
    m.innerHTML =
      '<div class="forum-modal-card forum-thread glass" role="dialog" aria-modal="true">' +
        '<button class="forum-modal-close" aria-label="' + t('close') + '">×</button>' +
        '<h2>💬 ' + t('caseTitle') + '</h2>' +
        '<p class="forum-thread-name">' + (caseName || caseId) + '</p>' +
        '<p class="forum-soon">' + t('caseHint') + '</p>' +
        '<div class="giscus-host" id="giscus-host"></div>' +
        '<a class="forum-gh-link" target="_blank" rel="noopener" href="' + DISCUSSIONS_URL + '?discussions_q=' + encodeURIComponent(term) + '">' + t('openGh') + '</a>' +
      '</div>';
    m.style.display = 'flex';
    m.querySelector('.forum-modal-close').onclick = closeOverlay;
    m.onclick = function (e) { if (e.target === m) closeOverlay(); };

    if (giscusReady()) {
      var s = document.createElement('script');
      s.src = 'https://giscus.app/client.js'; s.async = true; s.crossOrigin = 'anonymous';
      s.setAttribute('data-repo', CONFIG.repo);
      s.setAttribute('data-repo-id', CONFIG.repoId);
      s.setAttribute('data-category', CONFIG.category);
      s.setAttribute('data-category-id', CONFIG.categoryId);
      s.setAttribute('data-mapping', 'specific');
      s.setAttribute('data-term', term);       // un discussion por caso
      s.setAttribute('data-strict', '1');
      s.setAttribute('data-reactions-enabled', '1');
      s.setAttribute('data-input-position', 'top');
      s.setAttribute('data-theme', ghTheme());
      s.setAttribute('data-lang', lang());
      m.querySelector('#giscus-host').appendChild(s);
    }
  }

  root.UFOForum = {
    config: CONFIG,
    isEnabled: giscusReady,
    discussionsUrl: DISCUSSIONS_URL,
    openGeneral: function () { window.open(DISCUSSIONS_URL, '_blank', 'noopener'); },
    openCase: function (caseId, caseName) { openCaseThread(caseId, caseName); },
    _showInfo: showSoon,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
