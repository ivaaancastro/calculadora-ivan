-- Función para permitir a un usuario eliminar su propia cuenta y todos sus datos
-- Debe ejecutarse en el SQL Editor de Supabase

CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _uid uuid;
BEGIN
  -- Obtener el ID del usuario autenticado que realiza la petición
  _uid := auth.uid();
  
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not logged in';
  END IF;

  -- 1. Eliminar todos los registros asociados en las tablas públicas
  -- (Esto previene errores de llaves foráneas si no hay ON DELETE CASCADE configurado)
  DELETE FROM public.activities WHERE user_id = _uid;
  DELETE FROM public.planned_workouts WHERE user_id = _uid;
  DELETE FROM public.events WHERE user_id = _uid;
  DELETE FROM public.wellness_data WHERE user_id = _uid;
  DELETE FROM public.profiles WHERE user_id = _uid;

  -- 2. Eliminar al usuario de la tabla de autenticación de Supabase
  -- Al tener SECURITY DEFINER, esta función se ejecuta con permisos de administrador (postgres)
  DELETE FROM auth.users WHERE id = _uid;
END;
$$;

-- Opcional: Asegurarse de que la función pueda ser llamada por usuarios autenticados
GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated;
