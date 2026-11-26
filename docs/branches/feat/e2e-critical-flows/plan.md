# Plan de tareas — spec-e2e-01 (Pruebas E2E críticas)

**Spec:** `docs/branches/feat/e2e-critical-flows/spec.md`
**Rama sugerida:** `feat/e2e-critical-flows` (desde `develop`)

## Tareas

| # | Tarea | Descripción | Estado |
|---|-------|-------------|--------|
| 1 | Crear rama | `git checkout -b feat/e2e-critical-flows develop` | completado |
| 2 | Escribir spec.md | Especificación completa (hecho) | completado |
| 3 | Escribir plan.md | Plan de tareas derivado de la spec + MEMORY.md | completado |
| 4 | Presentar para aprobación | Mostrar spec.md y plan.md al usuario | pendiente |
| 5 | Crear tasks.md | Tras aprobación del usuario | pendiente |
| 6 | Implementar e2e/auth.spec.js | Login exitoso, redirección, logout | pendiente |
| 7 | Implementar e2e/dashboard.spec.js | Dashboard autenticado + métricas clave | pendiente |
| 8 | Implementar e2e/activities.spec.js | Añadir actividad → listar → detalle | pendiente |
| 9 | Implementar e2e/strava.spec.js | Sincronización Strava mockeada | pendiente |
| 10 | Implementar e2e/export.spec.js | Exportación CSV y descarga | pendiente |
| 11 | Implementar e2e/account.spec.js | Eliminación de cuenta | pendiente |
| 12 | Mocker APIs externas | page.route() para Supabase, Strava, Intervals.icu, Gemini | pendiente |
| 13 | Verificar | `npm run test:e2e` pasa local y en CI | pendiente |
| 14 | Registrar | MEMORY.md, CHANGELOG.md, docs/specs/README.md, spec.md | pendiente |
| 15 | Commit `feat(e2e): ...` y push | | pendiente |
| 16 | Abrir PR hacia `develop` | | pendiente |
| 17 | Merge a `develop` | [ ] Esperando autorización del usuario | pendiente |

## Alcance

### ✅ SÍ
- Pruebas E2E de flujos críticos con Playwright.
- Mockeo de APIs externas (determinista, sin credenciales reales).
- Ejecución en CI (push a `main`/`develop` y PRs).

### ❌ NO
- Pruebas contra APIs reales (Strava, Intervals.icu, Gemini) con credenciales de producción.
- Flujos de pago (no existen en la app).
- Modificar el comportamiento de la aplicación (solo añadir tests).

## Estado
Esperando aprobación del usuario para crear `tasks.md` y comenzar la implementación.

---
Versión: 0.1.0 — 2026-11-05
