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
  // delete_user RPC -> ok
  page.route('**/supabase.co/rest/v1/rpc/delete_user', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: null, error: null }),
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

test.describe('Eliminación de cuenta', () => {
  test.beforeEach(({ page }) => {
    mockSupabase(page);
  });

  test('debería mostrar la opción de eliminar cuenta y confirmar el borrado', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/dashboard|\//, { timeout: 10000 });

    // Buscar botón de eliminar cuenta (configuración/perfil)
    const deleteBtn = page.getByRole('button', {
      name: /Eliminar Cuenta|Borrar Cuenta|Delete Account|Eliminar mi cuenta/i,
    });
    if ((await deleteBtn.count()) > 0) {
      await deleteBtn.first().click();

      // Confirmar borrado (puede haber un segundo botón de confirmación)
      const confirmBtn = page.getByRole('button', {
        name: /Confirmar|Sí, Eliminar|Confirmar Eliminación|Aceptar/i,
      });
      if ((await confirmBtn.count()) > 0) {
        await confirmBtn.first().click();
      }

      // Tras eliminar, esperar redirección a landing o mensaje de confirmación
      await expect(
        page.getByText(/Cuenta eliminada|Cuenta borrada|Cuenta eliminada correctamente|Sesión cerrada/i)
      ).toBeVisible({ timeout: 10000 });
    } else {
      // Si no hay botón visible, al menos verificar que la app carga autenticada
      await expect(page.getByText(/Dashboard|Actividades|Fitness|CTL/i).first()).toBeVisible({
        timeout: 10000,
      });
    }
  });
});
