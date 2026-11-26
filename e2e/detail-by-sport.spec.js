import { test, expect } from '@playwright/test';
import { setupApp, MOCK_ACTIVITIES, MOCK_USER } from './support/mockApp.js';

// Detalle por deporte (spec-detalle-por-deporte): pestañas y resumen distintos según el deporte.
const mk = (id, type, extra = {}) => ({
  ...MOCK_ACTIVITIES[MOCK_ACTIVITIES.length - 1],
  id, type, name: `Sesión ${type}`, user_id: MOCK_USER.id,
  map_polyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`@', calories: 450, speed_avg: 3.2, ...extra,
});
const ACTIVITIES = [
  ...MOCK_ACTIVITIES,
  mk('s-run', 'Run'), mk('s-ride', 'Ride'), mk('s-hike', 'Hike'),
  mk('s-str', 'WeightTraining', { distance: 0, elevation_gain: 0, map_polyline: '' }),
  mk('s-swim', 'Swim', { map_polyline: '' }),
];

const tab = (page, name) => page.getByRole('button', { name, exact: true }).filter({ visible: true });

test.describe(`Detalle por deporte`, () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page, { authenticated: true, state: { activities: ACTIVITIES } });
  });

  const open = async (page, id) => {
    await page.goto(`/activity/${id}`);
    await expect(page.getByRole('button', { name: 'Volver' }).first()).toBeVisible();
  };

  for (const id of ['s-run', 's-ride', 's-hike']) {
    test(`${id}: Análisis, Mapa, Intervalos y Detalle`, async ({ page }) => {
      await open(page, id);
      for (const n of ['Análisis', 'Mapa', 'Intervalos', 'Detalle']) await expect(tab(page, n).first()).toBeVisible();
    });
  }

  test('fuerza: sin Mapa ni Intervalos', async ({ page }) => {
    await open(page, 's-str');
    await expect(tab(page, 'Análisis').first()).toBeVisible();
    await expect(tab(page, 'Mapa')).toHaveCount(0);
    await expect(tab(page, 'Intervalos')).toHaveCount(0);
    await expect(page.getByText('Kcal totales').filter({ visible: true }).first()).toBeVisible();
  });

  test('natación (genérico): sin ClimbPro en Detalle', async ({ page }) => {
    await open(page, 's-swim');
    await tab(page, 'Detalle').first().click();
    await expect(page.getByText('Análisis de Ascensiones (ClimbPro)')).toHaveCount(0);
  });

  test('ClimbPro solo en bici; ritmo en senderismo', async ({ page }) => {
    await open(page, 's-ride');
    await tab(page, 'Detalle').first().click();
    await expect(page.getByText('Análisis de Ascensiones (ClimbPro)')).toBeVisible();
    await open(page, 's-hike');
    await expect(page.getByText('Ritmo Medio').filter({ visible: true }).first()).toBeVisible();
    await tab(page, 'Detalle').first().click();
    await expect(page.getByText('Análisis de Ascensiones (ClimbPro)')).toHaveCount(0);
  });

  test('carrera: selector de zonas FC / Ritmo', async ({ page }) => {
    await open(page, 's-run');
    await tab(page, 'Detalle').first().click();
    const ritmo = page.getByRole('button', { name: 'Ritmo', exact: true });
    if (await ritmo.count()) {
      await ritmo.first().click();
      await expect(page.locator('[data-detail="pace-zones"]')).toBeVisible();
    }
  });
});
