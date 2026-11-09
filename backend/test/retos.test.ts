import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fechaLocal } from '../src/lib/progreso';
import {
  cargarContenido,
  esperar,
  iniciarServidor,
  registrarUsuario,
  responderBienNivel1,
  type Servidor,
} from './ayudantes';

async function preparar() {
  const s = await iniciarServidor();
  cargarContenido(s.base);
  const usuario = await registrarUsuario(s);
  return { s, ...usuario };
}

const responder = (s: Servidor, token: string, retoId: number, respuesta: unknown) =>
  s.pedir('POST', `/retos/${retoId}/responder`, { token, cuerpo: { respuesta } });

// ---------- POST /retos/:id/responder ----------

test('responder: una respuesta correcta devuelve la explicación y guarda el intento', async () => {
  const { s, token, id } = await preparar();
  try {
    const { status, cuerpo } = await responder(s, token, 101, 1);
    assert.equal(status, 200);
    assert.equal(cuerpo.correcta, true);
    assert.equal(cuerpo.explicacion, 'Bien hecho en el reto 101');
    assert.equal(cuerpo.pista, null);
    assert.equal(cuerpo.respuesta, undefined, 'nunca se envía la respuesta correcta');

    assert.equal(s.base.tablas.intentos_retos.length, 1);
    assert.deepEqual(
      {
        user_id: s.base.tablas.intentos_retos[0].user_id,
        reto_id: s.base.tablas.intentos_retos[0].reto_id,
        correcto: s.base.tablas.intentos_retos[0].correcto,
      },
      { user_id: id, reto_id: 101, correcto: true },
    );
  } finally {
    await s.cerrar();
  }
});

test('responder: una respuesta incorrecta devuelve la explicación del error y la pista', async () => {
  const { s, token } = await preparar();
  try {
    const { status, cuerpo } = await responder(s, token, 101, 0);
    assert.equal(status, 200);
    assert.equal(cuerpo.correcta, false);
    assert.equal(cuerpo.explicacion, 'Revisa el reto 101');
    assert.equal(cuerpo.pista, 'Pista del reto 101');
    assert.equal(s.base.tablas.intentos_retos[0].correcto, false);
  } finally {
    await s.cerrar();
  }
});

test('responder: los retos de ordenar comparan el orden completo', async () => {
  const { s, token } = await preparar();
  try {
    assert.equal((await responder(s, token, 102, [2, 0, 1])).cuerpo.correcta, true);
    assert.equal((await responder(s, token, 102, [0, 2, 1])).cuerpo.correcta, false);
  } finally {
    await s.cerrar();
  }
});

test('responder: rechaza respuestas con forma inválida sin guardar intento', async () => {
  const { s, token } = await preparar();
  try {
    const casos: [number, unknown][] = [
      [101, 7], // índice fuera de rango
      [101, 'b'], // no es número
      [101, [1]], // lista en un reto de opción múltiple
      [102, [0, 0, 1]], // opción repetida
      [102, [0, 1]], // faltan opciones
      [103, undefined], // sin respuesta
    ];
    for (const [retoId, respuesta] of casos) {
      const { status, cuerpo } = await responder(s, token, retoId, respuesta);
      assert.equal(status, 400, `reto ${retoId} con ${JSON.stringify(respuesta)}`);
      assert.ok(cuerpo.campos.respuesta);
    }
    assert.equal(s.base.tablas.intentos_retos.length, 0);
  } finally {
    await s.cerrar();
  }
});

test('responder: 403 en un nivel bloqueado y 404 si el reto no existe', async () => {
  const { s, token } = await preparar();
  try {
    assert.equal((await responder(s, token, 201, 0)).status, 403);
    assert.equal((await responder(s, token, 999, 0)).status, 404);
    assert.equal((await responder(s, token, 0, 0)).status, 400);
  } finally {
    await s.cerrar();
  }
});

// ---------- POST /niveles/:id/completar ----------

test('completar: 409 si faltan retos por acertar', async () => {
  const { s, token } = await preparar();
  try {
    await responder(s, token, 101, 1);
    await responder(s, token, 102, [0, 1, 2]); // mal
    const { status, cuerpo } = await s.pedir('POST', '/niveles/1/completar', { token });
    assert.equal(status, 409);
    assert.deepEqual(cuerpo.retosPendientes, [102, 103]);
    assert.equal(s.base.tablas.progreso_niveles.length, 0);
  } finally {
    await s.cerrar();
  }
});

test('completar: sin errores da 3 estrellas, XP, racha, hechizo y desbloquea el siguiente', async () => {
  const { s, token, id } = await preparar();
  try {
    await responderBienNivel1(s, token);
    const { status, cuerpo } = await s.pedir('POST', '/niveles/1/completar', { token });

    assert.equal(status, 200);
    assert.equal(cuerpo.primeraVez, true);
    assert.equal(cuerpo.errores, 0);
    assert.equal(cuerpo.estrellas, 3);
    assert.equal(cuerpo.xpGanada, 50);
    assert.equal(cuerpo.subioDeNivel, false);
    assert.equal(cuerpo.perfil.xp, 50);
    assert.deepEqual(cuerpo.racha, { actual: 1, maxima: 1, cambio: 'aumento' });
    assert.equal(cuerpo.perfil.ultimaActividad, fechaLocal(new Date()));
    assert.equal(cuerpo.hechizoDesbloqueado.nombre, 'Hechizo del Camino');
    assert.equal(cuerpo.siguienteNivelId, 2);

    assert.deepEqual(
      s.base.tablas.progreso_niveles.map((p) => [p.user_id, p.nivel_id, p.estrellas]),
      [[id, 1, 3]],
    );

    // El nivel 2 ya no está bloqueado.
    assert.equal((await responder(s, token, 201, 0)).status, 200);
  } finally {
    await s.cerrar();
  }
});

