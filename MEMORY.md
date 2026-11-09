# MEMORY — Estado persistente del proyecto "Forma" (calculadora-ivan)

> Fuente de verdad compartida entre todos los agentes del sistema SDD.
> Cada agente debe leer `AGENTS.md` y este archivo antes de actuar, y actualizarlos al finalizar su tarea.

## 0. Reglas globales (obligatorio, leer primero)

- **Flujo SDD obligatorio:** Especificar → Planificar → Implementar → Verificar → Registrar.
- **Sin spec aprobada = sin código de producción.**
- **Rama base:** todas las ramas de funcionalidad salen de `develop`.
- **Nunca commitear a `main`:** `main` es producción, desplegado en Vercel.
- **Merge solo vía PR** a `develop`.
- **Convención de commits:** Conventional Commits (`feat`, `fix`, `docs`, `test`, `chore`, etc.).

## 1. Estado del proyecto
- **Nombre:** Forma — Dashboard de rendimiento deportivo y salud
- **Rama actual:** `feat/ui-tokens-borders` (Capa 1 del rediseño, PR 2 de 6: bordes; PR hacia `develop`)
- **Rama base:** `develop`
- **Rama de producción:** `main` (desplegada en Vercel)
- **Versión:** 0.1.0
- **Estado:** Sistema SDD con agentes implementado y verificado. Análisis de auditoría completado (ver `AUDIT_REPORT.md` en rama `analysis/project-audit`).

## 2. Stack tecnológico
- Frontend: React 19, Vite 7, Tailwind CSS, React Router DOM 7, Zustand, TanStack React Query
- IA: Google Gemini (`gemini-1.5-flash`) vía `src/services/ai.js`
- Backend/BaaS: Supabase (Auth, DB, RLS, Edge Function `intervals-proxy`)
- Pruebas: Vitest (unit/integration), MSW, Playwright (E2E), coverage v8
- Calidad: ESLint flat config, PWA (`vite-plugin-pwa`), TypeScript (devDep)

