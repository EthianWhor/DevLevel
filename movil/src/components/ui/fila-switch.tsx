import { StyleSheet, Switch, Text, View } from 'react-native';

import { AreaTactilMinima, Colores, Espacio, Fuentes, Tamanos } from '@/theme';

type Props = {
  etiqueta: string;
  // Texto secundario opcional que se lee después de la etiqueta con TalkBack.
  descripcion?: string;
  valor: boolean;
  onChange: (nuevo: boolean) => void;
  deshabilitado?: boolean;
};

// Fila de ajuste con etiqueta a la izquierda y Switch nativo a la derecha.
// El Switch tiene su propia accessibilityRole implícita ("switch") y anuncia
// su estado (encendido/apagado) al lector de pantalla. La etiqueta textual
// se lee como parte de la misma fila para que TalkBack no la separe.
export function FilaSwitch({ etiqueta, descripcion, valor, onChange, deshabilitado = false }: Props) {
  return (
    <View style={estilos.fila}>
      <View style={estilos.textos}>
        <Text style={estilos.etiqueta}>{etiqueta}</Text>
        {descripcion ? <Text style={estilos.descripcion}>{descripcion}</Text> : null}
      </View>
      <Switch
        value={valor}
        onValueChange={onChange}
        disabled={deshabilitado}
        accessibilityLabel={etiqueta}
        accessibilityHint={descripcion}
        accessibilityState={{ checked: valor, disabled: deshabilitado }}
        trackColor={{ false: Colores.borde, true: Colores.oroOscuro }}
        thumbColor={valor ? Colores.oro : Colores.superficieAlta}
        ios_backgroundColor={Colores.borde}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: {
    minHeight: AreaTactilMinima,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Espacio.md,
    paddingVertical: Espacio.sm,
  },
  textos: { flex: 1, gap: Espacio.xs },
  etiqueta: {
    fontFamily: Fuentes.cuerpoNegrita,
    fontSize: Tamanos.cuerpo,
    lineHeight: 24,
    color: Colores.texto,
  },
  descripcion: {
    fontFamily: Fuentes.cuerpo,
    fontSize: Tamanos.pequeno,
    lineHeight: 20,
    color: Colores.textoSecundario,
  },
});