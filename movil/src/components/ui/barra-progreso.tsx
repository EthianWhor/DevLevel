import { StyleSheet, View } from 'react-native';

import { Colores, Espacio } from '@/theme';

type Props = {
  total: number;
  actual: number; // segmentos completados
  etiqueta?: string;
};

export function BarraProgreso({ total, actual, etiqueta = 'Progreso' }: Props) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={etiqueta}
      accessibilityValue={{ min: 0, max: total, now: actual, text: `${actual} de ${total}` }}
      style={estilos.fila}
    >
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[estilos.segmento, { backgroundColor: i < actual ? Colores.verde : Colores.borde }]}
        />
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', gap: Espacio.xs },
  segmento: { flex: 1, height: 12, borderRadius: 2 },
});