-- Migración para añadir soporte de múltiples roles a los usuarios
-- Ejecuta este script en el SQL Editor de tu panel de Supabase

-- 1. Agregamos la columna 'roles' como un arreglo de texto
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT ARRAY['estudiante']::TEXT[];

-- 2. Migramos los datos existentes de 'rol' a la nueva columna 'roles'
UPDATE public.usuarios 
SET roles = ARRAY[rol]
WHERE roles IS NULL OR array_length(roles, 1) IS NULL;

-- Nota: No eliminamos la columna 'rol' ni su CHECK constraint (pastor, lider, discipulo, estudiante)
-- porque la seguiremos usando para determinar el "Rol Principal" en la interfaz.
-- La nueva columna 'roles' actuará de manera aditiva para soportar roles secundarios (ej. un lider que también es estudiante).
