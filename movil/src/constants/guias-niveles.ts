// Guías "Cómo se usa" de cada nivel: además de explicar el concepto, dicen
// exactamente qué tocar en la app para usar lo nuevo de ese nivel.

export type Guia = {
  titulo: string;
  // Qué hace, en una o dos frases.
  queHace: string;
  // Pasos concretos en la app, en orden.
  pasos: string[];
  ejemplo?: string;
};

const G: Record<string, Guia> = {
  editorBloques: {
    titulo: 'Cómo armar tu hechizo con bloques',
    queHace: 'Tu hechizo es la lista de órdenes que sigue el héroe, de arriba hacia abajo.',
    pasos: [
      'Debajo del editor está la paleta. Toca una instrucción (por ejemplo adelante()) y se agrega como una línea nueva.',
      'Toca una línea para elegirla: queda resaltada y aparecen ↑ y ↓ para moverla y 🗑 para borrarla.',
      'Con una línea elegida, lo próximo que toques en la paleta se agrega justo después de ella. Debajo del editor siempre dice dónde se va a agregar.',
      'Toca otra vez la línea elegida para soltarla: lo próximo se agrega al final.',
      'Toca ▶ Ejecutar hechizo y mira al héroe seguir tus órdenes. Si algo falla, cambia el hechizo y vuelve a intentar.',
    ],
  },
  mover: {
    titulo: 'adelante() y girar',
    queHace:
      'adelante() avanza una casilla hacia donde mira el héroe. girar_izquierda() y girar_derecha() lo hacen girar sin moverse.',
    pasos: [
      'Antes de empezar, fíjate en el escenario hacia dónde mira el héroe.',
      'Si el camino dobla, primero gira y después avanza.',
      'Si chocas con un muro el héroe no se mueve, y cuenta como choque.',
    ],
    ejemplo: 'adelante()\nadelante()\ngirar_derecha()\nadelante()',
  },
  recoger: {
    titulo: 'recoger()',
    queHace: 'recoger() toma la moneda de la casilla donde está parado el héroe.',
    pasos: [
      'Lleva al héroe hasta la casilla de la moneda con adelante().',
      'Cuando esté encima de la moneda, agrega recoger().',
    ],
    ejemplo: 'adelante()\nadelante()\nrecoger()',
  },
  objetivos: {
    titulo: 'Estrellas y objetivos ★',
    queHace: 'Salir por la puerta da 1 estrella. Cada objetivo extra que cumplas da 1 estrella más.',
    pasos: [
      'Los objetivos están debajo del escenario, por ejemplo "recoge todas las monedas" o "usa pocas instrucciones".',
      'Si cumples todos, ganas una reliquia. Se equipa sola si su espacio está vacío, y la puedes cambiar en Héroe → Equipo.',
      'Puedes repetir la mazmorra para conseguir las estrellas que te faltaron.',
    ],
  },
  atacar: {
    titulo: 'atacar()',
    queHace: 'atacar() golpea al enemigo que está justo enfrente del héroe.',
    pasos: [
      'Lleva al héroe a la casilla de al lado del enemigo y gíralo para que lo mire.',
      'Agrega atacar(). Si el enemigo sobrevive, te devuelve el golpe: mira su vida en el escenario.',
      'Agrega atacar() las veces que haga falta. Cuando el enemigo cae, ya puedes pasar por su casilla.',
    ],
    ejemplo: 'adelante()\ngirar_derecha()\natacar()\ngirar_izquierda()\nadelante()',
  },
  dividir: {
    titulo: 'Divide el problema en partes',
    queHace: 'En este nivel no hay instrucciones nuevas: el reto es planear el camino por tramos.',
    pasos: [
      'Mira el escenario y decide el recorrido: primero un pasillo, después el otro.',
      'Arma solo el primer tramo y ejecútalo para comprobar que el héroe llega donde querías.',
      'Luego agrega el siguiente tramo debajo. Si te equivocas, toca la línea y usa ↑, ↓ o 🗑.',
    ],
  },
  repetirBloques: {
    titulo: 'REPETIR: hacer lo mismo varias veces',
    queHace: 'REPETIR 3 VECES ejecuta 3 veces las líneas que tiene adentro, hasta su FIN.',
    pasos: [
      'Toca REPETIR en la paleta. Aparecen REPETIR 3 VECES y su FIN, y el REPETIR queda elegido.',
      'Mientras el REPETIR está elegido, lo que toques en la paleta se agrega adentro (se ve corrido a la derecha).',
      'Usa − y + para cambiar cuántas veces se repite.',
      'Para seguir agregando afuera del bloque, toca su línea FIN: lo próximo se agrega después del bloque.',
    ],
    ejemplo: 'REPETIR 3 VECES\n  adelante()\nFIN\ngirar_derecha()',
  },
  variableBloques: {
    titulo: 'Variable: una caja con un número',
    queHace:
      'pasos = 2 guarda el número 2 en una caja llamada pasos. Después un REPETIR puede usar esa caja para saber cuántas veces repetir.',
    pasos: [
      'Toca pasos = 2 en la paleta. Aparece la línea pasos = 2 y queda elegida.',
      'Con esa línea elegida, usa − y + para cambiar el número (por ejemplo pasos = 3).',
      'Toca REPETIR. Con el REPETIR elegido, toca el botón "usar pasos": la línea cambia a REPETIR pasos VECES.',
      'Agrega adentro lo que se repite, por ejemplo adelante(). Toca el FIN para seguir afuera.',
      'Si necesitas otra variable, elige la línea de la variable y toca "nombre ⟳" para llamarla largo o veces. En el REPETIR, "usar …" va pasando por cada variable.',
    ],
    ejemplo: 'pasos = 3\nREPETIR pasos VECES\n  adelante()\nFIN',
  },
  saltar: {
    titulo: 'saltar()',
    queHace: 'saltar() avanza 2 casillas pasando por encima de la de enfrente.',
    pasos: [
      'Úsalo cuando hay pinchos justo enfrente: así no te hacen daño.',
      'No sirve para saltar muros ni enemigos, y la casilla donde caes debe estar libre.',
      'Regla rápida: piso → adelante(); pinchos → saltar(); goblin → atacar().',
    ],
    ejemplo: 'adelante()\nsaltar()\nadelante()',
  },
  variableCambiar: {
    titulo: 'Cambiar el valor de una variable',
    queHace:
      'Una variable puede cambiar de valor en medio del hechizo. Cada REPETIR usa el valor que tenga la variable en ese momento.',
    pasos: [
      'Para el primer tramo pon pasos = 2 y un REPETIR con "usar pasos".',
      'Toca el FIN de ese REPETIR y agrega otra vez pasos = 2 desde la paleta. Con − y + ponle el largo del segundo tramo.',
      'Agrega otro REPETIR, toca "usar pasos" y pon adentro lo que se repite.',
    ],
    ejemplo: 'pasos = 2\nREPETIR pasos VECES\n  adelante()\nFIN\ngirar_derecha()\npasos = 4\nREPETIR pasos VECES\n  adelante()\nFIN',
  },
  si: {
    titulo: 'SI: preguntar antes de actuar',
    queHace:
      'SI … ENTONCES hace lo de adentro solo cuando la respuesta es sí. Las preguntas miran la casilla de enfrente (en_salida mira si ya llegaste a la puerta).',
    pasos: [
      'Toca SI en la paleta. Aparecen SI hay_enemigo ENTONCES y su FIN, y el SI queda elegido.',
      'Toca "condición ⟳" para cambiar la pregunta: hay_enemigo, hay_muro, hay_pincho, hay_moneda o en_salida.',
      'Con el SI elegido, lo que agregues va adentro: solo se hace si la respuesta es sí.',
      'Toca el FIN del SI para seguir agregando afuera. Lo normal es poner el SI dentro de un REPETIR, para preguntar en cada paso.',
      'Si prefieres escribirlo, toca "✎ Escribirlo yo" y sigue en texto.',
    ],
    ejemplo: 'REPETIR 6 VECES\n  SI hay_enemigo ENTONCES\n    atacar()\n  FIN\n  adelante()\nFIN',
  },
  sino: {
    titulo: 'SINO: el otro camino',
    queHace: 'Lo que va después de SINO se hace cuando la respuesta del SI es no.',
    pasos: [
      'Agrega un SI y elige la pregunta con "condición ⟳" (por ejemplo hay_pincho).',
      'Con el SI elegido, toca "+ SINO". Aparece la línea SINO.',
      'Agrega dentro del SI lo que pasa si la respuesta es sí, por ejemplo saltar().',
      'Toca la línea SINO y agrega lo que pasa si es no, por ejemplo adelante().',
    ],
    ejemplo: 'SI hay_pincho ENTONCES\n  saltar()\nSINO\n  adelante()\nFIN',
  },
  no: {
    titulo: 'NO y varias preguntas',
    queHace: 'NO da vuelta a la respuesta: NO hay_muro es sí cuando enfrente no hay muro.',
    pasos: [
      'Elige un SI y toca "poner NO" para negar la pregunta.',
      'Para decidir entre varias cosas, pon un SI después de otro: primero pregunta por el enemigo y después por la moneda.',
    ],
    ejemplo: 'SI hay_enemigo ENTONCES\n  atacar()\nFIN\nSI NO hay_muro ENTONCES\n  adelante()\nFIN',
  },
  editorTexto: {
    titulo: 'Escribir el hechizo a mano',
    queHace: 'Desde esta región el hechizo se escribe como texto. Es el mismo lenguaje que armaban los bloques.',
    pasos: [
      'Toca el editor y escribe una instrucción por línea.',
      'Usa la barra de atajos del editor: cada atajo escribe la instrucción completa donde está el cursor, así no tienes que teclear todo.',
      'Los atajos REPETIR, SI, MIENTRAS y FUNCION ya traen su FIN. Escribe adentro, en la línea del medio.',
      'Si hay un error, la línea se marca y abajo aparece qué pasa, por ejemplo "falta FIN para cerrar el REPETIR".',
    ],
  },
  repetirTexto: {
    titulo: 'REPETIR escrito',
    queHace: 'REPETIR N VECES … FIN repite N veces las líneas de adentro.',
    pasos: [
      'Toca el atajo REPETIR: escribe REPETIR 3 VECES, una línea vacía y FIN.',
      'Cambia el 3 por el número que necesites.',
      'En la línea del medio escribe lo que se repite (puede ser más de una línea).',
    ],
    ejemplo: 'REPETIR 4 VECES\n  adelante()\nFIN\ngirar_izquierda()',
  },
  mientras: {
    titulo: 'MIENTRAS: repetir sin saber cuántas veces',
    queHace: 'MIENTRAS … HACER repite lo de adentro mientras la respuesta sea sí. Sirve cuando no sabes cuántas veces hay que repetir.',
    pasos: [
      'Toca el atajo MIENTRAS: escribe MIENTRAS NO hay_muro HACER y su FIN.',
      'Cambia la pregunta si hace falta, por ejemplo NO en_salida.',
      'Escribe adentro lo que se repite. Adentro tiene que pasar algo que cambie la respuesta (como avanzar); si no, se repetiría para siempre y el hechizo se detiene solo.',
    ],
    ejemplo: 'MIENTRAS NO hay_muro HACER\n  adelante()\nFIN',
  },
  recorrer: {
    titulo: 'Recorrer una fila',
    queHace: 'Una fila de monedas se recorre casilla por casilla: en cada paso preguntas qué hay enfrente y decides.',
    pasos: [
      'Usa un MIENTRAS o un REPETIR para avanzar por toda la fila.',
      'Adentro, un SI decide qué hacer en cada casilla: recoger, atacar o solo avanzar.',
      'Recuerda: las preguntas miran la casilla de enfrente, pero recoger() toma la moneda de la casilla donde estás.',
    ],
    ejemplo: 'REPETIR 5 VECES\n  SI hay_moneda ENTONCES\n    adelante()\n    recoger()\n  SINO\n    adelante()\n  FIN\nFIN',
  },
  funcion: {
    titulo: 'FUNCION: tu propia instrucción',
    queHace:
      'FUNCION guarda un grupo de instrucciones con un nombre. Después la usas escribiendo ese nombre con () las veces que quieras.',
    pasos: [
      'Toca el atajo FUNCION: escribe FUNCION mi_funcion() y su FIN.',
      'Cambia mi_funcion por un nombre que diga lo que hace, por ejemplo escalon.',
      'Escribe adentro sus pasos.',
      'La función va arriba, antes de usarla. Para usarla escribe escalon() en otra línea (también dentro de un REPETIR).',
    ],
    ejemplo: 'FUNCION escalon()\n  adelante()\n  girar_izquierda()\n  adelante()\n  girar_derecha()\nFIN\nescalon()\nescalon()',
  },
  funcionVariable: {
    titulo: 'Funciones con un dato de entrada',
    queHace: 'Una función puede usar una variable: hace lo mismo pero del tamaño que diga la variable.',
    pasos: [
      'Escribe la función con REPETIR largo VECES adentro.',
      'Antes de usarla, da el valor: largo = 3 y en la línea siguiente tramo().',
      'Para otro tramo cambia el valor (largo = 5) y vuelve a escribir tramo().',
      'El atajo "variable" escribe pasos = 3: cambia el nombre y el número a lo que necesites.',
    ],
    ejemplo: 'FUNCION tramo()\n  REPETIR largo VECES\n    adelante()\n  FIN\nFIN\nlargo = 3\ntramo()\ngirar_derecha()\nlargo = 5\ntramo()',
  },
  repaso: {
    titulo: 'Usa todo lo que aprendiste',
    queHace: 'Es la mazmorra final: puedes usar funciones, variables, REPETIR, MIENTRAS, SI y SINO.',
    pasos: [
      'Divide el camino en tramos y crea una función para lo que se repite.',
      'Usa SI para reaccionar a enemigos y pinchos.',
      'Prueba por partes: ejecuta, mira dónde se detiene el héroe y corrige esa parte.',
    ],
  },
};

// Qué guías se muestran en cada nivel (por su número de orden).
const POR_NIVEL: Record<number, string[]> = {
  1: ['editorBloques', 'mover', 'recoger', 'objetivos'],
  2: ['atacar'],
  3: ['dividir'],
  4: ['variableBloques', 'repetirBloques'],
  5: ['saltar'],
  6: ['variableCambiar'],
  7: ['si'],
  8: ['sino'],
  9: ['no'],
  10: ['editorTexto', 'repetirTexto'],
  11: ['mientras'],
  12: ['recorrer'],
  13: ['funcion'],
  14: ['funcionVariable'],
  15: ['repaso'],
};

export function guiasDelNivel(orden: number): Guia[] {
  return (POR_NIVEL[orden] ?? []).map((id) => G[id]).filter(Boolean);
}
