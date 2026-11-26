# Plan de tareas — spec-audit-07 (Consolidar migraciones SQL y versionado)

**Spec:** `docs/branches/feat/sql-migrations-versioning/spec.md`
**Rama sugerida:** `feat/sql-migrations-versioning` (desde `develop`)

## Tareas

| # | Tarea | Descripción | Estado |
|---|-------|-------------|--------|
| 1 | Crear rama | `git checkout -b feat/sql-migrations-versioning develop` | completado |
| 2 | Crear `000_create_schema_migrations.sql` | Tabla de versionado para rastrear migraciones aplicadas | pendiente |
| 3 | Renombrar migraciones con prefijo de versión | `001_` a `008_` en orden de dependencias | pendiente |
| 4 | Consolidar `wellness_data` | Elegir una definición consistente (UUID, no BIGINT) | pendiente |
| 5 | Remover duplicados en `enable_rls.sql` | Mantener solo RLS, no definición de tabla | pendiente |
| 6 | Añadir `IF NOT EXISTS` a todas las migraciones | Idempotencia | pendiente |
| 7 | Crear `migrations/README.md` | Documentar orden y propósito de cada migración | pendiente |
| 8 | Verificar | `npm run lint`, `npm run build` | pendiente |
| 9 | Registrar | Actualizar `MEMORY.md`, `CHANGELOG.md`; commit `feat(database): ...`; PR hacia `develop` | pendiente |

## Alcance

### ✅ SÍ
- Crear tabla `schema_migrations`.
- Renombrar 8 migraciones con prefijo de versión.
- Consolidar definición de `wellness_data`.
- Añadir `IF NOT EXISTS` para idempotencia.
- Crear `migrations/README.md`.

### ❌ NO
- Modificar el comportamiento de la aplicación.
- Ejecutar migraciones en la base de datos de producción (eso lo hace el usuario/DevOps).
- Cambiar el esquema de forma destructiva.

## Estado
Esperando aprobación del usuario para crear `tasks.md` y comenzar la implementación.

---
Versión: 0.1.0 — 2026-11-05
