import { test, expect } from '@playwright/test';
import { setupApp, DETAIL_ACTIVITY_ID } from './support/mockApp.js';
import { gotoReady } from './support/ui.js';

// Regresión: la papelera del detalle no hacía nada (ActivityRouteWrapper no pasaba `onDelete`).
const path = (page) => new URL(page.url()).pathname;
const detailPath = `/activity/${DETAIL_ACTIVITY_ID}`;
const NAME = 'Salida larga';

test.describe(`Detalle: borrar`, () => {
  let state;
  let deletes;
  test.beforeEach(async ({ page }) => {
    state = {};
    deletes = 0;
    page.on('request', (r) => {
      if (r.method() === 'DELETE' && r.url().includes('/rest/v1/activities')) deletes += 1;
    });
    await setupApp(page, { authenticated: true, state });
  });

  const openFrom = async (page, origin) => {
    await gotoReady(page, origin);
    if (origin === '/calendar') {
      await page.locator('[data-cal="act"]:not([data-planned])').filter({ visible: true }).first().click();
    } else {
      await page.getByText(NAME).filter({ visible: true }).first().click();
    }
    await expect.poll(() => path(page)).toMatch(/^\/activity\//);
  };
  const trash = (page) => page.getByTitle('Eliminar actividad').filter({ visible: true }).first();
  const dialog = (page) => page.getByRole('dialog', { name: '¿Eliminar actividad?' });

  test('la papelera abre el diálogo, no borra; Cancelar y Esc lo cierran y el foco vuelve', async ({ page }) => {
    await openFrom(page, '/history');
    await trash(page).click();
    await expect(dialog(page)).toBeVisible();
    await expect(dialog(page).getByRole('button', { name: 'Cancelar' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toBeHidden();
    await expect(trash(page)).toBeFocused();
    await trash(page).click();
    await dialog(page).getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialog(page)).toBeHidden();
    expect(deletes).toBe(0);
    expect(path(page)).toMatch(/^\/activity\//);
  });

  test('Tab no sale del diálogo', async ({ page }) => {
    await openFrom(page, '/history');
    await trash(page).click();
    // El foco inicial llega al montar el diálogo: se espera antes de tabular.
    await expect(dialog(page).getByRole('button', { name: 'Cancelar' })).toBeFocused();
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Tab');
      await expect(dialog(page).locator(':focus')).toHaveCount(1);
    }
  });

  test('confirmar borra, vuelve a Actividades y el total baja en uno', async ({ page }) => {
    // Único recuento de Actividades (RF-D1): la cifra del resumen; `data-count` es su valor final.
    const total = async () => Number(await page.locator('[data-history="summary-count"]').filter({ visible: true }).first().getAttribute('data-count'));
    await gotoReady(page, '/history');
    const before = await total();
    await page.getByText(NAME).filter({ visible: true }).first().click();
    await expect.poll(() => path(page)).toMatch(/^\/activity\//);
    await trash(page).click();
    await dialog(page).getByRole('button', { name: 'Eliminar' }).click();
    await expect.poll(() => path(page)).toBe('/history');
    expect(deletes).toBe(1);
    await expect.poll(total).toBe(before - 1);
  });

  test('desde el calendario vuelve al calendario', async ({ page }) => {
    await openFrom(page, '/calendar');
    await trash(page).click();
    await dialog(page).getByRole('button', { name: 'Eliminar' }).click();
    await expect.poll(() => path(page)).toBe('/calendar');
    expect(deletes).toBe(1);
  });

  test('por URL directa vuelve a Actividades', async ({ page }) => {
    await page.goto(detailPath);
    await page.waitForLoadState('networkidle');
    await trash(page).click();
    await dialog(page).getByRole('button', { name: 'Eliminar' }).click();
    await expect.poll(() => path(page)).toBe('/history');
  });

  test('si falla, el diálogo sigue abierto y se puede reintentar', async ({ page }) => {
    await openFrom(page, '/history');
    state.failDelete = true;
    await trash(page).click();
    await dialog(page).getByRole('button', { name: 'Eliminar' }).click();
    await expect(page.getByText('No se pudo borrar la actividad.')).toBeVisible();
    await expect(dialog(page)).toBeVisible();
    expect(path(page)).toMatch(/^\/activity\//);
    state.failDelete = false;
    await dialog(page).getByRole('button', { name: 'Eliminar' }).click();
    await expect.poll(() => path(page)).toBe('/history');
  });

  // RF-D8: en la lista, borrar vive en el menú «Más acciones» de la fila.
  const moreActions = (page) =>
    page.getByRole('button', { name: new RegExp(`^Más acciones de ${NAME}`) }).filter({ visible: true }).first();

  test('en la lista, borrar vive en «Más acciones», pide confirmación y no abre el detalle', async ({ page }) => {
    await gotoReady(page, '/history');
    await moreActions(page).click();
    await page.getByRole('menuitem', { name: 'Eliminar actividad' }).click();
    await expect(dialog(page)).toBeVisible();
    expect(path(page)).toBe('/history');
    expect(deletes).toBe(0);
    await dialog(page).getByRole('button', { name: 'Eliminar' }).click();
    await expect(dialog(page)).toBeHidden();
    expect(deletes).toBe(1);
    expect(path(page)).toBe('/history');
  });

  test('el menú de la fila se maneja con teclado; Esc lo cierra y el foco vuelve al botón', async ({ page }) => {
    await gotoReady(page, '/history');
    const more = moreActions(page);
    await more.focus();
    await page.keyboard.press('Enter');
    await expect(more).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('menuitem', { name: 'Eliminar actividad' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(more).toBeFocused();
    expect(path(page)).toBe('/history');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await expect(dialog(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toBeHidden();
    await expect(more).toBeFocused();
    expect(deletes).toBe(0);
  });
});
