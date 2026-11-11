import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cargarContenido, iniciarServidor, registrarUsuario, responderBienNivel1 } from './ayudantes';

async function preparar() {
  const s = await iniciarServidor();
  cargarContenido(s.base);
  const usuario = await registrarUsuario(s);
  return { s, ...usuario };
}

test('hechizos: sin sesión responde 401', async () => {
  const s = await iniciarServidor();
  try {
    const { status } = await s.pedir('GET', '/hechizos');
    assert.equal(status, 401);
  } finally {
    await s.cerrar();
  }
});

test('hechizos: un usuario nuevo tiene todos los hechizos bloqueados y sin contenido', async () => {
  const { s, token } = await preparar();
  try {
    const { status, cuerpo } = await s.pedir('GET', '/hechizos', { token });
    assert.equal(status, 200);
    assert.deepEqual(cuerpo.resumen, { desbloqueados: 0, total: 2 });
    assert.equal(cuerpo.unidades.length, 1);

    const [primero, segundo] = cuerpo.unidades[0].hechizos;
    assert.equal(primero.nivelTitulo, '¿Qué es un algoritmo?');
    assert.equal(primero.desbloqueado, false);
    assert.equal(primero.nombre, null, 'no revela el hechizo antes de ganarlo');
    assert.equal(primero.conceptoTexto, null);
    assert.equal(segundo.desbloqueado, false);
  } finally {
    await s.cerrar();
  }
});

test('hechizos: al completar un nivel se desbloquea su hechizo con el concepto', async () => {
  const { s, token } = await preparar();
  try {
    await responderBienNivel1(s, token);
    const completar = await s.pedir('POST', '/niveles/1/completar', { token });
    assert.equal(completar.status, 200);

    const { status, cuerpo } = await s.pedir('GET', '/hechizos', { token });
    assert.equal(status, 200);
    assert.deepEqual(cuerpo.resumen, { desbloqueados: 1, total: 2 });

    const [primero, segundo] = cuerpo.unidades[0].hechizos;
    assert.deepEqual(
      {
        nivelId: primero.nivelId,
        desbloqueado: primero.desbloqueado,
        estrellas: primero.estrellas,
        nombre: primero.nombre,
        descripcion: primero.descripcion,
        conceptoTitulo: primero.conceptoTitulo,
        conceptoTexto: primero.conceptoTexto,
      },
      {
        nivelId: 1,
        desbloqueado: true,
        estrellas: 3,
        nombre: 'Hechizo del Camino',
        descripcion: 'Convierte un problema en pasos.',
        conceptoTitulo: 'Algoritmo',
        conceptoTexto: 'Lista de pasos',
      },
    );
    assert.equal(segundo.desbloqueado, false);
    assert.equal(segundo.nombre, null);
  } finally {
    await s.cerrar();
  }
});

test('hechizos: cada usuario ve solo su propio progreso', async () => {
  const { s, token } = await preparar();
  try {
    await responderBienNivel1(s, token);
    await s.pedir('POST', '/niveles/1/completar', { token });

    const otro = await registrarUsuario(s);
    const { cuerpo } = await s.pedir('GET', '/hechizos', { token: otro.token });
    assert.equal(cuerpo.resumen.desbloqueados, 0);
  } finally {
    await s.cerrar();
  }
});
