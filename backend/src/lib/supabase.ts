import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env';

const opcionesServidor = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
};

// Cliente de Supabase del servidor. Usa la llave secreta, que se salta RLS,
// por eso este archivo solo existe en el backend y nunca en la app.
// persistSession y autoRefreshToken van en false porque el servidor
// no guarda una sesión propia: cada petición trae el token del usuario.
// Es "let" solo para que las pruebas puedan cambiarlo por uno falso.
export let supabase: SupabaseClient = createClient(
  env.supabaseUrl,
  env.supabaseSecretKey,
  opcionesServidor,
);

let fabricaClienteSesion = (): SupabaseClient =>
  createClient(env.supabaseUrl, env.supabaseSecretKey, opcionesServidor);

// Crea un cliente nuevo solo para iniciar sesión o renovar el token.
// Si se usara el cliente compartido, después de signInWithPassword ese cliente
// quedaría con la sesión del usuario y las consultas siguientes de otros
// usuarios pasarían por RLS con un token ajeno. Un cliente por petición lo evita.
export function crearClienteSesion() {
  return fabricaClienteSesion();
}

// Solo para las pruebas automáticas (test/): reemplaza Supabase por una
// versión en memoria para no tocar la base de datos real.
export function usarClienteDePrueba(cliente: SupabaseClient) {
  supabase = cliente;
  fabricaClienteSesion = () => cliente;
}
