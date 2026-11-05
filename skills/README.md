# Skills del sistema SDD — Forma (calculadora-ivan)

Este directorio contiene las capacidades reutilizables (system prompts, plantillas, criterios de aceptación) de cada agente del sistema SDD.

## Skills por agente

| Agente | Carpeta | System prompt | Criterios de aceptación |
|--------|---------|---------------|------------------------|
| `spec-agent` | `spec-agent/` | ✅ `system-prompt.md` | Incluido en el prompt |
| `code-agent` | `code-agent/` | ✅ `system-prompt.md` | Incluido en el prompt |
| `db-agent` | `db-agent/` | ✅ `system-prompt.md` | Incluido en el prompt |
| `test-agent` | `test-agent/` | ✅ `system-prompt.md` | Incluido en el prompt |
| `review-agent` | `review-agent/` | ✅ `system-prompt.md` | Incluido en el prompt |
| `doc-agent` | `doc-agent/` | ✅ `system-prompt.md` | Incluido en el prompt |

## Skills de OpenCode obligatorias (instalarse en el cliente)

Estas skills deben estar activas en el cliente OpenCode para que los agentes puedan usarlas:

| Skill | Por qué es obligatoria | Agentes que la usan |
|-------|------------------------|---------------------|
| `vercel-react-best-practices` | React 19 + Vite: rendimiento, componentes, data fetching, optimización de bundle. Esencial para escribir código frontend correcto. | `code-agent`, `review-agent` |
| `web-design-guidelines` | Revisar UI/UX y accesibilidad. La app es móvil-first (BottomNav, swipe navigation, gestos, liquid glass). | `code-agent`, `doc-agent` |
| `apple-design` | Interfaces móviles con gestos táctiles, swipe navigation, materiales translúcidos, feedback físico. La app tiene `MobileSwipePager`, `BottomNav`, gestos de borde. | `code-agent` |
| `vercel-composition-patterns` | Arquitectura de componentes reutilizables (compound components, render props, context providers). Evita proliferación de booleanos en props. | `code-agent` |
| `writing-guidelines` | Revisar docs/prose: README, CHANGELOG, AGENTS, specs, MEMORY. Esencial para mantener la documentación consistente. | `doc-agent` |
| `vercel-cli-with-tokens` | Desplegar a Vercel usando tokens (no login interactivo). `main` es la rama de producción desplegada en Vercel. | `doc-agent`, `review-agent` |
| `vercel-optimize` | Optimizar costos y rendimiento en Vercel (Function Invocations, Build Minutes, Core Web Vitals, Bot Management). | `review-agent` |

## MCPs obligatorios (configurarse en `.opencode/mcp.json`)

| MCP | Por qué es obligatorio | Uso |
|-----|------------------------|-----|
| `context7` | Documentación actualizada de librerías del stack: React, Vite, Tailwind CSS, Supabase, Google Gemini, Playwright, Vitest, React Router, Zustand, TanStack Query, Recharts, Leaflet. Todos los agentes la necesitan para escribir código correcto y actualizado. | Todos los agentes (consultar APIs, versiones, patrones) |
| `opencode` | Gestión de worktrees, sesiones, recursos MCP y herramientas de OpenCode. Útil para el flujo de agentes y para crear ramas/worktrees de forma controlada. | Flujo de agentes, creación de ramas, gestión de sesión |
| `supabase` | MCP de Supabase (`https://github.com/supabase-community/opencode-supabase.git`). Permite a los agentes interactuar con Supabase (Auth, DB, RLS, Edge Functions) directamente desde OpenCode. Obligatorio para `db-agent` y para cualquier operación sobre la base de datos o Edge Functions. | `db-agent`, `code-agent` (cuando toca Supabase), `review-agent` (verificación de cambios en BD) |

## Cómo activar las skills

1. Abrir el cliente OpenCode.
2. Ir a Skills → Instalar/activar cada skill de la tabla anterior.
3. Verificar que los MCPs `context7` y `opencode` estén configurados en `.opencode/mcp.json`.

---
Versión: 0.1.0 — 2026-11-05