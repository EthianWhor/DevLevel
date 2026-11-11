import { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import type { Avatar } from '@/api';
import { Sprite } from '@/components/pixel/sprite';
import {
  MONEDA,
  MURO,
  PALETA_HEROE,
  PALETA_TERRENO,
  PINCHOS,
  PISO,
  PUERTA,
  SPRITES_ENEMIGO,
  spriteHeroe,
} from '@/components/pixel/sprites';
import { leerMapa } from '@/juego/simulador';
import type { Direccion, EstadoEnemigo, Mazmorra } from '@/juego/tipos';
import { Colores, Fuentes } from '@/theme';

// Lo que hace falta para dibujar un momento de la mazmorra.
export type EstadoEscena = {
  fila: number;
  col: number;
  dir: Direccion;
  vida: number;
  enemigos: EstadoEnemigo[];
  monedasEnMapa: [number, number][];
};

export function estadoInicial(mazmorra: Mazmorra): EstadoEscena {
  const mapa = leerMapa(mazmorra);
  return {
    fila: mapa.inicio[0],
    col: mapa.inicio[1],
    dir: mazmorra.direccionInicial,
    vida: 3,
    enemigos: mapa.enemigos,
    monedasEnMapa: mapa.monedas,
  };
}

const NOMBRE_ENEMIGO = { goblin: 'un goblin', orco: 'un orco', caballero: 'un caballero esqueleto' } as const;
const DELTA: Record<Direccion, [number, number]> = { norte: [-1, 0], sur: [1, 0], este: [0, 1], oeste: [0, -1] };

// Descripción corta para TalkBack: dónde está el héroe y qué tiene enfrente.
export function describirEstado(mazmorra: Mazmorra, estado: EstadoEscena): string {
  const { terreno, puerta } = leerMapa(mazmorra);
  const [df, dc] = DELTA[estado.dir];
  const f = estado.fila + df;
  const c = estado.col + dc;
  const enemigo = estado.enemigos.find((e) => e.fila === f && e.col === c);
  const moneda = estado.monedasEnMapa.some(([mf, mc]) => mf === f && mc === c);
  let enfrente = 'piso libre';
  if (f < 0 || f >= terreno.length || c < 0 || c >= terreno[0].length || terreno[f][c] === 'muro') enfrente = 'un muro';
  else if (enemigo) enfrente = NOMBRE_ENEMIGO[enemigo.tipo];
  else if (terreno[f][c] === 'pincho') enfrente = 'pinchos';
  else if (terreno[f][c] === 'puerta') enfrente = 'la puerta';
  else if (moneda) enfrente = 'una moneda';
  return `Héroe en fila ${estado.fila + 1}, columna ${estado.col + 1}, mirando al ${estado.dir}. Enfrente: ${enfrente}. La puerta está en fila ${puerta[0] + 1}, columna ${puerta[1] + 1}.`;
}

// Lista completa de la mazmorra en texto (botón "Describir mazmorra").
export function describirMazmorra(mazmorra: Mazmorra, estado: EstadoEscena): string[] {
  const { terreno } = leerMapa(mazmorra);
  const lineas = [describirEstado(mazmorra, estado)];
  for (const e of estado.enemigos) {
    lineas.push(`${NOMBRE_ENEMIGO[e.tipo]} en fila ${e.fila + 1}, columna ${e.col + 1}, con ${e.vida} de vida.`);
  }
  for (const [f, c] of estado.monedasEnMapa) lineas.push(`Una moneda en fila ${f + 1}, columna ${c + 1}.`);
  terreno.forEach((fila, f) =>
    fila.forEach((t, c) => {
      if (t === 'pincho') lineas.push(`Pinchos en fila ${f + 1}, columna ${c + 1}.`);
    }),
  );
  return lineas;
}

type Props = {
  mazmorra: Mazmorra;
  estado: EstadoEscena;
  avatar: Avatar;
  ancho: number;
  reducirMovimiento: boolean;
  camino?: [number, number][];
  // Cambia cada vez que hay que mostrar un número de daño sobre el héroe.
  danio?: { valor: number; clave: number } | null;
};

// El terreno no cambia durante la partida: se dibuja una sola vez.
const Terreno = memo(function Terreno({ mazmorra, tamano }: { mazmorra: Mazmorra; tamano: number }) {
  const { terreno } = useMemo(() => leerMapa(mazmorra), [mazmorra]);
  return (
    <>
      {terreno.map((fila, f) =>
        fila.map((t, c) => (
          <View key={`${f}-${c}`} style={[estilos.celda, { left: c * tamano, top: f * tamano, width: tamano, height: tamano }]}>
            <Sprite mapa={t === 'muro' ? MURO : t === 'puerta' ? PUERTA : PISO} paleta={PALETA_TERRENO} tamano={tamano} />
            {t === 'pincho' ? (
              <View style={StyleSheet.absoluteFill}>
                <Sprite mapa={PINCHOS} paleta={PALETA_TERRENO} tamano={tamano} />
              </View>
            ) : null}
            {t === 'puerta' ? <View style={[StyleSheet.absoluteFill, estilos.brilloPuerta]} /> : null}
          </View>
        )),
      )}
    </>
  );
});

export function Escenario({ mazmorra, estado, avatar, ancho, reducirMovimiento, camino, danio }: Props) {
  const filas = mazmorra.mapa.length;
  const cols = mazmorra.mapa[0].length;
  const tamano = Math.floor(ancho / cols);

  // Posición animada del héroe.
  const x = useRef(new Animated.Value(estado.col * tamano)).current;
  const y = useRef(new Animated.Value(estado.fila * tamano)).current;
  useEffect(() => {
    const destinoX = estado.col * tamano;
    const destinoY = estado.fila * tamano;
    if (reducirMovimiento) {
      x.setValue(destinoX);
      y.setValue(destinoY);
      return;
    }
    Animated.parallel([
      Animated.timing(x, { toValue: destinoX, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(y, { toValue: destinoY, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, [estado.col, estado.fila, tamano, reducirMovimiento, x, y]);

  // Número de daño que sube y desaparece.
  const subida = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!danio || reducirMovimiento) return;
    subida.setValue(0);
    Animated.timing(subida, { toValue: 1, duration: 700, useNativeDriver: true }).start();
  }, [danio, reducirMovimiento, subida]);

  const heroe = spriteHeroe(estado.dir);

  return (
    <View
      style={[estilos.marco, { width: cols * tamano + 8, height: filas * tamano + 8 }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={describirEstado(mazmorra, estado)}>
      <View style={{ width: cols * tamano, height: filas * tamano }}>
        <Terreno mazmorra={mazmorra} tamano={tamano} />

        {camino?.map(([f, c]) => (
          <View
            key={`camino-${f}-${c}`}
            style={[estilos.camino, { left: c * tamano + tamano / 3, top: f * tamano + tamano / 3, width: tamano / 3, height: tamano / 3 }]}
          />
        ))}

        {estado.monedasEnMapa.map(([f, c]) => (
          <View key={`m-${f}-${c}`} style={[estilos.celda, { left: c * tamano, top: f * tamano }]}>
            <Sprite mapa={MONEDA} paleta={PALETA_TERRENO} tamano={tamano} />
          </View>
        ))}

        {estado.enemigos.map((e) => {
          const sprite = SPRITES_ENEMIGO[e.tipo];
          return (
            <View key={`e-${e.id}`} style={[estilos.celda, { left: e.col * tamano, top: e.fila * tamano }]}>
              <Sprite mapa={sprite.mapa} paleta={sprite.paleta} tamano={tamano} />
              <View style={[estilos.barraVida, { width: tamano - 4 }]}>
                {Array.from({ length: e.vidaMax }).map((_, i) => (
                  <View key={i} style={[estilos.segmentoVida, { backgroundColor: i < e.vida ? '#ef4444' : '#3f3f46' }]} />
                ))}
              </View>
            </View>
          );
        })}

        <Animated.View style={[estilos.celda, { transform: [{ translateX: x }, { translateY: y }] }]}>
          <Sprite mapa={heroe.mapa} paleta={PALETA_HEROE[avatar]} tamano={tamano} espejo={heroe.espejo} />
          {danio && danio.valor > 0 && !reducirMovimiento ? (
            <Animated.Text
              style={[
                estilos.danio,
                {
                  opacity: subida.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] }),
                  transform: [{ translateY: subida.interpolate({ inputRange: [0, 1], outputRange: [0, -tamano] }) }],
                },
              ]}>
              -{danio.valor}
            </Animated.Text>
          ) : null}
        </Animated.View>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  marco: {
    alignSelf: 'center',
    padding: 2,
    backgroundColor: '#0f172a',
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  celda: { position: 'absolute', left: 0, top: 0 },
  brilloPuerta: { borderWidth: 2, borderColor: Colores.oro },
  camino: { position: 'absolute', backgroundColor: 'rgba(255, 215, 0, 0.55)' },
  barraVida: { position: 'absolute', top: -2, left: 2, flexDirection: 'row', gap: 1, height: 4 },
  segmentoVida: { flex: 1 },
  danio: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    fontFamily: Fuentes.titulo,
    fontSize: 18,
    color: '#ef4444',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
});
