import { test } from 'node:test';
import assert from 'node:assert/strict';
import { usarAzarDePrueba } from '../src/lib/azar';
import { cargarContenido, cargarMazmorra, iniciarServidor, registrarUsuario, type Servidor } from './ayudantes';

// Mazmorra de prueba en el nivel 1 (reto 901): un pasillo S.P con dos extras.
//   'adelante()\nadelante()'                                  -> gana con los 2 extras
//   'girar_derecha()\ngirar_izquierda()\nadelante()\nadelante()' -> gana con 1 extra
const GANA_TODO = 'adelante()\nadelante()';
const GANA_UNO = 'girar_derecha()\ngirar_izquierda()\nadelante()\nadelante()';

async function preparar() {
  const s = await iniciarServidor();
  cargarContenido(s.base);
  cargarMazmorra(s.base, 1, 901, {
    mapa: ['S.P'],
    objetivosExtra: [{ tipo: 'sinChoques' }, { tipo: 'maxInstrucciones', valor: 2 }],
    objeto: 'daga_madera',
    solucion: GANA_TODO,
  });
  const usuario = await registrarUsuario(s);
  return { s, ...usuario };
}

const responder = (s: Servidor, token: string, programa: unknown) =>
  s.pedir('POST', '/retos/901/responder', { token, cuerpo: { programa } });

const completar = (s: Servidor, token: string) => s.pedir('POST', '/niveles/1/completar', { token });

function darObjeto(s: Servidor, userId: string, objetoId: string, mitico = false) {
  s.base.tablas.inventario.push({ user_id: userId, objeto_id: objetoId, nivel_id: 1, mitico, obtenido_at: s.base.ahora() });
}

// ---------- POST /retos/:id/responder ----------

test('mazmorra: un programa ganador se valida en el backend y guarda el detalle', async () => {
  const { s, token } = await preparar();
  try {
    const { status, cuerpo } = await responder(s, token, GANA_TODO);
    assert.equal(status, 200);
    assert.equal(cuerpo.correcta, true);
    assert.equal(cuerpo.error, null);
    assert.deepEqual(cuerpo.objetivosCumplidos, [true, true]);
    assert.equal(cuerpo.respuesta, undefined, 'nunca se envía la solución');
    const intento = s.base.tablas.intentos_retos[0];
    assert.equal(intento.correcto, true);
    assert.deepEqual((intento.detalle as any).objetivosCumplidos, [true, true]);
  } finally {
    await s.cerrar();
  }
});

test('mazmorra: un programa que no llega dice el motivo', async () => {
  const { s, token } = await preparar();
  try {
    const { cuerpo } = await responder(s, token, 'adelante()');
    assert.equal(cuerpo.correcta, false);
    assert.equal(cuerpo.motivo, 'Tu hechizo terminó antes de llegar a la puerta');
  } finally {
    await s.cerrar();
  }
});

test('mazmorra: un error de escritura devuelve la línea', async () => {
  const { s, token } = await preparar();
  try {
    const { status, cuerpo } = await responder(s, token, 'adelante()\navanzar()');
    assert.equal(status, 200);
    assert.equal(cuerpo.correcta, false);
    assert.equal(cuerpo.error.linea, 2);
  } finally {
    await s.cerrar();
  }
});

test('mazmorra: el programa debe ser texto', async () => {
  const { s, token } = await preparar();
  try {
    const { status, cuerpo } = await responder(s, token, 123);
    assert.equal(status, 400);
    assert.ok(cuerpo.campos.programa);
  } finally {
    await s.cerrar();
  }
});

test('mazmorra: un objeto equipado que no se tiene se ignora', async () => {
  const { s, token, id } = await preparar();
  try {
    const perfil = s.base.tablas.profiles.find((p) => p.id === id)!;
    perfil.equipo = { arma: null, armadura: null, amuleto: 'llave_maestra' };
    const { cuerpo } = await responder(s, token, 'atravesar()');
    assert.equal(cuerpo.correcta, false);
    assert.match(cuerpo.error.mensaje, /no tienes equipado/);
  } finally {
    await s.cerrar();
  }
});

// ---------- POST /niveles/:id/completar ----------

test('mazmorra: no se completa sin un intento ganador', async () => {
  const { s, token } = await preparar();
  try {
    await responder(s, token, 'adelante()');
    const { status } = await completar(s, token);
    assert.equal(status, 409);
  } finally {
    await s.cerrar();
  }
});

test('mazmorra: con 1 extra son 2 estrellas y no hay objeto', async () => {
  const { s, token } = await preparar();
  try {
    await responder(s, token, GANA_UNO);
    const { status, cuerpo } = await completar(s, token);
    assert.equal(status, 200);
    assert.equal(cuerpo.estrellas, 2);
    assert.equal(cuerpo.objetoGanado, null);
  } finally {
    await s.cerrar();
  }
});

test('mazmorra: con los 2 extras son 3 estrellas y gana el objeto normal', async () => {
  const { s, token, id } = await preparar();
  try {
    usarAzarDePrueba(() => 0.99);
    await responder(s, token, GANA_TODO);
    const { cuerpo } = await completar(s, token);
    assert.equal(cuerpo.estrellas, 3);
    assert.equal(cuerpo.objetoGanado.id, 'daga_madera');
    assert.equal(cuerpo.objetoGanado.mitico, false);
    assert.ok(s.base.tablas.inventario.some((f) => f.user_id === id && f.objeto_id === 'daga_madera'));
  } finally {
    await s.cerrar();
  }
});

