// Sprites pixel art de 12x12 del juego, dibujados con letras.
// Cada letra se pinta con el color de su paleta; '.' es transparente.
import type { Avatar } from '@/api';
import type { Direccion, TipoEnemigo } from '@/juego/tipos';
import type { Paleta } from './sprite';

const CONTORNO = '#140f04';

// ---------- Héroe (mismo cuerpo, colores según la clase) ----------
// A = color principal, a = sombra, T = adorno, S = piel, E = ojos

const HEROE_FRENTE = [
  '....KKKK....',
  '...KAAAAK...',
  '..KAAAAAAK..',
  '..KASSSSAK..',
  '..KSESSESK..',
  '..KSSSSSSK..',
  '...KTTTTK...',
  '..KAATTAAK..',
  '.KSAAAAAASK.',
  '..KAAAAAAK..',
  '..KaaKKaaK..',
  '..KKK..KKK..',
];

const HEROE_ESPALDA = [
  '....KKKK....',
  '...KAAAAK...',
  '..KAAAAAAK..',
  '..KAAAAAAK..',
  '..KAAAAAAK..',
  '..KaAAAAaK..',
  '...KTTTTK...',
  '..KAAAAAAK..',
  '.KSAAAAAASK.',
  '..KAAAAAAK..',
  '..KaaKKaaK..',
  '..KKK..KKK..',
];

const HEROE_LADO = [
  '....KKKK....',
  '...KAAAAK...',
  '..KAAAAAAK..',
  '..KAAASSSK..',
  '..KAASSESK..',
  '...KASSSSK..',
  '...KTTTTK...',
  '..KAATTAAK..',
  '..KAAAASSK..',
  '..KAAAAAAK..',
  '..KaaKaaK...',
  '..KKK.KKK...',
];

const PIEL = { S: '#f1c27d', E: '#1a1a1a', K: CONTORNO };

export const PALETA_HEROE: Record<Avatar, Paleta> = {
  explorador: { ...PIEL, A: '#2f8f4e', a: '#1f5e33', T: '#a16207' },
  mago: { ...PIEL, A: '#7c3aed', a: '#4c1d95', T: '#ffd700' },
  guerrero: { ...PIEL, A: '#9ca3af', a: '#4b5563', T: '#ef4444' },
};

// Mapa y si hay que voltearlo para cada dirección.
export function spriteHeroe(dir: Direccion): { mapa: string[]; espejo: boolean } {
  switch (dir) {
    case 'sur':
      return { mapa: HEROE_FRENTE, espejo: false };
    case 'norte':
      return { mapa: HEROE_ESPALDA, espejo: false };
    case 'este':
      return { mapa: HEROE_LADO, espejo: false };
    case 'oeste':
      return { mapa: HEROE_LADO, espejo: true };
  }
}

// ---------- Enemigos ----------

const GOBLIN = [
  '............',
  '............',
  '..K......K..',
  '.KGK.KK.KGK.',
  '..KGGGGGGK..',
  '..KGRGGRGK..',
  '..KGGGGGGK..',
  '...KGWWGK...',
  '..KBBBBBBK..',
  '.KGBBBBBBGK.',
  '..KBBKKBBK..',
  '..KKK..KKK..',
];

const ORCO = [
  '...KKKKKK...',
  '..KGGGGGGK..',
  '.KGGGGGGGGK.',
  '.KGRGGGGRGK.',
  '.KGGGGGGGGK.',
  '.KGWGKKGWGK.',
  '..KGGGGGGK..',
  '.KMMMMMMMMK.',
  'KGMMMMMMMMGK',
  'KGKMMMMMMKGK',
  '.KKMMKKMMKK.',
  '..KKK..KKK..',
];

const CABALLERO = [
  '...KKKKKK...',
  '..KXXXXXXK..',
  '..KXRXXRXK..',
  '..KXXXXXXK..',
  '...KXKKXK...',
  '..KNNNNNNK..',
  '.KXNNYYNNXK.',
  '.KXNNNNNNXK.',
  '.KXNNNNNNXK.',
  '..KNNKKNNK..',
  '..KXXKKXXK..',
  '..KKK..KKK..',
];

export const SPRITES_ENEMIGO: Record<TipoEnemigo, { mapa: string[]; paleta: Paleta }> = {
  goblin: {
    mapa: GOBLIN,
    paleta: { K: CONTORNO, G: '#4ade80', R: '#ef4444', W: '#f8fafc', B: '#7a4b20' },
  },
  orco: {
    mapa: ORCO,
    paleta: { K: CONTORNO, G: '#3f7d3a', R: '#fbbf24', W: '#f8fafc', M: '#6b7280' },
  },
  caballero: {
    mapa: CABALLERO,
    paleta: { K: CONTORNO, X: '#e5e7eb', R: '#ef4444', N: '#1e293b', Y: '#ffd700' },
  },
};

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

// Íconos de los objetos (emoji dentro de un marco pixel).
export const ICONO_OBJETO: Record<string, string> = {
  daga_madera: '🗡️',
  espada_bronce: '⚔️',
  lanza_larga: '🔱',
  hacha_guerra: '🪓',
  espada_hierro: '🗡️',
  cota_cuero: '🦺',
  casco_hierro: '⛑️',
  capa_viajero: '🧥',
  escudo_runico: '🛡️',
  armadura_placas: '🥋',
  botas_veloces: '👢',
  anillo_mana: '💍',
  pergamino_sabio: '📜',
  lupa_explorador: '🔍',
  amuleto_vida: '❤️',
  rayo_zeus: '⚡',
  martillo_thor: '🔨',
  egida_atenea: '🛡️',
  caliz_fenix: '🔥',
  reloj_cronos: '⏳',
  ojo_odin: '👁️',
  sandalias_hermes: '🪽',
  capa_sombras: '🌑',
  llave_maestra: '🗝️',
  corona_rey: '👑',
};
