import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { requiereSesion, usuarioDe } from '../middleware/requiere-sesion';

export const mapaRouter = Router();

type EstadoNivel = 'completado' | 'actual' | 'bloqueado';

type FilaUnidad = { id: number; orden: number; titulo: string; descripcion: string };
type FilaNivel = {
  id: number;
  unidad_id: number;
  orden: number;
  titulo: string;
  xp_recompensa: number;
};
type FilaProgreso = { nivel_id: number; estrellas: number };

// GET /mapa (requiere sesión)
// Devuelve las unidades con sus niveles y el estado de cada nivel para el usuario:
//   completado -> ya lo terminó (con sus estrellas)
//   actual     -> el primer nivel sin completar, el único que se puede jugar
//   bloqueado  -> todos los que vienen después del actual
mapaRouter.get('/', requiereSesion, async (req, res) => {
  const usuario = usuarioDe(req);

  const [unidades, niveles, progreso] = await Promise.all([
    supabase.from('unidades').select('id, orden, titulo, descripcion').order('orden'),
    supabase.from('niveles').select('id, unidad_id, orden, titulo, xp_recompensa').order('orden'),
    supabase.from('progreso_niveles').select('nivel_id, estrellas').eq('user_id', usuario.id),
  ]);

  if (unidades.error) throw unidades.error;
  if (niveles.error) throw niveles.error;
  if (progreso.error) throw progreso.error;

  const estrellasPorNivel = new Map(
    (progreso.data as FilaProgreso[]).map((fila) => [fila.nivel_id, fila.estrellas]),
  );

  // Los niveles vienen ordenados por "orden" (1 a 15), que es el camino del mapa.
  let nivelActualId: number | null = null;
  const nivelesConEstado = (niveles.data as FilaNivel[]).map((nivel) => {
    let estado: EstadoNivel;
    if (estrellasPorNivel.has(nivel.id)) {
      estado = 'completado';
    } else if (nivelActualId === null) {
      estado = 'actual';
      nivelActualId = nivel.id;
    } else {
      estado = 'bloqueado';
    }

    return {
      id: nivel.id,
      unidadId: nivel.unidad_id,
      orden: nivel.orden,
      titulo: nivel.titulo,
      xpRecompensa: nivel.xp_recompensa,
      estado,
      estrellas: estrellasPorNivel.get(nivel.id) ?? null,
    };
  });

  const respuesta = (unidades.data as FilaUnidad[]).map((unidad) => ({
    id: unidad.id,
    orden: unidad.orden,
    titulo: unidad.titulo,
    descripcion: unidad.descripcion,
    niveles: nivelesConEstado
      .filter((nivel) => nivel.unidadId === unidad.id)
      .map(({ unidadId: _unidadId, ...nivel }) => nivel),
  }));

  res.json({
    unidades: respuesta,
    resumen: {
      completados: estrellasPorNivel.size,
      total: nivelesConEstado.length,
      nivelActualId,
    },
  });
});
