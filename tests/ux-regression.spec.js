const { test, expect } = require('@playwright/test');

async function enterAtlas(page) {
  await page.goto('/globe.html');
  const enter = page.locator('#landing-skip');
  // The landing can finish automatically between the visibility check and
  // the click. Force-dispatching keeps this helper atomic through that fade.
  if (await enter.isVisible()) await enter.click({ force: true });
  await page.waitForFunction(() => document.querySelector('#loading')?.classList.contains('hidden'));
}

async function expectNoRuntimeErrors(page, run) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && !message.text().includes('sw.js')) errors.push(message.text());
  });
  await run();
  expect(errors).toEqual([]);
}

test('desktop layers, keyboard search and tour remain coherent', async ({ page }, testInfo) => {
  test.setTimeout(75_000);
  test.skip(testInfo.project.name !== 'desktop-chromium');
  await expectNoRuntimeErrors(page, async () => {
    await enterAtlas(page);

    const topbarOrder = await page.locator('.topbar-actions button').evaluateAll(buttons =>
      buttons.map(button => button.id));
    expect(topbarOrder).toEqual([
      'btn-stats',
      'btn-knowledge',
      'btn-forum',
      'btn-add',
      'btn-tour',
      'btn-about',
      'btn-pass',
    ]);
    await expect(page.locator('nav.topbar-actions')).toHaveAttribute('aria-label', 'Navegación principal');
    await expect(page.locator('.topbar-action-group')).toHaveCount(4);
    await expect(page.locator('#btn-add')).toHaveClass(/btn-primary-action/);

    await page.locator('#btn-knowledge').click();
    await expect(page.locator('#modal-overlay')).toBeVisible();
    await expect(page.locator('#btn-close-modal')).toBeFocused();
    await expect(page.locator('#modal')).toHaveAttribute('aria-modal', 'true');
    await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
    expect(await page.locator('#topbar').evaluate(element => element.inert)).toBe(true);
    await page.keyboard.press('Shift+Tab');
    expect(await page.locator('#modal').evaluate(element => element.contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(page.locator('#modal-overlay')).toBeHidden();
    await expect(page.locator('#btn-knowledge')).toBeFocused();
    expect(await page.locator('body').evaluate(element => element.style.overflow)).toBe('');
    expect(await page.locator('body').evaluate(element => element.hasAttribute('data-ui-scroll-locked'))).toBe(false);

    await page.locator('#search').fill('Roswell');
    await expect(page.locator('#search-results .sr-item[data-id]').first()).toBeVisible();
    await page.locator('#search').press('ArrowDown');
    await expect(page.locator('#search-results .sr-item[data-id]').first()).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#panel-case')).toBeVisible();
    await expect(page.locator('#btn-close-case')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('#search')).toBeFocused();

    await page.locator('#btn-collapse-left').click();
    await expect(page.locator('#btn-expand-left')).toBeFocused();
    await page.locator('#btn-expand-left').click();
    await expect(page.locator('#btn-collapse-left')).toBeFocused();
    const firstPill = page.locator('#shape-filters .shape-pill').first();
    await firstPill.focus();
    const checkedBefore = await firstPill.getAttribute('aria-checked');
    await page.keyboard.press('Space');
    expect(await firstPill.getAttribute('aria-checked')).not.toBe(checkedBefore);
    await expect(page.locator('#handle-min')).toHaveAttribute('role', 'slider');
    await expect(page.locator('#handle-min')).toHaveAttribute('aria-valuenow', /\d{4}/);

    await page.locator('#btn-tour').click();
    await expect(page.locator('#tour-card')).toBeVisible();
    await expect(page.locator('#panel-case')).toBeVisible();
    await expect(page.locator('#tour-close')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('#tour-card')).toBeHidden();
    await expect(page.locator('#panel-case')).toBeHidden();
    await expect(page.locator('#btn-tour')).toBeFocused();

    await page.emulateMedia({ reducedMotion: 'reduce' });
    const transitionSeconds = await page.locator('#panel-left').evaluate(element =>
      parseFloat(getComputedStyle(element).transitionDuration));
    expect(transitionSeconds).toBeLessThan(.001);
  });
});

test('community exposes 20 boards with canonical GitHub category links', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  await expectNoRuntimeErrors(page, async () => {
    await enterAtlas(page);
    const catalog = await page.evaluate(() => window.UFOCommunityCatalog);
    expect(catalog.boards).toHaveLength(20);
    expect(new Set(catalog.boards.map(board => board.id)).size).toBe(20);

    const categoryUrls = await page.evaluate(() =>
      window.UFOCommunityCatalog.boards.map(board => window.UFOForum._categoryUrl(board)));
    expect(categoryUrls).toHaveLength(20);
    categoryUrls.forEach(url => {
      const query = new URL(url).searchParams.get('discussions_q');
      expect(query).toMatch(/^is:open category:".+"$/);
      expect(query).not.toMatch(/category:[a-z0-9-]+$/);
    });

    await page.evaluate(() => window.UFOForum.openBoard('astronomia-y-satelites'));
    const boardLink = page.locator('.forum-board-detail .forum-gh-link');
    await expect(boardLink).toBeVisible();
    const href = await boardLink.getAttribute('href');
    expect(new URL(href).searchParams.get('discussions_q'))
      .toBe('is:open category:"Astronomía y satélites"');
  });
});

test('satellite mode remaps every primary information action to the space domain', async ({ page }, testInfo) => {
  test.setTimeout(75_000);
  test.skip(testInfo.project.name !== 'desktop-chromium');
  await expectNoRuntimeErrors(page, async () => {
    await page.route('https://celestrak.org/**', route => route.fulfill({ status: 200, body: '' }));
    await enterAtlas(page);
    await page.locator('#btn-view-orbit').click();
    await expect(page.locator('body')).toHaveAttribute('data-view-mode', 'satellites');
    await page.waitForFunction(() => window.UFOSat?._vg?.()?.sats?.length > 0);

    const labels = await page.locator('.topbar-actions button').evaluateAll(buttons =>
      Object.fromEntries(buttons.slice(0, 5).map(button => [button.id, button.textContent.trim()])));
    expect(labels).toEqual({
      'btn-stats': '⌁ Análisis orbital',
      'btn-knowledge': '◎ Atlas espacial',
      'btn-forum': '☷ Comunidad espacial',
      'btn-add': '+ Reportar dato',
      'btn-tour': '⌖ Expedición espacial',
    });

    await page.locator('#btn-stats').click();
    await expect(page.locator('#stats-title')).toContainText('Análisis orbital');
    await expect(page.locator('#stats-content')).toContainText('Por régimen orbital');
    await page.locator('#btn-close-stats').click();

    await page.locator('#btn-knowledge').click();
    await expect(page.locator('#modal-tabs [data-tab="structures"]')).toHaveText('Estructuras');
    await expect(page.locator('#modal-tabs [data-tab="operators"]')).toHaveText('Organizaciones');
    await expect(page.locator('#modal-body')).toContainText('Qué hemos construido en el espacio');
    await page.keyboard.press('Escape');

    await page.locator('#btn-add').click();
    await expect(page.locator('#modal-overlay')).toBeVisible();
    await expect(page.locator('#modal-tabs [data-tab="report"]')).toHaveClass(/active/);
    await expect(page.locator('#modal-body')).toContainText('Reportar una observación o un problema orbital');
    await page.keyboard.press('Escape');
    await expect(page.locator('#pick-hint')).toBeHidden();

    await page.locator('#btn-forum').click();
    await expect(page.locator('.forum-board-detail h2')).toHaveText('Astronomía y satélites');
    await page.locator('.forum-modal-close').click();

    const catalogCount = await page.evaluate(() => window.UFOSat._vg().pointSats.length);
    await page.locator('#btn-tour').click();
    await expect(page.locator('#tour-card')).toBeVisible();
    await expect(page.locator('body')).toHaveClass(/sat-expedition-active/);
    await expect(page.locator('#tour-title')).toContainText('Sputnik 1');
    expect(await page.evaluate(() => window.UFOSat._vg().pointSats.length)).toBe(catalogCount);
    expect(await page.evaluate(() => Boolean(window.UFOSat._vg().followMarkerObj))).toBe(true);
    await page.locator('#tour-next').click();
    await expect(page.locator('#tour-title')).toContainText('TIROS-1');
    for (let i = 0; i < 4; i++) await page.locator('#tour-next').click();
    await expect(page.locator('#tour-title')).toContainText('Hubble');
    await expect(page.locator('#sat-detail')).toContainText('HST');
    expect(await page.evaluate(() => {
      const target = window.__ufologistGlobe.controls().target;
      return Math.hypot(target.x, target.y, target.z) > 100;
    })).toBe(true);
    await page.keyboard.press('Escape');
    await expect(page.locator('body')).not.toHaveClass(/sat-expedition-active/);

    await page.locator('#btn-view-earth').click();
    await expect(page.locator('#btn-knowledge')).toHaveText('◎ Conocimiento');
    await page.locator('#btn-add').click();
    await expect(page.locator('#pick-hint')).toBeVisible();
  });
});

test('portrait phone clearly requests landscape orientation', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium');
  await expectNoRuntimeErrors(page, async () => {
    await page.goto('/globe.html');
    await expect(page.locator('#orientation-gate')).toBeVisible();
    await expect(page.locator('#orientation-title')).toContainText('Gira el dispositivo');
    await expect(page.locator('#orientation-gate')).toHaveCSS('position', 'fixed');
    const gate = await page.locator('#orientation-gate').boundingBox();
    expect(gate.width).toBe(390);
    expect(gate.height).toBe(844);
  });
});

