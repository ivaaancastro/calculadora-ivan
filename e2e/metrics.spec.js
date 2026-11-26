import { test, expect } from '@playwright/test';
import { setupApp } from './support/mockApp.js';
import { SCREENS, openScreen } from './support/ui.js';
import { duplicatedMetrics } from './support/metrics.js';

// «Un dato, un sitio» (spec Capa 6, RF-D1): cada cifra con `data-metric` se ve una sola vez
// por pantalla. Solo en escritorio (en móvil, las pestañas ocultan parte de la pantalla).

// Duplicados conocidos (spec §3.2), con el PR del plan de la Capa 6 que los corrige. Al
// corregirlos, se quitan de aquí: la prueba falla si uno de la lista ya no aparece.
const PENDING_DUPLICATES = {
  dashboard: { pr: 15, metrics: ['ctl', 'atl', 'tsb'] }, // héroe y KPI frente al readout del gráfico
  detalle: { pr: 16, metrics: ['impact'] }, // chip de impacto y primera frase del Coach
  rendimiento: { pr: 18, metrics: ['load7', 'tsb', 'hrv', 'vo2max'] }, // héroe frente a tarjetas; VO₂ y subtarjeta
  actividades: { pr: 19, metrics: ['activities'] }, // «85 sesiones» y «85 actividades»
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
