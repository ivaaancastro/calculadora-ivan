# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

### Seguridad
- `fix(security):` remover `.env` del rastreo de git (`git rm --cached`), agregar `.env` y `.env.*` a `.gitignore`, crear `.env.example` sin valores secretos y validar variables de entorno críticas al arranque (`spec-audit-01`).

### Pruebas
- `test(utils):` añadir tests unitarios para `tssEngine.js`, `parser.js`, `formatDuration.js` y `fitnessStatsEngine.js` en `src/__tests__/unit/` (`spec-audit-02`). Cobertura de `src/utils/` del 0% al ~40%.
- `test(services,store):` añadir tests unitarios para `src/services/ai.js` (mock de Gemini) y `src/store/useAppStore.js` (Zustand) en `src/__tests__/unit/` (`spec-audit-03`).
- `test(e2e):` añadir pruebas E2E críticas con Playwright (`e2e/auth.spec.js`, `e2e/dashboard.spec.js`, `e2e/activities.spec.js`, `e2e/strava.spec.js`, `e2e/export.spec.js`, `e2e/account.spec.js`) que cubren login/logout, dashboard autenticado con métricas PMC, flujo de actividades, sincronización Strava mockeada y exportación CSV. Todas las APIs externas se mockean con `page.route()` para ser deterministas y no depender de credenciales reales ni red externa (`spec-e2e-01`).

### Refactor
- `refactor(dashboard):` extraer `Dashboard.jsx` (313 líneas) en subcomponentes SRP (`EmptyState`, `UploadStatusBanner`, `MobileTabsView`, `DesktopRoutesView`, `ActivitySubRoutes`, `ActivityRouteWrapper`) dejando un shell de orquestación (`spec-audit-04`).
- `fix(dashboard):` corregir imports faltantes (`AdvancedAnalytics`, `HistoryList` en `Dashboard.jsx`; `ActivityRouteWrapper` en `ActivitySubRoutes.jsx`) que provocaban `ReferenceError` y rompían la app en el navegador (`spec-fix-01`).
- `refactor(hooks):` extraer `useActivities.js` (617 líneas) y `useWellnessInfo.js` (493 líneas) en sub-hooks SRP (`useActivitiesData`, `useStravaSync`, `useIntervalsAutoSync`, `usePMCMetrics`, `useWellnessData`, `useWellnessAnalytics`) dejando hooks orquestadores con API pública idéntica (`spec-audit-05`).
- `feat(typescript):` migrar progresivamente a TypeScript: `tssEngine.ts`, `parser.ts`, `formatDuration.ts`, `fitnessStatsEngine.ts`, `useAppStore.ts`, `ai.ts` con tipos estáticos estáticos, `tsconfig.json` creado con `allowJs` para transición progresiva (`spec-audit-06`).
- `test(services,store):` añadir tests unitarios para `src/services/ai.js` (mock de Gemini) y `src/store/useAppStore.js` (Zustand) en `src/__tests__/unit/` (`spec-audit-03`).

### Base de datos
- `feat(database):` consolidar 8 migraciones SQL con versionado ordenado (`000_` a `008_`), crear tabla `schema_migrations` para rastrear migraciones aplicadas, consolidar definición de `wellness_data` (UUID) y añadir `migrations/README.md` (`spec-audit-07`).

### IA
- `feat(ai):` añadir modo de respuestas estructuradas a `askGemini` (parámetro opcional `structured`, schema JSON, tipo `GeminiStructuredResponse`, pruebas unitarias y docs) (`spec-001`).

### Edge Function
- `feat(edge-function):` endurecer `intervals-proxy`: rate limiting por usuario (Deno KV, 60 req/min), lista blanca de endpoints (`wellness`, `athlete`, `activities`), timeout de 10s en `fetch`, CORS restringido, manejo seguro de respuestas no JSON y errores sin exponer internos (`spec-audit-08`).

## [0.1.0] — 2026-11-05

### Implementado
- Sistema de trabajo SDD (Specification-Driven Development) con agentes.
- Archivos base: `MEMORY`, `AGENTS`, `README.md`, `CHANGELOG.md`.
- Carpetas: `docs/` (arquitectura, specs, API, guías, SDD) y `skills/` (una por agente).
- CI actualizado para ejecutar en `develop` y en PRs (no solo en `main`).
- Skills obligatorias definidas: `vercel-react-best-practices`, `web-design-guidelines`,
  `apple-design`, `vercel-composition-patterns`, `writing-guidelines`.
- MCPs obligatorias definidas: `context7`, `opencode`.

### Contexto del proyecto (v0.1.0)
- App PWA de rendimiento deportivo/triatlón ("Forma").
- Stack: React 19, Vite 7, Tailwind CSS, React Router DOM 7, Zustand, TanStack Query,
  Supabase, Google Gemini, Playwright, Vitest.
- Estructura: `src/components`, `src/hooks`, `src/services`, `src/store`, `src/utils`,
  `src/__tests__`, `supabase/functions`, `migrations`, `e2e`, `scratch`.

---
Versión: 0.1.0 — 2026-11-05