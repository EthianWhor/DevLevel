import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { authApi, esErrorApi, type Perfil, type RespuestaSesion, type Sesion, type Usuario } from '@/api';

// Llave con la que se guarda la sesión en el almacenamiento seguro del celular
// (Keystore en Android). Nunca se guarda en AsyncStorage ni en texto plano.
const LLAVE_SESION = 'devlevel_sesion';

export type EstadoAuth = 'cargando' | 'sin-sesion' | 'con-sesion';

type ValorAuth = {
  estado: EstadoAuth;
  usuario: Usuario | null;
  // null mientras se carga o si no se pudo traer (por ejemplo, sin internet).
  perfil: Perfil | null;
  iniciarSesion: (email: string, password: string) => Promise<void>;
  registrarse: (email: string, password: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  // Ejecuta una petición con el token. Si el backend responde 401, renueva
  // el token una vez y reintenta; si tampoco funciona, cierra la sesión.
  conSesion: <T>(peticion: (token: string) => Promise<T>) => Promise<T>;
  recargarPerfil: () => Promise<void>;
  actualizarPerfilLocal: (perfil: Perfil) => void;
};

const AuthContext = createContext<ValorAuth | null>(null);

async function guardarSesion(sesion: Sesion) {
  await SecureStore.setItemAsync(LLAVE_SESION, JSON.stringify(sesion));
}

async function leerSesion(): Promise<Sesion | null> {
  try {
    const texto = await SecureStore.getItemAsync(LLAVE_SESION);
    return texto ? (JSON.parse(texto) as Sesion) : null;
  } catch {
    // Si lo guardado está dañado se trata como si no hubiera sesión.
    return null;
  }
}

async function borrarSesion() {
  await SecureStore.deleteItemAsync(LLAVE_SESION);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoAuth>('cargando');
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);

  // La sesión vive en una ref para que conSesion siempre use el token más nuevo
  // sin volver a crear las funciones en cada render.
  const sesionRef = useRef<Sesion | null>(null);
  // Si varias peticiones reciben 401 a la vez, se renueva el token una sola vez.
  const renovacionRef = useRef<Promise<Sesion | null> | null>(null);

  const aplicarRespuesta = useCallback(async (respuesta: RespuestaSesion) => {
    sesionRef.current = respuesta.sesion;
    await guardarSesion(respuesta.sesion);
    setUsuario(respuesta.usuario);
    setPerfil(respuesta.perfil);
    setEstado('con-sesion');
  }, []);

  const cerrarSesion = useCallback(async () => {
    sesionRef.current = null;
    await borrarSesion();
    setUsuario(null);
    setPerfil(null);
    setEstado('sin-sesion');
  }, []);

  const renovar = useCallback(async (): Promise<Sesion | null> => {
    const actual = sesionRef.current;
    if (!actual) return null;

    if (!renovacionRef.current) {
      renovacionRef.current = authApi
        .renovarSesion(actual.refreshToken)
        .then(async (respuesta) => {
          await aplicarRespuesta(respuesta);
          return respuesta.sesion;
        })
        .catch(async (error) => {
          // Solo se cierra la sesión si el backend dice que ya no es válida;
          // un error de red no debe sacar al usuario.
          if (esErrorApi(error) && error.tipo === 'sesion') {
            await cerrarSesion();
            return null;
          }
          throw error;
        })
        .finally(() => {
          renovacionRef.current = null;
        });
    }

    return renovacionRef.current;
  }, [aplicarRespuesta, cerrarSesion]);

  const conSesion = useCallback(
    async <T,>(peticion: (token: string) => Promise<T>): Promise<T> => {
      const sesion = sesionRef.current;
      if (!sesion) throw new Error('No hay sesión iniciada');

      try {
        return await peticion(sesion.token);
      } catch (error) {
        if (!(esErrorApi(error) && error.tipo === 'sesion')) throw error;

        const nueva = await renovar();
        if (!nueva) throw error;
        return peticion(nueva.token);
      }
    },
    [renovar],
  );

  const recargarPerfil = useCallback(async () => {
    const respuesta = await conSesion((token) => authApi.obtenerMe(token));
    setUsuario(respuesta.usuario);
    setPerfil(respuesta.perfil);
  }, [conSesion]);

  const iniciarSesion = useCallback(
    async (email: string, password: string) => {
      await aplicarRespuesta(await authApi.iniciarSesion(email, password));
    },
    [aplicarRespuesta],
  );

  const registrarse = useCallback(
    async (email: string, password: string) => {
      await aplicarRespuesta(await authApi.registrar(email, password));
    },
    [aplicarRespuesta],
  );

  // Al abrir la app: si hay una sesión guardada, se valida con GET /me.
  useEffect(() => {
    let cancelado = false;

    (async () => {
      const guardada = await leerSesion();
      if (cancelado) return;

      if (!guardada) {
        setEstado('sin-sesion');
        return;
      }

      sesionRef.current = guardada;
      try {
        await recargarPerfil();
        if (!cancelado) setEstado('con-sesion');
      } catch (error) {
        if (cancelado) return;
        if (sesionRef.current) {
          // Error de red u otro: se mantiene la sesión y las pantallas
          // muestran el error con un botón para reintentar.
          console.warn('No se pudo cargar el perfil al iniciar', error);
          setEstado('con-sesion');
        } else {
          setEstado('sin-sesion');
        }
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [recargarPerfil]);

  const valor = useMemo<ValorAuth>(
    () => ({
      estado,
      usuario,
      perfil,
      iniciarSesion,
      registrarse,
      cerrarSesion,
      conSesion,
      recargarPerfil,
      actualizarPerfilLocal: setPerfil,
    }),
    [estado, usuario, perfil, iniciarSesion, registrarse, cerrarSesion, conSesion, recargarPerfil],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const valor = useContext(AuthContext);
  if (!valor) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return valor;
}
