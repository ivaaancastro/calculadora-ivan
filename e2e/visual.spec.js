/* global process */
import { test, expect } from '@playwright/test';
import { setupApp } from './support/mockApp.js';
import { SCREENS, THEMES, openScreen, settleForScreenshot } from './support/ui.js';

// Las capturas de referencia se generan en Linux (imagen oficial de Playwright),
// igual que en CI. Las de macOS/Windows no son comparables: ahí se omiten.
test.skip(
  process.platform !== 'linux',
  'Capturas de referencia solo en Linux. Ejecuta `npm run test:e2e:docker` para compararlas.',
);

for (const theme of THEMES) {
  test.describe(`Regresión visual · tema ${theme}`, () => {
    for (const screen of SCREENS) {
      test(`${screen.name}`, async ({ page }) => {
        await setupApp(page, { authenticated: screen.auth, theme });
        await openScreen(page, screen);
        // En móvil cada pestaña principal tiene su propio scroll interno (MobileSwipePager):
        // se expande para que la captura de página completa incluya todo su contenido.
        if ((page.viewportSize()?.width ?? 1440) < 768) {
          await page.addStyleTag({
            content: '.min-w-full.shrink-0.overflow-y-auto{height:auto!important;overflow:visible!important}',
          });
        }
        // Se ocultan dos fuentes de ruido de dibujo, no de contenido: las partículas de la
        // landing (<canvas> animado) y la rejilla discontinua de las gráficas, que se
        // desplaza 1 px entre equipos. Las series, ejes y el resto de la página siguen vigilados.
        await page.addStyleTag({
          content: 'canvas{visibility:hidden!important}.recharts-cartesian-grid{visibility:hidden!important}',
        });
        await settleForScreenshot(page, { resize: !screen.fullPage });
        await expect(page).toHaveScreenshot(`${screen.name}-${theme}.png`, {
          fullPage: !!screen.fullPage,
        });
      });
    }
  });
}
