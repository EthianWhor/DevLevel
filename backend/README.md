# DevLevel — Backend

API en Node + Express + TypeScript. Es el único punto de acceso a Supabase: la app móvil nunca se conecta directo a la base de datos.

**URL pública (Render):** https://devlevel-api.onrender.com

## Requisitos

- Node.js 22 o superior (`@supabase/supabase-js` ya no funciona con Node 20).
- Un proyecto de Supabase con el esquema de `supabase/schema.sql` ejecutado.

## Ejecutar en local

```bash
cd backend
npm install
cp .env.example .env   # y llenar SUPABASE_URL y SUPABASE_SECRET_KEY
npm run dev
```

El servidor queda en `http://localhost:3000`. Para probarlo: `http://localhost:3000/health`.

| Script | Qué hace |
|---|---|
| `npm run dev` | Arranca en modo desarrollo y se reinicia al guardar cambios |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm start` | Ejecuta la versión compilada (lo que usa Render) |
| `npm run typecheck` | Revisa los tipos sin compilar |
| `npm test` | Corre las pruebas automáticas de la API |

## Pruebas automáticas

```bash
npm test
```

Las pruebas levantan la API real en un puerto libre y le hacen peticiones HTTP, pero en lugar de Supabase usan una base de datos falsa en memoria (`test/supabase-falso.ts`). Por eso no necesitan `.env`, no tocan los datos reales y se pueden correr sin internet.

| Archivo | Qué prueba |
|---|---|
| `test/auth.test.ts` | Registro, login, refresh, rutas protegidas sin token, `GET /me` y `PATCH /me` |
| `test/retos.test.ts` | `POST /retos/:id/responder` y `POST /niveles/:id/completar` (estrellas, XP, subida de nivel, racha, repetir niveles, niveles bloqueados) |
| `test/lector.test.ts`, `test/simulador.test.ts`, `test/objetos.test.ts` | Motor de mazmorras: lenguaje, simulación, combate, objetos y sorteo de míticos |
| `test/contenido.test.ts` | Las 15 mazmorras se ganan sin objetos y sus extras se pueden cumplir |
| `test/mazmorras.test.ts` | `responder` y `completar` con mazmorras, inventario, equipo y pista avanzada |
| `test/recuperar.test.ts` | `POST /auth/recuperar` y `POST /auth/restablecer` (no revela si el correo existe, código incorrecto, código de un solo uso) |
| `test/hechizos.test.ts` | `GET /hechizos` (bloqueados sin contenido, desbloqueo al completar, progreso por usuario) |
| `test/progreso.test.ts` | Reglas puras de `lib/progreso.ts` (nivel por XP, estrellas, racha con fechas de Colombia) |

## Base de datos

En Supabase: **SQL Editor → New query**, pegar todo `supabase/schema.sql` y ejecutar. Crea las 6 tablas con RLS activado y sin políticas, así que solo este backend puede leer y escribir.

Después, en otra consulta, pegar y ejecutar `supabase/seed.sql`: carga el contenido del módulo (5 unidades, 15 niveles y 45 retos). Se puede ejecutar varias veces sin duplicar datos.

## Estructura

```
backend/
├── supabase/schema.sql   Esquema de la base de datos
└── src/
    ├── index.ts          Punto de entrada: pone el servidor a escuchar
    ├── app.ts            Arma la app de Express y registra las rutas
    ├── config/env.ts     Lee y valida las variables de entorno
    ├── lib/
    │   ├── mazmorra/     Motor del juego: lector del pseudocódigo, simulador,
    │   │                 objetos y las 15 mazmorras (copia idéntica en movil/src/juego)
    │   ├── equipo.ts     Equipo del jugador verificado contra su inventario
    │   ├── supabase.ts   Cliente de Supabase con la llave secreta
    │   ├── perfil.ts     Lectura del perfil y conversión a camelCase
    │   ├── avatares.ts   Avatares permitidos
    │   ├── progreso.ts   Reglas de XP, estrellas, racha y nivel
    │   └── validacion.ts Validación de correo y contraseña
    ├── middleware/
    │   └── requiere-sesion.ts  Valida el token de las rutas protegidas
    └── routes/
        ├── health.ts     GET /health
        ├── auth.ts       POST /auth/register, /auth/login, /auth/refresh,
        │                 /auth/recuperar, /auth/restablecer
        ├── me.ts         GET /me, PATCH /me
        ├── mapa.ts       GET /mapa
        ├── retos.ts      POST /retos/:id/responder
        ├── completar.ts  POST /niveles/:id/completar
        ├── hechizos.ts   GET /hechizos
        └── inventario.ts GET /inventario
