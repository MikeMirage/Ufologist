// ============================================================
// UFOlogist — application core v2
// Globe (globe.gl) · NUFORC mass DB (80k) · heatmap · timeline
// player · shape/time filters · stats · hotspots · journal ·
// expedition tour · permalinks · export
// ============================================================

(function () {
'use strict';

// ---------- State ----------
const YEAR_MIN = 1942, YEAR_MAX = 2026;
const state = {
  yearFrom: YEAR_MIN,
  yearTo: YEAR_MAX,
  types: new Set(Object.keys(TYPE_META)),
  credMin: 1,
  layerMode: 'both',            // both | heat | points
  playing: false,
  playMode: 'cumulative',       // cumulative | window
  speed: 4,
  selectedCase: null,
  massOn: true,
  shapes: new Set(SHAPE_META.map((_, i) => i)),
  tod: 'all',                   // all | day | night
  hotspots: false,
  pickMode: false,
};

TYPE_META.MINE = { label: 'Mis avistamientos', color: '#ffffff', desc: 'Avistamientos registrados por ti, guardados en este navegador.' };

CASES.forEach(c => { c.year = +c.date.slice(0, 4); });
CASES.sort((a, b) => a.year - b.year);

const $ = id => document.getElementById(id);

// ---------- Journal (local field notebook) ----------
const JOURNAL_KEY = 'ufologist-journal';
let journal = [];
try { journal = JSON.parse(localStorage.getItem(JOURNAL_KEY) || '[]'); } catch (e) { journal = [] }
journal.forEach(j => { j.year = +j.date.slice(0, 4); j.mine = true; j.type = 'MINE'; });
function saveJournal() { localStorage.setItem(JOURNAL_KEY, JSON.stringify(journal)); }
function allCuratedPool() { return CASES.concat(journal); }

// ---------- Mass DB (NUFORC) ----------
let massData = null;   // array of {d,h,lat,lng,s,loc,year}
function ingestMass(json) {
  massData = json.rows.map(r => ({
    d: r[0], h: r[1], lat: r[2], lng: r[3], s: r[4], loc: r[5],
    year: Math.floor(r[0] / 10000), mass: true,
  }));
  $('mass-status').textContent = massData.length.toLocaleString('es');
  refresh();
}
fetch('data/nuforc.json?v=2')
  .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then(ingestMass)
  .catch(() => {
    // file:// or fetch blocked — fall back to a plain <script> payload, which always loads
    const s = document.createElement('script');
    s.src = 'data/nuforc.js?v=2';
    s.onload = () => window.NUFORC_DATA ? ingestMass(window.NUFORC_DATA)
                                        : ($('mass-status').textContent = 'no disponible');
    s.onerror = () => {
      $('mass-status').textContent = 'no disponible';
      toast('⚠ No se pudo cargar la base masiva NUFORC (data/nuforc.js)');
    };
    document.head.appendChild(s);
  });

function massFiltered() {
  if (!state.massOn || !massData) return [];
  const { yearFrom, yearTo, shapes, tod } = state;
  return massData.filter(r => {
    if (r.year < yearFrom || r.year > yearTo) return false;
    if (!shapes.has(r.s)) return false;
    if (tod === 'day' && !(r.h >= 7 && r.h <= 19)) return false;
    if (tod === 'night' && !(r.h >= 20 || (r.h >= 0 && r.h <= 6))) return false;
    return true;
  });
}

// ---------- Globe ----------
const MASS_POINT_LIMIT = 1800;  // show individual mass points only below this count

const globe = Globe()($('globe'))
  .globeImageUrl('https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg')
  .bumpImageUrl('https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png')
  .backgroundImageUrl('https://cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png')
  .atmosphereColor('#4be1c3')
  .atmosphereAltitude(0.18)
  .pointAltitude(d => d.mass ? 0.006 : 0.012)
  .pointRadius(d => d.mass ? 0.22 : 0.55)
  .pointColor(d => d.mass ? SHAPE_META[d.s].color + 'cc' : TYPE_META[d.type].color)
  .pointLabel(d => d.mass ? `
    <div style="font-family:'Space Grotesk',sans-serif;background:rgba(8,12,26,.92);border:1px solid rgba(120,200,255,.25);border-radius:10px;padding:7px 11px;max-width:230px;">
      <div style="color:${SHAPE_META[d.s].color};font-size:10px;letter-spacing:1px;text-transform:uppercase;">${SHAPE_META[d.s].label} · NUFORC</div>
      <div style="color:#e8eefc;font-weight:600;font-size:12px;margin-top:2px;">${fmtDateInt(d.d)}${d.h >= 0 ? ' · ' + String(d.h).padStart(2, '0') + 'h' : ''}</div>
      <div style="color:#93a1c0;font-size:11px;">${d.loc || 'ubicación geocodificada'}</div>
    </div>` : `
    <div style="font-family:'Space Grotesk',sans-serif;background:rgba(8,12,26,.92);border:1px solid rgba(120,200,255,.25);border-radius:10px;padding:8px 12px;max-width:240px;">
      <div style="color:${TYPE_META[d.type].color};font-size:10px;letter-spacing:1px;text-transform:uppercase;">${TYPE_META[d.type].label} · ${d.year}</div>
      <div style="color:#e8eefc;font-weight:600;font-size:13px;margin-top:2px;">${d.name}</div>
      <div style="color:#93a1c0;font-size:11px;">${d.loc}</div>
    </div>`)
  .onPointClick(d => d.mass ? openMassReport(d) : openCase(d.id, true))
  .hexBinPointLat('lat').hexBinPointLng('lng')
  .hexBinPointWeight(1)
  .hexBinResolution(3)
  .hexMargin(0.18)
  .hexAltitude(d => hexT(d.sumWeight) * 0.17 + 0.012)
  .hexTopColor(d => heatColor(d.sumWeight, 0.95))
  .hexSideColor(d => heatColor(d.sumWeight, 0.45))
  .hexLabel(d => `
    <div style="font-family:'JetBrains Mono',monospace;background:rgba(8,12,26,.92);border:1px solid rgba(120,200,255,.25);border-radius:8px;padding:6px 10px;color:#e8eefc;font-size:11px;">
      ${d.sumWeight.toLocaleString('es')} reporte${d.sumWeight > 1 ? 's' : ''} en la zona</div>`)
  .labelLat(d => d.lat).labelLng(d => d.lng)
  .labelText(d => d.name)
  .labelSize(0.65).labelDotRadius(0.35)
  .labelColor(() => '#ffd166')
  .labelResolution(2)
  .labelLabel(d => `
    <div style="font-family:'Space Grotesk',sans-serif;background:rgba(8,12,26,.94);border:1px solid rgba(255,209,102,.4);border-radius:10px;padding:9px 12px;max-width:260px;">
      <div style="color:#ffd166;font-weight:700;">🔥 ${d.name}</div>
      <div style="color:#cdd8ef;font-size:11.5px;margin-top:4px;line-height:1.5;">${d.desc}</div>
    </div>`)
  .onLabelClick(d => {
    globe.controls().autoRotate = false;
    globe.pointOfView({ lat: d.lat, lng: d.lng, altitude: 1.1 }, 900);
  })
  .onGlobeClick(({ lat, lng }) => { if (state.pickMode) pickLocation(lat, lng); });

globe.controls().autoRotate = true;
globe.controls().autoRotateSpeed = 0.35;
globe.controls().addEventListener('start', () => { globe.controls().autoRotate = false; });
globe.pointOfView({ lat: 30, lng: -40, altitude: 2.3 });

// adaptive heat scale (log) — recomputed on refresh
let heatRef = 15;
function hexT(w) { return Math.min(1, Math.log10(1 + w) / Math.log10(1 + heatRef)); }
function heatColor(w, alpha) {
  const t = hexT(w);
  const stops = [[75, 225, 195], [160, 235, 120], [255, 209, 102], [255, 130, 80], [239, 71, 111]];
  const x = t * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  const f = x - i;
  const c = stops[i].map((v, k) => Math.round(v + (stops[i + 1][k] - v) * f));
  return `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
}

function fmtDateInt(d) {
  const y = Math.floor(d / 10000), m = Math.floor(d / 100) % 100, da = d % 100;
  return `${String(da).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

function hideLoading() {
  const el = $('loading');
  el.style.opacity = '0';
  setTimeout(() => el.classList.add('hidden'), 650);
}
globe.onGlobeReady ? globe.onGlobeReady(hideLoading) : setTimeout(hideLoading, 1800);
setTimeout(hideLoading, 5000);

window.addEventListener('resize', () => {
  globe.width(window.innerWidth).height(window.innerHeight);
  drawHistogram(); positionHandles(); renderTimelineEvents();
});

// ---------- Filtering ----------
function filteredCases() {
  return allCuratedPool().filter(c =>
    c.year >= state.yearFrom && c.year <= state.yearTo &&
    state.types.has(c.type) &&
    (c.mine || c.cred >= state.credMin)
  );
}

let lastMassCount = 0;
function refresh() {
  const curated = filteredCases();
  const mass = massFiltered();
  lastMassCount = mass.length;
  heatRef = mass.length > 0 ? Math.max(20, mass.length / 30) : 15;

  let points = [];
  if (state.layerMode !== 'heat') {
    points = curated.slice();
    if (mass.length > 0 && mass.length <= MASS_POINT_LIMIT) points = points.concat(mass);
  }
  globe.pointsData(points);
  globe.hexBinPointsData(state.layerMode !== 'points' ? curated.concat(mass) : []);
  globe.labelsData(state.hotspots ? HOTSPOTS : []);

  renderCaseList(curated);
  renderTypeCounts();
  renderShapeCounts();
  $('case-count').textContent = (curated.length + mass.length).toLocaleString('es');
  $('mass-count-hint').textContent = mass.length
    ? (mass.length > MASS_POINT_LIMIT
        ? `${curated.length} casos curados + ${mass.length.toLocaleString('es')} reportes NUFORC (en mapa de calor; acota filtros a ≤ ${MASS_POINT_LIMIT.toLocaleString('es')} para verlos como puntos)`
        : `${curated.length} casos curados + ${mass.length.toLocaleString('es')} reportes NUFORC como puntos`)
    : `${curated.length} casos curados`;
  $('year-from').textContent = state.yearFrom;
  $('year-to').textContent = state.yearTo;
  drawHistogram();
  if (!$('panel-stats').classList.contains('hidden')) renderStats();
  scheduleHashUpdate();
}

// ---------- Type filters (curated) ----------
function buildTypeFilters() {
  const wrap = $('type-filters');
  wrap.innerHTML = '';
  Object.entries(TYPE_META).forEach(([code, meta]) => {
    if (code === 'MINE' && journal.length === 0) return;
    const el = document.createElement('div');
    el.className = 'type-chip' + (state.types.has(code) ? '' : ' off');
    el.dataset.type = code;
    el.title = meta.desc;
    el.innerHTML = `<span class="dot" style="background:${meta.color};color:${meta.color}"></span>
                    <span>${meta.label}</span><span class="t-count"></span>`;
    el.onclick = () => {
      state.types.has(code) ? state.types.delete(code) : state.types.add(code);
      el.classList.toggle('off', !state.types.has(code));
      refresh();
    };
    wrap.appendChild(el);
  });
}
function renderTypeCounts() {
  const counts = {};
  allCuratedPool().forEach(c => {
    if (c.year >= state.yearFrom && c.year <= state.yearTo && (c.mine || c.cred >= state.credMin))
      counts[c.type] = (counts[c.type] || 0) + 1;
  });
  document.querySelectorAll('.type-chip').forEach(el => {
    el.querySelector('.t-count').textContent = counts[el.dataset.type] || 0;
  });
}
$('types-all').onclick = () => {
  Object.keys(TYPE_META).forEach(t => state.types.add(t));
  document.querySelectorAll('.type-chip').forEach(el => el.classList.remove('off'));
  refresh();
};
$('types-none').onclick = () => {
  state.types.clear();
  document.querySelectorAll('.type-chip').forEach(el => el.classList.add('off'));
  refresh();
};

// ---------- Shape filters (mass DB) ----------
function buildShapeFilters() {
  const wrap = $('shape-filters');
  wrap.innerHTML = '';
  SHAPE_META.forEach((s, i) => {
    const el = document.createElement('span');
    el.className = 'shape-pill' + (state.shapes.has(i) ? '' : ' off');
    el.dataset.shape = i;
    el.innerHTML = `<span class="sdot" style="background:${s.color}"></span>${s.label} <span class="s-count"></span>`;
    el.onclick = () => {
      state.shapes.has(i) ? state.shapes.delete(i) : state.shapes.add(i);
      el.classList.toggle('off', !state.shapes.has(i));
      refresh();
    };
    wrap.appendChild(el);
  });
}
function renderShapeCounts() {
  if (!massData) return;
  const counts = new Array(SHAPE_META.length).fill(0);
  massData.forEach(r => { if (r.year >= state.yearFrom && r.year <= state.yearTo) counts[r.s]++; });
  document.querySelectorAll('.shape-pill').forEach(el => {
    const n = counts[+el.dataset.shape];
    el.querySelector('.s-count').textContent = n > 999 ? (n / 1000).toFixed(1) + 'k' : n;
  });
}
$('mass-toggle').onchange = e => { state.massOn = e.target.checked; refresh(); };
document.querySelectorAll('#tod-filter button').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('#tod-filter button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.tod = btn.dataset.tod;
    refresh();
  };
});
$('hotspots-toggle').onchange = e => { state.hotspots = e.target.checked; refresh(); };

// ---------- Credibility ----------
$('cred-range').oninput = e => {
  state.credMin = +e.target.value;
  $('cred-stars').textContent = '★'.repeat(state.credMin) + '☆'.repeat(5 - state.credMin);
  refresh();
};

// ---------- Layer mode ----------
document.querySelectorAll('#layer-mode button').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('#layer-mode button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.layerMode = btn.dataset.mode;
    refresh();
  };
});

