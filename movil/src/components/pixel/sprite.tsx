import { memo, useMemo } from 'react';
import { SvgXml } from 'react-native-svg';

export type Paleta = Record<string, string>;

// Convierte un mapa de letras en un SVG. Cada letra es un color de la paleta
// y '.' es transparente. Los píxeles seguidos del mismo color de una fila se
// juntan en un solo rectángulo, así un sprite de 12x12 tiene pocas figuras.
export function svgDeMapa(mapa: readonly string[], paleta: Paleta, espejo = false): string {
  const alto = mapa.length;
  const ancho = mapa[0]?.length ?? 0;
  const rects: string[] = [];

  mapa.forEach((filaOriginal, y) => {
    const fila = espejo ? [...filaOriginal].reverse().join('') : filaOriginal;
    let x = 0;
    while (x < fila.length) {
      const letra = fila[x];
      let fin = x + 1;
      while (fin < fila.length && fila[fin] === letra) fin++;
      const color = paleta[letra];
      if (letra !== '.' && color) {
        rects.push(`<rect x="${x}" y="${y}" width="${fin - x}" height="1" fill="${color}"/>`);
      }
      x = fin;
    }
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ancho} ${alto}" shape-rendering="crispEdges">${rects.join('')}</svg>`;
}

type Props = {
  mapa: readonly string[];
  paleta: Paleta;
  tamano: number;
  espejo?: boolean;
};

// Sprite pixel art. Es decorativo: quien lo usa pone la descripción accesible.
export const Sprite = memo(function Sprite({ mapa, paleta, tamano, espejo = false }: Props) {
  const xml = useMemo(() => svgDeMapa(mapa, paleta, espejo), [mapa, paleta, espejo]);
  return <SvgXml xml={xml} width={tamano} height={tamano} />;
});
