# Plan de tareas — spec-audit-08 (Hardening Edge Function intervals-proxy)

**Spec:** `docs/branches/feat/edge-function-intervals-proxy-hardening/spec.md`
**Rama sugerida:** `feat/edge-function-intervals-proxy-hardening` (desde `develop`)

## Tareas

| # | Tarea | Descripción | Estado |
|---|-------|-------------|--------|
| 1 | Crear rama | `git checkout -b feat/edge-function-intervals-proxy-hardening develop` | completado |
| 2 | Escribir spec.md | Especificación completa (hecho) | completado |
| 3 | Escribir plan.md | Plan de tareas derivado de la spec + MEMORY.md | completado |
| 4 | Presentar para aprobación | Mostrar spec.md y plan.md al usuario | pendiente |
| 5 | Crear tasks.md | Tras aprobación del usuario | pendiente |
| 6 | Hardening index.ts | Rate limiting, validación endpoint (lista blanca), timeout, CORS, errores seguros | pendiente |
| 7 | Verificar | Lint/sintaxis de la función (no hay tests de Edge Function) | pendiente |
| 8 | Registrar | MEMORY.md, CHANGELOG.md, docs/specs/README.md, spec.md | pendiente |
| 9 | Commit `feat(edge-function): ...` y push | | pendiente |
| 10 | Abrir PR hacia `develop` | | pendiente |
| 11 | Merge a `develop` | [ ] Esperando autorización del usuario | pendiente |

## Alcance

### ✅ SÍ
- Hardening de `supabase/functions/intervals-proxy/index.ts`.
- Rate limiting por usuario, lista blanca de endpoints, timeout, CORS restringido, errores seguros.

### ❌ NO
- Desplegar en Supabase (lo hace el usuario/DevOps).
- Añadir autenticación adicional más allá de Supabase Auth (ya existe).
- Crear tests de Edge Function si no hay infraestructura para ellos.

## Estado
Esperando aprobación del usuario para crear `tasks.md` y comenzar la implementación.

---
Versión: 0.1.0 — 2026-11-05
