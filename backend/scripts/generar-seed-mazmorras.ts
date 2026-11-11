// Genera supabase/seed-mazmorras.sql a partir de src/lib/mazmorra/contenido.ts.
// Uso: npm run seed:mazmorras
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { MAZMORRAS } from '../src/lib/mazmorra/contenido';

const texto = (valor: string) => `'${valor.replace(/'/g, "''")}'`;
const json = (valor: unknown) => `${texto(JSON.stringify(valor))}::jsonb`;

const filas = MAZMORRAS.map(({ nivelId, mazmorra, solucion, solucionExtras }) =>
  [
    `(${nivelId}`,
    '1',
    "'mazmorra'",
    texto(mazmorra.nombre),
    'null',
    json(mazmorra),
    json({ solucion, solucionExtras }),
    texto('¡Saliste de la mazmorra!'),
    texto('Tu hechizo no llegó a la puerta. Revisa el motivo y vuelve a intentarlo.'),
    `${texto(mazmorra.pista)})`,
  ].join(', '),
);

const sql = `-- =============================================================
-- DevLevel — Las 15 mazmorras (una por nivel)
-- Archivo generado con: npm run seed:mazmorras (no editar a mano;
-- el contenido está en backend/src/lib/mazmorra/contenido.ts).
-- Ejecutar en Supabase > SQL Editor DESPUÉS de migracion-mazmorras.sql
-- y de seed.sql. Reemplaza los retos de pregunta por las mazmorras;
-- el progreso de los niveles se conserva.
-- =============================================================

delete from public.retos where nivel_id between 1 and 15;

insert into public.retos
  (nivel_id, orden, tipo, enunciado, codigo, opciones, respuesta, explicacion_correcta, explicacion_error, pista)
values
${filas.join(',\n')};
`;

writeFileSync(join(__dirname, '..', 'supabase', 'seed-mazmorras.sql'), sql);
console.log(`seed-mazmorras.sql generado con ${filas.length} mazmorras`);
