import { test } from 'node:test';
import assert from 'node:assert/strict';
import { iniciarServidor, registrarUsuario } from './ayudantes';

test('POST /auth/register valida correo y contraseña con errores por campo', async () => {
  const s = await iniciarServidor();
  try {
    const { status, cuerpo } = await s.pedir('POST', '/auth/register', {
      cuerpo: { email: 'no-es-correo', password: '123' },
    });
    assert.equal(status, 400);
    assert.ok(cuerpo.campos.email);
    assert.ok(cuerpo.campos.password);
  } finally {
    await s.cerrar();
  }
});

test('POST /auth/register crea la cuenta, el perfil y devuelve la sesión', async () => {
  const s = await iniciarServidor();
  try {
    const { status, cuerpo } = await s.pedir('POST', '/auth/register', {
      cuerpo: { email: '  Ada@Correo.com ', password: 'contrasena123' },
    });
    assert.equal(status, 201);
    assert.ok(cuerpo.sesion.token);
    assert.ok(cuerpo.sesion.refreshToken);
    assert.equal(cuerpo.usuario.email, 'ada@correo.com');
    assert.deepEqual(
      { xp: cuerpo.perfil.xp, nivel: cuerpo.perfil.nivel, nombreHeroe: cuerpo.perfil.nombreHeroe },
      { xp: 0, nivel: 1, nombreHeroe: null },
    );
    assert.equal(s.base.tablas.profiles.length, 1);
  } finally {
    await s.cerrar();
  }
});

test('POST /auth/register responde 409 si el correo ya existe', async () => {
  const s = await iniciarServidor();
  try {
    const datos = { email: 'repetido@correo.com', password: 'contrasena123' };
    await s.pedir('POST', '/auth/register', { cuerpo: datos });
    const { status, cuerpo } = await s.pedir('POST', '/auth/register', { cuerpo: datos });
    assert.equal(status, 409);
    assert.ok(cuerpo.campos.email);
  } finally {
    await s.cerrar();
  }
});

test('POST /auth/login inicia sesión y rechaza la contraseña incorrecta', async () => {
  const s = await iniciarServidor();
  try {
    const { email } = await registrarUsuario(s);

    const bien = await s.pedir('POST', '/auth/login', {
      cuerpo: { email: email.toUpperCase(), password: 'contrasena123' },
    });
    assert.equal(bien.status, 200);
    assert.ok(bien.cuerpo.sesion.token);
    assert.ok(bien.cuerpo.perfil);

    const mal = await s.pedir('POST', '/auth/login', {
      cuerpo: { email, password: 'otra-contrasena' },
    });
    assert.equal(mal.status, 401);
    assert.equal(mal.cuerpo.error, 'Correo o contraseña incorrectos');

    const noExiste = await s.pedir('POST', '/auth/login', {
      cuerpo: { email: 'nadie@correo.com', password: 'contrasena123' },
    });
    assert.equal(noExiste.status, 401);
    assert.equal(noExiste.cuerpo.error, mal.cuerpo.error);
  } finally {
    await s.cerrar();
  }
});

test('POST /auth/refresh entrega un token nuevo y el refresh token se usa una vez', async () => {
  const s = await iniciarServidor();
  try {
    const registro = await s.pedir('POST', '/auth/register', {
      cuerpo: { email: 'refresh@correo.com', password: 'contrasena123' },
    });
    const refreshToken = registro.cuerpo.sesion.refreshToken;

    const primero = await s.pedir('POST', '/auth/refresh', { cuerpo: { refreshToken } });
    assert.equal(primero.status, 200);
    assert.notEqual(primero.cuerpo.sesion.token, registro.cuerpo.sesion.token);

    const segundo = await s.pedir('POST', '/auth/refresh', { cuerpo: { refreshToken } });
    assert.equal(segundo.status, 401);
  } finally {
    await s.cerrar();
  }
});

test('las rutas protegidas responden 401 sin token o con un token inválido', async () => {
  const s = await iniciarServidor();
  try {
    assert.equal((await s.pedir('GET', '/me')).status, 401);
    assert.equal((await s.pedir('GET', '/me', { token: 'token-falso' })).status, 401);
    assert.equal((await s.pedir('GET', '/mapa')).status, 401);
    assert.equal((await s.pedir('POST', '/retos/1/responder', { cuerpo: { respuesta: 0 } })).status, 401);
    assert.equal((await s.pedir('POST', '/niveles/1/completar')).status, 401);
  } finally {
    await s.cerrar();
  }
});

test('GET /me y PATCH /me leen y actualizan el perfil', async () => {
  const s = await iniciarServidor();
  try {
    const { token, email } = await registrarUsuario(s);

    const me = await s.pedir('GET', '/me', { token });
    assert.equal(me.status, 200);
    assert.equal(me.cuerpo.usuario.email, email);

    const cambio = await s.pedir('PATCH', '/me', {
      token,
      cuerpo: { nombreHeroe: '  Ada  ', avatar: 'mago', xp: 9999 },
    });
    assert.equal(cambio.status, 200);
    assert.equal(cambio.cuerpo.perfil.nombreHeroe, 'Ada');
    assert.equal(cambio.cuerpo.perfil.avatar, 'mago');
    assert.equal(cambio.cuerpo.perfil.xp, 0, 'la XP no se puede cambiar desde la app');

    const invalido = await s.pedir('PATCH', '/me', {
      token,
      cuerpo: { nombreHeroe: 'A', avatar: 'dragon' },
    });
    assert.equal(invalido.status, 400);
    assert.ok(invalido.cuerpo.campos.nombreHeroe);
    assert.ok(invalido.cuerpo.campos.avatar);
  } finally {
    await s.cerrar();
  }
});
