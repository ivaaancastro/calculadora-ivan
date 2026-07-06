import { test, expect } from '@playwright/test';

test.describe('Autenticación y Redirección', () => {
  
  test('debería mostrar la página de login si no hay sesión', async ({ page }) => {
    // Al intentar entrar a la raíz, si no estamos logueados, nos redirige a login
    await page.goto('/');
    
    // Verificamos que se renderiza la landing page
    await expect(page.getByText(/Tu laboratorio de rendimiento deportivo/i)).toBeVisible();
    
    // Navegamos al formulario de login
    await page.getByRole('button', { name: /Iniciar Sesión/i }).first().click();

    // Verificamos que se renderiza el formulario de Auth
    await expect(page.getByText(/Bienvenido de Vuelta/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /Entrar al Laboratorio/i })).toBeVisible();
  });

  // Nota: Para testear un login exitoso en E2E real, normalmente mockeamos la sesión
  // o insertamos una cookie/token válido en el contexto del navegador para no
  // mandar correos reales.
  
});
