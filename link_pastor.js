const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Halo.2112032342@db.ofgfjqqajjrofhnqxxsy.supabase.co:5432/postgres';

const client = new Client({ connectionString });

async function run() {
  try {
    await client.connect();
    // 1. Get the UUID of the user from auth.users
    const authRes = await client.query(`SELECT id FROM auth.users WHERE email = 'pastor@legadodebendicion.org'`);
    if (authRes.rows.length === 0) {
      console.log("No se encontró el usuario en auth.users");
      return;
    }
    const userId = authRes.rows[0].id;
    console.log("El UID del usuario es:", userId);

    // 2. Check if the user is in public.usuarios
    const pubRes = await client.query(`SELECT * FROM public.usuarios WHERE id = $1`, [userId]);
    if (pubRes.rows.length > 0) {
      console.log("El usuario YA está en public.usuarios con rol:", pubRes.rows[0].rol);
      // Let's ensure it has the pastor role
      if (pubRes.rows[0].rol !== 'pastor') {
        await client.query(`UPDATE public.usuarios SET rol = 'pastor' WHERE id = $1`, [userId]);
        console.log("Rol actualizado a pastor!");
      }
    } else {
      // Insert into public.usuarios
      await client.query(`
        INSERT INTO public.usuarios (id, nombre, email, rol, activo)
        VALUES ($1, 'Pastor Principal', 'pastor@legadodebendicion.org', 'pastor', true)
      `, [userId]);
      console.log("¡Usuario enlazado y configurado como Pastor Principal en la tabla public.usuarios!");
    }
  } catch (err) {
    console.error("Error ejecutando query:", err);
  } finally {
    await client.end();
  }
}

run();
