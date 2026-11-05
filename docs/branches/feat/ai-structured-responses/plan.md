# Plan de tareas — spec-001 (Servicio de IA con Gemini — respuestas estructuradas)

**Spec:** `docs/branches/feat/ai-structured-responses/spec.md`
**Rama sugerida:** `feat/ai-structured-responses` (desde `develop`)

## Tareas

| # | Tarea | Descripción | Estado |
|---|-------|-------------|--------|
| 1 | Crear rama | `git checkout -b feat/ai-structured-responses develop` | completado |
| 2 | Escribir spec.md | Especificación completa (hecho) | completado |
| 3 | Escribir plan.md | Plan de tareas derivado de la spec + MEMORY.md | completado |
| 4 | Presentar para aprobación | Mostrar spec.md y plan.md al usuario | pendiente |
| 5 | Crear tasks.md | Tras aprobación del usuario | pendiente |
| 6 | Implementar modo estructurado en ai.ts | Parámetro `structured`, schema JSON, tipo de retorno | pendiente |
| 7 | Añadir pruebas unitarias | Modo estructurado + retrocompatibilidad en ai.test.js | pendiente |
| 8 | Actualizar docs/api/servicios.md | Documentar nueva firma y modo estructurado | pendiente |
| 9 | Verificar | `npm run lint`, `npm run build`, `npm run test:unit` | pendiente |
| 10 | Registrar | MEMORY.md, CHANGELOG.md, docs/specs/README.md, spec.md | pendiente |
| 11 | Commit `feat(ai): ...` y push | | pendiente |
| 12 | Abrir PR hacia `develop` | | pendiente |
| 13 | Merge a `develop` | [ ] Esperando autorización del usuario | pendiente |

## Alcance

### ✅ SÍ
- Modo estructurado opcional en `askGemini`.
- Interfaz TypeScript `GeminiStructuredResponse`.
- Pruebas unitarias para el nuevo modo y retrocompatibilidad.
- Documentación en `docs/api/servicios.md`.

### ❌ NO
- Cambiar la firma por defecto (retrocompatibilidad obligatoria).
- Modificar el modelo de Gemini ni la clave API.
- Ejecutar cambios en Supabase.

## Estado
Esperando aprobación del usuario para crear `tasks.md` y comenzar la implementación.

---
Versión: 0.1.0 — 2026-11-05
