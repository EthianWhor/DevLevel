import { useFocusEffect } from 'expo-router';
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

import { esErrorApi, obtenerHechizos, type Hechizo, type RespuestaHechizos } from '@/api';
import { BarraProgreso } from '@/components/ui/barra-progreso';
import { BotonPrincipal } from '@/components/ui/boton-principal';
import { useAuth } from '@/context/auth-context';
import { AlturaLinea, AreaTactilMinima, Colores, Espacio, Fuentes, Radio, Tamanos } from '@/theme';

// Libro de hechizos: cada nivel completado deja un "hechizo", que es el
// concepto del nivel para volver a repasarlo. Los datos vienen de GET /hechizos.
export default function HechizosScreen() {
  const { conSesion } = useAuth();
  const [libro, setLibro] = useState<RespuestaHechizos | null>(null);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // null = todas las unidades
  const [unidadFiltro, setUnidadFiltro] = useState<number | null>(null);
  const [abierto, setAbierto] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    setError(null);
    try {
      setLibro(await conSesion((token) => obtenerHechizos(token)));
    } catch (e) {
      setError(esErrorApi(e) ? e.message : 'No se pudo cargar el Libro de hechizos.');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [conSesion]);

  // Se recarga al volver a la pestaña, así aparece el hechizo recién ganado.
  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  const unidadesVisibles =
    libro?.unidades.filter((unidad) => unidadFiltro === null || unidad.id === unidadFiltro) ?? [];

  return (
    <SafeAreaView style={estilos.pantalla} edges={['top', 'left', 'right']}>
      {cargando ? (
        <View style={estilos.centro}>
          <ActivityIndicator
            size="large"
            color={Colores.oro}
            accessibilityLabel="Cargando el Libro de hechizos"
          />
          <Text style={estilos.textoCentro}>Cargando el Libro de hechizos…</Text>
        </View>
      ) : error && !libro ? (
        <View style={estilos.centro}>
          <Text style={estilos.textoError} accessibilityRole="alert">
            ⚠ {error}
          </Text>
          <BotonPrincipal
            titulo="Reintentar"
            onPress={() => {
              setCargando(true);
              cargar();
            }}
          />
        </View>
      ) : libro ? (
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
            Libro de hechizos
          </Text>

          <View style={estilos.progreso}>
            <Text style={estilos.textoProgreso}>
              📖 {libro.resumen.desbloqueados} de {libro.resumen.total} hechizos aprendidos
            </Text>
            <BarraProgreso
              total={libro.resumen.total}
              actual={libro.resumen.desbloqueados}
              etiqueta="Hechizos aprendidos"
            />
          </View>

          {error ? (
            <Text style={estilos.textoError} accessibilityRole="alert">
              ⚠ {error}
            </Text>
          ) : null}

          {/* Filtro por unidad: se elige tocando, sin deslizar obligatorio. */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={estilos.filtros}
            accessibilityLabel="Filtrar por unidad">
            <Filtro
              texto="Todos"
              seleccionado={unidadFiltro === null}
              onPress={() => setUnidadFiltro(null)}
            />
            {libro.unidades.map((unidad) => (
              <Filtro
                key={unidad.id}
                texto={`Unidad ${unidad.orden}`}
                etiqueta={`Unidad ${unidad.orden}: ${unidad.titulo}`}
                seleccionado={unidadFiltro === unidad.id}
                onPress={() => setUnidadFiltro(unidad.id)}
              />
            ))}
          </ScrollView>

          {libro.resumen.desbloqueados === 0 ? (
            <Text style={estilos.textoCentro}>
              Completa tu primer nivel en el mapa para aprender tu primer hechizo.
            </Text>
          ) : null}

          {unidadesVisibles.map((unidad) => (
            <View key={unidad.id} style={estilos.unidad}>
              <Text style={estilos.tituloUnidad} accessibilityRole="header">
                Unidad {unidad.orden}: {unidad.titulo}
              </Text>
              {unidad.hechizos.map((hechizo) => (
                <TarjetaHechizo
                  key={hechizo.nivelId}
                  hechizo={hechizo}
                  abierto={abierto === hechizo.nivelId}
                  onPress={() => setAbierto(abierto === hechizo.nivelId ? null : hechizo.nivelId)}
                />
              ))}
            </View>
          ))}
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

function Filtro({
  texto,
  etiqueta,
  seleccionado,
  onPress,
}: {
  texto: string;
  etiqueta?: string;
  seleccionado: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={etiqueta ?? texto}
      accessibilityState={{ selected: seleccionado }}
      style={[estilos.filtro, seleccionado && estilos.filtroSeleccionado]}>
      <Text style={[estilos.textoFiltro, seleccionado && estilos.textoFiltroSeleccionado]}>
        {seleccionado ? '✔ ' : ''}
        {texto}
      </Text>
    </Pressable>
  );
}

function sinPuntoFinal(texto: string | null) {
  return (texto ?? '').replace(/\.+$/, '');
}

function textoEstrellas(estrellas: number | null) {
  const n = estrellas ?? 0;
  return '★'.repeat(n) + '☆'.repeat(3 - n);
}

function TarjetaHechizo({
  hechizo,
  abierto,
  onPress,
}: {
  hechizo: Hechizo;
  abierto: boolean;
  onPress: () => void;
}) {
  if (!hechizo.desbloqueado) {
    return (
      <View
        style={[estilos.tarjeta, estilos.tarjetaBloqueada]}
        accessible
        accessibilityLabel={`Hechizo bloqueado. Completa el nivel ${hechizo.orden}, ${hechizo.nivelTitulo}, para aprenderlo.`}>
        <Text style={estilos.etiquetaBloqueada}>🔒 Bloqueado · Nivel {hechizo.orden}</Text>
        <Text style={estilos.textoBloqueado}>
          Completa «{hechizo.nivelTitulo}» para aprender este hechizo.
        </Text>
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${hechizo.nombre}. ${sinPuntoFinal(hechizo.descripcion)}. Aprendido en el nivel ${hechizo.orden} con ${hechizo.estrellas} de 3 estrellas.`}
      accessibilityHint={abierto ? 'Oculta el concepto' : 'Muestra el concepto para repasarlo'}
      accessibilityState={{ expanded: abierto }}
      style={({ pressed }) => [
        estilos.tarjeta,
        abierto && estilos.tarjetaAbierta,
        pressed && estilos.presionada,
      ]}>
      <View style={estilos.filaEtiquetas}>
        <Text style={estilos.etiquetaAprendido}>✔ Aprendido · Nivel {hechizo.orden}</Text>
        <Text style={estilos.estrellas}>{textoEstrellas(hechizo.estrellas)}</Text>
      </View>
      <Text style={estilos.nombreHechizo}>✨ {hechizo.nombre}</Text>
      <Text style={estilos.descripcion}>{hechizo.descripcion}</Text>

      {abierto ? (
        <View style={estilos.detalle}>
          <Text style={estilos.subtitulo}>{hechizo.conceptoTitulo}</Text>
          <Text style={estilos.descripcion}>{hechizo.conceptoTexto}</Text>
          {hechizo.conceptoEjemplo ? (
            <View style={estilos.codigo}>
              <Text style={estilos.textoCodigo}>{hechizo.conceptoEjemplo}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <Text style={estilos.verMas}>{abierto ? '▲ Ocultar concepto' : '▼ Repasar concepto'}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: Colores.fondo },
  contenido: { padding: Espacio.md + 4, paddingBottom: Espacio.xl + 8, gap: Espacio.md },
  centro: { flex: 1, justifyContent: 'center', padding: Espacio.lg, gap: Espacio.md },
  titulo: {
    fontFamily: Fuentes.titulo,
    fontSize: Tamanos.titulo,
    lineHeight: AlturaLinea.titulo,
    color: Colores.oro,
  },
  progreso: {
    gap: Espacio.sm,
    backgroundColor: Colores.superficie,
    borderColor: Colores.borde,
    borderWidth: 2,
    borderRadius: Radio.md,
    padding: Espacio.md,
  },
  textoProgreso: {
    fontFamily: Fuentes.cuerpoNegrita,
    fontSize: Tamanos.cuerpo,
    lineHeight: AlturaLinea.cuerpo,
    color: Colores.texto,
  },
  filtros: { gap: Espacio.sm, paddingVertical: Espacio.xs },
  filtro: {
    minHeight: AreaTactilMinima,
    justifyContent: 'center',
    paddingHorizontal: Espacio.md,
    borderRadius: Radio.sm,
    borderWidth: 2,
    borderColor: Colores.borde,
    backgroundColor: Colores.superficie,
  },
  filtroSeleccionado: { backgroundColor: Colores.oro, borderColor: Colores.oro },
  textoFiltro: {
    fontFamily: Fuentes.cuerpoNegrita,
    fontSize: Tamanos.pequeno,
    lineHeight: AlturaLinea.pequeno,
    color: Colores.texto,
  },
  textoFiltroSeleccionado: { color: Colores.textoSobreOro },
  unidad: { gap: Espacio.sm },
  tituloUnidad: {
    fontFamily: Fuentes.titulo,
    fontSize: Tamanos.subtitulo,
    lineHeight: AlturaLinea.subtitulo,
    color: Colores.texto,
    marginTop: Espacio.sm,
  },
  tarjeta: {
    minHeight: AreaTactilMinima,
    backgroundColor: Colores.superficie,
    borderColor: Colores.borde,
    borderWidth: 2,
    borderRadius: Radio.md,
    padding: Espacio.md,
    gap: Espacio.xs,
  },
  tarjetaAbierta: { borderColor: Colores.oro },
  tarjetaBloqueada: { borderStyle: 'dashed' },
  presionada: { opacity: 0.85 },
  filaEtiquetas: { flexDirection: 'row', justifyContent: 'space-between', gap: Espacio.sm },
  etiquetaAprendido: {
    flexShrink: 1,
    fontFamily: Fuentes.cuerpoNegrita,
    fontSize: Tamanos.pequeno,
    lineHeight: AlturaLinea.pequeno,
    color: Colores.verde,
  },
  estrellas: {
    fontSize: Tamanos.pequeno,
    lineHeight: AlturaLinea.pequeno,
    color: Colores.oro,
  },
  nombreHechizo: {
    fontFamily: Fuentes.titulo,
    fontSize: Tamanos.subtitulo,
    lineHeight: AlturaLinea.subtitulo,
    color: Colores.texto,
  },
  descripcion: {
    fontFamily: Fuentes.cuerpo,
    fontSize: Tamanos.cuerpo,
    lineHeight: AlturaLinea.cuerpo,
    color: Colores.textoSecundario,
  },
  detalle: {
    marginTop: Espacio.sm,
    paddingTop: Espacio.sm,
    borderTopWidth: 1,
    borderTopColor: Colores.borde,
    gap: Espacio.sm,
  },
  subtitulo: {
    fontFamily: Fuentes.cuerpoNegrita,
    fontSize: Tamanos.cuerpo,
    lineHeight: AlturaLinea.cuerpo,
    color: Colores.oro,
  },
  codigo: {
    backgroundColor: Colores.fondo,
    borderColor: Colores.borde,
    borderWidth: 1,
    borderRadius: Radio.sm,
    padding: Espacio.sm,
  },
  textoCodigo: {
    fontFamily: Fuentes.codigo,
    fontSize: Tamanos.pequeno,
    lineHeight: AlturaLinea.pequeno,
    color: Colores.texto,
  },
  verMas: {
    fontFamily: Fuentes.cuerpoNegrita,
    fontSize: Tamanos.pequeno,
    lineHeight: AlturaLinea.pequeno,
    color: Colores.oro,
    marginTop: Espacio.xs,
  },
  etiquetaBloqueada: {
    fontFamily: Fuentes.cuerpoNegrita,
    fontSize: Tamanos.pequeno,
    lineHeight: AlturaLinea.pequeno,
    color: Colores.textoApagado,
  },
  textoBloqueado: {
    fontFamily: Fuentes.cuerpo,
    fontSize: Tamanos.cuerpo,
    lineHeight: AlturaLinea.cuerpo,
    color: Colores.textoApagado,
  },
  textoCentro: {
    fontFamily: Fuentes.cuerpo,
    fontSize: Tamanos.cuerpo,
    lineHeight: AlturaLinea.cuerpo,
    color: Colores.textoSecundario,
    textAlign: 'center',
  },
  textoError: {
    fontFamily: Fuentes.cuerpo,
    fontSize: Tamanos.cuerpo,
    lineHeight: AlturaLinea.cuerpo,
    color: Colores.error,
    textAlign: 'center',
  },
});
