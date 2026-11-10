import { test, expect } from '@playwright/test';
import { setupApp } from './support/mockApp.js';
import { gotoReady } from './support/ui.js';

// Tooltip de gráfica al tocar (spec-rediseno-02-c2, 3.5). Fija el comportamiento actual en un
// teléfono (proyecto `mobile`, con toque): tocar una gráfica de la pantalla activa abre su tooltip.
const visible = (locator) => locator.filter({ visible: true }).first();

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

async function tapAndExpectTooltip(page, index) {
  const chart = page.locator('.recharts-wrapper').nth(index);
  await chart.scrollIntoViewIfNeeded();
  const box = await chart.boundingBox();
  await expect(chart.locator('.recharts-tooltip-wrapper')).not.toHaveCSS('visibility', 'visible');
  await page.touchscreen.tap(box.x + box.width * 0.6, box.y + box.height * 0.5);
  await expect(chart.locator('.recharts-tooltip-wrapper')).toHaveCSS('visibility', 'visible');
}

const CASES = [
  { name: 'Dashboard', path: '/', min: 1 },
  {
    name: 'Salud (Historial)',
    path: '/health',
    min: 1,
    before: async (page) => {
      await visible(page.getByRole('button', { name: 'Historial', exact: true })).click();
      await page.waitForTimeout(1500); // animación de entrada de la gráfica
    },
  },
  {
    name: 'Rendimiento (Todos)',
    path: '/stats',
    min: 4,
    before: (page) => visible(page.getByRole('button', { name: 'Todos', exact: true })).click(),
  },
];

test.describe('Tooltip de gráfica al tocar', () => {
  for (const c of CASES) {
    test(`${c.name}: tocar una gráfica abre su tooltip`, async ({ page }) => {
      await setupApp(page, { authenticated: true });
      await gotoReady(page, c.path);
      if (c.before) await c.before(page);
      const charts = await activeCharts(page);
      expect(charts.length).toBeGreaterThanOrEqual(c.min);
      for (const i of charts) await tapAndExpectTooltip(page, i);
    });
  }
});

// InfoTooltip (D4 d): antes solo se abría con el ratón; ahora, también al tocarlo.
test.describe('InfoTooltip al tocar', () => {
  test('Rendimiento (Todos): tocar el icono abre la burbuja y tocar fuera la cierra', async ({ page }) => {
    await setupApp(page, { authenticated: true });
    await gotoReady(page, '/stats');
    await visible(page.getByRole('button', { name: 'Todos', exact: true })).click();
    const icon = visible(page.locator('div.group.cursor-help'));
    const bubble = icon.locator('[role=tooltip]');
    await icon.scrollIntoViewIfNeeded();
    await expect(bubble).toHaveCSS('visibility', 'hidden');

    const box = await icon.boundingBox();
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    await expect(bubble).toHaveCSS('visibility', 'visible');
    await expect(bubble).toHaveCSS('opacity', '1');

    await page.touchscreen.tap(5, 300);
    await expect(bubble).toHaveCSS('visibility', 'hidden');
  });
});
