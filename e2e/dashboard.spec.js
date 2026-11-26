import { test, expect } from '@playwright/test';
import { setupApp } from './support/mockApp.js';
import { gotoReady } from './support/ui.js';

const TABS = [
  { link: 'Rendimiento', path: '/stats' },
  { link: 'Calendario', path: '/calendar' },
  { link: 'Actividades', path: '/history' },
  { link: 'Salud', path: '/health' },
  { link: 'Dashboard', path: '/' },
];

test.describe('Dashboard (autenticado)', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page, { authenticated: true });
    await gotoReady(page, '/');
  });

  test('carga el dashboard con el perfil y no la landing', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Iniciar Sesión' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Menú de configuración y perfil' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Calendario' }).first()).toBeVisible();
  });

  for (const tab of TABS) {
    test(`navega a ${tab.link}`, async ({ page }) => {
      await page.getByRole('link', { name: tab.link }).first().click();
      await expect(page).toHaveURL(new RegExp(`${tab.path === '/' ? '/$' : tab.path + '$'}`));
      await expect(page.getByText(/Cargando/)).toHaveCount(0);
    });
  }

  test('el historial lista las actividades simuladas', async ({ page }) => {
    await page.getByRole('link', { name: 'Actividades' }).first().click();
    await expect(page.getByRole('button', { name: 'Eliminar actividad' }).first()).toBeVisible();
    await expect(page.getByText('Salida larga').filter({ visible: true }).first()).toBeVisible();
  });
});

test.describe('Dashboard: cada control junto a lo que cambia (RF-D2, RF-D3)', () => {
  test.beforeEach(async ({ page }) => {
    // Sin la cuenta animada de las cifras, para comparar valores antes y después.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await setupApp(page, { authenticated: true });
    await gotoReady(page, '/');
  });

  test('el CTL es la cifra del héroe y el héroe no lleva el selector de rango', async ({ page }) => {
    const hero = page.locator('[data-dash="hero"]').filter({ visible: true });
    await expect(hero.locator('[data-metric="ctl"]')).toBeVisible();
    await expect(hero.getByRole('button', { name: '7D' })).toHaveCount(0);
  });

  test('el rango vive en la tarjeta de la gráfica y solo cambia la gráfica y sus totales', async ({ page }) => {
    const card = page.locator('[data-dash="chart"]').filter({ visible: true });
    const range = card.getByRole('group', { name: 'Rango de la gráfica' });
    const totals = card.locator('[data-dash="period-totals"]');
    const ctl = page.locator('[data-dash="hero"] [data-metric="ctl"]').filter({ visible: true });
    const atl = page.locator('[data-metric="atl"]').filter({ visible: true });
    await expect(totals).toContainText('Últimos 30 días');
    const before = { totals: await totals.innerText(), ctl: await ctl.innerText(), atl: await atl.innerText() };

    await range.getByRole('button', { name: '7D' }).click();
    await expect(range.getByRole('button', { name: '7D' })).toHaveAttribute('aria-pressed', 'true');
    await expect(totals).toContainText('Últimos 7 días');
    expect(await totals.innerText()).not.toBe(before.totals);
    expect(await ctl.innerText()).toBe(before.ctl);
    expect(await atl.innerText()).toBe(before.atl);
  });

  test('el readout de la gráfica solo aparece al pasar el cursor, con el día señalado', async ({ page }) => {
    const card = page.locator('[data-dash="chart"]').filter({ visible: true });
    const readout = card.locator('[data-dash="readout"]');
    await expect(readout).toHaveCount(0);
    const box = await card.locator('.recharts-wrapper').boundingBox();
    await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.5);
    await expect(readout).toBeVisible();
    await page.mouse.move(box.x + box.width * 0.25, box.y - 80);
    await expect(readout).toHaveCount(0);
  });
});

test.describe('Cabecera: CTA de Strava (RF-D8)', () => {
  test('sin Strava conectado, la cabecera ofrece conectarlo', async ({ page }) => {
    await setupApp(page, { authenticated: true });
    await gotoReady(page, '/');
    await expect(page.locator('nav.glass-nav').getByRole('button', { name: 'Conectar con Strava' })).toBeVisible();
  });

  test('con Strava conectado, la cabecera no muestra el CTA', async ({ page }) => {
    await setupApp(page, {
      authenticated: true,
      state: { profile: { strava_access_token: 'e2e-strava-access', strava_refresh_token: 'e2e-strava-refresh', strava_expires_at: 4102444800 } },
    });
    await gotoReady(page, '/');
    const nav = page.locator('nav.glass-nav');
    await expect(nav.getByRole('button', { name: /sincronizar/i })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Conectar con Strava' })).toHaveCount(0);
  });
});