## 3. Especificaciones (docs/specs/)
| ID | Spec | Estado | Última actualización | Implementada en |
|----|------|--------|----------------------|-----------------|
| spec-001 | Servicio de IA con Gemini — respuestas estructuradas | implementada | 2026-11-05 | feat/ai-structured-responses |
| spec-audit-01 | Seguridad: remover secretos de `.env`, validar env vars al arranque | implementada | 2026-11-05 | fix/security-env-secrets |
| spec-audit-02 | Cobertura: tests unitarios para utils (tssEngine, parser, formatters, fitnessStatsEngine) | implementada | 2026-11-05 | feat/tests-utils-coverage |
| spec-audit-03 | Cobertura: tests para `src/services/ai.js` y `src/store/useAppStore.js` | implementada | 2026-11-05 | feat/tests-ai-store-coverage |
| spec-audit-04 | Refactor: `Dashboard.jsx` en componentes más pequeños (SRP) | implementada | 2026-11-05 | feat/refactor-dashboard-srp |
| spec-fix-01 | Corregir imports faltantes en `Dashboard.jsx` tras refactor SRP | implementada | 2026-11-05 | fix/investigar-app-rota |
| spec-audit-05 | Refactor: hooks grandes (`useActivities.js`, `useWellnessInfo.js`) | implementada | 2026-11-05 | feat/refactor-hooks-srp |
| spec-audit-06 | TypeScript progresivo: tipado de utils, store y servicios | implementada | 2026-11-05 | feat/typescript-progreso |
| spec-audit-07 | Consolidar migraciones SQL y añadir versionado (`schema_migrations`) | implementada | 2026-11-05 | feat/sql-migrations-versioning |
| spec-audit-08 | Hardening Edge Function `intervals-proxy` (rate limiting, validación, timeout) | implementada | 2026-11-05 | feat/edge-function-intervals-proxy-hardening |
| spec-e2e-01 | Pruebas E2E críticas (auth, dashboard, Strava sync, exportación de datos) | implementada | 2026-11-05 | feat/e2e-critical-flows |
| spec-rediseno-02 | Rediseño de la webapp por capas (roadmap) | en curso | 2026-11-06 | `docs/branches/feat/webapp-redesign/` |
| spec-rediseno-02-c0 | Capa 0: red de seguridad de UI | implementada (PR #51 mergeado en `develop`) | 2026-11-06 | test/ui-safety-net |
| spec-rediseno-02-c1 | Capa 1: tokens y tema | en curso (PR 1 mergeado en #52; PR 2 bordes abierto) | 2026-11-09 | `docs/branches/feat/ui-tokens/` |

> Cuando un agente implemente una spec, debe añadir una fila aquí y marcarla como `implementada`.

## 4. Decisiones tomadas
- Sistema SDD basado en specs en `docs/specs/` y flujo obligatorio definido en `AGENTS.md`.
- Las specs viven en `docs/specs/` como archivos `.md` o `.json`.
- `MEMORY.md` es la fuente de verdad del contexto compartido.
- `AGENTS.md` define flujos, reglas de ramas/commits y estándares.
- `skills/` contiene las capacidades reutilizables (prompts y plantillas).
- `docs/` aloja arquitectura, specs, guías y API.
- CI ejecuta en `develop` y en PRs (no solo en `main`).
- `main` es la rama de producción desplegada en Vercel; no se commitea directamente.
- Skills instaladas en el proyecto: `git-release` (en `.opencode/skills/git-release/`).
- MCPs obligatorios (en `.opencode/mcp.json`): `context7`, `opencode`, `supabase`.

## 5. Roadmap (próximas specs pendientes — por prioridad)

### Fase 1 — Seguridad (bloqueante, empezar inmediatamente)
- [x] spec-audit-01: Seguridad — remover secretos de `.env`, agregar a `.gitignore`, crear `.env.example`, validar env vars al arranque (rama `fix/security-env-secrets`)

### Fase 2 — Cobertura de pruebas (utils, IA, store)
- [x] spec-audit-02: Tests unitarios para `tssEngine.js`, `parser.js`, `formatters.js`, `fitnessStatsEngine.js`
- [x] spec-audit-03: Tests para `src/services/ai.js` (mockear Gemini) y `src/store/useAppStore.js` (Zustand)

### Fase 3 — Refactorización core (SRP)
- [x] spec-audit-04: Refactorizar `Dashboard.jsx` (313 líneas) en componentes más pequeños (rama `feat/refactor-dashboard-srp`)
- [x] spec-audit-05: Refactorizar hooks grandes (`useActivities.js` → hooks enfocados; `useWellnessInfo.js` → data + analytics) (rama `feat/refactor-hooks-srp`)

### Fase 4 — Estabilidad y tipo
- [x] spec-audit-06: Migración progresiva a TypeScript (utils, store, servicios) (rama `feat/typescript-progreso`)
- [x] spec-001: Servicio de IA con Gemini — respuestas estructuradas (rama `feat/ai-structured-responses`)
- [x] spec-audit-07: Consolidar migraciones SQL, unificar `wellness_data`, añadir `schema_migrations` (rama `feat/sql-migrations-versioning`)
- [x] spec-audit-08: Hardening Edge Function `intervals-proxy` (rate limiting, validación entrada, timeout) (rama `feat/edge-function-intervals-proxy-hardening`)

### Pendientes anteriores (mantener)
- [x] Migrar lógica de `scratch/*.cjs` a specs documentadas o eliminar (rama `feat/scratch-cleanup`).
- [x] Spec de pruebas E2E críticas (auth, dashboard, Strava sync, exportación de datos) (rama `feat/e2e-critical-flows`)

## 5b. Rediseño (2026-11-06)
- Producción **no se toca** por ahora (decisión del usuario): todo va por ramas hacia `develop`. Sin rollback, promoción ni merge a `main`.
- Capas: 0 red de seguridad → 1 tokens → 2 primitivas → 3 navegación y piel v2 tras flag → 4 landing/acceso → 5 pantallas → 6 activar v2 → 7 iOS. Roadmap en `docs/branches/feat/webapp-redesign/plan.md`.
- `feat/webapp-redesign` en el remoto conserva el primer intento descartado: **no hacer `git pull` ahí**, ni usar `archive/webapp-redesign-v1` ni `stash@{0}` como base.
- Antes de cualquier merge a `main`: revisar que el último despliegue de producción corresponde a `cda7df1`.

### Cómo trabajar con los tokens (Capa 1)
- Colores: `src/styles/tokens.css` (canales RGB, `:root` y `.dark`) → `src/styles/tailwindTokens.cjs` → `tailwind.config.js`. Gráficas: `src/components/charts/chartTheme.js` + `useChartTheme()` (hex, deben coincidir con `tokens.css`; lo comprueba un test).
- **Tokens exactos:** cada token copia un par claro/oscuro existente; no se unifican valores parecidos hasta la Capa 3. Cada token llega con la familia que lo usa (orden: bordes, texto, superficies, acentos, gráficas; una rama/PR por familia).
- Codemods: `scripts/codemods/<familia>.mjs --inventory | --tokens | --apply`, sobre `scripts/codemods/lib.mjs`. La tabla de cada familia es `src/styles/tokens/<familia>.json`; `--tokens` regenera su bloque en `tokens.css` (no editarlo a mano).
- **Precedencia:** en Tailwind 3 `dark:` va después de `hover:`/`focus:` en el CSS. El codemod migra por expresión de clases y propiedad todo o nada; no forzar a mano un par descartado (ver D-08).
- `npm run lint:colors` es un trinquete por archivo (`scripts/color-baseline.json`): tras migrar, `npm run lint:colors -- --update` (solo baja). `--report` da totales.
- Verificación de una migración: además de las capturas, volcado de estilos calculados (incluye `:hover`/`:focus`/`:active` forzados) en `develop` y en la rama (`STYLE_DUMP_DIR=<dir> npx playwright test e2e/tools/style-dump.spec.js`, con `E2E_PORT` distinto si se usa un worktree) y `node scripts/style-diff.mjs <antes> <después>`: debe dar 0 diferencias.
- Fuera de alcance de la Capa 1: colores en `src/hooks` y `src/utils` (74 líneas), canvas de la landing, tipografía, radios y sombras.

### Cómo trabajar con la red de seguridad (Capa 0)
- Las capturas de referencia están en `e2e/__screenshots__/` y **solo se generan en Linux** con `npm run test:e2e:update` (Docker, imagen oficial de Playwright, `linux/amd64` como CI). Las de macOS no son comparables, por eso `visual.spec.js` se omite fuera de Linux. Para compararlas: `npm run test:e2e:docker`.
- Revisar cada captura nueva antes de aceptarla. La tolerancia es de 100 píxeles (`maxDiffPixels`).
- Los E2E usan su propio puerto (5273, `E2E_PORT`) y variables de Supabase fijas; no tocan un `npm run dev` en 5173.
- Datos simulados, fecha fija (2026-06-15) y red externa bloqueada: `e2e/support/mockApp.js`. La fecha sigue avanzando (no `clock.setFixedTime`: congela las animaciones de Recharts).
- Las capturas se hacen ajustando el viewport a la altura del documento (no `fullPage`, que reinicia las animaciones de Recharts); la landing es la excepción. En móvil se expanden los paneles internos de `MobileSwipePager`.
- Lista de paridad y defectos conocidos (D-01, D-03 a D-06): `docs/branches/test/ui-safety-net/paridad.md`. D-01 está como `test.fail()`: cuando se corrija habrá que quitarlo.
- Informe táctil (< 44 px) no bloquea hasta la Capa 2.
- `VITE_GEMINI_API_KEY` es opcional (ningún componente usa `askGemini`).

## 6. Contexto compartido entre agentes
- El punto de entrada de la app es `src/App.jsx` (router + sesión Supabase).
- El store global es `src/store/useAppStore.js` (Zustand).
- El cliente Supabase es `src/supabase.js`.
- El servicio de IA es `src/services/ai.js`.
- Los motores de cálculo están en `src/utils/` (tssEngine, fitnessStatsEngine, parser, formatters).
- Los tests viven en `src/__tests__/unit` y `src/__tests__/integration`.
- Los E2E viven en `e2e/`.
- Las migraciones SQL viven en `migrations/`.
- Los scripts sueltos (revisar/eliminar) viven en `scratch/`.
- **Informe de auditoría:** `AUDIT_REPORT.md` (rama `analysis/project-audit`) — contiene puntos débiles (P-01 a P-30), deuda técnica, hallazgos de tests/coverage y roadmap priorizado (R-01 a R-17).

---
Última actualización: 2026-11-09