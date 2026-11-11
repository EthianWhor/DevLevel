import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bloquesATexto, insertar, insertarDespues, mover, quitar, type Bloque } from '../../movil/src/juego/bloques';
import { leerPrograma } from '../src/lib/mazmorra/lector';

const programa: Bloque[] = [
  { id: 'a', tipo: 'asignar', variable: 'pasos', valor: 2 },
  {
    id: 'r',
    tipo: 'repetir',
    veces: 'pasos',
    cuerpo: [
      {
        id: 's',
        tipo: 'si',
        condicion: { sensor: 'hay_enemigo', negada: false },
        entonces: [{ id: 'x', tipo: 'accion', accion: 'atacar' }],
        sino: [{ id: 'y', tipo: 'accion', accion: 'adelante' }],
      },
    ],
  },
  {
    id: 'm',
    tipo: 'mientras',
    condicion: { sensor: 'en_salida', negada: true },
    cuerpo: [{ id: 'z', tipo: 'accion', accion: 'adelante' }],
  },
];

test('bloques: se convierten en el texto del lenguaje con sangría', () => {
  const { texto } = bloquesATexto(programa);
  assert.equal(
    texto,
    [
      'pasos = 2',
      'REPETIR pasos VECES',
      '  SI hay_enemigo ENTONCES',
      '    atacar()',
      '  SINO',
      '    adelante()',
      '  FIN',
      'FIN',
      'MIENTRAS NO en_salida HACER',
      '  adelante()',
      'FIN',
    ].join('\n'),
  );
});

test('bloques: el texto generado lo entiende el lector', () => {
  const lectura = leerPrograma(bloquesATexto(programa).texto);
  assert.ok(lectura.ok);
});

test('bloques: cada bloque sabe en qué línea quedó', () => {
  const { lineaPorId } = bloquesATexto(programa);
  assert.equal(lineaPorId.get('a'), 1);
  assert.equal(lineaPorId.get('x'), 4);
  assert.equal(lineaPorId.get('y'), 6);
  assert.equal(lineaPorId.get('z'), 10);
});

test('bloques: SI sin SINO no escribe SINO', () => {
  const { texto } = bloquesATexto([
    { id: 's', tipo: 'si', condicion: { sensor: 'hay_muro', negada: false }, entonces: [], sino: null },
  ]);
  assert.equal(texto, 'SI hay_muro ENTONCES\nFIN');
});

test('bloques: insertar al final o dentro de un bloque', () => {
  const nuevo: Bloque = { id: 'n', tipo: 'accion', accion: 'saltar' };
  const enRaiz = insertar(programa, null, nuevo);
  assert.equal(enRaiz[enRaiz.length - 1].id, 'n');

  const adentro = insertar(programa, { id: 's', rama: 'sino' }, nuevo);
  const si = (adentro[1] as Extract<Bloque, { tipo: 'repetir' }>).cuerpo[0] as Extract<Bloque, { tipo: 'si' }>;
  assert.deepEqual(si.sino?.map((b) => b.id), ['y', 'n']);
});

test('bloques: quitar un bloque anidado', () => {
  const sin = quitar(programa, 'x');
  const si = (sin[1] as Extract<Bloque, { tipo: 'repetir' }>).cuerpo[0] as Extract<Bloque, { tipo: 'si' }>;
  assert.equal(si.entonces.length, 0);
});

test('bloques: mover arriba y abajo dentro de su lista', () => {
  assert.deepEqual(mover(programa, 'm', -1).map((b) => b.id), ['a', 'm', 'r']);
  assert.deepEqual(mover(programa, 'a', -1).map((b) => b.id), ['a', 'r', 'm'], 'el primero no sube');
  assert.deepEqual(mover(programa, 'a', 1).map((b) => b.id), ['r', 'a', 'm']);
});

test('bloques: insertar justo después de un bloque anidado', () => {
  const nuevo: Bloque = { id: 'n', tipo: 'accion', accion: 'saltar' };
  const res = insertarDespues(programa, 'x', nuevo);
  const si = (res[1] as Extract<Bloque, { tipo: 'repetir' }>).cuerpo[0] as Extract<Bloque, { tipo: 'si' }>;
  assert.deepEqual(si.entonces.map((b) => b.id), ['x', 'n']);
});
