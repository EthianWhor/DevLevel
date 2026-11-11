import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  completarNivel,
  esErrorApi,
  obtenerNivel,
  responderReto,
  type RespuestaNivel,
  type RespuestaReto,
  type ResultadoNivel,
  type ResultadoReto,
} from '@/api';
import { Concepto } from '@/components/nivel/concepto';
import { Reto } from '@/components/nivel/reto';
import { Resultado } from '@/components/nivel/resultado';
import { SubidaNivel } from '@/components/nivel/subida-nivel';
import { BotonPrincipal } from '@/components/ui/boton-principal';
import { useAuth } from '@/context/auth-context';
import { AlturaLinea, Colores, Espacio, Fuentes, Tamanos } from '@/theme';

type Fase = 'concepto' | 'retos' | 'resultado' | 'subida';

export default function NivelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { conSesion, actualizarPerfilLocal } = useAuth();

  const [datos, setDatos] = useState<RespuestaNivel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [fase, setFase] = useState<Fase>('concepto');
  const [indice, setIndice] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoReto | null>(null);
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

  async function responder(respuesta: RespuestaReto) {
    if (!datos) return;
    setEnviando(true);
    try {
      const reto = datos.retos[indice];
      setResultado(await conSesion((token) => responderReto(reto.id, respuesta, token)));
      setFase('resultado');
    } catch (e) {
      setError(esErrorApi(e) ? e.message : 'No se pudo enviar la respuesta.');
    } finally {
      setEnviando(false);
    }
  }

  async function continuar() {
    if (!datos) return;
    if (indice + 1 >= datos.retos.length) {
      if (enviando) return;
      setEnviando(true);
      try {
        const final = await conSesion((token) => completarNivel(datos.nivel.id, token));
        // El backend ya devuelve el perfil actualizado (XP, nivel y racha).
        actualizarPerfilLocal(final.perfil);
        setResultadoNivel(final);
        setFase('subida');
      } catch (e) {
        setError(esErrorApi(e) ? e.message : 'No se pudo completar el nivel.');
      } finally {
        setEnviando(false);
      }
      return;
    }
    setIndice(indice + 1);
    setResultado(null);
    setFase('retos');
  }

  function reintentar() {
    setResultado(null);
    setFase('retos');
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
      ) : fase === 'concepto' ? (
        <Concepto
          nivel={datos.nivel}
          totalRetos={datos.retos.length}
          onEmpezar={() => setFase('retos')}
        />
      ) : fase === 'retos' ? (
        <Reto
          key={datos.retos[indice].id}
          reto={datos.retos[indice]}
          numero={indice + 1}
          total={datos.retos.length}
          enviando={enviando}
          onResponder={responder}
        />
      ) : fase === 'subida' && resultadoNivel ? (
        <SubidaNivel
          resultado={resultadoNivel}
          onVolverMapa={() => router.back()}
          onSiguienteNivel={(siguienteId) =>
            router.replace({ pathname: '/nivel/[id]', params: { id: String(siguienteId) } })
          }
        />
      ) : (
        <Resultado
          correcta={resultado?.correcta ?? false}
          explicacion={resultado?.explicacion ?? ''}
          esUltimo={indice + 1 >= datos.retos.length}
          onContinuar={continuar}
          onReintentar={reintentar}
        />
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