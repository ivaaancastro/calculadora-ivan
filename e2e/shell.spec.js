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

test('la cabecera mide --nav-h-total y usa la capa --z-nav', async ({ page }) => {
  const nav = page.locator('nav.glass-nav').first();
  await expect(nav).toBeVisible();
  // La cabecera es la que se ajusta al token, no al contrario (RF1).
  expect(await heightOf(page, 'nav.glass-nav')).toBe(Math.round(await varPx(page, '--nav-h-total')));
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

// --- RF5/RF6/RF8: paridad de la cabecera y acciones movidas a Ajustes -----------------------

test('la cabecera no lleva utilidades ni acciones destructivas (RF5, RF6)', async ({ page }) => {
  for (const title of ['Importar CSV', 'Añadir Manual', 'Borrar DB', 'Cerrar Sesión']) {
    await expect(page.locator(`nav.glass-nav [title="${title}"]`)).toHaveCount(0);
  }
  // Ni el cierre de sesión duplicado que había en móvil y escritorio.
  await expect(page.locator('nav.glass-nav [title="Cerrar sesión"]')).toHaveCount(0);
});

test('cerrar sesión existe en un solo sitio: el menú (RF5, RF8)', async ({ page }) => {
  const logout = page.getByRole('button', { name: /^cerrar sesi[oó]n$/i });
  await expect(logout).toHaveCount(0);

  await page.getByRole('button', { name: 'Menú de configuración y perfil' }).click();
  await expect(logout).toHaveCount(1);
  await expect(logout).toBeVisible();
});

test('el tema cambia, se guarda y sobrevive a la navegación (RF8)', async ({ page }) => {
  const isDark = () => page.evaluate(() => document.documentElement.classList.contains('dark'));
  const before = await isDark();

  await page.getByRole('button', { name: 'Cambiar tema' }).click();
  await expect.poll(isDark).toBe(!before);
  expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe(before ? 'light' : 'dark');

  await page.goto('/calendar');
  await expect.poll(isDark).toBe(!before);
});

test('borrar actividades vive en Ajustes y pide confirmación (RF6)', async ({ page }) => {
  await page.goto('/profile?section=security');
  const button = page.getByRole('button', { name: 'Borrar Actividades' });
  await expect(button).toBeVisible();

  let message = '';
  page.once('dialog', async (dialog) => {
    message = dialog.message();
    await dialog.dismiss();
  });
  await button.click();
  await expect.poll(() => message).toMatch(/borrar TODAS tus actividades/i);

  // Descartar no borra nada: el botón sigue ahí y la lista de actividades también.
  await expect(button).toBeVisible();
  await page.goto('/history');
  await expect(page.locator('#root')).not.toBeEmpty();
});
