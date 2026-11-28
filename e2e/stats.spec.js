import { test, expect } from '@playwright/test';
import { setupApp } from './support/mockApp.js';
import { gotoReady } from './support/ui.js';
import { duplicatedMetrics } from './support/metrics.js';

// Rendimiento (spec Capa 6, RF-D7 / D9): resumen fijo arriba y pestañas Carga · Potencia ·
// Carrera · Volumen, accesibles con teclado; cada pestaña muestra solo sus tarjetas y ninguna
// repite una cifra del resumen (RF-D1).
const TABS = [
  { name: 'Carga', cards: ['balance', 'thresholds'] },
  { name: 'Potencia', cards: ['mmp'] },
  { name: 'Carrera', cards: ['vo2', 'race'] },
  { name: 'Volumen', cards: ['volume', 'focus'] },
];

test.beforeEach(async ({ page }) => {
  await setupApp(page, { authenticated: true });
  await gotoReady(page, '/stats');
});

test('pestañas: cada una muestra solo sus tarjetas, sin cifras repetidas', async ({ page }) => {
  const tablist = page.getByRole('tablist', { name: 'Secciones de Rendimiento' });
  const hero = page.locator('[data-stats="hero"]:visible');
  for (const tab of TABS) {
    await tablist.getByRole('tab', { name: tab.name }).click();
    await expect(tablist.getByRole('tab', { name: tab.name })).toHaveAttribute('aria-selected', 'true');
    const panel = page.getByRole('tabpanel', { name: tab.name });
    for (const id of tab.cards) await expect(panel.locator(`[data-card="${id}"]`)).toBeVisible();
    await expect(hero).toBeVisible();
    expect(await duplicatedMetrics(page), `cifra repetida en ${tab.name}`).toEqual({});
  }
});

test('teclado: las flechas cambian de pestaña y la URL la recuerda', async ({ page }) => {
  const carga = page.getByRole('tab', { name: 'Carga' });
  await carga.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Potencia' })).toBeFocused();
  await expect(page.getByRole('tab', { name: 'Potencia' })).toHaveAttribute('aria-selected', 'true');
  await expect(page).toHaveURL(/tab=potencia/);
  await page.keyboard.press('End');
  await expect(page.getByRole('tab', { name: 'Volumen' })).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Carga' })).toHaveAttribute('aria-selected', 'true');
});

test('sin datos de potencia: EmptyState con acción, sin ceros falsos', async ({ page }) => {
  await gotoReady(page, '/stats?tab=potencia');
  const empty = page.locator('[data-card="power-profile"][data-empty="true"]:visible');
  await expect(empty).toBeVisible();
  await expect(empty.getByRole('button')).toBeVisible();
  await expect(page.getByRole('tabpanel')).not.toContainText(/(^|\s)(--|0,00)(\s|$)/);
});

// Distribución de carga (spec B1, RF-15 a RF-19 y CA-5).
test('distribución de carga: tres categorías que suman la carga y rango de 7, 28 o 90 días', async ({ page }) => {
  const card = page.locator('[data-card="balance"]').filter({ visible: true });
  await expect(card.getByRole('heading', { name: 'Distribución de carga' })).toBeVisible();
  await expect(card.getByRole('button', { name: '28D' })).toHaveAttribute('aria-pressed', 'true');
  await expect(card.locator('[data-load="category"]')).toHaveCount(3);
  const numbers = async (locator) => (await locator.allInnerTexts()).map((t) => Number(t.match(/\d+/)[0]));
  for (const range of ['7D', '28D', '90D']) {
    await card.getByRole('button', { name: range }).click();
    await expect(card.getByRole('button', { name: range })).toHaveAttribute('aria-pressed', 'true');
    const parts = await numbers(card.locator('[data-load="value"]'));
    const [total] = await numbers(card.locator('[data-load="total"]'));
    expect(parts.reduce((a, b) => a + b, 0), `suma en ${range}`).toBe(total);
  }
  await expect(card.locator('[data-load="note"]')).toContainText('Garmin');
  await expect(card.locator('[data-load="note"]')).toContainText(/estimadas? con la FC media/);
});

test('volumen: la tarjeta de foco solo muestra horas por zona', async ({ page }) => {
  await gotoReady(page, '/stats?tab=volumen');
  const card = page.locator('[data-card="focus"]').filter({ visible: true });
  await expect(card.getByRole('heading', { name: 'Horas por zona' })).toBeVisible();
  await expect(card).not.toContainText('%');
});
