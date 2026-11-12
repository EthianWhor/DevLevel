import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { nivelDesbloqueado } from '../lib/desbloqueo';
import { COLUMNAS_PERFIL, aPerfil, obtenerOCrearPerfil, type FilaPerfil } from '../lib/perfil';
import {
  XP_POR_NIVEL,
  calcularEstrellas,
  calcularRacha,
  fechaLocal,
  nivelPorXp,
  resumirIntentos,
} from '../lib/progreso';
import { azar } from '../lib/azar';
import { equipoValido, leerInventario } from '../lib/equipo';
import { OBJETOS, estadisticas, sortearObjeto } from '../lib/mazmorra/objetos';
import type { Equipo, Mazmorra, Objeto } from '../lib/mazmorra/tipos';
import { requiereSesion, usuarioDe } from '../middleware/requiere-sesion';

export const completarRouter = Router();

type FilaNivel = {
  id: number;
  orden: number;
  titulo: string;
  hechizo_nombre: string;
  hechizo_descripcion: string;
  xp_recompensa: number;
};

// POST /niveles/:id/completar (requiere sesión)
// Se llama después de acertar los retos del nivel. Calcula las estrellas con
// los errores cometidos, suma XP (solo la primera vez), actualiza la racha y
// el nivel del jugador, y guarda el progreso.
completarRouter.post('/:id/completar', requiereSesion, async (req, res) => {
  const usuario = usuarioDe(req);

  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: 'El id del nivel no es válido' });
    return;
  }

  const { data: nivel, error: errorNivel } = await supabase
    .from('niveles')
    .select('id, orden, titulo, hechizo_nombre, hechizo_descripcion, xp_recompensa')
    .eq('id', id)
    .maybeSingle<FilaNivel>();

  if (errorNivel) throw errorNivel;
  if (!nivel) {
    res.status(404).json({ error: 'El nivel no existe' });
    return;
  }

  if (!(await nivelDesbloqueado(usuario.id, nivel.orden))) {
    res.status(403).json({ error: 'Este nivel todavía está bloqueado' });
    return;
  }

  const [retos, progresoPrevio] = await Promise.all([
    supabase.from('retos').select('id, tipo, opciones').eq('nivel_id', id).order('orden'),
    supabase
      .from('progreso_niveles')
      .select('estrellas, completado_at')
      .eq('user_id', usuario.id)
      .eq('nivel_id', id)
      .maybeSingle<{ estrellas: number; completado_at: string }>(),
  ]);
  if (retos.error) throw retos.error;
  if (progresoPrevio.error) throw progresoPrevio.error;

  const filasRetos = retos.data as { id: number; tipo: string; opciones: unknown }[];
  const retoIds = filasRetos.map((r) => r.id);
  const primeraVez = progresoPrevio.data === null;

  if (retoIds.length === 0) {
    res.status(409).json({ error: 'Este nivel todavía no tiene retos', retosPendientes: [] });
    return;
  }

  // Si el nivel ya se había completado, solo cuentan los intentos de esta nueva
  // partida (los posteriores a la última vez que se completó).
  let consultaIntentos = supabase
    .from('intentos_retos')
    .select('reto_id, correcto, detalle')
    .eq('user_id', usuario.id)
    .in('reto_id', retoIds);
  if (progresoPrevio.data) {
    consultaIntentos = consultaIntentos.gt('created_at', progresoPrevio.data.completado_at);
  }
  const intentos = await consultaIntentos.order('created_at');
  if (intentos.error) throw intentos.error;
  const filasIntentos = intentos.data as { reto_id: number; correcto: boolean; detalle: unknown }[];

  const mazmorra = filasRetos.find((r) => r.tipo === 'mazmorra');
  let errores: number;
  let estrellas: number;
  let extrasCompletos = false;

  if (mazmorra) {
    // Mazmorra: cuenta el mejor intento ganador. Estrellas = 1 por ganar
    // + 1 por cada objetivo extra cumplido en ese intento.
    const ganadores = filasIntentos.filter((i) => i.correcto);
    if (ganadores.length === 0) {
      res.status(409).json({
        error: 'Gana la mazmorra antes de completar el nivel',
        retosPendientes: [mazmorra.id],
      });
      return;
    }
    const cumplidos = (i: { detalle: unknown }) =>
      (((i.detalle ?? {}) as { objetivosCumplidos?: boolean[] }).objetivosCumplidos ?? []).filter(Boolean).length;
    const mejor = Math.max(...ganadores.map(cumplidos));
    const totalExtras = ((mazmorra.opciones ?? {}) as Mazmorra).objetivosExtra?.length ?? 0;
    estrellas = Math.min(3, 1 + mejor);
    extrasCompletos = totalExtras > 0 && mejor >= totalExtras;
    errores = filasIntentos.filter((i) => !i.correcto).length;
  } else {
    const resumen = resumirIntentos(retoIds, filasIntentos);
    if (resumen.faltantes.length > 0) {
      res.status(409).json({
        error: 'Responde correctamente todos los retos del nivel antes de completarlo',
        retosPendientes: resumen.faltantes,
      });
      return;
    }
    errores = resumen.errores;
    estrellas = calcularEstrellas(errores);
  }

  const mejoresEstrellas = Math.max(estrellas, progresoPrevio.data?.estrellas ?? 0);

  // XP solo la primera vez: repetir un nivel sirve para mejorar las estrellas,
  // no para acumular XP sin límite. La Corona del Rey Lógico da +50 %.
  const equipo = await equipoValido(usuario.id);
  const xpGanada = primeraVez
    ? Math.round(nivel.xp_recompensa * (1 + estadisticas(equipo).xpExtra))
    : 0;

  // Objeto de la mazmorra: se gana al cumplir todos los extras si todavía no
  // se tiene. Con suerte sale un mítico en su lugar.
  let objetoGanado: (Objeto & { nivelId: number; equipado: boolean }) | null = null;
  // Si el espacio del objeto está vacío, el objeto nuevo se equipa solo.
  let equipoNuevo: Equipo | null = null;
  if (mazmorra && extrasCompletos) {
    const objetoNormal = (mazmorra.opciones as Mazmorra).objeto;
    const inventario = await leerInventario(usuario.id);
    const poseidos = new Set(inventario.map((f) => f.objeto_id));
    if (!poseidos.has(objetoNormal)) {
      const miticos = inventario.filter((f) => f.mitico).map((f) => f.objeto_id);
      const ganado = sortearObjeto(objetoNormal, miticos, azar);
      const objeto = OBJETOS[ganado];
      const insertado = await supabase.from('inventario').insert({
        user_id: usuario.id,
        objeto_id: ganado,
        nivel_id: id,
        mitico: objeto.mitico,
      });
      if (insertado.error) throw insertado.error;
      const equipar = equipo[objeto.espacio] === null;
      if (equipar) equipoNuevo = { ...equipo, [objeto.espacio]: ganado };
      objetoGanado = { ...objeto, nivelId: id, equipado: equipar };
    }
  }

  const perfilAntes = await obtenerOCrearPerfil(usuario.id);
  const hoy = fechaLocal(new Date());
  const { racha, cambio } = calcularRacha(perfilAntes.ultimaActividad, hoy, perfilAntes.rachaActual);

  const xpNueva = perfilAntes.xp + xpGanada;
  const nivelNuevo = nivelPorXp(xpNueva);

  const guardado = await supabase.from('progreso_niveles').upsert(
    {
      user_id: usuario.id,
      nivel_id: id,
      estrellas: mejoresEstrellas,
      completado_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,nivel_id' },
  );
  if (guardado.error) throw guardado.error;

  const { data: filaPerfil, error: errorPerfil } = await supabase
    .from('profiles')
    .update({
      xp: xpNueva,
      nivel: nivelNuevo,
      racha_actual: racha,
      racha_maxima: Math.max(perfilAntes.rachaMaxima, racha),
      ultima_actividad: hoy,
      ...(equipoNuevo ? { equipo: equipoNuevo } : {}),
    })
    .eq('id', usuario.id)
    .select(COLUMNAS_PERFIL)
    .single<FilaPerfil>();
  if (errorPerfil) throw errorPerfil;

  const siguiente = await supabase
    .from('niveles')
    .select('id')
    .gt('orden', nivel.orden)
    .order('orden')
    .limit(1)
    .maybeSingle<{ id: number }>();
  if (siguiente.error) throw siguiente.error;

  const perfil = aPerfil(filaPerfil);

  res.json({
    nivelId: nivel.id,
    primeraVez,
    errores,
    estrellas,
    mejoresEstrellas,
    xpGanada,
    subioDeNivel: nivelNuevo > perfilAntes.nivel,
    nivelAnterior: perfilAntes.nivel,
    nivelNuevo,
    progresoNivel: {
      xpEnNivel: perfil.xp % XP_POR_NIVEL,
      xpPorNivel: XP_POR_NIVEL,
    },
    racha: {
      actual: perfil.rachaActual,
      maxima: perfil.rachaMaxima,
      cambio,
    },
    // El concepto se agrega al Libro de hechizos la primera vez.
    hechizoDesbloqueado: primeraVez
      ? { nombre: nivel.hechizo_nombre, descripcion: nivel.hechizo_descripcion }
      : null,
    siguienteNivelId: siguiente.data?.id ?? null,
    objetoGanado,
    perfil,
  });
});
