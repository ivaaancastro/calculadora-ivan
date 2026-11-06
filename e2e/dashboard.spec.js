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
