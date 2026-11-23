# Tasks — `feat/premium-dashboard`

## PR 1 — Héroe
- [x] Spec y plan aprobados (D-1 → CTL).
- [x] `buildFormSummary` (utils) + test.
- [x] `FormHero` solo v2 en `AdvancedAnalytics` + CSS v2 (bloque «Dashboard D2»).
- [x] `npm run verify`, CHANGELOG.
- [ ] PR abierto y CI verde.

## PR 2 — KPI
- [x] `KpiCard` (delta 7 d, Sparkline 28 d, count-up) para ATL/TSB/ACWR; ACWR sin sparkline (no hay serie) con chip de zona; `kpiTrend` + tests.
- [x] Secundarios en «libro» (v2).
- [x] PR #132 mergeado.

## PR 3 — Rejilla y cierre
- [x] Rejilla 12 col ≥ 1024 px (héroe y KPI a ancho completo; gráfica 8 + lateral 4 sticky con secundarios; contenido a 1440 px; gráfica 380 px).
- [x] MEMORY/CHANGELOG.
- [ ] Snapshots v2 del dashboard regenerados (Docker) y CI verde.
- Diferido: «Qué hacer hoy» en el lateral (ya está en el héroe: `advice`); esqueleto de carga (el `loading` global de `useActivities` se mantiene); ajuste del degradado del área CTL. D7 del usuario pendiente.
