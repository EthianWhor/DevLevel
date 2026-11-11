import { supabase } from './supabase';
import { aEquipo } from './equipo';
import type { Equipo } from './mazmorra/tipos';

// Fila de la tabla profiles tal como viene de Postgres.
export type FilaPerfil = {
  id: string;
  nombre_heroe: string | null;
  avatar: string | null;
  xp: number;
  nivel: number;
  racha_actual: number;
  racha_maxima: number;
  ultima_actividad: string | null;
  equipo: unknown;
};

// Perfil que se envía a la app (camelCase, igual que el resto de la API).
export type Perfil = {
  id: string;
  nombreHeroe: string | null;
  avatar: string | null;
  xp: number;
  nivel: number;
  rachaActual: number;
  rachaMaxima: number;
  ultimaActividad: string | null;
  equipo: Equipo;
};

export const COLUMNAS_PERFIL =
  'id, nombre_heroe, avatar, xp, nivel, racha_actual, racha_maxima, ultima_actividad, equipo';

export function aPerfil(fila: FilaPerfil): Perfil {
  return {
    id: fila.id,
    nombreHeroe: fila.nombre_heroe,
    avatar: fila.avatar,
    xp: fila.xp,
    nivel: fila.nivel,
    rachaActual: fila.racha_actual,
    rachaMaxima: fila.racha_maxima,
    ultimaActividad: fila.ultima_actividad,
    equipo: aEquipo(fila.equipo),
  };
}

// Devuelve el perfil del usuario. Si por algún motivo no existe
// (por ejemplo, un usuario creado a mano en Supabase), lo crea vacío.
export async function obtenerOCrearPerfil(userId: string): Promise<Perfil> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true })
    .select(COLUMNAS_PERFIL)
    .maybeSingle<FilaPerfil>();

  if (error) throw error;
  if (data) return aPerfil(data);

  // Con ignoreDuplicates, si el perfil ya existía el upsert no devuelve la fila.
  const existente = await supabase
    .from('profiles')
    .select(COLUMNAS_PERFIL)
    .eq('id', userId)
    .single<FilaPerfil>();

  if (existente.error) throw existente.error;
  return aPerfil(existente.data);
}
