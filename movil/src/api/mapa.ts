import { pedir } from './cliente';
import type { RespuestaMapa } from './tipos';

export function obtenerMapa(token: string) {
  return pedir<RespuestaMapa>('/mapa', { token });
}
