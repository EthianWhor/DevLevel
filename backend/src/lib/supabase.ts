import { createClient } from '@supabase/supabase-js';
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
export const supabase = createClient(env.supabaseUrl, env.supabaseSecretKey, opcionesServidor);

// Crea un cliente nuevo solo para iniciar sesión o renovar el token.
// Si se usara el cliente compartido, después de signInWithPassword ese cliente
// quedaría con la sesión del usuario y las consultas siguientes de otros
// usuarios pasarían por RLS con un token ajeno. Un cliente por petición lo evita.
export function crearClienteSesion() {
  return createClient(env.supabaseUrl, env.supabaseSecretKey, opcionesServidor);
}
