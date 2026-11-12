import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { authApi, esErrorApi, obtenerInventario, type ObjetoInventario } from '@/api';
import { Sprite } from '@/components/pixel/sprite';
import { ICONO_OBJETO, PALETA_HEROE, spriteHeroe } from '@/components/pixel/sprites';
import { MarcoPixel } from '@/components/retro/marco-pixel';
import { useAuth } from '@/context/auth-context';
import { OBJETOS } from '@/juego/objetos';
import type { Espacio as EspacioEquipo } from '@/juego/tipos';
import { AlturaLinea, AreaTactilMinima, Colores, Espacio, Fuentes, Tamanos } from '@/theme';

const ESPACIOS: { id: EspacioEquipo; nombre: string; vacio: string }[] = [
  { id: 'arma', nombre: 'ARMA', vacio: '⚔' },
  { id: 'armadura', nombre: 'ARMADURA', vacio: '🛡' },
  { id: 'amuleto', nombre: 'AMULETO', vacio: '✦' },
];

type Props = {
  // Si no se pasan, el panel carga el inventario por su cuenta.
  objetos?: ObjetoInventario[] | null;
};

// Equipo del héroe: la silueta del personaje con sus tres casillas (arma,
// armadura y amuleto). Al tocar una casilla aparecen los objetos que se
// tienen para ese espacio, para equipar uno o quitar el que está puesto.
export function PanelEquipo({ objetos: objetosProp }: Props) {
  const { perfil, conSesion, actualizarPerfilLocal } = useAuth();
  const [cargados, setCargados] = useState<ObjetoInventario[] | null>(null);
  const [abierto, setAbierto] = useState<EspacioEquipo | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (objetosProp !== undefined) return;
    let activo = true;
    conSesion((token) => obtenerInventario(token))
      .then((r) => activo && setCargados(r.objetos))
      .catch((e) => activo && setError(esErrorApi(e) ? e.message : 'No se pudo cargar tu inventario.'));
    return () => {
      activo = false;
    };
  }, [objetosProp, conSesion]);

  if (!perfil) return null;
  const objetos = objetosProp !== undefined ? objetosProp : cargados;
  const equipo = perfil.equipo;
  const avatar = perfil.avatar ?? 'explorador';

  async function equipar(espacio: EspacioEquipo, id: string | null) {
    if (guardando) return;
    setGuardando(true);
    setError(null);
    try {
      const r = await conSesion((token) => authApi.actualizarMe(token, { equipo: { [espacio]: id } }));
      actualizarPerfilLocal(r.perfil);
    } catch (e) {
      setError(esErrorApi(e) ? e.message : 'No se pudo cambiar el equipo.');
    } finally {
      setGuardando(false);
    }
  }

  const casilla = (espacio: (typeof ESPACIOS)[number]) => {
    const id = equipo[espacio.id];
    const objeto = id ? OBJETOS[id] : null;
    const elegida = abierto === espacio.id;
    return (
      <Pressable
        key={espacio.id}
        onPress={() => setAbierto(elegida ? null : espacio.id)}
        accessibilityRole="button"
        accessibilityLabel={`${espacio.nombre.toLowerCase()}: ${objeto ? `${objeto.nombre}${objeto.mitico ? ', mítico' : ''}` : 'vacío'}`}
        accessibilityHint="Toca para elegir qué llevar en este espacio"
        accessibilityState={{ expanded: elegida }}
        style={estilos.columnaCasilla}>
        <View
          style={[
            estilos.casilla,
            !objeto && estilos.casillaVacia,
            objeto?.mitico && estilos.casillaMitica,
            elegida && estilos.casillaElegida,
          ]}>
          <Text style={[estilos.iconoCasilla, !objeto && estilos.iconoVacio]}>
            {objeto ? ICONO_OBJETO[objeto.id] ?? '✦' : espacio.vacio}
          </Text>
        </View>
        <Text style={estilos.nombreCasilla}>{espacio.nombre}</Text>
        <Text style={estilos.objetoCasilla} numberOfLines={2}>
          {objeto ? objeto.nombre : 'Vacío · toca'}
        </Text>
      </Pressable>
    );
  };

  const delEspacio = abierto ? (objetos ?? []).filter((o) => o.espacio === abierto) : [];
  const espacioAbierto = ESPACIOS.find((e) => e.id === abierto);

  return (
    <MarcoPixel titulo="Equipo" icono="🎒">
      <Text style={estilos.ayuda}>Toca una casilla para elegir qué lleva tu héroe en la mazmorra.</Text>

      {/* Silueta del héroe con sus casillas alrededor. */}
      <View style={estilos.silueta}>
        <View style={estilos.lado}>{casilla(ESPACIOS[0])}</View>
        <View style={estilos.centro}>
          {casilla(ESPACIOS[2])}
          <View style={estilos.heroe} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            <Sprite mapa={spriteHeroe('sur', avatar).mapa} paleta={PALETA_HEROE[avatar]} tamano={96} />
          </View>
        </View>
        <View style={estilos.lado}>{casilla(ESPACIOS[1])}</View>
      </View>

      {error ? (
        <Text style={estilos.error} accessibilityRole="alert">
          ⚠ {error}
        </Text>
      ) : null}
      {!objetos && !error ? <ActivityIndicator color={Colores.oro} accessibilityLabel="Cargando inventario" /> : null}

      {/* Objetos del espacio elegido. */}
      {abierto && espacioAbierto ? (
        <View style={estilos.lista} accessibilityLiveRegion="polite">
          <Text style={estilos.tituloLista} accessibilityRole="header">
            {espacioAbierto.nombre}: ELIGE UNO
          </Text>
          {delEspacio.length === 0 ? (
            <Text style={estilos.ayuda}>
              Todavía no tienes objetos para este espacio. Cumple los objetivos con ★ de las mazmorras para ganarlos.
            </Text>
          ) : null}
          {delEspacio.map((o) => {
            const puesto = equipo[o.espacio] === o.id;
            return (
              <View key={o.id} style={[estilos.fila, o.mitico && estilos.filaMitica, puesto && estilos.filaPuesta]}>
                <Text style={estilos.iconoFila}>{ICONO_OBJETO[o.id] ?? '✦'}</Text>
                <View style={estilos.textosFila}>
                  <Text style={[estilos.nombreFila, o.mitico && { color: Colores.vidaRojo }]}>
                    {o.nombre}
                    {o.mitico ? ' · MÍTICO' : ''}
                  </Text>
                  <Text style={estilos.efecto}>{o.efecto}</Text>
                </View>
                <Pressable
                  onPress={() => void equipar(o.espacio, puesto ? null : o.id)}
                  disabled={guardando}
                  accessibilityRole="button"
                  accessibilityLabel={puesto ? `Quitar ${o.nombre}` : `Equipar ${o.nombre}`}
                  accessibilityState={{ disabled: guardando }}
                  style={[estilos.botonFila, puesto && estilos.botonQuitar]}>
                  <Text style={[estilos.textoBotonFila, puesto && { color: Colores.texto }]}>
                    {puesto ? 'QUITAR' : 'EQUIPAR'}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      ) : null}
    </MarcoPixel>
  );
}

const estilos = StyleSheet.create({
  ayuda: { fontFamily: Fuentes.cuerpo, fontSize: Tamanos.pequeno, lineHeight: AlturaLinea.pequeno, color: Colores.textoSecundario },
  silueta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Espacio.sm },
  lado: { flex: 1, alignItems: 'center' },
  centro: { alignItems: 'center', gap: Espacio.xs },
  heroe: { borderWidth: 3, borderColor: Colores.bordePixel, backgroundColor: Colores.mazmorra, padding: 4 },
  columnaCasilla: { alignItems: 'center', minWidth: AreaTactilMinima, gap: 2 },
  casilla: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colores.oro,
    borderBottomWidth: 6,
    backgroundColor: Colores.mazmorra,
  },
  casillaVacia: { borderStyle: 'dashed', borderColor: Colores.borde, borderBottomWidth: 3 },
  casillaMitica: { borderColor: Colores.vidaRojo },
  casillaElegida: { backgroundColor: Colores.bordePixel, borderColor: Colores.oroClaro },
  iconoCasilla: { fontSize: 30 },
  iconoVacio: { opacity: 0.4, color: Colores.textoSecundario },
  nombreCasilla: { fontFamily: Fuentes.codigo, fontSize: 11, letterSpacing: 1, color: Colores.oro },
  objetoCasilla: { fontFamily: Fuentes.cuerpo, fontSize: 12, lineHeight: 16, color: Colores.texto, textAlign: 'center', maxWidth: 96 },
  error: { fontFamily: Fuentes.cuerpoNegrita, fontSize: Tamanos.pequeno, color: Colores.error },
  lista: { gap: Espacio.xs, borderTopWidth: 2, borderTopColor: Colores.bordePixel, paddingTop: Espacio.sm },
  tituloLista: { fontFamily: Fuentes.codigo, fontSize: Tamanos.pequeno, letterSpacing: 1, color: Colores.oro },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.sm,
    padding: Espacio.sm,
    borderWidth: 2,
    borderColor: Colores.bordePixel,
    backgroundColor: Colores.mazmorra,
  },
  filaMitica: { borderColor: Colores.vidaRojo },
  filaPuesta: { borderColor: Colores.verde },
  iconoFila: { fontSize: 26 },
  textosFila: { flex: 1 },
  nombreFila: { fontFamily: Fuentes.cuerpoNegrita, fontSize: Tamanos.pequeno, lineHeight: AlturaLinea.pequeno, color: Colores.texto },
  efecto: { fontFamily: Fuentes.cuerpo, fontSize: 13, lineHeight: 18, color: Colores.textoSecundario },
  botonFila: {
    minHeight: AreaTactilMinima,
    minWidth: 92,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Espacio.sm,
    backgroundColor: Colores.oro,
    borderTopWidth: 2,
    borderTopColor: Colores.oroClaro,
    borderBottomWidth: 4,
    borderBottomColor: Colores.oroOscuro,
  },
  botonQuitar: { backgroundColor: Colores.superficie, borderTopColor: Colores.borde, borderBottomColor: Colores.borde, borderWidth: 2 },
  textoBotonFila: { fontFamily: Fuentes.codigo, fontSize: 13, letterSpacing: 1, color: Colores.textoSobreOro },
});
