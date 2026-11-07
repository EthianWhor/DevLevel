import { crearApp } from './app';
import { env } from './config/env';

// Punto de entrada: crea la app y la pone a escuchar en el puerto.
const app = crearApp();

app.listen(env.port, () => {
  console.log(`DevLevel API escuchando en el puerto ${env.port}`);
});
