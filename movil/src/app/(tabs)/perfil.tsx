import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { esErrorApi, mapaApi, obtenerInventario, type ObjetoInventario, type RespuestaMapa } from '@/api';
import { PanelEquipo } from '@/components/heroe/panel-equipo';
import { Sprite } from '@/components/pixel/sprite';
import { IconoCandado, IconoObjeto } from '@/components/pixel/icono-objeto';
import { PALETA_HEROE, spriteHeroe } from '@/components/pixel/sprites';
import { BarraSegmentada } from '@/components/retro/barra-segmentada';
import { BarraSuperior, rango } from '@/components/retro/barra-superior';
import { MarcoPixel } from '@/components/retro/marco-pixel';
import { datosAvatar } from '@/constants/avatares';
import { useAuth } from '@/context/auth-context';
import { OBJETOS } from '@/juego/objetos';
import { AlturaLinea, AreaTactilMinima, Colores, Espacio, Fuentes, Tamanos } from '@/theme';

// Misma regla que el backend (lib/progreso.ts): un nivel de jugador cada 100 XP.
const XP_POR_NIVEL = 100;
const TOTAL_OBJETOS = Object.keys(OBJETOS).length;

// Perfil del héroe (diseño "perfil_del_jugador"): retrato, nivel y rango,
// barras de XP y racha, Reliquias (los objetos ganados), equipo y niveles.
export default function PerfilScreen() {
  const { perfil, usuario, conSesion, recargarPerfil } = useAuth();
  const [mapa, setMapa] = useState<RespuestaMapa | null>(null);
  const [objetos, setObjetos] = useState<ObjetoInventario[] | null>(null);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elegido, setElegido] = useState<ObjetoInventario | null>(null);

  const cargar = useCallback(async () => {
    setError(null);
    try {
      const [respuestaMapa, inventario] = await Promise.all([
        conSesion((token) => mapaApi.obtenerMapa(token)),
        conSesion((token) => obtenerInventario(token)),
        recargarPerfil(),
      ]);
      setMapa(respuestaMapa);
      setObjetos(inventario.objetos);
    } catch (e) {
      setError(esErrorApi(e) ? e.message : 'No se pudo actualizar tu perfil.');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [conSesion, recargarPerfil]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  if (!perfil) return null;

  const clase = datosAvatar(perfil.avatar);
  const xpEnNivel = Math.max(0, perfil.xp - (perfil.nivel - 1) * XP_POR_NIVEL);
  const completados =
    mapa?.unidades.flatMap((u) => u.niveles.filter((n) => n.estado === 'completado').map((n) => ({ ...n, unidad: u.orden }))) ?? [];
  const totalNiveles = mapa?.resumen.total ?? 15;
  const estrellas = completados.reduce((s, n) => s + (n.estrellas ?? 0), 0);
  const huecos = Math.max(0, TOTAL_OBJETOS - (objetos?.length ?? 0));

  return (
    <SafeAreaView style={estilos.pantalla} edges={['top', 'left', 'right']}>
      <BarraSuperior />
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
        {/* Retrato del héroe */}
        <MarcoPixel esquinas>
          <View style={estilos.retrato}>
            <View style={estilos.marcoRetrato} importantForAccessibility="no-hide-descendants">
              <Sprite mapa={spriteHeroe('sur', perfil.avatar ?? 'explorador').mapa} paleta={PALETA_HEROE[perfil.avatar ?? 'explorador']} tamano={112} />
              <Text style={estilos.etiquetaNivel}>NIVEL {perfil.nivel}</Text>
            </View>
            <View style={estilos.datosHeroe} accessible>
              <Text style={estilos.nombre} accessibilityRole="header">
                {perfil.nombreHeroe ?? 'Héroe'}
              </Text>
              <Text style={estilos.clase}>Clase: {clase?.nombre ?? 'Sin clase'}</Text>
              <Text style={estilos.rango}>Rango: {rango(perfil.nivel)}</Text>
              {usuario?.email ? <Text style={estilos.correo}>{usuario.email}</Text> : null}
            </View>
          </View>
          <Text style={estilos.contadores}>
            {completados.length}/{totalNiveles} niveles · {estrellas}/{totalNiveles * 3} ★ · {objetos?.length ?? 0}/{TOTAL_OBJETOS} reliquias
          </Text>

          <Text style={estilos.etiquetaBarra}>
            Experiencia: {xpEnNivel} / {XP_POR_NIVEL} para el nivel {perfil.nivel + 1}
          </Text>
          <BarraSegmentada
            valor={xpEnNivel}
            maximo={XP_POR_NIVEL}
            color={Colores.verde}
            etiqueta={`Experiencia ${xpEnNivel} de ${XP_POR_NIVEL} para el nivel ${perfil.nivel + 1}`}
          />
          <Text style={estilos.etiquetaBarra}>
            🔥 Racha: {perfil.rachaActual} {perfil.rachaActual === 1 ? 'día' : 'días'} · mejor {perfil.rachaMaxima}
          </Text>
          <BarraSegmentada
            valor={perfil.rachaActual}
            maximo={Math.max(7, perfil.rachaMaxima)}
            color={Colores.vidaRojo}
            segmentos={7}
            etiqueta={`Racha de ${perfil.rachaActual} días seguidos; tu mejor racha es ${perfil.rachaMaxima}`}
          />

          <Pressable
            onPress={() => router.push('/personaje')}
            accessibilityRole="button"
            accessibilityLabel="Editar héroe"
            accessibilityHint="Cambia tu nombre de héroe o tu clase"
            style={estilos.botonSecundario}>
            <Text style={estilos.textoBotonSecundario}>✎ EDITAR HÉROE</Text>
          </Pressable>
        </MarcoPixel>

        {error ? (
          <Text style={estilos.error} accessibilityRole="alert">
            ⚠ {error}
          </Text>
        ) : null}

        {/* Reliquias: los objetos ganados y los espacios que faltan. */}
        <MarcoPixel titulo="Reliquias" icono="🏆">
          {cargando && !objetos ? <ActivityIndicator color={Colores.oro} accessibilityLabel="Cargando reliquias" /> : null}
          <View style={estilos.cuadricula}>
            {objetos?.map((o) => (
              <Pressable
                key={o.id}
                onPress={() => setElegido(elegido?.id === o.id ? null : o)}
                accessibilityRole="button"
                accessibilityLabel={`${o.nombre}${o.mitico ? ', mítico' : ''}. ${o.efecto}`}
                accessibilityState={{ selected: elegido?.id === o.id }}
                style={[estilos.reliquia, o.mitico && estilos.reliquiaMitica, elegido?.id === o.id && estilos.reliquiaElegida]}>
                <IconoObjeto id={o.id} tamano={40} />
                {o.mitico ? <Text style={estilos.mitico}>MÍTICO</Text> : null}
              </Pressable>
            ))}
            {Array.from({ length: Math.min(huecos, 8) }).map((_, i) => (
              <View key={`hueco-${i}`} style={[estilos.reliquia, estilos.hueco]} accessible accessibilityLabel="Reliquia sin descubrir">
                <View style={estilos.candado}>
                  <IconoCandado tamano={28} />
                </View>
              </View>
            ))}
          </View>
          {elegido ? (
            <View style={[estilos.detalle, elegido.mitico && { borderColor: Colores.vidaRojo }]} accessibilityLiveRegion="polite">
              <View style={estilos.filaNombre}>
                <IconoObjeto id={elegido.id} tamano={32} />
                <Text style={[estilos.nombreObjeto, elegido.mitico && { color: Colores.vidaRojo }]}>
                  {elegido.nombre}
                  {elegido.mitico ? ' · MÍTICO' : ''}
                </Text>
              </View>
              <Text style={estilos.texto}>{elegido.efecto}</Text>
              <Text style={estilos.textoApagado}>Espacio: {elegido.espacio}</Text>
            </View>
          ) : objetos && objetos.length === 0 ? (
            <Text style={estilos.texto}>Cumple los objetivos con ★ de una mazmorra para ganar tu primera reliquia.</Text>
          ) : (
            <Text style={estilos.textoApagado}>Toca una reliquia para ver qué hace.</Text>
          )}
        </MarcoPixel>

        {/* Equipo: silueta del héroe con sus casillas. */}
        <PanelEquipo objetos={objetos} />

        {/* Niveles completados */}
        <MarcoPixel titulo="Niveles completados" icono="✔">
          {mapa && completados.length === 0 ? (
            <Text style={estilos.texto}>Todavía no has completado niveles. ¡Empieza tu aventura en el mapa!</Text>
          ) : null}
          {completados.map((n) => (
            <View
              key={n.id}
              style={estilos.filaNivel}
              accessible
              accessibilityLabel={`Nivel ${n.orden}, ${n.titulo}, ${n.estrellas} de 3 estrellas`}>
              <Text style={estilos.check}>✔</Text>
              <View style={{ flex: 1 }}>
                <Text style={estilos.textoApagado}>
                  Unidad {n.unidad} · Nivel {n.orden}
                </Text>
                <Text style={estilos.tituloNivel}>{n.titulo}</Text>
              </View>
              <Text style={estilos.estrellas}>
                {'★'.repeat(n.estrellas ?? 0)}
                {'☆'.repeat(3 - (n.estrellas ?? 0))}
              </Text>
            </View>
          ))}
        </MarcoPixel>
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: Colores.fondo },
  contenido: { padding: Espacio.md, paddingBottom: Espacio.xl, gap: Espacio.lg },
  retrato: { flexDirection: 'row', gap: Espacio.md, alignItems: 'center' },
  marcoRetrato: { borderWidth: 3, borderColor: Colores.bordePixel, backgroundColor: Colores.mazmorra, padding: 4 },
  etiquetaNivel: {
    position: 'absolute',
    right: -8,
    bottom: -10,
    paddingHorizontal: 6,
    backgroundColor: Colores.oro,
    color: Colores.textoSobreOro,
    fontFamily: Fuentes.codigo,
    fontSize: 13,
    borderWidth: 2,
    borderColor: Colores.oroOscuro,
  },
  datosHeroe: { flex: 1, gap: 2 },
  nombre: { fontFamily: Fuentes.titulo, fontSize: Tamanos.subtitulo, lineHeight: AlturaLinea.subtitulo, color: Colores.texto },
  clase: { fontFamily: Fuentes.codigo, fontSize: Tamanos.pequeno, lineHeight: AlturaLinea.pequeno, color: Colores.oro },
  rango: { fontFamily: Fuentes.codigo, fontSize: Tamanos.pequeno, lineHeight: AlturaLinea.pequeno, color: Colores.manaClaro },
  correo: { fontFamily: Fuentes.cuerpo, fontSize: 12, lineHeight: 16, color: Colores.textoApagado },
  contadores: { fontFamily: Fuentes.codigo, fontSize: 13, lineHeight: 18, color: Colores.texto, marginTop: Espacio.sm },
  etiquetaBarra: { fontFamily: Fuentes.codigo, fontSize: 13, lineHeight: 18, color: Colores.textoSecundario },
  botonSecundario: {
    minHeight: AreaTactilMinima,
    marginTop: Espacio.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colores.oro,
    borderBottomWidth: 4,
  },
  textoBotonSecundario: { fontFamily: Fuentes.codigo, fontSize: Tamanos.pequeno, letterSpacing: 1, color: Colores.oro },
  error: { fontFamily: Fuentes.cuerpo, fontSize: Tamanos.cuerpo, color: Colores.error },
  cuadricula: { flexDirection: 'row', flexWrap: 'wrap', gap: Espacio.sm },
  reliquia: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colores.bordePixel,
    backgroundColor: Colores.mazmorra,
  },
  reliquiaMitica: { borderColor: Colores.vidaRojo },
  reliquiaElegida: { borderColor: Colores.oro },
  hueco: { borderStyle: 'dashed', borderColor: Colores.borde, backgroundColor: 'transparent' },
  mitico: { position: 'absolute', bottom: 0, fontSize: 9, color: '#fff', backgroundColor: Colores.vidaRojo, paddingHorizontal: 2 },
  candado: { opacity: 0.5 },
  filaNombre: { flexDirection: 'row', alignItems: 'center', gap: Espacio.sm },
  detalle: { gap: 2, padding: Espacio.sm, borderWidth: 2, borderColor: Colores.oro },
  nombreObjeto: { flex: 1, fontFamily: Fuentes.cuerpoNegrita, fontSize: Tamanos.cuerpo, color: Colores.oro },
  texto: { fontFamily: Fuentes.cuerpo, fontSize: Tamanos.pequeno, lineHeight: AlturaLinea.pequeno, color: Colores.texto },
  textoApagado: { fontFamily: Fuentes.cuerpo, fontSize: 13, lineHeight: 18, color: Colores.textoApagado },
  filaNivel: { flexDirection: 'row', alignItems: 'center', gap: Espacio.sm, minHeight: AreaTactilMinima },
  check: { fontSize: Tamanos.subtitulo, color: Colores.verde },
  tituloNivel: { fontFamily: Fuentes.cuerpoNegrita, fontSize: Tamanos.cuerpo, lineHeight: AlturaLinea.cuerpo, color: Colores.texto },
  estrellas: { fontSize: Tamanos.cuerpo, color: Colores.oro },
});
