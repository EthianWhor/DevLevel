import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { esErrorApi, mapaApi, type NivelMapa, type RespuestaMapa } from '@/api';
import { NodoNivel } from '@/components/mapa/nodo-nivel';
import { datosAvatar } from '@/constants/avatares';
import { AreaTactilMinima, Retro } from '@/constants/retro';
import { useAuth } from '@/context/auth-context';

// Mapa de niveles: muestra las 5 unidades y el camino de niveles con su estado
// (completado, actual o bloqueado) según GET /mapa.
export default function MapaScreen() {
  const { perfil, conSesion } = useAuth();
  const [mapa, setMapa] = useState<RespuestaMapa | null>(null);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setError(null);
    try {
      setMapa(await conSesion((token) => mapaApi.obtenerMapa(token)));
    } catch (e) {
      setError(esErrorApi(e) ? e.message : 'No se pudo cargar el mapa.');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [conSesion]);

  // Se recarga cada vez que la pestaña vuelve a estar visible, así el mapa
  // se actualiza al volver de completar un nivel.
  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  function abrirNivel(nivel: NivelMapa) {
    if (nivel.estado === 'bloqueado') return;
    router.push({ pathname: '/nivel/[id]', params: { id: String(nivel.id) } });
  }

  const avatar = datosAvatar(perfil?.avatar);

  return (
    <SafeAreaView style={styles.pantalla} edges={['top', 'left', 'right']}>
      {/* Encabezado con el héroe */}
      <View style={styles.encabezado} accessible accessibilityRole="header">
        <Text style={styles.avatar} importantForAccessibility="no" accessibilityElementsHidden>
          {avatar?.simbolo ?? '🧙'}
        </Text>
        <View style={styles.datosHeroe}>
          <Text style={styles.nombre} numberOfLines={1}>
            {perfil?.nombreHeroe ?? 'Héroe'}
          </Text>
          <Text style={styles.estadisticas}>
            Nivel {perfil?.nivel ?? 1} · {perfil?.xp ?? 0} XP · Racha {perfil?.rachaActual ?? 0} 🔥
          </Text>
        </View>
      </View>

      {cargando ? (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={Retro.oro} accessibilityLabel="Cargando el mapa" />
          <Text style={styles.textoCentro}>Cargando el mapa…</Text>
        </View>
      ) : error && !mapa ? (
        <View style={styles.centro}>
          <Text style={styles.textoError} accessibilityRole="alert">
            ⚠ {error}
          </Text>
          <Pressable
            onPress={() => {
              setCargando(true);
              cargar();
            }}
            accessibilityRole="button"
            style={styles.botonReintentar}>
            <Text style={styles.textoBoton}>Reintentar</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.contenido}
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={() => {
                setRefrescando(true);
                cargar();
              }}
              tintColor={Retro.oro}
              colors={[Retro.oro]}
              progressBackgroundColor={Retro.superficie}
            />
          }>
          {mapa ? (
            <Text style={styles.resumen}>
              {mapa.resumen.completados} de {mapa.resumen.total} niveles completados
            </Text>
          ) : null}

          {error ? (
            <Text style={styles.textoError} accessibilityRole="alert">
              ⚠ {error}
            </Text>
          ) : null}

          {mapa && mapa.unidades.length === 0 ? (
            <Text style={styles.textoCentro}>Aún no hay niveles disponibles.</Text>
          ) : null}

          {mapa?.unidades.map((unidad) => (
            <View key={unidad.id} style={styles.unidad}>
              <Text style={styles.tituloUnidad} accessibilityRole="header">
                Unidad {unidad.orden}: {unidad.titulo}
              </Text>
              <Text style={styles.descripcionUnidad}>{unidad.descripcion}</Text>

              <View style={styles.sendero}>
                {unidad.niveles.map((nivel, i) => (
                  <NodoNivel
                    key={nivel.id}
                    nivel={nivel}
                    esUltimo={i === unidad.niveles.length - 1}
                    onPress={abrirNivel}
                  />
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: Retro.fondo },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Retro.superficie,
    borderBottomWidth: 2,
    borderBottomColor: Retro.borde,
  },
  avatar: { fontSize: 32, lineHeight: 40 },
  datosHeroe: { flex: 1 },
  nombre: { color: Retro.oro, fontSize: 20, lineHeight: 26, fontWeight: '700' },
  estadisticas: { color: Retro.textoSecundario, fontSize: 14, lineHeight: 20 },
  contenido: { padding: 20, paddingBottom: 40, gap: 8 },
  resumen: { color: Retro.textoSecundario, fontSize: 14, lineHeight: 20 },
  unidad: { marginTop: 16, gap: 4 },
  tituloUnidad: { color: Retro.texto, fontSize: 22, lineHeight: 28, fontWeight: '700' },
  descripcionUnidad: { color: Retro.textoSecundario, fontSize: 16, lineHeight: 22, marginBottom: 8 },
  sendero: { marginTop: 4 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 16 },
  textoCentro: { color: Retro.textoSecundario, fontSize: 16, lineHeight: 24, textAlign: 'center' },
  textoError: { color: Retro.error, fontSize: 16, lineHeight: 24, textAlign: 'center' },
  botonReintentar: {
    minHeight: AreaTactilMinima,
    minWidth: 160,
    backgroundColor: Retro.oro,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  textoBoton: { color: Retro.textoSobreOro, fontSize: 16, fontWeight: '700' },
});
