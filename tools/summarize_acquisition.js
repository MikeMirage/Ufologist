#!/usr/bin/env node
// Genera un resumen verificable de lo adquirido en data/sources/raw.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const RAW_ROOT = path.join(ROOT, 'data', 'sources', 'raw');

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function dirSize(files) {
  return files.reduce((sum, file) => sum + fs.statSync(file).size, 0);
}

function sourceSummary(id) {
  const dir = path.join(RAW_ROOT, id);
  const files = walk(dir);
  const pages = files.filter(f => f.includes(`${path.sep}pages${path.sep}`));
  const downloads = files.filter(f => f.includes(`${path.sep}downloads${path.sep}`));
  const manifestPath = path.join(dir, 'manifest.json');
  let manifest = null;
  if (fs.existsSync(manifestPath)) manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  return {
    id,
    files: files.length,
    pages: pages.length,
    downloads: downloads.length,
    bytes: dirSize(files),
    manifest_errors: manifest?.errors?.length || 0,
    manifest_present: !!manifest,
    sample_downloads: downloads.slice(0, 8).map(f => path.relative(ROOT, f)),
  };
}

function main() {
  const ids = fs.readdirSync(RAW_ROOT, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort();
  const sources = ids.map(sourceSummary);
  const summary = {
    generated_at: new Date().toISOString(),
    raw_root: path.relative(ROOT, RAW_ROOT),
    sources,
  };
  fs.writeFileSync(path.join(RAW_ROOT, 'disk-summary.json'), JSON.stringify(summary, null, 2));
  console.table(sources.map(s => ({
    id: s.id,
    pages: s.pages,
    downloads: s.downloads,
    files: s.files,
    mb: +(s.bytes / 1024 / 1024).toFixed(1),
    manifest: s.manifest_present,
    errors: s.manifest_errors,
  })));
}

main();
