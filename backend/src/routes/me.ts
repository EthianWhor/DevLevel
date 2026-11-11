import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { COLUMNAS_PERFIL, aPerfil, obtenerOCrearPerfil, type FilaPerfil } from '../lib/perfil';
import { AVATARES, esAvatar } from '../lib/avatares';
import { juntarErrores } from '../lib/validacion';
import { ESPACIOS, aEquipo, leerInventario } from '../lib/equipo';
import { OBJETOS } from '../lib/mazmorra/objetos';
import type { Equipo } from '../lib/mazmorra/tipos';
import { requiereSesion, usuarioDe } from '../middleware/requiere-sesion';

export const meRouter = Router();

// Todas las rutas de /me necesitan sesión.
meRouter.use(requiereSesion);

// GET /me
// Devuelve el correo y el perfil de juego del usuario de la sesión.
meRouter.get('/', async (req, res) => {
  const usuario = usuarioDe(req);
  const perfil = await obtenerOCrearPerfil(usuario.id);

  res.json({ usuario, perfil });
});

// PATCH /me
// Cambia el nombre de héroe, el avatar y/o el equipo (arma, armadura, amuleto).
// El equipo solo acepta objetos que el jugador ganó, cada uno en su espacio.
// Cambia el nombre de héroe y/o el avatar. Los demás campos (XP, nivel, racha)
// solo los cambia el backend al completar niveles, nunca la app.
meRouter.patch('/', async (req, res) => {
  const usuario = usuarioDe(req);
  const datos = (req.body ?? {}) as { nombreHeroe?: unknown; avatar?: unknown; equipo?: unknown };

  const cambios: { nombre_heroe?: string; avatar?: string; equipo?: Equipo } = {};
  let errorNombre: string | null = null;
  let errorAvatar: string | null = null;
  let errorEquipo: string | null = null;

  if (datos.nombreHeroe !== undefined) {
    const nombre = typeof datos.nombreHeroe === 'string' ? datos.nombreHeroe.trim() : '';
    if (nombre.length < 2 || nombre.length > 20) {
      errorNombre = 'El nombre de héroe debe tener entre 2 y 20 caracteres';
    } else {
      cambios.nombre_heroe = nombre;
    }
  }

  if (datos.avatar !== undefined) {
    if (esAvatar(datos.avatar)) {
      cambios.avatar = datos.avatar;
    } else {
      errorAvatar = `El avatar debe ser uno de: ${AVATARES.join(', ')}`;
    }
  }

  if (datos.equipo !== undefined) {
    if (typeof datos.equipo !== 'object' || datos.equipo === null || Array.isArray(datos.equipo)) {
      errorEquipo = 'El equipo debe tener arma, armadura y/o amuleto';
    } else {
      const pedido = datos.equipo as Record<string, unknown>;
      const actual = await obtenerOCrearPerfil(usuario.id);
      const poseidos = new Set((await leerInventario(usuario.id)).map((f) => f.objeto_id));
      const nuevo: Equipo = aEquipo(actual.equipo);
      for (const [espacio, id] of Object.entries(pedido)) {
        if (!(ESPACIOS as string[]).includes(espacio)) {
          errorEquipo = `El espacio '${espacio}' no existe; usa arma, armadura o amuleto`;
          break;
        }
        if (id === null) {
          nuevo[espacio as keyof Equipo] = null;
          continue;
        }
        const objeto = typeof id === 'string' ? OBJETOS[id] : undefined;
        if (!objeto || !poseidos.has(objeto.id)) {
          errorEquipo = 'No tienes ese objeto en tu inventario';
          break;
        }
        if (objeto.espacio !== espacio) {
          errorEquipo = `${objeto.nombre} va en el espacio de ${objeto.espacio}`;
          break;
        }
        nuevo[espacio as keyof Equipo] = objeto.id;
      }
      if (!errorEquipo) cambios.equipo = nuevo;
    }
  }

  const errores = juntarErrores({ nombreHeroe: errorNombre, avatar: errorAvatar, equipo: errorEquipo });
  if (errores) {
    res.status(400).json({ error: 'Revisa los datos del formulario', campos: errores });
    return;
  }

  if (Object.keys(cambios).length === 0) {
    res.status(400).json({ error: 'Envía nombreHeroe, avatar y/o equipo para actualizar' });
    return;
  }

  // Asegura que el perfil exista antes de actualizarlo.
  await obtenerOCrearPerfil(usuario.id);

  const { data, error } = await supabase
    .from('profiles')
    .update(cambios)
    .eq('id', usuario.id)
    .select(COLUMNAS_PERFIL)
    .single<FilaPerfil>();

  if (error) throw error;

  res.json({ usuario, perfil: aPerfil(data) });
});
