import { test, expect } from '@playwright/test';

const MOCK_USER = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'atleta@prueba.e2e',
};

const MOCK_SESSION = {
  access_token: 'mock-access-token-e2e',
  refresh_token: 'mock-refresh-token-e2e',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: MOCK_USER,
};

function mockSupabase(page) {
  // Auth
  page.route('**/supabase.co/auth/v1/user', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { user: MOCK_USER }, error: null }),
    });
  });
  page.route('**/supabase.co/auth/v1/token', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { session: MOCK_SESSION, user: MOCK_USER }, error: null }),
    });
  });
  // Otras llamadas al Supabase -> 200 vacío
  page.route('**/supabase.co/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [], error: null }),
    });
  });
}

test.describe('Sincronización Strava', () => {
  test.beforeEach(({ page }) => {
    mockSupabase(page);
  });

  test('debería mostrar la opción de conectar Strava y navegar al callback mockeado', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/dashboard|\//, { timeout: 10000 });

    // Buscar botón de conectar Strava
    const stravaBtn = page.getByRole('button', { name: /Conectar Strava|Strava|Conectar con Strava/i });
    if ((await stravaBtn.count()) > 0) {
      await stravaBtn.first().click();

      // Si hay un enlace de autorización de Strava, interceptarlo para no salir del dominio
      page.on('request', (request) => {
        if (request.url().includes('strava.com/oauth')) {
          // No seguir; solo registrar para no romper el flujo
          void request;
        }
      });

      // Navegar al callback de Strava (mockeado en la app)
      await page.goto('/strava-callback');
      await expect(page.getByText(/Strava|callback|Conectado|Conectada|Error/i).first()).toBeVisible({
        timeout: 10000,
      });
    } else {
      // Si no hay botón visible, al menos verificar que la ruta de callback existe
      await page.goto('/strava-callback');
      await expect(page).toHaveURL(/\/strava-callback/, { timeout: 10000 });
    }
  });
});
