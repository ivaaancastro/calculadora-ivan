# Tareas — feat/refactor-hooks-srp (Refactorizar hooks grandes SRP)

**Spec:** `docs/branches/feat/refactor-hooks-srp/spec.md`
**Plan:** `docs/branches/feat/refactor-hooks-srp/plan.md`
**Rama:** `feat/refactor-hooks-srp` (desde `develop`)

## Tareas

- [x] 1. Crear rama `feat/refactor-hooks-srp` desde `develop`
- [x] 2. Extraer `useActivitiesData.js` — queries de datos + estado de carga
- [x] 3. Extraer `useStravaSync.js` — tokens Strava, sync resúmenes, streams, deep sync
- [x] 4. Extraer `useIntervalsAutoSync.js` — auto-sync diario Intervals.icu
- [x] 5. Extraer `usePMCMetrics.js` — cálculo PMC (CTL, ATL, TSB, ACWR, monotonía, strain)
- [x] 6. Extraer `useWellnessData.js` — carga wellness (Supabase / Intervals.icu / simulador)
- [x] 7. Extraer `useWellnessAnalytics.js` — analítica (EWMA, medias móviles, readiness, insights, esfuerzo, peso)
- [x] 8. Reducir `useActivities.js` a hook orquestador (API pública idéntica)
- [x] 9. Reducir `useWellnessInfo.js` a hook orquestador (API pública idéntica)
- [ ] 10. Verificar: `npm run lint`, `npm run build`, `npm run test:unit`, `npm run test:coverage`
- [ ] 11. Registrar: `MEMORY.md`, `CHANGELOG.md`; commit `refactor(hooks): ...`; PR hacia `develop`

---
Versión: 0.1.0 — 2026-11-05