```

## Despliegue en Render

1. En Render: **New → Web Service** y conectar el repositorio `DevLevel`.
2. Configuración:
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install --include=dev && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
3. En **Environment**, agregar `SUPABASE_URL` y `SUPABASE_SECRET_KEY`.
4. En **Settings → Health Check Path**, poner `/health`.
5. Cuando termine el despliegue, abrir `https://<servicio>.onrender.com/health` y comprobar que responde `"estado": "ok"`.

En el plan gratis el servicio se duerme tras 15 minutos sin uso y la primera petición tarda unos 50 segundos. Antes de la demo hay que abrir `/health` para despertarlo.

## Endpoints

| Método y ruta | Estado | Qué hace |
|---|---|---|
| `GET /health` | Listo | Responde si el servidor y la base de datos están bien |
| `POST /auth/register` | Listo | Crea la cuenta y el perfil, y devuelve la sesión |
| `POST /auth/login` | Listo | Inicia sesión y devuelve el token |
| `POST /auth/refresh` | Listo | Renueva el token con el `refreshToken` |
| `POST /auth/recuperar` | Listo | Envía al correo un código para cambiar la contraseña |
| `POST /auth/restablecer` | Listo | Cambia la contraseña con el código y deja la sesión iniciada |
| `GET /me` | Listo | Devuelve el perfil del usuario (requiere sesión) |
| `PATCH /me` | Listo | Actualiza nombre de héroe y avatar (requiere sesión) |
| `GET /mapa` | Listo | Unidades y niveles con su estado para el usuario (requiere sesión) |
| `POST /retos/:id/responder` | Listo | Revisa una respuesta, guarda el intento y devuelve la explicación (requiere sesión) |
| `POST /niveles/:id/completar` | Listo | Calcula XP, estrellas, racha y subida de nivel (requiere sesión) |
| `GET /inventario` | Listo | Objetos ganados (normales y míticos) y el equipo puesto (requiere sesión) |
| `GET /retos/:id/pista-avanzada` | Listo | Pista avanzada de una mazmorra con el Pergamino del sabio o el Ojo de Odín (requiere sesión) |
| `GET /hechizos` | Listo | Libro de hechizos: los conceptos desbloqueados y los que faltan (requiere sesión) |

### Formato general

- Todas las peticiones y respuestas son JSON (`Content-Type: application/json`).
- Los errores siempre tienen la forma `{ "error": "mensaje" }`.
- Los errores de validación (400) traen además `campos`, con un mensaje por cada campo que falló, para mostrarlo debajo del campo en la app:

```json
{
  "error": "Revisa los datos del formulario",
  "campos": {
    "email": "El correo no tiene un formato válido",
    "password": "La contraseña debe tener al menos 8 caracteres"
  }
}
```

### Rutas protegidas

Las rutas que dicen "requiere sesión" necesitan el token en el encabezado:

```
Authorization: Bearer <token>
```

Si el token falta, venció o no es válido, responden `401`:

```json
{ "error": "La sesión no es válida o expiró" }
```

El token dura **una hora**. Cuando la app reciba un 401, debe llamar a `POST /auth/refresh` con el `refreshToken`; si eso también falla, debe mandar al usuario al login.

### `POST /auth/register`

Crea la cuenta en Supabase Auth (con el correo ya confirmado), crea su fila en `profiles` y devuelve la sesión iniciada.

Reglas: correo con formato válido y contraseña de 8 a 72 caracteres.

**Petición**

```http
POST /auth/register
Content-Type: application/json

{
  "email": "heroe@correo.com",
  "password": "contrasena123"
}
```

**Respuesta `201 Created`**

```json
{
  "sesion": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "v1.MjQ0ZDk2...",
    "expiraEn": 1762750000
  },
  "usuario": {
    "id": "6f1c2a3e-8b1d-4f6a-9c2e-1a2b3c4d5e6f",
    "email": "heroe@correo.com"
  },
  "perfil": {
    "id": "6f1c2a3e-8b1d-4f6a-9c2e-1a2b3c4d5e6f",
    "nombreHeroe": null,
    "avatar": null,
    "xp": 0,
    "nivel": 1,
    "rachaActual": 0,
    "rachaMaxima": 0,
    "ultimaActividad": null
  }
}
```

