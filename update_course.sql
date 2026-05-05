-- Drop old tables
DROP TABLE IF EXISTS public.progreso_curso CASCADE;
DROP TABLE IF EXISTS public.tareas CASCADE;
DROP TABLE IF EXISTS public.modulos_curso CASCADE;

-- Create new course schema
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

-- RLS
ALTER TABLE public.niveles_curso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modulos_curso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lecciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archivos_leccion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trabajos_modulo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progreso_leccion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progreso_modulo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cualquiera lee niveles" ON public.niveles_curso FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Pastor gestiona niveles" ON public.niveles_curso FOR ALL USING (public.get_auth_role() = 'pastor');

CREATE POLICY "Cualquiera lee modulos" ON public.modulos_curso FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Pastor gestiona modulos" ON public.modulos_curso FOR ALL USING (public.get_auth_role() = 'pastor');

CREATE POLICY "Cualquiera lee lecciones" ON public.lecciones FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Pastor gestiona lecciones" ON public.lecciones FOR ALL USING (public.get_auth_role() = 'pastor');

CREATE POLICY "Cualquiera lee archivos" ON public.archivos_leccion FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Pastor gestiona archivos" ON public.archivos_leccion FOR ALL USING (public.get_auth_role() = 'pastor');

CREATE POLICY "Cualquiera lee trabajos" ON public.trabajos_modulo FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Pastor gestiona trabajos" ON public.trabajos_modulo FOR ALL USING (public.get_auth_role() = 'pastor');

CREATE POLICY "Usuarios leen su progreso leccion" ON public.progreso_leccion FOR SELECT USING (auth.uid() = usuario_id OR public.get_auth_role() = 'pastor');
CREATE POLICY "Usuarios insertan su progreso leccion" ON public.progreso_leccion FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Usuarios actualizan su progreso leccion" ON public.progreso_leccion FOR UPDATE USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios leen su progreso modulo" ON public.progreso_modulo FOR SELECT USING (auth.uid() = usuario_id OR public.get_auth_role() = 'pastor');
CREATE POLICY "Usuarios insertan su progreso modulo" ON public.progreso_modulo FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Usuarios actualizan su progreso modulo" ON public.progreso_modulo FOR UPDATE USING (auth.uid() = usuario_id);
