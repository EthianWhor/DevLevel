import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AreaTactilMinima, Colores, Espacio, Radio } from '@/theme';

type Props = {
  children: ReactNode;
  onPress?: () => void;
  etiqueta?: string; // accessibilityLabel (obligatoria si es tocable)
};

export function Tarjeta({ children, onPress, etiqueta }: Props) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={etiqueta}
        style={[estilos.tarjeta, { minHeight: AreaTactilMinima }]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={estilos.tarjeta}>{children}</View>;
}

const estilos = StyleSheet.create({
  // Marco pixel de Retro-Logic: borde grueso y escalón abajo a la derecha
  // (simula la sombra dura del diseño, sin difuminar).
  tarjeta: {
    backgroundColor: Colores.superficieAlta,
    borderColor: Colores.bordePixel,
    borderWidth: 3,
    borderBottomWidth: 7,
    borderRightWidth: 7,
    borderRadius: Radio.sm,
    padding: Espacio.md,
  },
});