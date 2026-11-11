import { Router } from 'express';
import { equipoValido, leerInventario } from '../lib/equipo';
import { OBJETOS } from '../lib/mazmorra/objetos';
import { requiereSesion, usuarioDe } from '../middleware/requiere-sesion';

export const inventarioRouter = Router();

// GET /inventario (requiere sesión)
// Objetos que ganó el jugador (normales y míticos) y lo que tiene equipado.
inventarioRouter.get('/', requiereSesion, async (req, res) => {
  const usuario = usuarioDe(req);
  const [filas, equipo] = await Promise.all([leerInventario(usuario.id), equipoValido(usuario.id)]);

  res.json({
    objetos: filas
      .filter((f) => OBJETOS[f.objeto_id])
      .map((f) => ({ ...OBJETOS[f.objeto_id], nivelId: f.nivel_id, obtenidoAt: f.obtenido_at })),
    equipo,
  });
});
