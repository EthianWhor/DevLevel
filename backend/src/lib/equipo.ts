import { supabase } from './supabase';
import { EQUIPO_VACIO, OBJETOS } from './mazmorra/objetos';
import type { Equipo, Espacio } from './mazmorra/tipos';

export const ESPACIOS: Espacio[] = ['arma', 'armadura', 'amuleto'];

export type FilaInventario = { objeto_id: string; nivel_id: number | null; mitico: boolean; obtenido_at: string };

// Lee lo que dice la base de datos y lo convierte en un equipo válido.
export function aEquipo(valor: unknown): Equipo {
  const datos = (valor ?? {}) as Partial<Record<Espacio, unknown>>;
  const equipo: Equipo = { ...EQUIPO_VACIO };
  for (const espacio of ESPACIOS) {
    const id = datos[espacio];
    equipo[espacio] = typeof id === 'string' ? id : null;
  }
  return equipo;
}

// Quita del equipo lo que el jugador no tiene o lo que está en el espacio
// equivocado. Así nadie puede usar un objeto que no ganó.
export function filtrarEquipo(equipo: Equipo, poseidos: ReadonlySet<string>): Equipo {
  const limpio: Equipo = { ...EQUIPO_VACIO };
  for (const espacio of ESPACIOS) {
    const id = equipo[espacio];
    if (id && poseidos.has(id) && OBJETOS[id]?.espacio === espacio) limpio[espacio] = id;
  }
  return limpio;
}

export async function leerInventario(userId: string): Promise<FilaInventario[]> {
  const { data, error } = await supabase
    .from('inventario')
    .select('objeto_id, nivel_id, mitico, obtenido_at')
    .eq('user_id', userId)
    .order('obtenido_at');
  if (error) throw error;
  return data as FilaInventario[];
}

// Equipo guardado del jugador, verificado contra su inventario real.
export async function equipoValido(userId: string): Promise<Equipo> {
  const [perfil, inventario] = await Promise.all([
    supabase.from('profiles').select('equipo').eq('id', userId).maybeSingle<{ equipo: unknown }>(),
    leerInventario(userId),
  ]);
  if (perfil.error) throw perfil.error;
  return filtrarEquipo(aEquipo(perfil.data?.equipo), new Set(inventario.map((f) => f.objeto_id)));
}
