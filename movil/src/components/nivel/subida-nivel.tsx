import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { ResultadoNivel } from '@/api';
import { ICONO_OBJETO } from '@/components/pixel/sprites';
import { BotonPrincipal } from '@/components/ui/boton-principal';
import { useReducirMovimiento } from '@/hooks/use-reducir-movimiento';
import { AlturaLinea, AreaTactilMinima, Colores, Espacio, Fuentes, Radio, Tamanos } from '@/theme';

type Props = {
  resultado: ResultadoNivel;
  onVolverMapa: () => void;
  onSiguienteNivel: (nivelId: number) => void;
};

const TEXTO_RACHA: Record<string, string> = {
  aumento: '¡Sumaste un día más!',
  igual: 'Ya habías jugado hoy, tu racha sigue igual.',
  reinicio: 'Empezaste una racha nueva.',
};

// Pantalla que aparece al terminar los retos de un nivel (respuesta de
// POST /niveles/:id/completar): estrellas, XP, racha, subida de nivel del
// jugador y el hechizo que se desbloqueó.
// Con "Quitar animaciones" activo en el sistema se muestra todo quieto.
export function SubidaNivel({ resultado, onVolverMapa, onSiguienteNivel }: Props) {
  const reducirMovimiento = useReducirMovimiento();

  // Valores de la animación: entrada de la pantalla, cada estrella,
  // el recuadro del nivel nuevo y el llenado de la barra de XP.
  const entrada = useRef(new Animated.Value(0)).current;
  const estrellas = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  const pulso = useRef(new Animated.Value(0)).current;
  const barra = useRef(new Animated.Value(0)).current;
  const yaAnimado = useRef(false);

  const { xpEnNivel, xpPorNivel } = resultado.progresoNivel;
  const fraccionXp = xpPorNivel > 0 ? Math.min(xpEnNivel / xpPorNivel, 1) : 0;

  useEffect(() => {
    // Todavía no se sabe si el usuario pidió reducir movimiento.
    if (reducirMovimiento === null || yaAnimado.current) return;
    yaAnimado.current = true;

    if (reducirMovimiento) {
      // Versión estática: todo aparece directamente en su estado final.
      entrada.setValue(1);
      estrellas.forEach((valor) => valor.setValue(1));
      pulso.setValue(1);
      barra.setValue(fraccionXp);
      return;
    }

    Animated.sequence([
      Animated.timing(entrada, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.stagger(
        180,
        estrellas.map((valor) =>
          Animated.spring(valor, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }),
        ),
      ),
      Animated.spring(pulso, { toValue: 1, friction: 3, tension: 80, useNativeDriver: true }),
    ]).start();

    // El ancho no se puede animar con el driver nativo, por eso va aparte.
    Animated.timing(barra, {
      toValue: fraccionXp,
      duration: 900,
      delay: 500,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [reducirMovimiento, entrada, estrellas, pulso, barra, fraccionXp]);

  const subio = resultado.subioDeNivel;
  const titulo = subio ? '¡Subiste de nivel!' : '¡Nivel superado!';

  return (
    <ScrollView contentContainerStyle={estilos.contenido}>
      <Animated.View
        style={[
          estilos.bloque,
          {
            opacity: entrada,
            transform: [
              { translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
            ],
          },
        ]}>
        <Text style={estilos.titulo} accessibilityRole="header" accessibilityLiveRegion="polite">
          {titulo}
        </Text>

        {/* Estrellas: el texto dice cuántas son, no depende solo del dibujo. */}
        <View
          style={estilos.filaEstrellas}
          accessible
          accessibilityLabel={`Ganaste ${resultado.estrellas} de 3 estrellas`}>
          {estrellas.map((valor, i) => {
            const ganada = i < resultado.estrellas;
            return (
              <Animated.Text
                key={i}
                style={[
                  estilos.estrella,
                  { color: ganada ? Colores.oro : Colores.borde },
                  {
                    opacity: valor,
                    transform: [
                      { scale: valor.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) },
                    ],
                  },
                ]}>
                {ganada ? '★' : '☆'}
              </Animated.Text>
            );
          })}
        </View>
        <Text style={estilos.textoCentro} importantForAccessibility="no">
          {resultado.estrellas} de 3 estrellas
          {resultado.errores === 0
            ? ' · ¡sin errores!'
            : ` · ${resultado.errores} ${resultado.errores === 1 ? 'error' : 'errores'}`}
        </Text>

        {/* Nivel del jugador: anterior -> nuevo si subió. */}
        {subio ? (
          <View
            style={estilos.filaNiveles}
            accessible
            accessibilityLabel={`Pasaste del nivel ${resultado.nivelAnterior} al nivel ${resultado.nivelNuevo}`}>
            <View style={[estilos.cajaNivel, estilos.cajaAnterior]}>
              <Text style={estilos.etiquetaNivel}>Antes</Text>
              <Text style={[estilos.numeroNivel, estilos.numeroAnterior]}>
                {resultado.nivelAnterior}
              </Text>
            </View>
            <Text style={estilos.flecha}>➜</Text>
            <Animated.View
              style={[
                estilos.cajaNivel,
                estilos.cajaNueva,
                {
                  transform: [
                    { scale: pulso.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
                  ],
                },
              ]}>
              <Text style={[estilos.etiquetaNivel, { color: Colores.oro }]}>Ahora</Text>
              <Text style={estilos.numeroNivel}>{resultado.nivelNuevo}</Text>
            </Animated.View>
          </View>
        ) : null}

        {/* XP ganada y barra hacia el siguiente nivel del jugador. */}
        <View style={estilos.tarjeta}>
          <Text style={estilos.xpGanada}>
            {resultado.primeraVez ? `+${resultado.xpGanada} XP` : 'Nivel repetido'}
          </Text>
          {!resultado.primeraVez ? (
            <Text style={estilos.texto}>
              Repetir un nivel no da XP nueva, pero se guardan tus mejores estrellas (
              {resultado.mejoresEstrellas} de 3).
            </Text>
          ) : null}
          <Text style={estilos.texto}>
            Nivel {resultado.nivelNuevo}: {xpEnNivel} de {xpPorNivel} XP para el nivel{' '}
            {resultado.nivelNuevo + 1}
          </Text>
          <View
            style={estilos.barraFondo}
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={`Experiencia del nivel ${resultado.nivelNuevo}`}
            accessibilityValue={{ min: 0, max: xpPorNivel, now: xpEnNivel, text: `${xpEnNivel} de ${xpPorNivel} XP` }}>
            <Animated.View
              style={[
                estilos.barraRelleno,
                { width: barra.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
              ]}
            />
          </View>
        </View>

        {/* Racha de días seguidos. */}
        <View style={estilos.tarjeta} accessible>
          <Text style={estilos.subtitulo}>
            🔥 Racha de {resultado.racha.actual} {resultado.racha.actual === 1 ? 'día' : 'días'}
          </Text>
          <Text style={estilos.texto}>{TEXTO_RACHA[resultado.racha.cambio] ?? ''}</Text>
          <Text style={estilos.textoApagado}>
            Tu mejor racha: {resultado.racha.maxima}{' '}
            {resultado.racha.maxima === 1 ? 'día' : 'días'}
          </Text>
        </View>

        {/* Hechizo nuevo (solo la primera vez que se completa el nivel). */}
        {resultado.hechizoDesbloqueado ? (
          <View style={[estilos.tarjeta, estilos.tarjetaHechizo]} accessible>
            <Text style={estilos.subtitulo}>🔓 Nuevo hechizo desbloqueado</Text>
            <Text style={estilos.nombreHechizo}>✨ {resultado.hechizoDesbloqueado.nombre}</Text>
            <Text style={estilos.texto}>{resultado.hechizoDesbloqueado.descripcion}</Text>
            <Text style={estilos.textoApagado}>Lo puedes repasar en el Libro de hechizos.</Text>
          </View>
        ) : null}

        {/* Objeto ganado al cumplir todos los objetivos extra. Los míticos van en rojo. */}
        {resultado.objetoGanado ? (
          <View
            style={[estilos.tarjeta, resultado.objetoGanado.mitico ? estilos.tarjetaMitica : estilos.tarjetaHechizo]}
            accessible
            accessibilityLabel={`${resultado.objetoGanado.mitico ? 'Objeto mítico' : 'Objeto'} ganado: ${resultado.objetoGanado.nombre}. ${resultado.objetoGanado.efecto}. Equípalo desde tu Perfil o en la próxima mazmorra.`}>
            {resultado.objetoGanado.mitico ? <Text style={estilos.etiquetaMitica}>★ MÍTICO ★</Text> : null}
            <Text style={estilos.subtitulo}>🎁 ¡Ganaste un objeto!</Text>
            <Text style={[estilos.nombreHechizo, resultado.objetoGanado.mitico && { color: '#EF4444' }]}>
              {ICONO_OBJETO[resultado.objetoGanado.id] ?? '✦'} {resultado.objetoGanado.nombre}
            </Text>
            <Text style={estilos.texto}>{resultado.objetoGanado.efecto}</Text>
            <Text style={estilos.textoApagado}>Equípalo con 🎒 Equipo en la próxima mazmorra.</Text>
          </View>
        ) : null}

        {resultado.siguienteNivelId !== null ? (
          <BotonPrincipal
            titulo="Siguiente nivel"
            onPress={() => onSiguienteNivel(resultado.siguienteNivelId as number)}
            pista="Abre el siguiente nivel del mapa"
          />
        ) : (
          <Text style={[estilos.subtitulo, { textAlign: 'center' }]}>
            🏆 ¡Completaste todos los niveles del módulo!
          </Text>
        )}

        <Pressable
          onPress={onVolverMapa}
          accessibilityRole="button"
          accessibilityLabel="Volver al mapa"
          style={({ pressed }) => [estilos.botonSecundario, pressed && { opacity: 0.8 }]}>
          <Text style={estilos.textoBotonSecundario}>🗺 Volver al mapa</Text>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenido: { padding: Espacio.lg, paddingBottom: Espacio.xl + 8 },
  bloque: { gap: Espacio.md },
  titulo: {
    fontFamily: Fuentes.titulo,
    fontSize: Tamanos.grande,
    lineHeight: AlturaLinea.grande,
    color: Colores.oro,
    textAlign: 'center',
    marginTop: Espacio.md,
  },
  filaEstrellas: { flexDirection: 'row', justifyContent: 'center', gap: Espacio.md },
  estrella: { fontSize: 48, lineHeight: 56 },
  textoCentro: {
    fontFamily: Fuentes.cuerpo,
    fontSize: Tamanos.cuerpo,
    lineHeight: AlturaLinea.cuerpo,
    color: Colores.textoSecundario,
    textAlign: 'center',
  },
  filaNiveles: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Espacio.md,
  },
  cajaNivel: {
    width: 104,
    paddingVertical: Espacio.md,
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: Radio.md,
  },
  cajaAnterior: { backgroundColor: Colores.superficieAlta, borderColor: Colores.borde },
  cajaNueva: { backgroundColor: Colores.superficie, borderColor: Colores.oro, borderWidth: 3 },
  etiquetaNivel: {
    fontFamily: Fuentes.cuerpoNegrita,
    fontSize: Tamanos.pequeno,
    lineHeight: AlturaLinea.pequeno,
    color: Colores.textoSecundario,
  },
  numeroNivel: {
    fontFamily: Fuentes.titulo,
    fontSize: Tamanos.grande,
    lineHeight: AlturaLinea.grande,
    color: Colores.texto,
  },
  numeroAnterior: { color: Colores.textoApagado },
  flecha: { fontSize: Tamanos.titulo, lineHeight: AlturaLinea.titulo, color: Colores.oro },
  tarjeta: {
    backgroundColor: Colores.superficie,
    borderColor: Colores.borde,
    borderWidth: 2,
    borderRadius: Radio.md,
    padding: Espacio.md,
    gap: Espacio.sm,
  },
  tarjetaHechizo: { borderColor: Colores.oro },
  tarjetaMitica: { borderColor: '#EF4444', borderWidth: 3 },
  etiquetaMitica: {
    alignSelf: 'flex-start',
    paddingHorizontal: Espacio.sm,
    backgroundColor: '#EF4444',
    color: '#ffffff',
    fontFamily: Fuentes.codigo,
    fontSize: Tamanos.pequeno,
    letterSpacing: 1,
  },
  xpGanada: {
    fontFamily: Fuentes.titulo,
    fontSize: Tamanos.titulo,
    lineHeight: AlturaLinea.titulo,
    color: Colores.verde,
  },
  subtitulo: {
    fontFamily: Fuentes.cuerpoNegrita,
    fontSize: Tamanos.subtitulo,
    lineHeight: AlturaLinea.subtitulo,
    color: Colores.texto,
  },
  nombreHechizo: {
    fontFamily: Fuentes.titulo,
    fontSize: Tamanos.subtitulo,
    lineHeight: AlturaLinea.subtitulo,
    color: Colores.oro,
  },
  texto: {
    fontFamily: Fuentes.cuerpo,
    fontSize: Tamanos.cuerpo,
    lineHeight: AlturaLinea.cuerpo,
    color: Colores.textoSecundario,
  },
  textoApagado: {
    fontFamily: Fuentes.cuerpo,
    fontSize: Tamanos.pequeno,
    lineHeight: AlturaLinea.pequeno,
    color: Colores.textoApagado,
  },
  barraFondo: {
    height: 16,
    borderRadius: 2,
    backgroundColor: Colores.fondo,
    borderWidth: 1,
    borderColor: Colores.borde,
    overflow: 'hidden',
  },
  barraRelleno: { height: '100%', backgroundColor: Colores.verde },
  botonSecundario: {
    minHeight: AreaTactilMinima,
    borderWidth: 2,
    borderColor: Colores.oro,
    borderRadius: Radio.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Espacio.lg,
  },
  textoBotonSecundario: {
    fontFamily: Fuentes.titulo,
    fontSize: Tamanos.cuerpo,
    color: Colores.oro,
  },
});
