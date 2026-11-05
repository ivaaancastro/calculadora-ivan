# Plan de tareas — spec-fix-01 (Corregir imports faltantes en Dashboard refactor)

**Spec:** `docs/branches/fix/investigar-app-rota/spec.md`
**Rama:** `fix/investigar-app-rota` (desde `develop`)

## Tareas

| # | Tarea | Descripción | Estado |
|---|-------|-------------|--------|
| 1 | Diagnosticar | Revisar imports en Dashboard.jsx y ActivitySubRoutes.jsx; confirmar ReferenceError en consola del navegador | pendiente |
| 2 | Corregir Dashboard.jsx | Añadir imports de `AdvancedAnalytics` y `HistoryList`; remover imports lazy no usados (`ActivityDetailPage`, `ProfilePage`) | pendiente |
| 3 | Corregir ActivitySubRoutes.jsx | Añadir import de `ActivityRouteWrapper` desde `./ActivityRouteWrapper` | pendiente |
| 4 | Verificar | `npm run lint`, `npm run build`, `npm run test:unit`, `npm run test:coverage` | pendiente |
| 5 | Registrar | Actualizar `MEMORY.md`, `CHANGELOG.md`; commit `fix(dashboard): ...`; PR hacia `develop` | pendiente |

## Alcance

### ✅ SÍ
- Añadir imports faltantes en `Dashboard.jsx` y `ActivitySubRoutes.jsx`.
- Limpiar imports lazy no usados en `Dashboard.jsx` (opcional).
- Verificar con lint, build, unit tests y coverage.

### ❌ NO
- Modificar `useActivities`, `useSwipeNavigation`.
- Modificar componentes de páginas (`CalendarPage`, `ProfilePage`, etc.).
- Cambiar comportamiento ni rutas.
- Modificar componentes de pruebas E2E.

## Estado
Esperando aprobación del usuario para crear `tasks.md` y comenzar la implementación.

---
Versión: 0.1.0 — 2026-11-05
