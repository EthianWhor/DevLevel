import { Redirect } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { esErrorApi } from '@/api';
import AppTabs from '@/components/app-tabs';
import { AreaTactilMinima, Retro } from '@/constants/retro';
import { useAuth } from '@/context/auth-context';

export default function TabsLayout() {
  const { perfil, recargarPerfil } = useAuth();
  const [reintentando, setReintentando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reintentar() {
    setReintentando(true);
    setError(null);
    try {
      await recargarPerfil();
    } catch (e) {
      setError(esErrorApi(e) ? e.message : 'No se pudo cargar tu perfil.');
    } finally {
      setReintentando(false);
    }
  }

  // El perfil no se pudo cargar al abrir la app (por ejemplo, sin internet).
  if (!perfil) {
    return (
      <View style={styles.centro}>
        <Text style={styles.texto}>{error ?? 'No se pudo cargar tu perfil.'}</Text>
        <Pressable
          onPress={reintentar}
          disabled={reintentando}
          accessibilityRole="button"
          accessibilityState={{ busy: reintentando }}
          style={styles.boton}>
          {reintentando ? (
            <ActivityIndicator color={Retro.textoSobreOro} />
          ) : (
            <Text style={styles.textoBoton}>Reintentar</Text>
          )}
        </Pressable>
      </View>
    );
  }

  // Si todavía no tiene héroe, primero pasa por Selección de personaje.
  if (!perfil.nombreHeroe || !perfil.avatar) {
    return <Redirect href="/personaje" />;
  }

  return <AppTabs />;
}

const styles = StyleSheet.create({
  centro: {
    flex: 1,
    backgroundColor: Retro.fondo,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 16,
  },
  texto: { color: Retro.texto, fontSize: 16, lineHeight: 24, textAlign: 'center' },
  boton: {
    minHeight: AreaTactilMinima,
    minWidth: 160,
    backgroundColor: Retro.oro,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  textoBoton: { color: Retro.textoSobreOro, fontSize: 16, fontWeight: '700' },
});