test('light theme persists and keeps layered UI legible', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  await expectNoRuntimeErrors(page, async () => {
    await enterAtlas(page);
    await page.locator('#btn-theme').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('#btn-theme')).toHaveAttribute('aria-pressed', 'true');

    await page.locator('#btn-knowledge').click();
    await expect(page.locator('#modal-overlay')).toBeVisible();
    const contrast = await page.locator('#modal').evaluate(element => {
      const style = getComputedStyle(element);
      const text = getComputedStyle(element.querySelector('h2') || element).color;
      return { background: style.backgroundColor, text };
    });
    expect(contrast.background).not.toBe(contrast.text);
    await page.keyboard.press('Escape');

    await page.reload();
    await page.waitForFunction(() => document.querySelector('#loading')?.classList.contains('hidden'));
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('#btn-theme')).toHaveAttribute('aria-pressed', 'true');
  });
});

test('tablet layout preserves access to primary controls and panels', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'tablet-chromium');
  await expectNoRuntimeErrors(page, async () => {
    await enterAtlas(page);
    await expect(page.locator('body')).not.toHaveClass(/is-mobile/);
    await expect(page.locator('#panel-left')).toBeVisible();
    await expect(page.locator('#timeline')).toBeVisible();
    await expect(page.locator('#mobile-nav')).toBeHidden();
    await expect(page.locator('#btn-knowledge')).toBeVisible();

    const overflow = await page.locator('#topbar').evaluate(element =>
      element.scrollWidth > element.clientWidth);
    expect(overflow).toBe(false);
    await page.locator('#btn-knowledge').click();
    await expect(page.locator('#modal-overlay')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#btn-knowledge')).toBeFocused();
  });
});

