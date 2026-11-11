import { Router, type Response } from 'express';
import { supabase } from '../lib/supabase';
import { nivelDesbloqueado } from '../lib/desbloqueo';
import { equipoValido } from '../lib/equipo';
import { ejecutarTexto } from '../lib/mazmorra/simulador';
import type { Mazmorra } from '../lib/mazmorra/tipos';
import { esRespuestaCorrecta, validarFormaRespuesta, type Respuesta, type TipoReto } from '../lib/respuestas';
import { requiereSesion, usuarioDe } from '../middleware/requiere-sesion';

export const retosRouter = Router();

type FilaReto = {
  id: number;
  tipo: TipoReto | 'mazmorra';
  opciones: unknown;
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

  if (reto.tipo === 'mazmorra') {
    await responderMazmorra(req.body, usuario.id, reto, reto.niveles.id, res);
    return;
  }

  const enviada = (req.body ?? {}).respuesta as unknown;
  const opciones = reto.opciones as string[];
  const errorForma = validarFormaRespuesta(reto.tipo, opciones.length, enviada);
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

const MAX_PROGRAMA = 5000;
const SALTO = '\n';

// Mazmorra: el backend ejecuta el programa con el equipo guardado del jugador
// (verificado contra su inventario) y decide si ganó. La app solo anima.
async function responderMazmorra(
  cuerpo: unknown,
  userId: string,
  reto: FilaReto,
  nivelId: number,
  res: Response,
) {
  const programa = ((cuerpo ?? {}) as { programa?: unknown }).programa;
  if (typeof programa !== 'string' || programa.length > MAX_PROGRAMA) {
    const mensaje = 'Envía tu hechizo como texto (máximo 5000 caracteres)';
    res.status(400).json({ error: mensaje, campos: { programa: mensaje } });
    return;
  }

  const mazmorra = reto.opciones as Mazmorra;
  const equipo = await equipoValido(userId);
  const { lectura, resultado } = ejecutarTexto(mazmorra, programa, equipo);
  const correcta = resultado?.gano ?? false;

  const detalle = resultado
    ? {
        gano: resultado.gano,
        motivo: resultado.motivo,
        vida: resultado.vida,
        vidaMax: resultado.vidaMax,
        energiaRestante: resultado.energiaRestante,
        monedas: resultado.monedas,
        monedasTotales: resultado.monedasTotales,
        instrucciones: resultado.instrucciones,
        choques: resultado.choques,
        enemigosDerrotados: resultado.enemigosDerrotados,
        objetivosCumplidos: resultado.objetivosCumplidos,
        equipo,
      }
    : { error: lectura.ok ? null : lectura.error };

  const intento = await supabase.from('intentos_retos').insert({
    user_id: userId,
    reto_id: reto.id,
    respuesta: programa,
    correcto: correcta,
    detalle,
  });
  if (intento.error) throw intento.error;

  res.json({
    retoId: reto.id,
    nivelId,
    correcta,
    motivo: resultado?.motivo ?? null,
    error: lectura.ok ? null : lectura.error,
    objetivosCumplidos: resultado?.objetivosCumplidos ?? mazmorra.objetivosExtra.map(() => false),
    resultado: resultado
      ? {
          vida: resultado.vida,
          vidaMax: resultado.vidaMax,
          energiaRestante: resultado.energiaRestante,
          monedas: resultado.monedas,
          monedasTotales: resultado.monedasTotales,
          instrucciones: resultado.instrucciones,
        }
      : null,
    explicacion: correcta ? reto.explicacion_correcta : reto.explicacion_error,
    pista: correcta ? null : reto.pista,
  });
}

// GET /retos/:id/pista-avanzada (requiere sesión)
// Con el Pergamino del sabio equipado: las primeras 2 líneas de la solución.
// Con el Ojo de Odín: la solución completa. Sin ninguno: 403.
retosRouter.get('/:id/pista-avanzada', requiereSesion, async (req, res) => {
  const usuario = usuarioDe(req);
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: 'El id del reto no es válido' });
    return;
  }

  const { data: reto, error } = await supabase
    .from('retos')
    .select('id, tipo, respuesta, niveles (id, orden)')
    .eq('id', id)
    .maybeSingle<{ id: number; tipo: string; respuesta: unknown; niveles: { id: number; orden: number } | null }>();
  if (error) throw error;
  if (!reto || !reto.niveles || reto.tipo !== 'mazmorra') {
    res.status(404).json({ error: 'La mazmorra no existe' });
    return;
  }
  if (!(await nivelDesbloqueado(usuario.id, reto.niveles.orden))) {
    res.status(403).json({ error: 'Este nivel todavía está bloqueado' });
    return;
  }

  const { amuleto } = await equipoValido(usuario.id);
  const solucion = ((reto.respuesta ?? {}) as { solucion?: string }).solucion ?? '';
  const lineas = solucion.split(SALTO).filter((l) => l.trim() !== '');

  if (amuleto === 'ojo_odin') {
    res.json({ lineas: lineas.join(SALTO), completa: true });
    return;
  }
  if (amuleto === 'pergamino_sabio') {
    res.json({ lineas: lineas.slice(0, 2).join(SALTO), completa: false });
    return;
  }
  res.status(403).json({ error: 'Necesitas equipar el Pergamino del sabio o el Ojo de Odín' });
});
