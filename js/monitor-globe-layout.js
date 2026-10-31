/* Screen-space layout for the globe's geographic markers.
 * This bounds visual collisions, never records. Hidden markers are returned
 * separately so viewport clipping cannot be confused with catalogue filtering.
 * Browser: UFOMonitorGlobeLayout. Node: require('./monitor-globe-layout.js').
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.UFOMonitorGlobeLayout = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const DEFAULT_COLOR = '#61dfef';
  const number = (value, fallback) => Number.isFinite(value) ? value : fallback;
  const radians = Math.PI / 180;

  function rowsOf(marker) {
    return Array.isArray(marker.rows) ? marker.rows : marker.item ? [marker.item] : [];
  }
  function countOf(marker) {
    const rows = rowsOf(marker);
    return rows.length || (Number.isFinite(marker.count) && marker.count > 0 ? marker.count : 1);
  }
  function defaultRadius(marker) {
    return marker.selected ? 6 : marker.cluster ? (countOf(marker) >= 1000 ? 22 : 18) : 5;
  }
  function colorOf(item) {
    return item && /^#[0-9a-f]{6}$/i.test(item.color) ? item.color.toLowerCase() : DEFAULT_COLOR;
  }
  function addVector(vector, lat, lng, weight) {
    const phi = lat * radians, lambda = lng * radians;
    vector[0] += Math.cos(phi) * Math.cos(lambda) * weight;
    vector[1] += Math.cos(phi) * Math.sin(lambda) * weight;
    vector[2] += Math.sin(phi) * weight;
  }
  function nodeOf(marker) {
    const rows = rowsOf(marker), count = countOf(marker), vector = [0, 0, 0], colors = new Map();
    let located = 0;
    rows.forEach(item => {
      const loc = item && item.location;
      if (loc && Number.isFinite(loc.lat) && Number.isFinite(loc.lng)) {
        addVector(vector, loc.lat, loc.lng, 1); located++;
      }
      const color = colorOf(item);
      colors.set(color, (colors.get(color) || 0) + 1);
    });
    if (!located) addVector(vector, number(marker.lat, 0), number(marker.lng, 0), count);
    if (!colors.size) colors.set(colorOf(marker), count);
    return { marker, rows, count, vector, colors, keys: [String(marker.id)], position: null, radius: 0 };
  }
  function mergeNodes(first, second) {
    const vector = first.vector.map((value, index) => value + second.vector[index]);
    const rows = first.rows.concat(second.rows), count = first.count + second.count;
    const colors = new Map(first.colors);
    second.colors.forEach((value, color) => colors.set(color, (colors.get(color) || 0) + value));
    let color = DEFAULT_COLOR, maximum = 0;
    colors.forEach((value, key) => { if (value > maximum) { color = key; maximum = value; } });
    const keys = first.keys.concat(second.keys).sort();
    const lat = Math.atan2(vector[2], Math.hypot(vector[0], vector[1])) / radians;
    const lng = Math.atan2(vector[1], vector[0]) / radians;
    return {
      marker: { id: 'screen:' + keys.join('|'), lat, lng, rows, count, color,
        cluster: true, selected: false, screenCluster: true,
        cell: Math.max(number(first.marker.cell, 0), number(second.marker.cell, 0)) },
      rows, count, vector, colors, keys, position: null, radius: 0,
    };
  }
  function rectOf(value) {
    const left = number(value.left, number(value.x, 0)), top = number(value.top, number(value.y, 0));
    return { left, top, right: number(value.right, left + number(value.width, 0)), bottom: number(value.bottom, top + number(value.height, 0)) };
  }
  function positionBlockedReason(position, radius, opts) {
    const margin = opts.padding + radius;
    if (position.x < margin || position.y < margin || position.x > opts.width - margin || position.y > opts.height - margin) return 'viewport';
    const reserveMargin = radius + opts.reservedPadding;
    if (opts.reserved.some(rect => position.x >= rect.left - reserveMargin && position.x <= rect.right + reserveMargin
      && position.y >= rect.top - reserveMargin && position.y <= rect.bottom + reserveMargin)) return 'reserved';
    return null;
  }
  function blockedReason(node, project, opts) {
    let position;
    try { position = project(node.marker); } catch (_) { return 'projection'; }
    if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.y)) return 'projection';
    node.position = { x: position.x, y: position.y };
    if (position.visible === false) return 'hemisphere';
    node.radius = Math.max(0, number(opts.radius(node.marker), defaultRadius(node.marker)));
    return positionBlockedReason(position, node.radius, opts);
  }
  function outputOf(node, reason) {
    const output = { ...node.marker, count: node.count, ...(node.position ? { screen: { ...node.position } } : {}),
      ...(reason ? { hiddenReason: reason } : {}) };
    if (node.screenOffset) output.screenOffset = { ...node.screenOffset };
    else delete output.screenOffset;
    return output;
  }
  function overlaps(position, radius, other, gap) {
    return Math.hypot(position.x - other.position.x, position.y - other.position.y) < radius + other.radius + gap;
  }
  function avoidSelection(nodes, opts, hidden) {
    const selected = nodes.filter(node => node.marker.selected);
    if (!selected.length) return nodes;
    const rejected = new Set();
    nodes.forEach(node => {
      if (node.marker.selected || !selected.some(other => overlaps(node.position, node.radius, other, opts.gap))) return;
      const anchor = { ...node.position };
      const closest = selected.reduce((best, other) => !best || Math.hypot(anchor.x - other.position.x, anchor.y - other.position.y)
        < Math.hypot(anchor.x - best.position.x, anchor.y - best.position.y) ? other : best, null);
      // Start in the direction away from the selected anchor, then try the
      // remaining compass directions. This moves a label, never its geography.
      const start = Math.atan2(anchor.y - closest.position.y, anchor.x - closest.position.x);
      const directions = Array.from({ length: 8 }, (_, index) => index * Math.PI / 4)
        .sort((a, b) => Math.abs(Math.atan2(Math.sin(a - start), Math.cos(a - start)))
          - Math.abs(Math.atan2(Math.sin(b - start), Math.cos(b - start))));
      let candidate = null;
      for (const distance of [36, 42, 48]) {
        for (const angle of directions) {
          const position = { x: anchor.x + Math.cos(angle) * distance, y: anchor.y + Math.sin(angle) * distance };
          if (positionBlockedReason(position, node.radius, opts)) continue;
          if (nodes.some(other => other !== node && !rejected.has(other) && overlaps(position, node.radius, other, opts.gap))) continue;
          candidate = position; break;
        }
        if (candidate) break;
      }
      if (candidate) {
        node.screenOffset = { x: candidate.x - anchor.x, y: candidate.y - anchor.y };
        node.position = candidate;
      } else {
        rejected.add(node);
        hidden.push(outputOf(node, 'selection'));
      }
    });
    return nodes.filter(node => !rejected.has(node));
  }

  /**
   * project(marker) -> {x, y, visible?} in CSS pixels or null.
   * options: width, height, radius(marker), gap, padding, reserved rectangles,
   * reservedPadding. Selected markers stay individual and are never merged.
   * The caller retains all source markers and reruns this after camera changes.
   */
  function layout(markers, project, options) {
    const input = Array.isArray(markers) ? markers.filter(Boolean) : [];
    const value = options || {};
    const opts = {
      width: Math.max(0, number(value.width, 0)), height: Math.max(0, number(value.height, 0)),
      gap: Math.max(0, number(value.gap, 8)), padding: Math.max(0, number(value.padding, 8)),
      reservedPadding: Math.max(0, number(value.reservedPadding, 8)),
      radius: typeof value.radius === 'function' ? value.radius : defaultRadius,
      reserved: (Array.isArray(value.reserved) ? value.reserved : []).filter(Boolean).map(rectOf),
    };
    const projector = typeof project === 'function' ? project : () => null;
    let nodes = input.map(nodeOf), passes = 0;
    const hidden = [];
    // Each non-final pass merges at least one pair, so there can be no more
    // passes than input markers. Pairwise merging avoids joining a chain of
    // individually near points into a single continent-wide component.
    while (nodes.length) {
      const visible = [];
      nodes.forEach(node => {
        const reason = blockedReason(node, projector, opts);
        if (reason) hidden.push(outputOf(node, reason)); else visible.push(node);
      });
      nodes = visible;
      if (nodes.length < 2) break;
      const maximum = Math.max(1, ...nodes.map(node => node.radius));
      const cell = Math.max(1, maximum * 2 + opts.gap);
      const buckets = new Map(), paired = new Set(), pairs = new Map();
      let merges = 0;
      nodes.forEach((node, index) => {
        if (node.marker.selected) return;
        const x = Math.floor(node.position.x / cell), y = Math.floor(node.position.y / cell);
        let nearest = null, nearestDistance = Infinity;
        for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
          const candidates = buckets.get((x + dx) + ':' + (y + dy)) || [];
          candidates.forEach(otherIndex => {
            if (paired.has(otherIndex)) return;
            const other = nodes[otherIndex];
            const distance = Math.hypot(node.position.x - other.position.x, node.position.y - other.position.y);
            if (distance < node.radius + other.radius + opts.gap && distance < nearestDistance) {
              nearest = otherIndex; nearestDistance = distance;
            }
          });
        }
        if (nearest !== null) {
          paired.add(index); paired.add(nearest);
          pairs.set(nearest, mergeNodes(nodes[nearest], node)); merges++;
        } else {
          const key = x + ':' + y;
          if (!buckets.has(key)) buckets.set(key, []);
          buckets.get(key).push(index);
        }
      });
      if (!merges) break;
      nodes = nodes.flatMap((node, index) => pairs.has(index) ? [pairs.get(index)] : paired.has(index) ? [] : [node]);
      passes++;
    }
    nodes = avoidSelection(nodes, opts, hidden);
    const result = nodes.map(node => outputOf(node));
    const totalCases = input.reduce((sum, marker) => sum + countOf(marker), 0);
    const hiddenCases = hidden.reduce((sum, marker) => sum + marker.count, 0);
    return { markers: result, hidden, stats: {
      totalCases, inputMarkers: input.length, visibleCases: totalCases - hiddenCases, hiddenCases,
      visibleMarkers: result.length, hiddenMarkers: hidden.length,
      clusters: result.filter(marker => marker.cluster).length,
      points: result.filter(marker => !marker.cluster).length, passes,
    } };
  }

  return { layout, buildLayout: layout, defaultRadius, countOf, rowsOf };
}));