// ---------- Case list ----------
function renderCaseList(data) {
  const wrap = $('case-list');
  wrap.innerHTML = '';
  [...data].sort((a, b) => b.year - a.year).forEach(c => {
    const el = document.createElement('div');
    el.className = 'case-item' + (state.selectedCase === c.id ? ' active' : '');
    el.innerHTML = `
      <div class="ci-top"><span class="ci-dot" style="background:${TYPE_META[c.type].color}"></span>
      <span class="ci-name">${c.name}</span></div>
      <div class="ci-meta">${c.year} · ${c.country || 'mi cuaderno'} · ${c.mine ? '📓' : '★'.repeat(c.cred)}</div>`;
    el.onclick = () => openCase(c.id, true);
    wrap.appendChild(el);
  });
}

// ---------- Media system ----------
function commonsURL(filename) {
  return 'https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(filename);
}
// find a Wikipedia article (lang + title) among a case's sources
function wikiInfo(c) {
  if (!c.sources) return null;
  for (const s of c.sources) {
    const m = (s[1] || '').match(/^https?:\/\/([a-z]+)\.wikipedia\.org\/wiki\/(.+)$/i);
    if (m) return { lang: m[1].toLowerCase(), title: m[2].split('#')[0] };
  }
  return null;
}
const wikiImgCache = new Map();
function fetchWikiImage(c) {
  const info = wikiInfo(c);
  if (!info) return Promise.resolve(null);
  const key = info.lang + ':' + info.title;
  if (wikiImgCache.has(key)) return Promise.resolve(wikiImgCache.get(key));
  const api = `https://${info.lang}.wikipedia.org/api/rest_v1/page/summary/${info.title}`;
  return fetch(api).then(r => r.ok ? r.json() : null).then(j => {
    const src = j && ((j.originalimage && j.originalimage.source) || (j.thumbnail && j.thumbnail.source)) || null;
    const val = src ? { src, page: j.content_urls && j.content_urls.desktop && j.content_urls.desktop.page } : null;
    wikiImgCache.set(key, val);
    return val;
  }).catch(() => { wikiImgCache.set(key, null); return null; });
}
function mediaSearchQuery(c) {
  return encodeURIComponent(c.name.replace(/\(.*?\)/g, '').trim() + ' ' + c.year + ' UFO UAP');
}
function renderMediaBlock(c) {
  const items = (c.media || []).map(m => {
    if (m.k === 'video') {
      return `<figure class="media-item"><video class="media-video" controls preload="none"
        poster="${m.poster || ''}" src="${commonsURL(m.commons)}#t=0.1"></video>
        <figcaption>${m.cap || ''}</figcaption></figure>`;
    }
    if (m.k === 'image') {
      return `<figure class="media-item"><img class="media-img" loading="lazy" src="${m.src}" alt="${m.cap || c.name}" data-full="${m.full || m.src}">
        <figcaption>${m.cap || ''}</figcaption></figure>`;
    }
    return '';
  }).join('');
  const q = mediaSearchQuery(c);
  const actions = `<div class="cc-media-actions">
      <a class="btn-ghost small" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${q}">▶ Buscar vídeos</a>
      <a class="btn-ghost small" target="_blank" rel="noopener" href="https://www.google.com/search?tbm=isch&q=${q}">🖼 Buscar imágenes</a>
    </div>`;
  return `<div class="cc-media" id="cc-media">${items}</div>${actions}`;
}
// async: pull the Wikipedia lead image and inject it (only if no curated media already)
function hydrateMedia(c) {
  if (c.media && c.media.length) return;       // curated media already shown
  fetchWikiImage(c).then(img => {
    if (!img || state.selectedCase !== c.id) return;
    const wrap = $('cc-media');
    if (!wrap) return;
    const fig = document.createElement('figure');
    fig.className = 'media-item';
    fig.innerHTML = `<img class="media-img" loading="lazy" src="${img.src}" alt="${c.name}" data-full="${img.src}">
      <figcaption>Imagen de Wikipedia${img.page ? ` · <a href="${img.page}" target="_blank" rel="noopener" class="cc-map-link">artículo ↗</a>` : ''}</figcaption>`;
    wrap.appendChild(fig);
  });
}

