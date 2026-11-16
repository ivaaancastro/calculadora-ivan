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

  test('landing v2: skip-link, un h1 y copy sin promesas de precio', async ({ page }) => {
    await setupApp(page, { authenticated: false, ui: 'v2' });
    await gotoReady(page, '/');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Saltar al contenido' });
    await expect(skip).toBeFocused();
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 2, name: /Todo lo que necesitas/ })).toBeVisible();
    const text = await page.locator('body').innerText();
    for (const banned of [/gratis/i, /gratuit/i, /∞/, /24\/7/, /laboratorio/i, /garmin/i]) {
      expect(text).not.toMatch(banned);
    }
  });

  test('acceso v2: 3 modos, foco atrapado, Escape y copy neutro', async ({ page }) => {
    await setupApp(page, { authenticated: false, ui: 'v2' });
    await gotoReady(page, '/');
    const opener = page.getByRole('button', { name: 'Iniciar Sesión' }).first();
    await opener.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Bienvenido de Vuelta' })).toBeVisible();
    await expect(dialog.getByLabel('Email')).toBeFocused();

    // Tab no sale del diálogo
    for (let i = 0; i < 8; i++) await page.keyboard.press('Tab');
    expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);

    await dialog.getByRole('button', { name: /No tienes cuenta/ }).click();
    await expect(dialog.getByRole('heading', { name: 'Crear Cuenta' })).toBeVisible();
    await dialog.getByRole('button', { name: /Inicia Sesión/ }).click();
    await dialog.getByRole('button', { name: /olvidado tu contraseña/ }).click();
    await expect(dialog.getByRole('heading', { name: 'Recuperar Clave' })).toBeVisible();
    await expect(dialog.getByLabel('Contraseña')).toHaveCount(0);
    await dialog.getByRole('button', { name: 'Volver' }).click();

    const text = await dialog.innerText();
    for (const banned of [/gratis/i, /laboratorio/i]) expect(text).not.toMatch(banned);

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(opener).toBeFocused();
  });

  test('/email-confirmado en v2: un h1 y vuelta a la landing', async ({ page }) => {
    await setupApp(page, { authenticated: false, ui: 'v2' });
    await gotoReady(page, '/email-confirmado');
    await expect(page.getByRole('heading', { level: 1, name: /Cuenta Confirmada/i })).toBeVisible();
    await page.getByRole('link', { name: /Ir a Iniciar Sesión/ }).click();
    await expect(page).toHaveURL(/\/$/);
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