`expiraEn` es la fecha de vencimiento del token en segundos Unix. Un perfil con `nombreHeroe` en `null` indica que el usuario todavía no ha pasado por Selección de personaje.

**Errores**

| Código | Cuándo | Ejemplo |
|---|---|---|
| `400` | Correo o contraseña inválidos | `{ "error": "Revisa los datos del formulario", "campos": { "password": "Escribe tu contraseña" } }` |
| `409` | El correo ya tiene cuenta | `{ "error": "Ya existe una cuenta con este correo", "campos": { "email": "Ya existe una cuenta con este correo" } }` |

### `POST /auth/login`

**Petición**

```http
POST /auth/login
Content-Type: application/json

{
  "email": "heroe@correo.com",
  "password": "contrasena123"
}
```

**Respuesta `200 OK`**: igual a la de registro (`sesion`, `usuario` y `perfil`).

**Errores**

| Código | Cuándo | Ejemplo |
|---|---|---|
| `400` | Faltan datos o tienen mal formato | `{ "error": "Revisa los datos del formulario", "campos": { "email": "Escribe tu correo" } }` |
| `401` | Correo o contraseña incorrectos | `{ "error": "Correo o contraseña incorrectos" }` |

Por seguridad el mensaje del 401 es el mismo si el correo no existe o si la contraseña está mal.

### `POST /auth/refresh`

**Petición**

```http
POST /auth/refresh
Content-Type: application/json

{ "refreshToken": "v1.MjQ0ZDk2..." }
```

**Respuesta `200 OK`**: igual a la de login, con un token nuevo. Cada `refreshToken` se puede usar una sola vez, así que la app debe guardar el nuevo.

**Errores**: `400` si falta el `refreshToken`, `401` si ya no es válido (`{ "error": "La sesión expiró, vuelve a iniciar sesión" }`).

### `POST /auth/recuperar`

Pide a Supabase que envíe al correo un código para cambiar la contraseña. Responde siempre lo mismo, exista o no la cuenta, para no revelar qué correos están registrados.

**Petición**

```json
{ "email": "heroe@correo.com" }
```

**Respuesta `200 OK`**

```json
{ "mensaje": "Si el correo tiene una cuenta, te enviamos un código para cambiar la contraseña." }
```

**Errores:** `400` si el correo no es válido (con `campos.email`) y `429` si se pidió otro código hace menos de un minuto.

**Configuración necesaria en Supabase** (una sola vez): en **Authentication → Emails → Reset Password**, la plantilla debe incluir el código con `{{ .Token }}`, por ejemplo:

```html
<h2>Cambia tu contraseña de DevLevel</h2>
<p>Escribe este código en la app: <strong>{{ .Token }}</strong></p>
<p>Si no lo pediste, ignora este correo.</p>
```

Con el servicio de correo incluido en el plan gratis, Supabase solo envía correos a los miembros del equipo del proyecto y unos pocos por hora. Para enviarlos a cualquier usuario hay que configurar un SMTP propio en **Authentication → Emails → SMTP Settings**.

### `POST /auth/restablecer`

Revisa el código del correo, cambia la contraseña y devuelve la sesión iniciada (la misma respuesta que `POST /auth/login`). Cada código sirve una sola vez.

**Petición**

```json
{ "email": "heroe@correo.com", "codigo": "123456", "password": "nuevaClave123" }
```

**Errores**

| Código | Cuándo | Ejemplo |
|---|---|---|
| `400` | Faltan datos o tienen mal formato | `{ "error": "Revisa los datos del formulario", "campos": { "codigo": "Escribe el código que te llegó al correo" } }` |
| `400` | El código no es válido o venció | `{ "error": "El código no es válido o ya venció", "campos": { "codigo": "El código no es válido o ya venció. Pide uno nuevo." } }` |
| `400` | La contraseña nueva es igual a la anterior | `{ "error": "La contraseña nueva es igual a la anterior", "campos": { "password": "Usa una contraseña distinta a la anterior" } }` |

### `GET /me` (requiere sesión)

**Petición**

```http
GET /me
Authorization: Bearer <token>
```

**Respuesta `200 OK`**

