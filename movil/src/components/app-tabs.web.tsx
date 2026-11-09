import { Tabs, TabList, TabTrigger, TabSlot, type TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet, Text } from 'react-native';

import { AreaTactilMinima, Retro } from '@/constants/retro';

// Versión web de la barra de pestañas (solo para probar en el navegador).
export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      <TabList style={styles.barra}>
        <TabTrigger name="index" href="/" asChild>
          <BotonPestana>Mapa</BotonPestana>
        </TabTrigger>
        <TabTrigger name="hechizos" href="/hechizos" asChild>
          <BotonPestana>Hechizos</BotonPestana>
        </TabTrigger>
        <TabTrigger name="perfil" href="/perfil" asChild>
          <BotonPestana>Perfil</BotonPestana>
        </TabTrigger>
        <TabTrigger name="configuracion" href="/configuracion" asChild>
          <BotonPestana>Configuración</BotonPestana>
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

function BotonPestana({ children, isFocused, onPress, onLongPress }: TabTriggerSlotProps) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      style={styles.boton}>
      <Text style={[styles.texto, isFocused && styles.textoActivo]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    backgroundColor: Retro.superficie,
    borderTopWidth: 2,
    borderTopColor: Retro.borde,
  },
  boton: { flex: 1, minHeight: AreaTactilMinima, alignItems: 'center', justifyContent: 'center' },
  texto: { color: Retro.textoSecundario, fontSize: 14, fontWeight: '600' },
  textoActivo: { color: Retro.oro },
});
