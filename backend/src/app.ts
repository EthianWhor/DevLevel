import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health';

// Arma la aplicación de Express sin ponerla a escuchar.
// Separarlo de index.ts permite probar las rutas sin abrir un puerto.
export function crearApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/health', healthRouter);

  // Cualquier ruta que no exista responde 404 en JSON.
  app.use((_req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
  });

  return app;
}
