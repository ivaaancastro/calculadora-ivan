# Plan — `feat/premium-calendario`

Deriva de `spec.md`. PRs pequeños a `develop`; el root mergea con CI en verde. Solo se tocan `CalendarPage.jsx`, `calendar/*`, `src/utils/monthSummary.js`, componentes nuevos en `src/components/calendar/` y un bloque propio y acotado «Calendario D5» en `skin-v2.css`. Tokens compartidos solo si es imprescindible.

| PR | Rama | Contenido |
|----|------|-----------|
| 1 | `feat/premium-calendario` | Spec+plan+tasks; `buildMonthSummary` + tests; `MonthHero` (frase + 4 KPI + nav) solo v2; heatmap reubicado; CSS del héroe; CHANGELOG. |
| 2 | `feat/premium-calendario-rejilla` | Tinte de carga por día; ficha de sesión con estados (realizado/cumplido/planificado/omitido); cabecera semanal compacta; extraer `DayCell`/`SessionCard` de `CalendarMonthView` (381 líneas) sin cambiar v1. |
| 3 | `feat/premium-calendario-cierre` | Móvil 390 (separador de semana), PMC flotante en tokens, capturas v2 del Calendario (workflow `Update snapshots`, 2–3 revisadas una a una), MEMORY/CHANGELOG, marcar D5. |

Verificación por PR: `npm run verify`; E2E y `style-diff` en el CI; capturas solo en el PR 3 y solo las que cambian a propósito (AGENTS §8, mutex si Docker local).

Riesgos: (1) `CalendarMonthView` mezcla v1/v2 en un solo JSX: la extracción debe mantener el DOM v1 idéntico (style-diff v1 = 0); (2) otras sesiones editan `skin-v2.css` y `CHANGELOG.md`: bloque aislado y fusionar `develop` antes de pedir merge; (3) fecha: tinte y frase dependen de «hoy»; verificar contra la fecha fija del e2e; (4) `fullPmcByDate` trae CTL/ATL/TSB por día: confirmar antes del PR 2.
