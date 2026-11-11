import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { AlturaLinea, Colores, Espacio, Fuentes, Tamanos } from '@/theme';

type Props = {
  children: ReactNode;
  titulo?: string;
  icono?: string;
  // Color del borde (por defecto el borde pixel del diseño).
  color?: string;
  // Esquinas doradas tipo visor, como en el Splash del diseño.
  esquinas?: boolean;
  style?: StyleProp<ViewStyle>;
};

// Contenedor "Brutalist-Pixel" de Retro-Logic: borde grueso, sombra dura
// desplazada (sin difuminar) y encabezado en JetBrains Mono.
export function MarcoPixel({ children, titulo, icono, color = Colores.bordePixel, esquinas = false, style }: Props) {
  return (
    <View style={[estilos.envoltorio, style]}>
      <View style={[estilos.sombra, { backgroundColor: Colores.bordePixel }]} />
      <View style={[estilos.marco, { borderColor: color }]}>
        {titulo ? (
          <View style={[estilos.cabecera, { borderBottomColor: color }]}>
            <Text style={estilos.titulo} accessibilityRole="header">
              {icono ? `${icono} ` : ''}
              {titulo.toUpperCase()}
            </Text>
          </View>
        ) : null}
        <View style={estilos.cuerpo}>{children}</View>
      </View>
      {esquinas ? (
        <>
          <View style={[estilos.esquina, estilos.arribaIzq]} />
          <View style={[estilos.esquina, estilos.arribaDer]} />
          <View style={[estilos.esquina, estilos.abajoIzq]} />
          <View style={[estilos.esquina, estilos.abajoDer]} />
        </>
      ) : null}
    </View>
  );
}

const ESQUINA = 14;

const estilos = StyleSheet.create({
  envoltorio: { marginRight: 6, marginBottom: 6 },
  sombra: { position: 'absolute', top: 6, left: 6, right: -6, bottom: -6 },
  marco: { borderWidth: 3, backgroundColor: Colores.superficieAlta },
  cabecera: { paddingHorizontal: Espacio.md, paddingVertical: Espacio.sm, borderBottomWidth: 2, backgroundColor: Colores.superficie },
  titulo: { fontFamily: Fuentes.codigo, fontSize: Tamanos.pequeno, lineHeight: AlturaLinea.pequeno, letterSpacing: 1.5, color: Colores.oro },
  cuerpo: { padding: Espacio.md, gap: Espacio.sm },
  esquina: { position: 'absolute', width: ESQUINA, height: ESQUINA, borderColor: Colores.oro },
  arribaIzq: { top: -5, left: -5, borderTopWidth: 3, borderLeftWidth: 3 },
  arribaDer: { top: -5, right: 1, borderTopWidth: 3, borderRightWidth: 3 },
  abajoIzq: { bottom: 1, left: -5, borderBottomWidth: 3, borderLeftWidth: 3 },
  abajoDer: { bottom: 1, right: 1, borderBottomWidth: 3, borderRightWidth: 3 },
});
