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
    ├── lib/supabase.ts   Cliente de Supabase con la llave secreta
    └── routes/health.ts  GET /health
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
