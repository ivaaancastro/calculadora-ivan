import { test, expect } from '@playwright/test';
import { setupApp } from './support/mockApp.js';
import { SCREENS, openScreen, horizontalOverflow, coveredByFixedBars } from './support/ui.js';

// RF3: ninguna barra fija tapa contenido al cargar y la página no se desborda en horizontal.
// La barra inferior móvil es flotante por diseño y cubre el borde inferior del viewport mientras
// se hace scroll, así que solo se vigilan las barras ancladas arriba (cabecera y navegación).
for (const screen of SCREENS) {
  test.describe(`Layout · ${screen.name}`, () => {
    test.beforeEach(async ({ page }) => {
      await setupApp(page, { authenticated: screen.auth });
      await openScreen(page, screen);
    });

    test('sin desbordamiento horizontal de la página', async ({ page }) => {
      expect(await horizontalOverflow(page)).toBe(0);
    });

    test('ninguna barra fija tapa contenido al cargar', async ({ page }) => {
      expect(await coveredByFixedBars(page, 'top')).toEqual([]);
    });
  });
}
