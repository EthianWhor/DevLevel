import express, { type ErrorRequestHandler } from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { meRouter } from './routes/me';
import { mapaRouter } from './routes/mapa';
import { nivelesRouter } from './routes/niveles';

// Responde los errores no controlados siempre en JSON.
// Express 5 pasa aquí automáticamente los errores de las rutas async.
const manejarErrores: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido' });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor, intenta de nuevo' });
};

// Arma la aplicación de Express sin ponerla a escuchar.
// Separarlo de index.ts permite probar las rutas sin abrir un puerto.
export function crearApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/health', healthRouter);
  app.use('/auth', authRouter);
  app.use('/me', meRouter);
  app.use('/mapa', mapaRouter);
  app.use('/niveles', nivelesRouter);

  // Cualquier ruta que no exista responde 404 en JSON.
  app.use((_req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
  });

  app.use(manejarErrores);

  return app;
}
