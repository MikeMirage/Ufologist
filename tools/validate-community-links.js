#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js', 'community.js'), 'utf8');
const context = {};
context.globalThis = context;
vm.runInNewContext(source, context, { filename: 'js/community.js' });

const catalog = context.UFOCommunityCatalog;
if (!catalog || !Array.isArray(catalog.boards)) {
  throw new Error('Community catalog is unavailable.');
}
if (catalog.boards.length !== 20) {
  throw new Error(`Expected 20 community boards, found ${catalog.boards.length}.`);
}

const ids = new Set();
const references = new Map();
for (const board of catalog.boards) {
  if (!board.id || ids.has(board.id)) throw new Error(`Duplicate or missing board id: ${board.id}`);
  ids.add(board.id);

  const template = path.join(root, '.github', 'DISCUSSION_TEMPLATE', `${board.slug}.yml`);
  if (!fs.existsSync(template)) throw new Error(`Missing discussion form: ${board.slug}.yml`);
  if (!board.name?.es || !board.description?.es || board.references.length < 2) {
    throw new Error(`Incomplete community context for ${board.id}.`);
  }
  for (const reference of board.references) {
    const parsed = new URL(reference.url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error(`Unsupported reference URL for ${board.id}: ${reference.url}`);
    }
    if (parsed.hostname === 'github.com' && parsed.pathname.includes('/blob/main/')) {
      throw new Error(`GitHub reference uses the wrong default branch: ${reference.url}`);
    }
    if (!references.has(reference.url)) references.set(reference.url, []);
    references.get(reference.url).push(board.id);
  }
}

async function checkRemote(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    let response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'UFOlogist-community-link-check/1.0' },
    });
    if (response.status === 405 || response.status >= 500) {
      response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'user-agent': 'UFOlogist-community-link-check/1.0' },
      });
    }
    // Some institutional sites reject automated HEAD requests while remaining
    // publicly reachable in a browser. Only a missing resource is a hard
    // failure; authentication/anti-bot responses are reported as reachable.
    return {
      ok: response.status < 400 || response.status === 401 || response.status === 403,
      status: response.status,
      finalUrl: response.url,
    };
  } catch (error) {
    return { ok: false, status: 'ERR', finalUrl: '', error: error.message };
  } finally {
    clearTimeout(timeout);
  }
}

async function validateRemote() {
  const queue = [...references.keys()];
  const failures = [];
  async function worker() {
    while (queue.length) {
      const url = queue.shift();
      const result = await checkRemote(url);
      if (!result.ok) failures.push({ url, boards: references.get(url), ...result });
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker));
  if (failures.length) {
    failures.forEach(failure => {
      console.error(`${failure.status} ${failure.url} [${failure.boards.join(', ')}]`);
    });
    process.exitCode = 1;
    return;
  }
  console.log(`Validated ${references.size} unique external references.`);
}

console.log(`Validated ${catalog.boards.length} boards and their discussion forms.`);
if (process.argv.includes('--remote')) validateRemote();
