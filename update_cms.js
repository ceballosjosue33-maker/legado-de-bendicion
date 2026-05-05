const fs = require('fs');
const { Client } = require('pg');

const sql = `
DROP TABLE IF EXISTS public.contenido_pagina CASCADE;

CREATE TABLE public.contenido_pagina (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seccion TEXT NOT NULL,
    campo TEXT NOT NULL,
    valor_texto TEXT,
    valor_imagen_url TEXT,
    actualizado_por UUID REFERENCES public.usuarios(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(seccion, campo)
);

ALTER TABLE public.contenido_pagina ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cualquiera lee contenido" ON public.contenido_pagina FOR SELECT USING (true);
CREATE POLICY "Pastor gestiona contenido" ON public.contenido_pagina FOR ALL USING (public.get_auth_role() = 'pastor');
`;

async function run() {
    const client = new Client({
        connectionString: 'postgresql://postgres:Halo.2112032342@db.ofgfjqqajjrofhnqxxsy.supabase.co:5432/postgres'
    });
    
    try {
        await client.connect();
        await client.query(sql);
        console.log('CMS schema updated successfully!');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}
run();
