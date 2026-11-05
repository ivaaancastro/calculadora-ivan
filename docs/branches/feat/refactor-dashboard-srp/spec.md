# Especificación SDD — spec-audit-04

## 1. Identificación
- **ID:** spec-audit-04
- **Título:** Refactorizar `Dashboard.jsx` (313 líneas) en componentes más pequeños (SRP)
- **Autor:** agente de implementación (Forma / calculadora-ivan)
- **Fecha:** 2026-11-05
- **Estado:** pendiente

## 2. Objetivo
Extraer de `Dashboard.jsx` (313 líneas) los subcomponentes que cumplen una responsabilidad única cada uno: manejo de estado de carga, renderizado de las 5 vistas principales (AdvancedAnalytics, FitnessStats, Calendar, Health, History), gestión del modal, navegación móvil, y la ruta de detalle de actividad. Mejorar legibilidad, mantenibilidad y testabilidad cumpliendo SRP.

## 3. Contexto y justificación
- `Dashboard.jsx` tiene 313 líneas y acumula múltiples responsabilidades: estado global de actividades, navegación, renderizado condicional de vistas, manejo de modales, rutas lazy, y lógica de pestañas móviles.
- El roadmap de auditoría (MEMORY.md, Fase 3 — Refactorización core) especifica esta spec como prioridad tras spec-audit-03.
- SRP (Single Responsibility Principle): cada componente extraído debe hacer una sola cosa y tener un solo motivo para cambiar.

## 4. Requisitos funcionales
- [ ] Extraer `EmptyState` (pantalla de base de datos vacía) a su propio componente.
- [ ] Extraer `UploadStatusBanner` (banner de estado de subida) a su propio componente.
- [ ] Extraer `MobileTabsView` (vista móvil con MobileSwipePager + las 5 vistas renderizadas) a su propio componente.
- [ ] Extraer `DesktopRoutesView` (vista escritorio con Routes + las 5 vistas renderizadas) a su propio componente.
- [ ] Extraer `ActivitySubRoutes` (rutas de /profile y /activity/:id con ErrorBoundary/Suspense) a su propio componente.
- [ ] Mantener `ActivityRouteWrapper` como componente separado (ya existe internamente, se extrae).
- [ ] `Dashboard.jsx` debe quedar como shell que orquesta: proveedor de estado (`useActivities`), `Navbar`, `UploadStatusBanner`, vista móvil/escritorio, `BottomNav`, `AddActivityModal`.
- [ ] No cambiar comportamiento de la aplicación (mismo flujo de navegación, mismo renderizado condicional).
- [ ] Todos los props y callbacks actuales se mantienen funcionando.

## 5. Criterios de aceptación
- [ ] Archivos creados en `src/components/dashboard/` para cada subcomponente extraído.
- [ ] `Dashboard.jsx` reducido significativamente (shell de orquestación, sin lógica de renderizado de vistas).
- [ ] `npm run lint` pasa.
- [ ] `npm run build` pasa.
- [ ] `npm run test:unit` pasa.
- [ ] `npm run test:coverage` pasa.
- [ ] Commit con convención de commits (ej. `refactor(dashboard): ...`).
- [ ] PR abierto hacia `develop`.
- [ ] `MEMORY.md` actualizado (spec-audit-04 marcada como implementada).
- [ ] `CHANGELOG.md` actualizado.

## 6. Diseño técnico
- **Archivos afectados (modificados):** `src/components/Dashboard.jsx` (se reduce a shell).
- **Archivos afectados (nuevos):**
  - `src/components/dashboard/EmptyState.jsx`
  - `src/components/dashboard/UploadStatusBanner.jsx`
  - `src/components/dashboard/MobileTabsView.jsx`
  - `src/components/dashboard/DesktopRoutesView.jsx`
  - `src/components/dashboard/ActivitySubRoutes.jsx`
- **Componentes ya existentes (reutilizados sin modificación):** `Navbar`, `BottomNav`, `MobileSwipePager`, `AdvancedAnalytics`, `FitnessStatsPage`, `CalendarPage`, `HealthPage`, `HistoryList`, `AddActivityModal`, `ErrorBoundary`, `ProfilePage`, `ActivityDetailPage`.
- **Hooks afectados (lectura):** `useActivities`, `useSwipeNavigation`.
- **Rama:** `feat/refactor-dashboard-srp` creada desde `develop`.
- **Merge:** PR hacia `develop` (no a `main`).

## 7. Pruebas
- **Unitarias:** no se añaden tests nuevos en esta spec (refactor sin cambio de comportamiento); los tests existentes deben seguir pasando.
- **Integración:** `npm run test:coverage` debe pasar.
- **E2E:** no aplica (el refactor no cambia rutas ni comportamiento visible).

## 8. Notas adicionales
- No modificar código de producción fuera del alcance de esta spec (solo refactor de `Dashboard.jsx` y nuevos subcomponentes).
- No commitear directamente a `main` ni a `develop`; siempre vía PR hacia `develop`.
- No iniciar la siguiente tarea hasta que esta esté mergeada.

---
Versión: 0.1.0 — 2026-11-05