```json
{
  "usuario": {
    "id": "6f1c2a3e-8b1d-4f6a-9c2e-1a2b3c4d5e6f",
    "email": "heroe@correo.com"
  },
  "perfil": {
    "id": "6f1c2a3e-8b1d-4f6a-9c2e-1a2b3c4d5e6f",
    "nombreHeroe": "Ada",
    "avatar": "mago",
    "xp": 150,
    "nivel": 2,
    "rachaActual": 3,
    "rachaMaxima": 5,
    "ultimaActividad": "2026-11-07"
  }
}
```

### `PATCH /me` (requiere sesión)

Se puede enviar uno o los dos campos. XP, nivel y racha no se pueden cambiar desde aquí.

| Campo | Regla |
|---|---|
| `nombreHeroe` | Texto de 2 a 20 caracteres (se quitan los espacios de los extremos) |
| `avatar` | `explorador`, `mago` o `guerrero` |

**Petición**

```http
PATCH /me
Authorization: Bearer <token>
Content-Type: application/json

{
  "nombreHeroe": "Ada",
  "avatar": "mago"
}
```

**Respuesta `200 OK`**: igual a la de `GET /me`, con el perfil ya actualizado.

**Errores**

| Código | Cuándo | Ejemplo |
|---|---|---|
| `400` | Nombre o avatar inválidos | `{ "error": "Revisa los datos del formulario", "campos": { "nombreHeroe": "El nombre de héroe debe tener entre 2 y 20 caracteres" } }` |
| `400` | No se envió ningún campo | `{ "error": "Envía nombreHeroe y/o avatar para actualizar" }` |
| `401` | Sin sesión o token vencido | `{ "error": "Debes iniciar sesión" }` |

### `GET /mapa` (requiere sesión)

Devuelve las unidades en orden, cada una con sus niveles y el estado de cada nivel para el usuario:

| Estado | Significado |
|---|---|
| `completado` | Ya lo terminó; `estrellas` dice con cuántas (1 a 3) |
| `actual` | El primer nivel sin completar: el único que se puede jugar |
| `bloqueado` | Viene después del actual; se desbloquea al completar el anterior |

**Respuesta `200 OK`** (recortada)

```json
{
  "unidades": [
    {
      "id": 1,
      "orden": 1,
      "titulo": "Pensar en pasos",
      "descripcion": "Qué es un algoritmo y por qué el orden importa",
      "niveles": [
        { "id": 1, "orden": 1, "titulo": "¿Qué es un algoritmo?", "xpRecompensa": 50, "estado": "completado", "estrellas": 3 },
        { "id": 2, "orden": 2, "titulo": "El orden importa", "xpRecompensa": 50, "estado": "actual", "estrellas": null },
        { "id": 3, "orden": 3, "titulo": "Dividir un problema", "xpRecompensa": 50, "estado": "bloqueado", "estrellas": null }
      ]
    }
  ],
  "resumen": { "completados": 1, "total": 15, "nivelActualId": 2 }
}
```

Cuando el usuario completa todos los niveles, `nivelActualId` es `null` y ningún nivel queda en `actual`.

### `POST /retos/:id/responder` (requiere sesión)

Revisa la respuesta, guarda el intento en `intentos_retos` (con eso se calculan las estrellas al completar el nivel) y devuelve si fue correcta. La respuesta correcta nunca se envía a la app.

Forma de `respuesta` según el tipo de reto:

| Tipo | `respuesta` | Ejemplo |
|---|---|---|
| `opcion_multiple` | Índice de la opción elegida | `1` |
| `completar` | Índice de la palabra elegida | `0` |
| `ordenar` | Índices de las opciones en el orden elegido, usando cada una una vez | `[2, 0, 1, 3]` |

**Petición**

```http
POST /retos/2/responder
Authorization: Bearer <token>
Content-Type: application/json

{ "respuesta": [1, 2, 0, 3] }
```

**Respuesta `200 OK` (correcta)**

```json
{
  "retoId": 2,
  "nivelId": 1,
  "correcta": true,
  "explicacion": "Correcto. Primero se hierve el agua, luego se prepara la taza, se sirve y se espera.",
  "pista": null
}
```

**Respuesta `200 OK` (incorrecta)**: igual, con `"correcta": false`, la explicación del error y la `pista` del reto.

Responder mal no es un error HTTP: siempre es `200` y el resultado va en `correcta`.

