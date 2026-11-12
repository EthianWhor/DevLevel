import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  actualizar,
  bloquesATexto,
  buscar,
  insertar,
  insertarDespues,
  mover,
  nuevoId,
  quitar,
  variablesDe,
  type Bloque,
  type Rama,
} from '@/juego/bloques';
import type { Sensor } from '@/juego/tipos';
import { AlturaLinea, AreaTactilMinima, Colores, Espacio, Fuentes, Tamanos } from '@/theme';

const SENSORES: Sensor[] = ['hay_enemigo', 'hay_muro', 'hay_pincho', 'hay_moneda', 'en_salida'];
const ACCIONES = ['adelante', 'girar_izquierda', 'girar_derecha', 'saltar', 'atacar', 'recoger'];
// Nombres que puede tener una variable en el editor de bloques.
const NOMBRES_VARIABLE = ['pasos', 'largo', 'veces'];

const ETIQUETA_PALETA: Record<string, string> = {
  adelante: 'adelante()',
  girar_izquierda: 'girar_izquierda()',
  girar_derecha: 'girar_derecha()',
  saltar: 'saltar()',
  atacar: 'atacar()',
  recoger: 'recoger()',
  repetir: 'REPETIR',
  si: 'SI',
  mientras: 'MIENTRAS',
  variable: 'pasos = 2',
};

type Seleccion = { id: string; rama?: Rama } | null;

type Fila = { clave: string; nivel: number; texto: string; id: string; rama?: Rama; esFin?: boolean };

type Props = {
  bloques: Bloque[];
  onCambiar: (bloques: Bloque[]) => void;
  instrucciones: string[];
  lineaActiva: number | null;
  lineaError: number | null;
  deshabilitado: boolean;
};

function crearBloque(id: string): Bloque | null {
  if (ACCIONES.includes(id)) return { id: nuevoId(), tipo: 'accion', accion: id };
  if (id === 'repetir') return { id: nuevoId(), tipo: 'repetir', veces: 3, cuerpo: [] };
  if (id === 'si') {
    return { id: nuevoId(), tipo: 'si', condicion: { sensor: 'hay_enemigo', negada: false }, entonces: [], sino: null };
  }
  if (id === 'mientras') {
    return { id: nuevoId(), tipo: 'mientras', condicion: { sensor: 'en_salida', negada: true }, cuerpo: [] };
  }
  // Siempre empieza como "pasos"; con el botón "nombre ⟳" se cambia a otra
  // variable. Así se puede volver a darle valor a pasos más abajo.
  if (id === 'variable') return { id: nuevoId(), tipo: 'asignar', variable: 'pasos', valor: 2 };
  return null;
}

