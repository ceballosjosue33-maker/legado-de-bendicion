-- Configuración de Buckets de Storage en Supabase para "Legado de Bendición"

-- ==========================================
-- 1. Crear los Buckets
-- ==========================================
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('curso-materiales', 'curso-materiales', false),
  ('imagenes-pagina', 'imagenes-pagina', true),
  ('fotos-perfil', 'fotos-perfil', false)
ON CONFLICT (id) DO NOTHING;

-- Asegurar que Row Level Security está activado
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 2. Políticas para "curso-materiales"
-- ==========================================
CREATE POLICY "Autenticados pueden leer curso-materiales" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'curso-materiales' AND auth.role() = 'authenticated');

CREATE POLICY "Solo pastor inserta en curso-materiales" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'curso-materiales' AND public.get_auth_role() = 'pastor');

CREATE POLICY "Solo pastor actualiza curso-materiales" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'curso-materiales' AND public.get_auth_role() = 'pastor');

CREATE POLICY "Solo pastor elimina curso-materiales" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'curso-materiales' AND public.get_auth_role() = 'pastor');


-- ==========================================
-- 3. Políticas para "imagenes-pagina"
-- ==========================================
-- Las imágenes de la web deben ser públicas para cargar rápido sin estar logueado
CREATE POLICY "Cualquiera puede leer imagenes-pagina" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'imagenes-pagina');

CREATE POLICY "Solo pastor inserta en imagenes-pagina" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'imagenes-pagina' AND public.get_auth_role() = 'pastor');

CREATE POLICY "Solo pastor actualiza imagenes-pagina" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'imagenes-pagina' AND public.get_auth_role() = 'pastor');

CREATE POLICY "Solo pastor elimina imagenes-pagina" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'imagenes-pagina' AND public.get_auth_role() = 'pastor');


-- ==========================================
-- 4. Políticas para "fotos-perfil"
-- ==========================================
CREATE POLICY "Autenticados pueden leer fotos-perfil" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'fotos-perfil' AND auth.role() = 'authenticated');

-- Usamos el path del archivo para asegurar que un usuario 
-- solo pueda subir y modificar fotos dentro de una carpeta con su propio ID.
-- Ej: fotos-perfil/c3f2d1.../mi-foto.png
CREATE POLICY "Usuarios suben su propia foto" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'fotos-perfil' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Usuarios actualizan su propia foto" 
ON storage.objects FOR UPDATE 
USING (
    bucket_id = 'fotos-perfil' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);
