import { test, expect } from '@playwright/test';
import { setupApp } from './support/mockApp.js';
import { SCREENS, openScreen } from './support/ui.js';
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
