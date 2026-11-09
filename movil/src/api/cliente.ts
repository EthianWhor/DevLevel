// Cliente HTTP de la app. Es el único lugar que conoce la URL del backend.
// La app nunca habla con Supabase directamente: todo pasa por aquí.

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '');

// Render (plan gratis) se duerme y la primera petición puede tardar ~50 s,
// por eso el tiempo de espera es generoso.
const TIEMPO_MAXIMO_MS = 60_000;

export type TipoErrorApi =
  | 'sin-conexion' // no hay internet o el servidor no responde
  | 'tiempo' // el servidor tardó demasiado
  | 'validacion' // 400: datos del formulario con errores
  | 'sesion' // 401: falta el token o expiró
  | 'no-encontrado' // 404
  | 'conflicto' // 409: por ejemplo, correo ya registrado
  | 'servidor'; // 5xx u otra respuesta inesperada

// Error con un mensaje listo para mostrar al usuario.
// "campos" trae el mensaje de cada campo del formulario que falló.
export class ErrorApi extends Error {
  constructor(
    public tipo: TipoErrorApi,
    mensaje: string,
    public status: number | null = null,
    public campos: Record<string, string> = {},
  ) {
    super(mensaje);
    this.name = 'ErrorApi';
  }
}

export function esErrorApi(error: unknown): error is ErrorApi {
  return error instanceof ErrorApi;
}

type Metodo = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

type OpcionesPeticion = {
  metodo?: Metodo;
  cuerpo?: unknown;
  token?: string | null;
};

function tipoPorStatus(status: number): TipoErrorApi {
  if (status === 400) return 'validacion';
  if (status === 401) return 'sesion';
  if (status === 404) return 'no-encontrado';
  if (status === 409) return 'conflicto';
  return 'servidor';
}

export async function pedir<T>(ruta: string, opciones: OpcionesPeticion = {}): Promise<T> {
  if (!API_URL) {
    throw new ErrorApi(
      'sin-conexion',
      'La app no tiene configurada la dirección del servidor (EXPO_PUBLIC_API_URL).',
    );
  }

  const { metodo = 'GET', cuerpo, token } = opciones;
  const encabezados: Record<string, string> = { Accept: 'application/json' };
  if (cuerpo !== undefined) encabezados['Content-Type'] = 'application/json';
  if (token) encabezados.Authorization = `Bearer ${token}`;

  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIEMPO_MAXIMO_MS);

  let respuesta: Response;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method: metodo,
      headers: encabezados,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
      signal: controlador.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ErrorApi('tiempo', 'El servidor está tardando mucho en responder. Intenta de nuevo.');
    }
    throw new ErrorApi('sin-conexion', 'No hay conexión con el servidor. Revisa tu internet.');
  } finally {
    clearTimeout(temporizador);
  }

  // Algunas respuestas pueden venir vacías; si no es JSON se trata como vacía.
  const texto = await respuesta.text();
  let datos: unknown = null;
  if (texto) {
    try {
      datos = JSON.parse(texto);
    } catch {
      datos = null;
    }
  }

  if (!respuesta.ok) {
    const cuerpoError = (datos ?? {}) as { error?: string; campos?: Record<string, string> };
    throw new ErrorApi(
      tipoPorStatus(respuesta.status),
      cuerpoError.error ?? 'Ocurrió un error inesperado. Intenta de nuevo.',
      respuesta.status,
      cuerpoError.campos ?? {},
    );
  }

  return datos as T;
}
