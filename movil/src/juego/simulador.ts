// Simulador de mazmorras: ejecuta el programa del jugador paso a paso sobre
// el mapa y decide si gana. Es determinista (sin azar), así la app anima
// exactamente lo mismo que valida el backend. Existe igual en backend y app.
import { leerPrograma } from './lector';
import { estadisticas } from './objetos';
import type {
  Accion,
  Condicion,
  Direccion,
  Equipo,
  EstadoEnemigo,
  Instruccion,
  Lectura,
  Mazmorra,
  Paso,
  ResultadoSimulacion,
  TipoEnemigo,
  TipoPaso,
} from './tipos';

export const LIMITE_PASOS = 500;

const MOTIVO_ENERGIA = 'Te quedaste sin energía';
const MOTIVO_VIDA = 'Perdiste toda tu vida';
const MOTIVO_NO_LLEGO = 'Tu hechizo terminó antes de llegar a la puerta';
const MOTIVO_LIMITE = 'El hechizo se repitió demasiadas veces';

const DELTA: Record<Direccion, [number, number]> = {
  norte: [-1, 0],
  sur: [1, 0],
  este: [0, 1],
  oeste: [0, -1],
};
const DERECHA: Record<Direccion, Direccion> = { norte: 'este', este: 'sur', sur: 'oeste', oeste: 'norte' };
const IZQUIERDA: Record<Direccion, Direccion> = { norte: 'oeste', oeste: 'sur', sur: 'este', este: 'norte' };

const ENEMIGOS: Record<string, { tipo: TipoEnemigo; vida: number; danio: number }> = {
  g: { tipo: 'goblin', vida: 1, danio: 1 },
  o: { tipo: 'orco', vida: 2, danio: 1 },
  k: { tipo: 'caballero', vida: 3, danio: 2 },
};
const DANIO: Record<TipoEnemigo, number> = { goblin: 1, orco: 1, caballero: 2 };

type Terreno = 'muro' | 'piso' | 'pincho' | 'puerta';

// Lo que se sabe del mapa sin ejecutar nada (lo usa también la app para dibujar).
export function leerMapa(mazmorra: Mazmorra) {
  const terreno: Terreno[][] = [];
  const monedas: [number, number][] = [];
  const enemigos: EstadoEnemigo[] = [];
  let inicio: [number, number] = [0, 0];
  let puerta: [number, number] = [0, 0];

  mazmorra.mapa.forEach((fila, f) => {
    terreno.push([]);
    [...fila].forEach((letra, c) => {
      let t: Terreno = 'piso';
      if (letra === '#') t = 'muro';
      else if (letra === '^') t = 'pincho';
      else if (letra === 'P') {
        t = 'puerta';
        puerta = [f, c];
      } else if (letra === 'S') inicio = [f, c];
      else if (letra === 'C') monedas.push([f, c]);
      else if (ENEMIGOS[letra]) {
        const def = ENEMIGOS[letra];
        enemigos.push({ id: enemigos.length, tipo: def.tipo, fila: f, col: c, vida: def.vida, vidaMax: def.vida });
      }
      terreno[f].push(t);
    });
  });

  return { terreno, monedas, enemigos, inicio, puerta };
}

class FinSimulacion {
  constructor(public gano: boolean, public motivo: string | null) {}
}

