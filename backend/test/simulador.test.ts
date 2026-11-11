import { test } from 'node:test';
import assert from 'node:assert/strict';
import { caminoMasCorto, ejecutarTexto } from '../src/lib/mazmorra/simulador';
import { EQUIPO_VACIO } from '../src/lib/mazmorra/objetos';
import type { Direccion, Equipo, Mazmorra, ObjetivoExtra } from '../src/lib/mazmorra/tipos';

function m(mapa: string[], opciones: { dir?: Direccion; energia?: number; extras?: ObjetivoExtra[] } = {}): Mazmorra {
  return {
    nombre: 'Prueba',
    historia: '',
    modo: 'texto',
    mapa,
    direccionInicial: opciones.dir ?? 'este',
    energia: opciones.energia ?? 20,
    instrucciones: [],
    objetivosExtra: opciones.extras ?? [],
    objeto: 'daga_madera',
    pista: '',
  };
}

function correr(mazmorra: Mazmorra, texto: string, equipo: Partial<Equipo> = {}) {
  const { lectura, resultado } = ejecutarTexto(mazmorra, texto, { ...EQUIPO_VACIO, ...equipo });
  if (!lectura.ok) throw new Error(lectura.error.mensaje);
  return resultado!;
}

const pasillo = m(['S.P']);

test('simulador: llega a la puerta y se detiene', () => {
  const r = correr(pasillo, 'adelante()\nadelante()\nadelante()\nadelante()');
  assert.equal(r.gano, true);
  assert.equal(r.motivo, null);
  assert.equal(r.energiaRestante, 18, 'las acciones después de la puerta no gastan energía');
});

test('simulador: programa vacío no llega', () => {
  const r = correr(pasillo, '');
  assert.equal(r.gano, false);
  assert.equal(r.motivo, 'Tu hechizo terminó antes de llegar a la puerta');
});

test('simulador: chocar contra un muro no mueve y gasta energía', () => {
  const r = correr(m(['S#P']), 'adelante()');
  assert.equal(r.choques, 1);
  assert.equal(r.energiaRestante, 19);
  assert.equal(r.pasos[0].tipo, 'chocar');
  assert.equal(r.pasos[0].col, 0);
});

test('simulador: el borde del mapa es como un muro', () => {
  const r = correr(m(['S.P'], { dir: 'norte' }), 'adelante()');
  assert.equal(r.choques, 1);
});

test('simulador: pisar pinchos quita 1 de vida; con capa de viajero no', () => {
  assert.equal(correr(m(['S^.P']), 'adelante()').vida, 2);
  assert.equal(correr(m(['S^.P']), 'adelante()', { armadura: 'capa_viajero' }).vida, 3);
});

test('simulador: saltar pasa por encima de los pinchos', () => {
  const r = correr(m(['S^.P']), 'saltar()\nadelante()');
  assert.equal(r.gano, true);
  assert.equal(r.vida, 3);
});

test('simulador: no se puede saltar un muro', () => {
  const r = correr(m(['S#.P']), 'saltar()');
  assert.equal(r.pasos[0].tipo, 'chocar');
  assert.equal(r.choques, 1);
});

test('simulador: atacar derrota a un goblin', () => {
  const r = correr(m(['SgP']), 'atacar()\nadelante()\nadelante()', { arma: null });
  assert.equal(r.enemigosDerrotados, 1);
  assert.equal(r.gano, true);
});

test('simulador: un orco sobrevive al primer golpe y contraataca', () => {
  const r = correr(m(['SoP']), 'atacar()');
  assert.equal(r.vida, 2);
  assert.equal(r.pasos.some((p) => p.tipo === 'golpeRecibido'), true);
});

test('simulador: avanzar hacia un enemigo bloquea y recibe golpe', () => {
  const r = correr(m(['SgP']), 'adelante()');
  assert.equal(r.pasos[0].tipo, 'bloqueado');
  assert.equal(r.vida, 2);
});

test('simulador: sin vida se pierde', () => {
  const r = correr(m(['SkP']), 'adelante()\nadelante()');
  assert.equal(r.gano, false);
  assert.equal(r.motivo, 'Perdiste toda tu vida');
});

test('simulador: sin energía se pierde', () => {
  const r = correr(m(['S...P'], { energia: 2 }), 'adelante()\nadelante()\nadelante()');
  assert.equal(r.motivo, 'Te quedaste sin energía');
});

test('simulador: un MIENTRAS sin fin se corta', () => {
  const r = correr(m(['...', '.S.', '..P']), 'MIENTRAS NO hay_muro HACER\ngirar_derecha()\nFIN', {
    amuleto: 'anillo_mana',
  });
  assert.equal(r.gano, false);
  assert.equal(r.motivo, 'El hechizo se repitió demasiadas veces');
});

test('simulador: REPETIR con variable y SI con sensor', () => {
  const texto = 'pasos = 2\nREPETIR pasos VECES\nSI hay_muro ENTONCES\ngirar_derecha()\nSINO\nadelante()\nFIN\nFIN';
  const r = correr(m(['S.P']), texto);
  assert.equal(r.gano, true);
});

