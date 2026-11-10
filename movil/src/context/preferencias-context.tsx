import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

// Preferencias de accesibilidad del usuario. No son secretos, por eso viven
// en AsyncStorage y no en SecureStore (que está reservado para el token).
const LLAVE_PREFERENCIAS = 'devlevel_preferencias';

export type Preferencias = {
  reducirMovimiento: boolean;
  sonido: boolean;
  vibracion: boolean;
};

// Valores iniciales razonables: la app vibra y suena por defecto, y respeta
// el movimiento salvo que el usuario lo desactive.
const PREFERENCIAS_POR_DEFECTO: Preferencias = {
  reducirMovimiento: false,
  sonido: true,
  vibracion: true,
};

type ValorPreferencias = {
  preferencias: Preferencias;
  // true mientras se lee lo guardado. La UI puede esperar a que termine
  // antes de mostrar los switches con el valor definitivo.
  cargando: boolean;
  cambiar: <K extends keyof Preferencias>(clave: K, valor: Preferencias[K]) => Promise<void>;
};

const PreferenciasContext = createContext<ValorPreferencias | null>(null);

async function leerPreferenciasGuardadas(): Promise<Preferencias | null> {
  try {
    const texto = await AsyncStorage.getItem(LLAVE_PREFERENCIAS);
    if (!texto) return null;
    const guardadas = JSON.parse(texto) as Partial<Preferencias>;
    // Se mezclan con los defaults por si el formato cambió entre versiones.
    return { ...PREFERENCIAS_POR_DEFECTO, ...guardadas };
  } catch {
    // JSON dañado o error de lectura: se usan los defaults sin romper la app.
    return null;
  }
}

async function guardarPreferencias(preferencias: Preferencias): Promise<void> {
  await AsyncStorage.setItem(LLAVE_PREFERENCIAS, JSON.stringify(preferencias));
}

export function PreferenciasProvider({ children }: { children: ReactNode }) {
  const [preferencias, setPreferencias] = useState<Preferencias>(PREFERENCIAS_POR_DEFECTO);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const guardadas = await leerPreferenciasGuardadas();
      if (cancelado) return;
      if (guardadas) setPreferencias(guardadas);
      setCargando(false);
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  const cambiar = useCallback(
    async <K extends keyof Preferencias>(clave: K, valor: Preferencias[K]) => {
      // Actualización optimista: el switch responde al instante. Si guardar
      // falla, se revierte para que el estado visible coincida con lo persistido.
      const anterior = preferencias;
      const siguiente = { ...anterior, [clave]: valor };
      setPreferencias(siguiente);
      try {
        await guardarPreferencias(siguiente);
      } catch {
        setPreferencias(anterior);
      }
    },
    [preferencias],
  );

  const valor = useMemo<ValorPreferencias>(
    () => ({ preferencias, cargando, cambiar }),
    [preferencias, cargando, cambiar],
  );

  return <PreferenciasContext.Provider value={valor}>{children}</PreferenciasContext.Provider>;
}

export function usePreferencias() {
  const valor = useContext(PreferenciasContext);
  if (!valor) throw new Error('usePreferencias debe usarse dentro de <PreferenciasProvider>');
  return valor;
}