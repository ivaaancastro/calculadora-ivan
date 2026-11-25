# Especificación SDD — fix/investigar-app-rota

## 1. Identificación
- **ID:** spec-fix-01
- **Título:** Corregir imports faltantes en Dashboard.jsx y ActivitySubRoutes.jsx tras refactor SRP
- **Autor:** agente de implementación (Forma / calculadora-ivan)
- **Fecha:** 2026-11-05
- **Estado:** pendiente

## 2. Objetivo
Diagnosticar y corregir por qué la aplicación no funciona en el navegador tras el refactor de `Dashboard.jsx` (PR #41, mergeado a `develop`), extrayendo 6 subcomponentes a `src/components/dashboard/`. Corregir los imports faltantes que provocan `ReferenceError` en tiempo de ejecución.

## 3. Contexto y justificación
- El PR #41 (rama `feat/refactor-dashboard-srp`, mergeado a `develop`) refactorizó `Dashboard.jsx` (313 líneas → shell de orquestación) extrayendo 6 subcomponentes: `EmptyState`, `UploadStatusBanner`, `MobileTabsView`, `DesktopRoutesView`, `ActivitySubRoutes`, `ActivityRouteWrapper`.
- Tras el merge, la aplicación está rota (no renderiza correctamente en el navegador).
- Se han identificado 3 imports faltantes que provocan `ReferenceError` en tiempo de ejecución:
  1. `Dashboard.jsx` usa `AdvancedAnalytics` (línea 120) pero no lo importa. Existe como export named en `src/components/dashboard/AdvancedAnalytics.jsx`.
  2. `Dashboard.jsx` usa `HistoryList` (línea 184) pero no lo importa. Existe como export named en `src/components/dashboard/HistoryList.jsx`.
  3. `ActivitySubRoutes.jsx` usa `ActivityRouteWrapper` (línea 59) pero no lo importa. Existe como export named en `src/components/dashboard/ActivityRouteWrapper.jsx`.
- Estos `ReferenceError` impiden que React monte el árbol de componentes, rompiendo la app por completo.

## 4. Requisitos funcionales
- [ ] Importar `AdvancedAnalytics` en `src/components/Dashboard.jsx` desde `./dashboard/AdvancedAnalytics`.
- [ ] Importar `HistoryList` en `src/components/Dashboard.jsx` desde `./dashboard/HistoryList`.
- [ ] Importar `ActivityRouteWrapper` en `src/components/dashboard/ActivitySubRoutes.jsx` desde `./ActivityRouteWrapper`.
- [ ] (Opcional limpieza) Remover imports lazy no usados en `Dashboard.jsx` (`ActivityDetailPage`, `ProfilePage`) que ya viven en los subcomponentes.
- [ ] `Dashboard.jsx` debe renderizar sin errores de React (`ReferenceError`, `Element type is invalid`, etc.).
- [ ] No cambiar comportamiento de la aplicación (mismo flujo de navegación, mismo renderizado condicional).

## 5. Criterios de aceptación
- [ ] `npm run lint` pasa.
- [ ] `npm run build` pasa (Vite build sin errores).
- [ ] `npm run test:unit` pasa.
- [ ] `npm run test:coverage` pasa.
- [ ] La app renderiza en el navegador sin `ReferenceError` en consola.
- [ ] Commit con convención estándar: `fix(dashboard): <descripción>`.
- [ ] PR abierto hacia `develop` (esperando aprobación para merge).
- [ ] `MEMORY.md` actualizado.
- [ ] `CHANGELOG.md` actualizado.

## 6. Diseño técnico
- **Componentes afectados (modificados):**
  - `src/components/Dashboard.jsx` (añadir imports faltantes).
  - `src/components/dashboard/ActivitySubRoutes.jsx` (añadir import faltante).
- **Componentes afectados (lectura, sin modificación):**
  - `src/components/dashboard/AdvancedAnalytics.jsx` (export named `AdvancedAnalytics`).
  - `src/components/dashboard/HistoryList.jsx` (export named `HistoryList`).
  - `src/components/dashboard/ActivityRouteWrapper.jsx` (export named `ActivityRouteWrapper`).
- **Rutas afectadas:** `src/App.jsx` (usa `Dashboard` bajo `path="*"`).
- **Rama:** `fix/investigar-app-rota` creada desde `develop`.
- **Merge:** PR hacia `develop` (no a `main`).

## 7. Pruebas
- **Unitarias:** `src/__tests__/unit/` (existentes, no se añaden nuevas).
- **Integración:** `src/__tests__/integration/` (existentes).
- **E2E:** `e2e/` (verificar que LandingPage sigue teniendo el texto buscado por E2E).

## 8. Notas adicionales
- El refactor original (spec-audit-04) cumplió sus requisitos funcionales pero olvidó 3 imports, lo que rompe la app en producción.
- No modificar código fuera del alcance de esta espec (solo añadir los imports faltantes y limpiar imports no usados si corresponde).
- No commitear directamente a `main` ni a `develop`; siempre vía PR hacia `develop`.

---
Versión: 0.1.0 — 2026-11-05
