#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const index = read('index.html');
const app = read('js/app.js');
const community = read('js/community.js');
const forum = read('js/forum.js');
const setup = read('docs/forum-setup.md');
const releaseChecklist = read('docs/forum-release-checklist.md');
const launchTopics = read('docs/forum-launch-topics.md');
const communicationStrategy = read('docs/community-communication-strategy.md');
const seedContent = read('docs/forum-seed-content.md');

assert.match(index, /id="btn-forum"/, 'Desktop community entry is missing');
assert.match(index, /data-act="forum"/, 'Mobile community entry is missing');
assert.match(index, /js\/app\.js\?v=67/, 'App cache version was not bumped');
assert.match(index, /js\/community\.js\?v=2/, 'Community catalog is not loaded');
assert.match(index, /js\/forum\.js\?v=7/, 'Forum cache version was not bumped');
assert.match(index, /css\/styles\.css\?v=43/, 'CSS cache version was not bumped');

assert.match(app, /navCommunity:\s*'Comunidad'/, 'Spanish community label is missing');
assert.match(app, /navCommunity:\s*'Community'/, 'English community label is missing');
assert.match(app, /forum:\s*'btn-forum'/, 'Mobile community action is not wired');
assert.match(app, /UFOForum\.reviewPrivateCase/, 'Private notebook review gate is not wired');
assert.match(app, /country:\s*caseCountry\(c\)/, 'Case context is not passed to community recommendations');
assert.match(app, /new CustomEvent\('ufologist:themechange'/, 'Theme changes are not announced');
assert.doesNotMatch(
  app,
  /#mobile-more \.more-grid:(?:first|nth)-of-type/,
  'Mobile labels still depend on brittle :*-of-type selectors',
);

const postedMessages = [];
const listeners = {};
const context = {
  addEventListener(name, handler) { listeners[name] = handler; },
  document: {
    documentElement: { getAttribute: () => 'dark' },
    getElementById: () => null,
    querySelector: selector => selector === '#forum-modal iframe.giscus-frame'
      ? { contentWindow: { postMessage: (message, origin) => postedMessages.push({ message, origin }) } }
      : null,
  },
};
context.globalThis = context;
vm.runInNewContext(community, context, { filename: 'js/community.js' });
vm.runInNewContext(forum, context, { filename: 'js/forum.js' });

assert.equal(
  context.UFOCommunityCatalog.boards.length,
  20,
  'Community catalog must expose exactly 20 subforums',
);
assert.equal(
  new Set(context.UFOCommunityCatalog.boards.map(board => board.slug)).size,
  20,
  'Community subforum slugs must be unique',
);
assert.ok(
  context.UFOCommunityCatalog.boards.every(board => board.references.length >= 2),
  'Every subforum must include at least two references',
);
const focusBoards = context.UFOCommunityCatalog.boards.filter(board => board.editorialFocus);
assert.equal(focusBoards.length, 8, 'Exactly eight subforums must receive the initial editorial focus');
assert.ok(
  focusBoards.every(board => board.mission && board.mission.es && board.mission.en),
  'Every editorial-focus subforum must expose a bilingual active mission',
);
assert.ok(context.UFOForum, 'UFOForum API was not exported');
assert.equal(context.UFOForum.isEnabled(), true, 'Giscus configuration is incomplete');
assert.equal(
  context.UFOForum._caseTerm('roswell-1947'),
  'case:roswell-1947',
  'Case mapping is not stable',
);
assert.match(
  context.UFOForum._threadUrl('case:roswell-1947'),
  /category%3ACasos/,
  'Fallback URL does not keep the case category',
);
assert.equal(
  typeof context.UFOForum.reviewPrivateCase,
  'function',
  'Private notebook review API is missing',
);
assert.equal(
  typeof context.UFOForum.openBoard,
  'function',
  'Integrated subforum navigation API is missing',
);
assert.match(forum, /function relatedBoards\(context\)/, 'Contextual subforum recommendations are missing');
assert.equal(
  typeof context.UFOForum.syncTheme,
  'function',
  'Giscus theme synchronization API is missing',
);
context.UFOForum.syncTheme('light');
assert.equal(
  JSON.stringify(postedMessages),
  JSON.stringify([{
    message: { giscus: { setConfig: { theme: 'light' } } },
    origin: 'https://giscus.app',
  }]),
  'Theme changes are not sent safely to the Giscus origin',
);
assert.equal(
  typeof listeners['ufologist:themechange'],
  'function',
  'Forum does not subscribe to application theme changes',
);

assert.match(setup, /revisión de privacidad/, 'Privacy behavior is not documented');
assert.match(setup, /forum-release-checklist\.md/, 'Release checklist is not linked');
assert.match(
  setup,
  /community-communication-strategy\.md/,
  'Communication and engagement strategy is not linked',
);
assert.match(releaseChecklist, /390 px/, 'Mobile acceptance check is missing');
assert.match(releaseChecklist, /8 y 12 temas iniciales/, 'Seed-content launch gate is missing');
assert.match(
  releaseChecklist,
  /aportaciones verificables por participante activo/,
  'Engagement quality metric is missing from the release checklist',
);
assert.match(
  communicationStrategy,
  /Las 20 categorías deben existir/,
  'The 20-category availability strategy is missing',
);
assert.match(
  communicationStrategy,
  /solo ocho deben \*\*activarse editorialmente\*\*/,
  'The initial editorial concentration strategy is missing',
);
assert.match(
  communicationStrategy,
  /community_hub_open/,
  'Community analytics taxonomy is missing',
);
assert.match(
  communicationStrategy,
  /## 19\. Plan de lanzamiento en tres fases/,
  'The 90-day communication launch plan is missing',
);
assert.match(
  releaseChecklist,
  /forum-seed-content\.md/,
  'The publication-ready seed package is not linked from the release checklist',
);
assert.equal(
  [...seedContent.matchAll(/^## \d{2}\./gm)].length,
  12,
  'The initial seed package must contain exactly 12 publication-ready topics',
);
assert.equal(
  [...seedContent.matchAll(/^\*\*Categoría:\*\*/gm)].length,
  12,
  'Every seed topic must declare its destination category',
);
assert.ok(
  [...seedContent.matchAll(/^### Primera respuesta del equipo$/gm)].length >= 10,
  'Seed topics must include a planned first response',
);

const formDir = path.join(root, '.github', 'DISCUSSION_TEMPLATE');
const forms = fs.readdirSync(formDir).filter(file => file.endsWith('.yml'));
assert.equal(forms.length, 20, 'Exactly 20 GitHub Discussion forms must be generated');
for (const board of context.UFOCommunityCatalog.boards) {
  assert.ok(forms.includes(`${board.slug}.yml`), `Missing Discussion form for ${board.slug}`);
  if (board.editorialFocus) {
    assert.match(
      read(path.join('.github', 'DISCUSSION_TEMPLATE', `${board.slug}.yml`)),
      /Misión activa:/,
      `Active mission is missing from the ${board.slug} Discussion form`,
    );
  }
}

const boardNames = new Set(context.UFOCommunityCatalog.boards.map(board => board.name.es));
const launchCategories = [...launchTopics.matchAll(/\*\*Categoría:\*\*\s+(.+?)\s*$/gm)].map(match => match[1]);
assert.equal(launchCategories.length, 60, 'Launch catalog must contain 60 categorized topics');
for (const category of launchCategories) {
  assert.ok(boardNames.has(category), `Launch topic uses unknown category: ${category}`);
}

console.log('Forum integration checks passed.');
