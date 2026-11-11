import { pedir } from './cliente';
import type { Equipo } from '@/juego/tipos';
import type { Avatar, RespuestaMe, RespuestaSesion } from './tipos';

export function registrar(email: string, password: string) {
  return pedir<RespuestaSesion>('/auth/register', { metodo: 'POST', cuerpo: { email, password } });
}

export function iniciarSesion(email: string, password: string) {
  return pedir<RespuestaSesion>('/auth/login', { metodo: 'POST', cuerpo: { email, password } });
}

export function renovarSesion(refreshToken: string) {
  return pedir<RespuestaSesion>('/auth/refresh', { metodo: 'POST', cuerpo: { refreshToken } });
}

// Envía al correo un código para cambiar la contraseña.
export function pedirCodigoRecuperacion(email: string) {
  return pedir<{ mensaje: string }>('/auth/recuperar', { metodo: 'POST', cuerpo: { email } });
}

// Cambia la contraseña con el código del correo y devuelve la sesión iniciada.
export function restablecerContrasena(email: string, codigo: string, password: string) {
  return pedir<RespuestaSesion>('/auth/restablecer', {
    metodo: 'POST',
    cuerpo: { email, codigo, password },
  });
}

export function obtenerMe(token: string) {
  return pedir<RespuestaMe>('/me', { token });
}

export function actualizarMe(
  token: string,
  cambios: { nombreHeroe?: string; avatar?: Avatar; equipo?: Partial<Equipo> },
) {
  return pedir<RespuestaMe>('/me', { metodo: 'PATCH', cuerpo: cambios, token });
}