test('mazmorra: con suerte el objeto sale mítico', async () => {
  const { s, token, id } = await preparar();
  try {
    usarAzarDePrueba(() => 0.01);
    await responder(s, token, GANA_TODO);
    const { cuerpo } = await completar(s, token);
    assert.equal(cuerpo.objetoGanado.mitico, true);
    assert.ok(s.base.tablas.inventario.some((f) => f.user_id === id && f.objeto_id === cuerpo.objetoGanado.id));
  } finally {
    await s.cerrar();
  }
});

test('mazmorra: repetir con el objeto ya ganado no da otro', async () => {
  const { s, token, id } = await preparar();
  try {
    darObjeto(s, id, 'daga_madera');
    await responder(s, token, GANA_TODO);
    const { cuerpo } = await completar(s, token);
    assert.equal(cuerpo.objetoGanado, null);
  } finally {
    await s.cerrar();
  }
});

test('mazmorra: la Corona del Rey da +50 % de XP', async () => {
  const { s, token, id } = await preparar();
  try {
    darObjeto(s, id, 'corona_rey', true);
    s.base.tablas.profiles.find((p) => p.id === id)!.equipo = { arma: null, armadura: null, amuleto: 'corona_rey' };
    await responder(s, token, GANA_UNO);
    const { cuerpo } = await completar(s, token);
    assert.equal(cuerpo.xpGanada, 75);
  } finally {
    await s.cerrar();
  }
});

// ---------- Inventario y equipo ----------

test('inventario: devuelve los objetos y el equipo', async () => {
  const { s, token, id } = await preparar();
  try {
    darObjeto(s, id, 'daga_madera');
    const { status, cuerpo } = await s.pedir('GET', '/inventario', { token });
    assert.equal(status, 200);
    assert.equal(cuerpo.objetos[0].id, 'daga_madera');
    assert.equal(cuerpo.objetos[0].nombre, 'Daga de madera');
    assert.deepEqual(cuerpo.equipo, { arma: null, armadura: null, amuleto: null });
  } finally {
    await s.cerrar();
  }
});

test('equipo: no se puede equipar un objeto que no se tiene', async () => {
  const { s, token } = await preparar();
  try {
    const { status, cuerpo } = await s.pedir('PATCH', '/me', { token, cuerpo: { equipo: { arma: 'daga_madera' } } });
    assert.equal(status, 400);
    assert.ok(cuerpo.campos.equipo);
  } finally {
    await s.cerrar();
  }
});

test('equipo: un objeto va solo en su espacio', async () => {
  const { s, token, id } = await preparar();
  try {
    darObjeto(s, id, 'daga_madera');
    const { status } = await s.pedir('PATCH', '/me', { token, cuerpo: { equipo: { amuleto: 'daga_madera' } } });
    assert.equal(status, 400);
  } finally {
    await s.cerrar();
  }
});

test('equipo: se guarda y aparece en el perfil', async () => {
  const { s, token, id } = await preparar();
  try {
    darObjeto(s, id, 'daga_madera');
    const { status, cuerpo } = await s.pedir('PATCH', '/me', { token, cuerpo: { equipo: { arma: 'daga_madera' } } });
    assert.equal(status, 200);
    assert.deepEqual(cuerpo.perfil.equipo, { arma: 'daga_madera', armadura: null, amuleto: null });
  } finally {
    await s.cerrar();
  }
});

// ---------- Pista avanzada ----------

test('pista avanzada: sin objeto responde 403', async () => {
  const { s, token } = await preparar();
  try {
    const { status } = await s.pedir('GET', '/retos/901/pista-avanzada', { token });
    assert.equal(status, 403);
  } finally {
    await s.cerrar();
  }
});

test('pista avanzada: el Pergamino muestra 2 líneas y el Ojo de Odín todo', async () => {
  const { s, token, id } = await preparar();
  try {
    const perfil = s.base.tablas.profiles.find((p) => p.id === id)!;
    darObjeto(s, id, 'pergamino_sabio');
    darObjeto(s, id, 'ojo_odin', true);

    perfil.equipo = { arma: null, armadura: null, amuleto: 'pergamino_sabio' };
    const pergamino = await s.pedir('GET', '/retos/901/pista-avanzada', { token });
    assert.equal(pergamino.status, 200);
    assert.equal(pergamino.cuerpo.lineas, 'adelante()\nadelante()');
    assert.equal(pergamino.cuerpo.completa, false);

    perfil.equipo = { arma: null, armadura: null, amuleto: 'ojo_odin' };
    const ojo = await s.pedir('GET', '/retos/901/pista-avanzada', { token });
    assert.equal(ojo.cuerpo.completa, true);
  } finally {
    await s.cerrar();
  }
});

test('mazmorra: el objeto ganado se equipa solo si su espacio está vacío', async () => {
  const { s, token, id } = await preparar();
  try {
    usarAzarDePrueba(() => 0.99);
    await responder(s, token, GANA_TODO);
    const { cuerpo } = await completar(s, token);
    assert.equal(cuerpo.objetoGanado.equipado, true);
    assert.equal(cuerpo.perfil.equipo.arma, 'daga_madera');
    assert.equal((s.base.tablas.profiles.find((p) => p.id === id)!.equipo as any).arma, 'daga_madera');
  } finally {
    await s.cerrar();
  }
});

test('mazmorra: el objeto ganado no reemplaza lo que ya llevas', async () => {
  const { s, token, id } = await preparar();
  try {
    usarAzarDePrueba(() => 0.99);
    darObjeto(s, id, 'hacha_guerra');
    s.base.tablas.profiles.find((p) => p.id === id)!.equipo = { arma: 'hacha_guerra', armadura: null, amuleto: null };
    await responder(s, token, GANA_TODO);
    const { cuerpo } = await completar(s, token);
    assert.equal(cuerpo.objetoGanado.equipado, false);
    assert.equal(cuerpo.perfil.equipo.arma, 'hacha_guerra');
  } finally {
    await s.cerrar();
  }
});
