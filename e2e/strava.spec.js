import { test, expect } from '@playwright/test';
import { setupApp } from './support/mockApp.js';
import { gotoReady } from './support/ui.js';

test.describe('Sincronización Strava', () => {
  test('el botón de conexión redirige al flujo OAuth de Strava', async ({ page }) => {
    await setupApp(page, { authenticated: true });
    await gotoReady(page, '/');

    const oauth = page.waitForRequest((r) => r.url().startsWith('https://www.strava.com/oauth/authorize'));
    await page.getByRole('button', { name: 'Conectar con Strava' }).first().click();
    const url = new URL((await oauth).url());
    expect(url.searchParams.get('scope')).toContain('activity:read_all');
    expect(url.searchParams.get('response_type')).toBe('code');
  });

  test('el callback con acceso denegado informa del error', async ({ page }) => {
    await setupApp(page, { authenticated: true });
    await page.goto('/strava-callback?error=access_denied');
    await expect(page.getByText('Acceso denegado por el usuario.')).toBeVisible();
  });

  test('el callback canjea el código en la Edge Function, sin secreto en el cliente', async ({ page }) => {
    const state = { stravaTokenRequests: [] };
    await setupApp(page, { authenticated: true, state });
    const direct = [];
    page.on('request', (r) => {
      if (r.url().startsWith('https://www.strava.com/oauth/token')) direct.push(r.url());
    });
    await page.goto('/strava-callback?code=e2e-code&scope=read,activity:read_all');
    await expect(page.getByText('¡Conectado! Redirigiendo al Laboratorio...')).toBeVisible();
    expect(state.stravaTokenRequests).toEqual([{ grant_type: 'authorization_code', code: 'e2e-code' }]);
    expect(direct).toEqual([]);
  });

  test('el callback sin código informa del error', async ({ page }) => {
    await setupApp(page, { authenticated: true });
    await page.goto('/strava-callback');
    await expect(page.getByText('No se recibió código de Strava.')).toBeVisible();
  });
});
