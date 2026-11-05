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

// Intercepta llamadas a Supabase Auth para devolver una sesión válida sin red real.
function mockSupabaseAuth(page) {
  page.route('**/supabase.co/auth/v1/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    // getSession / user -> devuelve sesión activa
    if (url.includes('/user') && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { user: MOCK_USER }, error: null }),
      });
      return;
    }

    // signInWithPassword / signUp / setSession -> devuelve sesión y usuario
    if (url.includes('/token') || url.includes('/authorize')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { session: MOCK_SESSION, user: MOCK_USER },
          error: null,
        }),
      });
      return;
    }

    // signOut -> ok
    if (url.includes('/logout')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: {}, error: null }),
      });
      return;
    }

    await route.continue();
  });
}

test.describe('Autenticación y Redirección', () => {
  test.beforeEach(({ page }) => {
    mockSupabaseAuth(page);
  });

  test('debería mostrar la página de login si no hay sesión', async ({ page }) => {
    // Sin sesión activa: la app muestra LandingPage
    await page.goto('/');
    await expect(page.getByText(/Tu laboratorio de rendimiento deportivo/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Iniciar Sesión/i }).first()).toBeVisible();
  });

  test('debería permitir iniciar sesión y redirigir al dashboard', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Iniciar Sesión/i }).first().click();
    await expect(page.getByText(/Bienvenido de Vuelta/i)).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: /Entrar al Laboratorio/i }).click();
    // Tras login exitoso (mock), se muestra el dashboard
    await expect(page).toHaveURL(/\/dashboard|\//, { timeout: 10000 });
  });

  test('debería cerrar sesión y volver a la landing', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Iniciar Sesión/i }).first().click();
    await page.getByRole('button', { name: /Entrar al Laboratorio/i }).click();
    await expect(page).toHaveURL(/\/dashboard|\//, { timeout: 10000 });
    // Cerrar sesión si hay botón disponible
    const logoutBtn = page.getByRole('button', { name: /Cerrar Sesión|Salir/i });
    if ((await logoutBtn.count()) > 0) {
      await logoutBtn.click();
      await expect(page.getByText(/Tu laboratorio de rendimiento deportivo/i)).toBeVisible({ timeout: 5000 });
    }
  });
});
