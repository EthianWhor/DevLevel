import { Router, type Response } from 'express';
import type { Session } from '@supabase/supabase-js';
import { supabase, crearClienteSesion } from '../lib/supabase';
import { obtenerOCrearPerfil } from '../lib/perfil';
import { juntarErrores, validarCorreo, validarPassword } from '../lib/validacion';

export const authRouter = Router();

// Respuesta común de registro, login y renovación del token.
async function responderSesion(res: Response, sesion: Session, status = 200) {
  const perfil = await obtenerOCrearPerfil(sesion.user.id);

  res.status(status).json({
    sesion: {
      token: sesion.access_token,
      refreshToken: sesion.refresh_token,
      expiraEn: sesion.expires_at ?? null, // segundos desde 1970 (Unix)
    },
    usuario: {
      id: sesion.user.id,
      email: sesion.user.email ?? null,
    },
    perfil,
  });
}

function leerCredenciales(body: unknown) {
  const datos = (body ?? {}) as { email?: unknown; password?: unknown };
  const errores = juntarErrores({
    email: validarCorreo(datos.email),
    password: validarPassword(datos.password),
  });

  if (errores) return { errores } as const;

  return {
    email: (datos.email as string).trim().toLowerCase(),
    password: datos.password as string,
  } as const;
}

// POST /auth/register
// Crea la cuenta en Supabase Auth, crea su perfil y devuelve la sesión iniciada.
authRouter.post('/register', async (req, res) => {
  const credenciales = leerCredenciales(req.body);
  if ('errores' in credenciales) {
    res.status(400).json({ error: 'Revisa los datos del formulario', campos: credenciales.errores });
    return;
  }

  const { email, password } = credenciales;

  // email_confirm: true marca el correo como confirmado para no depender
  // del envío de correos de Supabase (que en el plan gratis es muy limitado).
  const creado = await supabase.auth.admin.createUser({ email, password, email_confirm: true });

  if (creado.error) {
    if (creado.error.code === 'email_exists' || creado.error.code === 'user_already_exists') {
      res.status(409).json({
        error: 'Ya existe una cuenta con este correo',
        campos: { email: 'Ya existe una cuenta con este correo' },
      });
      return;
    }
    if (creado.error.code === 'weak_password') {
      res.status(400).json({
        error: 'La contraseña es muy débil',
        campos: { password: 'La contraseña es muy débil, usa una más larga o con más variedad' },
      });
      return;
    }
    throw creado.error;
  }

  const userId = creado.data.user.id;

  const perfil = await supabase.from('profiles').insert({ id: userId });
  if (perfil.error) {
    // Sin perfil la cuenta no sirve: se borra para que pueda volver a registrarse.
    await supabase.auth.admin.deleteUser(userId);
    throw perfil.error;
  }

  const sesion = await crearClienteSesion().auth.signInWithPassword({ email, password });
  if (sesion.error) throw sesion.error;

  await responderSesion(res, sesion.data.session, 201);
});

// POST /auth/login
// Revisa el correo y la contraseña y devuelve el token de sesión.
authRouter.post('/login', async (req, res) => {
  const credenciales = leerCredenciales(req.body);
  if ('errores' in credenciales) {
    res.status(400).json({ error: 'Revisa los datos del formulario', campos: credenciales.errores });
    return;
  }

  const { email, password } = credenciales;
  const { data, error } = await crearClienteSesion().auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === 'invalid_credentials' || error.status === 400) {
      // El mismo mensaje para correo y contraseña: no se revela si el correo existe.
      res.status(401).json({ error: 'Correo o contraseña incorrectos' });
      return;
    }
    throw error;
  }

  await responderSesion(res, data.session);
});

// POST /auth/refresh
// El token dura una hora. La app manda el refreshToken para obtener uno nuevo
// sin pedirle otra vez la contraseña al usuario.
authRouter.post('/refresh', async (req, res) => {
  const refreshToken = (req.body ?? {}).refreshToken;
  if (typeof refreshToken !== 'string' || refreshToken === '') {
    res.status(400).json({ error: 'Falta el refreshToken' });
    return;
  }

  const { data, error } = await crearClienteSesion().auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data.session) {
    res.status(401).json({ error: 'La sesión expiró, vuelve a iniciar sesión' });
    return;
  }

  await responderSesion(res, data.session);
});
