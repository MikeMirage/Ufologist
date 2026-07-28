// ============================================================
// process-launches.js — snapshot compacto de lanzamientos (Launch Library 2)
// Cohetes/proveedores (SpaceX incl.), fecha, base (lat/lng), resultado, webcast.
//
// LL2 tiene rate-limit (~15/h sin auth): este script hace pocas peticiones.
// Uso:  node tools/process-launches.js  → data/launches.json
// ============================================================
const fs = require('fs');
const API = 'https://ll.thespacedevs.com/2.2.0/launch';

function compact(r) {
  const pad = r.pad || {};
  return {
    name: r.name || '',
    prov: (r.launch_service_provider && r.launch_service_provider.name) || '',
    rocket: (r.rocket && r.rocket.configuration && (r.rocket.configuration.full_name || r.rocket.configuration.name)) || '',
    net: r.net || '',
    lat: pad.latitude != null ? +pad.latitude : null,
    lng: pad.longitude != null ? +pad.longitude : null,
    padName: pad.name || '',
    status: (r.status && (r.status.abbrev || r.status.name)) || '',
    orbit: (r.mission && r.mission.orbit && r.mission.orbit.name) || '',
    type: (r.mission && r.mission.type) || '',
    url: (r.vidURLs && r.vidURLs[0] && r.vidURLs[0].url) || (r.webcast_live && r.url) || '',
  };
}

async function page(kind, limit) {
  const res = await fetch(`${API}/${kind}/?limit=${limit}&mode=normal&ordering=-net`);
  if (!res.ok) throw new Error(kind + ' HTTP ' + res.status);
  const j = await res.json();
  return (j.results || []).map(compact).filter(r => r.net);
}

(async () => {
  const out = { generated: new Date().toISOString(), source: 'thespacedevs LL2', launches: [] };
  try {
    const prev = await page('previous', 100);
    const up = await page('upcoming', 40);
    // dedupe by name+net
    const seen = new Set();
    out.launches = [...up, ...prev].filter(r => { const k = r.name + r.net; if (seen.has(k)) return false; seen.add(k); return true; });
    console.log('lanzamientos:', out.launches.length, '(', up.length, 'próximos +', prev.length, 'pasados )');
    const withGeo = out.launches.filter(r => r.lat != null).length;
    console.log('con coordenadas de base:', withGeo);
  } catch (e) {
    console.error('LL2 error (rate-limit?):', e.message);
  }
  fs.writeFileSync('data/launches.json', JSON.stringify(out));
  console.log('bytes:', fs.statSync('data/launches.json').size);
})();
