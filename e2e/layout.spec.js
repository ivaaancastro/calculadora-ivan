import { test, expect } from '@playwright/test';
import { setupApp } from './support/mockApp.js';
import {
  SCREENS,
  openScreen,
  gotoReady,
  horizontalOverflow,
  coveredByFixedBars,
  overlappingBlocks,
  smallTouchTargets,
} from './support/ui.js';

// Red de seguridad de maquetación en DOM (spec-capa6, RF-A3), sin capturas. Corre en los
// proyectos `desktop` (1440 px) y `mobile` (390 px, con toque).
const isMobile = (page) => (page.viewportSize()?.width ?? 0) < 768;

// Controles pequeños conocidos, con el PR del plan de la Capa 6 que los corrige. Al corregirlos,
// se quitan de aquí: la prueba falla si uno de la lista ya no aparece (así la lista no se pudre).
const PENDING_SMALL = {
};

for (const screen of SCREENS) {
  test.describe(`Layout · ${screen.name}`, () => {
    test.beforeEach(async ({ page }) => {
      await setupApp(page, { authenticated: screen.auth });
      await openScreen(page, screen);
    });

    test('sin desbordamiento horizontal de la página', async ({ page }) => {
      expect(await horizontalOverflow(page)).toBe(0);
    });

    // La barra inferior móvil es flotante por diseño: solo se vigilan las barras ancladas arriba.
    test('ninguna barra fija tapa contenido al cargar', async ({ page }) => {
      expect(await coveredByFixedBars(page, 'top')).toEqual([]);
    });

    test('ningún bloque se solapa con otro', async ({ page }) => {
      expect(await overlappingBlocks(page)).toEqual([]);
    });

    test('objetivos táctiles de al menos 44 px en móvil', async ({ page }) => {
      test.skip(!isMobile(page), 'Solo en móvil');
      const pending = PENDING_SMALL[screen.name] ?? [];
      const found = [...new Set((await smallTouchTargets(page, 44)).map((c) => c.control))];
      expect(found.filter((c) => !pending.includes(c))).toEqual([]);
      expect(pending.filter((c) => !found.includes(c)), 'ya corregido: quítalo de PENDING_SMALL').toEqual([]);
    });
  });
}

// --- Shell: cabecera y barra inferior leen su alto y su capa de tokens.css -------------------
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

test.describe('Shell', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page, { authenticated: true });
    await gotoReady(page, '/');
  });

  test('la cabecera mide --nav-h-total y usa la capa --z-nav', async ({ page }) => {
    await expect(page.locator('nav.glass-nav').first()).toBeVisible();
    expect(await heightOf(page, 'nav.glass-nav')).toBe(Math.round(await varPx(page, '--nav-h-total')));
    expect(await zIndexOf(page, 'nav.glass-nav')).toBe('30');
  });

  test('la barra inferior solo existe en móvil, con --z-nav-menu y la reserva del pager', async ({ page }) => {
    const bottomNav = page.locator(BOTTOM_NAV);
    if (!isMobile(page)) {
      await expect(bottomNav).toBeHidden();
      return;
    }
    await expect(bottomNav).toBeVisible();
    expect(await zIndexOf(page, BOTTOM_NAV)).toBe('40');
    const pager = '.min-w-full.shrink-0.overflow-y-auto';
    const navH = Math.round(await varPx(page, '--nav-h-total'));
    expect(await heightOf(page, pager)).toBe((page.viewportSize()?.height ?? 0) - navH);
    const reserve = Math.round(await varPx(page, '--bottom-nav-reserve'));
    const padding = await page.evaluate(
      (s) => Math.round(parseFloat(getComputedStyle(document.querySelector(s)).paddingBottom)),
      pager,
    );
    expect(padding).toBe(reserve);
  });

  test('la cabecera no lleva utilidades ni acciones destructivas', async ({ page }) => {
    for (const title of ['Importar CSV', 'Añadir Manual', 'Borrar DB', 'Cerrar Sesión', 'Cerrar sesión']) {
      await expect(page.locator(`nav.glass-nav [title="${title}"]`)).toHaveCount(0);
    }
  });

  test('cerrar sesión existe en un solo sitio: el menú', async ({ page }) => {
    const logout = page.getByRole('button', { name: /^cerrar sesi[oó]n$/i });
    await expect(logout).toHaveCount(0);
    await page.getByRole('button', { name: 'Menú de configuración y perfil' }).click();
    await expect(logout).toHaveCount(1);
    await expect(logout).toBeVisible();
  });

  test('el tema cambia, se guarda y sobrevive a la navegación', async ({ page }) => {
    const isDark = () => page.evaluate(() => document.documentElement.classList.contains('dark'));
    const before = await isDark();
    await page.getByRole('button', { name: 'Cambiar tema' }).click();
    await expect.poll(isDark).toBe(!before);
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe(before ? 'light' : 'dark');
    await page.goto('/calendar');
    await expect.poll(isDark).toBe(!before);
  });

  test('borrar actividades vive en Ajustes y pide confirmación', async ({ page }) => {
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
    await expect(button).toBeVisible();
  });
});
