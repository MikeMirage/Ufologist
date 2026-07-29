const { test, expect } = require('@playwright/test');

async function enterAtlas(page) {
  await page.goto('/');
  const enter = page.locator('#landing-skip');
  if (await enter.isVisible()) await enter.click();
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
  test.skip(testInfo.project.name !== 'desktop-chromium');
  await expectNoRuntimeErrors(page, async () => {
    await enterAtlas(page);

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

test('mobile sheets, history, report mode and dirty forms remain coherent', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium');
  await expectNoRuntimeErrors(page, async () => {
    await enterAtlas(page);
    const moreNav = page.locator('#mobile-nav button[data-sheet="mobile-more"]');

    await page.locator('#mobile-nav button[data-sheet="panel-left"]').click();
    await expect(page.locator('#panel-left')).toBeVisible();
    await expect(page.locator('#btn-close-filters')).toBeFocused();
    await expect(page.locator('#panel-left')).toHaveAttribute('aria-modal', 'true');
    expect(await page.locator('#mobile-nav').evaluate(element => element.inert)).toBe(true);
    await page.keyboard.press('Escape');
    await expect(page.locator('#panel-left')).toBeHidden();
    await expect(page.locator('#mobile-nav button[data-sheet="panel-left"]')).toBeFocused();

    await moreNav.click();
    await page.goBack();
    await expect(page.locator('#mobile-more')).toBeHidden();
    await expect(page.locator('#sheet-backdrop')).not.toHaveClass(/show/);

    await moreNav.click();
    await page.locator('#mobile-more [data-act="knowledge"]').click();
    await expect(page.locator('#modal-overlay')).toBeVisible();
    await expect(page.locator('#btn-close-modal')).toBeFocused();
    const modalZ = await page.locator('#modal-overlay').evaluate(element => Number(getComputedStyle(element).zIndex));
    const navZ = await page.locator('#mobile-nav').evaluate(element => Number(getComputedStyle(element).zIndex));
    expect(modalZ).toBeGreaterThan(navZ);
    await page.goBack();
    await expect(page.locator('#modal-overlay')).toBeHidden();
    await expect(moreNav).toBeFocused();

    await moreNav.click();
    await page.locator('#mobile-more [data-act="tour"]').click();
    await expect(page.locator('#tour-card')).toBeVisible();
    await expect(page.locator('#panel-case')).toBeHidden();
    await expect(page.locator('#sheet-backdrop')).not.toHaveClass(/show/);
    await page.keyboard.press('Escape');
    await expect(page.locator('#tour-card')).toBeHidden();

    await moreNav.click();
    await page.locator('#mobile-more [data-act="add"]').click();
    await expect(page.locator('#pick-hint')).toBeVisible();
    await expect(page.locator('#pick-cancel')).toBeFocused();
    await page.evaluate(() => {
      window.__ufologistGlobe.onGlobeClick()({ lat: 40.4168, lng: -3.7038 });
    });
    await expect(page.locator('#sight-overlay')).toBeVisible();
    await expect(page.locator('#sf-name')).toBeFocused();
    await page.locator('#sf-name').fill('Prueba sin guardar');

    page.once('dialog', dialog => dialog.dismiss());
    await page.keyboard.press('Escape');
    await expect(page.locator('#sight-overlay')).toBeVisible();
    page.once('dialog', dialog => dialog.accept());
    await page.keyboard.press('Escape');
    await expect(page.locator('#sight-overlay')).toBeHidden();
    await expect(moreNav).toBeFocused();
  });
});
