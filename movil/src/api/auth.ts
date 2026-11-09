import { pedir } from './cliente';
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

export function obtenerMe(token: string) {
  return pedir<RespuestaMe>('/me', { token });
}

export function actualizarMe(token: string, cambios: { nombreHeroe?: string; avatar?: Avatar }) {
  return pedir<RespuestaMe>('/me', { metodo: 'PATCH', cuerpo: cambios, token });
}
