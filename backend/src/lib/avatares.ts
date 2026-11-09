// Clases de personaje que se pueden elegir en la pantalla Selección de personaje.
// La app usa estos mismos identificadores para mostrar la imagen de cada uno.
export const AVATARES = ['explorador', 'mago', 'guerrero'] as const;

export type Avatar = (typeof AVATARES)[number];

export function esAvatar(valor: unknown): valor is Avatar {
  return typeof valor === 'string' && (AVATARES as readonly string[]).includes(valor);
}
