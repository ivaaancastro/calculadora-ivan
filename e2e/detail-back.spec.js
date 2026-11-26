import { test, expect } from '@playwright/test';
import { setupApp, DETAIL_ACTIVITY_ID } from './support/mockApp.js';
import { gotoReady } from './support/ui.js';

// Regresión: «Volver» del detalle no hacía nada (ActivityRouteWrapper no pasaba `onBack`).
const path = (page) => new URL(page.url()).pathname;
const detailPath = `/activity/${DETAIL_ACTIVITY_ID}`;

test.describe(`Detalle: Volver`, () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page, { authenticated: true });
  });

  // Se entra con un clic real en la app (el router guarda el origen en el historial).
  const openFrom = async (page, origin) => {
    await gotoReady(page, origin);
    if (origin === '/calendar') {
      await page.locator('[data-cal="act"]:not([data-planned])').filter({ visible: true }).first().click();
    } else {
      await page.getByText('Salida larga').filter({ visible: true }).first().click();
    }
    await expect.poll(() => path(page)).toMatch(/^\/activity\//);
    await expect(page.getByRole('button', { name: 'Volver' }).first()).toBeVisible();
  };

  for (const origin of ['/history', '/calendar']) {
    test(`desde ${origin} vuelve a ${origin}`, async ({ page }) => {
      await openFrom(page, origin);
      await page.getByRole('button', { name: 'Volver' }).first().click();
      await expect.poll(() => path(page)).toBe(origin);
    });
  }

  test('por URL directa vuelve a Actividades', async ({ page }) => {
    await page.goto(detailPath);
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Volver' }).first().click();
    await expect.poll(() => path(page)).toBe('/history');
  });
});
