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
  tarjeta: {
    backgroundColor: Colores.superficie,
    borderColor: Colores.borde,
    borderWidth: 2,
    borderRadius: Radio.md,
    padding: Espacio.md,
  },
});