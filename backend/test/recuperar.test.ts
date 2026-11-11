import { test } from 'node:test';
import assert from 'node:assert/strict';
import { iniciarServidor, registrarUsuario } from './ayudantes';

// ---------- POST /auth/recuperar ----------

test('recuperar: valida el correo con error por campo', async () => {
  const s = await iniciarServidor();
  try {
    const { status, cuerpo } = await s.pedir('POST', '/auth/recuperar', { cuerpo: { email: 'no-es-correo' } });
    assert.equal(status, 400);
    assert.ok(cuerpo.campos.email);
  } finally {
    await s.cerrar();
  }
});

test('recuperar: responde lo mismo exista o no la cuenta, y solo envía código si existe', async () => {
  const s = await iniciarServidor();
  try {
    const { email } = await registrarUsuario(s);

    const existe = await s.pedir('POST', '/auth/recuperar', { cuerpo: { email } });
    const noExiste = await s.pedir('POST', '/auth/recuperar', { cuerpo: { email: 'nadie@correo.com' } });

    assert.equal(existe.status, 200);
    assert.equal(noExiste.status, 200);
    assert.equal(existe.cuerpo.mensaje, noExiste.cuerpo.mensaje, 'no revela si el correo existe');
    assert.ok(s.base.codigosRecuperacion.has(email));
    assert.ok(!s.base.codigosRecuperacion.has('nadie@correo.com'));
  } finally {
    await s.cerrar();
  }
});

// ---------- POST /auth/restablecer ----------

test('restablecer: valida correo, código y contraseña con errores por campo', async () => {
  const s = await iniciarServidor();
  try {
    const { status, cuerpo } = await s.pedir('POST', '/auth/restablecer', {
      cuerpo: { email: 'malo', codigo: 'abc', password: '123' },
    });
    assert.equal(status, 400);
    assert.ok(cuerpo.campos.email);
    assert.ok(cuerpo.campos.codigo);
    assert.ok(cuerpo.campos.password);
  } finally {
    await s.cerrar();
  }
});

test('restablecer: con un código incorrecto no cambia la contraseña', async () => {
  const s = await iniciarServidor();
  try {
    const { email } = await registrarUsuario(s);
    await s.pedir('POST', '/auth/recuperar', { cuerpo: { email } });

    const { status, cuerpo } = await s.pedir('POST', '/auth/restablecer', {
      cuerpo: { email, codigo: '000000', password: 'nuevaClave123' },
    });
    assert.equal(status, 400);
    assert.ok(cuerpo.campos.codigo);

    const login = await s.pedir('POST', '/auth/login', { cuerpo: { email, password: 'contrasena123' } });
    assert.equal(login.status, 200, 'la contraseña anterior sigue sirviendo');
  } finally {
    await s.cerrar();
  }
});

test('restablecer: con el código correcto cambia la contraseña y deja la sesión iniciada', async () => {
  const s = await iniciarServidor();
  try {
    const { email, id } = await registrarUsuario(s);
    await s.pedir('POST', '/auth/recuperar', { cuerpo: { email } });
    const codigo = s.base.codigosRecuperacion.get(email);

    const { status, cuerpo } = await s.pedir('POST', '/auth/restablecer', {
      cuerpo: { email, codigo, password: 'nuevaClave123' },
    });
    assert.equal(status, 200);
    assert.equal(cuerpo.usuario.id, id);
    assert.ok(cuerpo.sesion.token);
    assert.ok(cuerpo.perfil);

    const vieja = await s.pedir('POST', '/auth/login', { cuerpo: { email, password: 'contrasena123' } });
    const nueva = await s.pedir('POST', '/auth/login', { cuerpo: { email, password: 'nuevaClave123' } });
    assert.equal(vieja.status, 401);
    assert.equal(nueva.status, 200);

    // El código sirve una sola vez.
    const repetido = await s.pedir('POST', '/auth/restablecer', {
      cuerpo: { email, codigo, password: 'otraClave1234' },
    });
    assert.equal(repetido.status, 400);
  } finally {
    await s.cerrar();
  }
});
