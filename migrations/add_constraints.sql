-- Añadir restricciones matemáticas a la tabla activities para prevenir datos corruptos o negativos

-- 1. Restricción de duración (debe ser mayor estricto a 0)
ALTER TABLE public.activities
ADD CONSTRAINT check_duration_positive CHECK (duration > 0);

-- 2. Restricción de distancia (no puede ser negativa)
ALTER TABLE public.activities
ADD CONSTRAINT check_distance_non_negative CHECK (distance >= 0);

-- 3. Restricción de pulso medio (no puede ser negativo, aunque puede ser 0 si no hay pulso)
ALTER TABLE public.activities
ADD CONSTRAINT check_hr_avg_non_negative CHECK (hr_avg >= 0);

-- 4. Restricción de desnivel positivo (no puede ser negativo)
ALTER TABLE public.activities
ADD CONSTRAINT check_elevation_gain_non_negative CHECK (elevation_gain >= 0);

-- 5. Opcional: Impedir valores absurdos que romperían la fórmula (ej: duraciones mayores a 20000 minutos, o frecuencias cardíacas mayores a 250)
-- ALTER TABLE public.activities ADD CONSTRAINT check_hr_avg_realistic CHECK (hr_avg <= 250);
