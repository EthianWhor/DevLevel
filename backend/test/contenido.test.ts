import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAZMORRAS } from '../src/lib/mazmorra/contenido';
import { EQUIPO_VACIO, OBJETOS } from '../src/lib/mazmorra/objetos';
import { ejecutarTexto } from '../src/lib/mazmorra/simulador';

test('contenido: hay una mazmorra por cada uno de los 15 niveles', () => {
  assert.deepEqual(
    MAZMORRAS.map((m) => m.nivelId),
    Array.from({ length: 15 }, (_, i) => i + 1),
  );
});

test('contenido: los 15 objetos son normales y distintos', () => {
  const objetos = MAZMORRAS.map((m) => m.mazmorra.objeto);
  assert.equal(new Set(objetos).size, 15);
  for (const id of objetos) assert.equal(OBJETOS[id]?.mitico, false, id);
});

test('contenido: el modo del editor sigue la unidad', () => {
  for (const { nivelId, mazmorra } of MAZMORRAS) {
    const esperado = nivelId <= 6 ? 'bloques' : nivelId <= 9 ? 'mixto' : 'texto';
    assert.equal(mazmorra.modo, esperado, `nivel ${nivelId}`);
  }
});

test('contenido: mapas rectangulares de hasta 8x8 con una entrada y una puerta', () => {
  for (const { nivelId, mazmorra } of MAZMORRAS) {
    const { mapa } = mazmorra;
    assert.ok(mapa.length <= 8, `nivel ${nivelId}: alto`);
    assert.ok(mapa.every((f) => f.length === mapa[0].length && f.length <= 8), `nivel ${nivelId}: ancho`);
    const todo = mapa.join('');
    assert.equal(todo.split('S').length - 1, 1, `nivel ${nivelId}: S`);
    assert.equal(todo.split('P').length - 1, 1, `nivel ${nivelId}: P`);
    assert.equal(mazmorra.objetivosExtra.length, 2, `nivel ${nivelId}: extras`);
  }
});

for (const { nivelId, mazmorra, solucion, solucionExtras, equipoExtras } of MAZMORRAS) {
  test(`contenido: nivel ${nivelId} se gana sin objetos`, () => {
    const { lectura, resultado } = ejecutarTexto(mazmorra, solucion, EQUIPO_VACIO);
    assert.ok(lectura.ok, lectura.ok ? '' : lectura.error.mensaje);
    assert.equal(resultado?.gano, true, resultado?.motivo ?? '');
  });

  test(`contenido: nivel ${nivelId} permite cumplir los dos extras`, () => {
    // Solo con objetos normales de mazmorras anteriores.
    const anteriores = new Set(MAZMORRAS.filter((m) => m.nivelId < nivelId).map((m) => m.mazmorra.objeto));
    for (const id of Object.values(equipoExtras)) {
      if (id) assert.ok(anteriores.has(id), `nivel ${nivelId}: ${id} no se gana antes`);
    }
    const { lectura, resultado } = ejecutarTexto(mazmorra, solucionExtras, equipoExtras);
    assert.ok(lectura.ok, lectura.ok ? '' : lectura.error.mensaje);
    assert.equal(resultado?.gano, true, resultado?.motivo ?? '');
    assert.deepEqual(resultado?.objetivosCumplidos, [true, true]);
  });
}
