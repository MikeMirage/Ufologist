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
      communityTitle: 'Comunidad de investigación',
      communityEyebrow: '20 espacios · fuentes abiertas · método compartido',
      communityIntro: 'Investiga casos, aprende a verificar observaciones y colabora con personas que separan evidencia, hipótesis e incertidumbre.',
      communitySearch: 'Buscar un espacio, método o tema…',
      communityAll: 'Ver toda la comunidad en GitHub ↗',
      communityBoard: 'Abrir subforo ↗',
      communityBack: '← Todos los espacios',
      communityPrompts: 'Preguntas para empezar',
      communityReferences: 'Referencias esenciales',
      communityPrograms: 'Rituales que crean investigación útil',
      communitySpaces: 'Espacios de investigación',
      communityFocus: 'En foco',
      communityMission: 'Misión activa',
      communityNoResults: 'No hay espacios que coincidan con esta búsqueda.',
      communityGitHubHint: 'La lectura es pública. Para participar necesitas una cuenta gratuita de GitHub.',
      communityContext: 'Qué se trabaja aquí',
      exploreCommunity: 'Explorar los 20 subforos',
      relatedSpaces: 'También puede interesarte',
      openThread: 'Abrir hilo en GitHub ↗',
      caseTitle: 'Investigación del caso',
      caseHint: 'Comparte pruebas, testimonios o análisis. La participación requiere una cuenta gratuita de GitHub.',
      privateTitle: 'Antes de publicar',
      privateIntro: 'Este caso está guardado solo en tu navegador. La conversación en GitHub será pública.',
      privateChecks: [
        'Elimina nombres, rostros, matrículas y datos de contacto.',
        'Usa una ubicación aproximada; no publiques domicilios ni coordenadas privadas.',
        'Comparte únicamente archivos que puedas hacer públicos y conserva sus originales.',
      ],
      privateContinue: 'Revisado: abrir conversación',
      privateCancel: 'Seguir en privado',
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
      communityTitle: 'Research community',
      communityEyebrow: '20 spaces · open sources · shared method',
      communityIntro: 'Investigate cases, learn to verify observations, and collaborate with people who separate evidence, hypotheses, and uncertainty.',
      communitySearch: 'Search a space, method, or topic…',
      communityAll: 'View the full community on GitHub ↗',
      communityBoard: 'Open subforum ↗',
      communityBack: '← All spaces',
      communityPrompts: 'Questions to get started',
      communityReferences: 'Essential references',
      communityPrograms: 'Rituals that create useful research',
      communitySpaces: 'Research spaces',
      communityFocus: 'In focus',
      communityMission: 'Active mission',
      communityNoResults: 'No spaces match this search.',
      communityGitHubHint: 'Reading is public. A free GitHub account is required to participate.',
      communityContext: 'What belongs here',
      exploreCommunity: 'Explore all 20 subforums',
      relatedSpaces: 'Related research spaces',
      openThread: 'Open thread on GitHub ↗',
      caseTitle: 'Case investigation',
      caseHint: 'Share evidence, testimony or analysis. Participation requires a free GitHub account.',
      privateTitle: 'Before publishing',
      privateIntro: 'This case is stored only in your browser. The GitHub conversation will be public.',
      privateChecks: [
        'Remove names, faces, license plates, and contact details.',
        'Use an approximate location; do not publish homes or private coordinates.',
        'Only share files you can make public and keep the originals.',
      ],
      privateContinue: 'Reviewed: open conversation',
      privateCancel: 'Keep it private',
      loading: 'Loading conversation…',
      unavailableTitle: 'UFOlogist Community',
      intro: 'A public space to investigate cases, compare evidence and organize regional conversations.',
      unavailable: 'The community is not enabled on GitHub yet. The application is ready and this same link will work once enabled.',
      features: ['One stable thread per case', 'Traceable evidence, testimony and analysis', 'Moderation, reactions and notifications'],
      embedError: 'The embedded conversation could not be loaded.',
    },
  };

  function t(key) { return (T[lang()] || T.es)[key]; }
  function localized(value) {
    if (value == null || typeof value !== 'object') return String(value == null ? '' : value);
    return value[lang()] || value.es || value.en || '';
  }
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
  function communityCatalog() {
    return root.UFOCommunityCatalog || { sections: [], boards: [], programs: [] };
  }
  function categoryUrl(board) {
    return DISCUSSIONS_URL + '/categories/' + encodeURIComponent(board.slug);
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

  function openExternalCommunity() {
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

  function boardCard(board) {
    var search = [
      localized(board.name),
      localized(board.description),
      localized(board.prompts).join(' '),
      localized(board.mission),
    ].join(' ').toLowerCase();
    return (
      '<button type="button" class="forum-board-card' + (board.editorialFocus ? ' is-focus' : '') + '" data-forum-board="' + escapeHtml(board.id) + '" data-forum-search="' + escapeHtml(search) + '">' +
        '<span class="forum-board-icon" aria-hidden="true">' + escapeHtml(board.icon) + '</span>' +
        '<span class="forum-board-copy">' +
          '<b>' + escapeHtml(localized(board.name)) + (board.editorialFocus ? ' <em>' + escapeHtml(t('communityFocus')) + '</em>' : '') + '</b>' +
          '<span>' + escapeHtml(localized(board.description)) + '</span>' +
        '</span>' +
        '<span class="forum-board-arrow" aria-hidden="true">→</span>' +
      '</button>'
    );
  }

  function openBoard(boardId) {
    var catalog = communityCatalog();
    var board = catalog.boards.find(function (item) { return item.id === boardId; });
    if (!board) return showCommunityHub();
    var section = catalog.sections.find(function (item) { return item.id === board.section; });
    var prompts = localized(board.prompts).map(function (prompt) {
      return '<li>' + escapeHtml(prompt) + '</li>';
    }).join('');
    var references = board.references.map(function (item) {
      return (
        '<a class="forum-reference" target="_blank" rel="noopener noreferrer" href="' + escapeHtml(item.url) + '">' +
          '<b>' + escapeHtml(item.title) + ' ↗</b>' +
          '<span>' + escapeHtml(localized(item.note)) + '</span>' +
        '</a>'
      );
    }).join('');
    var mission = board.mission ? (
      '<section class="forum-board-mission">' +
        '<h3>' + escapeHtml(t('communityMission')) + '</h3>' +
        '<p>' + escapeHtml(localized(board.mission)) + '</p>' +
      '</section>'
    ) : '';
    var modal = showModal(
      '<div class="forum-modal-card forum-community forum-board-detail glass" role="dialog" aria-modal="true" aria-labelledby="forum-title">' +
        '<button class="forum-modal-close" aria-label="' + escapeHtml(t('close')) + '">×</button>' +
        '<button type="button" class="forum-community-back" data-forum-back>' + escapeHtml(t('communityBack')) + '</button>' +
        '<div class="forum-board-detail-head">' +
          '<span class="forum-board-detail-icon" aria-hidden="true">' + escapeHtml(board.icon) + '</span>' +
          '<div><p class="forum-community-eyebrow">' + escapeHtml(section ? localized(section.name) : '') + '</p>' +
          '<h2 id="forum-title">' + escapeHtml(localized(board.name)) + '</h2></div>' +
        '</div>' +
        '<section class="forum-board-context"><h3>' + escapeHtml(t('communityContext')) + '</h3><p>' + escapeHtml(localized(board.description)) + '</p></section>' +
        mission +
        '<div class="forum-board-columns">' +
          '<section><h3>' + escapeHtml(t('communityPrompts')) + '</h3><ol class="forum-board-prompts">' + prompts + '</ol></section>' +
          '<section><h3>' + escapeHtml(t('communityReferences')) + '</h3><div class="forum-reference-list">' + references + '</div></section>' +
        '</div>' +
        '<div class="forum-community-footer">' +
          '<p>' + escapeHtml(t('communityGitHubHint')) + '</p>' +
          '<div><button type="button" class="btn-ghost" data-forum-all>' + escapeHtml(t('communityAll')) + '</button>' +
          '<a class="forum-gh-link" target="_blank" rel="noopener noreferrer" href="' + escapeHtml(categoryUrl(board)) + '">' + escapeHtml(t('communityBoard')) + '</a></div>' +
        '</div>' +
      '</div>'
    );
    modal.querySelector('[data-forum-back]').onclick = showCommunityHub;
    modal.querySelector('[data-forum-all]').onclick = openExternalCommunity;
  }

  function showCommunityHub() {
    var catalog = communityCatalog();
    if (!catalog.boards.length) return openExternalCommunity();
    var programs = catalog.programs.map(function (program) {
      return (
        '<button type="button" class="forum-program" data-forum-board="' + escapeHtml(program.board) + '">' +
          '<span aria-hidden="true">' + escapeHtml(program.icon) + '</span>' +
          '<b>' + escapeHtml(localized(program.title)) + '</b>' +
          '<small>' + escapeHtml(localized(program.description)) + '</small>' +
        '</button>'
      );
    }).join('');
    var sections = catalog.sections.map(function (section) {
      var cards = catalog.boards.filter(function (board) { return board.section === section.id; }).map(boardCard).join('');
      return (
        '<section class="forum-space-section" data-forum-section="' + escapeHtml(section.id) + '">' +
          '<h3><span aria-hidden="true">' + escapeHtml(section.icon) + '</span> ' + escapeHtml(localized(section.name)) + '</h3>' +
          '<div class="forum-board-grid">' + cards + '</div>' +
        '</section>'
      );
    }).join('');
    var modal = showModal(
      '<div class="forum-modal-card forum-community glass" role="dialog" aria-modal="true" aria-labelledby="forum-title">' +
        '<button class="forum-modal-close" aria-label="' + escapeHtml(t('close')) + '">×</button>' +
        '<header class="forum-community-hero">' +
          '<div><p class="forum-community-eyebrow">' + escapeHtml(t('communityEyebrow')) + '</p>' +
          '<h2 id="forum-title">☷ ' + escapeHtml(t('communityTitle')) + '</h2>' +
          '<p>' + escapeHtml(t('communityIntro')) + '</p></div>' +
          '<button type="button" class="btn-ghost" data-forum-all>' + escapeHtml(t('communityAll')) + '</button>' +
        '</header>' +
        '<section class="forum-programs"><h3>' + escapeHtml(t('communityPrograms')) + '</h3><div>' + programs + '</div></section>' +
        '<div class="forum-community-tools"><h3>' + escapeHtml(t('communitySpaces')) + '</h3>' +
          '<label><span aria-hidden="true">⌕</span><input type="search" data-forum-search-input placeholder="' + escapeHtml(t('communitySearch')) + '" autocomplete="off"></label>' +
        '</div>' +
        '<div class="forum-space-sections">' + sections + '</div>' +
        '<p class="forum-community-empty" data-forum-empty hidden>' + escapeHtml(t('communityNoResults')) + '</p>' +
      '</div>'
    );
    modal.querySelector('[data-forum-all]').onclick = openExternalCommunity;
    modal.querySelectorAll('[data-forum-board]').forEach(function (button) {
      button.onclick = function () { openBoard(button.getAttribute('data-forum-board')); };
    });
    var input = modal.querySelector('[data-forum-search-input]');
    input.oninput = function () {
      var query = input.value.trim().toLowerCase();
      var visibleCount = 0;
      modal.querySelectorAll('.forum-board-card').forEach(function (card) {
        var visible = !query || card.getAttribute('data-forum-search').indexOf(query) !== -1;
        card.hidden = !visible;
        if (visible) visibleCount++;
      });
      modal.querySelectorAll('.forum-space-section').forEach(function (section) {
        section.hidden = !section.querySelector('.forum-board-card:not([hidden])');
      });
      modal.querySelector('[data-forum-empty]').hidden = visibleCount !== 0;
    };
  }

  function openGeneral() {
    showCommunityHub();
  }

  function relatedBoards(context) {
    var catalog = communityCatalog();
    var ids = ['casos'];
    var type = String(context && context.type || '').toUpperCase();
    var country = String(context && context.country || '').toLowerCase();
    if (type === 'RV') ids.push('radar-y-sensores');
    else if (type === 'MIL') ids.push('aviacion-y-defensa');
    else ids.push('astronomia-y-satelites');
    if (/españa|spain|france|francia|italy|italia|belg|german|alemania|reino unido|united kingdom|europ/.test(country)) ids.push('espana-y-europa');
    else if (/argentin|chile|brasil|brazil|méxico|mexico|perú|peru|colombia|uruguay|paraguay|bolivia|ecuador|venezuela/.test(country)) ids.push('latinoamerica');
    else ids.push('norteamerica-y-mundo');
    return ids.map(function (id) {
      return catalog.boards.find(function (board) { return board.id === id; });
    }).filter(Boolean);
  }

  function openCaseThread(caseId, caseName, context) {
    var term = caseTerm(caseId);
    var safeName = escapeHtml(caseName || caseId || '');
    var related = relatedBoards(context).map(function (board) {
      return '<button type="button" data-forum-related="' + escapeHtml(board.id) + '">' +
        '<span aria-hidden="true">' + escapeHtml(board.icon) + '</span>' + escapeHtml(localized(board.name)) +
      '</button>';
    }).join('');
    var modal = showModal(
      '<div class="forum-modal-card forum-thread glass" role="dialog" aria-modal="true" aria-labelledby="forum-title">' +
        '<button class="forum-modal-close" aria-label="' + escapeHtml(t('close')) + '">×</button>' +
        '<h2 id="forum-title">💬 ' + escapeHtml(t('caseTitle')) + '</h2>' +
        '<p class="forum-thread-name">' + safeName + '</p>' +
        '<p class="forum-soon">' + escapeHtml(t('caseHint')) + '</p>' +
        '<div class="giscus-host" id="giscus-host"><p class="forum-loading">' + escapeHtml(t('loading')) + '</p></div>' +
        '<div class="forum-related-spaces"><p>' + escapeHtml(t('relatedSpaces')) + '</p><div>' + related + '</div></div>' +
        '<div class="forum-thread-actions"><button type="button" class="btn-ghost" data-forum-hub>' + escapeHtml(t('exploreCommunity')) + '</button>' +
        '<a class="forum-gh-link" target="_blank" rel="noopener noreferrer" href="' + escapeHtml(threadUrl(term)) + '">' + escapeHtml(t('openThread')) + '</a></div>' +
      '</div>'
    );
    modal.querySelector('[data-forum-hub]').onclick = showCommunityHub;
    modal.querySelectorAll('[data-forum-related]').forEach(function (button) {
      button.onclick = function () { openBoard(button.getAttribute('data-forum-related')); };
    });

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

  function reviewPrivateCase(caseId, caseName) {
    var checks = t('privateChecks').map(function (item) {
      return '<li>' + escapeHtml(item) + '</li>';
    }).join('');
    var modal = showModal(
      '<div class="forum-modal-card glass" role="dialog" aria-modal="true" aria-labelledby="forum-title">' +
        '<button class="forum-modal-close" aria-label="' + escapeHtml(t('close')) + '">×</button>' +
        '<h2 id="forum-title">🌐 ' + escapeHtml(t('privateTitle')) + '</h2>' +
        '<p class="forum-thread-name">' + escapeHtml(caseName || caseId || '') + '</p>' +
        '<p>' + escapeHtml(t('privateIntro')) + '</p>' +
        '<ul class="forum-review-list">' + checks + '</ul>' +
        '<div class="forum-review-actions">' +
          '<button type="button" class="btn-ghost" data-forum-cancel>' + escapeHtml(t('privateCancel')) + '</button>' +
          '<button type="button" class="btn-ghost" data-forum-continue>' + escapeHtml(t('privateContinue')) + '</button>' +
        '</div>' +
      '</div>'
    );
    var returnFocus = lastFocusedElement;
    modal.querySelector('[data-forum-cancel]').onclick = closeOverlay;
    modal.querySelector('[data-forum-continue]').onclick = function () {
      openCaseThread(caseId, caseName);
      lastFocusedElement = returnFocus;
    };
  }

  function syncTheme(theme) {
    var frame = document.querySelector('#forum-modal iframe.giscus-frame');
    if (!frame || !frame.contentWindow) return;
    frame.contentWindow.postMessage({
      giscus: { setConfig: { theme: theme === 'light' ? 'light' : 'dark' } },
    }, 'https://giscus.app');
  }

  root.addEventListener('ufologist:themechange', function (event) {
    syncTheme(event && event.detail && event.detail.theme);
  });

  root.UFOForum = {
    config: CONFIG,
    isEnabled: giscusReady,
    discussionsUrl: DISCUSSIONS_URL,
    openGeneral: openGeneral,
    openExternal: openExternalCommunity,
    openBoard: openBoard,
    openCase: openCaseThread,
    reviewPrivateCase: reviewPrivateCase,
    syncTheme: syncTheme,
    close: closeOverlay,
    _caseTerm: caseTerm,
    _threadUrl: threadUrl,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
