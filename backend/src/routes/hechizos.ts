import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { requiereSesion, usuarioDe } from '../middleware/requiere-sesion';

export const hechizosRouter = Router();

type FilaUnidad = { id: number; orden: number; titulo: string };
type FilaNivel = {
  id: number;
  unidad_id: number;
  orden: number;
  titulo: string;
  concepto_titulo: string;
  concepto_texto: string;
  concepto_ejemplo: string | null;
  hechizo_nombre: string;
  hechizo_descripcion: string;
};
type FilaProgreso = { nivel_id: number; estrellas: number };

// GET /hechizos (requiere sesión)
// El Libro de hechizos: cada nivel enseña un concepto que se guarda como
// "hechizo" la primera vez que el usuario completa ese nivel.
// Devuelve los 15 hechizos agrupados por unidad. Los que aún están bloqueados
// solo muestran qué nivel hay que completar; su contenido llega en null.
hechizosRouter.get('/', requiereSesion, async (req, res) => {
  const usuario = usuarioDe(req);

  const [unidades, niveles, progreso] = await Promise.all([
    supabase.from('unidades').select('id, orden, titulo').order('orden'),
    supabase
      .from('niveles')
      .select(
        'id, unidad_id, orden, titulo, concepto_titulo, concepto_texto, concepto_ejemplo, hechizo_nombre, hechizo_descripcion',
      )
      .order('orden'),
    supabase.from('progreso_niveles').select('nivel_id, estrellas').eq('user_id', usuario.id),
  ]);

  if (unidades.error) throw unidades.error;
  if (niveles.error) throw niveles.error;
  if (progreso.error) throw progreso.error;

  const estrellasPorNivel = new Map(
    (progreso.data as FilaProgreso[]).map((fila) => [fila.nivel_id, fila.estrellas]),
  );

  const hechizos = (niveles.data as FilaNivel[]).map((nivel) => {
    const desbloqueado = estrellasPorNivel.has(nivel.id);
    return {
      nivelId: nivel.id,
      unidadId: nivel.unidad_id,
      orden: nivel.orden,
      nivelTitulo: nivel.titulo,
      desbloqueado,
      estrellas: estrellasPorNivel.get(nivel.id) ?? null,
      nombre: desbloqueado ? nivel.hechizo_nombre : null,
      descripcion: desbloqueado ? nivel.hechizo_descripcion : null,
      conceptoTitulo: desbloqueado ? nivel.concepto_titulo : null,
      conceptoTexto: desbloqueado ? nivel.concepto_texto : null,
      conceptoEjemplo: desbloqueado ? nivel.concepto_ejemplo : null,
    };
  });

  res.json({
    unidades: (unidades.data as FilaUnidad[]).map((unidad) => ({
      id: unidad.id,
      orden: unidad.orden,
      titulo: unidad.titulo,
      hechizos: hechizos
        .filter((hechizo) => hechizo.unidadId === unidad.id)
        .map(({ unidadId: _unidadId, ...hechizo }) => hechizo),
    })),
    resumen: {
      desbloqueados: estrellasPorNivel.size,
      total: hechizos.length,
    },
  });
});