test('simulador: FUNCION se ejecuta al llamarla', () => {
  const r = correr(m(['S..P']), 'FUNCION dos()\nadelante()\nadelante()\nFIN\ndos()\nadelante()');
  assert.equal(r.gano, true);
});

test('simulador: recoger moneda y objetivos extra', () => {
  const mazmorra = m(['SC.P'], {
    extras: [{ tipo: 'monedas' }, { tipo: 'maxInstrucciones', valor: 3 }, { tipo: 'sinChoques' }, { tipo: 'sinDanio' }],
  });
  const r = correr(mazmorra, 'adelante()\nrecoger()\nREPETIR 2 VECES\nadelante()\nFIN');
  assert.equal(r.gano, true);
  assert.equal(r.monedas, 1);
  assert.deepEqual(r.objetivosCumplidos, [true, false, true, true]);
});

test('simulador: derrotarTodos', () => {
  const mazmorra = m(['SgP'], { extras: [{ tipo: 'derrotarTodos' }] });
  assert.deepEqual(correr(mazmorra, 'atacar()\nadelante()\nadelante()').objetivosCumplidos, [true]);
});

test('simulador: si pierde, ningún objetivo extra se cumple', () => {
  const mazmorra = m(['S.P'], { extras: [{ tipo: 'sinChoques' }] });
  assert.deepEqual(correr(mazmorra, 'adelante()').objetivosCumplidos, [false]);
});

// ---------- Objetos normales ----------

test('objetos: lanza larga golpea a 2 casillas', () => {
  const r = correr(m(['S.gP']), 'atacar()', { arma: 'lanza_larga' });
  assert.equal(r.enemigosDerrotados, 1);
});

test('objetos: escudo rúnico bloquea el primer golpe', () => {
  const r = correr(m(['SoP']), 'atacar()', { armadura: 'escudo_runico' });
  assert.equal(r.vida, 3);
});

test('objetos: anillo de maná hace gratis los giros', () => {
  const r = correr(m(['S.P']), 'girar_derecha()\ngirar_izquierda()', { amuleto: 'anillo_mana' });
  assert.equal(r.energiaRestante, 20);
});

test('objetos: amuleto de vida cura al recoger sin pasar del máximo', () => {
  const r = correr(m(['S^C.P']), 'adelante()\nadelante()\nrecoger()', { amuleto: 'amuleto_vida' });
  assert.equal(r.vida, 3);
});

test('objetos: botas veloces dan +5 de energía', () => {
  assert.equal(correr(pasillo, 'girar_derecha()', { amuleto: 'botas_veloces' }).energiaRestante, 24);
});

test('objetos: casco de hierro da +1 vida y +1 energía', () => {
  const r = correr(pasillo, 'girar_derecha()', { armadura: 'casco_hierro' });
  assert.equal(r.vidaMax, 4);
  assert.equal(r.energiaRestante, 20);
});

test('objetos: camino más corto en un mapa en L', () => {
  assert.deepEqual(caminoMasCorto(m(['S.#', '#.P'])), [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 2],
  ]);
});

// ---------- Míticos ----------

test('mítico: Rayo de Zeus quita un tercio de vida a todos', () => {
  const r = correr(m(['SkP']), 'invocar_rayo()', { amuleto: 'rayo_zeus' });
  assert.equal(r.pasos[0].tipo, 'rayo');
  assert.equal(r.pasos[0].enemigos[0].vida, 2);
});

test('mítico: Martillo de Thor +3 de ataque y golpea al de atrás', () => {
  const r = correr(m(['SkgP']), 'atacar()', { arma: 'martillo_thor' });
  assert.equal(r.enemigosDerrotados, 2);
});

test('mítico: Égida de Atenea ignora 3 golpes', () => {
  const r = correr(m(['SkP']), 'adelante()\nadelante()\nadelante()', { armadura: 'egida_atenea' });
  assert.equal(r.vida, 3);
});

test('mítico: Cáliz del Fénix revive una vez', () => {
  const r = correr(m(['SkP']), 'adelante()\nadelante()', { armadura: 'caliz_fenix' });
  assert.equal(r.pasos.some((p) => p.tipo === 'revivir'), true);
  assert.equal(r.vida, 3);
});

test('mítico: Reloj de Cronos duplica la energía', () => {
  assert.equal(correr(pasillo, 'girar_derecha()', { amuleto: 'reloj_cronos' }).energiaRestante, 39);
});

test('mítico: Sandalias de Hermes vuelan sobre un enemigo', () => {
  const r = correr(m(['Sg.P']), 'volar()\nadelante()', { amuleto: 'sandalias_hermes' });
  assert.equal(r.gano, true);
  assert.equal(r.vida, 3);
});

test('mítico: Capa de Sombras evita el contraataque', () => {
  assert.equal(correr(m(['SoP']), 'atacar()', { armadura: 'capa_sombras' }).vida, 3);
});

test('mítico: Llave Maestra atraviesa un muro', () => {
  const r = correr(m(['S#P']), 'atravesar()\nadelante()', { amuleto: 'llave_maestra' });
  assert.equal(r.gano, true);
});
