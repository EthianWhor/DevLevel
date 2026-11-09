import { Pressable, StyleSheet, Text } from 'react-native';

import { PantallaPendiente } from '@/components/pantalla-pendiente';
import { AreaTactilMinima, Retro } from '@/constants/retro';
import { useAuth } from '@/context/auth-context';

export default function ConfiguracionScreen() {
  const { cerrarSesion } = useAuth();

  return (
    <PantallaPendiente
      titulo="Configuración"
      descripcion="Aquí estarán las opciones de accesibilidad, sonido y vibración.">
      <Pressable
        onPress={cerrarSesion}
        accessibilityRole="button"
        style={({ pressed }) => [styles.boton, pressed && { opacity: 0.8 }]}>
        <Text style={styles.texto}>Cerrar sesión</Text>
      </Pressable>
    </PantallaPendiente>
  );
}

const styles = StyleSheet.create({
  boton: {
    minHeight: AreaTactilMinima,
    paddingHorizontal: 20,
    marginTop: 12,
    borderWidth: 2,
    borderColor: Retro.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: { color: Retro.error, fontSize: 16, fontWeight: '700' },
});
