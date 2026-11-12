import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { guiasDelNivel } from '@/constants/guias-niveles';
import { AlturaLinea, AreaTactilMinima, Colores, Espacio, Fuentes, Tamanos } from '@/theme';

type Props = { nivelOrden: number };

// "Cómo se usa": qué hay de nuevo en el nivel y qué tocar en la app para usarlo.
export function GuiaNivel({ nivelOrden }: Props) {
  const guias = guiasDelNivel(nivelOrden);
  if (guias.length === 0) return null;

  return (
    <View style={estilos.contenedor}>
      <Text accessibilityRole="header" style={estilos.encabezado}>
        🎮 Cómo se usa en la mazmorra
      </Text>
      {guias.map((g) => (
        <View key={g.titulo} style={estilos.guia}>
          <Text accessibilityRole="header" style={estilos.titulo}>
            {g.titulo}
          </Text>
          <Text style={estilos.texto}>{g.queHace}</Text>
          {g.pasos.map((p, i) => (
            <View key={p} style={estilos.paso}>
              <Text style={estilos.numero} importantForAccessibility="no" accessibilityElementsHidden>
                {i + 1}
              </Text>
              <Text style={[estilos.texto, estilos.textoPaso]} accessibilityLabel={`Paso ${i + 1}: ${p}`}>
                {p}
              </Text>
            </View>
          ))}
          {g.ejemplo ? (
            <View style={estilos.ejemplo}>
              <Text style={estilos.etiqueta}>Así se ve</Text>
              <Text style={estilos.codigo} accessibilityLabel={`Ejemplo: ${g.ejemplo.replace(/\n/g, ', ')}`}>
                {g.ejemplo}
              </Text>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

// Versión plegable para la pantalla de la mazmorra.
export function GuiaNivelPlegable({ nivelOrden }: Props) {
  const [abierta, setAbierta] = useState(false);
  if (guiasDelNivel(nivelOrden).length === 0) return null;
  return (
    <View style={estilos.plegable}>
      <Pressable
        onPress={() => setAbierta((a) => !a)}
        accessibilityRole="button"
        accessibilityLabel="Cómo se usa"
        accessibilityHint={abierta ? 'Oculta la guía' : 'Muestra la guía de este nivel'}
        accessibilityState={{ expanded: abierta }}
        style={estilos.botonPlegable}>
        <Text style={estilos.textoBoton}>{abierta ? '▾ Ocultar guía' : '❓ Cómo se usa'}</Text>
      </Pressable>
      {abierta ? <GuiaNivel nivelOrden={nivelOrden} /> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: Espacio.sm, padding: Espacio.md, borderWidth: 3, borderColor: Colores.oro, backgroundColor: Colores.mazmorra },
  encabezado: { fontFamily: Fuentes.codigo, fontSize: Tamanos.cuerpo, lineHeight: AlturaLinea.cuerpo, letterSpacing: 1, color: Colores.oro },
  guia: { gap: Espacio.xs, paddingTop: Espacio.sm, borderTopWidth: 2, borderTopColor: Colores.bordePixel },
  titulo: { fontFamily: Fuentes.cuerpoNegrita, fontSize: Tamanos.cuerpo, lineHeight: AlturaLinea.cuerpo, color: Colores.texto },
  texto: { fontFamily: Fuentes.cuerpo, fontSize: Tamanos.pequeno, lineHeight: AlturaLinea.pequeno, color: Colores.texto },
  paso: { flexDirection: 'row', gap: Espacio.sm, alignItems: 'flex-start' },
  numero: {
    minWidth: 22,
    textAlign: 'center',
    fontFamily: Fuentes.codigo,
    fontSize: Tamanos.pequeno,
    lineHeight: AlturaLinea.pequeno,
    color: Colores.textoSobreOro,
    backgroundColor: Colores.oro,
  },
  textoPaso: { flex: 1 },
  ejemplo: { gap: 2, padding: Espacio.sm, borderWidth: 2, borderColor: Colores.bordePixel, backgroundColor: '#0f172a' },
  etiqueta: { fontFamily: Fuentes.cuerpoNegrita, fontSize: 13, lineHeight: 18, color: Colores.textoSecundario },
  codigo: { fontFamily: Fuentes.codigo, fontSize: Tamanos.pequeno, lineHeight: AlturaLinea.pequeno, color: Colores.verde },
  plegable: { gap: Espacio.sm },
  botonPlegable: {
    minHeight: AreaTactilMinima,
    justifyContent: 'center',
    paddingHorizontal: Espacio.md,
    borderWidth: 2,
    borderColor: Colores.oro,
    alignSelf: 'flex-start',
  },
  textoBoton: { fontFamily: Fuentes.codigo, fontSize: Tamanos.pequeno, letterSpacing: 1, color: Colores.oro },
});
