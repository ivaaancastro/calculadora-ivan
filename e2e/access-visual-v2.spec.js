/* global process */
import { expect, test } from '@playwright/test';
import { setupApp } from './support/mockApp.js';
import { THEMES, gotoReady, settleForScreenshot } from './support/ui.js';

// Capturas del acceso v2 (Capa 4, PR 4): modal (entrar, registro, recuperar) y correo confirmado.
test.skip(
  process.platform !== 'linux',
  'Capturas de referencia solo en Linux. Ejecuta `npm run test:e2e:docker` para compararlas.',
);

for (const theme of THEMES) {
  test.describe(`Acceso v2 · tema ${theme}`, () => {
    for (const mode of ['entrar', 'registro', 'recuperar']) {
      test(`modal ${mode}`, async ({ page }) => {
        await setupApp(page, { authenticated: false, theme, ui: 'v2' });
        await gotoReady(page, '/');
        await page.getByRole('button', { name: 'Iniciar Sesión' }).first().click();
        const dialog = page.getByRole('dialog');
        if (mode === 'registro') await dialog.getByRole('button', { name: /No tienes cuenta/ }).click();
        if (mode === 'recuperar') await dialog.getByRole('button', { name: /olvidado tu contraseña/ }).click();
        // Solo el viewport: el modal es fijo y no debe medirse contra la altura de la landing.
        await settleForScreenshot(page, { resize: false });
        await expect(page).toHaveScreenshot(`acceso-v2-${mode}-${theme}.png`);
      });
    }

    test('correo confirmado', async ({ page }) => {
      await setupApp(page, { authenticated: false, theme, ui: 'v2' });
      await gotoReady(page, '/email-confirmado');
      await settleForScreenshot(page, { resize: true });
      await expect(page).toHaveScreenshot(`email-confirmado-v2-${theme}.png`);
    });
  });
}
