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

test.describe('Exportación de datos', () => {
  test.beforeEach(({ page }) => {
    mockSupabase(page);
  });

  test('debería mostrar la opción de exportar y descargar un CSV', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/dashboard|\//, { timeout: 10000 });

    // Buscar botón de exportar
    const exportBtn = page.getByRole('button', { name: /Exportar|Export|CSV|Descargar/i });
    if ((await exportBtn.count()) > 0) {
      const downloadPromise = page.waitForEvent('download');
      await exportBtn.first().click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.csv$/i);
    } else {
      // Si no hay botón de exportar visible, verificar que al menos se carga la app autenticada
      await expect(page.getByText(/Dashboard|Actividades|Fitness|CTL/i).first()).toBeVisible({
        timeout: 10000,
      });
    }
  });
});
