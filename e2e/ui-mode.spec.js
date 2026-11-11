/* global process */
/**
 * Mecanismo de la piel v2 (spec-rediseno-02-c3-skin, RF9):
 * `html[data-ui="v2"]` se aplica antes del primer pintado, se puede cambiar en
 * caliente y no debe recargar, perder la sesión ni repetir peticiones.
 *
 * En el PR del mecanismo v2 no pinta nada: eso lo vigilan las 48 capturas de
 * `visual-v2.spec.js`, que deben ser idénticas a las de v1.
 */
import { test, expect } from '@playwright/test';
import { setupApp } from './support/mockApp.js';
import { gotoReady } from './support/ui.js';

const html = (page) => page.locator('html');
const hasDataUi = (page) =>
  page.evaluate(() => document.documentElement.hasAttribute('data-ui'));
const authToken = (page) =>
  page.evaluate(() => localStorage.getItem('sb-e2e-forma-auth-token'));
const storedUi = (page) => page.evaluate(() => localStorage.getItem('ui'));

// Sonda del primer frame: `requestAnimationFrame` corre antes del primer pintado,
// así que si el atributo no estuviera puesto desde el script de index.html, aquí
// valdría null (parpadeo de v1).
const probeFirstFrame = (page) =>
  page.addInitScript(() => {
    window.__uiAtFirstFrame = undefined;
    requestAnimationFrame(() => {
      window.__uiAtFirstFrame = document.documentElement.getAttribute('data-ui');
    });
  });

test('localStorage aplica data-ui="v2" antes del primer frame', async ({ page }) => {
  await probeFirstFrame(page);
  await setupApp(page, { authenticated: true, ui: 'v2' });
  await gotoReady(page, '/');

  expect(await page.evaluate(() => window.__uiAtFirstFrame)).toBe('v2');
  await expect(html(page)).toHaveAttribute('data-ui', 'v2');
  expect(await storedUi(page)).toBe('v2');
});

test('en v1 el atributo está ausente, no vale "v1" (M2)', async ({ page }) => {
  await probeFirstFrame(page);
  await setupApp(page, { authenticated: true });
  await gotoReady(page, '/');

  expect(await page.evaluate(() => window.__uiAtFirstFrame)).toBe(null);
  expect(await hasDataUi(page)).toBe(false);
});

test('el conmutador cambia sin recargar, conserva la sesión y no repite peticiones', async ({
  page,
}) => {
  await setupApp(page, { authenticated: true });
  await gotoReady(page, '/profile');

  const requests = [];
  page.on('request', (request) => {
    if (request.url().includes('/rest/v1/activities')) requests.push(request.url());
  });
  const requestsBeforeClick = requests.length;
  const sessionBefore = await authToken(page);
  const switchControl = page.getByRole('switch', { name: 'Vista previa v2' });
  await expect(switchControl).toHaveAttribute('aria-checked', 'false');

  // Marca en `window`: si la app recargara, desaparecería.
  await page.evaluate(() => {
    window.__uiToggleMarker = true;
  });

  await switchControl.click();
  await expect(html(page)).toHaveAttribute('data-ui', 'v2');
  await expect(switchControl).toHaveAttribute('aria-checked', 'true');
  expect(await storedUi(page)).toBe('v2');
  expect(await page.evaluate(() => window.__uiToggleMarker)).toBe(true);
  expect(await authToken(page)).toBe(sessionBefore);
  expect(requests).toHaveLength(requestsBeforeClick);

  await switchControl.click();
  expect(await hasDataUi(page)).toBe(false);
  await expect(switchControl).toHaveAttribute('aria-checked', 'false');
  expect(await storedUi(page)).toBe('v1');
  expect(requests).toHaveLength(requestsBeforeClick);
});

test('tras volver a cargar, el conmutador refleja lo elegido', async ({ page }) => {
  await setupApp(page, { authenticated: true });
  await gotoReady(page, '/profile');
  await page.getByRole('switch', { name: 'Vista previa v2' }).click();
  await expect(html(page)).toHaveAttribute('data-ui', 'v2');

  await gotoReady(page, '/profile');

  await expect(html(page)).toHaveAttribute('data-ui', 'v2');
  await expect(page.getByRole('switch', { name: 'Vista previa v2' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
});

// La ruta por entorno se comprueba a mano (y en el PR):
//   VITE_UI=v2 npx playwright test e2e/ui-mode.spec.js -g VITE_UI
const envV2 = process.env.VITE_UI === 'v2';

test('VITE_UI=v2 arranca en v2 sin localStorage', async ({ page }) => {
  test.skip(!envV2, 'Solo con el servidor arrancado con VITE_UI=v2');

  await probeFirstFrame(page);
  await setupApp(page, { authenticated: true });
  await gotoReady(page, '/');

  expect(await page.evaluate(() => window.__uiAtFirstFrame)).toBe('v2');
  await expect(html(page)).toHaveAttribute('data-ui', 'v2');
});

test('localStorage v1 gana a VITE_UI=v2 (M1)', async ({ page }) => {
  test.skip(!envV2, 'Solo con el servidor arrancado con VITE_UI=v2');

  await setupApp(page, { authenticated: true, ui: 'v1' });
  await gotoReady(page, '/');

  expect(await hasDataUi(page)).toBe(false);
  expect(await storedUi(page)).toBe('v1');
});
