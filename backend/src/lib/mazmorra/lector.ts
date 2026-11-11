// Lector del pseudocódigo de las mazmorras: convierte el texto que arma o
// escribe el jugador en una lista de instrucciones, o explica el primer error
// con su número de línea. Este archivo existe igual en backend y app.
import type { Accion, Condicion, ErrorLectura, Instruccion, Lectura, Sensor, Valor } from './tipos';

const ACCIONES_BASICAS: Accion[] = [
  'adelante',
  'girar_izquierda',
  'girar_derecha',
  'saltar',
  'atacar',
  'recoger',
];

// Acciones que solo existen con un objeto mítico equipado.
export const ACCIONES_MITICAS: Record<string, string> = {
  invocar_rayo: 'el Rayo de Zeus',
  volar: 'las Sandalias de Hermes',
  atravesar: 'la Llave Maestra',
};

const SENSORES: Sensor[] = ['hay_muro', 'hay_pincho', 'hay_enemigo', 'hay_moneda', 'en_salida'];

const NOMBRE = '([a-z_][a-z0-9_]*)';

type Bloque =
  | { tipo: 'raiz'; destino: Instruccion[] }
  | { tipo: 'repetir' | 'mientras' | 'funcion'; linea: number; destino: Instruccion[] }
  | { tipo: 'si'; linea: number; destino: Instruccion[]; nodo: Extract<Instruccion, { tipo: 'si' }>; enSino: boolean };

const ETIQUETA: Record<string, string> = {
  repetir: 'REPETIR',
  mientras: 'MIENTRAS',
  si: 'SI',
  funcion: 'FUNCION',
};

// Minúsculas, sin tildes y con un solo espacio entre palabras.
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s*\(\s*\)/g, '()')
    .replace(/\s*=\s*/g, ' = ')
    .trim();
}

function distancia(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return d[a.length][b.length];
}

function parecida(nombre: string): string | null {
  const candidatos: string[] = ACCIONES_BASICAS;
  let mejor: string | null = null;
  let mejorDist = 3;
  for (const c of candidatos) {
    const dist = distancia(nombre, c);
    if (dist < mejorDist) {
      mejor = c;
      mejorDist = dist;
    }
  }
  // Sinónimos comunes que no se parecen por letras.
  if (!mejor && ['avanzar', 'caminar', 'mover', 'moverse', 'seguir'].includes(nombre)) mejor = 'adelante';
  if (!mejor && ['golpear', 'pegar', 'luchar'].includes(nombre)) mejor = 'atacar';
  if (!mejor && ['tomar', 'agarrar', 'coger'].includes(nombre)) mejor = 'recoger';
  return mejor;
}

