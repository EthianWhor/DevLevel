import { supabase } from './supabase';

// Un nivel está desbloqueado si el usuario ya completó todos los niveles
// que van antes en el camino (los de "orden" menor).
// Es la misma regla que usan GET /mapa y GET /niveles/:id.
export async function nivelDesbloqueado(userId: string, ordenNivel: number): Promise<boolean> {
  const [anteriores, progreso] = await Promise.all([
    supabase.from('niveles').select('id').lt('orden', ordenNivel),
    supabase.from('progreso_niveles').select('nivel_id').eq('user_id', userId),
  ]);

  if (anteriores.error) throw anteriores.error;
  if (progreso.error) throw progreso.error;

  const completados = new Set((progreso.data as { nivel_id: number }[]).map((f) => f.nivel_id));
  return (anteriores.data as { id: number }[]).every((nivel) => completados.has(nivel.id));
}