// ---------- Lightbox ----------
const lightbox = document.createElement('div');
lightbox.id = 'lightbox';
lightbox.className = 'hidden';
lightbox.innerHTML = '<img alt="" /><button class="lb-close" title="Cerrar">✕</button>';
document.body.appendChild(lightbox);
lightbox.addEventListener('click', () => lightbox.classList.add('hidden'));
function openLightbox(src) {
  lightbox.querySelector('img').src = src;
  lightbox.classList.remove('hidden');
}
// delegated: any media image (curated or async-injected) opens the lightbox
$('case-content').addEventListener('click', e => {
  const img = e.target.closest && e.target.closest('.media-img');
  if (img) openLightbox(img.dataset.full || img.src);
});

// ---------- Case detail ----------
function gmaps(lat, lng) { return `https://maps.google.com/?q=${lat.toFixed(5)},${lng.toFixed(5)}&t=k`; }

function openCase(id, fly) {
  const pool = allCuratedPool();
  const c = pool.find(x => x.id === id);
  if (!c) return;
  closeStats();
  state.selectedCase = id;
  const meta = TYPE_META[c.type];
  const dateFmt = new Date(c.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  $('case-content').innerHTML = `
    <span class="cc-type-badge" style="background:${meta.color}22;color:${meta.color};border:1px solid ${meta.color}55">
      <span class="dot" style="width:8px;height:8px;border-radius:50%;background:${meta.color}"></span>${meta.label}</span>
    <h2 class="cc-title">${c.name}</h2>
    <p class="cc-loc">📍 ${c.loc}${c.country ? ', ' + c.country : ''} · <a class="cc-map-link" href="${gmaps(c.lat, c.lng)}" target="_blank" rel="noopener">ver en satélite ↗</a></p>
    <div class="cc-row">
      <div class="cc-stat"><label>Fecha</label><span class="v">${dateFmt}</span></div>
      <div class="cc-stat"><label>${c.mine ? 'Origen' : 'Evidencia'}</label><span class="v stars">${c.mine ? '📓 Mi cuaderno' : '★'.repeat(c.cred) + '☆'.repeat(5 - c.cred)}</span></div>
    </div>
    <div class="cc-row">
      <div class="cc-stat"><label>Coordenadas</label><span class="v">${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}</span></div>
      <div class="cc-stat"><label>Clasificación</label><span class="v">${c.type}</span></div>
    </div>
    <p class="cc-summary">${c.summary || '<i>Sin notas.</i>'}</p>
    ${c.mine ? '' : renderMediaBlock(c)}
    ${c.sources && c.sources.length ? `<div class="cc-sources"><h4>Fuentes originales</h4>
      ${c.sources.map(s => `<a class="cc-source-link" href="${s[1]}" target="_blank" rel="noopener">${s[0]}</a>`).join('')}</div>` : ''}
    <div class="cc-actions">
      <button id="cc-share" class="btn-ghost small">🔗 Copiar enlace</button>
      ${c.mine ? '<button id="cc-delete" class="btn-ghost small" style="color:#ef476f;border-color:#ef476f55">🗑 Eliminar</button>' : ''}
    </div>
    <div class="cc-nav">
      <button id="cc-prev">← Anterior</button>
      <button id="cc-next">Siguiente →</button>
    </div>`;
  $('panel-case').classList.remove('hidden');
  if (!c.mine) hydrateMedia(c);
  const visible = filteredCases();
  const idx = visible.findIndex(x => x.id === id);
  $('cc-prev').onclick = () => { if (idx > 0) openCase(visible[idx - 1].id, true); };
  $('cc-next').onclick = () => { if (idx >= 0 && idx < visible.length - 1) openCase(visible[idx + 1].id, true); };
  $('cc-share').onclick = () => {
    scheduleHashUpdate.flush && scheduleHashUpdate.flush();
    navigator.clipboard.writeText(location.href).then(() => toast('Enlace copiado al portapapeles'));
  };
  if (c.mine) $('cc-delete').onclick = () => {
    journal = journal.filter(j => j.id !== c.id);
    saveJournal();
    $('panel-case').classList.add('hidden');
    state.selectedCase = null;
    buildTypeFilters();
    refresh();
    toast('Avistamiento eliminado de tu cuaderno');
  };
  if (fly) {
    globe.controls().autoRotate = false;
    globe.pointOfView({ lat: c.lat, lng: c.lng, altitude: 1.4 }, 900);
  }
  renderCaseList(visible);
  scheduleHashUpdate();
}

function openMassReport(d) {
  closeStats();
  state.selectedCase = null;
  const s = SHAPE_META[d.s];
  $('case-content').innerHTML = `
    <span class="cc-type-badge" style="background:${s.color}22;color:${s.color};border:1px solid ${s.color}55">
      <span class="dot" style="width:8px;height:8px;border-radius:50%;background:${s.color}"></span>${s.label}</span>
    <h2 class="cc-title">Reporte NUFORC</h2>
    <p class="cc-loc">📍 ${d.loc || 'ubicación geocodificada'} · <a class="cc-map-link" href="${gmaps(d.lat, d.lng)}" target="_blank" rel="noopener">ver en satélite ↗</a></p>
    <div class="cc-row">
      <div class="cc-stat"><label>Fecha</label><span class="v">${fmtDateInt(d.d)}</span></div>
      <div class="cc-stat"><label>Hora local</label><span class="v">${d.h >= 0 ? String(d.h).padStart(2, '0') + ':00' : '—'}</span></div>
    </div>
    <div class="cc-row">
      <div class="cc-stat"><label>Coordenadas</label><span class="v">${d.lat.toFixed(3)}, ${d.lng.toFixed(3)}</span></div>
      <div class="cc-stat"><label>Forma</label><span class="v">${s.label}</span></div>
    </div>
    <p class="cc-summary">Reporte ciudadano del National UFO Reporting Center, geocodificado a nivel de localidad.
    Para leer el testimonio completo, busca por fecha y lugar en la base de datos de NUFORC.</p>
    <div class="cc-sources"><h4>Fuente</h4>
      <a class="cc-source-link" href="https://nuforc.org/databank/" target="_blank" rel="noopener">NUFORC Databank (buscar ${fmtDateInt(d.d)})</a>
    </div>
    <div class="cc-media-actions">
      <a class="btn-ghost small" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${encodeURIComponent((d.loc || '') + ' ' + Math.floor(d.d / 10000) + ' UFO sighting')}">▶ Buscar vídeos</a>
      <a class="btn-ghost small" target="_blank" rel="noopener" href="https://www.google.com/search?tbm=isch&q=${encodeURIComponent((d.loc || '') + ' ' + Math.floor(d.d / 10000) + ' UFO')}">🖼 Buscar imágenes</a>
    </div>`;
  $('panel-case').classList.remove('hidden');
}
$('btn-close-case').onclick = () => {
  $('panel-case').classList.add('hidden');
  state.selectedCase = null;
  scheduleHashUpdate();
};

// ---------- Search ----------
const searchInput = $('search'), searchResults = $('search-results');
searchInput.oninput = () => {
  const q = searchInput.value.trim().toLowerCase();
  if (q.length < 2) { searchResults.classList.add('hidden'); return; }
  const hits = allCuratedPool().filter(c =>
    c.name.toLowerCase().includes(q) || (c.loc || '').toLowerCase().includes(q) ||
    (c.country || '').toLowerCase().includes(q) || c.year.toString().includes(q)
  ).slice(0, 10);
  searchResults.innerHTML = hits.length
    ? hits.map(c => `
        <div class="sr-item" data-id="${c.id}">
          <span class="sr-dot" style="background:${TYPE_META[c.type].color}"></span>
          <div><div class="sr-name">${c.name}</div>
          <div class="sr-meta">${c.year} · ${c.loc}${c.country ? ', ' + c.country : ''}</div></div>
        </div>`).join('')
    : '<div class="sr-item"><div class="sr-meta">Sin resultados</div></div>';
  searchResults.classList.remove('hidden');
  searchResults.querySelectorAll('.sr-item[data-id]').forEach(el => {
    el.onclick = () => {
      searchResults.classList.add('hidden');
      searchInput.value = '';
      const c = allCuratedPool().find(x => x.id === el.dataset.id);
      if (c.year < state.yearFrom || c.year > state.yearTo) { state.yearFrom = YEAR_MIN; state.yearTo = YEAR_MAX; positionHandles(); }
      if (!state.types.has(c.type)) { state.types.add(c.type); document.querySelector(`.type-chip[data-type="${c.type}"]`)?.classList.remove('off'); }
      if (!c.mine && c.cred < state.credMin) { state.credMin = 1; $('cred-range').value = 1; $('cred-stars').textContent = '★☆☆☆☆'; }
      refresh();
      openCase(c.id, true);
    };
  });
};
document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrap')) searchResults.classList.add('hidden');
});

