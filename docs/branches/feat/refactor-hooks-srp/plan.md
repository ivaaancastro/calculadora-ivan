# Plan de tareas — spec-audit-05 (Refactorizar hooks grandes SRP)

**Spec:** `docs/branches/feat/refactor-hooks-srp/spec.md`
**Rama sugerida:** `feat/refactor-hooks-srp` (desde `develop`)

## Tareas

| # | Tarea | Descripción | Estado |
|---|-------|-------------|--------|
| 1 | Crear rama | `git checkout -b feat/refactor-hooks-srp develop` | completado |
| 2 | Extraer `useActivitiesData.js` | Queries de datos (actividades, workouts, perfil) y estado de carga | pendiente |
| 3 | Extraer `useStravaSync.js` | Gestión de tokens Strava, sync de resúmenes, descarga de streams, deep sync | pendiente |
| 4 | Extraer `useIntervalsAutoSync.js` | Auto-sync diario de Intervals.icu al cargar la app | pendiente |
| 5 | Extraer `usePMCMetrics.js` | Cálculo de PMC (CTL, ATL, TSB, ACWR, monotonía, strain) y resumen | pendiente |
| 6 | Extraer `useWellnessData.js` | Carga de wellness desde Supabase, Intervals.icu directo y simulador | pendiente |
| 7 | Extraer `useWellnessAnalytics.js` | Cálculo de métricas analíticas (EWMA, medias móviles, readiness, insights, esfuerzo, peso) | pendiente |
| 8 | Reducir `useActivities.js` | Quedar como hook orquestador que compone los sub-hooks y expone la misma API pública | pendiente |
| 9 | Reducir `useWellnessInfo.js` | Quedar como hook orquestador que compone los sub-hooks y expone la misma API pública | pendiente |
| 10 | Verificar | `npm run lint`, `npm run build`, `npm run test:unit`, `npm run test:coverage` | pendiente |
| 11 | Registrar | Actualizar `MEMORY.md`, `CHANGELOG.md`; commit `refactor(hooks): ...`; PR hacia `develop` | pendiente |

## Alcance

### ✅ SÍ
- Refactor de `useActivities.js` (617 líneas) y `useWellnessInfo.js` (493 líneas) en sub-hooks SRP.
- Nuevos sub-hooks en `src/hooks/`.
- Mantener la API pública idéntica de `useActivities` y `useWellnessInfo`.

### ❌ NO
- Modificar componentes de UI ni páginas.
- Cambiar comportamiento ni flujos de la aplicación.
- Modificar `useProfileQuery`, `useActivitiesQuery`, `usePlannedWorkoutsQuery`, `useIntervalsSync`.
- Añadir tests nuevos (refactor sin cambio de comportamiento).

## Estado
Esperando aprobación del usuario para crear `tasks.md` y comenzar la implementación.

---
Versión: 0.1.0 — 2026-11-05
