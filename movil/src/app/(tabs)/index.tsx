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
import { MapaReino } from '@/components/mapa/mapa-reino';
import { BarraSuperior } from '@/components/retro/barra-superior';
import { NodoNivel } from '@/components/mapa/nodo-nivel';
import { AreaTactilMinima, Retro } from '@/constants/retro';
import { useAuth } from '@/context/auth-context';
import { useReducirMovimiento } from '@/hooks/use-reducir-movimiento';

// Mapa de niveles: muestra las 5 unidades y el camino de niveles con su estado
// (completado, actual o bloqueado) según GET /mapa.
export default function MapaScreen() {
  const { perfil, conSesion } = useAuth();
  const [mapa, setMapa] = useState<RespuestaMapa | null>(null);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Mapa del reino o lista simple (más fácil de recorrer con TalkBack).
  const [vista, setVista] = useState<'reino' | 'lista'>('reino');
  const reducirMovimiento = useReducirMovimiento() ?? false;

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


  return (
    <SafeAreaView style={styles.pantalla} edges={['top', 'left', 'right']}>
      <BarraSuperior />
      <View style={styles.subBarra}>
        <Text style={styles.estadisticas} numberOfLines={1}>
          {perfil?.nombreHeroe ?? 'Héroe'} · {perfil?.xp ?? 0} XP · Racha {perfil?.rachaActual ?? 0} 🔥
        </Text>
        <Pressable
          onPress={() => setVista(vista === 'reino' ? 'lista' : 'reino')}
          accessibilityRole="button"
          accessibilityLabel={vista === 'reino' ? 'Ver como lista' : 'Ver el mapa del reino'}
          style={styles.botonVista}>
          <Text style={styles.textoBotonVista}>{vista === 'reino' ? '☰ Lista' : '🗺 Mapa'}</Text>
        </Pressable>
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
      ) : vista === 'reino' && mapa && mapa.unidades.length > 0 ? (
        <MapaReino
          unidades={mapa.unidades}
          avatar={perfil?.avatar ?? 'explorador'}
          reducirMovimiento={reducirMovimiento}
          onEntrar={abrirNivel}
        />
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
  subBarra: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: Retro.superficie,
    borderBottomWidth: 2,
    borderBottomColor: Retro.bordePixel,
  },
  botonVista: {
    minHeight: AreaTactilMinima,
    minWidth: AreaTactilMinima,
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderWidth: 2,
    borderColor: '#1e293b',
    backgroundColor: '#0f172a',
  },
  textoBotonVista: { color: Retro.texto, fontSize: 14, fontWeight: '700' },
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
