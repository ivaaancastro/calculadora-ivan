import { test, expect } from '@playwright/test';
import { setupApp } from './support/mockApp.js';
import { gotoReady } from './support/ui.js';

// Modal (spec-rediseno-02-c2, D4 a y b): diálogo con nombre, Escape cierra y el fondo no se desplaza.
const visible = (locator) => locator.filter({ visible: true }).first();
const htmlOverflow = (page) => page.evaluate(() => document.documentElement.style.overflow);

const CASES = [
  { name: 'Añadir Manual', path: '/history', auth: true, open: (page) => visible(page.getByRole('button', { name: 'Añadir Manual' })).click() },
  { name: 'Bienvenido de Vuelta', path: '/', auth: false, open: (page) => visible(page.getByRole('button', { name: 'Iniciar Sesión' })).click() },
  {
    name: 'Planificar Entrenamiento',
    path: '/calendar',
    auth: true,
    open: (page) => visible(page.getByRole('button', { name: 'Planificar sesión' })).click({ force: true }),
  },
];

test.describe('Modal: Escape y bloqueo del fondo', () => {
  for (const c of CASES) {
    test(`${c.name}: es un diálogo, bloquea el fondo y se cierra con Escape`, async ({ page }) => {
      await setupApp(page, { authenticated: c.auth });
      await gotoReady(page, c.path);
      expect(await htmlOverflow(page)).toBe('');

      await c.open(page);
      const dialog = page.getByRole('dialog', { name: c.name });
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(await htmlOverflow(page)).toBe('hidden');

      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      expect(await htmlOverflow(page)).toBe('');
    });
  }

  test('visor del Calendario: Escape lo cierra y tocar fuera también', async ({ page }) => {
    await setupApp(page, { authenticated: true });
    await gotoReady(page, '/calendar');
    const viewer = page.getByRole('dialog');

    await visible(page.locator('[draggable="true"]')).click();
    await expect(viewer).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(viewer).toBeHidden();

    await visible(page.locator('[draggable="true"]')).click();
    await expect(viewer).toBeVisible();
    await page.mouse.click(5, 5);
    await expect(viewer).toBeHidden();
    expect(await htmlOverflow(page)).toBe('');
  });
});
