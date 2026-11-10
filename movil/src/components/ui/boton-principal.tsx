import { Pressable, StyleSheet, Text } from 'react-native';

import { usePreferencias } from '@/context/preferencias-context';
import { AreaTactilMinima, Colores, Espacio, Fuentes, Radio, Tamanos } from '@/theme';

type Variante = 'primario' | 'peligro';

type Props = {
  titulo: string;
  onPress: () => void;
  deshabilitado?: boolean;
  pista?: string; // accessibilityHint
  variante?: Variante;
};

export function BotonPrincipal({
  titulo,
  onPress,
  deshabilitado = false,
  pista,
  variante = 'primario',
}: Props) {
  // Si el usuario activa "Reducir movimiento", se desactiva el desplazamiento
  // del botón al presionarlo. Es una preferencia global y observable.
  const { preferencias } = usePreferencias();
  const animarPulsacion = !preferencias.reducirMovimiento;

  const esPeligro = variante === 'peligro';

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
        esPeligro && estilos.peligro,
        deshabilitado && estilos.deshabilitado,
        pressed && animarPulsacion && estilos.presionado,
      ]}
    >
      <Text style={[estilos.texto, esPeligro && estilos.textoPeligro]}>{titulo}</Text>
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
  peligro: {
    backgroundColor: Colores.superficie,
    borderWidth: 2,
    borderColor: Colores.error,
    borderBottomWidth: 4,
    borderBottomColor: Colores.error,
  },
  presionado: { transform: [{ translateY: 2 }], borderBottomWidth: 2 },
  deshabilitado: { backgroundColor: Colores.superficieAlta, borderBottomColor: Colores.borde },
  texto: {
    fontFamily: Fuentes.titulo,
    fontSize: Tamanos.cuerpo,
    color: Colores.textoSobreOro,
    textAlign: 'center',
  },
  textoPeligro: { color: Colores.error },
});