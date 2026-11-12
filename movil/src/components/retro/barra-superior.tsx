import { StyleSheet, Text, View } from 'react-native';

import { Sprite } from '@/components/pixel/sprite';
import { PALETA_HEROE, spriteHeroe } from '@/components/pixel/sprites';
import { useAuth } from '@/context/auth-context';
import { AlturaLinea, Colores, Espacio, Fuentes, Tamanos } from '@/theme';

// Rango del jugador según su nivel (aparece junto al nivel, como en Stitch).
export function rango(nivel: number): string {
  if (nivel >= 9) return 'MAESTRO';
  if (nivel >= 7) return 'HECHICERO';
  if (nivel >= 5) return 'AVENTURERO';
  if (nivel >= 3) return 'APRENDIZ';
  return 'NOVATO';
}

// Barra superior común: avatar en marco, DevLevel, nivel y rango, y la ⚡.
export function BarraSuperior({ titulo = 'DevLevel' }: { titulo?: string }) {
  const { perfil } = useAuth();
  const avatar = perfil?.avatar ?? 'explorador';
  const nivel = perfil?.nivel ?? 1;
  return (
    <View
      style={estilos.barra}
      accessible
      accessibilityRole="header"
      accessibilityLabel={`${titulo}. ${perfil?.nombreHeroe ?? 'Héroe'}, nivel ${nivel}, ${rango(nivel).toLowerCase()}`}>
      <View style={estilos.avatar}>
        <Sprite mapa={spriteHeroe('sur', avatar).mapa} paleta={PALETA_HEROE[avatar]} tamano={36} />
      </View>
      <View style={estilos.textos}>
        <Text style={estilos.titulo}>{titulo}</Text>
        <Text style={estilos.nivel}>
          NIVEL {nivel}: {rango(nivel)}
        </Text>
      </View>
      <View style={estilos.rayo}>
        <Text style={estilos.textoRayo}>⚡</Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.md,
    paddingHorizontal: Espacio.md,
    paddingVertical: Espacio.sm,
    backgroundColor: Colores.fondo,
    borderBottomWidth: 4,
    borderBottomColor: Colores.bordePixel,
  },
  avatar: { borderWidth: 2, borderColor: Colores.bordePixel, backgroundColor: Colores.mazmorra, padding: 2 },
  textos: { flex: 1 },
  titulo: { fontFamily: Fuentes.titulo, fontSize: Tamanos.subtitulo + 2, lineHeight: AlturaLinea.subtitulo + 2, color: Colores.oro },
  nivel: { fontFamily: Fuentes.codigo, fontSize: 13, lineHeight: 18, color: Colores.oro, letterSpacing: 1 },
  rayo: { borderWidth: 2, borderColor: Colores.bordePixel, padding: 6 },
  textoRayo: { fontSize: Tamanos.subtitulo, color: Colores.oro },
});
