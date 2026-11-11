import { Tabs, TabList, TabSlot, TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AreaTactilMinima, Retro } from '@/constants/retro';

// Barra de pestañas propia con el estilo de Stitch: oscura con borde
// superior, ícono + etiqueta en mayúsculas y la pestaña elegida como una
// "píldora" dorada. Cada botón tiene rol de pestaña y estado seleccionado.
export default function AppTabs() {
  const { bottom } = useSafeAreaInsets();
  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      <TabList style={[estilos.barra, { paddingBottom: Math.max(bottom, 6) }]}>
        <TabTrigger name="index" href="/" asChild>
          <BotonPestana icono="🗺">Mapa</BotonPestana>
        </TabTrigger>
        <TabTrigger name="hechizos" href="/hechizos" asChild>
          <BotonPestana icono="📖">Hechizos</BotonPestana>
        </TabTrigger>
        <TabTrigger name="perfil" href="/perfil" asChild>
          <BotonPestana icono="👤">Héroe</BotonPestana>
        </TabTrigger>
        <TabTrigger name="configuracion" href="/configuracion" asChild>
          <BotonPestana icono="⚙">Ajustes</BotonPestana>
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

function BotonPestana({
  children,
  icono,
  isFocused,
  onPress,
  onLongPress,
}: TabTriggerSlotProps & { icono: string }) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="tab"
      accessibilityLabel={String(children)}
      accessibilityState={{ selected: Boolean(isFocused) }}
      style={estilos.boton}>
      <View style={[estilos.pildora, isFocused && estilos.pildoraActiva]}>
        <Text style={estilos.icono}>{icono}</Text>
        <Text style={[estilos.texto, isFocused && estilos.textoActivo]}>{String(children).toUpperCase()}</Text>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    backgroundColor: Retro.superficie,
    borderTopWidth: 4,
    borderTopColor: Retro.bordePixel,
    paddingTop: 6,
    paddingHorizontal: 4,
  },
  boton: { flex: 1, minHeight: AreaTactilMinima + 8, alignItems: 'center', justifyContent: 'center' },
  pildora: { alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderWidth: 2, borderColor: 'transparent' },
  pildoraActiva: {
    backgroundColor: Retro.oro,
    borderColor: Retro.oroClaro,
    borderBottomColor: Retro.oroOscuro,
    borderBottomWidth: 4,
  },
  icono: { fontSize: 18, lineHeight: 22 },
  texto: { fontFamily: 'JetBrainsMono_400Regular', fontSize: 11, lineHeight: 15, letterSpacing: 0.5, color: Retro.textoSecundario },
  textoActivo: { color: Retro.textoSobreOro },
});
