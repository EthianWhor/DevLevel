import { StyleSheet, View } from 'react-native';

import { Colores } from '@/theme';

// Emblema de DevLevel dibujado con "píxeles" (cuadritos de colores), al
// estilo retro del diseño. Cada letra del mapa es un color:
//   Y = oro   D = oro oscuro   G = verde   K = negro   B = fondo del escudo
//   . = transparente
const MAPA = [
  '...YYYYYYY...',
  '.YYDDDDDDDYY.',
  'YDBBBBGBBBBDY',
  'YDBBBGBGBBBDY',
  'YDBBGBKBGBBDY',
  'YDBGBKKKBGBDY',
  'YDBBGBKBGBBDY',
  'YDBBBGBGBBBDY',
  'YDBBBBGBBBBDY',
  '.YDBBBYBBBDY.',
  '..YDBYYYBDY..',
  '...YDBYBDY...',
  '....YDDDY....',
  '.....YYY.....',
];

const COLORES: Record<string, string> = {
  Y: Colores.oro,
  D: '#c9a227',
  G: Colores.verde,
  K: '#0b0a05',
  B: Colores.superficie,
};

export function EmblemaPixel({ tamano = 10 }: { tamano?: number }) {
  return (
    <View
      style={estilos.emblema}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Emblema de DevLevel">
      {MAPA.map((fila, y) => (
        <View key={y} style={estilos.fila}>
          {fila.split('').map((letra, x) => (
            <View
              key={x}
              style={{
                width: tamano,
                height: tamano,
                backgroundColor: COLORES[letra] ?? 'transparent',
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  emblema: { alignItems: 'center' },
  fila: { flexDirection: 'row' },
});