export function simular(
  mazmorra: Mazmorra,
  programa: Instruccion[],
  instrucciones: number,
  equipo: Equipo,
): ResultadoSimulacion {
  const stats = estadisticas(equipo);
  const mapa = leerMapa(mazmorra);
  const terreno = mapa.terreno.map((fila) => [...fila]);
  const monedasEnMapa = mapa.monedas.map(([f, c]) => [f, c] as [number, number]);
  const enemigos = mapa.enemigos.map((e) => ({ ...e }));
  const enemigosTotales = enemigos.length;
  const monedasTotales = monedasEnMapa.length;

  let [fila, col] = mapa.inicio;
  let dir: Direccion = mazmorra.direccionInicial;
  let vida = stats.vidaMax;
  let energia = (mazmorra.energia + stats.energiaExtra) * stats.multEnergia;
  let monedas = 0;
  let choques = 0;
  let danioRecibido = 0;
  let enemigosDerrotados = 0;
  let golpesIgnorados = stats.golpesIgnorados;
  let revive = stats.revive;
  let evaluaciones = 0;
  const usadas = new Set<Accion>();
  const variables = new Map<string, number>();
  const funciones = new Map<string, Instruccion[]>();
  const pasos: Paso[] = [];

  const dentro = (f: number, c: number) => f >= 0 && f < terreno.length && c >= 0 && c < terreno[f].length;
  const esMuro = (f: number, c: number) => !dentro(f, c) || terreno[f][c] === 'muro';
  const enemigoEn = (f: number, c: number) => enemigos.find((e) => e.vida > 0 && e.fila === f && e.col === c);
  const monedaEn = (f: number, c: number) => monedasEnMapa.findIndex(([mf, mc]) => mf === f && mc === c);
  const adelanteDe = (n = 1): [number, number] => [fila + DELTA[dir][0] * n, col + DELTA[dir][1] * n];

  const registrar = (tipo: TipoPaso, linea: number, danio?: number) => {
    pasos.push({
      tipo,
      linea,
      fila,
      col,
      dir,
      vida,
      energia,
      monedas,
      enemigos: enemigos.filter((e) => e.vida > 0).map((e) => ({ ...e })),
      monedasEnMapa: monedasEnMapa.map(([f, c]) => [f, c] as [number, number]),
      ...(danio !== undefined ? { danio } : {}),
    });
  };

  const recibirDanio = (danio: number, linea: number, tipo: TipoPaso) => {
    if (danio > 0 && golpesIgnorados > 0 && tipo === 'golpeRecibido') {
      golpesIgnorados--;
      registrar(tipo, linea, 0);
      return;
    }
    vida -= danio;
    danioRecibido += danio;
    registrar(tipo, linea, danio);
    if (vida <= 0) {
      if (revive) {
        revive = false;
        vida = stats.vidaMax;
        registrar('revivir', linea);
        return;
      }
      throw new FinSimulacion(false, MOTIVO_VIDA);
    }
  };

  const golpeDe = (enemigo: EstadoEnemigo, linea: number) => recibirDanio(DANIO[enemigo.tipo], linea, 'golpeRecibido');

  const llegar = (f: number, c: number, linea: number, tipo: TipoPaso) => {
    fila = f;
    col = c;
    if (terreno[f][c] === 'pincho' && tipo === 'mover' && !stats.pinchosSinDanio) {
      registrar(tipo, linea);
      recibirDanio(1, linea, 'pincho');
    } else {
      registrar(tipo, linea);
    }
    if (terreno[f][c] === 'puerta') throw new FinSimulacion(true, null);
  };

  const golpear = (enemigo: EstadoEnemigo, linea: number) => {
    enemigo.vida -= stats.ataque;
    if (enemigo.vida <= 0) {
      enemigo.vida = 0;
      enemigosDerrotados++;
      registrar('enemigoDerrotado', linea);
    }
  };

  const accion = (nombre: Accion, linea: number) => {
    const esGiro = nombre === 'girar_derecha' || nombre === 'girar_izquierda';
    if (!(esGiro && stats.girosGratis)) {
      if (energia <= 0) throw new FinSimulacion(false, MOTIVO_ENERGIA);
      energia--;
    }

    switch (nombre) {
      case 'girar_derecha':
      case 'girar_izquierda':
        dir = nombre === 'girar_derecha' ? DERECHA[dir] : IZQUIERDA[dir];
        registrar('girar', linea);
        return;

      case 'adelante':
      case 'atravesar': {
        const [f, c] = adelanteDe();
        if (nombre === 'atravesar' && !usadas.has('atravesar') && dentro(f, c) && terreno[f][c] === 'muro') {
          usadas.add('atravesar');
          terreno[f][c] = 'piso';
          llegar(f, c, linea, 'atravesar');
          return;
        }
        if (esMuro(f, c)) {
          choques++;
          registrar('chocar', linea);
          return;
        }
        const enemigo = enemigoEn(f, c);
        if (enemigo) {
          registrar('bloqueado', linea);
          golpeDe(enemigo, linea);
          return;
        }
        llegar(f, c, linea, 'mover');
        return;
      }

      case 'saltar':
      case 'volar': {
        const [mf, mc] = adelanteDe();
        const [f, c] = adelanteDe(2);
        const vuela = nombre === 'volar' && !usadas.has('volar');
        if (vuela) usadas.add('volar');
        const medioBloquea = esMuro(mf, mc) || (!vuela && Boolean(enemigoEn(mf, mc)));
        const llegadaBloquea = esMuro(f, c) || Boolean(enemigoEn(f, c)) || (!vuela && terreno[f]?.[c] === 'pincho');
        if (medioBloquea || llegadaBloquea) {
          choques++;
          registrar('chocar', linea);
          return;
        }
        llegar(f, c, linea, vuela ? 'volar' : 'saltar');
        return;
      }

      case 'atacar': {
        const [f, c] = adelanteDe();
        let objetivo = enemigoEn(f, c);
        if (!objetivo && stats.alcance === 2 && !esMuro(f, c)) {
          const [f2, c2] = adelanteDe(2);
          objetivo = enemigoEn(f2, c2);
        }
        registrar('atacar', linea);
        if (!objetivo) return;
        const [tf, tc] = [objetivo.fila, objetivo.col];
        golpear(objetivo, linea);
        if (stats.golpeTraspasa) {
          const detras = enemigoEn(tf + DELTA[dir][0], tc + DELTA[dir][1]);
          if (detras) golpear(detras, linea);
        }
        if (objetivo.vida > 0 && !stats.sinContraataque) golpeDe(objetivo, linea);
        return;
      }

      case 'recoger': {
        const i = monedaEn(fila, col);
        if (i >= 0) {
          monedasEnMapa.splice(i, 1);
          monedas++;
          if (stats.curaPorMoneda) vida = Math.min(stats.vidaMax, vida + 1);
          registrar('moneda', linea);
        }
        return;
      }

      case 'invocar_rayo': {
        if (usadas.has('invocar_rayo')) return;
        usadas.add('invocar_rayo');
        for (const e of enemigos.filter((x) => x.vida > 0)) {
          e.vida -= Math.ceil(e.vidaMax / 3);
          if (e.vida <= 0) {
            e.vida = 0;
            enemigosDerrotados++;
          }
        }
        registrar('rayo', linea);
        return;
      }
    }
  };

  const cumple = (condicion: Condicion): boolean => {
    const [f, c] = adelanteDe();
    let valor: boolean;
    switch (condicion.sensor) {
      case 'hay_muro': valor = esMuro(f, c); break;
      case 'hay_pincho': valor = dentro(f, c) && terreno[f][c] === 'pincho'; break;
      case 'hay_enemigo': valor = Boolean(enemigoEn(f, c)); break;
      case 'hay_moneda': valor = monedaEn(f, c) >= 0; break;
      case 'en_salida': valor = terreno[fila][col] === 'puerta'; break;
    }
    return condicion.negada ? !valor : valor;
  };

  const contar = () => {
    evaluaciones++;
    if (evaluaciones > LIMITE_PASOS) throw new FinSimulacion(false, MOTIVO_LIMITE);
  };

  const ejecutar = (lista: Instruccion[]) => {
    for (const ins of lista) {
      contar();
      switch (ins.tipo) {
        case 'accion':
          accion(ins.accion, ins.linea);
          break;
        case 'asignar':
          variables.set(ins.variable, ins.valor);
          break;
        case 'funcion':
          funciones.set(ins.nombre, ins.cuerpo);
          break;
        case 'llamada':
          ejecutar(funciones.get(ins.nombre) ?? []);
          break;
        case 'repetir': {
          const veces = 'numero' in ins.veces ? ins.veces.numero : variables.get(ins.veces.variable) ?? 0;
          for (let i = 0; i < veces; i++) {
            contar();
            ejecutar(ins.cuerpo);
          }
          break;
        }
        case 'mientras':
          while (cumple(ins.condicion)) {
            contar();
            ejecutar(ins.cuerpo);
          }
          break;
        case 'si':
          ejecutar(cumple(ins.condicion) ? ins.entonces : ins.sino);
          break;
      }
    }
  };

  let gano = false;
  let motivo: string | null = MOTIVO_NO_LLEGO;
  try {
    ejecutar(programa);
  } catch (e) {
    if (!(e instanceof FinSimulacion)) throw e;
    gano = e.gano;
    motivo = e.motivo;
  }

  const objetivosCumplidos = mazmorra.objetivosExtra.map((o) => {
    if (!gano) return false;
    switch (o.tipo) {
      case 'monedas': return monedas === monedasTotales;
      case 'maxInstrucciones': return instrucciones <= o.valor;
      case 'sinChoques': return choques === 0;
      case 'sinDanio': return danioRecibido === 0;
      case 'derrotarTodos': return enemigosDerrotados === enemigosTotales;
    }
  });

  return {
    gano,
    motivo,
    pasos,
    vida,
    vidaMax: stats.vidaMax,
    energiaRestante: energia,
    monedas,
    monedasTotales,
    choques,
    danioRecibido,
    enemigosDerrotados,
    enemigosTotales,
    instrucciones,
    objetivosCumplidos,
  };
}

