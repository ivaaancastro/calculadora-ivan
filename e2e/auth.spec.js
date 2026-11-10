import { test, expect } from '@playwright/test';
import { setupApp, MOCK_USER } from './support/mockApp.js';
import { gotoReady } from './support/ui.js';

test.describe('Autenticación y redirección', () => {
  test('sin sesión se muestra la landing con acceso', async ({ page }) => {
    await setupApp(page, { authenticated: false });
    await gotoReady(page, '/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Iniciar Sesión' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Calendario' })).toHaveCount(0);
  });

  test('permite iniciar sesión y entrar al dashboard', async ({ page }) => {
    await setupApp(page, { authenticated: false });
    await gotoReady(page, '/');
    await page.getByRole('button', { name: 'Iniciar Sesión' }).first().click();

    // Los campos del acceso están asociados a su etiqueta (RF6).
    await page.getByLabel('Email').fill(MOCK_USER.email);
    await page.getByLabel('Contraseña').fill('contraseña-de-prueba');
    await page.locator('form').locator('button[type=submit]').click();

    await expect(page.getByRole('link', { name: 'Calendario' }).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: 'Iniciar Sesión' })).toHaveCount(0);
  });

  test('con sesión guardada entra directamente y puede cerrar sesión', async ({ page }) => {
    await setupApp(page, { authenticated: true });
    await gotoReady(page, '/');
    await expect(page.getByRole('link', { name: 'Calendario' }).first()).toBeVisible();

    // Cerrar sesión vive solo en el menú de la cabecera (RF5): antes hay que abrirlo.
    await page.getByRole('button', { name: 'Menú de configuración y perfil' }).click();
    await page.getByRole('button', { name: 'Cerrar Sesión' }).first().click();
    await expect(page.getByRole('button', { name: 'Iniciar Sesión' }).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('link', { name: 'Calendario' })).toHaveCount(0);
  });
});
