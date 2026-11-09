import { Pressable, StyleSheet, Text } from 'react-native';

import { AreaTactilMinima, Colores, Espacio, Fuentes, Radio, Tamanos } from '@/theme';

type Props = {
  titulo: string;
  onPress: () => void;
  deshabilitado?: boolean;
  pista?: string; // accessibilityHint
};

export function BotonPrincipal({ titulo, onPress, deshabilitado = false, pista }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityHint={pista}
      accessibilityState={{ disabled: deshabilitado }}
      style={({ pressed }) => [
        estilos.boton,
        deshabilitado && estilos.deshabilitado,
        pressed && estilos.presionado,
      ]}
    >
      <Text style={estilos.texto}>{titulo}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  boton: {
    minHeight: AreaTactilMinima,
    backgroundColor: Colores.oro,
    borderRadius: Radio.sm,
    borderBottomWidth: 4,
    borderBottomColor: Colores.oroOscuro,
    paddingHorizontal: Espacio.lg,
    paddingVertical: Espacio.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presionado: { transform: [{ translateY: 2 }], borderBottomWidth: 2 },
  deshabilitado: { backgroundColor: Colores.superficieAlta, borderBottomColor: Colores.borde },
  texto: {
    fontFamily: Fuentes.titulo,
    fontSize: Tamanos.cuerpo,
    color: Colores.textoSobreOro,
    textAlign: 'center',
  },
});