// ---------- Timeline: histogram ----------
const canvas = $('tl-canvas'), ctx = canvas.getContext('2d');
function drawHistogram() {
  const wrap = canvas.parentElement;
  const W = wrap.clientWidth, H = wrap.clientHeight;
  if (!W || !H) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr; canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);

  const span = YEAR_MAX - YEAR_MIN + 1;
  const counts = new Array(span).fill(0);
  allCuratedPool().forEach(c => {
    if (state.types.has(c.type) && (c.mine || c.cred >= state.credMin) && c.year >= YEAR_MIN && c.year <= YEAR_MAX)
      counts[c.year - YEAR_MIN]++;
  });
  if (state.massOn && massData) {
    massData.forEach(r => {
      if (r.year >= YEAR_MIN && r.year <= YEAR_MAX && state.shapes.has(r.s)) counts[r.year - YEAR_MIN]++;
    });
  }
  // log scale (mass DB is exponentially skewed toward 2000s)
  const max = Math.max(1, ...counts);
  const bw = W / span;
  for (let i = 0; i < span; i++) {
    if (!counts[i]) continue;
    const h = Math.max(2, (Math.log10(1 + counts[i]) / Math.log10(1 + max)) * (H - 6));
    const year = YEAR_MIN + i;
    const inRange = year >= state.yearFrom && year <= state.yearTo;
    ctx.fillStyle = inRange ? 'rgba(75,225,195,0.85)' : 'rgba(120,140,180,0.28)';
    ctx.fillRect(i * bw + 1, H - h, Math.max(1.5, bw - 2), h);
  }
}

