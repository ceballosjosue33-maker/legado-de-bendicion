-- Recrear tabla contenido_pagina según nuevas especificaciones
DROP TABLE IF EXISTS public.contenido_pagina;

CREATE TABLE public.contenido_pagina (
  id uuid default gen_random_uuid() primary key,
  clave text unique not null,
  valor_texto text,
  valor_imagen_url text,
  updated_at timestamptz default now(),
  actualizado_por uuid references auth.users(id)
);

-- RLS
alter table contenido_pagina enable row level security;

create policy "Lectura publica"
  on contenido_pagina for select
  using (true);

create policy "Solo pastor puede escribir"
  on contenido_pagina for all
  using (
    exists (
      select 1 from usuarios
      where usuarios.id = auth.uid()
      and usuarios.rol = 'pastor'
    )
  );
