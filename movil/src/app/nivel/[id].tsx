import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  completarNivel,
  esErrorApi,
  obtenerNivel,
  type RespuestaNivel,
  type ResultadoNivel,
  type RetoMazmorra,
} from '@/api';
import { PantallaMazmorra } from '@/components/mazmorra/pantalla-mazmorra';
import { Concepto } from '@/components/nivel/concepto';
import { SubidaNivel } from '@/components/nivel/subida-nivel';
import { BotonPrincipal } from '@/components/ui/boton-principal';
import { useAuth } from '@/context/auth-context';
import { AlturaLinea, Colores, Espacio, Fuentes, Tamanos } from '@/theme';

// Un nivel: primero el Concepto, después la Mazmorra que se resuelve
// programando y al final la Subida de nivel con las recompensas.
type Fase = 'concepto' | 'mazmorra' | 'subida';

export default function NivelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { conSesion, actualizarPerfilLocal } = useAuth();

  const [datos, setDatos] = useState<RespuestaNivel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [fase, setFase] = useState<Fase>('concepto');
  const [terminando, setTerminando] = useState(false);
  const [resultadoNivel, setResultadoNivel] = useState<ResultadoNivel | null>(null);

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

  const reto = datos?.retos.find((r): r is RetoMazmorra => r.tipo === 'mazmorra') ?? null;

  async function terminar() {
    if (!datos || terminando) return;
    setTerminando(true);
    try {
      const final = await conSesion((token) => completarNivel(datos.nivel.id, token));
      // El backend ya devuelve el perfil actualizado (XP, nivel y racha).
      actualizarPerfilLocal(final.perfil);
      setResultadoNivel(final);
      setFase('subida');
    } catch (e) {
      setError(esErrorApi(e) ? e.message : 'No se pudo completar el nivel.');
    } finally {
      setTerminando(false);
    }
  }

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
      ) : !reto ? (
        <View style={estilos.centro}>
          <Text style={estilos.texto} accessibilityRole="alert">
            ⚠ Este nivel todavía no tiene su mazmorra. Pide que se cargue el contenido nuevo.
          </Text>
          <BotonPrincipal titulo="Volver al mapa" onPress={() => router.back()} />
        </View>
      ) : fase === 'concepto' ? (
        <Concepto
          nivel={datos.nivel}
          resumen={`Te espera la mazmorra "${reto.opciones.nombre}". Al salir ganas ${datos.nivel.xpRecompensa} XP.`}
          textoBoton="⚔ Entrar a la mazmorra"
          onEmpezar={() => setFase('mazmorra')}
        />
      ) : fase === 'mazmorra' ? (
        <PantallaMazmorra reto={reto} onTerminar={terminar} terminando={terminando} />
      ) : resultadoNivel ? (
        <SubidaNivel
          resultado={resultadoNivel}
          onVolverMapa={() => router.back()}
          onSiguienteNivel={(siguienteId) =>
            router.replace({ pathname: '/nivel/[id]', params: { id: String(siguienteId) } })
          }
        />
      ) : null}
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
