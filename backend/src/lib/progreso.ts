// Reglas de progreso del juego. Son funciones puras (no tocan la base de datos)
// para poder probarlas solas en las pruebas automáticas.

// Cada 100 XP se sube un nivel de jugador: 0-99 XP = nivel 1, 100-199 = nivel 2...
// Con 15 niveles de 50 XP, completar todo el módulo da 750 XP (nivel 8).
export const XP_POR_NIVEL = 100;

export function nivelPorXp(xp: number): number {
  return Math.floor(Math.max(0, xp) / XP_POR_NIVEL) + 1;
}

// Estrellas según los errores cometidos en el nivel antes de acertar cada reto.
//   0 errores    -> 3 estrellas
//   1 o 2        -> 2 estrellas
//   3 o más      -> 1 estrella
export function calcularEstrellas(errores: number): 1 | 2 | 3 {
  if (errores <= 0) return 3;
  if (errores <= 2) return 2;
  return 1;
}

// Los usuarios están en Colombia: el "día" de la racha se cuenta en hora de Bogotá,
// no en UTC (si no, jugar a las 8 p. m. contaría como el día siguiente).
export const ZONA_HORARIA = 'America/Bogota';

export function fechaLocal(fecha: Date, zona = ZONA_HORARIA): string {
  // en-CA da el formato AAAA-MM-DD, el mismo del tipo date de Postgres.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: zona,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(fecha);
}

// Días de calendario entre dos fechas AAAA-MM-DD (b - a).
export function diasEntre(a: string, b: string): number {
  const MS_DIA = 24 * 60 * 60 * 1000;
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / MS_DIA);
}

export type CambioRacha = 'aumento' | 'igual' | 'reinicio';

// Racha de días seguidos con al menos un nivel completado.
//   - ya jugó hoy           -> la racha no cambia
//   - jugó ayer             -> la racha sube 1
//   - nunca jugó o faltó un día o más -> la racha vuelve a 1
export function calcularRacha(
  ultimaActividad: string | null,
  hoy: string,
  rachaActual: number,
): { racha: number; cambio: CambioRacha } {
  let racha: number;

  if (ultimaActividad === hoy) {
    racha = Math.max(rachaActual, 1);
  } else if (ultimaActividad !== null && diasEntre(ultimaActividad, hoy) === 1) {
    racha = rachaActual + 1;
  } else {
    racha = 1;
  }

  const cambio: CambioRacha =
    racha > rachaActual ? 'aumento' : racha < rachaActual ? 'reinicio' : 'igual';
  return { racha, cambio };
}

type Intento = { reto_id: number; correcto: boolean };

// Recorre los intentos en orden de llegada y, por cada reto, cuenta los errores
// cometidos antes del primer acierto. Los intentos después del acierto no cuentan.
export function resumirIntentos(retoIds: number[], intentos: Intento[]) {
  const acertados = new Set<number>();
  const erroresPorReto = new Map<number, number>(retoIds.map((id) => [id, 0]));

  for (const intento of intentos) {
    if (!erroresPorReto.has(intento.reto_id) || acertados.has(intento.reto_id)) continue;
    if (intento.correcto) {
      acertados.add(intento.reto_id);
    } else {
      erroresPorReto.set(intento.reto_id, (erroresPorReto.get(intento.reto_id) ?? 0) + 1);
    }
  }

  let errores = 0;
  for (const id of acertados) errores += erroresPorReto.get(id) ?? 0;

  return {
    errores,
    faltantes: retoIds.filter((id) => !acertados.has(id)),
  };
}
