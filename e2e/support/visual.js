/**
 * Captura de referencia compartida por `visual.spec.js` (v1) y `visual-v2.spec.js` (v2).
 *
 * Las dos redes tienen que preparar la página igual: misma sesión, mismos datos y los
 * mismos filtros de ruido. Si viviera duplicado, una podría derivar sin que la otra se
 * enterase (spec-rediseno-02-c3-skin, RF11.2).
 */
import { expect, test } from '@playwright/test';
import { setupApp } from './mockApp.js';
import { SCREENS, THEMES, openScreen, settleForScreenshot } from './ui.js';

/**
 * Declara 8 pantallas × 2 temas para el proyecto de Playwright que corresponda.
 * `ui: 'v2'` siembra `localStorage.ui` antes de cargar (piel v2).
 */
export function defineVisualSuite({ ui } = {}) {
  for (const theme of THEMES) {
    test.describe(`Regresión visual${ui ? ' v2' : ''} · tema ${theme}`, () => {
      for (const screen of SCREENS) {
        test(`${screen.name}`, async ({ page }) => {
          await setupApp(page, { authenticated: screen.auth, theme, ui });
          await openScreen(page, screen);

          // En móvil cada pestaña principal tiene su propio scroll interno (MobileSwipePager):
          // se expande para que la captura incluya todo su contenido.
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
}
