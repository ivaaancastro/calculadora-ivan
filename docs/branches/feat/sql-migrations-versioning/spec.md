# Especificación SDD — spec-audit-07

## 1. Identificación
- **ID:** spec-audit-07
- **Título:** Consolidar migraciones SQL y añadir versionado (`schema_migrations`)
- **Autor:** agente de implementación (Forma / calculadora-ivan)
- **Fecha:** 2026-11-05
- **Estado:** implementada

## 2. Objetivo
Consolidar las 8 migraciones SQL sueltas en `migrations/` con versionado ordenado, crear la tabla `schema_migrations` para rastrear qué migraciones se han aplicado, y estandarizar el formato para futuras migraciones.

## 3. Contexto y justificación
- Actualmente hay 8 archivos SQL en `migrations/` sin versionado ni orden de ejecución claro.
- No existe tabla `schema_migrations` para rastrear qué migraciones se han aplicado en la base de datos de Supabase.
- Hay inconsistencia entre archivos: `wellness_data` se crea de dos formas distintas (en `add_wellness_data.sql` con UUID y en `enable_rls.sql` con BIGINT IDENTITY).
- El roadmap de auditoría (MEMORY.md, Fase 4 — Estabilidad y tipo) especifica esta spec como pendiente.
- Sin versionado, no es posible saber qué migraciones se han aplicado ni aplicar nuevas de forma segura en producción.

## 4. Requisitos funcionales
- [ ] Crear tabla `schema_migrations` con columnas: `version` (VARCHAR PRIMARY KEY), `name` (TEXT), `applied_at` (TIMESTAMPTZ DEFAULT now()).
- [ ] Renumerar/renombrar las 8 migraciones existentes con prefijo de versión (ej. `001_`, `002_`, ...) en orden lógico de dependencias.
- [ ] Consolidar la definición de `wellness_data` (elegir una versión consistente, preferiblemente la de `add_wellness_data.sql` con UUID).
- [ ] Añadir `IF NOT EXISTS` a todas las sentencias `CREATE TABLE` para idempotencia.
- [ ] Añadir comentarios de cabecera a cada migración con versión, nombre y descripción.
- [ ] Crear un archivo de resumen `migrations/README.md` que documente el orden y propósito de cada migración.
- [ ] No modificar el comportamiento de la aplicación (solo estructura de BD y versionado).
- [ ] `npm run lint` pasa.
- [ ] `npm run build` pasa.

## 5. Criterios de aceptación
- [ ] Tabla `schema_migrations` creada en la especificación (archivo SQL que la crea).
- [ ] 8 migraciones renombradas con prefijo de versión ordenado.
- [ ] Definición de `wellness_data` consolidada (una sola versión).
- [ ] Todas las migraciones usan `IF NOT EXISTS` donde corresponde.
- [ ] `migrations/README.md` creado documentando el orden de aplicación.
- [ ] `npm run lint` pasa.
- [ ] `npm run build` pasa.
- [ ] Commit con convención estándar: `feat(database): <descripción>`.
- [ ] PR abierto hacia `develop`.
- [ ] `MEMORY.md` actualizado (spec-audit-07 marcada como implementada).
- [ ] `CHANGELOG.md` actualizado.

## 6. Diseño técnico
- **Archivos afectados (modificados):**
  - `migrations/add_wellness_data.sql` — consolidar definición de wellness_data.
  - `migrations/enable_rls.sql` — remover definición duplicada de wellness_data, mantener solo RLS.
  - `migrations/add_user_profile_fields.sql` — añadir prefijo de versión.
  - `migrations/add_constraints.sql` — añadir prefijo de versión.
  - `migrations/add_training_zones.sql` — añadir prefijo de versión.
  - `migrations/add_ctl_offset.sql` — añadir prefijo de versión.
  - `migrations/delete_user_rpc.sql` — añadir prefijo de versión.
  - `migrations/fix_profiles_schema.sql` — añadir prefijo de versión.
- **Archivos afectados (nuevos):**
  - `migrations/000_create_schema_migrations.sql` — crea tabla de versionado.
  - `migrations/README.md` — documentación del orden de migraciones.
- **Base de datos:** tabla `schema_migrations` en Supabase.
- **Rama:** `feat/sql-migrations-versioning` creada desde `develop`.
- **Merge:** PR hacia `develop` (no a `main`).

## 7. Pruebas
- **Unitarias:** No aplica (migraciones SQL no tienen tests unitarios).
- **Integración:** No aplica directamente, pero las migraciones deben ser idempotentes y aplicables en orden.
- **E2E:** No aplica.

## 8. Notas adicionales
- El orden de migraciones debe respetar dependencias: `profiles` debe existir antes de añadirle columnas; `activities` y `planned_workouts` deben existir antes de añadirles constraints; `wellness_data` depende de `profiles` (user_id referencia auth.users).
- Las migraciones deben ser idempotentes (`IF NOT EXISTS`, `DROP POLICY IF EXISTS`, `ADD COLUMN IF NOT EXISTS`).
- No commitear directamente a `main` ni a `develop`; siempre vía PR hacia `develop`.
- No iniciar la siguiente tarea hasta que esta esté mergeada.

---
Versión: 0.1.0 — 2026-11-05
