// UFOlogist community: GitHub Discussions + one Giscus thread per case.
(function (root) {
  'use strict';

  var CONFIG = {
    repo: 'MikeMirage/Ufologist',
    repoId: 'R_kgDOS-15DA',
    category: 'Casos',
    categoryId: 'DIC_kwDOS-15DM4DB3NS',
    termPrefix: 'case:',
  };
  var DISCUSSIONS_URL = 'https://github.com/' + CONFIG.repo + '/discussions';
  var REPO_API_URL = 'https://api.github.com/repos/' + CONFIG.repo;
  var lastFocusedElement = null;

  function lang() { return root.__ufologistLang === 'en' ? 'en' : 'es'; }
  var T = {
    es: {
      close: 'Cerrar',
      openCommunity: 'Abrir la comunidad ↗',
      openThread: 'Abrir hilo en GitHub ↗',
      caseTitle: 'Investigación del caso',
      caseHint: 'Comparte pruebas, testimonios o análisis. La participación requiere una cuenta gratuita de GitHub.',
      loading: 'Cargando la conversación…',
      unavailableTitle: 'Comunidad UFOlogist',
      intro: 'Un espacio público para investigar casos, contrastar pruebas y organizar conversaciones por región.',
      unavailable: 'La comunidad todavía no está activada en GitHub. La aplicación está preparada y se habilitará sin cambiar este enlace.',
      features: ['Un hilo estable por caso', 'Pruebas, testimonios y análisis trazables', 'Moderación, reacciones y alertas'],
      embedError: 'No se pudo cargar la conversación embebida.',
    },
    en: {
      close: 'Close',
      openCommunity: 'Open community ↗',
      openThread: 'Open thread on GitHub ↗',
      caseTitle: 'Case investigation',
      caseHint: 'Share evidence, testimony or analysis. Participation requires a free GitHub account.',
      loading: 'Loading conversation…',
      unavailableTitle: 'UFOlogist Community',
      intro: 'A public space to investigate cases, compare evidence and organize regional conversations.',
      unavailable: 'The community is not enabled on GitHub yet. The application is ready and this same link will work once enabled.',
      features: ['One stable thread per case', 'Traceable evidence, testimony and analysis', 'Moderation, reactions and notifications'],
      embedError: 'The embedded conversation could not be loaded.',
    },
  };

  function t(key) { return (T[lang()] || T.es)[key]; }
  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function giscusReady() { return Boolean(CONFIG.repoId && CONFIG.categoryId); }
  function ghTheme() { return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; }
  function caseTerm(caseId) { return CONFIG.termPrefix + String(caseId || 'unknown').trim(); }
  function threadUrl(term) {
    return DISCUSSIONS_URL + '?discussions_q=' + encodeURIComponent('category:' + CONFIG.category + ' "' + term + '"');
  }

  function overlay() {
    var modal = document.getElementById('forum-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'forum-modal';
      modal.className = 'forum-modal';
      modal.setAttribute('aria-hidden', 'true');
      document.body.appendChild(modal);
    }
    return modal;
  }

  function closeOverlay() {
    var modal = document.getElementById('forum-modal');
    if (!modal) return;
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    document.removeEventListener('keydown', onModalKeydown, true);
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') lastFocusedElement.focus();
  }

  function onModalKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closeOverlay();
      return;
    }
    if (event.key !== 'Tab') return;
    var modal = document.getElementById('forum-modal');
    var focusable = modal && modal.querySelectorAll('button, a[href], iframe');
    if (!focusable || !focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  function showModal(html) {
    var modal = overlay();
    lastFocusedElement = document.activeElement;
    modal.innerHTML = html;
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    modal.querySelector('.forum-modal-close').onclick = closeOverlay;
    modal.onclick = function (event) { if (event.target === modal) closeOverlay(); };
    document.addEventListener('keydown', onModalKeydown, true);
    modal.querySelector('.forum-modal-close').focus();
    return modal;
  }

  function showUnavailable() {
    var features = t('features').map(function (feature) { return '<li>' + escapeHtml(feature) + '</li>'; }).join('');
    showModal(
      '<div class="forum-modal-card glass" role="dialog" aria-modal="true" aria-labelledby="forum-title">' +
        '<button class="forum-modal-close" aria-label="' + escapeHtml(t('close')) + '">×</button>' +
        '<h2 id="forum-title">☷ ' + escapeHtml(t('unavailableTitle')) + '</h2>' +
        '<p>' + escapeHtml(t('intro')) + '</p><ul class="forum-feats">' + features + '</ul>' +
        '<p class="forum-soon">' + escapeHtml(t('unavailable')) + '</p>' +
      '</div>'
    );
  }

  function discussionsEnabled() {
    if (typeof fetch !== 'function') return Promise.resolve(true);
    return fetch(REPO_API_URL, { headers: { Accept: 'application/vnd.github+json' } })
      .then(function (response) { return response.ok ? response.json() : null; })
      .then(function (repo) { return repo ? repo.has_discussions === true : true; })
      .catch(function () { return true; });
  }

  function openGeneral() {
    // Open synchronously to preserve the click gesture while the API check runs.
    var pending = window.open('about:blank', '_blank');
    if (pending) pending.opener = null;
    discussionsEnabled().then(function (enabled) {
      if (enabled) {
        if (pending) pending.location.replace(DISCUSSIONS_URL);
        else window.location.href = DISCUSSIONS_URL;
      } else {
        if (pending) pending.close();
        showUnavailable();
      }
    });
  }

  function openCaseThread(caseId, caseName) {
    var term = caseTerm(caseId);
    var safeName = escapeHtml(caseName || caseId || '');
    var modal = showModal(
      '<div class="forum-modal-card forum-thread glass" role="dialog" aria-modal="true" aria-labelledby="forum-title">' +
        '<button class="forum-modal-close" aria-label="' + escapeHtml(t('close')) + '">×</button>' +
        '<h2 id="forum-title">💬 ' + escapeHtml(t('caseTitle')) + '</h2>' +
        '<p class="forum-thread-name">' + safeName + '</p>' +
        '<p class="forum-soon">' + escapeHtml(t('caseHint')) + '</p>' +
        '<div class="giscus-host" id="giscus-host"><p class="forum-loading">' + escapeHtml(t('loading')) + '</p></div>' +
        '<a class="forum-gh-link" target="_blank" rel="noopener noreferrer" href="' + escapeHtml(threadUrl(term)) + '">' + escapeHtml(t('openThread')) + '</a>' +
      '</div>'
    );

    if (!giscusReady()) {
      modal.querySelector('#giscus-host').innerHTML = '<p class="forum-empty">' + escapeHtml(t('unavailable')) + '</p>';
      return;
    }

    var script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.setAttribute('data-repo', CONFIG.repo);
    script.setAttribute('data-repo-id', CONFIG.repoId);
    script.setAttribute('data-category', CONFIG.category);
    script.setAttribute('data-category-id', CONFIG.categoryId);
    script.setAttribute('data-mapping', 'specific');
    script.setAttribute('data-term', term);
    script.setAttribute('data-strict', '1');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'top');
    script.setAttribute('data-theme', ghTheme());
    script.setAttribute('data-lang', lang());
    script.onerror = function () {
      var host = modal.querySelector('#giscus-host');
      if (host) host.innerHTML = '<p class="forum-empty">' + escapeHtml(t('embedError')) + '</p>';
    };
    modal.querySelector('#giscus-host').innerHTML = '';
    modal.querySelector('#giscus-host').appendChild(script);
  }

  root.UFOForum = {
    config: CONFIG,
    isEnabled: giscusReady,
    discussionsUrl: DISCUSSIONS_URL,
    openGeneral: openGeneral,
    openCase: openCaseThread,
    close: closeOverlay,
    _caseTerm: caseTerm,
    _threadUrl: threadUrl,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
