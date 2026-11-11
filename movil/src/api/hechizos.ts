import { pedir } from './cliente';
import type { RespuestaHechizos } from './tipos';

export function obtenerHechizos(token: string) {
  return pedir<RespuestaHechizos>('/hechizos', { token });
}