// Lee el texto con las acciones míticas que permite el equipo y lo simula.
export function ejecutarTexto(
  mazmorra: Mazmorra,
  texto: string,
  equipo: Equipo,
): { lectura: Lectura; resultado: ResultadoSimulacion | null } {
  const lectura = leerPrograma(texto, estadisticas(equipo).accionesMiticas);
  if (!lectura.ok) return { lectura, resultado: null };
  return { lectura, resultado: simular(mazmorra, lectura.programa, lectura.instrucciones, equipo) };
}

// Camino más corto de la entrada a la puerta (para la Lupa del explorador).
// Evita muros y enemigos; devuelve [] si no hay camino.
export function caminoMasCorto(mazmorra: Mazmorra): [number, number][] {
  const { terreno, enemigos, inicio, puerta } = leerMapa(mazmorra);
  const clave = (f: number, c: number) => `${f},${c}`;
  const previo = new Map<string, string | null>([[clave(...inicio), null]]);
  const cola: [number, number][] = [inicio];
  const bloquea = (f: number, c: number) =>
    f < 0 || f >= terreno.length || c < 0 || c >= terreno[f].length || terreno[f][c] === 'muro' ||
    enemigos.some((e) => e.fila === f && e.col === c);

  while (cola.length > 0) {
    const [f, c] = cola.shift()!;
    if (f === puerta[0] && c === puerta[1]) break;
    for (const [df, dc] of Object.values(DELTA)) {
      const [nf, nc] = [f + df, c + dc];
      if (bloquea(nf, nc) || previo.has(clave(nf, nc))) continue;
      previo.set(clave(nf, nc), clave(f, c));
      cola.push([nf, nc]);
    }
  }

  if (!previo.has(clave(...puerta))) return [];
  const camino: [number, number][] = [];
  let actual: string | null = clave(...puerta);
  while (actual) {
    const [f, c] = actual.split(',').map(Number);
    camino.unshift([f, c]);
    actual = previo.get(actual) ?? null;
  }
  return camino;
}
