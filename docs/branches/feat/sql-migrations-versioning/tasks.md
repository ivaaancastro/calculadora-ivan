# Tareas — spec-audit-07 (Consolidar migraciones SQL y versionado schema_migrations)

| # | Tarea | Estado |
|---|-------|--------|
| 1 | Crear rama `feat/sql-migrations-versioning` desde `develop` | [x] |
| 2 | Crear `000_create_schema_migrations.sql` (tabla de versionado) | [x] |
| 3 | Renombrar migraciones con prefijo de versión (`001_` a `008_`) en orden de dependencias | [x] |
| 4 | Consolidar `wellness_data` (definición UUID en `001_add_wellness_data.sql`) | [x] |
| 5 | Remover duplicado de `wellness_data` en `enable_rls.sql` (mantener solo RLS) | [x] |
| 6 | Añadir `IF NOT EXISTS` / guardas de idempotencia en todas las migraciones | [x] |
| 7 | Crear `migrations/README.md` documentando orden y propósito de cada migración | [x] |
| 8 | Verificar (`npm run lint`, `npm run build`) | [x] |
| 9 | Registrar (MEMORY.md, CHANGELOG.md, docs/specs/README.md, spec.md) | [x] |
| 10 | Commit `feat(database): ...` y push | [ ] |
| 11 | Abrir PR hacia `develop` | [ ] |
| 12 | Merge a `develop` | [ ] Esperando autorización del usuario |

---
Versión: 0.1.0 — 2026-11-05
