import { StyleSheet, Text, View } from 'react-native';

import { AlturaLinea, Colores, Espacio, Fuentes, Tamanos } from '@/theme';

type Props = {
  vida: number;
  vidaMax: number;
  energia: number;
  monedas: number;
  monedasTotales: number;
  ataque: number;
};

// Indicadores del héroe: siempre ícono + número + texto para TalkBack.
export function Hud({ vida, vidaMax, energia, monedas, monedasTotales, ataque }: Props) {
  const datos = [
    { icono: '❤️', valor: `${vida}/${vidaMax}`, etiqueta: `Vida ${vida} de ${vidaMax}` },
    { icono: '⚡', valor: `${energia}`, etiqueta: `Energía ${energia}` },
    { icono: '🪙', valor: `${monedas}/${monedasTotales}`, etiqueta: `Monedas ${monedas} de ${monedasTotales}` },
    { icono: '⚔️', valor: `${ataque}`, etiqueta: `Ataque ${ataque}` },
  ];
  return (
    <View style={estilos.fila}>
      {datos.map((d) => (
        <View key={d.icono} style={estilos.dato} accessible accessibilityLabel={d.etiqueta}>
          <Text style={estilos.icono}>{d.icono}</Text>
          <Text style={estilos.valor}>{d.valor}</Text>
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', gap: Espacio.xs, justifyContent: 'center' },
  dato: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Espacio.sm,
    paddingVertical: 2,
    backgroundColor: '#0f172a',
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  icono: { fontSize: Tamanos.pequeno, lineHeight: AlturaLinea.pequeno },
  valor: { fontFamily: Fuentes.codigo, fontSize: Tamanos.pequeno, lineHeight: AlturaLinea.pequeno, color: Colores.texto },
});
