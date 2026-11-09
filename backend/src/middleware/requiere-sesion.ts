import type { NextFunction, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

// Middleware para las rutas protegidas.
// Lee el encabezado "Authorization: Bearer <token>", le pregunta a Supabase
// de quién es ese token y deja el usuario en req.usuario.
// Si falta el token o no es válido, responde 401 y la ruta no se ejecuta.
export async function requiereSesion(req: Request, res: Response, next: NextFunction) {
  const encabezado = req.headers.authorization ?? '';
  const [tipo, token] = encabezado.split(' ');

  if (tipo !== 'Bearer' || !token) {
    res.status(401).json({ error: 'Debes iniciar sesión' });
    return;
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    // El token venció o fue alterado: la app debe renovarlo o pedir login.
    res.status(401).json({ error: 'La sesión no es válida o expiró' });
    return;
  }

  req.usuario = { id: data.user.id, email: data.user.email ?? null };
  next();
}

// Para usar dentro de una ruta que ya pasó por requiereSesion.
export function usuarioDe(req: Request) {
  if (!req.usuario) {
    throw new Error('La ruta usa usuarioDe() sin pasar por requiereSesion');
  }
  return req.usuario;
}