(function buildAxis() {
  const ax = $('tl-axis');
  for (let y = 1945; y <= YEAR_MAX; y += 10) {
    const s = document.createElement('span');
    s.textContent = y;
    ax.appendChild(s);
  }
})();

// ---------- Timeline: event markers ----------
function renderTimelineEvents() {
  const wrap = $('tl-events');
  wrap.innerHTML = '';
  TL_EVENTS.forEach(ev => {
    const el = document.createElement('div');
    el.className = 'tl-event';
    el.style.left = yearToX(ev.year) + 'px';
    el.title = `${ev.year} — ${ev.label}`;
    el.onclick = () => { openModal('disclosure'); };
    wrap.appendChild(el);
  });
}

// ---------- Timeline: range handles ----------
const range = $('tl-range'), hMin = $('handle-min'), hMax = $('handle-max'), fill = $('tl-fill');
function yearToX(year) {
  return ((year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * range.clientWidth;
}
function xToYear(x) {
  const t = Math.min(1, Math.max(0, x / range.clientWidth));
  return Math.round(YEAR_MIN + t * (YEAR_MAX - YEAR_MIN));
}
function positionHandles() {
  hMin.style.left = yearToX(state.yearFrom) + 'px';
  hMax.style.left = yearToX(state.yearTo) + 'px';
  fill.style.left = yearToX(state.yearFrom) + 'px';
  fill.style.width = (yearToX(state.yearTo) - yearToX(state.yearFrom)) + 'px';
}
function attachDrag(handle, isMin) {
  handle.addEventListener('pointerdown', e => {
    e.preventDefault();
    stopPlayback();
    handle.setPointerCapture(e.pointerId);
    const move = ev => {
      const rect = range.getBoundingClientRect();
      const y = xToYear(ev.clientX - rect.left);
      if (isMin) state.yearFrom = Math.min(y, state.yearTo);
      else state.yearTo = Math.max(y, state.yearFrom);
      positionHandles();
      refresh();
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  });
  handle.addEventListener('keydown', e => {
    const d = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
    if (!d) return;
    if (isMin) state.yearFrom = Math.min(Math.max(YEAR_MIN, state.yearFrom + d), state.yearTo);
    else state.yearTo = Math.max(Math.min(YEAR_MAX, state.yearTo + d), state.yearFrom);
    positionHandles(); refresh();
  });
}
attachDrag(hMin, true);
attachDrag(hMax, false);

range.addEventListener('pointerdown', e => {
  if (e.target.classList.contains('tl-handle')) return;
  const rect = range.getBoundingClientRect();
  const y = xToYear(e.clientX - rect.left);
  if (Math.abs(y - state.yearFrom) < Math.abs(y - state.yearTo)) state.yearFrom = Math.min(y, state.yearTo);
  else state.yearTo = Math.max(y, state.yearFrom);
  positionHandles(); refresh();
});

// ---------- Timeline: playback ----------
let rafId = null, lastT = 0, playCursor = 0, lastAppliedYear = null;
const WINDOW_YEARS = 10;

document.querySelectorAll('#play-mode button').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('#play-mode button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.playMode = btn.dataset.pmode;
  };
});
$('speed').oninput = e => { state.speed = +e.target.value; };

function startPlayback() {
  if (state.playing) return;
  state.playing = true;
  $('btn-play').textContent = '⏸';
  $('btn-play').classList.add('playing');
  globe.controls().autoRotate = false;
  playCursor = YEAR_MIN;
  lastAppliedYear = null;
  lastT = performance.now();
  rafId = requestAnimationFrame(tick);
}
function stopPlayback() {
  if (!state.playing) return;
  state.playing = false;
  $('btn-play').textContent = '▶';
  $('btn-play').classList.remove('playing');
  cancelAnimationFrame(rafId);
}
function tick(t) {
  if (!state.playing) return;
  const dt = (t - lastT) / 1000;
  lastT = t;
  playCursor += dt * state.speed;
  const y = Math.floor(playCursor);
  if (y > YEAR_MAX) { stopPlayback(); return; }
  if (y !== lastAppliedYear) {       // only re-filter when the year actually changes
    lastAppliedYear = y;
    if (state.playMode === 'cumulative') {
      state.yearFrom = YEAR_MIN;
      state.yearTo = Math.min(y, YEAR_MAX);
    } else {
      state.yearTo = Math.min(y, YEAR_MAX);
      state.yearFrom = Math.max(YEAR_MIN, state.yearTo - WINDOW_YEARS + 1);
    }
    positionHandles();
    refresh();
  }
  rafId = requestAnimationFrame(tick);
}
$('btn-play').onclick = () => state.playing ? stopPlayback() : startPlayback();

// ---------- Left panel collapse ----------
$('btn-collapse-left').onclick = () => {
  $('panel-left').classList.add('collapsed');
  $('btn-expand-left').classList.remove('hidden');
};
$('btn-expand-left').onclick = () => {
  $('panel-left').classList.remove('collapsed');
  $('btn-expand-left').classList.add('hidden');
};

// ---------- Stats panel ----------
function hbar(label, n, max, suffix) {
  return `<div class="hbar-row"><span class="hbar-label" title="${label}">${label}</span>
    <div class="hbar-track"><div class="hbar-fill" style="width:${Math.max(1, (n / Math.max(1, max)) * 100)}%"></div></div>
    <span class="hbar-n">${n.toLocaleString('es')}${suffix || ''}</span></div>`;
}
function renderStats() {
  const curated = filteredCases();
  const mass = massFiltered();
  // decades
  const dec = {};
  curated.forEach(c => { const d = Math.floor(c.year / 10) * 10; dec[d] = (dec[d] || 0) + 1; });
  mass.forEach(r => { const d = Math.floor(r.year / 10) * 10; dec[d] = (dec[d] || 0) + 1; });
  const decKeys = Object.keys(dec).map(Number).sort((a, b) => a - b);
  const decMax = Math.max(1, ...Object.values(dec));
  // shapes
  const sh = new Array(SHAPE_META.length).fill(0);
  mass.forEach(r => sh[r.s]++);
  const shMax = Math.max(1, ...sh);
  // top locations
  const locs = {};
  mass.forEach(r => { if (r.loc) locs[r.loc] = (locs[r.loc] || 0) + 1; });
  const topLocs = Object.entries(locs).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const locMax = topLocs.length ? topLocs[0][1] : 1;
  // day vs night
  let day = 0, night = 0, unk = 0;
  mass.forEach(r => { if (r.h < 0) unk++; else if (r.h >= 7 && r.h <= 19) day++; else night++; });

  $('stats-content').innerHTML = `
    <div class="kpi-row">
      <div class="kpi"><span class="n">${curated.length}</span><label>Casos curados</label></div>
      <div class="kpi"><span class="n">${mass.length.toLocaleString('es')}</span><label>Reportes NUFORC</label></div>
      <div class="kpi"><span class="n">${(curated.length + mass.length).toLocaleString('es')}</span><label>Total selección</label></div>
    </div>
    <div class="chart-block"><h4>Por década</h4>
      ${decKeys.map(d => hbar(d + 's', dec[d], decMax)).join('')}</div>
    ${mass.length ? `
    <div class="chart-block"><h4>Por forma reportada (NUFORC)</h4>
      ${SHAPE_META.map((s, i) => ({ s, i, n: sh[i] })).filter(x => x.n).sort((a, b) => b.n - a.n)
        .map(x => hbar(x.s.label, x.n, shMax)).join('')}</div>
    <div class="chart-block"><h4>☀ Día vs ☾ Noche</h4>
      ${hbar('Diurnos (7-19h)', day, Math.max(day, night))}
      ${hbar('Nocturnos (20-6h)', night, Math.max(day, night))}
      ${unk ? hbar('Hora desconocida', unk, Math.max(day, night)) : ''}</div>
    <div class="chart-block"><h4>Top 10 localidades</h4>
      ${topLocs.map(([l, n]) => hbar(l, n, locMax)).join('')}</div>` : '<p class="hint">Activa la base masiva NUFORC para ver análisis de formas, franjas horarias y localidades.</p>'}
    <p class="hint">⚠ Sesgo conocido: NUFORC es una base estadounidense y el volumen crece con la llegada de internet
    (década de 2000). Las tendencias geográficas son más fiables que las comparaciones entre épocas lejanas.</p>`;
}
function openStats() {
  $('panel-case').classList.add('hidden');
  $('panel-stats').classList.remove('hidden');
  renderStats();
}
function closeStats() { $('panel-stats').classList.add('hidden'); }
$('btn-stats').onclick = () => $('panel-stats').classList.contains('hidden') ? openStats() : closeStats();
$('btn-close-stats').onclick = closeStats;

// ---------- Export ----------
function exportRows() {
  const curated = filteredCases().map(c => ({
    source: c.mine ? 'Mi cuaderno' : 'UFOlogist (curado)',
    name: c.name, date: c.date, time: c.time || '', lat: c.lat, lng: c.lng,
    type: c.mine ? 'MINE' : c.type, type_label: TYPE_META[c.type].label,
    location: (c.loc || '') + (c.country ? ', ' + c.country : ''),
    credibility: c.mine ? '' : c.cred, summary: c.summary || '',
    sources: (c.sources || []).map(s => s[1]).join(' | '),
  }));
  const mass = massFiltered().map(r => ({
    source: 'NUFORC',
    name: r.loc || 'reporte', date: `${Math.floor(r.d / 10000)}-${String(Math.floor(r.d / 100) % 100).padStart(2, '0')}-${String(r.d % 100).padStart(2, '0')}`,
    time: r.h >= 0 ? String(r.h).padStart(2, '0') + ':00' : '',
    lat: r.lat, lng: r.lng, type: SHAPE_META[r.s].code, type_label: SHAPE_META[r.s].label,
    location: r.loc || '', credibility: '', summary: '', sources: 'https://nuforc.org/databank/',
  }));
  return curated.concat(mass);
}
function download(filename, text, mime) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: mime }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
$('btn-export-json').onclick = () => {
  const rows = exportRows();
  download(`ufologist-export-${state.yearFrom}-${state.yearTo}.json`, JSON.stringify(rows, null, 1), 'application/json');
  toast(`${rows.length.toLocaleString('es')} registros exportados a JSON`);
};
$('btn-export-csv').onclick = () => {
  const rows = exportRows();
  if (!rows.length) { toast('Nada que exportar con los filtros actuales'); return; }
  const cols = Object.keys(rows[0]);
  const esc = v => '"' + String(v).replace(/"/g, '""') + '"';
  const csv = cols.join(',') + '\n' + rows.map(r => cols.map(c => esc(r[c])).join(',')).join('\n');
  download(`ufologist-export-${state.yearFrom}-${state.yearTo}.csv`, csv, 'text/csv');
  toast(`${rows.length.toLocaleString('es')} registros exportados a CSV`);
};

// ---------- Permalink (URL hash state) ----------
let hashTimer = null, applyingHash = false;
function encodeHash() {
  const p = new URLSearchParams();
  if (state.yearFrom !== YEAR_MIN || state.yearTo !== YEAR_MAX) p.set('y', state.yearFrom + '-' + state.yearTo);
  if (state.types.size !== Object.keys(TYPE_META).length) p.set('t', [...state.types].join('.'));
  if (state.credMin > 1) p.set('c', state.credMin);
  if (state.layerMode !== 'both') p.set('l', state.layerMode);
  if (!state.massOn) p.set('m', '0');
  if (state.shapes.size !== SHAPE_META.length) p.set('s', [...state.shapes].join('.'));
  if (state.tod !== 'all') p.set('h', state.tod);
  if (state.hotspots) p.set('hs', '1');
  if (state.selectedCase) p.set('case', state.selectedCase);
  return p.toString();
}
function scheduleHashUpdate() {
  if (applyingHash) return;
  clearTimeout(hashTimer);
  hashTimer = setTimeout(() => { history.replaceState(null, '', '#' + encodeHash()); }, 300);
}
scheduleHashUpdate.flush = () => { clearTimeout(hashTimer); history.replaceState(null, '', '#' + encodeHash()); };
function applyHash() {
  if (!location.hash || location.hash.length < 2) return null;
  applyingHash = true;
  try {
    const p = new URLSearchParams(location.hash.slice(1));
    if (p.get('y')) {
      const [a, b] = p.get('y').split('-').map(Number);
      if (a >= YEAR_MIN && b <= YEAR_MAX && a <= b) { state.yearFrom = a; state.yearTo = b; }
    }
    if (p.get('t')) state.types = new Set(p.get('t').split('.').filter(t => TYPE_META[t]));
    if (p.get('c')) state.credMin = Math.min(5, Math.max(1, +p.get('c')));
    if (p.get('l') && ['both', 'heat', 'points'].includes(p.get('l'))) state.layerMode = p.get('l');
    if (p.get('m') === '0') state.massOn = false;
    if (p.get('s')) state.shapes = new Set(p.get('s').split('.').map(Number).filter(i => i >= 0 && i < SHAPE_META.length));
    if (p.get('h') && ['day', 'night'].includes(p.get('h'))) state.tod = p.get('h');
    if (p.get('hs') === '1') state.hotspots = true;
    return p.get('case');
  } finally { applyingHash = false; }
}
$('btn-permalink').onclick = () => {
  scheduleHashUpdate.flush();
  navigator.clipboard.writeText(location.href).then(() => toast('Enlace con filtros copiado'));
};

// ---------- Toast ----------
let toastTimer = null;
function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 2600);
}

