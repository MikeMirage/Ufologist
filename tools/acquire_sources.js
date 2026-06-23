#!/usr/bin/env node
// Adquiere fuentes UFO/UAP externas en data/sources/raw/<source_id>.
//
// Objetivo: dejar evidencia fisica de adquisicion (HTML de indices, PDFs,
// documentos descargables y manifest.json) sin mezclar todavia estos datos
// con el mapa. Los importadores normalizados se construyen encima de esta
// capa cruda.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const RAW_ROOT = path.join(ROOT, 'data', 'sources', 'raw');
const USER_AGENT = 'UFOlogist research crawler (+https://github.com/)';
const MAX_DOWNLOADS_PER_SOURCE = Number(process.env.MAX_DOWNLOADS_PER_SOURCE || 120);

const SOURCES = [
  {
    id: 'uk_mod',
    name: 'UK Ministry of Defence UFO reports',
    strategy: 'page_assets',
    seeds: ['https://www.gov.uk/government/publications/ufo-reports-in-the-uk'],
    downloadPatterns: [/assets\.publishing\.service\.gov\.uk\/.+\.pdf(?:$|\?)/i],
  },
  {
    id: 'spain_defensa',
    name: 'Expedientes OVNI del Ministerio de Defensa',
    strategy: 'crawl_same_host',
    seeds: ['https://bibliotecavirtual.defensa.gob.es/BVMDefensa/exp_ovni/es/consulta/indice_campo.do?campo=idtitulo'],
    crawlLimit: 120,
    downloadPatterns: [/\/download\/.*\.(?:pdf|jpg|jpeg|png)(?:$|\?)/i, /\.(?:pdf)(?:$|\?)/i],
    keepLinkPatterns: [/exp_ovni/i, /consulta/i, /registro/i, /download/i],
  },
  {
    id: 'brazil_an',
    name: 'Arquivo Nacional do Brasil',
    strategy: 'crawl_same_host',
    seeds: ['https://www.gov.br/arquivonacional/pt-br/canais_atendimento/imprensa/copy_of_noticias/conheca-o-fundo-sobre-ovnis-do-arquivo-nacional'],
    crawlLimit: 40,
    downloadPatterns: [/\.(?:pdf|csv|xlsx|zip)(?:$|\?)/i],
    keepLinkPatterns: [/ovn/i, /sian/i, /arquivonacional/i],
  },
  {
    id: 'chile_sefaa',
    name: 'SEFAA / DGAC Chile',
    strategy: 'crawl_same_host',
    seeds: ['https://sefaa.dgac.gob.cl/'],
    crawlLimit: 80,
    downloadPatterns: [/\.(?:pdf|docx?|xlsx?|csv)(?:$|\?)/i],
    keepLinkPatterns: [/casos/i, /sefaa/i, /dgac/i],
  },
  {
    id: 'argentina_ciae',
    name: 'CIAE / Fuerza Aerea Argentina',
    strategy: 'page_assets',
    seeds: ['https://www.argentina.gob.ar/fuerzaaerea/centro-de-identificacion-aeroespacial'],
    downloadPatterns: [/\.(?:pdf|xlsx?|csv)(?:$|\?)/i, /Informe%20resoluci/i, /Informe.*resoluci/i],
  },
  {
    id: 'canada_lac',
    name: 'Library and Archives Canada UFO records',
    strategy: 'crawl_same_host',
    seeds: ['https://www.canada.ca/en/library-archives/collection/research-help/science-technology/ufos.html'],
    crawlLimit: 35,
    downloadPatterns: [/\.(?:pdf|csv|xlsx|zip)(?:$|\?)/i],
    keepLinkPatterns: [/ufo/i, /ovni/i, /collection/i, /archives/i, /recherche/i],
  },
  {
    id: 'nara_uap',
    name: 'NARA UAP Records Collection',
    strategy: 'crawl_same_host',
    seeds: ['https://www.archives.gov/research/topics/uaps', 'https://www.archives.gov/research/topics/uaps/rg-615'],
    crawlLimit: 60,
    downloadPatterns: [/\.(?:pdf|csv|xlsx|zip)(?:$|\?)/i],
    keepLinkPatterns: [/uaps?/i, /catalog\.archives\.gov/i, /bulk/i],
  },
  {
    id: 'aaro',
    name: 'All-domain Anomaly Resolution Office',
    strategy: 'crawl_same_host',
    seeds: ['https://www.aaro.mil/'],
    crawlLimit: 80,
    downloadPatterns: [/\.(?:pdf|mp4|mov|csv|xlsx|zip)(?:$|\?)/i],
    keepLinkPatterns: [/UAP/i, /AARO/i, /Cases/i, /Records/i, /Imagery/i, /EFOIA/i, /Congressional/i],
  },
  {
    id: 'new_zealand_nzdf',
    name: 'New Zealand Defence Force UFO files',
    strategy: 'page_assets',
    seeds: ['https://natlib.govt.nz/records/22979464'],
    downloadPatterns: [/\.(?:pdf|zip)(?:$|\?)/i],
  },
  {
    id: 'denmark_files',
    name: 'Danish UFO Files',
    strategy: 'page_assets',
    seeds: ['https://archive.org/details/DanishUFOFiles'],
    downloadPatterns: [/\/download\/DanishUFOFiles\//i, /\.(?:pdf|zip|txt|xml)(?:$|\?)/i],
  },
  {
    id: 'sweden_afu',
    name: 'Archives for the Unexplained',
    strategy: 'crawl_same_host',
    seeds: ['https://www.afu.se/afu2/?page_id=4778'],
    crawlLimit: 35,
    downloadPatterns: [/\.(?:pdf|zip|xlsx?|csv)(?:$|\?)/i],
    keepLinkPatterns: [/afu/i, /report/i, /archive/i, /ufo/i],
  },
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function slug(input) {
  return String(input)
    .replace(/^https?:\/\//i, '')
    .replace(/[^\w.-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 150) || 'asset';
}

function uniquePath(dir, name) {
  const ext = path.extname(name);
  const base = ext ? name.slice(0, -ext.length) : name;
  let p = path.join(dir, name);
  let i = 2;
  while (fs.existsSync(p)) {
    p = path.join(dir, `${base}-${i}${ext}`);
    i += 1;
  }
  return p;
}

function resolveUrl(href, base) {
  try {
    const decoded = href
      .replace(/&amp;/g, '&')
      .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
    return new URL(decoded, base).href;
  } catch {
    return null;
  }
}

function extractLinks(html, base) {
  const links = new Set();
  const re = /\b(?:href|src)=["']([^"']+)["']/gi;
  let match;
  while ((match = re.exec(html))) {
    const u = resolveUrl(match[1], base);
    if (u && /^https?:\/\//i.test(u)) links.add(u);
  }
  return [...links];
}

function sameHost(a, b) {
  try {
    return new URL(a).host === new URL(b).host;
  } catch {
    return false;
  }
}

function matchesAny(url, patterns = []) {
  return patterns.some(p => p.test(url));
}

async function fetchBuffer(url) {
  const res = await fetch(url, {
    headers: {
      'user-agent': USER_AGENT,
      'accept': '*/*',
    },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const contentType = res.headers.get('content-type') || '';
  const bytes = Buffer.from(await res.arrayBuffer());
  return { finalUrl: res.url, contentType, bytes };
}

async function saveUrl(sourceDir, url, kind, manifest) {
  try {
    const { finalUrl, contentType, bytes } = await fetchBuffer(url);
    const urlPath = new URL(finalUrl).pathname;
    let filename = slug(path.basename(urlPath) || finalUrl);
    if (!path.extname(filename)) {
      if (contentType.includes('html')) filename += '.html';
      else if (contentType.includes('pdf')) filename += '.pdf';
      else if (contentType.includes('json')) filename += '.json';
      else filename += '.bin';
    }
    const dir = path.join(sourceDir, kind);
    ensureDir(dir);
    const out = uniquePath(dir, filename);
    fs.writeFileSync(out, bytes);
    const entry = {
      url,
      final_url: finalUrl,
      kind,
      file: path.relative(ROOT, out),
      bytes: bytes.length,
      content_type: contentType,
      acquired_at: new Date().toISOString(),
    };
    manifest.assets.push(entry);
    return { ok: true, entry, text: contentType.includes('html') ? bytes.toString('utf8') : null };
  } catch (err) {
    manifest.errors.push({ url, kind, error: err.message, at: new Date().toISOString() });
    return { ok: false, error: err };
  }
}

async function acquireSource(source) {
  const sourceDir = path.join(RAW_ROOT, source.id);
  ensureDir(sourceDir);
  const manifest = {
    id: source.id,
    name: source.name,
    strategy: source.strategy,
    seeds: source.seeds,
    assets: [],
    discovered_links: [],
    errors: [],
    started_at: new Date().toISOString(),
  };

  const queue = [...source.seeds];
  const seen = new Set();
  const downloaded = new Set();
  const crawlLimit = source.crawlLimit || source.seeds.length;

  while (queue.length && seen.size < crawlLimit) {
    const url = queue.shift();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    const saved = await saveUrl(sourceDir, url, 'pages', manifest);
    if (!saved.ok || !saved.text) continue;

    const links = extractLinks(saved.text, saved.entry.final_url);
    for (const link of links) {
      if (!manifest.discovered_links.includes(link)) manifest.discovered_links.push(link);
      const shouldDownload = matchesAny(link, source.downloadPatterns);
      if (shouldDownload && !downloaded.has(link) && downloaded.size < MAX_DOWNLOADS_PER_SOURCE) {
        downloaded.add(link);
        await saveUrl(sourceDir, link, 'downloads', manifest);
      }
      if (source.strategy === 'crawl_same_host') {
        const keep = sameHost(link, saved.entry.final_url) && (
          !source.keepLinkPatterns || matchesAny(link, source.keepLinkPatterns)
        );
        const looksPage = !/\.(?:jpg|jpeg|png|gif|webp|svg|css|js|ico|pdf|mp4|mov|zip)(?:$|\?)/i.test(link);
        if (keep && looksPage && !seen.has(link) && queue.length + seen.size < crawlLimit) queue.push(link);
      }
    }
  }

  manifest.finished_at = new Date().toISOString();
  manifest.page_count = manifest.assets.filter(a => a.kind === 'pages').length;
  manifest.download_count = manifest.assets.filter(a => a.kind === 'downloads').length;
  manifest.discovered_count = manifest.discovered_links.length;
  fs.writeFileSync(path.join(sourceDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  return manifest;
}

async function main() {
  ensureDir(RAW_ROOT);
  const selectedArg = process.argv.find(a => a.startsWith('--only='));
  const selected = selectedArg ? new Set(selectedArg.slice('--only='.length).split(',').map(s => s.trim())) : null;
  const results = [];
  for (const source of SOURCES) {
    if (selected && !selected.has(source.id)) continue;
    console.log(`== ${source.id} ==`);
    const manifest = await acquireSource(source);
    results.push({
      id: manifest.id,
      pages: manifest.page_count,
      downloads: manifest.download_count,
      links: manifest.discovered_count,
      errors: manifest.errors.length,
    });
    console.log(`${manifest.page_count} pages, ${manifest.download_count} downloads, ${manifest.errors.length} errors`);
  }
  fs.writeFileSync(path.join(RAW_ROOT, 'acquisition-summary.json'), JSON.stringify({
    generated_at: new Date().toISOString(),
    max_downloads_per_source: MAX_DOWNLOADS_PER_SOURCE,
    results,
  }, null, 2));
  console.table(results);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
