# MEMORY — Estado persistente del proyecto "Forma" (calculadora-ivan)

> Fuente de verdad compartida entre todos los agentes del sistema SDD.
> Cada agente debe leer `AGENTS.md` y este archivo antes de actuar, y actualizarlos al finalizar su tarea.

## 0. Reglas globales (obligatorio, leer primero)

- **Flujo SDD obligatorio:** Especificar → Planificar → Implementar → Verificar → Registrar.
- **Sin spec aprobada = sin código de producción.**
- **Rama base:** todas las ramas de funcionalidad salen de `develop`.
- **Nunca commitear a `main`:** `main` es producción, desplegado en Vercel.
- **Merge solo vía PR** a `develop`, aprobado por `review-agent`.
- **Convención de commits:** Conventional Commits (`feat`, `fix`, `docs`, `test`, `chore`, etc.).

## 1. Estado del proyecto
- **Nombre:** Forma — Dashboard de rendimiento deportivo y salud
- **Rama actual:** `feature/sdd-agentes-workflow` (rama de implementación del sistema SDD con agentes)
- **Rama base:** `develop`
- **Rama de producción:** `main` (desplegada en Vercel)
- **Versión:** 0.1.0
- **Estado:** Sistema SDD con agentes implementado y verificado

## 2. Stack tecnológico
- Frontend: React 19, Vite 7, Tailwind CSS, React Router DOM 7, Zustand, TanStack React Query
- IA: Google Gemini (`gemini-1.5-flash`) vía `src/services/ai.js`
- Backend/BaaS: Supabase (Auth, DB, RLS, Edge Function `intervals-proxy`)
- Pruebas: Vitest (unit/integration), MSW, Playwright (E2E), coverage v8
- Calidad: ESLint flat config, PWA (`vite-plugin-pwa`), TypeScript (devDep)

## 3. Especificaciones (docs/specs/)
| ID | Spec | Estado | Última actualización | Implementada en |
|----|------|--------|----------------------|-----------------|
| spec-001 | Servicio de IA con Gemini — respuestas estructuradas | pendiente | 2026-11-05 | — |

> Cuando un agente implemente una spec, debe añadir una fila aquí y marcarla como `implementada`.

## 4. Decisiones tomadas
- Sistema SDD con 6 agentes: spec-agent, code-agent, db-agent, test-agent, review-agent, doc-agent.
- Las specs viven en `docs/specs/` como archivos `.md` o `.json`.
- `MEMORY.md` es la fuente de verdad del contexto compartido.
- `AGENTS.md` define roles, flujos, reglas de ramas/commits y estándares.
- `skills/` contiene las capacidades reutilizables por agente (system prompts + criterios de aceptación).
- `docs/` aloja arquitectura, specs, guías y API.
- CI ejecuta en `develop` y en PRs (no solo en `main`).
- `main` es la rama de producción desplegada en Vercel; no se commitea directamente.
- Skills obligatorias: `vercel-react-best-practices`, `web-design-guidelines`, `apple-design`, `vercel-composition-patterns`, `writing-guidelines`, `vercel-cli-with-tokens`, `vercel-optimize`.
- MCPs obligatorios (en `.opencode/mcp.json`): `context7`, `opencode`, `supabase`.

## 5. Roadmap (próximas specs pendientes)
- [ ] Migrar lógica de `scratch/*.cjs` a specs documentadas.
- [ ] Agregar TypeScript tipado progresivo (ya está como devDep).
- [ ] Implementar spec-001: servicio de IA con respuestas estructuradas.
- [ ] Spec de pruebas E2E críticas (auth, dashboard).

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

---
Última actualización: 2026-11-05