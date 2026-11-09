import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { nivelDesbloqueado } from '../lib/desbloqueo';
import { esRespuestaCorrecta, validarFormaRespuesta, type Respuesta, type TipoReto } from '../lib/respuestas';
import { requiereSesion, usuarioDe } from '../middleware/requiere-sesion';

export const retosRouter = Router();

type FilaReto = {
  id: number;
  tipo: TipoReto;
  opciones: string[];
  respuesta: unknown;
  explicacion_correcta: string;
  explicacion_error: string;
  pista: string;
  niveles: { id: number; orden: number } | null;
};

// POST /retos/:id/responder (requiere sesión)
// Revisa la respuesta del usuario contra la respuesta correcta (que nunca sale
// del backend), guarda el intento en intentos_retos y devuelve si acertó con
// la explicación correspondiente.
retosRouter.post('/:id/responder', requiereSesion, async (req, res) => {
  const usuario = usuarioDe(req);

  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: 'El id del reto no es válido' });
    return;
  }

  const { data: reto, error } = await supabase
    .from('retos')
    .select(
      'id, tipo, opciones, respuesta, explicacion_correcta, explicacion_error, pista, niveles (id, orden)',
    )
    .eq('id', id)
    .maybeSingle<FilaReto>();

  if (error) throw error;
  if (!reto || !reto.niveles) {
    res.status(404).json({ error: 'El reto no existe' });
    return;
  }

  if (!(await nivelDesbloqueado(usuario.id, reto.niveles.orden))) {
    res.status(403).json({ error: 'Este nivel todavía está bloqueado' });
    return;
  }

  const enviada = (req.body ?? {}).respuesta as unknown;
  const errorForma = validarFormaRespuesta(reto.tipo, reto.opciones.length, enviada);
  if (errorForma) {
    res.status(400).json({ error: errorForma, campos: { respuesta: errorForma } });
    return;
  }

  const correcta = esRespuestaCorrecta(reto.tipo, reto.respuesta, enviada as Respuesta);

  const intento = await supabase.from('intentos_retos').insert({
    user_id: usuario.id,
    reto_id: reto.id,
    respuesta: enviada,
    correcto: correcta,
  });
  if (intento.error) throw intento.error;

  res.json({
    retoId: reto.id,
    nivelId: reto.niveles.id,
    correcta,
    explicacion: correcta ? reto.explicacion_correcta : reto.explicacion_error,
    // La pista solo se manda cuando se equivoca, para el botón "Intentar de nuevo".
    pista: correcta ? null : reto.pista,
  });
});
