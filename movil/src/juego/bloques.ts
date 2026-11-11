// Modelo del editor de bloques (solo en la app). Los bloques se convierten en
// el mismo texto del lenguaje que se escribe a mano, así el backend recibe un
// único formato. No usa React: se prueba desde backend/test/bloques.test.ts.
import type { Condicion } from './tipos';

export type Bloque =
  | { id: string; tipo: 'accion'; accion: string }
  | { id: string; tipo: 'asignar'; variable: string; valor: number }
  | { id: string; tipo: 'repetir'; veces: number | string; cuerpo: Bloque[] }
  | { id: string; tipo: 'mientras'; condicion: Condicion; cuerpo: Bloque[] }
  | { id: string; tipo: 'si'; condicion: Condicion; entonces: Bloque[]; sino: Bloque[] | null };

export type Rama = 'cuerpo' | 'entonces' | 'sino';

// Dónde se agregan los bloques nuevos: al final del programa (null) o dentro
// de una rama de un REPETIR / MIENTRAS / SI.
export type Destino = { id: string; rama: Rama } | null;

const SANGRIA = '  ';

const textoCondicion = (c: Condicion) => `${c.negada ? 'NO ' : ''}${c.sensor}`;

export function bloquesATexto(bloques: Bloque[]): { texto: string; lineaPorId: Map<string, number> } {
  const lineas: string[] = [];
  const lineaPorId = new Map<string, number>();

  const escribir = (lista: Bloque[], nivel: number) => {
    const s = SANGRIA.repeat(nivel);
    for (const b of lista) {
      lineaPorId.set(b.id, lineas.length + 1);
      switch (b.tipo) {
        case 'accion':
          lineas.push(`${s}${b.accion}()`);
          break;
        case 'asignar':
          lineas.push(`${s}${b.variable} = ${b.valor}`);
          break;
        case 'repetir':
          lineas.push(`${s}REPETIR ${b.veces} VECES`);
          escribir(b.cuerpo, nivel + 1);
          lineas.push(`${s}FIN`);
          break;
        case 'mientras':
          lineas.push(`${s}MIENTRAS ${textoCondicion(b.condicion)} HACER`);
          escribir(b.cuerpo, nivel + 1);
          lineas.push(`${s}FIN`);
          break;
        case 'si':
          lineas.push(`${s}SI ${textoCondicion(b.condicion)} ENTONCES`);
          escribir(b.entonces, nivel + 1);
          if (b.sino) {
            lineas.push(`${s}SINO`);
            escribir(b.sino, nivel + 1);
          }
          lineas.push(`${s}FIN`);
          break;
      }
    }
  };

  escribir(bloques, 0);
  return { texto: lineas.join('\n'), lineaPorId };
}

// Aplica una función a la lista que contiene al bloque buscado (en cualquier
// nivel) y devuelve una copia nueva del programa.
function enLista(bloques: Bloque[], cambiar: (lista: Bloque[]) => Bloque[] | null): Bloque[] {
  const propia = cambiar(bloques);
  if (propia) return propia;
  return bloques.map((b) => {
    switch (b.tipo) {
      case 'repetir':
      case 'mientras':
        return { ...b, cuerpo: enLista(b.cuerpo, cambiar) };
      case 'si':
        return { ...b, entonces: enLista(b.entonces, cambiar), sino: b.sino ? enLista(b.sino, cambiar) : null };
      default:
        return b;
    }
  });
}

export function insertar(bloques: Bloque[], destino: Destino, nuevo: Bloque): Bloque[] {
  if (!destino) return [...bloques, nuevo];
  return actualizar(bloques, destino.id, (b) => {
    if (destino.rama === 'cuerpo' && (b.tipo === 'repetir' || b.tipo === 'mientras')) {
      return { ...b, cuerpo: [...b.cuerpo, nuevo] };
    }
    if (b.tipo === 'si' && destino.rama === 'entonces') return { ...b, entonces: [...b.entonces, nuevo] };
    if (b.tipo === 'si' && destino.rama === 'sino') return { ...b, sino: [...(b.sino ?? []), nuevo] };
    return b;
  });
}

// Inserta el bloque nuevo justo después de otro, en la misma lista.
export function insertarDespues(bloques: Bloque[], idReferencia: string, nuevo: Bloque): Bloque[] {
  return enLista(bloques, (lista) => {
    const i = lista.findIndex((b) => b.id === idReferencia);
    if (i < 0) return null;
    return [...lista.slice(0, i + 1), nuevo, ...lista.slice(i + 1)];
  });
}

export function quitar(bloques: Bloque[], id: string): Bloque[] {
  return enLista(bloques, (lista) => (lista.some((b) => b.id === id) ? lista.filter((b) => b.id !== id) : null));
}

export function mover(bloques: Bloque[], id: string, delta: -1 | 1): Bloque[] {
  return enLista(bloques, (lista) => {
    const i = lista.findIndex((b) => b.id === id);
    if (i < 0) return null;
    const j = i + delta;
    if (j < 0 || j >= lista.length) return lista;
    const copia = [...lista];
    [copia[i], copia[j]] = [copia[j], copia[i]];
    return copia;
  });
}

export function actualizar(bloques: Bloque[], id: string, cambio: (b: Bloque) => Bloque): Bloque[] {
  return enLista(bloques, (lista) =>
    lista.some((b) => b.id === id) ? lista.map((b) => (b.id === id ? cambio(b) : b)) : null,
  );
}

export function buscar(bloques: Bloque[], id: string): Bloque | null {
  for (const b of bloques) {
    if (b.id === id) return b;
    const hijos =
      b.tipo === 'repetir' || b.tipo === 'mientras'
        ? b.cuerpo
        : b.tipo === 'si'
          ? [...b.entonces, ...(b.sino ?? [])]
          : [];
    const encontrado = buscar(hijos, id);
    if (encontrado) return encontrado;
  }
  return null;
}

// Variables que ya tienen valor en el programa (para el bloque REPETIR).
export function variablesDe(bloques: Bloque[]): string[] {
  const nombres = new Set<string>();
  const recorrer = (lista: Bloque[]) => {
    for (const b of lista) {
      if (b.tipo === 'asignar') nombres.add(b.variable);
      if (b.tipo === 'repetir' || b.tipo === 'mientras') recorrer(b.cuerpo);
      if (b.tipo === 'si') {
        recorrer(b.entonces);
        recorrer(b.sino ?? []);
      }
    }
  };
  recorrer(bloques);
  return [...nombres];
}

let contador = 0;
export const nuevoId = () => `b${Date.now().toString(36)}${(contador++).toString(36)}`;
