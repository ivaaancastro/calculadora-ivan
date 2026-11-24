import { test, expect } from '@playwright/test';
import { setupApp, DETAIL_ACTIVITY_ID } from './support/mockApp.js';
import { gotoReady, swipeHorizontally } from './support/ui.js';

// Gestos y toques en un teléfono (proyecto `mobile`, 390 px con toque). spec-capa6, RF-A3.
const pathname = (page) => new URL(page.url()).pathname;
const visible = (locator) => locator.filter({ visible: true }).first();

test.beforeEach(async ({ page }) => {
  await setupApp(page, { authenticated: true, ui: 'v2' });
});

test.describe('Gestos: deslizar sobre contenido desplazable no cambia de pestaña', () => {
  test('sobre una gráfica del dashboard', async ({ page }) => {
    await gotoReady(page, '/');
    const chart = page.locator('.recharts-wrapper').first();
    await chart.scrollIntoViewIfNeeded();
    await expect(chart).toBeInViewport();
    await swipeHorizontally(page, chart, -220);
    await page.waitForLoadState('networkidle');
    expect(pathname(page)).toBe('/');
  });

  test('sobre las pestañas del detalle de actividad', async ({ page }) => {
    await gotoReady(page, `/activity/${DETAIL_ACTIVITY_ID}`, '/history');
    const strip = page.locator('.hide-scrollbar').filter({ visible: true }).first();
    await strip.scrollIntoViewIfNeeded();
    await swipeHorizontally(page, strip, -220);
    await page.waitForLoadState('networkidle');
    expect(pathname(page)).toBe(`/activity/${DETAIL_ACTIVITY_ID}`);
  });

  test('control: sobre contenido normal sí cambia de pestaña', async ({ page }) => {
    await gotoReady(page, '/');
    await swipeHorizontally(page, page.locator('main').first(), -250);
    await expect.poll(() => pathname(page)).not.toBe('/');
  });
});

test.describe('Tooltip de gráfica al tocar', () => {
  /** Índices de las gráficas de la pantalla activa (`MobileSwipePager` monta las demás fuera). */
  const activeCharts = (page) =>
    page.evaluate(() =>
      [...document.querySelectorAll('.recharts-wrapper')]
        .map((el, i) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.left >= 0 && r.right <= window.innerWidth ? i : -1;
        })
        .filter((i) => i >= 0),
    );

  for (const c of [
    { name: 'Dashboard', path: '/' },
    { name: 'Salud (Historial)', path: '/health', tab: 'Historial' },
  ]) {
    test(`${c.name}: tocar una gráfica abre su tooltip`, async ({ page }) => {
      await gotoReady(page, c.path);
      if (c.tab) await visible(page.getByRole('button', { name: c.tab, exact: true })).click();
      await expect.poll(async () => (await activeCharts(page)).length).toBeGreaterThan(0);
      const chart = page.locator('.recharts-wrapper').nth((await activeCharts(page))[0]);
      await chart.scrollIntoViewIfNeeded();
      const box = await chart.boundingBox();
      await page.touchscreen.tap(box.x + box.width * 0.6, box.y + box.height * 0.5);
      await expect(chart.locator('.recharts-tooltip-wrapper')).toHaveCSS('visibility', 'visible');
    });
  }
});
