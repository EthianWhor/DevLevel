// Sprites pixel art de 12x12 del juego, dibujados con letras.
// Cada letra se pinta con el color de su paleta; '.' es transparente.
import type { Avatar } from '@/api';
import type { Direccion, TipoEnemigo } from '@/juego/tipos';
import type { Paleta } from './sprite';
import { ENEMIGOS_24, HEROES_24 } from './sprites-24';

const CONTORNO = '#140f04';

// ---------- Héroe y enemigos (24x24, generados en sprites-24.ts) ----------

// Colores de cada clase de héroe.
export const PALETA_HEROE: Record<Avatar, Paleta> = {
  explorador: HEROES_24.explorador.paleta,
  mago: HEROES_24.mago.paleta,
  guerrero: HEROES_24.guerrero.paleta,
};

// Mapa del héroe de esa clase y si hay que voltearlo para cada dirección.
export function spriteHeroe(dir: Direccion, avatar: Avatar): { mapa: string[]; espejo: boolean } {
  const { vistas } = HEROES_24[avatar];
  switch (dir) {
    case 'sur':
      return { mapa: vistas.frente, espejo: false };
    case 'norte':
      return { mapa: vistas.espalda, espejo: false };
    case 'este':
      return { mapa: vistas.lado, espejo: false };
    case 'oeste':
      return { mapa: vistas.lado, espejo: true };
  }
}

export const SPRITES_ENEMIGO: Record<TipoEnemigo, { mapa: string[]; paleta: Paleta }> = ENEMIGOS_24;

// ---------- Terreno ----------

export const PISO = [
  'dddddddddddd',
  'dfffffffffff',
  'dffffFffffff',
  'dfffffffffff',
  'dffffffffFff',
  'dfffffffffff',
  'dfFfffffffff',
  'dfffffffffff',
  'dffffffFffff',
  'dfffffffffff',
  'dffFffffffff',
  'dfffffffffff',
];

export const MURO = [
  'wwwwwwwwwwww',
  'VVVVVwVVVVVw',
  'WWWWWwWWWWWw',
  'WWWWWwWWWWWw',
  'wwwwwwwwwwww',
  'VVwVVVVVwVVV',
  'WWwWWWWWwWWW',
  'WWwWWWWWwWWW',
  'wwwwwwwwwwww',
  'VVVVVwVVVVVw',
  'WWWWWwWWWWWw',
  'WWWWWwWWWWWw',
];

export const PUERTA = [
  'dfffffffffff',
  'dffKKKKKKfff',
  'dfKQQqQQqKff',
  'dKQQQqQQqQKf',
  'dKQQQqQQqQKf',
  'dKQQQqQQqQKf',
  'dKQQQqQYqQKf',
  'dKQQQqQQqQKf',
  'dKQQQqQQqQKf',
  'dKQQQqQQqQKf',
  'dKQQQqQQqQKf',
  'dKKKKKKKKKKf',
];

export const MONEDA = [
  '............',
  '............',
  '....KKKK....',
  '...KYYYYK...',
  '..KYyyYYYK..',
  '..KYyYYYOK..',
  '..KYYYYYOK..',
  '..KYYYYOOK..',
  '...KYOOOK...',
  '....KKKK....',
  '............',
  '............',
];

export const PINCHOS = [
  '............',
  '............',
  '............',
  '...K.....K..',
  '..KZK...KZK.',
  '..KZK...KZK.',
  '.KZZZK.KZZZK',
  '.KZZZK.KZZZK',
  'KZZZZZKZZZZK',
  'KKKKKKKKKKKK',
  '............',
  '............',
];

export const PALETA_TERRENO: Paleta = {
  K: CONTORNO,
  d: '#1c180d',
  f: '#2e2a1e',
  F: '#3d392c',
  w: '#26211a',
  W: '#5b5240',
  V: '#7a6e55',
  Q: '#8b5a2b',
  q: '#5c3a1a',
  Y: '#ffd700',
  y: '#fff6a0',
  O: '#c9a227',
  Z: '#cbd5e1',
};
