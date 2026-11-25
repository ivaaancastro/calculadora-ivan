# Especificación SDD — spec-audit-05

## 1. Identificación
- **ID:** spec-audit-05
- **Título:** Refactorizar hooks grandes (`useActivities.js`, `useWellnessInfo.js`) en hooks enfocados (SRP)
- **Autor:** agente de implementación (Forma / calculadora-ivan)
- **Fecha:** 2026-11-05
- **Estado:** pendiente

## 2. Objetivo
Extraer de `useActivities.js` (617 líneas) y `useWellnessInfo.js` (493 líneas) los sub-hooks que cumplen una responsabilidad única cada uno: gestión de datos (queries), sincronización con Strava (token + resúmenes + telemetría), cálculo del PMC, gestión de perfil y workouts, y carga/analítica de wellness. Mejorar legibilidad, mantenibilidad y testabilidad cumpliendo SRP.

## 3. Contexto y justificación
- `useActivities.js` tiene 617 líneas y acumula múltiples responsabilidades: queries de TanStack Query, sincronización con Strava (tokens, resúmenes, streams, deep sync), auto-sync de Intervals.icu, cálculo del PMC (CTL/ATL/TSB/ACWR/monotonía/strain), gestión de perfil, workouts planificados y operaciones de BD (borrar actividad, clear DB).
- `useWellnessInfo.js` tiene 493 líneas y acumula: carga de wellness (Supabase, Intervals.icu directo, simulador), generación de datos simulados, cálculo de métricas analíticas (EWMA HRV/RHR, medias móviles, score de readiness, insights, esfuerzo, tendencia de peso).
- El roadmap de auditoría (MEMORY.md, Fase 3 — Refactorización core) especifica esta spec como siguiente tras spec-audit-04.
- SRP (Single Responsibility Principle): cada sub-hook debe hacer una sola cosa y tener un solo motivo para cambiar.

## 4. Requisitos funcionales
- [ ] Extraer `useActivitiesData` — queries de datos (actividades, workouts planificados, perfil) y estado de carga.
- [ ] Extraer `useStravaSync` — gestión de tokens Strava, sincronización de resúmenes, descarga de streams/telemetría, deep sync.
- [ ] Extraer `useIntervalsAutoSync` — auto-sync diario de Intervals.icu al cargar la app.
- [ ] Extraer `usePMCMetrics` — cálculo de PMC (CTL, ATL, TSB, ACWR, monotonía, strain) y resumen por período.
- [ ] Extraer `useWellnessData` — carga de wellness desde Supabase, Intervals.icu directo y simulador.
- [ ] Extraer `useWellnessAnalytics` — cálculo de métricas analíticas (EWMA, medias móviles, score de readiness, insights, esfuerzo, tendencia de peso).
- [ ] `useActivities` y `useWellnessInfo` deben quedar como hooks orquestadores que componen los sub-hooks y exponen la misma API pública actual.
- [ ] No cambiar comportamiento de la aplicación (mismo flujo, mismos props, mismos retornos).
- [ ] Todos los props y callbacks actuales se mantienen funcionando.

## 5. Criterios de aceptación
- [ ] Archivos creados en `src/hooks/` para cada sub-hook extraído.
- [ ] `useActivities.js` y `useWellnessInfo.js` reducidos a hooks orquestadores.
- [ ] `npm run lint` pasa.
- [ ] `npm run build` pasa (Vite build sin errores).
- [ ] `npm run test:unit` pasa.
- [ ] `npm run test:coverage` pasa.
- [ ] Commit con convención de commits (ej. `refactor(hooks): ...`).
- [ ] PR abierto hacia `develop`.
- [ ] `MEMORY.md` actualizado (spec-audit-05 marcada como implementada).
- [ ] `CHANGELOG.md` actualizado.

## 6. Diseño técnico
- **Archivos afectados (modificados):**
  - `src/hooks/useActivities.js` (se reduce a hook orquestador).
  - `src/hooks/useWellnessInfo.js` (se reduce a hook orquestador).
- **Archivos afectados (nuevos):**
  - `src/hooks/useActivitiesData.js`
  - `src/hooks/useStravaSync.js`
  - `src/hooks/useIntervalsAutoSync.js`
  - `src/hooks/usePMCMetrics.js`
  - `src/hooks/useWellnessData.js`
  - `src/hooks/useWellnessAnalytics.js`
- **Hooks afectados (lectura, sin modificación):** `useProfileQuery`, `useActivitiesQuery`, `usePlannedWorkoutsQuery`, `useIntervalsSync` (ya existen).
- **Store afectado (lectura):** `src/store/useAppStore.js` (Zustand).
- **Servicios afectados (lectura):** `src/supabase.js`, `src/services/ai.js` (no).
- **Utilidades afectadas (lectura):** `src/utils/tssEngine.js`, `src/utils/formatDuration.js` (no).
- **Rutas afectadas:** Ninguna.
- **Rama:** `feat/refactor-hooks-srp` creada desde `develop`.
- **Merge:** PR hacia `develop` (no a `main`).

## 7. Pruebas
- **Unitarias:** `src/__tests__/unit/` (existentes, no se añaden nuevas; los tests existentes deben seguir pasando).
- **Integración:** `src/__tests__/integration/` (existentes).
- **E2E:** `e2e/` (no aplica; el refactor no cambia rutas ni comportamiento visible).

## 8. Notas adicionales
- El refactor no debe cambiar la API pública expuesta por `useActivities` y `useWellnessInfo` para no romper componentes dependientes (`Dashboard.jsx`, páginas, etc.).
- No modificar componentes de UI ni páginas.
- No commitear directamente a `main` ni a `develop`; siempre vía PR hacia `develop`.
- No iniciar la siguiente tarea hasta que esta esté mergeada.

---
Versión: 0.1.0 — 2026-11-05
