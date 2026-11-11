import { pedir } from './cliente';
import type { PistaAvanzada, RespuestaReto, ResultadoMazmorra, ResultadoReto } from './tipos';

export function responderReto(retoId: number, respuesta: RespuestaReto, token: string) {
  return pedir<ResultadoReto>(`/retos/${retoId}/responder`, {
    metodo: 'POST',
    cuerpo: { respuesta },
    token,
  });
}

// Envía el programa de una mazmorra; el backend lo ejecuta y decide si ganó.
export function responderMazmorra(retoId: number, programa: string, token: string) {
  return pedir<ResultadoMazmorra>(`/retos/${retoId}/responder`, {
    metodo: 'POST',
    cuerpo: { programa },
    token,
  });
}

export function obtenerPistaAvanzada(retoId: number, token: string) {
  return pedir<PistaAvanzada>(`/retos/${retoId}/pista-avanzada`, { token });
}
