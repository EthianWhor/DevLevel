import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { esErrorApi, obtenerNivel, type RespuestaNivel } from '@/api';

import { Concepto } from '@/components/nivel/concepto';
import { BotonPrincipal } from '@/components/ui/boton-principal';
import { useAuth } from '@/context/auth-context';
import { AlturaLinea, Colores, Espacio, Fuentes, Tamanos } from '@/theme';

type Fase = 'concepto' | 'retos';

export default function NivelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { conSesion } = useAuth();

  const [datos, setDatos] = useState<RespuestaNivel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [fase, setFase] = useState<Fase>('concepto');

    const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setDatos(await conSesion((token) => obtenerNivel(Number(id), token)));
    } catch (e) {
      setError(esErrorApi(e) ? e.message : 'No se pudo cargar el nivel. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  }, [id, conSesion]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <SafeAreaView style={estilos.pantalla}>
      {cargando ? (
        <View style={estilos.centro} accessible accessibilityLabel="Cargando nivel">
          <ActivityIndicator size="large" color={Colores.oro} />
          <Text style={estilos.texto}>Cargando nivel…</Text>
        </View>
      ) : error || !datos ? (
        <View style={estilos.centro}>
          <Text style={estilos.texto} accessibilityRole="alert">{`⚠ ${error ?? 'Error'}`}</Text>
          <BotonPrincipal titulo="Reintentar" onPress={cargar} />
          <BotonPrincipal titulo="Volver al mapa" onPress={() => router.back()} />
        </View>
      ) : fase === 'concepto' ? (
        <Concepto
          nivel={datos.nivel}
          totalRetos={datos.retos.length}
          onEmpezar={() => setFase('retos')}
        />
      ) : (
        // Provisional: aquí entra la pantalla Reto (siguiente tarea).
        <View style={estilos.centro}>
          <Text style={estilos.texto}>{`Aquí van los ${datos.retos.length} retos.`}</Text>
          <BotonPrincipal titulo="Volver al mapa" onPress={() => router.back()} />
        </View>
      )}
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: Colores.fondo },
  centro: { flex: 1, justifyContent: 'center', padding: Espacio.lg, gap: Espacio.md },
  texto: {
    fontFamily: Fuentes.cuerpo,
    fontSize: Tamanos.cuerpo,
    lineHeight: AlturaLinea.cuerpo,
    color: Colores.texto,
    textAlign: 'center',
  },
});