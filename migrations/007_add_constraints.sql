-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 007_add_constraints
-- Description: Añade restricciones matemáticas (CHECK) a la tabla activities
--              para prevenir datos corruptos o negativos. Todas las adiciones
--              están protegidas para ser idempotentes (re-aplicable sin error).
--              Depende de: ninguna (activities preexistente).
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_duration_positive') THEN
    ALTER TABLE public.activities
    ADD CONSTRAINT check_duration_positive CHECK (duration > 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_distance_non_negative') THEN
    ALTER TABLE public.activities
    ADD CONSTRAINT check_distance_non_negative CHECK (distance >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_hr_avg_non_negative') THEN
    ALTER TABLE public.activities
    ADD CONSTRAINT check_hr_avg_non_negative CHECK (hr_avg >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_elevation_gain_non_negative') THEN
    ALTER TABLE public.activities
    ADD CONSTRAINT check_elevation_gain_non_negative CHECK (elevation_gain >= 0);
  END IF;
END $$;

-- Opcional: Impedir valores absurdos que romperían la fórmula (ej: duraciones mayores a 20000 minutos, o frecuencias cardíacas mayores a 250)
-- DO $$
-- BEGIN
--   IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_hr_avg_realistic') THEN
--     ALTER TABLE public.activities ADD CONSTRAINT check_hr_avg_realistic CHECK (hr_avg <= 250);
--   END IF;
-- END $$;
