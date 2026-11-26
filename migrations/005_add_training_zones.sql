-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 005_add_training_zones
-- Description: Añadir columnas de zonas de entrenamiento al perfil de usuario.
--              Depende de: ninguna (profiles preexistente).
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS run_zones_mode text DEFAULT 'lthr';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS run_threshold_pace text DEFAULT '4:30';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS run_pace_zones jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bike_zones_mode text DEFAULT 'lthr';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bike_ftp integer DEFAULT 200;
