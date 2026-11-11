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

import { esErrorApi, mapaApi, type RespuestaMapa } from '@/api';
import { BarraProgreso } from '@/components/ui/barra-progreso';
import { datosAvatar } from '@/constants/avatares';
import { useAuth } from '@/context/auth-context';
import { AlturaLinea, AreaTactilMinima, Colores, Espacio, Fuentes, Radio, Tamanos } from '@/theme';

// Misma regla que el backend (lib/progreso.ts): un nivel de jugador cada 100 XP.
const XP_POR_NIVEL = 100;

// Perfil del jugador: héroe, nivel, XP, racha y niveles completados.
// El perfil viene de GET /me (en el contexto de sesión) y los niveles
// completados de GET /mapa.
export default function PerfilScreen() {
  const { perfil, usuario, conSesion, recargarPerfil } = useAuth();
  const [mapa, setMapa] = useState<RespuestaMapa | null>(null);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setError(null);
    try {
      const [respuestaMapa] = await Promise.all([
        conSesion((token) => mapaApi.obtenerMapa(token)),
        recargarPerfil(),
      ]);
      setMapa(respuestaMapa);
    } catch (e) {
      setError(esErrorApi(e) ? e.message : 'No se pudo actualizar tu perfil.');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [conSesion, recargarPerfil]);

  // Se recarga al volver a la pestaña, así refleja el último nivel jugado.
  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  if (!perfil) return null;

  const avatar = datosAvatar(perfil.avatar);
  const xpEnNivel = Math.max(0, perfil.xp - (perfil.nivel - 1) * XP_POR_NIVEL);
  const completados =
    mapa?.unidades.flatMap((unidad) =>
      unidad.niveles
        .filter((nivel) => nivel.estado === 'completado')
        .map((nivel) => ({ ...nivel, unidad: unidad.orden })),
    ) ?? [];
  const totalNiveles = mapa?.resumen.total ?? 0;
  const estrellasGanadas = completados.reduce((suma, nivel) => suma + (nivel.estrellas ?? 0), 0);

  return (
    <SafeAreaView style={estilos.pantalla} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={estilos.contenido}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={() => {
              setRefrescando(true);
              cargar();
            }}
            tintColor={Colores.oro}
            colors={[Colores.oro]}
            progressBackgroundColor={Colores.superficie}
          />
        }>
        <Text style={estilos.titulo} accessibilityRole="header">
          Perfil
        </Text>

        {/* Héroe */}
        <View style={estilos.tarjeta}>
          <View style={estilos.filaHeroe}>
            <View style={estilos.cajaAvatar} importantForAccessibility="no-hide-descendants">
              <Text style={estilos.simbolo}>{avatar?.simbolo ?? '🧙'}</Text>
            </View>
            <View style={estilos.datosHeroe} accessible>
              <Text style={estilos.nombre} numberOfLines={2}>
                {perfil.nombreHeroe ?? 'Héroe'}
              </Text>
              <Text style={estilos.clase}>{avatar?.nombre ?? 'Sin clase'}</Text>
              {usuario?.email ? <Text style={estilos.textoApagado}>{usuario.email}</Text> : null}
            </View>
          </View>
          <Pressable
            onPress={() => router.push('/personaje')}
            accessibilityRole="button"
            accessibilityLabel="Editar héroe"
            accessibilityHint="Cambia tu nombre de héroe o tu personaje"
            style={({ pressed }) => [estilos.botonSecundario, pressed && { opacity: 0.8 }]}>
            <Text style={estilos.textoBotonSecundario}>✎ Editar héroe</Text>
          </Pressable>
        </View>

        {/* Nivel y XP */}
        <View style={estilos.tarjeta}>
          <Text style={estilos.subtitulo}>⭐ Nivel {perfil.nivel}</Text>
          <Text style={estilos.texto}>
            {perfil.xp} XP en total · {xpEnNivel} de {XP_POR_NIVEL} para el nivel {perfil.nivel + 1}
          </Text>
          <BarraProgreso
            total={10}
            actual={Math.floor((xpEnNivel / XP_POR_NIVEL) * 10)}
            etiqueta={`Experiencia: ${xpEnNivel} de ${XP_POR_NIVEL} XP para el nivel ${perfil.nivel + 1}`}
          />
        </View>

        {/* Estadísticas: cada una con ícono + texto. */}
        <View style={estilos.cuadricula}>
          <Dato
            icono="🔥"
            valor={perfil.rachaActual}
            etiqueta={`${dias(perfil.rachaActual)} seguidos`}
            etiquetaLectura={`Racha actual: ${perfil.rachaActual} ${dias(perfil.rachaActual)} seguidos`}
          />
          <Dato
            icono="🏅"
            valor={perfil.rachaMaxima}
            etiqueta="mejor racha"
            etiquetaLectura={`Mejor racha: ${perfil.rachaMaxima} ${dias(perfil.rachaMaxima)}`}
          />
          <Dato
            icono="✔"
            valor={mapa ? `${completados.length}/${totalNiveles}` : '…'}
            etiqueta="niveles completados"
            etiquetaLectura={
              mapa ? `${completados.length} de ${totalNiveles} niveles completados` : 'Cargando niveles'
            }
          />
          <Dato
            icono="★"
            valor={mapa ? `${estrellasGanadas}/${totalNiveles * 3}` : '…'}
            etiqueta="estrellas"
            etiquetaLectura={
              mapa ? `${estrellasGanadas} de ${totalNiveles * 3} estrellas` : 'Cargando estrellas'
            }
          />
        </View>

        {/* Niveles completados */}
        <Text style={estilos.subtitulo} accessibilityRole="header">
          Niveles completados
        </Text>

        {cargando && !mapa ? (
          <ActivityIndicator color={Colores.oro} accessibilityLabel="Cargando niveles completados" />
        ) : null}

        {error ? (
          <View style={estilos.cajaError}>
            <Text style={estilos.textoError} accessibilityRole="alert">
              ⚠ {error}
            </Text>
            <Pressable
              onPress={() => {
                setCargando(true);
                cargar();
              }}
              accessibilityRole="button"
              style={estilos.botonSecundario}>
              <Text style={estilos.textoBotonSecundario}>Reintentar</Text>
            </Pressable>
          </View>
        ) : null}

        {mapa && completados.length === 0 ? (
          <Text style={estilos.texto}>
            Todavía no has completado niveles. ¡Empieza tu aventura en el mapa!
          </Text>
        ) : null}

        {completados.map((nivel) => (
          <View
            key={nivel.id}
            style={estilos.filaNivel}
            accessible
            accessibilityLabel={`Nivel ${nivel.orden}, ${nivel.titulo}, completado con ${nivel.estrellas} de 3 estrellas`}>
            <Text style={estilos.check}>✔</Text>
            <View style={estilos.datosNivel}>
              <Text style={estilos.textoApagado}>
                Unidad {nivel.unidad} · Nivel {nivel.orden}
              </Text>
              <Text style={estilos.tituloNivel}>{nivel.titulo}</Text>
            </View>
            <Text style={estilos.estrellas}>
              {'★'.repeat(nivel.estrellas ?? 0)}
              {'☆'.repeat(3 - (nivel.estrellas ?? 0))}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function dias(n: number) {
  return n === 1 ? 'día' : 'días';
}

function Dato({
  icono,
  valor,
  etiqueta,
  etiquetaLectura,
}: {
  icono: string;
  valor: number | string;
  etiqueta: string;
  etiquetaLectura?: string;
}) {
  return (
    <View
      style={estilos.dato}
      accessible
      accessibilityLabel={etiquetaLectura ?? `${valor} ${etiqueta}`}>
      <Text style={estilos.iconoDato}>{icono}</Text>
      <Text style={estilos.valorDato}>{valor}</Text>
      <Text style={estilos.etiquetaDato}>{etiqueta}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: Colores.fondo },
  contenido: { padding: Espacio.md + 4, paddingBottom: Espacio.xl + 8, gap: Espacio.md },
  titulo: {
    fontFamily: Fuentes.titulo,
    fontSize: Tamanos.titulo,
    lineHeight: AlturaLinea.titulo,
    color: Colores.oro,
  },
  tarjeta: {
    backgroundColor: Colores.superficie,
    borderColor: Colores.borde,
    borderWidth: 2,
    borderRadius: Radio.md,
    padding: Espacio.md,
    gap: Espacio.sm,
  },
  filaHeroe: { flexDirection: 'row', alignItems: 'center', gap: Espacio.md },
  cajaAvatar: {
    width: 80,
    height: 80,
    borderRadius: Radio.md,
    borderWidth: 2,
    borderColor: Colores.oro,
    backgroundColor: Colores.superficieAlta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simbolo: { fontSize: 44, lineHeight: 52 },
  datosHeroe: { flex: 1, gap: 2 },
  nombre: {
    fontFamily: Fuentes.titulo,
    fontSize: Tamanos.subtitulo,
    lineHeight: AlturaLinea.subtitulo,
    color: Colores.texto,
  },
  clase: {
    fontFamily: Fuentes.cuerpoNegrita,
    fontSize: Tamanos.cuerpo,
    lineHeight: AlturaLinea.cuerpo,
    color: Colores.oro,
  },
  subtitulo: {
    fontFamily: Fuentes.titulo,
    fontSize: Tamanos.subtitulo,
    lineHeight: AlturaLinea.subtitulo,
    color: Colores.texto,
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
  cuadricula: { flexDirection: 'row', flexWrap: 'wrap', gap: Espacio.sm },
  dato: {
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: Colores.superficie,
    borderColor: Colores.borde,
    borderWidth: 2,
    borderRadius: Radio.md,
    padding: Espacio.md,
    gap: 2,
  },
  iconoDato: { fontSize: Tamanos.subtitulo, lineHeight: AlturaLinea.subtitulo, color: Colores.oro },
  valorDato: {
    fontFamily: Fuentes.titulo,
    fontSize: Tamanos.titulo,
    lineHeight: AlturaLinea.titulo,
    color: Colores.texto,
  },
  etiquetaDato: {
    fontFamily: Fuentes.cuerpo,
    fontSize: Tamanos.pequeno,
    lineHeight: AlturaLinea.pequeno,
    color: Colores.textoSecundario,
  },
  filaNivel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.md,
    minHeight: AreaTactilMinima,
    backgroundColor: Colores.superficie,
    borderColor: Colores.borde,
    borderWidth: 2,
    borderRadius: Radio.md,
    paddingHorizontal: Espacio.md,
    paddingVertical: Espacio.sm,
  },
  check: { fontSize: Tamanos.subtitulo, lineHeight: AlturaLinea.subtitulo, color: Colores.verde },
  datosNivel: { flex: 1 },
  tituloNivel: {
    fontFamily: Fuentes.cuerpoNegrita,
    fontSize: Tamanos.cuerpo,
    lineHeight: AlturaLinea.cuerpo,
    color: Colores.texto,
  },
  estrellas: { fontSize: Tamanos.cuerpo, lineHeight: AlturaLinea.cuerpo, color: Colores.oro },
  cajaError: { gap: Espacio.sm },
  textoError: {
    fontFamily: Fuentes.cuerpo,
    fontSize: Tamanos.cuerpo,
    lineHeight: AlturaLinea.cuerpo,
    color: Colores.error,
  },
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
