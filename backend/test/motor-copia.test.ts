import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// El motor vive en el backend y una copia idéntica en la app (para animar).
// Si alguien cambia un lado y no el otro, la app animaría algo distinto a lo
// que valida el backend. Para copiar: npm run motor:copiar
const ARCHIVOS = ['tipos.ts', 'lector.ts', 'objetos.ts', 'simulador.ts'];
const leer = (ruta: string) => readFileSync(ruta, 'utf8').replace(/\r\n/g, '\n');

for (const archivo of ARCHIVOS) {
  test(`motor: ${archivo} es igual en el backend y en la app`, () => {
    const backend = leer(join(__dirname, '..', 'src', 'lib', 'mazmorra', archivo));
    const app = leer(join(__dirname, '..', '..', 'movil', 'src', 'juego', archivo));
    assert.equal(app, backend, `${archivo} cambió en un solo lado; corre npm run motor:copiar`);
  });
}
