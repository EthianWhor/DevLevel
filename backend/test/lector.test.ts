import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leerPrograma } from '../src/lib/mazmorra/lector';

function ok(texto: string, miticas?: Set<any>) {
  const r = leerPrograma(texto, miticas);
  if (!r.ok) throw new Error(`Se esperaba ok y dio: ${r.error.mensaje}`);
  return r;
}

function error(texto: string) {
  const r = leerPrograma(texto);
  if (r.ok) throw new Error('Se esperaba un error');
  return r.error;
}

test('lector: lee acciones simples y cuenta instrucciones', () => {
  const r = ok('adelante()\ngirar_derecha()');
  assert.equal(r.instrucciones, 2);
  assert.deepEqual(
    r.programa.map((i) => (i.tipo === 'accion' ? i.accion : i.tipo)),
    ['adelante', 'girar_derecha'],
  );
  assert.equal(r.programa[1].linea, 2);
});

test('lector: SI / SINO / FIN en minúsculas', () => {
  const r = ok('si hay_muro entonces\n  girar_izquierda()\nsino\n  adelante()\nfin');
  const si = r.programa[0];
  assert.equal(si.tipo, 'si');
  if (si.tipo !== 'si') return;
  assert.deepEqual(si.condicion, { sensor: 'hay_muro', negada: false });
  assert.equal(si.entonces.length, 1);
  assert.equal(si.sino.length, 1);
  assert.equal(r.instrucciones, 3);
});

test('lector: REPETIR con número', () => {
  const r = ok('REPETIR 3 VECES\nadelante()\nFIN');
  const rep = r.programa[0];
  assert.equal(rep.tipo, 'repetir');
  if (rep.tipo !== 'repetir') return;
  assert.deepEqual(rep.veces, { numero: 3 });
  assert.equal(rep.cuerpo.length, 1);
  assert.equal(r.instrucciones, 2);
});

test('lector: variable usada en REPETIR', () => {
  const r = ok('pasos = 4\nREPETIR pasos VECES\nadelante()\nFIN');
  assert.deepEqual(r.programa[0], { tipo: 'asignar', variable: 'pasos', valor: 4, linea: 1 });
  const rep = r.programa[1];
  assert.ok(rep.tipo === 'repetir' && 'variable' in rep.veces && rep.veces.variable === 'pasos');
});

test('lector: MIENTRAS con NO', () => {
  const r = ok('MIENTRAS NO en_salida HACER\nadelante()\nFIN');
  const m = r.programa[0];
  assert.ok(m.tipo === 'mientras');
  if (m.tipo !== 'mientras') return;
  assert.deepEqual(m.condicion, { sensor: 'en_salida', negada: true });
});

test('lector: FUNCION y llamada, con tildes y minúsculas', () => {
  const r = ok('función esquivar()\ngirar_derecha()\nfin\nesquivar()');
  assert.equal(r.programa[0].tipo, 'funcion');
  assert.deepEqual(r.programa[1], { tipo: 'llamada', nombre: 'esquivar', linea: 4 });
});

test('lector: comentarios y líneas vacías no cuentan', () => {
  const r = ok('// empezar\n\nadelante() // un paso');
  assert.equal(r.instrucciones, 1);
});

test('lector: programa vacío es válido y sin instrucciones', () => {
  const r = ok('   \n// nada');
  assert.equal(r.instrucciones, 0);
  assert.equal(r.programa.length, 0);
});

test('lector: falta FIN', () => {
  const e = error('REPETIR 3 VECES\nadelante()');
  assert.equal(e.linea, 1);
  assert.equal(e.mensaje, 'Línea 1: falta FIN para cerrar el REPETIR');
});

test('lector: sugiere la instrucción parecida', () => {
  const e = error('avanzar()');
  assert.equal(e.linea, 1);
  assert.match(e.mensaje, /¿Quisiste decir 'adelante\(\)'\?/);
});

test('lector: instrucción mítica sin el objeto', () => {
  const e = error('invocar_rayo()');
  assert.match(e.mensaje, /no tienes equipado el Rayo de Zeus/);
});

test('lector: instrucción mítica con el objeto equipado', () => {
  const r = ok('invocar_rayo()', new Set(['invocar_rayo']));
  assert.equal(r.instrucciones, 1);
});

test('lector: función sin declarar', () => {
  const e = error('esquivar()');
  assert.match(e.mensaje, /no existe la función 'esquivar'/);
});

test('lector: variable sin valor', () => {
  const e = error('REPETIR n VECES\nadelante()\nFIN');
  assert.match(e.mensaje, /la variable 'n' no tiene valor/);
});

test('lector: número fuera de rango', () => {
  const e = error('REPETIR 100 VECES\nadelante()\nFIN');
  assert.match(e.mensaje, /entre 0 y 99/);
});

test('lector: FIN sobrante', () => {
  const e = error('adelante()\nFIN');
  assert.equal(e.mensaje, 'Línea 2: sobra este FIN');
});

test('lector: condición desconocida', () => {
  const e = error('SI hay_dragon ENTONCES\nadelante()\nFIN');
  assert.match(e.mensaje, /Línea 1: no conozco la condición 'hay_dragon'/);
});
