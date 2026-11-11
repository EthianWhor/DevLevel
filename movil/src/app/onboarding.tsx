import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BotonPrincipal } from '@/components/ui/boton-principal';
import { useOnboarding } from '@/context/onboarding-context';
import { useReducirMovimiento } from '@/hooks/use-reducir-movimiento';
import { AlturaLinea, AreaTactilMinima, Colores, Espacio, Fuentes, Radio, Tamanos } from '@/theme';

type Pagina = {
  imagen: number;
  descripcionImagen: string;
  titulo: string;
  texto: string;
};

// Las 3 páginas de la introducción (diseño "onboarding_narrativo" de Stitch).
// Habla el Guía del reino, que acompaña al jugador en su entrenamiento.
const PAGINAS: Pagina[] = [
  {
    imagen: require('../../assets/images/onboarding/guia.jpg'),
    descripcionImagen: 'El Guía del reino, con un bastón brillante, en un pasillo iluminado',
    titulo: 'Bienvenido, recluta de la lógica',
    texto:
      'Soy tu Guía. Aquí aprenderás a pensar como programador: paso a paso, con retos cortos en pseudocódigo y en español.',
  },
  {
    imagen: require('../../assets/images/onboarding/mapa.jpg'),
    descripcionImagen: 'Un mapa con un camino de niveles que lleva a un castillo',
    titulo: 'Recorre el mapa',
    texto:
      'El camino tiene 5 unidades y 15 niveles. Cada nivel te explica un concepto y luego te pone 3 retos. Todo se responde tocando, sin arrastrar.',
  },
  {
    imagen: require('../../assets/images/onboarding/heroe.jpg'),
    descripcionImagen: 'Un héroe con capucha azul y armadura',
    titulo: 'Sube de nivel',
    texto:
      'Gana estrellas y XP, mantén tu racha de días seguidos y guarda cada concepto en tu Libro de hechizos. ¿Listo para empezar?',
  },
];

// Velocidad del efecto "máquina de escribir" del diálogo.
const MS_POR_LETRA = 18;

