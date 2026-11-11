import { StyleSheet, View } from 'react-native';

import { Colores } from '@/theme';

type Props = {
  valor: number;
  maximo: number;
  color: string;
  segmentos?: number;
  etiqueta: string;
};

// Barra de vida / XP / energía hecha de bloques, como en el perfil de Stitch.
export function BarraSegmentada({ valor, maximo, color, segmentos = 12, etiqueta }: Props) {
  const llenos = maximo > 0 ? Math.round((Math.min(valor, maximo) / maximo) * segmentos) : 0;
  return (
    <View
      style={estilos.barra}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={etiqueta}
      accessibilityValue={{ min: 0, max: maximo, now: Math.min(valor, maximo) }}>
      {Array.from({ length: segmentos }).map((_, i) => (
        <View key={i} style={[estilos.segmento, { backgroundColor: i < llenos ? color : Colores.superficie }]} />
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  barra: { flexDirection: 'row', gap: 2, padding: 3, borderWidth: 2, borderColor: Colores.bordePixel, backgroundColor: Colores.mazmorra },
  segmento: { flex: 1, height: 12 },
});
