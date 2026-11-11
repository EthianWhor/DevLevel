// Fuente de azar del backend (solo se usa para sortear objetos míticos).
// Es "let" para que las pruebas puedan fijar el resultado.
export let azar: () => number = Math.random;

// Solo para las pruebas automáticas (test/).
export function usarAzarDePrueba(funcion: () => number) {
  azar = funcion;
}
