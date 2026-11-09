import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calcularEstrellas,
  calcularRacha,
  diasEntre,
  fechaLocal,
  nivelPorXp,
  resumirIntentos,
} from '../src/lib/progreso';

test('nivelPorXp sube un nivel cada 100 XP', () => {
  assert.equal(nivelPorXp(0), 1);
  assert.equal(nivelPorXp(99), 1);
  assert.equal(nivelPorXp(100), 2);
  assert.equal(nivelPorXp(250), 3);
  assert.equal(nivelPorXp(750), 8);
});

test('calcularEstrellas: 0 errores = 3, 1-2 = 2, 3 o más = 1', () => {
  assert.equal(calcularEstrellas(0), 3);
  assert.equal(calcularEstrellas(1), 2);
  assert.equal(calcularEstrellas(2), 2);
  assert.equal(calcularEstrellas(3), 1);
  assert.equal(calcularEstrellas(10), 1);
});

test('calcularRacha: primera vez empieza en 1', () => {
  assert.deepEqual(calcularRacha(null, '2026-11-09', 0), { racha: 1, cambio: 'aumento' });
});

test('calcularRacha: si ya jugó hoy no cambia', () => {
  assert.deepEqual(calcularRacha('2026-11-09', '2026-11-09', 4), { racha: 4, cambio: 'igual' });
});

test('calcularRacha: si jugó ayer sube 1, también entre meses', () => {
  assert.deepEqual(calcularRacha('2026-11-08', '2026-11-09', 4), { racha: 5, cambio: 'aumento' });
  assert.deepEqual(calcularRacha('2026-10-31', '2026-11-01', 2), { racha: 3, cambio: 'aumento' });
});

test('calcularRacha: si faltó un día vuelve a 1', () => {
  assert.deepEqual(calcularRacha('2026-11-07', '2026-11-09', 6), { racha: 1, cambio: 'reinicio' });
});

test('fechaLocal usa la hora de Colombia, no UTC', () => {
  // 3:00 a. m. UTC del 10 de noviembre = 10:00 p. m. del 9 en Bogotá.
  assert.equal(fechaLocal(new Date('2026-11-10T03:00:00Z')), '2026-11-09');
  assert.equal(fechaLocal(new Date('2026-11-10T05:00:00Z')), '2026-11-10');
});

test('diasEntre cuenta días de calendario', () => {
  assert.equal(diasEntre('2026-11-08', '2026-11-09'), 1);
  assert.equal(diasEntre('2026-12-31', '2027-01-01'), 1);
});

test('resumirIntentos cuenta solo los errores antes del primer acierto', () => {
  const resumen = resumirIntentos(
    [1, 2, 3],
    [
      { reto_id: 1, correcto: false },
      { reto_id: 1, correcto: true },
      { reto_id: 1, correcto: false }, // después de acertar: no cuenta
      { reto_id: 2, correcto: true },
      { reto_id: 3, correcto: false },
      { reto_id: 99, correcto: false }, // otro nivel: no cuenta
    ],
  );
  assert.equal(resumen.errores, 1);
  assert.deepEqual(resumen.faltantes, [3]);
});