test('landscape phone preserves the desktop flow in a compact touch layout', async ({ page }, testInfo) => {
  test.setTimeout(75_000);
  test.skip(testInfo.project.name !== 'mobile-landscape-chromium');
  await expectNoRuntimeErrors(page, async () => {
    await page.route('https://celestrak.org/**', route => route.fulfill({ status: 200, body: '' }));
    await enterAtlas(page);
    await expect(page.locator('body')).toHaveClass(/is-compact-landscape/);
    await expect(page.locator('#orientation-gate')).toBeHidden();
    await expect(page.locator('#mobile-nav')).toBeHidden();
    await expect(page.locator('.topbar-actions')).toBeVisible();
    await expect(page.locator('#panel-left')).toBeVisible();
    await expect(page.locator('#timeline')).toBeVisible();

    const overflow = await page.locator('#topbar').evaluate(element => element.scrollWidth > element.clientWidth);
    expect(overflow).toBe(false);
    const topTargets = await page.locator('.topbar-actions .btn-ghost').evaluateAll(buttons =>
      buttons.map(button => ({ width: button.getBoundingClientRect().width, height: button.getBoundingClientRect().height })));
    topTargets.forEach(target => {
      expect(target.width).toBeGreaterThanOrEqual(40);
      expect(target.height).toBeGreaterThanOrEqual(40);
    });

    await page.locator('#btn-knowledge').click();
    await expect(page.locator('#modal-overlay')).toBeVisible();
    const modal = await page.locator('#modal').boundingBox();
    expect(modal.height).toBeLessThanOrEqual(390);
    expect(modal.width).toBeLessThanOrEqual(844);
    await page.keyboard.press('Escape');

    await page.locator('#btn-stats').click();
    await expect(page.locator('#panel-stats')).toBeVisible();
    await expect(page.locator('#panel-stats')).not.toHaveAttribute('aria-modal', 'true');
    await page.locator('#btn-close-stats').click();

    await page.locator('#btn-view-orbit').click();
    await page.waitForFunction(() => window.UFOSat?._vg?.()?.sats?.length > 0);
    await expect(page.locator('#sat-panel')).toBeVisible();
    await page.locator('#btn-tour').click();
    await expect(page.locator('#tour-card')).toBeVisible();
    await expect(page.locator('#sat-detail')).toBeVisible();
    expect(await page.evaluate(() => Boolean(window.UFOSat._vg().followMarkerObj))).toBe(true);
    await page.keyboard.press('Escape');
  });
});

test('breakpoint changes close transient layers without stranding focus', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  await expectNoRuntimeErrors(page, async () => {
    await enterAtlas(page);
    await page.locator('#btn-knowledge').click();
    await page.setViewportSize({ width: 844, height: 390 });
    await expect(page.locator('body')).toHaveClass(/is-mobile/);
    await expect(page.locator('body')).toHaveClass(/is-compact-landscape/);
    await expect(page.locator('#modal-overlay')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#modal-overlay')).toBeHidden();
    await expect(page.locator('#mobile-nav')).toBeHidden();
    await expect(page.locator('#panel-left')).toBeVisible();
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.locator('body')).not.toHaveClass(/is-mobile/);
    await expect(page.locator('#mobile-nav')).toBeHidden();
    await expect(page.locator('#sheet-backdrop')).not.toHaveClass(/show/);
    await expect(page.locator('#panel-left')).toBeVisible();
    await expect(page.locator('#timeline')).toBeVisible();
    expect(await page.locator('#topbar').evaluate(element => element.inert)).toBe(false);
  });
});
