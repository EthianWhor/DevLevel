import { pedir } from './cliente';
import type { ResultadoNivel } from './tipos';

export function completarNivel(nivelId: number, token: string) {
  return pedir<ResultadoNivel>(`/niveles/${nivelId}/completar`, {
    metodo: 'POST',
    token,
  });
}
