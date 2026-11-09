import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { NivelMapa } from '@/api';
import { AreaTactilMinima, Retro } from '@/constants/retro';

const TEXTO_ESTADO = {
  completado: 'Completado',
  actual: 'Nivel actual',
  bloqueado: 'Bloqueado',
} as const;

const ICONO_ESTADO = {
  completado: '✓',
  actual: '▶',
  bloqueado: '🔒',
} as const;

function textoEstrellas(estrellas: number | null) {
  if (!estrellas) return '';
  return `${estrellas} de 3 estrellas`;
}

// Un nivel en el camino del mapa. El estado se comunica con ícono + texto
// (nunca solo con color) y los bloqueados mantienen contraste ≥ 4.5:1.
export function NodoNivel({
  nivel,
  esUltimo,
  onPress,
}: {
  nivel: NivelMapa;
  esUltimo: boolean;
  onPress: (nivel: NivelMapa) => void;
}) {
  const bloqueado = nivel.estado === 'bloqueado';
  const actual = nivel.estado === 'actual';
  const completado = nivel.estado === 'completado';

  const etiqueta = [
    `Nivel ${nivel.orden}: ${nivel.titulo}`,
    TEXTO_ESTADO[nivel.estado],
    completado ? textoEstrellas(nivel.estrellas) : '',
    !bloqueado ? `${nivel.xpRecompensa} XP` : '',
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <View style={styles.fila}>
      {/* Sendero: la línea que une los niveles en orden */}
      <View style={styles.columnaSendero} importantForAccessibility="no-hide-descendants">
        <View
          style={[
            styles.icono,
            completado && styles.iconoCompletado,
            actual && styles.iconoActual,
            bloqueado && styles.iconoBloqueado,
          ]}>
          <Text
            style={[
              styles.textoIcono,
              actual && { color: Retro.textoSobreOro },
              completado && { color: Retro.fondo },
            ]}>
            {ICONO_ESTADO[nivel.estado]}
          </Text>
        </View>
        {!esUltimo ? <View style={[styles.linea, completado && styles.lineaCompletada]} /> : null}
      </View>

      <Pressable
        onPress={() => onPress(nivel)}
        disabled={bloqueado}
        accessibilityRole="button"
        accessibilityLabel={etiqueta}
        accessibilityHint={
          bloqueado ? 'Completa el nivel anterior para desbloquearlo' : 'Abre el nivel'
        }
        accessibilityState={{ disabled: bloqueado }}
        style={({ pressed }) => [
          styles.tarjeta,
          actual && styles.tarjetaActual,
          bloqueado && styles.tarjetaBloqueada,
          pressed && styles.presionada,
        ]}>
        <Text style={[styles.numero, bloqueado && styles.textoBloqueado]}>NIVEL {nivel.orden}</Text>
        <Text style={[styles.titulo, bloqueado && styles.textoBloqueado]}>{nivel.titulo}</Text>

        <View style={styles.pie}>
          <Text
            style={[
              styles.estado,
              completado && { color: Retro.verde },
              actual && { color: Retro.oro },
              bloqueado && styles.textoBloqueado,
            ]}>
            {bloqueado ? '🔒 ' : ''}
            {TEXTO_ESTADO[nivel.estado]}
          </Text>

          {completado && nivel.estrellas ? (
            <Text style={styles.estrellas}>
              {'★'.repeat(nivel.estrellas)}
              <Text style={styles.estrellaVacia}>{'☆'.repeat(3 - nivel.estrellas)}</Text>
            </Text>
          ) : null}

          {!bloqueado ? <Text style={styles.xp}>+{nivel.xpRecompensa} XP</Text> : null}
        </View>

        {actual ? <Text style={styles.entrar}>ENTRAR ▶</Text> : null}
      </Pressable>
    </View>
  );
}

const TAMANO_ICONO = 44;

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', gap: 12 },
  columnaSendero: { width: TAMANO_ICONO, alignItems: 'center' },
  icono: {
    width: TAMANO_ICONO,
    height: TAMANO_ICONO,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  iconoCompletado: { backgroundColor: Retro.verde, borderColor: Retro.verde },
  iconoActual: { backgroundColor: Retro.oro, borderColor: Retro.oroOscuro, borderBottomWidth: 4 },
  iconoBloqueado: { backgroundColor: Retro.superficie, borderColor: Retro.borde },
  textoIcono: { fontSize: 18, fontWeight: '700', color: Retro.textoApagado },
  linea: { flex: 1, width: 4, minHeight: 16, backgroundColor: Retro.borde },
  lineaCompletada: { backgroundColor: Retro.verde },
  tarjeta: {
    flex: 1,
    minHeight: AreaTactilMinima,
    padding: 12,
    marginBottom: 12,
    gap: 4,
    backgroundColor: Retro.superficie,
    borderWidth: 2,
    borderColor: Retro.borde,
  },
  tarjetaActual: { borderColor: Retro.oro, borderWidth: 4, backgroundColor: Retro.superficieAlta },
  tarjetaBloqueada: { borderStyle: 'dashed' },
  presionada: { opacity: 0.85 },
  numero: { color: Retro.textoSecundario, fontSize: 14, lineHeight: 20, fontWeight: '600', letterSpacing: 1 },
  titulo: { color: Retro.texto, fontSize: 18, lineHeight: 24, fontWeight: '700' },
  textoBloqueado: { color: Retro.textoApagado },
  pie: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 4 },
  estado: { color: Retro.textoSecundario, fontSize: 14, lineHeight: 20, fontWeight: '700' },
  estrellas: { color: Retro.oro, fontSize: 16, lineHeight: 20 },
  estrellaVacia: { color: Retro.textoApagado },
  xp: { color: Retro.verde, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  entrar: { color: Retro.oro, fontSize: 14, lineHeight: 20, fontWeight: '700', marginTop: 4, letterSpacing: 1 },
});
