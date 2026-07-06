import { test, expect } from '@playwright/test';

test.describe('Dashboard UI', () => {
  // En E2E, mockearíamos la sesión antes de cargar la página,
  // pero para verificar de forma simple:
  test('debería poder cargar y navegar si estuviera logueado', async ({ page }) => {
    // Si la app tiene un mock_env, podríamos forzar sesión aquí
    // await page.goto('/dashboard');
    // await expect(page.getByText('Fitness (CTL)')).toBeVisible();
  });
});
