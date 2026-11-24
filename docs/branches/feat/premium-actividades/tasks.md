# Tasks — `feat/premium-actividades`

Spec y plan aprobados (D-1 sesiones, D-2 semana, D-3 panel lateral ≥ 1280).

## PR 1 — Resumen
- [x] `activityGroups.js` (`weekStartKey`, `groupByWeek`, `summarizeActivities`, `weeklyTss`) + tests.
- [x] `ActivitiesSummary` solo v2 dentro de `HistoryList` + bloque CSS «Actividades D6».
- [x] `npm run verify`, CHANGELOG, MEMORY.
- [ ] PR abierto y CI verde.

## PR 2 — Lista
- [ ] Lista aplanada con cabeceras de semana sticky (virtualizador heterogéneo), fila v2, barra TSS, borrar en hover; tests.

## PR 3 — Filtros y cierre
- [x] Chips de deporte (`SportChips`), `max-w` 1100, panel lateral ≥ 1280 (`SportBreakdown`), vacío con «Quitar filtros». Desvío: el panel lateral solo trae el reparto por deporte; el resumen (cifra + sparkline) se queda en la cabecera de la tarjeta en todos los anchos.
- [ ] Snapshots v2 de `/history` (Docker); MEMORY/CHANGELOG; marcar D6 en `premium-design/tasks.md`; PR abierto y CI verde.
