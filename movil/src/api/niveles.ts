import { pedir } from './cliente';
import type { RespuestaNivel } from './tipos';

export function obtenerNivel(id: number, token: string) {
  return pedir<RespuestaNivel>(`/niveles/${id}`, { token });
}