import { test, expect } from '@playwright/test';
import {
  setupApp,
  DETAIL_ACTIVITY_ID,
  OLD_POLYLINE_ACTIVITY_ID,
  OLD_STREAMS_ACTIVITY_ID,
} from './support/mockApp.js';
import { gotoReady } from './support/ui.js';

// BUG-13 (RF-C0): el detalle no pintaba mapa al entrar por URL directa ni en actividades
// de hace más de 95 días (los streams solo llegaban en segundo plano para ese rango).
const tab = (page, name) => page.getByRole('button', { name, exact: true }).filter({ visible: true });

async function expectMap(page) {
  const map = page.locator('.leaflet-container').filter({ visible: true }).first();
  await expect(map).toBeVisible();
  await expect.poll(async () => {
    const box = await map.boundingBox();
    return box ? Math.min(box.width, box.height) : 0;
  }).toBeGreaterThan(0);
  await expect(map.locator('.leaflet-overlay-pane path').first()).toBeAttached();
  await expect.poll(() => map.locator('.leaflet-overlay-pane path').first().getAttribute('d')).toMatch(/\d/);
}

test.describe('Detalle: mapa (v2)', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page, { authenticated: true });
  });

  const cases = [
    { name: 'por URL directa (actividad reciente)', id: DETAIL_ACTIVITY_ID },
    { name: 'actividad de hace más de 95 días con solo map_polyline', id: OLD_POLYLINE_ACTIVITY_ID },
    { name: 'actividad de hace más de 95 días con streams en Supabase', id: OLD_STREAMS_ACTIVITY_ID },
  ];

  for (const { name, id } of cases) {
    test(name, async ({ page }) => {
      await gotoReady(page, `/activity/${id}`);
      await expectMap(page);
      // Pestaña Mapa del detalle.
      await tab(page, 'Mapa').first().click();
      await expectMap(page);
    });
  }

  test('las teselas siguen al tema activo', async ({ page }) => {
    await gotoReady(page, `/activity/${DETAIL_ACTIVITY_ID}`);
    const tile = page.locator('.leaflet-container').filter({ visible: true }).first().locator('img.leaflet-tile').first();
    await expect(tile).toHaveAttribute('src', /World_Light_Gray_Base/);
    await page.getByRole('button', { name: 'Cambiar tema' }).click();
    await expect(tile).toHaveAttribute('src', /World_Dark_Gray_Base/);
  });

  test('pide solo los streams de la actividad abierta', async ({ page }) => {
    const perId = page.waitForRequest(
      (r) => r.url().includes('select=streams_data') && r.url().includes(`id=eq.${OLD_STREAMS_ACTIVITY_ID}`),
    );
    await gotoReady(page, `/activity/${OLD_STREAMS_ACTIVITY_ID}`);
    await perId;
    // Con los streams llegan las gráficas.
    await expect(page.locator('.recharts-wrapper').filter({ visible: true }).first()).toBeVisible();
  });
});
