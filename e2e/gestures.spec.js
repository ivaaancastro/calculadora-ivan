import { test, expect } from '@playwright/test';
import { setupApp, DETAIL_ACTIVITY_ID } from './support/mockApp.js';
import { gotoReady, swipeHorizontally } from './support/ui.js';

const pathname = (page) => new URL(page.url()).pathname;

// RF5: deslizar sobre una gráfica o sobre filtros horizontales no cambia de pestaña.
test.describe('Gestos · el deslizamiento no cambia de pestaña', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page, { authenticated: true });
  });

  test('sobre una gráfica del dashboard', async ({ page }) => {
    await gotoReady(page, '/');
    const chart = page.locator('.recharts-wrapper').first();
    await chart.scrollIntoViewIfNeeded();
    await expect(chart).toBeInViewport();
    await swipeHorizontally(page, chart, -220);
    expect(pathname(page)).toBe('/');
  });

  test('sobre los filtros horizontales del detalle de actividad', async ({ page }) => {
    await gotoReady(page, `/activity/${DETAIL_ACTIVITY_ID}`, '/history');
    const strip = page.locator('.hide-scrollbar', { hasText: 'PICOS' }).first();
    await strip.scrollIntoViewIfNeeded();
    await expect(strip).toBeInViewport();
    await swipeHorizontally(page, strip, -220);
    expect(pathname(page)).toBe(`/activity/${DETAIL_ACTIVITY_ID}`);
  });

  // D-01, cerrado en la Capa 3 (spec-rediseno-02-c3): `MobileSwipePager` ignora ahora
  // `.hide-scrollbar` igual que `useSwipeNavigation`, así que deslizar la tira de secciones
  // de Rendimiento (Fisiología / Potencia / VO2…) la desplaza sin cambiar de pestaña.
  test('sobre la tira de secciones de Rendimiento', async ({ page }) => {
    await gotoReady(page, '/stats');
    const strip = page.locator('.hide-scrollbar', { hasText: 'Fisiología' }).first();
    await expect(strip).toBeInViewport();
    await swipeHorizontally(page, strip, -220);
    expect(pathname(page)).toBe('/stats');
  });

  test('control: sobre contenido normal sí cambia de pestaña', async ({ page }) => {
    // Garantiza que el gesto de la prueba funciona (si no, las demás serían vacías).
    await gotoReady(page, '/');
    await swipeHorizontally(page, page.locator('main').first(), -250);
    await expect.poll(() => pathname(page)).not.toBe('/');
  });
});