// Editor de bloques: se agrega tocando la paleta, se selecciona una línea
// tocándola y se mueve o borra con los botones. Nada se arrastra.
export function EditorBloques({ bloques, onCambiar, instrucciones, lineaActiva, lineaError, deshabilitado }: Props) {
  const [seleccion, setSeleccion] = useState<Seleccion>(null);
  const { lineaPorId } = useMemo(() => bloquesATexto(bloques), [bloques]);
  const variables = variablesDe(bloques);

  // Filas que se ven, con su línea, su sangría y la rama SINO como fila propia.
  const filas = useMemo(() => {
    const salida: Fila[] = [];
    const recorrer = (lista: Bloque[], nivel: number) => {
      for (const b of lista) {
        switch (b.tipo) {
          case 'accion':
            salida.push({ clave: b.id, nivel, texto: `${b.accion}()`, id: b.id });
            break;
          case 'asignar':
            salida.push({ clave: b.id, nivel, texto: `${b.variable} = ${b.valor}`, id: b.id });
            break;
          case 'repetir':
            salida.push({ clave: b.id, nivel, texto: `REPETIR ${b.veces} VECES`, id: b.id, rama: 'cuerpo' });
            recorrer(b.cuerpo, nivel + 1);
            salida.push({ clave: `${b.id}-fin`, nivel, texto: 'FIN', id: b.id, esFin: true });
            break;
          case 'mientras': {
            const c = `${b.condicion.negada ? 'NO ' : ''}${b.condicion.sensor}`;
            salida.push({ clave: b.id, nivel, texto: `MIENTRAS ${c} HACER`, id: b.id, rama: 'cuerpo' });
            recorrer(b.cuerpo, nivel + 1);
            salida.push({ clave: `${b.id}-fin`, nivel, texto: 'FIN', id: b.id, esFin: true });
            break;
          }
          case 'si': {
            const c = `${b.condicion.negada ? 'NO ' : ''}${b.condicion.sensor}`;
            salida.push({ clave: b.id, nivel, texto: `SI ${c} ENTONCES`, id: b.id, rama: 'entonces' });
            recorrer(b.entonces, nivel + 1);
            if (b.sino) {
              salida.push({ clave: `${b.id}-sino`, nivel, texto: 'SINO', id: b.id, rama: 'sino' });
              recorrer(b.sino, nivel + 1);
            }
            salida.push({ clave: `${b.id}-fin`, nivel, texto: 'FIN', id: b.id, esFin: true });
            break;
          }
        }
      }
    };
    recorrer(bloques, 0);
    return salida;
  }, [bloques]);

  const seleccionado = seleccion ? buscar(bloques, seleccion.id) : null;

  function agregar(idPaleta: string) {
    const nuevo = crearBloque(idPaleta);
    if (!nuevo) return;
    let siguiente: Bloque[];
    if (!seleccion || !seleccionado) {
      siguiente = insertar(bloques, null, nuevo);
    } else if (seleccion.rama) {
      siguiente = insertar(bloques, { id: seleccion.id, rama: seleccion.rama }, nuevo);
    } else {
      siguiente = insertarDespues(bloques, seleccion.id, nuevo);
    }
    onCambiar(siguiente);
    // Las estructuras quedan seleccionadas para agregar adentro.
    setSeleccion(nuevo.tipo === 'accion' || nuevo.tipo === 'asignar' ? { id: nuevo.id } : { id: nuevo.id, rama: nuevo.tipo === 'si' ? 'entonces' : 'cuerpo' });
  }

  function cambiar(cambio: (b: Bloque) => Bloque) {
    if (!seleccion) return;
    onCambiar(actualizar(bloques, seleccion.id, cambio));
  }

  // Elegir el FIN de un bloque (seleccion sin rama sobre una estructura)
  // agrega después del bloque, afuera de él.
  const esEstructura = (b: Bloque | null) => !!b && b.tipo !== 'accion' && b.tipo !== 'asignar';
  const destino = !seleccion
    ? 'al final del hechizo'
    : seleccion.rama
      ? `dentro de la línea ${lineaPorId.get(seleccion.id) ?? '?'}`
      : esEstructura(seleccionado)
        ? `después del FIN del bloque de la línea ${lineaPorId.get(seleccion.id) ?? '?'}`
        : `después de la línea ${lineaPorId.get(seleccion.id) ?? '?'}`;

  // Opciones del REPETIR: un número fijo o cualquiera de las variables.
  function siguienteVeces(actual: number | string): number | string {
    const opciones: (number | string)[] = [3, ...variables];
    const i = typeof actual === 'number' ? 0 : opciones.indexOf(actual);
    return opciones[(i + 1) % opciones.length];
  }

  return (
    <View style={estilos.editor}>
      <View style={estilos.cabecera}>
        <Text style={estilos.archivo}>{'<> Hechizo.logica'}</Text>
        {bloques.length > 0 ? (
          <Pressable
            onPress={() => {
              onCambiar([]);
              setSeleccion(null);
            }}
            disabled={deshabilitado}
            accessibilityRole="button"
            accessibilityLabel="Borrar todo el hechizo"
            style={estilos.botonChico}>
            <Text style={estilos.textoBotonChico}>Borrar todo</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView style={estilos.codigo} nestedScrollEnabled>
        {filas.length === 0 ? (
          <Text style={estilos.vacio}>Toca una instrucción de abajo para empezar tu hechizo.</Text>
        ) : null}
        {filas.map((f) => {
          const linea = lineaPorId.get(f.id) ?? 0;
          const numero = f.esFin || f.rama === 'sino' ? '' : String(linea);
          const activa = !f.esFin && f.rama !== 'sino' && lineaActiva === linea;
          const conError = !f.esFin && f.rama !== 'sino' && lineaError === linea;
          const elegida = seleccion?.id === f.id && (f.esFin ? !seleccion.rama : seleccion.rama === f.rama);
          return (
            <Pressable
              key={f.clave}
              disabled={deshabilitado}
              onPress={() => setSeleccion(elegida ? null : f.esFin ? { id: f.id } : { id: f.id, rama: f.rama })}
              accessibilityRole="button"
              accessibilityLabel={
                f.esFin
                  ? `FIN del bloque de la línea ${linea}. Tócalo para agregar después del bloque`
                  : `${numero ? `Línea ${numero}: ` : ''}${f.texto}${conError ? '. Tiene un error' : ''}`
              }
              accessibilityState={{ selected: elegida }}
              style={[estilos.fila, elegida && estilos.filaElegida, activa && estilos.filaActiva, conError && estilos.filaError]}>
              <Text style={estilos.numero}>{numero}</Text>
              <Text style={[estilos.textoFila, { paddingLeft: f.nivel * 16 }]}>
                {conError ? '⚠ ' : ''}
                {f.texto}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {seleccionado && !deshabilitado ? (
        <View style={estilos.herramientas}>
          <Herramienta texto="↑" etiqueta="Subir línea" onPress={() => onCambiar(mover(bloques, seleccionado.id, -1))} />
          <Herramienta texto="↓" etiqueta="Bajar línea" onPress={() => onCambiar(mover(bloques, seleccionado.id, 1))} />
          <Herramienta
            texto="🗑"
            etiqueta="Borrar línea"
            onPress={() => {
              onCambiar(quitar(bloques, seleccionado.id));
              setSeleccion(null);
            }}
          />
          {seleccionado.tipo === 'repetir' && typeof seleccionado.veces === 'number' ? (
            <>
              <Herramienta texto="−" etiqueta="Repetir una vez menos" onPress={() => cambiar((b) => (b.tipo === 'repetir' && typeof b.veces === 'number' ? { ...b, veces: Math.max(1, b.veces - 1) } : b))} />
              <Herramienta texto="+" etiqueta="Repetir una vez más" onPress={() => cambiar((b) => (b.tipo === 'repetir' && typeof b.veces === 'number' ? { ...b, veces: Math.min(20, b.veces + 1) } : b))} />
            </>
          ) : null}
          {seleccionado.tipo === 'repetir' && variables.length > 0 ? (
            (() => {
              const proxima = siguienteVeces(seleccionado.veces);
              return (
                <Herramienta
                  texto={typeof proxima === 'number' ? 'usar número' : `usar ${proxima}`}
                  etiqueta={typeof proxima === 'number' ? 'Repetir un número fijo de veces' : `Repetir según la variable ${proxima}`}
                  onPress={() => cambiar((b) => (b.tipo === 'repetir' ? { ...b, veces: siguienteVeces(b.veces) } : b))}
                />
              );
            })()
          ) : null}
          {seleccionado.tipo === 'asignar' ? (
            <>
              <Herramienta texto="−" etiqueta="Restar 1" onPress={() => cambiar((b) => (b.tipo === 'asignar' ? { ...b, valor: Math.max(0, b.valor - 1) } : b))} />
              <Herramienta texto="+" etiqueta="Sumar 1" onPress={() => cambiar((b) => (b.tipo === 'asignar' ? { ...b, valor: Math.min(99, b.valor + 1) } : b))} />
              <Herramienta
                texto="nombre ⟳"
                etiqueta={`Cambiar el nombre de la variable ${seleccionado.variable}`}
                onPress={() =>
                  cambiar((b) =>
                    b.tipo === 'asignar'
                      ? { ...b, variable: NOMBRES_VARIABLE[(NOMBRES_VARIABLE.indexOf(b.variable) + 1) % NOMBRES_VARIABLE.length] }
                      : b,
                  )
                }
              />
            </>
          ) : null}
          {seleccionado.tipo === 'si' || seleccionado.tipo === 'mientras' ? (
            <>
              <Herramienta
                texto="condición ⟳"
                etiqueta="Cambiar la condición"
                onPress={() =>
                  cambiar((b) => {
                    if (b.tipo !== 'si' && b.tipo !== 'mientras') return b;
                    const i = SENSORES.indexOf(b.condicion.sensor);
                    return { ...b, condicion: { ...b.condicion, sensor: SENSORES[(i + 1) % SENSORES.length] } };
                  })
                }
              />
              <Herramienta
                texto={seleccionado.condicion.negada ? 'quitar NO' : 'poner NO'}
                etiqueta={seleccionado.condicion.negada ? 'Quitar NO de la condición' : 'Poner NO en la condición'}
                onPress={() => cambiar((b) => (b.tipo === 'si' || b.tipo === 'mientras' ? { ...b, condicion: { ...b.condicion, negada: !b.condicion.negada } } : b))}
              />
            </>
          ) : null}
          {seleccionado.tipo === 'si' && instrucciones.includes('sino') ? (
            <Herramienta
              texto={seleccionado.sino ? 'quitar SINO' : '+ SINO'}
              etiqueta={seleccionado.sino ? 'Quitar la parte SINO' : 'Agregar la parte SINO'}
              onPress={() => cambiar((b) => (b.tipo === 'si' ? { ...b, sino: b.sino ? null : [] } : b))}
            />
          ) : null}
        </View>
      ) : null}

      <Text style={estilos.destino}>Se agrega {destino}</Text>
      <View style={estilos.paleta}>
        {instrucciones
          .filter((i) => ETIQUETA_PALETA[i])
          .map((i) => (
            <Pressable
              key={i}
              onPress={() => agregar(i)}
              disabled={deshabilitado}
              accessibilityRole="button"
              accessibilityLabel={`Agregar ${ETIQUETA_PALETA[i]}`}
              accessibilityState={{ disabled: deshabilitado }}
              style={({ pressed }) => [estilos.chip, ACCIONES.includes(i) ? estilos.chipAccion : estilos.chipEstructura, pressed && { opacity: 0.7 }]}>
              <Text style={[estilos.textoChip, !ACCIONES.includes(i) && { color: Colores.oro }]}>{ETIQUETA_PALETA[i]}</Text>
            </Pressable>
          ))}
      </View>
    </View>
  );
}

function Herramienta({ texto, etiqueta, onPress }: { texto: string; etiqueta: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={etiqueta} style={estilos.herramienta}>
      <Text style={estilos.textoHerramienta}>{texto}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  editor: { gap: Espacio.sm, borderWidth: 2, borderColor: '#1e293b', backgroundColor: Colores.superficie, padding: Espacio.sm },
  cabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#1e293b', paddingBottom: Espacio.xs },
  archivo: { fontFamily: Fuentes.codigo, fontSize: Tamanos.cuerpo, lineHeight: AlturaLinea.cuerpo, color: Colores.texto },
  botonChico: { minHeight: AreaTactilMinima, justifyContent: 'center', paddingHorizontal: Espacio.sm },
  textoBotonChico: { fontFamily: Fuentes.cuerpoNegrita, fontSize: Tamanos.pequeno, color: Colores.error, textDecorationLine: 'underline' },
  codigo: { maxHeight: 220, backgroundColor: '#0f172a' },
  vacio: { fontFamily: Fuentes.cuerpo, fontSize: Tamanos.pequeno, lineHeight: AlturaLinea.pequeno, color: Colores.textoApagado, padding: Espacio.sm },
  fila: { flexDirection: 'row', alignItems: 'center', minHeight: 40, borderLeftWidth: 3, borderLeftColor: 'transparent' },
  filaElegida: { backgroundColor: '#1e293b', borderLeftColor: Colores.oro },
  filaActiva: { backgroundColor: 'rgba(77, 224, 130, 0.18)', borderLeftColor: Colores.verde },
  filaError: { backgroundColor: 'rgba(239, 68, 68, 0.18)', borderLeftColor: '#ef4444' },
  numero: { width: 28, textAlign: 'right', marginRight: Espacio.sm, fontFamily: Fuentes.codigo, fontSize: Tamanos.pequeno, color: Colores.textoApagado },
  textoFila: { flex: 1, fontFamily: Fuentes.codigo, fontSize: Tamanos.cuerpo, lineHeight: AlturaLinea.cuerpo, color: Colores.verde },
  herramientas: { flexDirection: 'row', flexWrap: 'wrap', gap: Espacio.xs },
  herramienta: { minHeight: AreaTactilMinima, minWidth: AreaTactilMinima, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Espacio.sm, borderWidth: 2, borderColor: Colores.borde, backgroundColor: Colores.superficieAlta },
  textoHerramienta: { fontFamily: Fuentes.cuerpoNegrita, fontSize: Tamanos.cuerpo, color: Colores.texto },
  destino: { fontFamily: Fuentes.cuerpo, fontSize: Tamanos.pequeno, lineHeight: AlturaLinea.pequeno, color: Colores.textoSecundario },
  paleta: { flexDirection: 'row', flexWrap: 'wrap', gap: Espacio.xs },
  chip: { minHeight: AreaTactilMinima, justifyContent: 'center', paddingHorizontal: Espacio.sm, borderWidth: 2, borderBottomWidth: 4 },
  chipAccion: { backgroundColor: '#0f172a', borderColor: '#1e293b', borderBottomColor: '#3b82f6' },
  chipEstructura: { backgroundColor: '#0f172a', borderColor: '#1e293b', borderBottomColor: Colores.oro },
  textoChip: { fontFamily: Fuentes.codigo, fontSize: Tamanos.pequeno, color: Colores.texto },
});
