import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { pedir } from '@/api';
import { EmblemaPixel } from '@/components/emblema-pixel';
import { useReducirMovimiento } from '@/hooks/use-reducir-movimiento';
import { AlturaLinea, Colores, Espacio, Fuentes, Tamanos } from '@/theme';

const SEGMENTOS = 10;
const DURACION_MS = 1800;
// Con "Reducir movimiento" no hay animación, pero se deja ver la marca un momento.
const DURACION_ESTATICA_MS = 900;

const MENSAJES = ['Abriendo el portal…', 'Ordenando los pasos…', 'Preparando los retos…'];

// Splash animado (diseño "splash_screen_animada" de Stitch). Aparece al abrir
// la app, después del splash nativo. Mientras tanto despierta al backend de
// Render con GET /health, porque en el plan gratis tarda en arrancar.
export function PantallaSplash({ onTerminar }: { onTerminar: () => void }) {
  const reducirMovimiento = useReducirMovimiento();
  const entrada = useRef(new Animated.Value(0)).current;
  const brillo = useRef(new Animated.Value(0)).current;
  const [llenos, setLlenos] = useState(0);
  const [esperando, setEsperando] = useState(false);
  const terminado = useRef(false);

  // Despierta el backend sin esperar la respuesta (si falla, no importa aquí).
  useEffect(() => {
    pedir('/health').catch(() => {});
  }, []);

  useEffect(() => {
    if (reducirMovimiento === null) return;

    const terminar = () => {
      if (terminado.current) return;
      terminado.current = true;
      setEsperando(true);
      onTerminar();
    };

    if (reducirMovimiento) {
      entrada.setValue(1);
      brillo.setValue(1);
      setLlenos(SEGMENTOS);
      const t = setTimeout(terminar, DURACION_ESTATICA_MS);
      return () => clearTimeout(t);
    }

    Animated.timing(entrada, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.back(1.5)),
      useNativeDriver: true,
    }).start();
    const pulso = Animated.loop(
      Animated.sequence([
        Animated.timing(brillo, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(brillo, { toValue: 0.4, duration: 600, useNativeDriver: true }),
      ]),
    );
    pulso.start();

    // La barra se llena de a un segmento, como una barra de carga retro.
    const paso = DURACION_MS / SEGMENTOS;
    const intervalo = setInterval(() => {
      setLlenos((n) => Math.min(n + 1, SEGMENTOS));
    }, paso);
    const t = setTimeout(terminar, DURACION_MS + 250);

    return () => {
      pulso.stop();
      clearInterval(intervalo);
      clearTimeout(t);
    };
  }, [reducirMovimiento, entrada, brillo, onTerminar]);

  const porcentaje = Math.round((llenos / SEGMENTOS) * 100);
  // Si la animación terminó pero la app sigue esperando la sesión, es que el
  // servidor está despertando.
  const mensaje = esperando
    ? 'Conectando con el servidor…'
    : MENSAJES[Math.min(MENSAJES.length - 1, Math.floor((llenos / SEGMENTOS) * MENSAJES.length))];

  return (
    <SafeAreaView style={estilos.pantalla}>
      <View style={estilos.centro}>
        <Animated.View
          style={{
            opacity: entrada,
            transform: [{ scale: entrada.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
          }}>
          <Animated.View style={[estilos.halo, { opacity: brillo }]} />
          <EmblemaPixel tamano={11} />
        </Animated.View>

        <Text style={estilos.marca} accessibilityRole="header">
          DEVLEVEL
        </Text>
        <View style={estilos.lema}>
          <Text style={estilos.textoLema}>Aprende lógica de programación</Text>
        </View>

        <View style={estilos.carga}>
          <View style={estilos.filaCarga}>
            <Text style={estilos.mensaje}>{`> ${mensaje}`}</Text>
            <Text style={estilos.porcentaje}>{porcentaje}%</Text>
          </View>
          <View
            style={estilos.barra}
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel="Cargando DevLevel"
            accessibilityValue={{ min: 0, max: 100, now: porcentaje }}>
            {Array.from({ length: SEGMENTOS }).map((_, i) => (
              <View
                key={i}
                style={[estilos.segmento, { backgroundColor: i < llenos ? Colores.oro : Colores.superficieAlta }]}
              />
            ))}
          </View>
        </View>
      </View>

      <View style={estilos.pie}>
        <Text style={estilos.version}>v1.0.0 · Universidad de La Sabana</Text>
        <Text style={estilos.lemaPie}>Domina la lógica paso a paso</Text>
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: Colores.fondo },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Espacio.lg, gap: Espacio.lg },
  halo: {
    position: 'absolute',
    top: -30,
    left: -30,
    right: -30,
    bottom: -30,
    borderRadius: 200,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
  },
  marca: {
    fontFamily: Fuentes.titulo,
    fontSize: 44,
    lineHeight: 52,
    letterSpacing: 2,
    color: Colores.oro,
    textShadowColor: '#544600',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
  },
  lema: {
    borderWidth: 2,
    borderColor: Colores.borde,
    backgroundColor: Colores.superficie,
    paddingHorizontal: Espacio.md,
    paddingVertical: Espacio.sm,
  },
  textoLema: {
    fontFamily: Fuentes.codigo,
    fontSize: Tamanos.pequeno,
    lineHeight: AlturaLinea.pequeno,
    color: Colores.texto,
    textAlign: 'center',
  },
  carga: { alignSelf: 'stretch', gap: Espacio.sm },
  filaCarga: { flexDirection: 'row', justifyContent: 'space-between' },
  mensaje: {
    fontFamily: Fuentes.codigo,
    fontSize: Tamanos.pequeno,
    lineHeight: AlturaLinea.pequeno,
    color: Colores.texto,
  },
  porcentaje: {
    fontFamily: Fuentes.codigo,
    fontSize: Tamanos.pequeno,
    lineHeight: AlturaLinea.pequeno,
    color: Colores.oro,
  },
  barra: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderWidth: 2,
    borderColor: Colores.borde,
    backgroundColor: Colores.fondo,
  },
  segmento: { flex: 1, height: 16 },
  pie: {
    alignItems: 'center',
    gap: 2,
    paddingVertical: Espacio.md,
    borderTopWidth: 1,
    borderTopColor: Colores.borde,
    marginHorizontal: Espacio.lg,
  },
  version: {
    fontFamily: Fuentes.codigo,
    fontSize: Tamanos.pequeno,
    lineHeight: AlturaLinea.pequeno,
    color: Colores.textoSecundario,
  },
  lemaPie: {
    fontFamily: Fuentes.cuerpo,
    fontSize: Tamanos.pequeno,
    lineHeight: AlturaLinea.pequeno,
    color: Colores.textoApagado,
  },
});
