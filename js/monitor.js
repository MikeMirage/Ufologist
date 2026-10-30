/* UFOlogist Observatorio. Live publication metadata and historical cases stay distinct. */
(function () {
  'use strict';
  const M = window.UFOMonitorModel;
  const $ = id => document.getElementById(id);
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = name => `<img src="assets/icons/${name}.svg" class="icon" width="17" height="17" alt="">`;
  const external = (url, label, cls = 'text-link') => M.safeURL(url) ? `<a class="${cls}" href="${esc(M.safeURL(url))}" target="_blank" rel="noopener noreferrer">${esc(label)} ${icon('external-link')}</a>` : '';
  const day = value => M.formatDate(value);
  const kinds = { article: 'Publicación', document: 'Documento', update: 'Actualización', case: 'Caso histórico' };
  const sourceKinds = { institution: 'Institución', media: 'Medio', archive: 'Archivo' };
  const originalCases = typeof CASES !== 'undefined' ? CASES : [];
  const cases = M.normalizeCases(originalCases);
  const caseById = new Map(cases.map(item => [item.id, item]));
  let state = M.readState(location.hash);
  const legacy = new URLSearchParams(location.hash.slice(1));
  if (!legacy.has('view') && [...legacy.keys()].some(key => ['y', 't', 'm', 'l', 's', 'gc'].includes(key))) {
    location.replace('globe.html' + location.hash);
    return;
  }
  if (legacy.get('case') && caseById.has(legacy.get('case'))) {
    state = M.normalizeState({ view: 'atlas', selectedKind: 'case', selectedId: legacy.get('case') });
  }
  let snapshot = { sources: [], items: [], generatedAt: null };
  let loading = true, loadError = '', refreshing = false, canRefreshOrigins = false;
  let map = null, mapReady = false, mapFailed = false, contextMap = null;
  let world = null, toastTimer, mapErrorShown = false, dialogTrigger = null;
  let saved = readSaved();
  let currentDetailKey = '';
  const mapColors = { case: '#24c8e9', selected: '#ffffff', publication: '#d5b9fc' };

  function readSaved() {
    try { const values = JSON.parse(localStorage.getItem('ufologist:monitor:saved') || '[]'); return new Set(Array.isArray(values) ? values.filter(x => typeof x === 'string').slice(0, 500) : []); }
    catch (_) { return new Set(); }
  }
  function toast(message) {
    clearTimeout(toastTimer); $('app-toast').textContent = message; $('app-toast').hidden = false;
    toastTimer = setTimeout(() => { $('app-toast').hidden = true; }, 4200);
  }
  function toggleSaved(kind, id) {
    const key = kind + ':' + id;
    if (saved.has(key)) saved.delete(key); else saved.add(key);
    try { localStorage.setItem('ufologist:monitor:saved', JSON.stringify([...saved])); toast(saved.has(key) ? 'Guardado en este navegador. No activa avisos por email.' : 'Eliminado de tus guardados.'); }
    catch (_) { toast('El navegador no permite guardar. Puedes conservar el enlace.'); }
    document.querySelectorAll('[data-save-kind]').forEach(button => {
      if (button.dataset.saveKind !== kind || button.dataset.saveId !== id) return;
      button.setAttribute('aria-pressed', String(saved.has(key)));
      button.innerHTML = icon('bookmark') + (saved.has(key) ? 'Guardado en este navegador' : 'Guardar en este navegador');
    });
  }
  function source(id) { return snapshot.sources.find(s => s.id === id); }
  function publication(id) { return snapshot.items.find(item => item.id === id); }
  function visibleItems() {
    return M.filterItems(snapshot.items.map(item => ({ ...item, sourceName: source(item.sourceId)?.name || item.sourceId })), {
      query: state.query, period: state.period, category: state.category, sourceIds: state.sources,
    });
  }
  function visibleCases() { return M.filterCases(cases, { query: state.query }); }
  function commit(patch, push = false, detailEntry = false) {
    state = M.normalizeState({ ...state, ...patch });
    history[push ? 'pushState' : 'replaceState']({ ufologist: true, monitorDetail: detailEntry }, '', M.writeState(state));
    render();
  }
  function openDetail(kind, id, trigger) {
    const element = trigger || document.activeElement;
    dialogTrigger = { element, selector: `[data-open-${kind}="${CSS.escape(id)}"]` };
    commit({ selectedKind: kind, selectedId: id }, !$('detail-dialog').open, true);
  }
  function closeDetail() {
    if (history.state?.monitorDetail) history.back();
    else commit({ selectedKind: null, selectedId: null });
  }
  function navigate(view) {
    commit({ view, selectedId: null, selectedKind: null }, true);
    if (view === 'atlas') { document.body.dataset.mobileView = 'map'; syncMobile(); }
    setTimeout(() => map?.resize(), 60);
  }

  async function loadSnapshot(manual = false) {
    if (refreshing) return;
    refreshing = true;
    $('feed-retry').disabled = true;
    if (manual) { $('feed-retry').textContent = 'Consultando…'; toast('Comprobando las fuentes…'); }
    try {
      // The optional same-origin endpoint exists in the local development server.
      // Static hosting reads the last published snapshot without a fake refresh timestamp.
      if (manual && canRefreshOrigins) {
        const response = await fetch('api/monitor/refresh', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(110000) });
        if (!response.ok) throw new Error(response.status === 409 ? 'Ya se está actualizando. Vuelve a cargar dentro de un momento.' : 'No se han podido consultar las fuentes. Se conserva la última copia.');
      }
      const response = await fetch('data/monitor-feed.json?t=' + Date.now(), { cache: 'no-store', signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error('No se ha podido cargar la copia de las fuentes.');
      canRefreshOrigins = response.headers.get('X-UFOlogist-Refresh') === 'available';
      const data = await response.json();
      if (data.schemaVersion !== 1 || !Array.isArray(data.items) || !Array.isArray(data.sources)) throw new Error('La respuesta de las fuentes no tiene un formato válido.');
      snapshot = {
        ...data,
        sources: data.sources.filter(s => s && s.id && M.safeURL(s.url)),
        items: data.items.filter(item => item && item.id && M.safeURL(item.url)).map(item => ({ ...item, location: validLocation(item.location) ? item.location : null })),
      };
      loadError = '';
      if (manual) {
        const failed = snapshot.sources.filter(s => s.status === 'error').length;
        toast(failed ? `Consulta completada con ${failed} fuente${failed === 1 ? '' : 's'} no disponible${failed === 1 ? '' : 's'}. Se conserva su copia anterior.` : canRefreshOrigins ? 'Fuentes comprobadas. Las fechas de publicación se conservan.' : 'Copia publicada cargada. Consulta las fechas de cada fuente.');
      }
    } catch (error) {
      loadError = error.name === 'TimeoutError' ? 'La consulta ha tardado demasiado. Se conserva la última copia.' : error.message;
      if (manual) toast(loadError);
    } finally {
      loading = false; refreshing = false;
      $('feed-retry').disabled = false;
      $('feed-retry').textContent = canRefreshOrigins ? 'Actualizar fuentes' : 'Recargar publicaciones';
      render();
    }
  }
  function validLocation(loc) {
    return loc && Number.isFinite(loc.lat) && Number.isFinite(loc.lng) && Math.abs(loc.lat) <= 90 && Math.abs(loc.lng) <= 180;
  }

  function render() {
    document.body.dataset.view = state.view;
    document.querySelectorAll('#primary-nav [data-view]').forEach(button => {
      button.classList.toggle('is-active', button.dataset.view === state.view);
      if (button.dataset.view === state.view) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
    });
    if ($('app-search').value !== state.query) $('app-search').value = state.query;
    $('category-filter').value = state.category;
    document.querySelectorAll('[data-period]').forEach(button => {
      const active = button.dataset.period === state.period;
      button.classList.toggle('is-active', active); button.setAttribute('aria-pressed', String(active));
    });
    $('period-control').hidden = state.view !== 'monitor';
    $('filter-toggle').hidden = state.view !== 'monitor';
    if (state.view !== 'monitor') { $('filter-panel').hidden = true; $('filter-toggle').setAttribute('aria-expanded', 'false'); }
    $('workspace').hidden = !['monitor', 'atlas'].includes(state.view);
    $('catalog-view').hidden = ['monitor', 'atlas'].includes(state.view);
    $('globe-link').href = 'globe.html' + (state.selectedKind === 'case' ? '#case=' + encodeURIComponent(state.selectedId) : '');
    renderSources();
    if (state.view === 'monitor' || state.view === 'atlas') renderFeed(); else renderCatalog();
    updateMap();
    renderDetail();
    syncMobile();
  }

  function renderSources() {
    $('last-updated').textContent = snapshot.generatedAt ? 'Consultado ' + M.relativeTime(snapshot.lastSuccessfulAt || snapshot.generatedAt).toLowerCase() : (loading ? 'Cargando publicaciones…' : 'Sin consulta disponible');
    $('last-updated').title = snapshot.lastSuccessfulAt ? 'Última consulta correcta: ' + M.formatDate(snapshot.lastSuccessfulAt, { includeTime: true }) + ' UTC' : '';
    const connected = snapshot.sources.filter(s => s.feedUrl);
    const filterKey = connected.map(s => s.id).join(',') + ':' + JSON.stringify(state.sources);
    if ($('source-filters').dataset.renderKey !== filterKey) {
      $('source-filters').innerHTML = connected.map(s => `<label><input type="checkbox" value="${esc(s.id)}"${state.sources === null || state.sources.includes(s.id) ? ' checked' : ''}> <span>${esc(s.name)}</span></label>`).join('');
      $('source-filters').dataset.renderKey = filterKey;
    }
    $('source-health').innerHTML = snapshot.sources.map(s => {
      const health = M.sourceHealth(s);
      return `<button class="source-health-item is-${health.status}" data-open-source="${esc(s.id)}" title="${esc(health.label)}${s.lastPublishedAt ? ' · Última publicación: ' + esc(day(s.lastPublishedAt)) : ''}"><span class="health-dot" aria-hidden="true"></span><span><span class="source-health-name">${esc(s.name)} <span class="health-label">${esc(health.label)}</span></span><span class="source-health-time">${s.status === 'manual' ? 'Fuente enlazada' : 'Consulta: ' + esc(M.relativeTime(s.lastSuccessAt))}</span></span></button>`;
    }).join('') || '<span class="source-health-loading">No hay una consulta de fuentes disponible.</span>';
  }

  function renderFeed() {
    const atlas = state.view === 'atlas';
    const items = atlas ? visibleCases() : visibleItems();
    $('feed-title').textContent = atlas ? 'Casos del archivo' : 'Actualizaciones de fuentes';
    $('feed-subtitle').textContent = atlas ? 'Expedientes históricos del catálogo. La posición puede ser aproximada.' : 'Publicaciones reales, documentos y contexto del cielo. Siempre con enlace al original.';
    $('feed-count').textContent = items.length + (atlas ? (items.length === 1 ? ' caso' : ' casos') : (items.length === 1 ? ' publicación' : ' publicaciones'));
    document.querySelector('.feed-order').innerHTML = atlas ? '<span>Fecha del suceso</span><span>Catálogo editorial</span>' : '<span>Fecha de publicación</span><span>Más recientes primero</span>';
    $('view-description').textContent = atlas ? 'Atlas histórico · Casos del catálogo editorial' : 'Mapa: casos históricos · Lista: publicaciones recientes';
    $('feed-state').textContent = loadError || (loading && !atlas ? 'Cargando las publicaciones de las fuentes…' : '');
    $('feed-state').hidden = !loadError && (!loading || atlas);
    $('feed-retry').hidden = atlas || loading;
    if (!items.length && !(loading && !atlas)) {
      const matches = !atlas && state.query.trim() ? visibleCases().length : 0;
      $('feed-list').innerHTML = `<div class="empty-state">${icon(atlas ? 'map' : 'file-text')}<h2>${atlas ? 'No hay casos para esta búsqueda' : 'Sin publicaciones en esta selección'}</h2><p>${atlas ? 'Prueba con otro nombre o lugar.' : 'No hay publicaciones de estas fuentes en el periodo seleccionado. Amplía el periodo o cambia los filtros.'}</p>${matches ? `<p><a href="#view=atlas" data-view="atlas" class="text-link">Ver ${matches} caso${matches === 1 ? '' : 's'} del archivo que coincide${matches === 1 ? '' : 'n'}</a></p>` : ''}${!atlas ? '<button class="secondary-button" data-reset-filters>Ver todas las publicaciones</button>' : '<button class="secondary-button" data-clear-search>Limpiar búsqueda</button>'}</div>`;
    } else {
      $('feed-list').innerHTML = items.map(item => atlas ? caseRow(item) : feedRow(item)).join('');
    }
    $('map-list-fallback').innerHTML = visibleCases().slice(0, 30).map(c => `<button class="related-item" data-open-case="${esc(c.id)}">${esc(c.title)}<small>${esc(c.location?.label || c.country)} · ${esc(day(c.observedAt))}</small></button>`).join('');
  }
  function feedRow(item) {
    const s = source(item.sourceId);
    const selected = state.selectedId === item.id && state.selectedKind === 'item';
    return `<article class="feed-item${selected ? ' is-selected' : ''}" data-item-id="${esc(item.id)}"><button class="feed-item-button" data-open-item="${esc(item.id)}"><span class="feed-item-meta"><span class="feed-source">${esc(s?.name || item.sourceId)}</span><time class="feed-date" datetime="${esc(item.publishedAt || '')}">${esc(day(item.publishedAt))}</time><span class="type-badge type-badge--${esc(item.kind || 'article')}">${esc(kinds[item.kind] || 'Publicación')}</span></span><h2 class="feed-item-title">${esc(item.title)}</h2><p class="feed-item-summary">${esc(item.summary || 'Consulta la publicación original para conocer todos los detalles.')}</p></button><div class="feed-item-footer"><span class="editorial-status">${item.category === 'sky-context' ? 'Contexto del cielo' : 'UAP'} · Sin revisión editorial</span>${external(item.url, 'Abrir fuente')}</div></article>`;
  }
  function caseRow(c) {
    return `<article class="feed-item${state.selectedId === c.id ? ' is-selected' : ''}"><button class="feed-item-button" data-open-case="${esc(c.id)}"><span class="feed-item-meta"><span class="feed-source">${esc(c.country || 'Archivo')}</span><time class="feed-date">${esc(day(c.observedAt))}</time><span class="type-badge">Caso histórico</span></span><h2 class="feed-item-title">${esc(c.title)}</h2><p class="feed-item-summary">${esc(c.summary)}</p><span class="feed-item-location">${esc(c.location?.label || 'Sin localización')}</span></button><div class="feed-item-footer"><span class="editorial-status">${c.sources.length} fuentes enlazadas · Ubicación aproximada</span><button class="text-link" data-open-case="${esc(c.id)}">Ver expediente</button></div></article>`;
  }
  function renderCatalog() {
    if (state.view === 'cases') {
      $('catalog-title').textContent = 'Casos para entender el fenómeno';
      $('catalog-intro').textContent = 'Expedientes históricos con referencias, fecha del suceso y contexto geográfico. El origen de una fuente no determina una explicación.';
      const filtered = visibleCases();
      const preferred = ['nimitz-2004', 'roswell-1947', 'phoenix-1997', 'rendlesham-1980', 'gimbal-2015'];
      const ordered = [...filtered].sort((a, b) => {
        const x = preferred.indexOf(a.id), y = preferred.indexOf(b.id);
        return (x < 0 ? 100 : x) - (y < 0 ? 100 : y);
      });
      $('catalog-list').innerHTML = ordered.map(c => `<article class="catalog-card"><div class="catalog-card-meta"><span>${esc(c.country || 'Archivo')}</span><span>${esc(day(c.observedAt))}</span></div><h2 class="catalog-card-title">${esc(c.title)}</h2><p class="catalog-card-summary">${esc(c.summary)}</p><div class="catalog-card-footer"><span>${c.sources.length} fuentes</span><button class="text-link" data-open-case="${esc(c.id)}">Ver expediente ${icon('file-text')}</button></div></article>`).join('') || '<p class="empty-state">No hay casos para esta búsqueda.</p>';
    } else {
      $('catalog-title').textContent = 'Fuentes y procedencia';
      $('catalog-intro').textContent = 'Quién publica, cuándo se consultó y qué cubre cada fuente. Una conexión activa no implica que haya nuevas publicaciones.';
      $('catalog-list').innerHTML = snapshot.sources.filter(s => M.matchesQuery({ title: s.name, summary: s.description }, state.query)).map(s => {
        const health = M.sourceHealth(s);
        return `<article class="catalog-card source-card"><div class="catalog-card-meta"><span>${esc(sourceKinds[s.kind] || 'Fuente')}</span><span class="source-status is-${health.status}">${esc(health.label)}</span></div><h2 class="catalog-card-title">${esc(s.name)}</h2><p class="catalog-card-summary">${esc(s.description)}</p><dl class="source-dates"><dt>Última consulta correcta</dt><dd>${s.lastSuccessAt ? esc(M.formatDate(s.lastSuccessAt, { includeTime: true })) + ' UTC' : 'Sin consulta automática'}</dd><dt>Última publicación en origen</dt><dd>${s.lastPublishedAt ? esc(day(s.lastPublishedAt)) : 'No disponible'}</dd></dl><div class="catalog-card-footer"><button class="text-link" data-open-source="${esc(s.id)}">Ver fuente</button>${external(s.url, 'Original')}</div></article>`;
      }).join('') || `<p class="empty-state">${loading ? 'Cargando fuentes…' : 'No hay fuentes para esta búsqueda.'}</p>`;
    }
  }

  function renderDetail(force = false) {
    const dialog = $('detail-dialog');
    const kind = state.selectedKind, id = state.selectedId;
    let item = kind === 'case' ? caseById.get(id) : kind === 'source' ? source(id) : publication(id);
    if (!id || !item) {
      if (dialog.open) {
        dialog.close(); destroyContext();
        selectOnMap(null);
        const replacement = dialogTrigger && [...document.querySelectorAll(dialogTrigger.selector)].find(node => node.getClientRects().length);
        (dialogTrigger?.element?.isConnected ? dialogTrigger.element : replacement || $('app-search')).focus();
      }
      currentDetailKey = '';
      if (id && !loading && !item) toast('Ese registro no está disponible en esta copia. Puedes buscarlo en el catálogo.');
      return;
    }
    const key = kind + ':' + id + (kind === 'case' ? '' : ':' + snapshot.generatedAt);
    if (key === currentDetailKey && !force) return;
    destroyContext(); currentDetailKey = key;
    $('detail-title').textContent = kind === 'source' ? item.name : item.title;
    $('detail-breadcrumb').textContent = kind === 'case' ? 'Atlas / Expediente del caso' : kind === 'source' ? 'Fuentes / Procedencia' : 'Monitor / Publicación';
    const originalURL = kind === 'case' ? (item.sources.find(s => s.kind === 'primary') || item.sources[0])?.url : item.url;
    $('detail-source-link').hidden = !M.safeURL(originalURL);
    if (M.safeURL(originalURL)) $('detail-source-link').href = M.safeURL(originalURL); else $('detail-source-link').removeAttribute('href');
    if (kind === 'case') renderCaseDetail(item); else if (kind === 'source') renderSourceDetail(item); else renderPublicationDetail(item);
    if (!dialog.open) dialog.showModal();
    requestAnimationFrame(() => {
      if (validLocation(item.location)) initContextMap(item.location);
    });
    selectOnMap(item);
  }
  function saveButton(kind, id) {
    return `<button class="secondary-button" data-save-kind="${kind}" data-save-id="${esc(id)}" aria-pressed="${saved.has(kind + ':' + id)}">${icon('bookmark')}${saved.has(kind + ':' + id) ? 'Guardado en este navegador' : 'Guardar en este navegador'}</button><button class="text-link" data-copy-link>Copiar enlace</button>`;
  }
  function facts(entries) { return `<dl class="detail-facts">${entries.map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>`; }
  function linkedSources(sources) {
    return `<ul class="source-list">${sources.map(s => `<li>${external(s.url, s.name)}<span>${s.kind === 'primary' ? 'Institución / documento de origen' : 'Referencia / cobertura'} · ${esc(new URL(s.url).hostname.replace(/^www\./, ''))}</span></li>`).join('')}</ul>`;
  }
  function renderCaseDetail(c) {
    $('detail-meta').innerHTML = `<span class="type-badge">Caso histórico</span><span>Suceso: ${esc(day(c.observedAt))}</span><span>${esc(c.country)}</span>`;
    const media = c.media.find(m => m.k === 'video' && m.commons);
    const flir = media?.commons === 'FLIR1 Official UAP Footage from the USG for Public Release.webm';
    const videoURL = flir ? 'https://upload.wikimedia.org/wikipedia/commons/7/70/FLIR1_Official_UAP_Footage_from_the_USG_for_Public_Release.webm' : media ? 'https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(media.commons) : '';
    const mediaHTML = media ? `<figure class="case-video"><div class="case-video-preview">${flir ? '<img src="assets/media/flir1-official.jpg" alt="Fotograma original de FLIR1, US Navy / Department of Defense" width="330" height="247">' : ''}<button class="primary-button" data-play-video="${esc(videoURL)}">${flir ? 'Reproducir vídeo original' : 'Cargar vídeo original'}</button></div><figcaption>${esc(media.cap || 'Material audiovisual enlazado')}. ${external('https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(media.commons), 'Ver archivo y atribución')}</figcaption></figure>` : '';
    $('detail-body').innerHTML = `<p class="detail-kicker">Expediente del archivo</p>${mediaHTML}<section class="detail-section"><h3>Lo que recoge el registro</h3><p>${esc(c.summary)}</p></section><section class="detail-section"><h3>Documentación y referencias</h3>${linkedSources(c.sources)}</section><section class="detail-section"><h3>Qué sigue sin resolverse</h3><p>Este resumen reúne el relato y las referencias del catálogo. La publicación de un documento, un vídeo o un testimonio no determina por sí sola la naturaleza de lo observado. Contrasta las afirmaciones y las explicaciones con sus fuentes.</p></section><div class="detail-actions">${saveButton('case', c.id)}<a class="text-link" href="globe.html#case=${encodeURIComponent(c.id)}">Explorar en 3D ${icon('globe')}</a></div>`;
    const related = snapshot.items.filter(item => item.caseIds?.includes(c.id));
    $('detail-publications').innerHTML = '<h3>En este expediente</h3>' + (related.length ? related.map(item => relatedButton('item', item.id, item.title, day(item.publishedAt))).join('') : '<p class="detail-note">Todavía no hay publicaciones del monitor vinculadas editorialmente a este caso.</p>') + '<h3>Explorar otros casos</h3>' + cases.filter(x => x.id !== c.id && x.country === c.country).slice(0, 4).map(x => relatedButton('case', x.id, x.title, day(x.observedAt))).join('');
    $('detail-context').innerHTML = `<h3>Contexto geográfico</h3>${c.location ? '<div id="detail-map" class="context-map" aria-label="Ubicación aproximada del caso"></div>' : '<p class="detail-note">No hay una ubicación documentada.</p>'}${facts([['Lugar', c.location?.label || 'No documentado'], ['Precisión', 'Ubicación aproximada del catálogo'], ['Suceso', day(c.observedAt)], ['Publicación del expediente', 'Sin fecha de publicación atribuida']])}<p class="detail-note">La región representada orienta la lectura; no define el alcance del fenómeno ni una posición exacta.</p>`;
  }
  function relatedButton(kind, id, title, subtitle) {
    return `<button class="related-item" data-open-${kind}="${esc(id)}">${esc(title)}<small>${esc(subtitle || '')}</small></button>`;
  }
  function renderPublicationDetail(item) {
    const s = source(item.sourceId);
    $('detail-meta').innerHTML = `<span class="type-badge">${esc(kinds[item.kind] || 'Publicación')}</span><span>${esc(s?.name || item.sourceId)}</span><span>Publicado: ${esc(day(item.publishedAt))}</span>`;
    $('detail-body').innerHTML = `<p class="detail-kicker">${item.category === 'sky-context' ? 'Contexto del cielo' : 'Publicación sobre UAP'}</p><section class="detail-section"><h3>Qué ha publicado la fuente</h3><p class="publication-lede">${esc(item.summary || 'Abre la publicación original para leer el contenido completo.')}</p><p class="detail-note">${item.summary ? 'Extracto del feed original. Se conserva su idioma y se enlaza la publicación completa.' : 'Se conservan el título, el enlace y la fecha facilitados por la fuente.'}</p></section><section class="detail-section"><h3>Qué aporta al observatorio</h3><p>${item.category === 'sky-context' ? 'Esta publicación ofrece contexto científico o aeroespacial. No se presenta como un reporte de un fenómeno no identificado.' : 'Esta publicación ha entrado por el canal de la fuente y el filtro temático. Su relación con otros expedientes y sus afirmaciones todavía requieren revisión editorial.'}</p></section><section class="detail-section"><h3>Estado de revisión</h3><p>Recibido automáticamente · Sin revisión editorial. La procedencia se conserva; la detección de una publicación no confirma su contenido.</p></section><div class="detail-actions">${saveButton('item', item.id)}</div>`;
    $('detail-publications').innerHTML = '<h3>Más de esta fuente</h3>' + snapshot.items.filter(p => p.sourceId === item.sourceId && p.id !== item.id).slice(0, 7).map(p => relatedButton('item', p.id, p.title, day(p.publishedAt))).join('');
    const related = (item.caseIds || []).map(id => caseById.get(id)).filter(Boolean);
    $('detail-context').innerHTML = `<h3>Procedencia</h3>${facts([['Fuente', s?.name || item.sourceId], ['Tipo', sourceKinds[s?.kind] || 'Publicación'], ['Fecha de publicación', day(item.publishedAt)], ['Detectado', M.formatDate(item.ingestedAt, { includeTime: true }) + ' UTC'], ['Fecha del suceso', item.observedAt ? day(item.observedAt) : 'No atribuida por este registro']])}<button class="secondary-button" data-open-source="${esc(item.sourceId)}">Ver ficha de la fuente</button><h3>Contexto geográfico</h3>${item.location ? '<div id="detail-map" class="context-map"></div>' : '<p class="detail-note">Sin ubicación del suceso atribuida. La publicación no se coloca en la sede de la institución o del medio.</p>'}${related.length ? '<h3>Casos relacionados</h3>' + related.map(c => relatedButton('case', c.id, c.title, day(c.observedAt))).join('') : '<p class="detail-note">Sin expediente relacionado todavía.</p>'}`;
  }
  function renderSourceDetail(s) {
    const health = M.sourceHealth(s);
    $('detail-meta').innerHTML = `<span class="type-badge">${esc(sourceKinds[s.kind] || 'Fuente')}</span><span class="source-status is-${health.status}">${esc(health.label)}</span>`;
    const items = M.filterItems(snapshot.items, { sourceIds: [s.id], period: 'all' });
    $('detail-body').innerHTML = `<p class="detail-kicker">Fuente y cobertura</p><section class="detail-section"><h3>Qué publica</h3><p>${esc(s.description)}</p></section><section class="detail-section"><h3>Últimas publicaciones recibidas</h3>${items.length ? items.slice(0, 12).map(item => relatedButton('item', item.id, item.title, day(item.publishedAt))).join('') : '<p>No hay publicaciones recibidas automáticamente. Puedes consultar la fuente original.</p>'}</section><section class="detail-section"><h3>Cómo interpretar esta fuente</h3><p>${s.kind === 'media' ? 'Es cobertura periodística. Un artículo puede informar sobre testimonios o documentos sin constituir una corroboración independiente de todas sus afirmaciones.' : 'Su carácter institucional o documental identifica el origen. No implica que todos los sucesos descritos estén explicados ni que su interpretación esté confirmada.'}</p></section><div class="detail-actions">${saveButton('source', s.id)}</div>`;
    $('detail-publications').innerHTML = '<h3>Directorio de fuentes</h3>' + snapshot.sources.filter(x => x.id !== s.id).map(x => relatedButton('source', x.id, x.name, sourceKinds[x.kind])).join('');
    $('detail-context').innerHTML = `<h3>Estado del canal</h3>${facts([['Conectividad', health.label], ['Último intento', s.checkedAt ? M.formatDate(s.checkedAt, { includeTime: true }) + ' UTC' : 'Sin consulta automática'], ['Último éxito', s.lastSuccessAt ? M.formatDate(s.lastSuccessAt, { includeTime: true }) + ' UTC' : 'No disponible'], ['Última publicación en origen', s.lastPublishedAt ? day(s.lastPublishedAt) : 'No disponible'], ['Publicaciones retenidas', String(items.length)]])}${s.feedUrl ? external(s.feedUrl, 'Consultar RSS') : '<p class="detail-note">Fuente enlazada. No hay un conector automático activo.</p>'}${s.status === 'error' ? '<p class="detail-note">La última consulta falló. Se mantiene el contenido recibido anteriormente.</p>' : ''}<p class="detail-note">La fecha de consulta y la fecha de publicación son distintas. Un canal antiguo puede funcionar correctamente sin novedades.</p>`;
  }

  function baseStyle() {
    const labels = world.features.filter(f => Number.isFinite(f.properties.LABEL_X) && Number.isFinite(f.properties.LABEL_Y) && f.properties.ADMIN !== 'Antarctica').map(f => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [f.properties.LABEL_X, f.properties.LABEL_Y] }, properties: { name: f.properties.NAME_ES || f.properties.NAME, rank: f.properties.LABELRANK || 5 } }));
    return {
      version: 8,
      glyphs: new URL('assets/map/fonts/{fontstack}/{range}.pbf', document.baseURI).href.replace(/%7B/g, '{').replace(/%7D/g, '}'),
      sources: {
        countries: { type: 'geojson', data: world, attribution: '<a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noopener">Natural Earth</a>' },
        labels: { type: 'geojson', data: { type: 'FeatureCollection', features: labels } },
      },
      layers: [
        { id: 'ocean', type: 'background', paint: { 'background-color': '#07141f' } },
        { id: 'land', type: 'fill', source: 'countries', paint: { 'fill-color': '#152c3d' } },
        { id: 'borders', type: 'line', source: 'countries', paint: { 'line-color': '#2a4354', 'line-width': 0.65 } },
        { id: 'country-labels', type: 'symbol', source: 'labels', layout: { 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Regular'], 'text-size': ['interpolate', ['linear'], ['zoom'], 1, 10, 4, 14], 'text-max-width': 7, 'text-padding': 16, 'symbol-sort-key': ['get', 'rank'] }, paint: { 'text-color': '#7993a7', 'text-halo-color': '#152c3d', 'text-halo-width': 1 } },
      ],
    };
  }
  async function initMap() {
    if (!window.maplibregl) return failMap();
    try {
      const response = await fetch('assets/map/countries.geojson');
      if (!response.ok) throw new Error('Geografía no disponible');
      world = await response.json();
      map = new maplibregl.Map({ container: 'monitor-map', style: baseStyle(), center: [0, 18], zoom: 0.65, minZoom: -0.7, maxZoom: 7, attributionControl: false, renderWorldCopies: false });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
      map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
      map.on('load', () => {
        mapReady = true;
        map.addSource('cases', { type: 'geojson', data: caseGeoJSON(), cluster: true, clusterMaxZoom: 5, clusterRadius: 43 });
        map.addLayer({ id: 'case-clusters', type: 'circle', source: 'cases', filter: ['has', 'point_count'], paint: { 'circle-color': '#073b4c', 'circle-stroke-color': '#27c8e4', 'circle-stroke-width': 1.5, 'circle-radius': ['step', ['get', 'point_count'], 17, 10, 22, 25, 27], 'circle-opacity': 0.96 } });
        map.addLayer({ id: 'cluster-count', type: 'symbol', source: 'cases', filter: ['has', 'point_count'], layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-font': ['Noto Sans Regular'], 'text-size': 12 }, paint: { 'text-color': '#d9faff' } });
        map.addLayer({ id: 'case-points', type: 'circle', source: 'cases', filter: ['!', ['has', 'point_count']], paint: { 'circle-color': mapColors.case, 'circle-radius': 4.5, 'circle-stroke-color': '#091b28', 'circle-stroke-width': 2 } });
        map.addSource('selection', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({ id: 'selection-point', type: 'circle', source: 'selection', paint: { 'circle-color': '#fff', 'circle-radius': 7, 'circle-stroke-color': '#18d7ff', 'circle-stroke-width': 3 } });
        map.on('click', 'case-clusters', async event => {
          const feature = event.features?.[0];
          if (!feature) return;
          try { const zoom = await map.getSource('cases').getClusterExpansionZoom(feature.properties.cluster_id); map.easeTo({ center: feature.geometry.coordinates, zoom: Math.min(zoom + 0.2, 7), duration: reducedMotion() ? 0 : 500 }); }
          catch (_) { toast('Acerca el mapa para explorar los casos de la zona.'); }
        });
        map.on('click', 'case-points', event => { const id = event.features?.[0]?.properties.id; if (id) openDetail('case', id); });
        ['case-clusters', 'case-points'].forEach(layer => {
          map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer'; });
          map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = ''; });
        });
        resetWorld(0);
        updateMap();
        const selected = state.selectedKind === 'case' ? caseById.get(state.selectedId) : publication(state.selectedId);
        if ($('detail-dialog').open && validLocation(selected?.location) && !contextMap) initContextMap(selected.location);
      });
      map.on('error', event => {
        if (!mapErrorShown && event.error?.message?.includes('WebGL')) { mapErrorShown = true; failMap(); }
      });
      map.getCanvas().setAttribute('aria-label', 'Mapa histórico. Los mismos casos se pueden consultar en Atlas y Casos.');
    } catch (error) { console.warn('UFOlogist map initialization:', error.stack || error.message); failMap(); }
  }
  function reducedMotion() { return matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function resetWorld(duration = 450) {
    if (!mapReady) return;
    const width = $('monitor-map').clientWidth;
    const zoom = Math.max(-0.7, Math.min(1.2, Math.log2(Math.max(300, width - 48) / 512)));
    map.easeTo({ center: [0, 18], zoom, duration: reducedMotion() ? 0 : duration });
  }
  function caseGeoJSON() {
    return { type: 'FeatureCollection', features: visibleCases().filter(c => validLocation(c.location)).map(c => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [c.location.lng, c.location.lat] }, properties: { id: c.id, title: c.title, observedAt: c.observedAt } })) };
  }
  function updateMap() {
    const count = visibleCases().filter(c => validLocation(c.location)).length;
    $('map-message').textContent = mapFailed ? 'Mapa no disponible · Consulta los casos en la lista' : mapReady ? count + (count === 1 ? ' caso' : ' casos') + ' del archivo · Coordenadas aproximadas' : 'Preparando el atlas…';
    if (!mapReady) return;
    map.getSource('cases')?.setData(caseGeoJSON());
    if (!['monitor', 'atlas'].includes(state.view)) return;
    requestAnimationFrame(() => map?.resize());
  }
  function failMap() {
    mapFailed = true; mapReady = false;
    $('map-fallback').hidden = false;
    $('monitor-map').hidden = true;
    $('map-message').textContent = 'Mapa no disponible · La lista y las fuentes siguen funcionando';
    renderFeed();
  }
  function selectOnMap(item) {
    if (!mapReady || !map.getSource('selection')) return;
    const loc = item?.location;
    map.getSource('selection').setData({ type: 'FeatureCollection', features: validLocation(loc) ? [{ type: 'Feature', geometry: { type: 'Point', coordinates: [loc.lng, loc.lat] }, properties: {} }] : [] });
    if (validLocation(loc)) map.easeTo({ center: [loc.lng, loc.lat], zoom: Math.max(3, map.getZoom()), duration: reducedMotion() ? 0 : 500 });
  }
  function destroyContext() { if (contextMap) { contextMap.remove(); contextMap = null; } }
  function initContextMap(loc) {
    if (!world || !$('detail-map') || !window.maplibregl || contextMap) return;
    try {
      contextMap = new maplibregl.Map({ container: 'detail-map', style: baseStyle(), center: [loc.lng, loc.lat], zoom: 3, minZoom: 1, maxZoom: 6, interactive: false, attributionControl: false, renderWorldCopies: false });
      contextMap.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
      contextMap.on('load', () => {
        if (!contextMap) return;
        contextMap.addSource('location', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'Point', coordinates: [loc.lng, loc.lat] }, properties: {} } });
        contextMap.addLayer({ id: 'approximate-location', type: 'circle', source: 'location', paint: { 'circle-radius': 26, 'circle-color': '#18d7ff', 'circle-opacity': 0.08, 'circle-stroke-color': '#7cdfef', 'circle-stroke-width': 1.5, 'circle-stroke-opacity': 0.8 } });
        contextMap.addLayer({ id: 'location-center', type: 'circle', source: 'location', paint: { 'circle-radius': 3, 'circle-color': '#c8f7ff' } });
      });
    } catch (_) { $('detail-map').innerHTML = '<p class="detail-note">Ubicación aproximada: ' + esc(loc.label || '') + '</p>'; }
  }
  function syncMobile() {
    const mode = document.body.dataset.mobileView || 'list';
    document.querySelectorAll('[data-mobile-view]').forEach(button => { if (button.tagName === 'BUTTON') { button.classList.toggle('is-active', button.dataset.mobileView === mode); button.setAttribute('aria-pressed', String(button.dataset.mobileView === mode)); } });
  }

  document.addEventListener('click', event => {
    const action = event.target.closest('[data-open-item],[data-open-case],[data-open-source],[data-save-kind],[data-copy-link],[data-play-video],[data-reset-filters],[data-clear-search],a[data-view]');
    if (!action) return;
    if (action.dataset.openItem) openDetail('item', action.dataset.openItem, action);
    else if (action.dataset.openCase) openDetail('case', action.dataset.openCase, action);
    else if (action.dataset.openSource) openDetail('source', action.dataset.openSource, action);
    else if (action.dataset.saveKind) toggleSaved(action.dataset.saveKind, action.dataset.saveId);
    else if (action.dataset.playVideo && M.safeURL(action.dataset.playVideo)) {
      const preview = action.closest('.case-video-preview');
      const video = document.createElement('video');
      video.controls = true; video.playsInline = true; video.preload = 'metadata';
      video.setAttribute('aria-label', 'Vídeo original del expediente');
      if (preview.querySelector('img')) video.poster = preview.querySelector('img').src;
      video.src = M.safeURL(action.dataset.playVideo);
      const failure = () => toast('No se puede reproducir aquí. Abre el archivo original desde su enlace.');
      video.addEventListener('error', failure, { once: true });
      preview.replaceWith(video);
      video.play().catch(failure);
      video.focus();
    } else if (action.hasAttribute('data-copy-link')) {
      navigator.clipboard?.writeText(location.href).then(() => toast('Enlace copiado.')).catch(() => toast('No se pudo copiar. Puedes usar la dirección del navegador.'));
    } else if (action.hasAttribute('data-reset-filters')) commit({ period: 'all', sources: null, category: 'all', query: '' });
    else if (action.hasAttribute('data-clear-search')) commit({ query: '' });
    else if (action.dataset.view) { event.preventDefault(); navigate(action.dataset.view); }
  });
  $('primary-nav').addEventListener('click', event => { const button = event.target.closest('button[data-view]'); if (button) navigate(button.dataset.view); });
  $('period-control').addEventListener('click', event => { const button = event.target.closest('[data-period]'); if (button) commit({ period: button.dataset.period }); });
  $('app-search').addEventListener('input', event => commit({ query: event.target.value }));
  $('category-filter').addEventListener('change', event => commit({ category: event.target.value }));
  $('source-filters').addEventListener('change', () => { const checked = [...$('source-filters').querySelectorAll('input:checked')].map(x => x.value); commit({ sources: checked.length === snapshot.sources.filter(s => s.feedUrl).length ? null : checked }); });
  $('filter-toggle').addEventListener('click', () => { const open = $('filter-panel').hidden; $('filter-panel').hidden = !open; $('filter-toggle').setAttribute('aria-expanded', String(open)); if (open) $('category-filter').focus(); });
  $('mobile-views').addEventListener('click', event => { const button = event.target.closest('button'); if (button) { document.body.dataset.mobileView = button.dataset.mobileView; syncMobile(); setTimeout(() => map?.resize(), 40); } });
  $('feed-retry').addEventListener('click', () => loadSnapshot(true));
  $('map-reset')?.addEventListener('click', () => resetWorld());
  $('detail-close').addEventListener('click', closeDetail);
  $('detail-dialog').addEventListener('cancel', event => { event.preventDefault(); closeDetail(); });
  $('detail-dialog').addEventListener('click', event => { if (event.target === $('detail-dialog')) { const rect = event.target.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDetail(); } });
  document.addEventListener('keydown', event => {
    if (event.key === '/' && !event.ctrlKey && !event.metaKey && !/input|textarea|select/i.test(document.activeElement.tagName) && !$('detail-dialog').open) { event.preventDefault(); $('app-search').focus(); }
    if (event.key === 'Escape' && !$('filter-panel').hidden && !$('detail-dialog').open) { $('filter-panel').hidden = true; $('filter-toggle').setAttribute('aria-expanded', 'false'); $('filter-toggle').focus(); }
  });
  function restoreState() {
    const next = M.readState(location.hash);
    // Back/forward may emit both events. Rendering twice replaces the element
    // that just regained focus when a detail closes.
    if (JSON.stringify(next) === JSON.stringify(state)) return;
    state = next; render();
  }
  window.addEventListener('popstate', restoreState);
  window.addEventListener('hashchange', restoreState);
  window.addEventListener('resize', () => map?.resize());
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !refreshing) loadSnapshot(); });
  setInterval(() => { if (!document.hidden) loadSnapshot(); }, 60000);
  render();
  initMap();
  loadSnapshot();
}());
