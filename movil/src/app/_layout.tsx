import { DarkTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { useFonts } from 'expo-font';
import { SpaceGrotesk_500Medium, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';

import { PantallaSplash } from '@/components/pantalla-splash';
import { Retro } from '@/constants/retro';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { OnboardingProvider, useOnboarding } from '@/context/onboarding-context';
import { PreferenciasProvider } from '@/context/preferencias-context';

// El splash nativo se queda visible hasta que cargan las fuentes; después
// sigue el splash animado de la app.
SplashScreen.preventAutoHideAsync();

const temaNavegacion = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Retro.fondo,
    card: Retro.superficie,
    text: Retro.texto,
    border: Retro.borde,
    primary: Retro.oro,
  },
};

// Redirección según la sesión: las pantallas dentro de cada Stack.Protected
// solo existen cuando su guard es verdadero. Si el usuario cierra sesión,
// expo-router lo saca de las pantallas protegidas y lo lleva al login.
// Sin sesión, la primera vez se muestra el Onboarding y después el login.
function Navegacion() {
  const { estado } = useAuth();
  const { visto: onboardingVisto } = useOnboarding();
  const [splashTerminado, setSplashTerminado] = useState(false);
  const alTerminarSplash = useCallback(() => setSplashTerminado(true), []);

  const [fuentesCargadas, errorFuentes] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
    Inter_400Regular,
    Inter_600SemiBold,
    JetBrainsMono_400Regular,
  });
  // Si una fuente falla, la app sigue con la fuente del sistema.
  const fuentesListas = fuentesCargadas || errorFuentes !== null;

  useEffect(() => {
    if (fuentesListas) SplashScreen.hideAsync();
  }, [fuentesListas]);

  if (!fuentesListas) return null;

  // El splash animado se queda hasta que termina su animación y se sabe si
  // hay sesión guardada (eso puede tardar si Render está despertando).
  if (!splashTerminado || estado === 'cargando' || onboardingVisto === null) {
    return <PantallaSplash onTerminar={alTerminarSplash} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Retro.fondo } }}>
      <Stack.Protected guard={estado === 'sin-sesion' && !onboardingVisto}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>

      {/* Login solo después de la introducción: expo-router manda a la primera
          ruta disponible, así que no pueden estar las dos a la vez. */}
      <Stack.Protected guard={estado === 'sin-sesion' && onboardingVisto === true}>
        <Stack.Screen name="login" />
        <Stack.Screen name="recuperar" />
      </Stack.Protected>

      <Stack.Protected guard={estado === 'con-sesion'}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="personaje" />
        <Stack.Screen name="nivel/[id]" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider value={temaNavegacion}>
      <StatusBar style="light" />
      <AuthProvider>
        <PreferenciasProvider>
          <OnboardingProvider>
            <Navegacion />
          </OnboardingProvider>
        </PreferenciasProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