**Errores**

| Código | Cuándo | Ejemplo |
|---|---|---|
| `400` | La respuesta no tiene la forma del tipo de reto | `{ "error": "La respuesta debe usar cada opción una sola vez", "campos": { "respuesta": "..." } }` |
| `401` | Sin sesión o token vencido | `{ "error": "Debes iniciar sesión" }` |
| `403` | El reto es de un nivel bloqueado | `{ "error": "Este nivel todavía está bloqueado" }` |
| `404` | El reto no existe | `{ "error": "El reto no existe" }` |

### `POST /niveles/:id/completar` (requiere sesión)

Se llama cuando el usuario ya acertó todos los retos del nivel. No lleva cuerpo.

**Reglas**

| Qué | Regla |
|---|---|
| Requisito | Cada reto del nivel debe tener al menos una respuesta correcta en esta partida |
| Estrellas | Según los errores antes de acertar cada reto: 0 errores = 3 ★, 1 o 2 = 2 ★, 3 o más = 1 ★ |
| XP | `xpRecompensa` del nivel **solo la primera vez**. Repetir un nivel sirve para mejorar las estrellas (se guarda la mejor) pero no da XP |
| Nivel del jugador | Cada 100 XP se sube un nivel: 0–99 = nivel 1, 100–199 = nivel 2… |
| Racha | Días seguidos completando al menos un nivel, contados en hora de Colombia. Si ya jugó hoy no cambia; si jugó ayer sube 1; si faltó un día o más vuelve a 1 |
| Repetir un nivel | Solo cuentan los intentos hechos después de la última vez que se completó |

**Petición**

```http
POST /niveles/1/completar
Authorization: Bearer <token>
```

**Respuesta `200 OK`**

```json
{
  "nivelId": 1,
  "primeraVez": true,
  "errores": 1,
  "estrellas": 2,
  "mejoresEstrellas": 2,
  "xpGanada": 50,
  "subioDeNivel": true,
  "nivelAnterior": 1,
  "nivelNuevo": 2,
  "progresoNivel": { "xpEnNivel": 0, "xpPorNivel": 100 },
  "racha": { "actual": 3, "maxima": 5, "cambio": "aumento" },
  "hechizoDesbloqueado": {
    "nombre": "Hechizo del Camino",
    "descripcion": "Convierte un problema en una lista de pasos que se pueden seguir."
  },
  "siguienteNivelId": 2,
  "perfil": {
    "id": "6f1c2a3e-8b1d-4f6a-9c2e-1a2b3c4d5e6f",
    "nombreHeroe": "Ada",
    "avatar": "mago",
    "xp": 100,
    "nivel": 2,
    "rachaActual": 3,
    "rachaMaxima": 5,
    "ultimaActividad": "2026-11-09"
  }
}
```

- `subioDeNivel` indica si hay que mostrar la pantalla Subida de nivel.
- `racha.cambio` es `aumento`, `igual` o `reinicio`.
- `hechizoDesbloqueado` es `null` si el nivel ya se había completado antes.
- `siguienteNivelId` es `null` en el último nivel.

**Errores**

| Código | Cuándo | Ejemplo |
|---|---|---|
| `401` | Sin sesión o token vencido | `{ "error": "Debes iniciar sesión" }` |
| `403` | El nivel está bloqueado | `{ "error": "Este nivel todavía está bloqueado" }` |
| `404` | El nivel no existe | `{ "error": "El nivel no existe" }` |
| `409` | Faltan retos por acertar | `{ "error": "Responde correctamente todos los retos del nivel antes de completarlo", "retosPendientes": [3] }` |

### `GET /hechizos` (requiere sesión)

Devuelve el Libro de hechizos. Cada nivel enseña un concepto que se guarda como hechizo la primera vez que el usuario completa ese nivel. Vienen los 15 hechizos agrupados por unidad:

- Si `desbloqueado` es `true`, trae el nombre, la descripción y el concepto del nivel para repasarlo.
- Si es `false`, solo dice qué nivel hay que completar (`orden` y `nivelTitulo`); el resto llega en `null` para no adelantar el contenido.

**Respuesta `200 OK`** (recortada)

