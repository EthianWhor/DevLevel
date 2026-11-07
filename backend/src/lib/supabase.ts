import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

// Cliente de Supabase del servidor. Usa la llave secreta, que se salta RLS,
// por eso este archivo solo existe en el backend y nunca en la app.
// persistSession y autoRefreshToken van en false porque el servidor
// no guarda una sesión propia: cada petición trae el token del usuario.
export const supabase = createClient(env.supabaseUrl, env.supabaseSecretKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
