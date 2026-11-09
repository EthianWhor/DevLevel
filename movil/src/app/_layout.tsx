import { DarkTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { SpaceGrotesk_500Medium, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';

import { Retro } from '@/constants/retro';
import { AuthProvider, useAuth } from '@/context/auth-context';

// El splash nativo se queda visible hasta saber si hay sesión guardada.
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
function Navegacion() {
  const { estado } = useAuth();

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
    if (estado !== 'cargando' && fuentesListas) {
      SplashScreen.hideAsync();
    }
  }, [estado, fuentesListas]);

  if (estado === 'cargando' || !fuentesListas) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Retro.fondo } }}>
      <Stack.Protected guard={estado === 'sin-sesion'}>
        <Stack.Screen name="login" />
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
        <Navegacion />
      </AuthProvider>
    </ThemeProvider>
  );
}
