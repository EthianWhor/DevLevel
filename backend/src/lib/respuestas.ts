// Revisión de respuestas. Formato de "respuesta" según el tipo de reto
// (el mismo de schema.sql y seed.sql):
//   opcion_multiple -> índice de la opción elegida, por ejemplo 1
//   completar       -> índice de la palabra elegida, por ejemplo 0
//   ordenar         -> índices de las opciones en el orden elegido, por ejemplo [2,0,1]

export type TipoReto = 'opcion_multiple' | 'ordenar' | 'completar';
export type Respuesta = number | number[];

// Devuelve un mensaje si la respuesta no tiene la forma que pide el reto, o null si está bien formada.
export function validarFormaRespuesta(
  tipo: TipoReto,
  totalOpciones: number,
  respuesta: unknown,
): string | null {
  const esIndice = (valor: unknown) =>
    Number.isInteger(valor) && (valor as number) >= 0 && (valor as number) < totalOpciones;

  if (tipo === 'ordenar') {
    if (!Array.isArray(respuesta) || respuesta.length !== totalOpciones) {
      return `La respuesta debe ser una lista con el orden de las ${totalOpciones} opciones`;
    }
    if (!respuesta.every(esIndice) || new Set(respuesta).size !== totalOpciones) {
      return 'La respuesta debe usar cada opción una sola vez';
    }
    return null;
  }

  if (!esIndice(respuesta)) {
    return `La respuesta debe ser el número de una opción entre 0 y ${totalOpciones - 1}`;
  }
  return null;
}

export function esRespuestaCorrecta(tipo: TipoReto, correcta: unknown, enviada: Respuesta): boolean {
  if (tipo === 'ordenar') {
    return (
      Array.isArray(correcta) &&
      Array.isArray(enviada) &&
      correcta.length === enviada.length &&
      correcta.every((valor, i) => valor === enviada[i])
    );
  }
  return correcta === enviada;
}
