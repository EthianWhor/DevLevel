import { useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import type { Avatar, NivelMapa, UnidadMapa } from '@/api';
import { Sprite } from '@/components/pixel/sprite';
import { PALETA_HEROE, spriteHeroe } from '@/components/pixel/sprites';
import { AlturaLinea, AreaTactilMinima, Colores, Espacio, Fuentes, Tamanos } from '@/theme';

// Las cinco regiones del reino, una por unidad (de abajo hacia arriba).
const REGIONES = [
  { nombre: 'Aldea del Inicio', fondo: '#1d2a14', borde: '#4de082', adornos: ['🏠', '🌾', '🚩', '🏡'] },
  { nombre: 'Bosque de los Cofres', fondo: '#132017', borde: '#22c55e', adornos: ['🌲', '🌳', '🍄', '🌲'] },
  { nombre: 'Montaña de los Caminos', fondo: '#241f18', borde: '#a8a29e', adornos: ['⛰️', '🪨', '🏔️', '🪨'] },
  { nombre: 'Río de los Ciclos', fondo: '#0f1d2b', borde: '#3b82f6', adornos: ['🌊', '🛶', '🌊', '🌀'] },
  { nombre: 'Fortaleza de las Funciones', fondo: '#1f1220', borde: '#ef4444', adornos: ['🏰', '🔥', '🦇', '🏰'] },
];

const ALTO_ZONA = 150;
const ALTO_CARTEL = 56;
const TAMANO_ZONA = 76;
// Posición horizontal de cada zona dentro de su unidad (zigzag).
const ZIGZAG = [0.3, 0.68, 0.36];

type Props = {
  unidades: UnidadMapa[];
  avatar: Avatar;
  reducirMovimiento: boolean;
  onEntrar: (nivel: NivelMapa) => void;
};

type Zona = { nivel: NivelMapa; unidad: UnidadMapa; indiceUnidad: number; x: number; y: number; esJefe: boolean };

const TEXTO_ESTADO = { completado: 'completado', actual: 'nivel actual', bloqueado: 'bloqueado' } as const;

// Mapa del reino (diseño "mapa_de_niveles_overworld"): un camino que sube
// desde la aldea (nivel 1, abajo) hasta la fortaleza (nivel 15, arriba).
// Las zonas se dibujan en orden 1 → 15 para que TalkBack las recorra así.
export function MapaReino({ unidades, avatar, reducirMovimiento, onEntrar }: Props) {
  const { width, height } = useWindowDimensions();
  const ancho = Math.min(width, 520);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);

  // Alto total: cada unidad tiene su cartel y sus zonas.
  const altoUnidad = (u: UnidadMapa) => ALTO_CARTEL + u.niveles.length * ALTO_ZONA;
  const altoTotal = unidades.reduce((s, u) => s + altoUnidad(u), 0) + Espacio.xl;

  // Posición de cada zona. La unidad 1 queda abajo.
  const { zonas, bandas } = useMemo(() => {
    const zonas: Zona[] = [];
    const bandas: { unidad: UnidadMapa; indice: number; top: number; alto: number }[] = [];
    let base = altoTotal - Espacio.xl; // borde inferior de la unidad actual
    unidades.forEach((unidad, iu) => {
      const alto = altoUnidad(unidad);
      const top = base - alto;
      bandas.push({ unidad, indice: iu, top, alto });
      unidad.niveles.forEach((nivel, i) => {
        const y = base - ALTO_ZONA * (i + 0.5);
        zonas.push({
          nivel,
          unidad,
          indiceUnidad: iu,
          x: ancho * ZIGZAG[i % ZIGZAG.length],
          y,
          esJefe: i === unidad.niveles.length - 1,
        });
      });
      base = top;
    });
    return { zonas, bandas };
  }, [unidades, ancho, altoTotal]);

  const actual = zonas.find((z) => z.nivel.estado === 'actual') ?? zonas[zonas.length - 1];

  // El héroe camina desde la zona anterior cuando avanza de nivel.
  const anterior = useRef<number | null>(null);
  const heroeX = useRef(new Animated.Value(actual?.x ?? 0)).current;
  const heroeY = useRef(new Animated.Value(actual?.y ?? 0)).current;
  const [mirando, setMirando] = useState<'este' | 'oeste' | 'norte'>('norte');

  useEffect(() => {
    if (!actual) return;
    const idAnterior = anterior.current;
    anterior.current = actual.nivel.id;
    const desde = zonas.find((z) => z.nivel.id === idAnterior);
    const destinoX = actual.x + TAMANO_ZONA + 2;
    const destinoY = actual.y - 22;
    if (!desde || desde.nivel.id === actual.nivel.id || reducirMovimiento) {
      heroeX.setValue(destinoX);
      heroeY.setValue(destinoY);
      return;
    }
    heroeX.setValue(desde.x + TAMANO_ZONA + 2);
    heroeY.setValue(desde.y - 22);
    setMirando(actual.x > desde.x ? 'este' : 'oeste');
    Animated.parallel([
      Animated.timing(heroeX, { toValue: destinoX, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(heroeY, { toValue: destinoY, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]).start(() => setMirando('norte'));
  }, [actual, zonas, reducirMovimiento, heroeX, heroeY]);

  // Al abrir, el mapa se desplaza hasta el nivel actual.
  const [listo, setListo] = useState(false);
  useEffect(() => {
    if (!listo || !actual) return;
    const y = Math.max(0, actual.y - height / 2);
    scroll.current?.scrollTo({ y, animated: !reducirMovimiento });
  }, [listo, actual, height, reducirMovimiento]);

  // Puntos del sendero entre zonas consecutivas.
  const puntos = useMemo(() => {
    const lista: { x: number; y: number; hecho: boolean; clave: string }[] = [];
    for (let i = 0; i < zonas.length - 1; i++) {
      const a = zonas[i];
      const b = zonas[i + 1];
      const pasos = Math.max(4, Math.floor(Math.hypot(b.x - a.x, b.y - a.y) / 14));
      for (let p = 1; p < pasos; p++) {
        const t = p / pasos;
        lista.push({
          x: a.x + (b.x - a.x) * t,
          y: a.y + (b.y - a.y) * t,
          hecho: a.nivel.estado === 'completado',
          clave: `${i}-${p}`,
        });
      }
    }
    return lista;
  }, [zonas]);

  const heroe = spriteHeroe(mirando === 'norte' ? 'sur' : mirando);

  return (
    <ScrollView ref={scroll} onLayout={() => setListo(true)} contentContainerStyle={{ alignItems: 'center' }}>
      <View style={{ width: ancho, height: altoTotal }}>
        {/* Regiones con su fondo, adornos y cartel. */}
        {bandas.map(({ unidad, indice, top, alto }) => {
          const region = REGIONES[indice % REGIONES.length];
          return (
            <View
              key={unidad.id}
              style={[estilos.region, { top, height: alto, backgroundColor: region.fondo, borderColor: region.borde }]}
              importantForAccessibility="no-hide-descendants"
              accessibilityElementsHidden>
              {region.adornos.map((a, i) => (
                <Text
                  key={i}
                  style={[
                    estilos.adorno,
                    { top: ALTO_CARTEL + (alto - ALTO_CARTEL) * ((i * 0.27 + 0.12) % 1), left: i % 2 === 0 ? 8 : ancho - 44 },
                  ]}>
                  {a}
                </Text>
              ))}
            </View>
          );
        })}
        {/* Sendero punteado: dorado donde ya pasaste. */}
        {puntos.map((p) => (
          <View
            key={p.clave}
            style={[
              estilos.punto,
              { left: p.x + TAMANO_ZONA / 2 - 3, top: p.y - 3, backgroundColor: p.hecho ? Colores.oro : '#5b5240' },
            ]}
          />
        ))}

        {bandas.map(({ unidad, indice, top }) => (
          <View key={`cartel-${unidad.id}`} style={[estilos.cartel, { top: top + 8 }]} accessible accessibilityRole="header">
            <Text style={estilos.textoCartel}>{REGIONES[indice % REGIONES.length].nombre.toUpperCase()}</Text>
            <Text style={estilos.subCartel}>
              Unidad {unidad.orden}: {unidad.titulo}
            </Text>
          </View>
        ))}

        {/* Zonas, en orden del camino (1 a 15). */}
        {zonas.map((z) => (
          <ZonaNivel key={z.nivel.id} zona={z} region={REGIONES[z.indiceUnidad % REGIONES.length].nombre} onEntrar={onEntrar} />
        ))}

        {/* Héroe en la zona actual. */}
        {actual ? (
          <Animated.View
            style={[estilos.heroe, { transform: [{ translateX: heroeX }, { translateY: heroeY }] }]}
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden>
            <Sprite mapa={heroe.mapa} paleta={PALETA_HEROE[avatar]} tamano={40} espejo={heroe.espejo} />
          </Animated.View>
        ) : null}
      </View>
    </ScrollView>
  );
}

function ZonaNivel({ zona, region, onEntrar }: { zona: Zona; region: string; onEntrar: (n: NivelMapa) => void }) {
  const { nivel, esJefe } = zona;
  const actual = nivel.estado === 'actual';
  const completado = nivel.estado === 'completado';
  const bloqueado = nivel.estado === 'bloqueado';
  const icono = bloqueado ? '🔒' : esJefe ? '💀' : completado ? '✓' : '⚔';
  const estrellas = nivel.estrellas ?? 0;

  const etiqueta = [
    `Nivel ${nivel.orden}, ${nivel.titulo}`,
    `unidad ${zona.unidad.orden}, ${region}`,
    esJefe ? 'guarida del jefe' : null,
    TEXTO_ESTADO[nivel.estado],
    completado ? `con ${estrellas} de 3 estrellas` : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <View style={[estilos.zona, { left: zona.x, top: zona.y - TAMANO_ZONA / 2 }]}>
      {actual ? <Text style={estilos.pin}>📍</Text> : null}
      <Pressable
        onPress={() => onEntrar(nivel)}
        disabled={bloqueado}
        accessibilityRole="button"
        accessibilityLabel={etiqueta}
        accessibilityHint={bloqueado ? 'Completa el nivel anterior para abrirlo' : 'Abre el nivel'}
        accessibilityState={{ disabled: bloqueado }}
        style={({ pressed }) => [
          estilos.caja,
          completado && estilos.cajaCompletada,
          actual && estilos.cajaActual,
          bloqueado && estilos.cajaBloqueada,
          pressed && { opacity: 0.85 },
        ]}>
        <Text style={[estilos.icono, completado && { color: Colores.verde }, actual && { color: Colores.textoSobreOro }]}>{icono}</Text>
        <Text style={[estilos.numeroZona, actual && { color: Colores.textoSobreOro }]}>{nivel.orden}</Text>
      </Pressable>
      <View style={[estilos.etiqueta, actual && estilos.etiquetaActual]} importantForAccessibility="no-hide-descendants">
        {esJefe ? <Text style={estilos.jefe}>JEFE</Text> : null}
        <Text style={[estilos.tituloZona, bloqueado && { color: Colores.textoApagado }]} numberOfLines={2}>
          {nivel.titulo}
        </Text>
        <Text style={[estilos.estadoZona, completado && { color: Colores.verde }, bloqueado && { color: Colores.textoApagado }]}>
          {completado ? '★'.repeat(estrellas) + '☆'.repeat(3 - estrellas) : bloqueado ? '🔒 Bloqueado' : 'ENTRAR ▶'}
        </Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  region: { position: 'absolute', left: 0, right: 0, borderTopWidth: 3, borderBottomWidth: 0 },
  adorno: { position: 'absolute', fontSize: 28, opacity: 0.55 },
  cartel: {
    position: 'absolute',
    alignSelf: 'center',
    left: Espacio.lg,
    right: Espacio.lg,
    alignItems: 'center',
    paddingVertical: 4,
    backgroundColor: '#0f172a',
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  textoCartel: { fontFamily: Fuentes.codigo, fontSize: Tamanos.pequeno, lineHeight: AlturaLinea.pequeno, color: Colores.oro, letterSpacing: 1 },
  subCartel: { fontFamily: Fuentes.cuerpo, fontSize: 12, lineHeight: 16, color: Colores.textoSecundario },
  punto: { position: 'absolute', width: 6, height: 6 },
  zona: { position: 'absolute', width: TAMANO_ZONA, alignItems: 'center' },
  pin: { position: 'absolute', top: -28, fontSize: 22 },
  caja: {
    width: TAMANO_ZONA,
    height: TAMANO_ZONA,
    minHeight: AreaTactilMinima,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colores.superficie,
    borderWidth: 3,
    borderColor: '#4d4732',
    borderBottomWidth: 6,
  },
  cajaCompletada: { borderColor: Colores.verde, backgroundColor: '#14301f' },
  cajaActual: {
    borderColor: '#fff6a0',
    backgroundColor: Colores.oro,
    shadowColor: Colores.oro,
    shadowOpacity: 0.9,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  cajaBloqueada: { backgroundColor: '#1c180d', borderColor: '#4d4732' },
  icono: { fontSize: 26, lineHeight: 32, color: Colores.texto },
  numeroZona: { fontFamily: Fuentes.codigo, fontSize: 12, color: Colores.textoSecundario },
  etiqueta: {
    marginTop: 4,
    width: 132,
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  etiquetaActual: { borderColor: Colores.oro, borderWidth: 2 },
  jefe: { fontFamily: Fuentes.codigo, fontSize: 11, color: '#ffffff', backgroundColor: '#b91c1c', paddingHorizontal: 4 },
  tituloZona: { fontFamily: Fuentes.cuerpoNegrita, fontSize: 13, lineHeight: 17, color: Colores.texto, textAlign: 'center' },
  estadoZona: { fontFamily: Fuentes.codigo, fontSize: 12, lineHeight: 16, color: Colores.oro },
  heroe: { position: 'absolute', left: 0, top: 0 },
});
