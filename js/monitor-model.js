/* UFOlogist Monitor: shared, side-effect-free content and state helpers.
 * Browser: window.UFOMonitorModel. Node: require('./monitor-model.js').
 * This layer does not infer geolocation, publication dates or credibility.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.UFOMonitorModel = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const DAY = 86400000;
  const DEFAULT_STATE = Object.freeze({
    view: 'monitor', spatial: 'globe', period: '30', query: '', category: 'all',
    sources: null, selectedId: null, selectedKind: null,
  });
  const VIEWS = new Set(['monitor', 'atlas', 'cases', 'sources']);
  const SPATIAL_MODES = new Set(['globe', 'map']);
  const CATEGORIES = new Set(['all', 'uap', 'sky-context']);
  const SELECTED_KINDS = new Set(['case', 'source', 'item', 'publication', 'document', 'article', 'update']);

  function safeURL(value) {
    if (typeof value !== 'string' || !value.trim() || /[\u0000-\u001f\u007f]/.test(value)) return null;
    try {
      const url = new URL(value.trim());
      if (!['https:', 'http:'].includes(url.protocol) || !url.hostname || url.username || url.password) return null;
      return url.href;
    } catch (_) { return null; }
  }

  function canonicalURL(value) {
    const safe = safeURL(value);
    if (!safe) return null;
    const url = new URL(safe);
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) {
      if (/^utm_/i.test(key) || ['fbclid', 'gclid', 'mc_cid', 'mc_eid'].includes(key.toLowerCase())) url.searchParams.delete(key);
    }
    url.searchParams.sort();
    return url.href;
  }

  function sourceKind(value) {
    const url = safeURL(value);
    if (!url) return 'reference';
    const host = new URL(url).hostname.toLowerCase();
    // "Primary" describes provenance, not independent corroboration.
    return /\.(?:gov|mil)$/.test(host) || /\.(?:gob|gov)\.[a-z]{2,3}$/.test(host)
      || /(?:^|\.)(?:cnes-geipan\.fr|geipan\.fr|cnes\.fr|nationalarchives\.gov\.uk)$/.test(host)
      ? 'primary' : 'reference';
  }

  function timestamp(value) {
    if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : null;
    if (typeof value !== 'string' || !value.trim()) return null;
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (dateOnly) {
      const d = new Date(value + 'T00:00:00Z');
      return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === value ? d.getTime() : null;
    }
    // Reject overflow dates and zone-less ISO times instead of letting Date.parse
    // normalize a nonexistent date or apply the visitor's device timezone.
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      if (!/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) || timestamp(value.slice(0, 10)) === null) return null;
    }
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function validDate(value) { return timestamp(value) === null ? null : value; }

  function normalizeSource(source) {
    const name = Array.isArray(source) ? source[0] : source && (source.name || source.label);
    const value = Array.isArray(source) ? source[1] : source && source.url;
    const url = safeURL(value);
    return url ? { name: String(name || new URL(url).hostname), url, kind: sourceKind(url) } : null;
  }

  function normalizeCases(rows) {
    if (!Array.isArray(rows)) return [];
    const seen = new Set();
    return rows.filter(row => row && row.id && !seen.has(String(row.id)) && seen.add(String(row.id))).map(row => {
      const lat = Number(row.lat), lng = Number(row.lng);
      const hasLocation = row.lat !== null && row.lat !== undefined && row.lng !== null && row.lng !== undefined
        && String(row.lat).trim() !== '' && String(row.lng).trim() !== ''
        && Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
      const title = String(row.name || row.title || row.id);
      return {
        id: String(row.id), title, name: title, kind: 'case', category: 'uap',
        summary: String(row.summary || ''),
        observedAt: validDate(row.datetimeUtc) || validDate(row.date),
        date: validDate(row.date),
        publishedAt: null,
        location: hasLocation ? { lat, lng, label: String(row.loc || ''), precision: row.geoPrecision || 'approximate' } : null,
        country: String(row.country || ''), type: String(row.type || ''),
        datetimePrecision: row.datetimePrecision || 'date-only',
        sources: (Array.isArray(row.sources) ? row.sources : []).map(normalizeSource).filter(Boolean),
        editorialStatus: 'curated',
        media: Array.isArray(row.media) ? row.media.map(item => ({ ...item })) : [],
      };
    });
  }

  function fold(value) {
    return String(value == null ? '' : value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function matchesQuery(item, query) {
    const tokens = fold(query).trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) return true;
    const text = fold([
      item.title, item.name, item.summary, item.sourceId, item.sourceName,
      item.country, item.location && item.location.label,
      ...(Array.isArray(item.sources) ? item.sources.map(s => s.name) : []),
    ].filter(Boolean).join(' '));
    return tokens.every(token => text.includes(token));
  }

  /** Periods always filter publishedAt. Never replace it with observedAt or ingestedAt.
   * sourceIds omitted/null = all sources; empty Set/array = explicitly no sources.
   */
  function filterItems(items, options) {
    const opts = options || {};
    const period = ['7', '30', 'all'].includes(String(opts.period)) ? String(opts.period) : 'all';
    const current = timestamp(opts.now instanceof Date ? opts.now : opts.now || new Date());
    const now = current === null ? Date.now() : current;
    const minimum = period === 'all' ? null : now - Number(period) * DAY;
    const sourceSet = opts.sourceIds == null ? null : new Set(typeof opts.sourceIds === 'string' ? opts.sourceIds.split(',').filter(Boolean) : opts.sourceIds);
    return (Array.isArray(items) ? items : []).filter(item => {
      if (!item || !matchesQuery(item, opts.query)) return false;
      if (sourceSet && !sourceSet.has(item.sourceId)) return false;
      if (opts.category && opts.category !== 'all' && item.category !== opts.category) return false;
      const published = timestamp(item.publishedAt);
      if (published !== null && published > now) return false;
      return minimum === null || (published !== null && published >= minimum);
    }).slice().sort((a, b) => (timestamp(b.publishedAt) || 0) - (timestamp(a.publishedAt) || 0));
  }

  function filterCases(cases, options) {
    const opts = options || {};
    return (Array.isArray(cases) ? cases : []).filter(item => item && matchesQuery(item, opts.query));
  }

  function sourceHealth(source, options) {
    const s = source || {}, opts = options || {};
    const current = timestamp(opts.now instanceof Date ? opts.now : opts.now || new Date());
    const now = current === null ? Date.now() : current;
    const staleAfterMs = Number.isFinite(opts.staleAfterMs) ? opts.staleAfterMs : 2 * 60 * 60 * 1000;
    const lastSuccess = timestamp(s.lastSuccessAt);
    const lastPublication = timestamp(s.lastPublishedAt);
    const ageMs = lastSuccess === null ? null : Math.max(0, now - lastSuccess);
    let status = 'unknown', label = 'Sin comprobación';
    if (s.status === 'manual') { status = 'manual'; label = 'Consulta editorial'; }
    else if (s.status === 'error') { status = 'error'; label = 'No disponible'; }
    else if (lastSuccess !== null && lastSuccess <= now + 5 * 60 * 1000) {
      status = ageMs > staleAfterMs ? 'stale' : 'ok';
      label = status === 'ok' ? 'Conectada' : 'Copia anterior';
    }
    return {
      status, label, ageMs, isStale: status === 'stale' || status === 'error',
      checkedAt: validDate(s.checkedAt), lastSuccessAt: validDate(s.lastSuccessAt),
      lastPublishedAt: validDate(s.lastPublishedAt),
      lastPublicationAgeMs: lastPublication === null ? null : Math.max(0, now - lastPublication),
    };
  }

  function formatDate(value, options) {
    const ms = timestamp(value);
    if (ms === null) return 'Fecha no disponible';
    const opts = typeof options === 'string' ? { locale: options } : options || {};
    const format = { day: 'numeric', month: 'short', year: 'numeric', timeZone: opts.timeZone || 'UTC' };
    if (opts.includeTime) { format.hour = '2-digit'; format.minute = '2-digit'; }
    try { return new Intl.DateTimeFormat(opts.locale || 'es-ES', format).format(new Date(ms)); }
    catch (_) { return new Date(ms).toISOString().slice(0, 10); }
  }

  function relativeTime(value, options) {
    const ms = timestamp(value);
    if (ms === null) return 'Sin comprobar';
    const opts = options || {};
    const now = timestamp(opts.now instanceof Date ? opts.now : opts.now || new Date());
    const age = Math.max(0, (now === null ? Date.now() : now) - ms);
    if (age < 60000) return 'Hace un momento';
    if (age < 3600000) return 'Hace ' + Math.floor(age / 60000) + ' min';
    if (age < DAY) return 'Hace ' + Math.floor(age / 3600000) + ' h';
    return 'Hace ' + Math.floor(age / DAY) + ' días';
  }

  function normalizeState(state) {
    const input = state || {};
    const filters = normalizeCaseFilters(input.caseFilters);
    return {
      view: VIEWS.has(input.view) ? input.view : DEFAULT_STATE.view,
      spatial: SPATIAL_MODES.has(input.spatial) ? input.spatial : DEFAULT_STATE.spatial,
      period: ['7', '30', 'all'].includes(String(input.period)) ? String(input.period) : DEFAULT_STATE.period,
      query: String(input.query || '').slice(0, 500),
      category: CATEGORIES.has(input.category) ? input.category : 'all',
      sources: input.sources == null ? null : [...new Set((typeof input.sources === 'string' ? input.sources.split(',') : [...input.sources]).map(String).filter(Boolean))].slice(0, 50),
      selectedId: input.selectedId ? String(input.selectedId).slice(0, 250) : null,
      selectedKind: SELECTED_KINDS.has(input.selectedKind) ? input.selectedKind : null,
      ...(Object.keys(filters).length ? { caseFilters: filters } : {}),
    };
  }

  function normalizeCaseFilters(value) {
    const input = value || {}, result = {};
    for (const key of ['source', 'type', 'shape', 'classification', 'country', 'geo']) {
      if (typeof input[key] === 'string' && input[key] && input[key] !== 'all') result[key] = input[key].slice(0, 120);
    }
    for (const key of ['from', 'to']) {
      if (input[key] !== '' && input[key] != null && /^\d{1,4}$/.test(String(input[key]))) {
        const year = Number(input[key]);
        if (year >= 1 && year <= 2100) result[key] = year;
      }
    }
    return result;
  }

  function readState(value) {
    let query = value;
    if (query && typeof query === 'object' && !(query instanceof URLSearchParams)) query = query.hash || query.search || '';
    if (typeof query === 'string' && /^https?:\/\//i.test(query)) {
      try { const url = new URL(query); query = url.hash || url.search; } catch (_) { query = ''; }
    }
    const params = query instanceof URLSearchParams ? query : new URLSearchParams(String(query || '').replace(/^[#?]/, ''));
    const legacyCase = !params.has('view') ? params.get('case') : null;
    return normalizeState({
      view: params.get('view') || (legacyCase ? 'atlas' : null), spatial: params.get('spatial'), period: params.get('period'), query: params.get('q'), category: params.get('category'),
      sources: params.has('sources') ? params.get('sources').split(',').filter(Boolean) : null,
      selectedId: params.get('id') || legacyCase, selectedKind: params.get('kind') || (legacyCase ? 'case' : null),
      caseFilters: Object.fromEntries(['source', 'type', 'shape', 'classification', 'country', 'geo', 'from', 'to'].map(key => [key, params.get('case-' + key)])),
    });
  }

  function writeState(value) {
    const state = normalizeState(value), params = new URLSearchParams();
    params.set('view', state.view);
    if (state.spatial !== DEFAULT_STATE.spatial) params.set('spatial', state.spatial);
    if (state.period !== DEFAULT_STATE.period) params.set('period', state.period);
    if (state.query) params.set('q', state.query);
    if (state.category !== 'all') params.set('category', state.category);
    if (state.sources !== null) params.set('sources', state.sources.join(','));
    if (state.selectedId) params.set('id', state.selectedId);
    if (state.selectedKind) params.set('kind', state.selectedKind);
    for (const [key, value] of Object.entries(state.caseFilters || {})) params.set('case-' + key, String(value));
    return '#' + params.toString();
  }

  // Populate only after editorial metadata/URLs have been checked, never to fill a live feed.
  function getEditorialDocuments() { return []; }

  return Object.freeze({
    DAY, DEFAULT_STATE, safeURL, canonicalURL, sourceKind, timestamp, normalizeSource,
    normalizeCases, fold, matchesQuery, filterItems, filterCases, sourceHealth,
    formatDate, relativeTime, normalizeCaseFilters, normalizeState, readState, writeState, getEditorialDocuments,
  });
}));