test('completar: los errores bajan las estrellas', async () => {
  const { s, token } = await preparar();
  try {
    await responder(s, token, 101, 0); // error 1
    await responder(s, token, 101, 2); // error 2
    await responderBienNivel1(s, token);
    const { cuerpo } = await s.pedir('POST', '/niveles/1/completar', { token });
    assert.equal(cuerpo.errores, 2);
    assert.equal(cuerpo.estrellas, 2);
  } finally {
    await s.cerrar();
  }
});

test('completar: al llegar a 100 XP sube de nivel', async () => {
  const { s, token } = await preparar();
  try {
    await responderBienNivel1(s, token);
    await s.pedir('POST', '/niveles/1/completar', { token });

    await responder(s, token, 201, 0);
    const { cuerpo } = await s.pedir('POST', '/niveles/2/completar', { token });
    assert.equal(cuerpo.perfil.xp, 100);
    assert.equal(cuerpo.subioDeNivel, true);
    assert.equal(cuerpo.nivelAnterior, 1);
    assert.equal(cuerpo.nivelNuevo, 2);
    assert.equal(cuerpo.perfil.nivel, 2);
    assert.equal(cuerpo.siguienteNivelId, null, 'era el último nivel');
  } finally {
    await s.cerrar();
  }
});

test('completar: repetir un nivel no da XP y guarda la mejor cantidad de estrellas', async () => {
  const { s, token } = await preparar();
  try {
    await responder(s, token, 101, 0); // 1 error -> 2 estrellas
    await responderBienNivel1(s, token);
    const primera = await s.pedir('POST', '/niveles/1/completar', { token });
    assert.equal(primera.cuerpo.estrellas, 2);

    // Sin responder de nuevo no se puede volver a completar.
    await esperar(5);
    assert.equal((await s.pedir('POST', '/niveles/1/completar', { token })).status, 409);

    // Segunda partida sin errores: 3 estrellas, pero 0 XP.
    await responderBienNivel1(s, token);
    const segunda = await s.pedir('POST', '/niveles/1/completar', { token });
    assert.equal(segunda.status, 200);
    assert.equal(segunda.cuerpo.primeraVez, false);
    assert.equal(segunda.cuerpo.estrellas, 3);
    assert.equal(segunda.cuerpo.mejoresEstrellas, 3);
    assert.equal(segunda.cuerpo.xpGanada, 0);
    assert.equal(segunda.cuerpo.perfil.xp, 50);
    assert.equal(segunda.cuerpo.hechizoDesbloqueado, null);

    // Tercera partida con muchos errores: se mantienen las 3 estrellas guardadas.
    await esperar(5);
    for (let i = 0; i < 3; i++) await responder(s, token, 101, 0);
    await responderBienNivel1(s, token);
    const tercera = await s.pedir('POST', '/niveles/1/completar', { token });
    assert.equal(tercera.cuerpo.estrellas, 1);
    assert.equal(tercera.cuerpo.mejoresEstrellas, 3);
    assert.equal(s.base.tablas.progreso_niveles[0].estrellas, 3);
  } finally {
    await s.cerrar();
  }
});

test('completar: la racha sube si jugó ayer y vuelve a 1 si faltó', async () => {
  const { s, token, id } = await preparar();
  try {
    const perfil = s.base.tablas.profiles.find((p) => p.id === id)!;
    const ayer = fechaLocal(new Date(Date.now() - 24 * 60 * 60 * 1000));
    Object.assign(perfil, { ultima_actividad: ayer, racha_actual: 4, racha_maxima: 4 });

    await responderBienNivel1(s, token);
    const conRacha = await s.pedir('POST', '/niveles/1/completar', { token });
    assert.deepEqual(conRacha.cuerpo.racha, { actual: 5, maxima: 5, cambio: 'aumento' });

    const haceTresDias = fechaLocal(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000));
    Object.assign(perfil, { ultima_actividad: haceTresDias });
    await responder(s, token, 201, 0);
    const sinRacha = await s.pedir('POST', '/niveles/2/completar', { token });
    assert.deepEqual(sinRacha.cuerpo.racha, { actual: 1, maxima: 5, cambio: 'reinicio' });
  } finally {
    await s.cerrar();
  }
});

test('completar: 403 en un nivel bloqueado y 404 si no existe', async () => {
  const { s, token } = await preparar();
  try {
    assert.equal((await s.pedir('POST', '/niveles/2/completar', { token })).status, 403);
    assert.equal((await s.pedir('POST', '/niveles/99/completar', { token })).status, 404);
  } finally {
    await s.cerrar();
  }
});
