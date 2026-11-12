import { test, expect } from '@playwright/test';
import { setupApp } from './support/mockApp.js';
import { gotoReady } from './support/ui.js';

// Flujo público (spec-rediseno-02-c4, RF1): landing → modal de acceso (3 modos) → correo confirmado → landing.
test.describe('Páginas públicas', () => {
  test('el modal de acceso recorre entrar, registrarse y recuperar clave', async ({ page }) => {
    await setupApp(page, { authenticated: false });
    await gotoReady(page, '/');
    await page.getByRole('button', { name: 'Iniciar Sesión' }).first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Bienvenido de Vuelta' })).toBeVisible();

    await dialog.getByRole('button', { name: /Regístrate gratis/ }).click();
    await expect(dialog.getByRole('heading', { name: 'Crear Cuenta' })).toBeVisible();

    await dialog.getByRole('button', { name: /Inicia Sesión/ }).click();
    await dialog.getByRole('button', { name: /olvidado tu contraseña/ }).click();
    await expect(dialog.getByRole('heading', { name: 'Recuperar Clave' })).toBeVisible();
    await expect(dialog.getByLabel('Contraseña')).toHaveCount(0);

    await dialog.getByRole('button', { name: 'Volver' }).click();
    await expect(dialog.getByRole('heading', { name: 'Bienvenido de Vuelta' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('/email-confirmado confirma la cuenta y vuelve a la landing', async ({ page }) => {
    await setupApp(page, { authenticated: false });
    await gotoReady(page, '/email-confirmado');
    await expect(page.getByRole('heading', { level: 1, name: /Cuenta Confirmada/i })).toBeVisible();
    await page.getByRole('link', { name: /Ir a Iniciar Sesión/ }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('button', { name: 'Iniciar Sesión' }).first()).toBeVisible();
  });
});
