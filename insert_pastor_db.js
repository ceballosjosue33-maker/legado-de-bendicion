const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Halo.2112032342@db.ofgfjqqajjrofhnqxxsy.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
});

async function run() {
  try {
    await client.connect();
    console.log("Conectado a la base de datos.");

    const query = `
      DO $$
      DECLARE
        new_user_id uuid := gen_random_uuid();
      BEGIN
        -- Insert auth user
        INSERT INTO auth.users (
          instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
        ) VALUES (
          '00000000-0000-0000-0000-000000000000',
          new_user_id,
          'authenticated',
          'authenticated',
          'pastor@legadodebendicion.org',
          crypt('PastorAdmin2026!', gen_salt('bf')),
          now(),
          NULL,
          NULL,
          '{"provider":"email","providers":["email"]}',
          '{}',
          now(),
          now(),
          '',
          '',
          '',
          ''
        );

        -- Insert auth identity for login
        INSERT INTO auth.identities (
          id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
          gen_random_uuid(),
          new_user_id,
          new_user_id::text,
          format('{"sub":"%s","email":"%s"}', new_user_id::text, 'pastor@legadodebendicion.org')::jsonb,
          'email',
          now(),
          now(),
          now()
        );

        -- Insert into public.usuarios to link role
        INSERT INTO public.usuarios (id, nombre, email, rol, activo)
        VALUES (new_user_id, 'Pastor Principal', 'pastor@legadodebendicion.org', 'pastor', true);
      END
      $$;
    `;

    await client.query(query);
    console.log("¡Usuario PastorAdmin2026! creado y enlazado con el rol 'pastor' exitosamente!");

  } catch (err) {
    console.error("Error ejecutando query:", err);
  } finally {
    await client.end();
  }
}

run();
