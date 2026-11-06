import { test, expect } from '@playwright/test';
import { setupApp } from './support/mockApp.js';
import { gotoReady } from './support/ui.js';

test.describe('Datos: importar y exportar', () => {
  test('la barra ofrece importar CSV', async ({ page }) => {
    await setupApp(page, { authenticated: true });
    await gotoReady(page, '/');
    await expect(page.getByRole('button', { name: 'Importar CSV' })).toBeVisible();
  });

  // La app no tiene exportación de datos hoy: la prueba anterior comprobaba un
  // botón que no existe y pasaba sin verificar nada. Se deja documentada.
  test.fixme('descarga un CSV al exportar los datos', async ({ page }) => {
    await setupApp(page, { authenticated: true });
    await gotoReady(page, '/');
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportar' }).click();
    expect((await download).suggestedFilename()).toMatch(/\.csv$/i);
  });
});