export default function OnboardingScreen() {
  const { marcarVisto } = useOnboarding();
  const reducirMovimiento = useReducirMovimiento();
  const [indice, setIndice] = useState(0);
  const [letras, setLetras] = useState(0);

  const pagina = PAGINAS[indice];
  const esUltima = indice === PAGINAS.length - 1;
  const textoCompleto = letras >= pagina.texto.length;

  // El texto del Guía aparece letra por letra. Con "Reducir movimiento"
  // aparece completo de una vez.
  useEffect(() => {
    if (reducirMovimiento === null) return;
    if (reducirMovimiento) {
      setLetras(pagina.texto.length);
      return;
    }
    setLetras(0);
    const intervalo = setInterval(() => {
      setLetras((n) => {
        if (n >= pagina.texto.length) {
          clearInterval(intervalo);
          return n;
        }
        return n + 2;
      });
    }, MS_POR_LETRA);
    return () => clearInterval(intervalo);
  }, [indice, pagina.texto, reducirMovimiento]);

  function siguiente() {
    // Primer toque: si el texto aún se está escribiendo, se muestra completo.
    if (!textoCompleto) {
      setLetras(pagina.texto.length);
      return;
    }
    if (esUltima) {
      void marcarVisto();
      return;
    }
    setIndice(indice + 1);
  }

  return (
    <SafeAreaView style={estilos.pantalla}>
      <View style={estilos.barraSuperior}>
        <Text style={estilos.marca}>DevLevel</Text>
        {!esUltima ? (
          <Pressable
            onPress={() => void marcarVisto()}
            accessibilityRole="button"
            accessibilityLabel="Saltar introducción"
            accessibilityHint="Va directo a iniciar sesión"
            style={estilos.saltar}>
            <Text style={estilos.textoSaltar}>Saltar ⏭</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={estilos.contenido}>
        <View style={estilos.tarjeta}>
          <View style={estilos.marco}>
            <Image
              source={pagina.imagen}
              style={estilos.imagen}
              contentFit="cover"
              accessible
              accessibilityRole="image"
              accessibilityLabel={pagina.descripcionImagen}
            />
          </View>

          <View style={estilos.dialogo}>
            <View style={estilos.etiquetaGuia}>
              <Text style={estilos.textoEtiquetaGuia}>Guía</Text>
            </View>
            <Text style={estilos.titulo} accessibilityRole="header">
              {pagina.titulo}
            </Text>
            {/* TalkBack lee el texto completo aunque en pantalla se esté escribiendo. */}
            <Text style={estilos.texto} accessibilityLabel={pagina.texto}>
              {pagina.texto.slice(0, letras)}
              {!textoCompleto ? '▌' : ''}
            </Text>
          </View>

          {/* Indicador de página con texto, no solo con puntos de color. */}
          <View
            style={estilos.indicador}
            accessible
            accessibilityLabel={`Página ${indice + 1} de ${PAGINAS.length}`}>
            {PAGINAS.map((_, i) => (
              <View
                key={i}
                style={[estilos.punto, i === indice ? estilos.puntoActivo : null]}
              />
            ))}
            <Text style={estilos.textoIndicador}>
              {indice + 1} de {PAGINAS.length}
            </Text>
          </View>

          <View style={estilos.botones}>
            {indice > 0 ? (
              <Pressable
                onPress={() => setIndice(indice - 1)}
                accessibilityRole="button"
                accessibilityLabel="Anterior"
                style={estilos.botonSecundario}>
                <Text style={estilos.textoBotonSecundario}>← Atrás</Text>
              </Pressable>
            ) : null}
            <View style={estilos.botonPrincipal}>
              <BotonPrincipal
                titulo={esUltima ? '¡Empezar!' : 'Siguiente →'}
                onPress={siguiente}
                pista={esUltima ? 'Termina la introducción y va a iniciar sesión' : 'Pasa a la siguiente página'}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: Colores.fondo },
  barraSuperior: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Espacio.lg,
    minHeight: AreaTactilMinima + Espacio.sm,
    borderBottomWidth: 2,
    borderBottomColor: Colores.borde,
  },
  marca: {
    fontFamily: Fuentes.titulo,
    fontSize: Tamanos.subtitulo,
    lineHeight: AlturaLinea.subtitulo,
    color: Colores.oro,
  },
  saltar: { minHeight: AreaTactilMinima, minWidth: AreaTactilMinima, justifyContent: 'center' },
  textoSaltar: {
    fontFamily: Fuentes.cuerpoNegrita,
    fontSize: Tamanos.cuerpo,
    lineHeight: AlturaLinea.cuerpo,
    color: Colores.textoSecundario,
  },
  contenido: { flexGrow: 1, justifyContent: 'center', padding: Espacio.lg },
  tarjeta: {
    backgroundColor: Colores.superficie,
    borderWidth: 2,
    borderColor: Colores.borde,
    borderRadius: Radio.md,
    overflow: 'hidden',
    // Sombra dura al estilo pixel del diseño.
    shadowColor: '#1e293b',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  marco: {
    backgroundColor: '#0f172a',
    padding: Espacio.md,
    borderBottomWidth: 4,
    borderBottomColor: '#1e293b',
  },
  imagen: { width: '100%', aspectRatio: 512 / 280, borderRadius: Radio.sm },
  dialogo: {
    margin: Espacio.md,
    marginTop: Espacio.lg,
    padding: Espacio.md,
    paddingTop: Espacio.lg,
    backgroundColor: Colores.superficieAlta,
    borderRadius: Radio.sm,
    minHeight: 180,
    gap: Espacio.sm,
  },
  etiquetaGuia: {
    position: 'absolute',
    top: -16,
    left: Espacio.md,
    backgroundColor: Colores.oro,
    paddingHorizontal: Espacio.md,
    paddingVertical: 2,
  },
  textoEtiquetaGuia: {
    fontFamily: Fuentes.codigo,
    fontSize: Tamanos.cuerpo,
    lineHeight: AlturaLinea.cuerpo,
    color: Colores.textoSobreOro,
  },
  titulo: {
    fontFamily: Fuentes.titulo,
    fontSize: Tamanos.subtitulo,
    lineHeight: AlturaLinea.subtitulo,
    color: Colores.oro,
  },
  texto: {
    fontFamily: Fuentes.cuerpo,
    fontSize: Tamanos.cuerpo,
    lineHeight: AlturaLinea.cuerpo,
    color: Colores.texto,
  },
  indicador: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Espacio.sm,
  },
  punto: { width: 10, height: 10, backgroundColor: Colores.borde },
  puntoActivo: { width: 24, backgroundColor: Colores.oro },
  textoIndicador: {
    fontFamily: Fuentes.codigo,
    fontSize: Tamanos.pequeno,
    lineHeight: AlturaLinea.pequeno,
    color: Colores.textoSecundario,
    marginLeft: Espacio.xs,
  },
  botones: {
    flexDirection: 'row',
    gap: Espacio.sm,
    padding: Espacio.md,
    alignItems: 'center',
  },
  botonPrincipal: { flex: 1 },
  botonSecundario: {
    minHeight: AreaTactilMinima,
    paddingHorizontal: Espacio.md,
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colores.borde,
    borderRadius: Radio.sm,
  },
  textoBotonSecundario: {
    fontFamily: Fuentes.cuerpoNegrita,
    fontSize: Tamanos.cuerpo,
    color: Colores.texto,
  },
});
