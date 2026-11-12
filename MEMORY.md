# MEMORY — Estado persistente de "Forma" (calculadora-ivan)

> Versión corta, se lee al empezar cada sesión. El detalle histórico completo está en
> `docs/memory/memory-archivo-2026-11-12.md` (leer solo la sección que haga falta, con `offset`/`limit`).
> Cada agente actualiza este archivo al terminar su tarea, **sin añadir historia: la historia va a `tasks.md` de la rama**.

## 0. Reglas globales
- Flujo SDD: Especificar → Planificar → Presentar → Tareas → Implementar → Verificar → Registrar (ver `AGENTS.md`).
- Sin spec aprobada no hay código de producción. Ramas desde `develop`; nunca commit a `main`; merge solo vía PR y con autorización del usuario.
- Conventional Commits. Producción **no se toca** durante el rediseño: todo va a `develop`.

## 1. Estado actual
- **Proyecto:** Forma — dashboard de rendimiento deportivo y salud. Stack: React 19, Vite 7, Tailwind 3, Zustand, TanStack Query, Supabase, Vitest/MSW/Playwright.
- **Rama actual:** `feat/ui-skin-v2-visual` (Capa 3, PR 5: dirección visual «Panel», D7). Estado y checkboxes en `docs/branches/feat/ui-skin-v2-visual/tasks.md`.
- **Hecho:** specs de auditoría 01–08, spec-001 y E2E (todas implementadas). Rediseño: Capa 0 (#51), Capa 1 (#52–#58), Capa 2 (#60–#68), estructura de Capa 3 (#70–#72) y mecanismo de la piel (#73, flag `data-ui="v2"`).
- **Pendiente del rediseño:** PR 5 (visual, parada D7 con 12 capturas reales) → PRs 6–7 de la Capa 3 → Capas 4 (landing/acceso), 5 (pantallas), 6 (activar v2), 7 (iOS). Plan: `docs/branches/feat/webapp-redesign/plan.md`. Decisión abierta: D8 (dónde vive el conmutador de v2).
- `feat/webapp-redesign` remoto = intento descartado: no hacer `git pull` ahí ni usar `archive/webapp-redesign-v1` ni `stash@{0}`.

## 2. Reglas de trabajo del rediseño (resumen)
- **v1 congelada:** cualquier valor visual nuevo va detrás de `html[data-ui="v2"]` y con capturas propias.
- **Colores:** tokens en `src/styles/tokens.css` → `tailwindTokens.cjs` → Tailwind. Gráficas: `chartTheme.js` + `useChartTheme()`; nunca un hex suelto. `npm run lint:colors` es trinquete (solo baja).
- **Primitivas:** `src/components/ui/` (`npm run lint:ui`, 14). «Centralizar sin unificar»; `className` solo para colocación y espaciado.
- **Cabecera:** mide exactamente `--nav-h` (60 px); nunca debe crecer.
- **Verificación visual:** volcado de estilos `develop` vs rama con `node scripts/style-diff.mjs` (debe dar 0) y capturas **solo en Docker** (`npm run test:e2e:docker`; `:update` para regenerar).
- Detalle de codemods, volcados, precedencia de `dark:` y trampas conocidas: archivo histórico, secciones «Cómo trabajar con…».

## 3. Contexto técnico
- Entrada `src/App.jsx`; store `src/store/useAppStore.js`; Supabase `src/supabase.js`; IA `src/services/ai.js`; motores en `src/utils/`.
- Tests: `src/__tests__/{unit,integration}`; E2E en `e2e/` (puerto 5273, datos simulados, fecha fija 2026-06-15); migraciones en `migrations/`.
- Informe de auditoría: `AUDIT_REPORT.md` (rama `analysis/project-audit`).

## 4. Specs
Todas en `docs/specs/` y `docs/branches/`. Tabla completa con estados: archivo histórico, sección 3.

---
Última actualización: 2026-11-12
