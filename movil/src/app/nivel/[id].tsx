// Destino temporal al tocar un nivel en el mapa.
// Lo reemplaza la pantalla Concepto (explicación del nivel antes de los retos).
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { PantallaPendiente } from '@/components/pantalla-pendiente';
import { AreaTactilMinima, Retro } from '@/constants/retro';

export default function NivelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <PantallaPendiente
      titulo={`Nivel ${id}`}
      descripcion="Aquí se mostrará el concepto del nivel y después sus retos.">
      <Pressable onPress={() => router.back()} accessibilityRole="button" style={styles.boton}>
        <Text style={styles.texto}>Volver al mapa</Text>
      </Pressable>
    </PantallaPendiente>
  );
}

const styles = StyleSheet.create({
  boton: {
    minHeight: AreaTactilMinima,
    paddingHorizontal: 20,
    backgroundColor: Retro.oro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: { color: Retro.textoSobreOro, fontSize: 16, fontWeight: '700' },
});
