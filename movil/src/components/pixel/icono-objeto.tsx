import { Sprite, type Paleta } from './sprite';
import { ICONO_CANDADO, ICONOS_OBJETO, PALETA_OBJETOS } from './iconos-objetos';

// Silueta apagada: todos los colores en gris oscuro, para casillas vacías.
const PALETA_SILUETA: Paleta = Object.fromEntries(
  Object.keys(PALETA_OBJETOS).map((letra) => [letra, letra === 'K' ? '#26211a' : '#4a4436']),
);

type Props = {
  id: string;
  tamano: number;
  // true: se dibuja como silueta gris (casilla vacía).
  silueta?: boolean;
};

// Ícono pixel art de un objeto. Es decorativo: quien lo usa pone el texto accesible.
export function IconoObjeto({ id, tamano, silueta = false }: Props) {
  const mapa = ICONOS_OBJETO[id] ?? ICONO_CANDADO;
  return <Sprite mapa={mapa} paleta={silueta ? PALETA_SILUETA : PALETA_OBJETOS} tamano={tamano} />;
}

// Candado pixel art para las reliquias sin descubrir.
export function IconoCandado({ tamano }: { tamano: number }) {
  return <Sprite mapa={ICONO_CANDADO} paleta={PALETA_OBJETOS} tamano={tamano} />;
}
