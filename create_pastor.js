const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ofgfjqqajjrofhnqxxsy.supabase.co';
const supabaseKey = 'sb_publishable_lM90f-UZs1fsskWEFjHCwA__eCvqX3k';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createPastor() {
    console.log("Creando usuario pastor...");
    const email = 'pastor.legado@gmail.com';
    const password = 'PastorAdmin2026!';
    const nombre = 'Pastor Principal';

    // 1. SignUp
    const { data: authData, error: authErr } = await supabase.auth.signUp({
        email,
        password,
    });

    if (authErr) {
        console.error("Error en auth:", authErr.message);
        return;
    }

    console.log("Usuario creado en Auth:", authData.user.id);

    // 2. Insert en public.usuarios
    const { data: dbData, error: dbErr } = await supabase
        .from('usuarios')
        .upsert({
            id: authData.user.id,
            nombre: nombre,
            email: email,
            rol: 'pastor',
            activo: true
        });

    if (dbErr) {
        console.error("Error insertando rol (Probablemente RLS):", dbErr.message);
        console.log("Debes ejecutar el siguiente SQL en Supabase Editor:");
        console.log(`INSERT INTO public.usuarios (id, nombre, email, rol, activo) VALUES ('${authData.user.id}', '${nombre}', '${email}', 'pastor', true);`);
    } else {
        console.log("Pastor guardado exitosamente en base de datos.");
    }
}

createPastor();
