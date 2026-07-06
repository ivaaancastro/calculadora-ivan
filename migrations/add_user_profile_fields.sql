-- 1. Añadir columnas de identidad a la tabla profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Crear el bucket de storage 'avatars' si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Políticas de acceso para los avatares
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'avatars' );

DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;
CREATE POLICY "Anyone can upload an avatar."
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'avatars' );

DROP POLICY IF EXISTS "Anyone can update an avatar." ON storage.objects;
CREATE POLICY "Anyone can update an avatar."
  ON storage.objects FOR UPDATE
  WITH CHECK ( bucket_id = 'avatars' );
