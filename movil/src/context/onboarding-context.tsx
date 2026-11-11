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

// Recuerda si el usuario ya vio la introducción (Onboarding) en este celular.
// No es un dato sensible, por eso va en AsyncStorage y no en SecureStore.
const LLAVE_ONBOARDING = 'devlevel_onboarding_visto';

type ValorOnboarding = {
  // null mientras se lee lo guardado.
  visto: boolean | null;
  marcarVisto: () => Promise<void>;
};

const OnboardingContext = createContext<ValorOnboarding | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [visto, setVisto] = useState<boolean | null>(null);

  useEffect(() => {
    let activo = true;
    AsyncStorage.getItem(LLAVE_ONBOARDING)
      .then((valor) => {
        if (activo) setVisto(valor === 'si');
      })
      .catch(() => {
        // Si no se puede leer, se muestra la introducción otra vez.
        if (activo) setVisto(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  const marcarVisto = useCallback(async () => {
    setVisto(true);
    try {
      await AsyncStorage.setItem(LLAVE_ONBOARDING, 'si');
    } catch {
      // Si no se guarda, la introducción vuelve a salir la próxima vez; no es grave.
    }
  }, []);

  const valor = useMemo(() => ({ visto, marcarVisto }), [visto, marcarVisto]);

  return <OnboardingContext.Provider value={valor}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const valor = useContext(OnboardingContext);
  if (!valor) throw new Error('useOnboarding debe usarse dentro de <OnboardingProvider>');
  return valor;
}
