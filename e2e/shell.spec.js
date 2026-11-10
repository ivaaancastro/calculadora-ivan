import { test, expect } from '@playwright/test';
import { setupApp } from './support/mockApp.js';
import { gotoReady } from './support/ui.js';

// spec-rediseno-02-c3 (Capa 3): la shell lee su alto y su orden de capas de tokens.css.
// El PR 1 no mueve un píxel: aquí solo se fija que los tokens están cableados.
const zIndexOf = (page, selector) =>
  page.evaluate((s) => {
    const el = document.querySelector(s);
    return el ? getComputedStyle(el).zIndex : null;
  }, selector);

const heightOf = (page, selector) =>
  page.evaluate((s) => {
    const el = document.querySelector(s);
    return el ? Math.round(el.getBoundingClientRect().height) : null;
  }, selector);

// Resuelve el token a píxeles reales (admite rem y calc con env()).
const varPx = (page, name) =>
  page.evaluate((n) => {
    const probe = document.createElement('div');
    probe.style.cssText = `position:absolute;visibility:hidden;height:var(${n});width:0`;
    document.body.appendChild(probe);
    const value = probe.getBoundingClientRect().height;
    probe.remove();
    return value;
  }, name);

const BOTTOM_NAV = 'nav[aria-label="Navegación móvil flotante estilo Apple"]';

test.beforeEach(async ({ page }) => {
  await setupApp(page, { authenticated: true });
  await gotoReady(page, '/');
});

test('la cabecera usa el token de capa --z-nav', async ({ page }) => {
  const nav = page.locator('nav.glass-nav').first();
  await expect(nav).toBeVisible();
  expect(await zIndexOf(page, 'nav.glass-nav')).toBe('30');
});

test('en móvil, la barra inferior usa --z-nav-menu y el pager descuenta --nav-h-total', async ({
  page,
}) => {
  const bottomNav = page.locator(BOTTOM_NAV);

  if ((page.viewportSize()?.width ?? 0) < 768) {
    await expect(bottomNav).toBeVisible();
    expect(await zIndexOf(page, BOTTOM_NAV)).toBe('40');

    // El contenedor desplazable de cada pestaña mide la ventana menos la cabecera.
    const navH = Math.round(await varPx(page, '--nav-h-total'));
    expect(navH).toBe(56);
    expect(await heightOf(page, '.min-w-full.shrink-0.overflow-y-auto')).toBe(
      (page.viewportSize()?.height ?? 0) - navH,
    );
  } else {
    // En escritorio la barra inferior está en el DOM pero oculta (`md:hidden`).
    await expect(bottomNav).toBeHidden();
  }
});

test('el hueco inferior del pager usa --bottom-nav-reserve', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) >= 768, 'La reserva inferior solo existe en el pager móvil');

  const reserve = Math.round(await varPx(page, '--bottom-nav-reserve'));
  expect(reserve).toBe(128);
  const padding = await page.evaluate(() => {
    const el = document.querySelector('.min-w-full.shrink-0.overflow-y-auto');
    return el ? Math.round(parseFloat(getComputedStyle(el).paddingBottom)) : null;
  });
  expect(padding).toBe(reserve);
});
