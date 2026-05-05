const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Halo.2112032342@db.ofgfjqqajjrofhnqxxsy.supabase.co:5432/postgres';

const client = new Client({ connectionString });

async function run() {
  try {
    await client.connect();
    console.log("Sincronizando usuarios huerfanos...");

    const query = `
      INSERT INTO public.usuarios (id, nombre, email, rol, activo)
      SELECT id, raw_user_meta_data->>'nombre', email, 'estudiante', true
      FROM auth.users
      WHERE id NOT IN (SELECT id FROM public.usuarios)
    `;

    const res = await client.query(query);
    console.log(`¡Se sincronizaron ${res.rowCount} usuarios exitosamente!`);

  } catch (err) {
    console.error("Error ejecutando query:", err);
  } finally {
    await client.end();
  }
}

run();