```json
{
  "unidades": [
    {
      "id": 1,
      "orden": 1,
      "titulo": "Pensar en pasos",
      "hechizos": [
        {
          "nivelId": 1,
          "orden": 1,
          "nivelTitulo": "¿Qué es un algoritmo?",
          "desbloqueado": true,
          "estrellas": 3,
          "nombre": "Hechizo del Camino",
          "descripcion": "Convierte un problema en una lista de pasos que se pueden seguir.",
          "conceptoTitulo": "Un algoritmo es una receta",
          "conceptoTexto": "Un algoritmo es una lista de pasos claros...",
          "conceptoEjemplo": "INICIO
  Hervir agua
  ...
FIN"
        },
        {
          "nivelId": 2,
          "orden": 2,
          "nivelTitulo": "El orden importa",
          "desbloqueado": false,
          "estrellas": null,
          "nombre": null,
          "descripcion": null,
          "conceptoTitulo": null,
          "conceptoTexto": null,
          "conceptoEjemplo": null
        }
      ]
    }
  ],
  "resumen": { "desbloqueados": 1, "total": 15 }
}
```

**Errores**

| Código | Cuándo | Ejemplo |
|---|---|---|
| `401` | Sin sesión o token vencido | `{ "error": "Debes iniciar sesión" }` |

### Mazmorras (retos de tipo `mazmorra`)

Desde la migración `supabase/migracion-mazmorras.sql`, cada nivel tiene **un** reto de tipo `mazmorra`: el jugador arma un programa en pseudocódigo y el backend lo ejecuta con el motor de `src/lib/mazmorra/`. El diseño completo está en `docs/diseno-juego-mazmorras.md`.

**Para cargar las mazmorras en Supabase** (una vez): ejecutar `supabase/migracion-mazmorras.sql` y después `supabase/seed-mazmorras.sql`. Si se cambia `src/lib/mazmorra/contenido.ts`, regenerar el seed con `npm run seed:mazmorras`.

**`POST /retos/:id/responder` con una mazmorra.** Petición `{ "programa": "adelante()
adelante()" }`. El backend usa el equipo guardado del jugador (solo lo que de verdad tiene en `inventario`), simula y guarda el intento con su `detalle`:

```json
{
  "retoId": 46, "nivelId": 1, "correcta": true, "motivo": null, "error": null,
  "objetivosCumplidos": [true, false],
  "resultado": { "vida": 3, "vidaMax": 3, "energiaRestante": 5, "monedas": 1, "monedasTotales": 1, "instrucciones": 6 },
  "explicacion": "¡Saliste de la mazmorra!", "pista": null
}
```

Si el texto tiene un error, `correcta` es `false` y `error` trae `{ "linea": 2, "mensaje": "Línea 2: ..." }`. Si no gana, `motivo` explica por qué ("Te quedaste sin energía", "Perdiste toda tu vida"...).

**`POST /niveles/:id/completar` con una mazmorra.** Exige un intento ganador. Estrellas = 1 + objetivos extra cumplidos en el mejor intento. Si cumplió todos los extras y no tiene el objeto de la mazmorra, lo gana; con probabilidad `10 % × 0,8^k` (k = míticos que ya tiene) recibe en su lugar un mítico. La respuesta agrega `objetoGanado: { id, nombre, espacio, efecto, mitico, nivelId, equipado } | null`. Si el espacio del objeto estaba vacío, se equipa solo (`equipado: true`).

**`GET /inventario`** → `{ "objetos": [{ "id": "daga_madera", "nombre": "Daga de madera", "espacio": "arma", "efecto": "+1 de ataque", "mitico": false, "nivelId": 2 }], "equipo": { "arma": "daga_madera", "armadura": null, "amuleto": null } }`

**`PATCH /me` con `equipo`**: `{ "equipo": { "arma": "daga_madera", "amuleto": null } }`. Solo objetos del inventario y cada uno en su espacio; si no, `400` con `campos.equipo`. El perfil ahora incluye `equipo`.

**`GET /retos/:id/pista-avanzada`**: con el Pergamino del sabio → `{ "lineas": "primeras 2 líneas", "completa": false }`; con el Ojo de Odín → la solución completa; sin ninguno → `403`.

### Probar con curl

```bash
# Registro
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"heroe@correo.com","password":"contrasena123"}'

# Copiar el "token" de la respuesta y usarlo en las rutas protegidas
curl http://localhost:3000/me -H "Authorization: Bearer <token>"

curl -X PATCH http://localhost:3000/me \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"nombreHeroe":"Ada","avatar":"mago"}'
```