// ---------- Journal: add sighting ----------
$('btn-add').onclick = () => {
  state.pickMode = true;
  $('pick-hint').classList.remove('hidden');
  globe.controls().autoRotate = false;
  toast('Modo registro: haz clic en el lugar del avistamiento');
};
$('pick-cancel').onclick = () => { state.pickMode = false; $('pick-hint').classList.add('hidden'); };
function pickLocation(lat, lng) {
  state.pickMode = false;
  $('pick-hint').classList.add('hidden');
  $('sf-lat').value = lat.toFixed(4);
  $('sf-lng').value = lng.toFixed(4);
  $('sf-date').value = new Date().toISOString().slice(0, 10);
  const sel = $('sf-shape');
  if (!sel.options.length) SHAPE_META.forEach((s, i) => sel.add(new Option(s.label, i)));
  $('sight-overlay').classList.remove('hidden');
  $('sf-name').focus();
}
$('sight-close').onclick = () => $('sight-overlay').classList.add('hidden');
$('sight-overlay').addEventListener('click', e => { if (e.target === $('sight-overlay')) $('sight-overlay').classList.add('hidden'); });
$('sf-save').onclick = () => {
  const name = $('sf-name').value.trim();
  const date = $('sf-date').value;
  const lat = parseFloat($('sf-lat').value), lng = parseFloat($('sf-lng').value);
  if (!name || !date || !isFinite(lat) || !isFinite(lng)) { toast('Faltan título, fecha o coordenadas'); return; }
  const entry = {
    id: 'my-' + Date.now(),
    name, date, time: $('sf-time').value || '',
    lat, lng,
    loc: 'Registrado en mi cuaderno' + ($('sf-time').value ? ' · ' + $('sf-time').value : ''),
    country: '', type: 'MINE', cred: 0, mine: true,
    year: +date.slice(0, 4),
    summary: ($('sf-notes').value.trim() || '') + ' [Forma: ' + SHAPE_META[+$('sf-shape').value].label + ']',
    sources: [],
  };
  journal.push(entry);
  saveJournal();
  state.types.add('MINE');
  $('sight-overlay').classList.add('hidden');
  ['sf-name', 'sf-notes', 'sf-time'].forEach(i => $(i).value = '');
  buildTypeFilters();
  refresh();
  openCase(entry.id, true);
  toast('Avistamiento guardado en tu cuaderno de campo 📓');
};

