// ==========================================
// config.js — CONFIGURACIÓN SUPABASE COMPARTIDA
// Edita solo estas dos variables con tus credenciales reales.
// ==========================================
const SUPABASE_URL  = 'https://ofgfjqqajjrofhnqxxsy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_lM90f-UZs1fsskWEFjHCwA__eCvqX3k';

// Crear el cliente UNA SOLA VEZ y exponerlo globalmente
// La librería de Supabase ya se carga como script antes de este archivo.
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Sobrescribimos window.supabase para que todos los archivos lo usen
window.sb = _supabase;
