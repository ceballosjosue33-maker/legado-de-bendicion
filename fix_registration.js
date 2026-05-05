const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Halo.2112032342@db.ofgfjqqajjrofhnqxxsy.supabase.co:5432/postgres';

const client = new Client({ connectionString });

async function run() {
  try {
    await client.connect();
    console.log("Conectado a la base de datos para arreglar el problema de registro...");

    // 1. Agregar la política de seguridad RLS faltante para que los nuevos usuarios puedan guardar su perfil al registrarse.
    const query = `
      -- Permite que un usuario nuevo recién registrado inserte su propia fila en la tabla usuarios
      CREATE POLICY "Usuarios pueden insertar su perfil" 
      ON public.usuarios 
      FOR INSERT 
      WITH CHECK (auth.uid() = id);
    `;

    await client.query(query);
    console.log("¡Política de seguridad corregida con éxito!");

  } catch (err) {
    // Si la política ya existe, lanzará un error que podemos ignorar
    if (err.code === '42710') {
      console.log("La política ya existía.");
    } else {
      console.error("Error ejecutando query:", err);
    }
  } finally {
    await client.end();
  }
}

run();