// ---------- Expedition tour ----------
const TOUR_DWELL = 14000; // ms per stop
let tour = { active: false, idx: 0, timer: null, paused: false, t0: 0, remaining: 0 };

function tourStart() {
  tour.active = true; tour.idx = 0; tour.paused = false;
  stopPlayback();
  $('tour-card').classList.remove('hidden');
  tourGo(0);
}
function tourGo(i) {
  const ids = TOUR_IDS.filter(id => CASES.some(c => c.id === id));
  if (i < 0) i = 0;
  if (i >= ids.length) { tourEnd(); return; }
  tour.idx = i;
  const c = CASES.find(x => x.id === ids[i]);
  $('tour-progress').textContent = (i + 1) + '/' + ids.length;
  $('tour-title').textContent = c.year + ' — ' + c.name;
  $('tour-text').textContent = c.summary;
  openCase(c.id, false);
  globe.pointOfView({ lat: c.lat, lng: c.lng, altitude: 1.25 }, 1600);
  clearTimeout(tour.timer);
  tour.t0 = performance.now();
  tour.remaining = TOUR_DWELL;
  if (!tour.paused) tour.timer = setTimeout(() => tourGo(i + 1), TOUR_DWELL);
  animateTourBar();
}
let tourBarRaf = null;
function animateTourBar() {
  cancelAnimationFrame(tourBarRaf);
  const step = () => {
    if (!tour.active) return;
    const el = $('tour-bar-fill');
    if (tour.paused) { el.style.width = (100 - (tour.remaining / TOUR_DWELL) * 100) + '%'; }
    else {
      const elapsed = performance.now() - tour.t0;
      el.style.width = Math.min(100, (elapsed / TOUR_DWELL) * 100) + '%';
    }
    tourBarRaf = requestAnimationFrame(step);
  };
  step();
}
function tourEnd() {
  tour.active = false;
  clearTimeout(tour.timer);
  cancelAnimationFrame(tourBarRaf);
  $('tour-card').classList.add('hidden');
}
$('btn-tour').onclick = () => tour.active ? tourEnd() : tourStart();
$('tour-close').onclick = tourEnd;
$('tour-next').onclick = () => { tour.paused = false; $('tour-pause').textContent = '⏸ Pausa'; tourGo(tour.idx + 1); };
$('tour-prev').onclick = () => { tour.paused = false; $('tour-pause').textContent = '⏸ Pausa'; tourGo(tour.idx - 1); };
$('tour-pause').onclick = () => {
  if (tour.paused) {
    tour.paused = false;
    $('tour-pause').textContent = '⏸ Pausa';
    tour.t0 = performance.now() - (TOUR_DWELL - tour.remaining);
    tour.timer = setTimeout(() => tourGo(tour.idx + 1), tour.remaining);
  } else {
    tour.paused = true;
    $('tour-pause').textContent = '▶ Seguir';
    clearTimeout(tour.timer);
    tour.remaining = Math.max(0, TOUR_DWELL - (performance.now() - tour.t0));
  }
};

