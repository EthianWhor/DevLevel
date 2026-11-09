import type { Avatar } from '@/api';

// Clases de personaje. Los identificadores coinciden con backend/src/lib/avatares.ts.
export const AVATARES: {
  id: Avatar;
  nombre: string;
  simbolo: string;
  habilidad: string;
  descripcion: string;
}[] = [
  {
    id: 'explorador',
    nombre: 'Explorador de Datos',
    simbolo: '🧭',
    habilidad: 'Rastreo de pistas',
    descripcion: 'Encuentra la información escondida en cada problema y la ordena paso a paso.',
  },
  {
    id: 'mago',
    nombre: 'Mago del Código',
    simbolo: '🔮',
    habilidad: 'Bucle encantado',
    descripcion: 'Repite sus hechizos las veces que haga falta hasta cumplir la condición.',
  },
  {
    id: 'guerrero',
    nombre: 'Guerrero Lógico',
    simbolo: '🛡️',
    habilidad: 'Escudo verdadero',
    descripcion: 'Decide con condiciones: si el ataque es verdadero, lo bloquea; si no, avanza.',
  },
];

export function datosAvatar(id: Avatar | null | undefined) {
  return AVATARES.find((avatar) => avatar.id === id) ?? null;
}
