# Plan — B1 · Cálculos centralizados

Deriva de [spec.md](spec.md). Aprobado el 2026-11-27 (D1–D5 en A). Progreso en [tasks.md](tasks.md).

## Enfoque
**Elegido:** extender los motores actuales (`tssEngine` como único PMC) y sacar a dos módulos
pequeños lo transversal (`zones.js`, `load.js`). Cambia poco la API que ya consumen las pantallas.

Descartados: parchear cada pantalla (mantiene las copias, que son la causa) y reescribir los
motores en un `metrics/` nuevo (diff enorme, choca con B5/B6/B7 y arriesga las fórmulas buenas).

## Entrega en 3 PR hacia `develop`
En orden; cada rama sale de `develop` con el anterior ya mergeado. Revisa y mergea la PM.

| PR | Rama | Contenido | RF | Desbloquea |
|----|------|-----------|----|------------|
| 1 | `feat/calculos-centralizados` | Fechas y zonas | 1–5 | utilidad de fecha para B2 y B4 |
| 2 | `feat/calculos-pmc` | PMC, TSS, carga y consumidores | 6–14 | B6, B7 |
| 3 | `feat/calculos-distribucion` | Distribución de carga y documentación | 15–20 | B5 |

### PR 1 — Fechas y zonas
1. Tests y `dates.js`: `activityDayKey`, `planDayKey`, `todayKey`, `addDays`, `startOfWeekKey`,
   `formatDayShort`; pruebas con tres husos.
2. Tests y `zones.js`: definiciones, `zoneIndex`, rangos y ritmo estimado por zona.
3. Consumidores de zonas: `tssEngine`, `zonesCalc`, `SportZonesSection`, `useActivityMetrics`
   (C3), `PlannerModal`, `calendarTemplates`, `calendarEngine`, `useFitnessAnalytics`; borrar el
   código muerto que las duplica.

### PR 2 — PMC, TSS y carga
1. Tests y `load.js`: carga por periodo (D3), ACWR y su escala, rampa, tendencia, monotonía.
2. `calculatePMC`: claves locales, proyección con planes, `offsetCtl`, crudos y mostrados (D1).
3. TSS estable (D2) en `usePMCMetrics`.
4. `useActivities`: expone la serie completa; `usePMCMetrics` recibe los planes. `chartData` queda
   solo para la gráfica del Dashboard.
5. Consumidores: Dashboard, Calendario (fuera `projectPmc`), gráfico flotante, Salud, Perfil,
   héroe de Rendimiento (fuera `getTrainingStatus`; VFC según D5), recomendador, `useStravaSync`.
6. E2E: `TSB = CTL − ATL` y mismas cifras entre pantallas; ajustar `mockApp`.

### PR 3 — Distribución de carga
1. Tests y reparto de TSS por categoría en `loadDistribution.js` (aparte de `load.js` para no
   cerrar un ciclo con `tssEngine`); sustituye a `getTrainingBalance`.
2. `TrainingBalanceCard`: 7/28/90, tres categorías, sesiones estimadas y nota de aproximación.
3. «Distribución de foco» según D4.
4. `docs/architecture/metricas.md`; `e2e/stats` y `e2e/metrics`.
5. Cierre: actualizar con `develop`, `CHANGELOG.md` y `MEMORY.md`.

## Verificación por PR
Test antes que código en cada fórmula; `npm run verify`; CI en verde. PR 2 y 3: capturas antes y
después a 390 y 1440 px, claro y oscuro, en el navegador integrado.

## Coordinación y riesgos
- **Ficheros ajenos:** no se prevé tocar tema, tooltips ni `tokens.css`. Se usan `InfoTooltip` y
  las primitivas tal como están.
- **Cifras que cambian:** esperado; el PR 2 incluirá una tabla antes/después con los datos
  simulados.
- **Choques:** B5 empieza tras el PR 3. B2 y B4 deben usar `formatDayShort` y no crear otra.
- **Rendimiento:** la proyección de 90 d y el reparto por zonas se memorizan; el reparto es lineal
  en los segundos de streams.
