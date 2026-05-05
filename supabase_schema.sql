-- Supabase Schema for "Legado de Bendición"

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. Create Tables
-- ==========================================

-- Usuarios (Linked to auth.users)
CREATE TABLE public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    telefono TEXT,
    foto_url TEXT,
    rol TEXT CHECK (rol IN ('pastor', 'lider', 'discipulo', 'estudiante')) DEFAULT 'estudiante',
    lider_asignado_id UUID REFERENCES public.usuarios(id),
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    activo BOOLEAN DEFAULT true
);

-- Grupos
CREATE TABLE public.grupos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    lider_id UUID REFERENCES public.usuarios(id),
    descripcion TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Grupo Miembros
CREATE TABLE public.grupo_miembros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grupo_id UUID REFERENCES public.grupos(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    fecha_ingreso TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(grupo_id, usuario_id)
);

-- NUEVO ESQUEMA DE CURSO BÍBLICO (Tipo Udemy)
CREATE TABLE public.niveles_curso (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo TEXT NOT NULL,
    descripcion TEXT,
    orden INTEGER NOT NULL,
    activo BOOLEAN DEFAULT true,
    imagen_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.modulos_curso (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nivel_id UUID REFERENCES public.niveles_curso(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    orden INTEGER NOT NULL,
    activo BOOLEAN DEFAULT true,
    imagen_portada_url TEXT,
    duracion_estimada TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.lecciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    modulo_id UUID REFERENCES public.modulos_curso(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    contenido_texto TEXT,
    video_url TEXT,
    orden INTEGER NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.archivos_leccion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    leccion_id UUID REFERENCES public.lecciones(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    archivo_url TEXT NOT NULL,
    tipo TEXT,
    tamano_kb INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.trabajos_modulo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    modulo_id UUID REFERENCES public.modulos_curso(id) ON DELETE CASCADE UNIQUE,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    instrucciones_detalladas TEXT,
    archivo_referencia_url TEXT,
    fecha_limite TIMESTAMP WITH TIME ZONE,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.progreso_leccion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    leccion_id UUID REFERENCES public.lecciones(id) ON DELETE CASCADE,
    completada BOOLEAN DEFAULT false,
    fecha_completada TIMESTAMP WITH TIME ZONE,
    UNIQUE(usuario_id, leccion_id)
);

CREATE TABLE public.progreso_modulo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    modulo_id UUID REFERENCES public.modulos_curso(id) ON DELETE CASCADE,
    completado BOOLEAN DEFAULT false,
    porcentaje INTEGER DEFAULT 0,
    fecha_completado TIMESTAMP WITH TIME ZONE,
    UNIQUE(usuario_id, modulo_id)
);

-- Asistencia
CREATE TABLE public.asistencia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    presente BOOLEAN DEFAULT false,
    evento_tipo TEXT CHECK (evento_tipo IN ('dominical', 'estudio', 'jovenes', 'oracion')) NOT NULL,
    UNIQUE(usuario_id, fecha, evento_tipo)
);

-- Contenido de la Página Web (CMS dinámico)
CREATE TABLE public.contenido_pagina (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seccion TEXT UNIQUE NOT NULL,
    titulo TEXT,
    subtitulo TEXT,
    imagen_url TEXT,
    texto TEXT,
    actualizado_por UUID REFERENCES public.usuarios(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Log de Auditoría para Roles
CREATE TABLE public.roles_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES public.usuarios(id),
    rol_anterior TEXT,
    rol_nuevo TEXT,
    cambiado_por UUID REFERENCES public.usuarios(id),
    fecha TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==========================================
-- 2. Security Definer Helper (Para evitar bucle infinito RLS)
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rol FROM public.usuarios WHERE id = auth.uid();
$$;

-- ==========================================
-- 3. Enable Row Level Security (RLS)
-- ==========================================
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupo_miembros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modulos_curso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progreso_curso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asistencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contenido_pagina ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles_log ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 4. RLS Policies
-- ==========================================

-- Usuarios
CREATE POLICY "Usuarios pueden leer su propio perfil" ON public.usuarios FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Pastor puede leer todos los usuarios" ON public.usuarios FOR SELECT USING (public.get_auth_role() = 'pastor');
CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON public.usuarios FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Pastor puede actualizar todos los usuarios" ON public.usuarios FOR UPDATE USING (public.get_auth_role() = 'pastor');
CREATE POLICY "Pastor puede insertar usuarios" ON public.usuarios FOR INSERT WITH CHECK (public.get_auth_role() = 'pastor');

-- Módulos del Curso
CREATE POLICY "Todos los autenticados leen modulos" ON public.modulos_curso FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Solo pastor inserta modulos" ON public.modulos_curso FOR INSERT WITH CHECK (public.get_auth_role() = 'pastor');
CREATE POLICY "Solo pastor actualiza modulos" ON public.modulos_curso FOR UPDATE USING (public.get_auth_role() = 'pastor');
CREATE POLICY "Solo pastor elimina modulos" ON public.modulos_curso FOR DELETE USING (public.get_auth_role() = 'pastor');

-- Tareas
CREATE POLICY "Todos los autenticados leen tareas" ON public.tareas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Solo pastor inserta tareas" ON public.tareas FOR INSERT WITH CHECK (public.get_auth_role() = 'pastor');
CREATE POLICY "Solo pastor actualiza tareas" ON public.tareas FOR UPDATE USING (public.get_auth_role() = 'pastor');
CREATE POLICY "Solo pastor elimina tareas" ON public.tareas FOR DELETE USING (public.get_auth_role() = 'pastor');

-- Progreso del Curso
CREATE POLICY "Usuarios leen su progreso" ON public.progreso_curso FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "Pastor lee todo progreso" ON public.progreso_curso FOR SELECT USING (public.get_auth_role() = 'pastor');
CREATE POLICY "Usuarios insertan su progreso" ON public.progreso_curso FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Usuarios actualizan su progreso" ON public.progreso_curso FOR UPDATE USING (auth.uid() = usuario_id);

-- Grupos
CREATE POLICY "Todos leen grupos" ON public.grupos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Lider actualiza su grupo" ON public.grupos FOR UPDATE USING (lider_id = auth.uid() OR public.get_auth_role() = 'pastor');
CREATE POLICY "Pastor inserta grupos" ON public.grupos FOR INSERT WITH CHECK (public.get_auth_role() = 'pastor');
CREATE POLICY "Pastor elimina grupos" ON public.grupos FOR DELETE USING (public.get_auth_role() = 'pastor');

-- Grupo Miembros
CREATE POLICY "Miembros leen su grupo" ON public.grupo_miembros FOR SELECT USING (
    usuario_id = auth.uid() OR 
    public.get_auth_role() = 'pastor' OR 
    EXISTS (SELECT 1 FROM public.grupos WHERE grupos.id = grupo_miembros.grupo_id AND grupos.lider_id = auth.uid())
);
CREATE POLICY "Lider y pastor gestionan miembros" ON public.grupo_miembros FOR ALL USING (
    public.get_auth_role() = 'pastor' OR 
    EXISTS (SELECT 1 FROM public.grupos WHERE grupos.id = grupo_miembros.grupo_id AND grupos.lider_id = auth.uid())
);

-- Contenido de Página
CREATE POLICY "Cualquiera puede leer contenido" ON public.contenido_pagina FOR SELECT USING (true);
CREATE POLICY "Solo pastor modifica contenido" ON public.contenido_pagina FOR ALL USING (public.get_auth_role() = 'pastor');

-- Roles Log
CREATE POLICY "Solo pastor gestiona logs" ON public.roles_log FOR ALL USING (public.get_auth_role() = 'pastor');
