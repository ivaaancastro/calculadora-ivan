import { test } from '@playwright/test';
import { setupApp } from './support/mockApp.js';
import { SCREENS, openScreen, smallTouchTargets } from './support/ui.js';

// RF4: INFORME, no bloquea. Lista los controles de menos de 44 px a 390 px de ancho.
// Pasa a ser una comprobación que falla en la Capa 2, cuando existan las primitivas.
for (const screen of SCREENS) {
  test(`Táctil · ${screen.name}`, async ({ page }, testInfo) => {
    await setupApp(page, { authenticated: screen.auth });
    await openScreen(page, screen);
    const small = await smallTouchTargets(page, 44);
    testInfo.annotations.push({
      type: 'controles < 44 px',
      description: `${small.length} en ${screen.name}`,
    });
    await testInfo.attach(`controles-pequenos-${screen.name}.json`, {
      body: JSON.stringify(small, null, 2),
      contentType: 'application/json',
    });
    console.log(`[táctil] ${screen.name}: ${small.length} controles < 44 px`);
  });
}
