import { test, expect } from '@playwright/test';
import { setupApp } from './support/mockApp.js';
import { SCREENS, openScreen, gotoReady } from './support/ui.js';
import { duplicatedMetrics } from './support/metrics.js';

// «Un dato, un sitio» (spec Capa 6, RF-D1): cada cifra con `data-metric` se ve una sola vez
// por pantalla. Solo en escritorio (en móvil, las pestañas ocultan parte de la pantalla).

// Duplicados conocidos, con el PR que los corrige (spec §3.2). Hoy no queda ninguno: si se
// añade uno, la prueba falla si deja de aparecer, para que la lista no se pudra.
const PENDING_DUPLICATES = {
};

for (const screen of SCREENS.filter((s) => s.auth)) {
  test(`Un dato, un sitio · ${screen.name}`, async ({ page }) => {
    await setupApp(page, { authenticated: true });
    await openScreen(page, screen);
    const pending = PENDING_DUPLICATES[screen.name]?.metrics ?? [];
    const found = Object.keys(await duplicatedMetrics(page));
    expect(found.filter((m) => !pending.includes(m)), 'métrica repetida en la pantalla').toEqual([]);
    expect(pending.filter((m) => !found.includes(m)), 'ya corregido: quítalo de PENDING_DUPLICATES').toEqual([]);
  });
}

// Una sola fuente (spec B1, CA-1 y CA-2): el CTL, el ATL y el TSB de hoy son los mismos en todas
// las pantallas, TSB = CTL − ATL, y visitar otras pantallas no los cambia.
test('CTL, ATL y TSB cuadran entre sí y entre pantallas', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); // sin la cuenta animada de las cifras
  await setupApp(page, { authenticated: true });
  const read = async (key) => {
    const text = await page.locator(`[data-metric="${key}"]`).filter({ visible: true }).first().innerText();
    return Number(text.match(/[+\-−]?\d+/)[0].replace('−', '-'));
  };
  const dashboard = async () => ({ ctl: await read('ctl'), atl: await read('atl'), tsb: await read('tsb') });

  await gotoReady(page, '/');
  const nav = (name) => page.getByRole('link', { name }).first().click();
  await expect.poll(async () => (await dashboard()).ctl).toBeGreaterThan(0);
  // Los streams llegan en segundo plano y ajustan el TSS una vez: se espera a que la cifra se asiente.
  await page.waitForLoadState('networkidle');
  const first = await dashboard();
  expect(first.tsb).toBe(first.ctl - first.atl);

  await nav('Rendimiento');
  await expect(page.locator('[data-stats="hero"]').filter({ visible: true })).toBeVisible();
  expect(await read('tsb')).toBe(first.tsb);

  await nav('Calendario');
  await page.locator('[data-cal="pmc-toggle"]').filter({ visible: true }).click();
  const stats = page.locator('[data-cal="pmc"]').locator('[data-cal="pmc-stat"]');
  await expect(stats).toHaveText([`CTL ${first.ctl}`, `ATL ${first.atl}`, new RegExp(`^TSB \\+?${first.tsb}$`)]);

  await nav('Dashboard');
  await expect.poll(dashboard).toEqual(first);

  // Perfil calibra sobre ese mismo CTL; Salud, en zona productiva, no avisa de la forma.
  await gotoReady(page, '/profile');
  await expect(page.getByLabel('Calibrar Fitness (CTL)')).toHaveValue(String(first.ctl));
  await gotoReady(page, '/health');
  await expect(page.locator('[data-health="biomarkers"]').filter({ visible: true }).first()).toBeVisible();
  await expect(page.locator('[data-health="insight"]').filter({ hasText: /Desentrenamiento|TSB/ })).toHaveCount(0);
});

// Con un ajuste manual de +40 en el CTL, la forma de hoy pasa a «Transición»: Dashboard, Perfil y
// Salud lo leen del mismo PMC (spec B1, CA-1).
test('Salud y Perfil usan el mismo CTL y TSB que el Dashboard', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await setupApp(page, { authenticated: true, state: { profile: { user_settings: { offsetCtl: 40 } } } });
  const read = async (key) => {
    const text = await page.locator(`[data-metric="${key}"]`).filter({ visible: true }).first().innerText();
    return Number(text.match(/[+\-−]?\d+/)[0].replace('−', '-'));
  };

  await gotoReady(page, '/');
  await expect.poll(() => read('tsb')).toBeGreaterThan(25);
  await page.waitForLoadState('networkidle');
  const [ctl, atl, tsb] = [await read('ctl'), await read('atl'), await read('tsb')];
  expect(tsb).toBe(ctl - atl);

  await gotoReady(page, '/profile');
  await expect(page.getByLabel('Calibrar Fitness (CTL)')).toHaveValue(String(ctl));
  await gotoReady(page, '/health');
  await expect(page.locator('[data-health="insight"]').filter({ hasText: 'Desentrenamiento', visible: true }).first()).toBeVisible();
});
