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

### Refactor
- `refactor(dashboard):` extraer `Dashboard.jsx` (313 líneas) en subcomponentes SRP (`EmptyState`, `UploadStatusBanner`, `MobileTabsView`, `DesktopRoutesView`, `ActivitySubRoutes`, `ActivityRouteWrapper`) dejando un shell de orquestación (`spec-audit-04`).
- `fix(dashboard):` corregir imports faltantes (`AdvancedAnalytics`, `HistoryList` en `Dashboard.jsx`; `ActivityRouteWrapper` en `ActivitySubRoutes.jsx`) que provocaban `ReferenceError` y rompían la app en el navegador (`spec-fix-01`).
- `test(services,store):` añadir tests unitarios para `src/services/ai.js` (mock de Gemini) y `src/store/useAppStore.js` (Zustand) en `src/__tests__/unit/` (`spec-audit-03`).

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