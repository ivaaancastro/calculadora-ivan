# Plan de tareas — spec-audit-04 (Refactor Dashboard.jsx SRP)

**Spec:** `docs/branches/feat/refactor-dashboard-srp/spec.md`
**Rama sugerida:** `feat/refactor-dashboard-srp` (desde `develop`)

## Tareas

| # | Tarea | Descripción | Estado |
|---|-------|-------------|--------|
| 1 | Crear rama | `git checkout -b feat/refactor-dashboard-srp develop` | pendiente |
| 2 | Extraer `EmptyState.jsx` | Pantalla de "Base de datos vacía" (líneas 227-241 de Dashboard.jsx) | pendiente |
| 3 | Extraer `UploadStatusBanner.jsx` | Banner de estado de subida (líneas 220-224) | pendiente |
| 4 | Extraer `MobileTabsView.jsx` | Vista móvil: `MobileSwipePager` + las 5 vistas renderizadas (líneas 272-281) | pendiente |
| 5 | Extraer `DesktopRoutesView.jsx` | Vista escritorio: `Routes` + las 5 vistas renderizadas (líneas 284-292) | pendiente |
| 6 | Extraer `ActivitySubRoutes.jsx` | Rutas de `/profile` y `/activity/:id` con ErrorBoundary/Suspense (líneas 242-269) | pendiente |
| 7 | Extraer `ActivityRouteWrapper.jsx` | Wrapper de ruta de detalle de actividad (líneas 35-55) | pendiente |
| 8 | Reducir `Dashboard.jsx` | Quedar como shell de orquestación: `useActivities`, `Navbar`, `UploadStatusBanner`, vista móvil/escritorio, `BottomNav`, `AddActivityModal` | pendiente |
| 9 | Verificar | `npm run lint`, `npm run build`, `npm run test:unit`, `npm run test:coverage` | pendiente |
| 10 | Registrar | Actualizar `MEMORY.md`, `CHANGELOG.md`, commit `refactor(dashboard): ...`, PR hacia `develop` | pendiente |

## Alcance

### ✅ SÍ
- Refactor de `Dashboard.jsx` (313 líneas → shell).
- Nuevos subcomponentes en `src/components/dashboard/`.

### ❌ NO
- Modificar `useActivities`, `useSwipeNavigation`.
- Modificar componentes de páginas (`CalendarPage`, `ProfilePage`, etc.).
- Cambiar comportamiento ni rutas.

## Estado
Esperando aprobación del usuario para crear `tasks.md` y comenzar la implementación.

---
Versión: 0.1.0 — 2026-11-05
