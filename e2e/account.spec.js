import { test, expect } from '@playwright/test';
import { setupApp } from './support/mockApp.js';
import { gotoReady } from './support/ui.js';

test.describe('Eliminación de cuenta', () => {
  test('confirma el borrado, llama a delete_user y vuelve a la landing', async ({ page }) => {
    await setupApp(page, { authenticated: true });
    await gotoReady(page, '/profile?section=security');

    page.once('dialog', (dialog) => dialog.accept());
    const rpc = page.waitForRequest((r) => r.url().includes('/rest/v1/rpc/delete_user'));

    await page.getByRole('button', { name: 'Eliminar Cuenta' }).click();
    await rpc;

    await expect(page.getByRole('button', { name: 'Iniciar Sesión' }).first()).toBeVisible({ timeout: 10000 });
  });

  test('si el usuario cancela la confirmación no se borra nada', async ({ page }) => {
    await setupApp(page, { authenticated: true });
    await gotoReady(page, '/profile?section=security');

    let rpcCalls = 0;
    page.on('request', (r) => {
      if (r.url().includes('/rpc/delete_user')) rpcCalls += 1;
    });
    page.once('dialog', (dialog) => dialog.dismiss());
    await page.getByRole('button', { name: 'Eliminar Cuenta' }).click();
    await page.waitForTimeout(300);

    expect(rpcCalls).toBe(0);
    await expect(page.getByRole('button', { name: 'Eliminar Cuenta' })).toBeVisible();
  });
});
