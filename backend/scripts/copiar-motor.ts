// Copia el motor de mazmorras del backend a la app (movil/src/juego).
// Uso: npm run motor:copiar
import { copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ARCHIVOS = ['tipos.ts', 'lector.ts', 'objetos.ts', 'simulador.ts'];
const origen = join(__dirname, '..', 'src', 'lib', 'mazmorra');
const destino = join(__dirname, '..', '..', 'movil', 'src', 'juego');

mkdirSync(destino, { recursive: true });
for (const archivo of ARCHIVOS) copyFileSync(join(origen, archivo), join(destino, archivo));
console.log(`Motor copiado a movil/src/juego (${ARCHIVOS.length} archivos)`);
