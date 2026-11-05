-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 000_create_schema_migrations
-- Description: Crea la tabla de versionado schema_migrations para rastrear
--              qué migraciones se han aplicado en la base de datos de Supabase.
--              Debe ejecutarse PRIMERO, antes de cualquier otra migración.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.schema_migrations (
  version    VARCHAR PRIMARY KEY,
  name       TEXT NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.schema_migrations IS 'Registro de migraciones SQL aplicadas (versionado de esquema).';
COMMENT ON COLUMN public.schema_migrations.version IS 'Identificador de versión de la migración (ej. 001_add_wellness_data).';
COMMENT ON COLUMN public.schema_migrations.name IS 'Nombre descriptivo de la migración.';
COMMENT ON COLUMN public.schema_migrations.applied_at IS 'Fecha y hora en que se aplicó la migración.';

SELECT 'schema_migrations table created ✓' AS status;
