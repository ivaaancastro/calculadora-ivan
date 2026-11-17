/* global process */
import { test } from '@playwright/test';
import { setupApp } from './support/mockApp.js';
import { SCREENS, openScreen, smallTouchTargets, horizontalOverflow } from './support/ui.js';

// RF4: INFORME, no bloquea. Lista los controles de menos de 44 px a 390 px de ancho.
// Pasa a ser una comprobación que falla en la Capa 2, cuando existan las primitivas.
for (const screen of SCREENS) {
  test(`Táctil · ${screen.name}`, async ({ page }, testInfo) => {
    // TOUCH_UI=v2 repite el informe con la piel v2 (por defecto v1).
    await setupApp(page, { authenticated: screen.auth, ui: process.env.TOUCH_UI || undefined });
    await openScreen(page, screen);
    const small = await smallTouchTargets(page, 44);
    testInfo.annotations.push({
      type: 'controles < 44 px',
      description: `${small.length} en ${screen.name}`,
    });
    const overflow = await horizontalOverflow(page);
    testInfo.annotations.push({ type: 'desbordamiento horizontal', description: `${overflow} px` });
    await testInfo.attach(`controles-pequenos-${screen.name}.json`, {
      body: JSON.stringify(small, null, 2),
      contentType: 'application/json',
    });
    console.log(`[táctil] ${screen.name}: ${small.length} controles < 44 px, desborde ${overflow} px`);
    for (const c of small) console.log(`   ${c.size} ${c.control}`);
  });
}