// ---------- Knowledge modal ----------
const TABS = {
  hynek: () => `
    <h3>Clasificación de casos</h3>
    <p>UFOlogist usa la clasificación del astrónomo <b>J. Allen Hynek</b> (asesor científico del Proyecto Blue Book),
    extendida con categorías modernas surgidas de la era UAP (militar, transmedio, masivo).</p>
    ${Object.entries(TYPE_META).filter(([c]) => c !== 'MINE').map(([code, m]) => `
      <div class="k-type-card">
        <span class="dot" style="background:${m.color};color:${m.color}"></span>
        <div><b>${m.label} <span style="color:#5b6886;font-family:'JetBrains Mono',monospace;font-size:11px">[${code}]</span></b>
        <span>${m.desc}</span></div>
      </div>`).join('')}
    <h3>Formas reportadas (base NUFORC)</h3>
    <p>Los 80.332 reportes ciudadanos se agrupan en 10 morfologías. La "luz" nocturna domina el registro — coherente
    con la categoría NL de Hynek y con la dificultad de estimar forma de noche.</p>
    ${SHAPE_META.map(s => `<span class="shape-pill" style="cursor:default;margin:2px"><span class="sdot" style="background:${s.color}"></span>${s.label}</span>`).join(' ')}`,
  disclosure: () => `
    <h3>Cronología del disclosure en EE.UU.</h3>
    <p>Ochenta años de investigación oficial, negación pública y desclasificación gradual: del memo Twining a las audiencias del Congreso.
    Los rombos ◆ de la línea de tiempo marcan estos hitos y las grandes oleadas.</p>
    ${DISCLOSURE_TIMELINE.map(d => `
      <div class="dt-item">
        <div class="dt-year">${d.year}</div>
        <div class="dt-body"><b>${d.title}</b><p>${d.text}</p></div>
      </div>`).join('')}`,
  glossary: () => `
    <h3>Glosario esencial</h3>
    ${GLOSSARY.map(([term, def]) => `<div class="gl-item"><b>${term}</b><p>${def}</p></div>`).join('')}`,
  method: () => `
    <h3>Metodología y escala de evidencia</h3>
    <p>${METHODOLOGY.notes}</p>
    <table class="cred-table">
      ${METHODOLOGY.cred.map(([n, txt]) => `<tr><td>${'★'.repeat(n)}${'☆'.repeat(5 - n)}</td><td>${txt}</td></tr>`).join('')}
    </table>
    <h3>Las dos capas de datos</h3>
    <p><b>Casos curados (~100):</b> selección editorial de los casos mejor documentados de la historia, cada uno con fuentes primarias verificables.</p>
    <p><b>Base masiva (80.332):</b> reportes ciudadanos del National UFO Reporting Center (1906–2014), geocodificados a nivel de
    localidad. Sin filtrar: contiene ruido, errores de identificación y sesgos (país, era de internet). Su valor es
    estadístico — tendencias, formas, franjas horarias y geografía — no probatorio caso a caso.</p>`,
  report: () => `
    <h3>Archivos oficiales y cómo reportar</h3>
    <p>¿Has visto algo? Usa el botón <b>➕ Registrar</b> para anotarlo en tu cuaderno de campo local con coordenadas precisas,
    y repórtalo después a un organismo: hora exacta, duración, dirección, condiciones, fotos sin zoom digital.
    Antes, descarta lo prosaico: Starlink, ISS, Venus, bengalas, drones y globos explican la gran mayoría de casos.</p>
    ${REPORT_LINKS.map(([label, url]) => `<a class="cc-source-link" href="${url}" target="_blank" rel="noopener">${label}</a>`).join('')}`,
};

function openModal(tab) {
  $('modal-overlay').classList.remove('hidden');
  switchTab(tab || 'hynek');
}
function switchTab(tab) {
  document.querySelectorAll('#modal-tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  $('modal-body').innerHTML = TABS[tab]();
  $('modal-body').scrollTop = 0;
}
document.querySelectorAll('#modal-tabs button').forEach(b => { b.onclick = () => switchTab(b.dataset.tab); });
$('btn-knowledge').onclick = () => openModal('hynek');
$('btn-about').onclick = () => openModal('method');
$('btn-close-modal').onclick = () => $('modal-overlay').classList.add('hidden');
$('modal-overlay').addEventListener('click', e => {
  if (e.target === $('modal-overlay')) $('modal-overlay').classList.add('hidden');
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    $('modal-overlay').classList.add('hidden');
    $('panel-case').classList.add('hidden');
    $('sight-overlay').classList.add('hidden');
    closeStats();
    if (state.pickMode) { state.pickMode = false; $('pick-hint').classList.add('hidden'); }
  }
  if (e.key === ' ' && !e.target.closest('input,textarea,select')) { e.preventDefault(); $('btn-play').click(); }
});

// ---------- Init ----------
// browsers restore form values across reloads — force controls to match state
const startCase = applyHash();
$('speed').value = state.speed;
$('cred-range').value = state.credMin;
$('cred-stars').textContent = '★'.repeat(state.credMin) + '☆'.repeat(5 - state.credMin);
$('mass-toggle').checked = state.massOn;
$('hotspots-toggle').checked = state.hotspots;
document.querySelectorAll('#layer-mode button').forEach(b => b.classList.toggle('active', b.dataset.mode === state.layerMode));
document.querySelectorAll('#tod-filter button').forEach(b => b.classList.toggle('active', b.dataset.tod === state.tod));
buildTypeFilters();
buildShapeFilters();
positionHandles();
renderTimelineEvents();
refresh();
if (startCase) setTimeout(() => openCase(startCase, true), 800);
setTimeout(() => { positionHandles(); drawHistogram(); renderTimelineEvents(); }, 300);

})();
