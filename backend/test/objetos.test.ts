import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IDS_MITICOS, OBJETOS, probabilidadMitico, sortearObjeto } from '../src/lib/mazmorra/objetos';

test('objetos: hay 15 normales y 10 míticos', () => {
  const todos = Object.values(OBJETOS);
  assert.equal(todos.filter((o) => !o.mitico).length, 15);
  assert.equal(todos.filter((o) => o.mitico).length, 10);
  assert.equal(IDS_MITICOS.length, 10);
});

test('objetos: probabilidad del mítico baja un quinto por cada uno', () => {
  assert.equal(probabilidadMitico(0), 0.1);
  assert.ok(Math.abs(probabilidadMitico(1) - 0.08) < 1e-9);
  assert.ok(Math.abs(probabilidadMitico(2) - 0.064) < 1e-9);
});

test('objetos: con suerte sale un mítico en lugar del normal', () => {
  const id = sortearObjeto('daga_madera', [], () => 0.05);
  assert.equal(OBJETOS[id].mitico, true);
});

test('objetos: sin suerte sale el objeto normal', () => {
  assert.equal(sortearObjeto('daga_madera', [], () => 0.5), 'daga_madera');
});

test('objetos: la probabilidad tiene en cuenta los míticos que ya tiene', () => {
  // Con 1 mítico la probabilidad es 8 %: 0.09 ya no alcanza.
  assert.equal(sortearObjeto('daga_madera', ['rayo_zeus'], () => 0.09), 'daga_madera');
});

test('objetos: nunca repite un mítico', () => {
  const tiene = IDS_MITICOS.slice(0, 9);
  const id = sortearObjeto('daga_madera', tiene, () => 0);
  assert.equal(id, IDS_MITICOS[9]);
});

test('objetos: con los 10 míticos ya no sale ninguno', () => {
  assert.equal(sortearObjeto('daga_madera', [...IDS_MITICOS], () => 0), 'daga_madera');
});
