import { useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import {
  AccessibilityInfo,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  Vibration,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import {
  esErrorApi,
  obtenerPistaAvanzada,
  responderMazmorra,
  type RetoMazmorra,
  type ResultadoMazmorra,
} from '@/api';
import { EditorBloques } from '@/components/mazmorra/editor-bloques';
import { EditorTexto } from '@/components/mazmorra/editor-texto';
import { Escenario, describirMazmorra, estadoInicial, type EstadoEscena } from '@/components/mazmorra/escenario';
import { Hud } from '@/components/mazmorra/hud';
import { Objetivos } from '@/components/mazmorra/objetivos';
import { PanelEquipo } from '@/components/heroe/panel-equipo';
import { BotonPrincipal } from '@/components/ui/boton-principal';
import { useAuth } from '@/context/auth-context';
import { usePreferencias } from '@/context/preferencias-context';
import { useReducirMovimiento } from '@/hooks/use-reducir-movimiento';
import { bloquesATexto, type Bloque } from '@/juego/bloques';
import { EQUIPO_VACIO, estadisticas } from '@/juego/objetos';
import { caminoMasCorto, ejecutarTexto, leerMapa } from '@/juego/simulador';
import type { Paso } from '@/juego/tipos';
import { AlturaLinea, AreaTactilMinima, Colores, Espacio, Fuentes, Tamanos } from '@/theme';

const MS_POR_PASO = 320;

type Props = {
  reto: RetoMazmorra;
  onTerminar: () => Promise<void>;
  terminando: boolean;
};

export function PantallaMazmorra({ reto, onTerminar, terminando }: Props) {
  const mazmorra = reto.opciones;
  const { perfil, conSesion } = useAuth();
  const { preferencias } = usePreferencias();
  const reducirMovimiento = useReducirMovimiento() ?? false;
  const { width } = useWindowDimensions();

  const equipo = perfil?.equipo ?? EQUIPO_VACIO;
  const stats = useMemo(() => estadisticas(equipo), [equipo]);
  const energiaInicial = (mazmorra.energia + stats.energiaExtra) * stats.multEnergia;
  const monedasTotales = useMemo(() => leerMapa(mazmorra).monedas.length, [mazmorra]);
  const inicial = useMemo<EstadoEscena>(
    () => ({ ...estadoInicial(mazmorra), vida: stats.vidaMax }),
    [mazmorra, stats.vidaMax],
  );

  // El código: bloques en las primeras unidades, texto en las últimas.
  // En modo mixto se empieza con bloques y se puede pasar a escribir.
  const [usaTexto, setUsaTexto] = useState(mazmorra.modo === 'texto');
  const [bloques, setBloques] = useState<Bloque[]>([]);
  const [texto, setTexto] = useState('');
  const programa = usaTexto ? texto : bloquesATexto(bloques).texto;

  const [estado, setEstado] = useState<EstadoEscena>(inicial);
  const [hud, setHud] = useState({ vida: stats.vidaMax, energia: energiaInicial, monedas: 0 });
  const [lineaActiva, setLineaActiva] = useState<number | null>(null);
  const [danio, setDanio] = useState<{ valor: number; clave: number } | null>(null);
  const [corriendo, setCorriendo] = useState(false);
  const [resultado, setResultado] = useState<ResultadoMazmorra | null>(null);
  const [errorRed, setErrorRed] = useState<string | null>(null);
  const [verPista, setVerPista] = useState(false);
  const [pistaAvanzada, setPistaAvanzada] = useState<string | null>(null);
  const [verDescripcion, setVerDescripcion] = useState(false);
  const [verEquipo, setVerEquipo] = useState(false);
  const temporizadores = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Posiciones en la pantalla para llevar al jugador al escenario al ejecutar
  // y al panel de resultado al terminar.
  const scroll = useRef<ComponentRef<typeof KeyboardAwareScrollView>>(null);
  const yEscena = useRef(0);
  const yResultado = useRef(0);
  // Se activa al recibir el resultado: el panel baja cuando ya midió su posición.
  const irAlResultado = useRef(false);
  const irA = (y: number) => scroll.current?.scrollTo({ y: Math.max(0, y - 8), animated: !reducirMovimiento });

  useEffect(() => () => temporizadores.current.forEach(clearTimeout), []);

  // Si cambia el equipo (más vida o energía), la mazmorra vuelve al inicio
  // con las estadísticas nuevas.
  useEffect(() => {
    setEstado(inicial);
    setHud({ vida: stats.vidaMax, energia: energiaInicial, monedas: 0 });
    setResultado(null);
  }, [inicial, stats.vidaMax, energiaInicial]);

  const tieneLupa = equipo.amuleto === 'lupa_explorador';
  const camino = useMemo(() => (tieneLupa ? caminoMasCorto(mazmorra) : undefined), [tieneLupa, mazmorra]);
  const tienePistaAvanzada = equipo.amuleto === 'pergamino_sabio' || equipo.amuleto === 'ojo_odin';

  function reiniciar() {
    temporizadores.current.forEach(clearTimeout);
    temporizadores.current = [];
    setEstado(inicial);
    setHud({ vida: stats.vidaMax, energia: energiaInicial, monedas: 0 });
    setLineaActiva(null);
    setResultado(null);
    setErrorRed(null);
    setCorriendo(false);
  }

  function mostrarPaso(p: Paso) {
    setEstado({ fila: p.fila, col: p.col, dir: p.dir, vida: p.vida, enemigos: p.enemigos, monedasEnMapa: p.monedasEnMapa });
    setHud({ vida: p.vida, energia: p.energia, monedas: p.monedas });
    setLineaActiva(p.linea);
    if ((p.tipo === 'golpeRecibido' || p.tipo === 'pincho') && (p.danio ?? 0) > 0) {
      setDanio({ valor: p.danio ?? 0, clave: Date.now() });
      if (preferencias.vibracion) Vibration.vibrate(60);
      AccessibilityInfo.announceForAccessibility(`Recibiste ${p.danio} de daño. Te quedan ${p.vida} de vida`);
    }
    if (p.tipo === 'moneda') AccessibilityInfo.announceForAccessibility('Moneda recogida');
    if (p.tipo === 'enemigoDerrotado') AccessibilityInfo.announceForAccessibility('Enemigo derrotado');
  }

  async function ejecutar() {
    if (corriendo) return; // un solo envío aunque se toque dos veces
    reiniciar();
    setCorriendo(true);
    // Se cierra el teclado y se sube al escenario para ver al héroe moverse.
    Keyboard.dismiss();
    temporizadores.current.push(setTimeout(() => irA(yEscena.current), 60));

    const local = ejecutarTexto(mazmorra, programa, equipo);
    const pasos = local.resultado?.pasos ?? [];

    // El backend decide el resultado; mientras responde, la app anima.
    const respuesta = conSesion((token) => responderMazmorra(reto.id, programa, token));

    const animacion = new Promise<void>((resolver) => {
      if (reducirMovimiento || pasos.length === 0) {
        if (pasos.length > 0) mostrarPaso(pasos[pasos.length - 1]);
        resolver();
        return;
      }
      pasos.forEach((p, i) => {
        temporizadores.current.push(setTimeout(() => mostrarPaso(p), i * MS_POR_PASO));
      });
      temporizadores.current.push(setTimeout(resolver, pasos.length * MS_POR_PASO + 150));
    });

    try {
      const [final] = await Promise.all([respuesta, animacion]);
      setResultado(final);
      setLineaActiva(null);
      // Al terminar, se baja al panel de resultado (cuando ya se dibujó).
      irAlResultado.current = true;
      AccessibilityInfo.announceForAccessibility(
        final.correcta ? '¡Saliste de la mazmorra!' : `No lo lograste. ${final.error?.mensaje ?? final.motivo ?? ''}`,
      );
    } catch (e) {
      setErrorRed(esErrorApi(e) ? e.message : 'No se pudo revisar tu hechizo. Intenta de nuevo.');
    } finally {
      setCorriendo(false);
    }
  }

  async function pedirPistaAvanzada() {
    try {
      const pista = await conSesion((token) => obtenerPistaAvanzada(reto.id, token));
      setPistaAvanzada(pista.lineas);
    } catch (e) {
      setPistaAvanzada(esErrorApi(e) ? e.message : 'No se pudo cargar la pista.');
    }
  }

  const anchoEscena = Math.min(width - Espacio.md * 2 - 8, 420);
  const lineaError = resultado?.error?.linea ?? null;
  const estrellas = resultado?.correcta ? 1 + resultado.objetivosCumplidos.filter(Boolean).length : 0;

  return (
    <KeyboardAwareScrollView
      ref={scroll}
      contentContainerStyle={estilos.contenido}
      keyboardShouldPersistTaps="handled"
      bottomOffset={24}>
      <View style={estilos.barra}>
        <Text style={estilos.nombre} accessibilityRole="header" numberOfLines={2}>
          Mazmorra: {mazmorra.nombre}
        </Text>
      </View>
      <Text style={estilos.historia}>{mazmorra.historia}</Text>

      <View
        style={estilos.escena}
        onLayout={(e) => {
          yEscena.current = e.nativeEvent.layout.y;
        }}>
      <Hud
        vida={hud.vida}
        vidaMax={stats.vidaMax}
        energia={hud.energia}
        monedas={hud.monedas}
        monedasTotales={monedasTotales}
        ataque={stats.ataque}
      />
      <Escenario
        mazmorra={mazmorra}
        estado={estado}
        avatar={perfil?.avatar ?? 'explorador'}
        ancho={anchoEscena}
        reducirMovimiento={reducirMovimiento}
        camino={camino}
        danio={danio}
      />
      </View>

      <View style={estilos.filaBotones}>
        <BotonChico texto="📋 Describir" etiqueta="Describir la mazmorra en texto" onPress={() => setVerDescripcion((v) => !v)} />
        <BotonChico texto="💡 Pista" etiqueta={verPista ? 'Ocultar pista' : 'Ver pista'} onPress={() => setVerPista((v) => !v)} />
        {tienePistaAvanzada ? (
          <BotonChico texto="🔮 Pista avanzada" etiqueta="Ver la pista avanzada" onPress={pedirPistaAvanzada} />
        ) : null}
        <BotonChico texto="🎒 Equipo" etiqueta="Ver y cambiar tu equipo" onPress={() => setVerEquipo((v) => !v)} />
      </View>

      {verDescripcion ? (
        <View style={estilos.caja} accessible>
          {describirMazmorra(mazmorra, estado).map((l) => (
            <Text key={l} style={estilos.textoCaja}>
              • {l}
            </Text>
          ))}
        </View>
      ) : null}
      {verPista ? (
        <View style={estilos.caja}>
          <Text style={estilos.textoCaja}>💡 {mazmorra.pista}</Text>
        </View>
      ) : null}
      {pistaAvanzada ? (
        <View style={estilos.caja}>
          <Text style={estilos.etiquetaCaja}>🔮 PISTA AVANZADA</Text>
          <Text style={estilos.codigoCaja}>{pistaAvanzada}</Text>
        </View>
      ) : null}
      {verEquipo ? (
        <PanelEquipo />
      ) : null}

      <Objetivos objetivos={mazmorra.objetivosExtra} gano={resultado?.correcta ?? null} cumplidos={resultado?.objetivosCumplidos ?? null} />

      {usaTexto ? (
        <EditorTexto
          texto={texto}
          onCambiar={setTexto}
          instrucciones={mazmorra.instrucciones}
          lineaActiva={lineaActiva}
          error={resultado?.error ?? null}
          deshabilitado={corriendo}
        />
      ) : (
        <EditorBloques
          bloques={bloques}
          onCambiar={setBloques}
          instrucciones={mazmorra.instrucciones}
          lineaActiva={lineaActiva}
          lineaError={lineaError}
          deshabilitado={corriendo}
        />
      )}

      {mazmorra.modo === 'mixto' && !usaTexto ? (
        <Pressable
          onPress={() => {
            setTexto(bloquesATexto(bloques).texto);
            setUsaTexto(true);
          }}
          accessibilityRole="button"
          accessibilityHint="Pasa tu hechizo al editor de texto para escribirlo tú"
          style={estilos.enlace}>
          <Text style={estilos.textoEnlace}>✎ Escribirlo yo</Text>
        </Pressable>
      ) : null}

      {errorRed ? (
        <View style={[estilos.panel, estilos.panelDerrota]} accessibilityRole="alert">
          <Text style={estilos.tituloDerrota}>⚠ {errorRed}</Text>
        </View>
      ) : null}

      {resultado ? (
        <View
          style={[estilos.panel, resultado.correcta ? estilos.panelVictoria : estilos.panelDerrota]}
          accessibilityLiveRegion="polite"
          onLayout={(e) => {
            yResultado.current = e.nativeEvent.layout.y;
            if (irAlResultado.current) {
              irAlResultado.current = false;
              irA(yResultado.current);
            }
          }}>
          {resultado.correcta ? (
            <>
              <Text style={estilos.tituloVictoria}>✔ ¡Saliste de la mazmorra!</Text>
              <Text style={estilos.texto} accessibilityLabel={`${estrellas} de 3 estrellas`}>
                {'★'.repeat(estrellas)}
                {'☆'.repeat(3 - estrellas)} · {estrellas} de 3 estrellas
              </Text>
              {estrellas < 3 ? (
                <Text style={estilos.texto}>Cumple los objetivos con ★ para ganar más estrellas y el objeto de la mazmorra.</Text>
              ) : null}
              <BotonPrincipal
                titulo={terminando ? 'Guardando…' : '🏁 Terminar nivel'}
                onPress={() => void onTerminar()}
                deshabilitado={terminando}
                pista="Guarda tu resultado y muestra tus recompensas"
              />
              <Pressable onPress={reiniciar} accessibilityRole="button" style={estilos.enlace}>
                <Text style={estilos.textoEnlace}>⟲ Intentar otra vez para más estrellas</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={estilos.tituloDerrota}>✖ {resultado.error ? 'Tu hechizo tiene un error' : 'No lo lograste'}</Text>
              <Text style={estilos.texto}>{resultado.error?.mensaje ?? resultado.motivo}</Text>
            </>
          )}
        </View>
      ) : null}

      <View style={estilos.acciones}>
        <View style={estilos.flex}>
          <BotonPrincipal
            titulo={corriendo ? 'Ejecutando…' : '▶ EJECUTAR HECHIZO'}
            onPress={() => void ejecutar()}
            deshabilitado={corriendo || programa.trim() === ''}
            pista="Ejecuta tu programa en la mazmorra"
          />
        </View>
        <Pressable
          onPress={reiniciar}
          disabled={corriendo}
          accessibilityRole="button"
          accessibilityLabel="Reiniciar la mazmorra"
          style={estilos.reiniciar}>
          <Text style={estilos.textoReiniciar}>⟲</Text>
        </Pressable>
      </View>
    </KeyboardAwareScrollView>
  );
}

function BotonChico({ texto, etiqueta, onPress }: { texto: string; etiqueta: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={etiqueta} style={estilos.botonChico}>
      <Text style={estilos.textoBotonChico}>{texto}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  contenido: { padding: Espacio.md, gap: Espacio.sm, paddingBottom: Espacio.xl * 2 },
  escena: { gap: Espacio.sm },
  flex: { flex: 1 },
  barra: { borderWidth: 2, borderColor: '#1e293b', backgroundColor: Colores.superficie, padding: Espacio.sm },
  nombre: { fontFamily: Fuentes.codigo, fontSize: Tamanos.cuerpo, lineHeight: AlturaLinea.cuerpo, color: Colores.texto },
  historia: { fontFamily: Fuentes.cuerpo, fontSize: Tamanos.pequeno, lineHeight: AlturaLinea.pequeno, color: Colores.textoSecundario },
  filaBotones: { flexDirection: 'row', flexWrap: 'wrap', gap: Espacio.xs, justifyContent: 'center' },
  botonChico: {
    minHeight: AreaTactilMinima,
    justifyContent: 'center',
    paddingHorizontal: Espacio.sm,
    borderWidth: 2,
    borderColor: '#1e293b',
    backgroundColor: Colores.superficie,
  },
  textoBotonChico: { fontFamily: Fuentes.cuerpoNegrita, fontSize: Tamanos.pequeno, color: Colores.texto },
  caja: { gap: 4, padding: Espacio.sm, borderWidth: 2, borderColor: '#3b82f6', backgroundColor: Colores.superficie },
  etiquetaCaja: { fontFamily: Fuentes.codigo, fontSize: Tamanos.pequeno, color: '#93c5fd' },
  textoCaja: { fontFamily: Fuentes.cuerpo, fontSize: Tamanos.pequeno, lineHeight: AlturaLinea.pequeno, color: Colores.texto },
  codigoCaja: { fontFamily: Fuentes.codigo, fontSize: Tamanos.pequeno, lineHeight: AlturaLinea.pequeno, color: Colores.verde },
  enlace: { minHeight: AreaTactilMinima, alignItems: 'center', justifyContent: 'center' },
  textoEnlace: { fontFamily: Fuentes.cuerpoNegrita, fontSize: Tamanos.cuerpo, color: Colores.oro, textDecorationLine: 'underline' },
  panel: { gap: Espacio.sm, padding: Espacio.md, borderWidth: 3, backgroundColor: Colores.superficie },
  panelVictoria: { borderColor: Colores.verde },
  panelDerrota: { borderColor: '#ef4444' },
  tituloVictoria: { fontFamily: Fuentes.titulo, fontSize: Tamanos.subtitulo, lineHeight: AlturaLinea.subtitulo, color: Colores.verde },
  tituloDerrota: { fontFamily: Fuentes.titulo, fontSize: Tamanos.subtitulo, lineHeight: AlturaLinea.subtitulo, color: Colores.error },
  texto: { fontFamily: Fuentes.cuerpo, fontSize: Tamanos.cuerpo, lineHeight: AlturaLinea.cuerpo, color: Colores.texto },
  acciones: { flexDirection: 'row', gap: Espacio.sm, alignItems: 'stretch' },
  reiniciar: {
    minHeight: AreaTactilMinima,
    minWidth: AreaTactilMinima + 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colores.borde,
    backgroundColor: Colores.superficieAlta,
  },
  textoReiniciar: { fontSize: Tamanos.subtitulo, color: Colores.texto },
});
