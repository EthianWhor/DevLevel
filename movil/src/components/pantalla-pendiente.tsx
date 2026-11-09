import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Retro } from '@/constants/retro';

// Contenido temporal de las pestañas cuya pantalla aún no está construida.
export function PantallaPendiente({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion: string;
  children?: ReactNode;
}) {
  return (
    <SafeAreaView style={styles.pantalla} edges={['top', 'left', 'right']}>
      <View style={styles.contenido}>
        <Text style={styles.titulo} accessibilityRole="header">
          {titulo}
        </Text>
        <Text style={styles.descripcion}>{descripcion}</Text>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: Retro.fondo },
  contenido: { flex: 1, padding: 20, gap: 12, justifyContent: 'center', alignItems: 'center' },
  titulo: { color: Retro.texto, fontSize: 28, lineHeight: 34, fontWeight: '700', textAlign: 'center' },
  descripcion: { color: Retro.textoSecundario, fontSize: 16, lineHeight: 24, textAlign: 'center' },
});
