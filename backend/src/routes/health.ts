import { Router } from 'express';
import { supabase } from '../lib/supabase';

export const healthRouter = Router();

// GET /health
// Confirma que el servidor está vivo y que puede consultar la base de datos.
// Sirve para despertar Render antes de la demo y para revisar el despliegue.
healthRouter.get('/', async (_req, res) => {
  const { error } = await supabase.from('unidades').select('id').limit(1);

  res.status(error ? 503 : 200).json({
    estado: error ? 'error' : 'ok',
    baseDeDatos: error ? 'sin conexión' : 'conectada',
    hora: new Date().toISOString(),
  });
});
