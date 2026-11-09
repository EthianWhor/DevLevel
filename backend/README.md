# DevLevel — Backend

API en Node + Express + TypeScript. Es el único punto de acceso a Supabase: la app móvil nunca se conecta directo a la base de datos.

**URL pública (Render):** _pendiente_

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

## Base de datos

En Supabase: **SQL Editor → New query**, pegar todo `supabase/schema.sql` y ejecutar. Crea las 6 tablas con RLS activado y sin políticas, así que solo este backend puede leer y escribir.

## Estructura

```
backend/
├── supabase/schema.sql   Esquema de la base de datos
└── src/
    ├── index.ts          Punto de entrada: pone el servidor a escuchar
    ├── app.ts            Arma la app de Express y registra las rutas
    ├── config/env.ts     Lee y valida las variables de entorno
    ├── lib/
    │   ├── supabase.ts   Cliente de Supabase con la llave secreta
    │   ├── perfil.ts     Lectura del perfil y conversión a camelCase
    │   ├── avatares.ts   Avatares permitidos
    │   └── validacion.ts Validación de correo y contraseña
    ├── middleware/
    │   └── requiere-sesion.ts  Valida el token de las rutas protegidas
    └── routes/
        ├── health.ts     GET /health
        ├── auth.ts       POST /auth/register, /auth/login, /auth/refresh
        ├── me.ts         GET /me, PATCH /me
        └── mapa.ts       GET /mapa
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
| `GET /me` | Listo | Devuelve el perfil del usuario (requiere sesión) |
| `PATCH /me` | Listo | Actualiza nombre de héroe y avatar (requiere sesión) |
| `GET /mapa` | Listo | Unidades y niveles con su estado para el usuario (requiere sesión) |

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
