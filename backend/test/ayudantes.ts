import './preparar-entorno';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { crearApp } from '../src/app';
import { usarClienteDePrueba } from '../src/lib/supabase';
import { crearSupabaseFalso, type BaseFalsa } from './supabase-falso';

export type Servidor = Awaited<ReturnType<typeof iniciarServidor>>;

// Levanta la API real en un puerto libre, conectada al Supabase falso.
export async function iniciarServidor() {
  const { cliente, base } = crearSupabaseFalso();
  usarClienteDePrueba(cliente);

  const servidor = crearApp().listen(0);
  await once(servidor, 'listening');
  const url = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`;

  async function pedir(
    metodo: string,
    ruta: string,
    opciones: { cuerpo?: unknown; token?: string } = {},
  ) {
    const encabezados: Record<string, string> = {};
    if (opciones.cuerpo !== undefined) encabezados['Content-Type'] = 'application/json';
    if (opciones.token) encabezados.Authorization = `Bearer ${opciones.token}`;

    const respuesta = await fetch(url + ruta, {
      method: metodo,
      headers: encabezados,
      body: opciones.cuerpo !== undefined ? JSON.stringify(opciones.cuerpo) : undefined,
    });
    const cuerpo = (await respuesta.json()) as any;
    return { status: respuesta.status, cuerpo };
  }

  async function cerrar() {
    servidor.close();
    await once(servidor, 'close');
  }

  return { base, pedir, cerrar };
}

let contadorCorreos = 0;

// Registra un usuario nuevo y devuelve su token e id.
export async function registrarUsuario(servidor: Servidor) {
  contadorCorreos++;
  const email = `heroe${contadorCorreos}@correo.com`;
  const { status, cuerpo } = await servidor.pedir('POST', '/auth/register', {
    cuerpo: { email, password: 'contrasena123' },
  });
  if (status !== 201) throw new Error(`No se pudo registrar: ${JSON.stringify(cuerpo)}`);
  return { token: cuerpo.sesion.token as string, id: cuerpo.usuario.id as string, email };
}

// Contenido mínimo: 1 unidad con 2 niveles.
//   Nivel 1: reto 101 (opción múltiple, correcta 1), 102 (ordenar, [2,0,1]), 103 (completar, 0)
//   Nivel 2: reto 201 (opción múltiple, correcta 0)
export function cargarContenido(base: BaseFalsa) {
  base.tablas.unidades.push({ id: 1, orden: 1, titulo: 'Pensar en pasos', descripcion: 'Pasos' });
  base.tablas.niveles.push(
    {
      id: 1,
      unidad_id: 1,
      orden: 1,
      titulo: '¿Qué es un algoritmo?',
      concepto_titulo: 'Algoritmo',
      concepto_texto: 'Lista de pasos',
      concepto_ejemplo: null,
      hechizo_nombre: 'Hechizo del Camino',
      hechizo_descripcion: 'Convierte un problema en pasos.',
      xp_recompensa: 50,
    },
    {
      id: 2,
      unidad_id: 1,
      orden: 2,
      titulo: 'El orden importa',
      concepto_titulo: 'Orden',
      concepto_texto: 'El orden cambia el resultado',
      concepto_ejemplo: null,
      hechizo_nombre: 'Hechizo del Orden',
      hechizo_descripcion: 'Cada paso en su lugar.',
      xp_recompensa: 50,
    },
  );

  const reto = (id: number, nivel_id: number, orden: number, tipo: string, opciones: string[], respuesta: unknown) => ({
    id,
    nivel_id,
    orden,
    tipo,
    enunciado: `Reto ${id}`,
    codigo: null,
    opciones,
    respuesta,
    explicacion_correcta: `Bien hecho en el reto ${id}`,
    explicacion_error: `Revisa el reto ${id}`,
    pista: `Pista del reto ${id}`,
  });

  base.tablas.retos.push(
    reto(101, 1, 1, 'opcion_multiple', ['a', 'b', 'c'], 1),
    reto(102, 1, 2, 'ordenar', ['x', 'y', 'z'], [2, 0, 1]),
    reto(103, 1, 3, 'completar', ['p', 'q'], 0),
    reto(201, 2, 1, 'opcion_multiple', ['a', 'b'], 0),
  );
}

// Respuestas correctas del nivel 1, en orden.
export const RESPUESTAS_NIVEL_1: [number, number | number[]][] = [
  [101, 1],
  [102, [2, 0, 1]],
  [103, 0],
];

export async function responderBienNivel1(servidor: Servidor, token: string) {
  for (const [retoId, respuesta] of RESPUESTAS_NIVEL_1) {
    const { status } = await servidor.pedir('POST', `/retos/${retoId}/responder`, {
      token,
      cuerpo: { respuesta },
    });
    if (status !== 200) throw new Error(`Falló responder el reto ${retoId}`);
  }
}

export const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms));
