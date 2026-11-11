import { pedir } from './cliente';
import type { RespuestaInventario } from './tipos';

export function obtenerInventario(token: string) {
  return pedir<RespuestaInventario>('/inventario', { token });
}
