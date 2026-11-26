import { test, expect } from '@playwright/test';
import { setupApp } from './support/mockApp.js';
import { gotoReady } from './support/ui.js';

// El botón «Importar CSV» se retiró en el PR 2 de la Capa 3 (D3): nunca estuvo
// implementado. `processFile` era un `console.log('Lógica de CSV pendiente')` y
// `Dashboard` no pasaba `onFileUpload`, así que el icono solo lanzaba un error.
// Queda registrado como D-03 en `docs/branches/test/ui-safety-net/paridad.md`.
test.describe('Datos: exportar', () => {
  // La app no tiene exportación de datos hoy: esta prueba comprobaba un botón
  // que no existe y pasaba sin verificar nada. Se deja documentada (D-05).
  test.fixme('descarga un CSV al exportar los datos', async ({ page }) => {
    await setupApp(page, { authenticated: true });
    await gotoReady(page, '/');
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportar' }).click();
    expect((await download).suggestedFilename()).toMatch(/\.csv$/i);
  });
});
