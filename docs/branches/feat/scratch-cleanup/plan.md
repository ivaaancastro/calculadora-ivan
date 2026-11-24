# Plan de tareas — spec-scratch-01 (Limpiar scripts sueltos de scratch/)

**Spec:** `docs/branches/feat/scratch-cleanup/spec.md`
**Rama sugerida:** `feat/scratch-cleanup` (desde `develop`)

## Tareas

| # | Tarea | Descripción | Estado |
|---|-------|-------------|--------|
| 1 | Crear rama | `git checkout -b feat/scratch-cleanup develop` | completado |
| 2 | Escribir spec.md | Especificación completa | completado |
| 3 | Escribir plan.md | Plan de tareas derivado de la spec + MEMORY.md | completado |
| 4 | Revisar archivos scratch | Confirmar que los cambios `.cjs` ya están en el código fuente | pendiente |
| 5 | Eliminar `scratch/*.cjs` | Migraciones ya aplicadas | pendiente |
| 6 | Evaluar `test_peak_power.js` | Eliminar o migrar a `src/__tests__/unit/` | pendiente |
| 7 | Verificar | `npm run lint` y `npm run test:unit` pasan | pendiente |
| 8 | Registrar | MEMORY.md actualizado | pendiente |
| 9 | Commit `chore(scratch): ...` y push | | pendiente |
| 10 | Abrir PR hacia `develop` | | pendiente |
| 11 | Merge a `develop` | [ ] Esperando autorización del usuario | pendiente |

## Alcance

### ✅ SÍ
- Eliminar scripts de migración `.cjs` ya aplicados.
- Eliminar o integrar `test_peak_power.js`.

### ❌ NO
- Modificar código de producción.
- Eliminar tests vigentes de `src/__tests__/`.

---
Versión: 0.1.0 — 2026-11-05