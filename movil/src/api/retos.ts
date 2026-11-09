import { pedir } from './cliente';
import type { RespuestaReto, ResultadoReto } from './tipos';

export function responderReto(retoId: number, respuesta: RespuestaReto, token: string) {
  return pedir<ResultadoReto>(`/retos/${retoId}/responder`, {
    metodo: 'POST',
    cuerpo: { respuesta },
    token,
  });
}
