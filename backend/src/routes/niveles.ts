import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { requiereSesion, usuarioDe } from '../middleware/requiere-sesion';

export const nivelesRouter = Router();

// GET /niveles/:id (requiere sesión)
// Devuelve el concepto y los retos de un nivel SIN las respuestas correctas
// ni las explicaciones (esas llegan al responder cada reto).
// Solo se puede abrir un nivel completado o el actual; los bloqueados dan 403.
nivelesRouter.get('/:id', requiereSesion, async (req, res) => {
  const usuario = usuarioDe(req);

  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: 'El id del nivel no es válido' });
    return;
  }

  const [nivel, ordenes, progreso] = await Promise.all([
    supabase
      .from('niveles')
      .select('id, orden, titulo, concepto_titulo, concepto_texto, concepto_ejemplo, xp_recompensa')
      .eq('id', id)
      .maybeSingle(),
    supabase.from('niveles').select('id, orden').order('orden'),
    supabase.from('progreso_niveles').select('nivel_id').eq('user_id', usuario.id),
  ]);

  if (nivel.error) throw nivel.error;
  if (ordenes.error) throw ordenes.error;
  if (progreso.error) throw progreso.error;

  if (!nivel.data) {
    res.status(404).json({ error: 'El nivel no existe' });
    return;
  }

  // Un nivel está disponible si todos los anteriores ya están completados.
  const ordenDelNivel = nivel.data.orden;
  const completados = new Set((progreso.data as { nivel_id: number }[]).map((f) => f.nivel_id));
  const anterioresSinCompletar = (ordenes.data as { id: number; orden: number }[]).filter(
    (n) => n.orden < ordenDelNivel && !completados.has(n.id),
  );
  
  if (anterioresSinCompletar.length > 0) {
    res.status(403).json({ error: 'Este nivel todavía está bloqueado' });
    return;
  }

  // Importante: NO se pide la columna "respuesta" ni las explicaciones.
  const retos = await supabase
    .from('retos')
    .select('id, orden, tipo, enunciado, codigo, opciones, pista')
    .eq('nivel_id', id)
    .order('orden');
  if (retos.error) throw retos.error;

  res.json({
    nivel: {
      id: nivel.data.id,
      orden: nivel.data.orden,
      titulo: nivel.data.titulo,
      conceptoTitulo: nivel.data.concepto_titulo,
      conceptoTexto: nivel.data.concepto_texto,
      conceptoEjemplo: nivel.data.concepto_ejemplo,
      xpRecompensa: nivel.data.xp_recompensa,
    },
    retos: retos.data,
  });
});