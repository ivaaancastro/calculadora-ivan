# Migraciones SQL

Este directorio contiene las migraciones SQL de la base de datos de Supabase,
versionadas y ordenadas para poder aplicarse de forma segura y repetible.

## Tabla de versionado

La tabla `public.schema_migrations` registra qué migraciones se han aplicado.
Se crea con la migración `000_create_schema_migrations.sql`, que debe
ejecutarse siempre primero.

## Orden de aplicación

| Versión | Archivo | Propósito |
|---------|---------|-----------|
| 000 | `000_create_schema_migrations.sql` | Crea tabla de versionado `schema_migrations` |
| 001 | `001_add_wellness_data.sql` | Crea `wellness_data` (UUID), RLS, políticas e índice; añade columnas de Intervals.icu a `profiles` |
| 002 | `002_enable_rls.sql` | Crea tabla `events`; activa RLS y políticas en `activities`, `planned_workouts`, `events`, `wellness_data` |
| 003 | `003_add_user_profile_fields.sql` | Añade `full_name`, `avatar_url` a `profiles`; crea bucket de storage `avatars` |
| 004 | `004_fix_profiles_schema.sql` | Añade columnas de Intervals.icu y `user_settings` a `profiles` |
| 005 | `005_add_training_zones.sql` | Añade columnas de zonas de entrenamiento (run/bike) a `profiles` |
| 006 | `006_add_ctl_offset.sql` | Añade `ctl_offset` a `profiles` |
| 007 | `007_add_constraints.sql` | Añade restricciones CHECK a `activities` (duración, distancia, pulso, desnivel) |
| 008 | `008_delete_user_rpc.sql` | Crea función `delete_user()` para eliminar cuenta propia y sus datos |

## Notas

- Todas las migraciones son idempotentes (`IF NOT EXISTS`, `DROP POLICY IF EXISTS`,
  `ADD COLUMN IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`,
  `INSERT ... ON CONFLICT`, guardas `DO $$ ... $$` para restricciones).
- La definición de `wellness_data` está consolidada en `001_add_wellness_data.sql`
  (tipo `UUID`, columnas de Garmin/Intervals.icu). La definición previa duplicada
  con `BIGINT IDENTITY` que existía en `enable_rls.sql` fue eliminada para evitar
  conflictos de esquema (ver hallazgo P-12 / R-12 del informe de auditoría).
- Ejecutar en Supabase SQL Editor → New Query → Run, en el orden indicado.
- No modificar el comportamiento de la aplicación; solo estructura de base de
  datos y versionado de migraciones.
