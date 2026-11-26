-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 006_add_ctl_offset
-- Description: Añade la columna ctl_offset al perfil para alinear el PMC con
--              Intervals.icu sin datos históricos completos.
--              Depende de: ninguna (profiles preexistente).
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ctl_offset NUMERIC DEFAULT 0;

COMMENT ON COLUMN public.profiles.ctl_offset IS 'Flat offset to shift the user CTL globally and match third-party data platforms';
