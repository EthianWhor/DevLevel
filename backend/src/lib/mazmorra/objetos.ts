// Catálogo de objetos (normales y míticos), sus efectos en las estadísticas
// del héroe y el sorteo de míticos. Este archivo existe igual en backend y app.
import type { Accion, Equipo, Objeto } from './tipos';

const normal = (id: string, nombre: string, espacio: Objeto['espacio'], efecto: string): Objeto => ({
  id,
  nombre,
  espacio,
  efecto,
  mitico: false,
});
const mitico = (id: string, nombre: string, espacio: Objeto['espacio'], efecto: string): Objeto => ({
  id,
  nombre,
  espacio,
  efecto,
  mitico: true,
});

const LISTA: Objeto[] = [
  normal('daga_madera', 'Daga de madera', 'arma', '+1 de ataque'),
  normal('espada_bronce', 'Espada de bronce', 'arma', '+1 de ataque y +2 de energía'),
  normal('lanza_larga', 'Lanza larga', 'arma', '+1 de ataque y atacar() alcanza 2 casillas'),
  normal('hacha_guerra', 'Hacha de guerra', 'arma', '+2 de ataque'),
  normal('espada_hierro', 'Espada de hierro', 'arma', '+2 de ataque y +2 de energía'),
  normal('cota_cuero', 'Cota de cuero', 'armadura', '+1 de vida'),
  normal('casco_hierro', 'Casco de hierro', 'armadura', '+1 de vida y +1 de energía'),
  normal('capa_viajero', 'Capa de viajero', 'armadura', 'Los pinchos no te hacen daño'),
  normal('escudo_runico', 'Escudo rúnico', 'armadura', 'Bloquea el primer golpe'),
  normal('armadura_placas', 'Armadura de placas', 'armadura', '+2 de vida'),
  normal('botas_veloces', 'Botas veloces', 'amuleto', '+5 de energía'),
  normal('anillo_mana', 'Anillo de maná', 'amuleto', 'Girar no gasta energía'),
  normal('pergamino_sabio', 'Pergamino del sabio', 'amuleto', 'Pista avanzada: las primeras 2 líneas de una solución'),
  normal('lupa_explorador', 'Lupa del explorador', 'amuleto', 'Muestra el camino más corto a la puerta'),
  normal('amuleto_vida', 'Amuleto de vida', 'amuleto', 'Recuperas 1 de vida al recoger una moneda'),
  mitico('rayo_zeus', 'Rayo de Zeus', 'amuleto', 'invocar_rayo(): todos los enemigos pierden un tercio de su vida'),
  mitico('martillo_thor', 'Martillo de Thor', 'arma', '+3 de ataque y atacar() golpea también al enemigo de atrás'),
  mitico('egida_atenea', 'Égida de Atenea', 'armadura', 'Ignora los primeros 3 golpes'),
  mitico('caliz_fenix', 'Cáliz del Fénix', 'armadura', 'Revives una vez con toda la vida'),
  mitico('reloj_cronos', 'Reloj de Cronos', 'amuleto', 'Duplica la energía'),
  mitico('ojo_odin', 'Ojo de Odín', 'amuleto', 'La pista avanzada muestra la solución completa'),
  mitico('sandalias_hermes', 'Sandalias de Hermes', 'amuleto', 'volar(): avanzas 2 casillas por encima de pinchos y enemigos'),
  mitico('capa_sombras', 'Capa de Sombras', 'armadura', 'Los enemigos no devuelven el golpe'),
  mitico('llave_maestra', 'Llave Maestra', 'amuleto', 'atravesar(): cruzas el muro de enfrente'),
  mitico('corona_rey', 'Corona del Rey Lógico', 'amuleto', '+50 % de XP en cada mazmorra'),
];

export const OBJETOS: Record<string, Objeto> = Object.fromEntries(LISTA.map((o) => [o.id, o]));

export const IDS_MITICOS: readonly string[] = LISTA.filter((o) => o.mitico).map((o) => o.id);

export const EQUIPO_VACIO: Equipo = { arma: null, armadura: null, amuleto: null };

export type Estadisticas = {
  vidaMax: number;
  ataque: number;
  energiaExtra: number;
  multEnergia: number;
  girosGratis: boolean;
  pinchosSinDanio: boolean;
  golpesIgnorados: number;
  revive: boolean;
  sinContraataque: boolean;
  alcance: 1 | 2;
  golpeTraspasa: boolean;
  xpExtra: number;
  curaPorMoneda: boolean;
  accionesMiticas: Set<Accion>;
};

export function estadisticas(equipo: Equipo): Estadisticas {
  const e: Estadisticas = {
    vidaMax: 3,
    ataque: 1,
    energiaExtra: 0,
    multEnergia: 1,
    girosGratis: false,
    pinchosSinDanio: false,
    golpesIgnorados: 0,
    revive: false,
    sinContraataque: false,
    alcance: 1,
    golpeTraspasa: false,
    xpExtra: 0,
    curaPorMoneda: false,
    accionesMiticas: new Set(),
  };

  for (const id of [equipo.arma, equipo.armadura, equipo.amuleto]) {
    switch (id) {
      case 'daga_madera': e.ataque += 1; break;
      case 'espada_bronce': e.ataque += 1; e.energiaExtra += 2; break;
      case 'lanza_larga': e.ataque += 1; e.alcance = 2; break;
      case 'hacha_guerra': e.ataque += 2; break;
      case 'espada_hierro': e.ataque += 2; e.energiaExtra += 2; break;
      case 'martillo_thor': e.ataque += 3; e.golpeTraspasa = true; break;
      case 'cota_cuero': e.vidaMax += 1; break;
      case 'casco_hierro': e.vidaMax += 1; e.energiaExtra += 1; break;
      case 'capa_viajero': e.pinchosSinDanio = true; break;
      case 'escudo_runico': e.golpesIgnorados = 1; break;
      case 'armadura_placas': e.vidaMax += 2; break;
      case 'egida_atenea': e.golpesIgnorados = 3; break;
      case 'caliz_fenix': e.revive = true; break;
      case 'capa_sombras': e.sinContraataque = true; break;
      case 'botas_veloces': e.energiaExtra += 5; break;
      case 'anillo_mana': e.girosGratis = true; break;
      case 'amuleto_vida': e.curaPorMoneda = true; break;
      case 'rayo_zeus': e.accionesMiticas.add('invocar_rayo'); break;
      case 'reloj_cronos': e.multEnergia = 2; break;
      case 'sandalias_hermes': e.accionesMiticas.add('volar'); break;
      case 'llave_maestra': e.accionesMiticas.add('atravesar'); break;
      case 'corona_rey': e.xpExtra = 0.5; break;
      default: break; // pergamino, lupa y ojo no cambian la simulación
    }
  }
  return e;
}

// 10 % el primero; cada mítico que ya se tiene baja la probabilidad un quinto.
export function probabilidadMitico(miticosQueTiene: number): number {
  return 0.1 * 0.8 ** miticosQueTiene;
}

// Decide qué objeto recibe el jugador al ganar el objeto de una mazmorra:
// el normal, o con suerte un mítico al azar que todavía no tenga.
export function sortearObjeto(objetoNormal: string, miticosQueTiene: string[], azar: () => number): string {
  const disponibles = IDS_MITICOS.filter((id) => !miticosQueTiene.includes(id));
  if (disponibles.length === 0) return objetoNormal;
  if (azar() >= probabilidadMitico(IDS_MITICOS.length - disponibles.length)) return objetoNormal;
  return disponibles[Math.min(disponibles.length - 1, Math.floor(azar() * disponibles.length))];
}
