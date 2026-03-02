-- Añadir columnas de zonas de entrenamiento al perfil
-- Ejecutar en Supabase SQL Editor

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS run_zones_mode text DEFAULT 'lthr';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS run_threshold_pace text DEFAULT '4:30';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS run_pace_zones jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bike_zones_mode text DEFAULT 'lthr';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bike_ftp integer DEFAULT 200;