export function leerPrograma(texto: string, accionesMiticas: ReadonlySet<Accion> = new Set()): Lectura {
  const raiz: Instruccion[] = [];
  const pila: Bloque[] = [{ tipo: 'raiz', destino: raiz }];
  const variables = new Set<string>();
  const funciones = new Set<string>();
  let instrucciones = 0;

  const fallo = (linea: number, mensaje: string): Lectura => ({
    ok: false,
    error: { linea, mensaje: `Línea ${linea}: ${mensaje}` } as ErrorLectura,
  });

  const leerValor = (crudo: string, linea: number): Valor | ErrorLectura => {
    if (/^\d+$/.test(crudo)) {
      const numero = Number(crudo);
      if (numero > 99) return { linea, mensaje: `Línea ${linea}: el número debe estar entre 0 y 99` };
      return { numero };
    }
    if (new RegExp(`^${NOMBRE}$`).test(crudo)) {
      if (!variables.has(crudo)) {
        return { linea, mensaje: `Línea ${linea}: la variable '${crudo}' no tiene valor; primero escribe ${crudo} = 3` };
      }
      return { variable: crudo };
    }
    return { linea, mensaje: `Línea ${linea}: '${crudo}' debe ser un número o el nombre de una variable` };
  };

  const leerCondicion = (crudo: string, linea: number): Condicion | ErrorLectura => {
    const m = /^(no )?([a-z_]+)$/.exec(crudo);
    const sensor = m?.[2] as Sensor | undefined;
    if (!m || !sensor || !SENSORES.includes(sensor)) {
      return {
        linea,
        mensaje: `Línea ${linea}: no conozco la condición '${m?.[2] ?? crudo}'. Usa: ${SENSORES.join(', ')}`,
      };
    }
    return { sensor, negada: Boolean(m[1]) };
  };

  const esError = (v: unknown): v is ErrorLectura => typeof v === 'object' && v !== null && 'mensaje' in v;

  const lineas = texto.split(/\r?\n/);
  for (let i = 0; i < lineas.length; i++) {
    const linea = i + 1;
    const sinComentario = lineas[i].split('//')[0];
    const l = normalizar(sinComentario);
    if (l === '') continue;

    const tope = pila[pila.length - 1];
    const destino = tope.destino;
    let m: RegExpExecArray | null;

    if (l === 'fin') {
      if (tope.tipo === 'raiz') return fallo(linea, 'sobra este FIN');
      pila.pop();
      continue;
    }

    if (l === 'sino') {
      if (tope.tipo !== 'si' || tope.enSino) return fallo(linea, 'este SINO no tiene un SI antes');
      tope.enSino = true;
      tope.destino = tope.nodo.sino;
      continue;
    }

    if ((m = /^repetir (.+) veces$/.exec(l))) {
      const veces = leerValor(m[1], linea);
      if (esError(veces)) return { ok: false, error: veces };
      const nodo: Instruccion = { tipo: 'repetir', veces, cuerpo: [], linea };
      destino.push(nodo);
      instrucciones++;
      pila.push({ tipo: 'repetir', linea, destino: nodo.cuerpo });
      continue;
    }
    if (l.startsWith('repetir')) return fallo(linea, 'REPETIR se escribe así: REPETIR 3 VECES');

    if ((m = /^si (.+) entonces$/.exec(l))) {
      const condicion = leerCondicion(m[1], linea);
      if (esError(condicion)) return { ok: false, error: condicion };
      const nodo: Extract<Instruccion, { tipo: 'si' }> = { tipo: 'si', condicion, entonces: [], sino: [], linea };
      destino.push(nodo);
      instrucciones++;
      pila.push({ tipo: 'si', linea, destino: nodo.entonces, nodo, enSino: false });
      continue;
    }
    if (/^si\b/.test(l)) return fallo(linea, 'SI se escribe así: SI hay_muro ENTONCES');

    if ((m = /^mientras (.+) hacer$/.exec(l))) {
      const condicion = leerCondicion(m[1], linea);
      if (esError(condicion)) return { ok: false, error: condicion };
      const nodo: Instruccion = { tipo: 'mientras', condicion, cuerpo: [], linea };
      destino.push(nodo);
      instrucciones++;
      pila.push({ tipo: 'mientras', linea, destino: nodo.cuerpo });
      continue;
    }
    if (l.startsWith('mientras')) return fallo(linea, 'MIENTRAS se escribe así: MIENTRAS NO en_salida HACER');

    if ((m = new RegExp(`^funcion ${NOMBRE}\\(\\)$`).exec(l))) {
      if (tope.tipo !== 'raiz') return fallo(linea, 'las funciones se crean fuera de otros bloques');
      const nombre = m[1];
      if ((ACCIONES_BASICAS as string[]).includes(nombre) || nombre in ACCIONES_MITICAS) {
        return fallo(linea, `'${nombre}' ya es una instrucción; usa otro nombre para tu función`);
      }
      funciones.add(nombre);
      const nodo: Instruccion = { tipo: 'funcion', nombre, cuerpo: [], linea };
      destino.push(nodo);
      instrucciones++;
      pila.push({ tipo: 'funcion', linea, destino: nodo.cuerpo });
      continue;
    }
    if (l.startsWith('funcion')) return fallo(linea, 'FUNCION se escribe así: FUNCION esquivar()');

    if ((m = new RegExp(`^${NOMBRE} = (\\d+)$`).exec(l))) {
      const valor = Number(m[2]);
      if (valor > 99) return fallo(linea, 'el número debe estar entre 0 y 99');
      variables.add(m[1]);
      destino.push({ tipo: 'asignar', variable: m[1], valor, linea });
      instrucciones++;
      continue;
    }

    if ((m = new RegExp(`^${NOMBRE}\\(\\)$`).exec(l))) {
      const nombre = m[1];
      if ((ACCIONES_BASICAS as string[]).includes(nombre)) {
        destino.push({ tipo: 'accion', accion: nombre as Accion, linea });
        instrucciones++;
        continue;
      }
      if (nombre in ACCIONES_MITICAS) {
        if (!accionesMiticas.has(nombre as Accion)) {
          return fallo(linea, `no tienes equipado ${ACCIONES_MITICAS[nombre]} para usar ${nombre}()`);
        }
        destino.push({ tipo: 'accion', accion: nombre as Accion, linea });
        instrucciones++;
        continue;
      }
      if (funciones.has(nombre)) {
        destino.push({ tipo: 'llamada', nombre, linea });
        instrucciones++;
        continue;
      }
      const sugerencia = parecida(nombre);
      if (sugerencia) return fallo(linea, `no conozco la instrucción '${nombre}()'. ¿Quisiste decir '${sugerencia}()'?`);
      return fallo(linea, `no existe la función '${nombre}'. Créala antes con FUNCION ${nombre}()`);
    }

    if (new RegExp(`^${NOMBRE}$`).test(l) && ((ACCIONES_BASICAS as string[]).includes(l) || funciones.has(l))) {
      return fallo(linea, `falta () después de '${l}'. Escribe ${l}()`);
    }

    return fallo(linea, 'no entiendo esta línea. Revisa cómo se escribe cada instrucción');
  }

  if (pila.length > 1) {
    const abierto = pila[pila.length - 1] as Exclude<Bloque, { tipo: 'raiz' }>;
    return fallo(abierto.linea, `falta FIN para cerrar el ${ETIQUETA[abierto.tipo]}`);
  }

  return { ok: true, programa: raiz, instrucciones };
}
