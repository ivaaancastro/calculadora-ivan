import { test, expect } from '@playwright/test';
import { setupApp } from './support/mockApp.js';
import { gotoReady } from './support/ui.js';

test.describe('Actividades: añadir → listar → detalle', () => {
  test('añade una actividad manual con los campos etiquetados', async ({ page }) => {
    await setupApp(page, { authenticated: true });
    await gotoReady(page, '/history');

    const posted = page.waitForRequest(
      (r) => r.method() === 'POST' && r.url().includes('/rest/v1/activities'),
    );

    await page.getByRole('button', { name: 'Añadir Manual' }).first().click();
    const dialogForm = page.locator('form');

    // Todos los campos del modal se localizan por su etiqueta (RF6).
    await dialogForm.getByLabel('Fecha').fill('2026-06-14');
    await dialogForm.getByLabel('Deporte').selectOption('Ciclismo');
    await dialogForm.getByLabel('Duración (min)').fill('90');
    await dialogForm.getByLabel('Pulso Medio').fill('142');
    await dialogForm.getByLabel('Distancia (m)').fill('40000');
    await dialogForm.getByLabel('Desnivel (m)').fill('450');
    await dialogForm.getByRole('button', { name: 'Guardar Actividad' }).click();

    const body = (await posted).postDataJSON();
    expect(body[0]).toMatchObject({
      date: '2026-06-14',
      type: 'Ciclismo',
      duration: 90,
      hr_avg: 142,
      distance: 40000,
      elevation_gain: 450,
    });
    await expect(page.getByRole('button', { name: 'Guardar Actividad' })).toHaveCount(0);
  });

  test('la duración es obligatoria y no se envía nada sin ella', async ({ page }) => {
    await setupApp(page, { authenticated: true });
    await gotoReady(page, '/history');
    let posts = 0;
    page.on('request', (r) => {
      if (r.method() === 'POST' && r.url().includes('/rest/v1/activities')) posts += 1;
    });
    await page.getByRole('button', { name: 'Añadir Manual' }).first().click();
    await page.getByRole('button', { name: 'Guardar Actividad' }).click();
    await expect(page.getByLabel('Duración (min)')).toBeFocused();
    expect(posts).toBe(0);
  });

  test('abre el detalle de una actividad desde el historial', async ({ page }) => {
    await setupApp(page, { authenticated: true });
    await gotoReady(page, '/history');
    await page.getByText('Salida larga').filter({ visible: true }).first().click();
    await expect(page).toHaveURL(/\/activity\//);
    await expect(page.getByRole('button', { name: 'Intervalos' })).toBeVisible();
  });
});
