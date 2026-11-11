import { useRef, useState, type ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import type { ErrorLectura } from '@/juego/tipos';
import { AlturaLinea, AreaTactilMinima, Colores, Espacio, Fuentes, Tamanos } from '@/theme';

// Lo que inserta cada atajo de la barra (según las instrucciones de la mazmorra).
const ATAJOS: Record<string, { texto: string; etiqueta: string }> = {
  adelante: { texto: 'adelante()', etiqueta: 'adelante()' },
  girar_izquierda: { texto: 'girar_izquierda()', etiqueta: 'girar_izq()' },
  girar_derecha: { texto: 'girar_derecha()', etiqueta: 'girar_der()' },
  saltar: { texto: 'saltar()', etiqueta: 'saltar()' },
  atacar: { texto: 'atacar()', etiqueta: 'atacar()' },
  recoger: { texto: 'recoger()', etiqueta: 'recoger()' },
  repetir: { texto: 'REPETIR 3 VECES\n  \nFIN', etiqueta: 'REPETIR' },
  mientras: { texto: 'MIENTRAS NO hay_muro HACER\n  \nFIN', etiqueta: 'MIENTRAS' },
  si: { texto: 'SI hay_enemigo ENTONCES\n  \nFIN', etiqueta: 'SI' },
  sino: { texto: 'SINO', etiqueta: 'SINO' },
  funcion: { texto: 'FUNCION mi_funcion()\n  \nFIN', etiqueta: 'FUNCION' },
  variable: { texto: 'pasos = 3', etiqueta: 'variable' },
};
const CONDICIONES = ['hay_enemigo', 'hay_muro', 'hay_pincho', 'hay_moneda', 'en_salida', 'NO', 'FIN'];

type Props = {
  texto: string;
  onCambiar: (texto: string) => void;
  instrucciones: string[];
  lineaActiva: number | null;
  error: ErrorLectura | null;
  deshabilitado: boolean;
};

// Editor para escribir el hechizo a mano (unidades 4 y 5, y "Escribirlo yo").
// La barra de atajos inserta palabras en donde está el cursor, para no tener
// que escribir todo con el teclado del celular.
export function EditorTexto({ texto, onCambiar, instrucciones, lineaActiva, error, deshabilitado }: Props) {
  const ref = useRef<ComponentRef<typeof TextInput>>(null);
  const [seleccion, setSeleccion] = useState({ start: texto.length, end: texto.length });

  function insertar(fragmento: string) {
    const antes = texto.slice(0, seleccion.start);
    const despues = texto.slice(seleccion.end);
    // Cada atajo va en su propia línea, con la sangría de la línea actual.
    const inicioLinea = antes.lastIndexOf('\n') + 1;
    const lineaActual = antes.slice(inicioLinea);
    const sangria = /^\s*/.exec(lineaActual)?.[0] ?? '';
    const esPalabra = !fragmento.includes('(') && !fragmento.includes('\n') && !fragmento.includes('=');
    const prefijo = esPalabra || lineaActual.trim() === '' ? '' : `\n${sangria}`;
    const cuerpo = fragmento.replace(/\n/g, `\n${sangria}`);
    const separador = esPalabra ? ' ' : '';
    const nuevo = `${antes}${prefijo}${cuerpo}${separador}${despues}`;
    // El cursor queda dentro del bloque (en la línea vacía) o al final.
    const vacia = cuerpo.indexOf(`\n${sangria}  \n`);
    const posicion =
      vacia >= 0
        ? antes.length + prefijo.length + vacia + sangria.length + 3
        : antes.length + prefijo.length + cuerpo.length + separador.length;
    onCambiar(nuevo);
    setSeleccion({ start: posicion, end: posicion });
    ref.current?.focus();
  }

  const lineas = texto.split('\n');
  const atajos = [...instrucciones.filter((i) => ATAJOS[i]).map((i) => ATAJOS[i]), ...CONDICIONES.map((c) => ({ texto: c, etiqueta: c }))];

  return (
    <View style={estilos.editor}>
      <Text style={estilos.archivo}>{'<> Hechizo.logica'}</Text>

      <ScrollView
        horizontal
        keyboardShouldPersistTaps="always"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={estilos.atajos}
        accessibilityLabel="Atajos para escribir">
        {atajos.map((a) => (
          <Pressable
            key={a.etiqueta}
            onPress={() => insertar(a.texto)}
            disabled={deshabilitado}
            accessibilityRole="button"
            accessibilityLabel={`Escribir ${a.etiqueta}`}
            style={estilos.atajo}>
            <Text style={estilos.textoAtajo}>{a.etiqueta}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={estilos.area}>
        <View style={estilos.numeros} importantForAccessibility="no-hide-descendants">
          {lineas.map((_, i) => (
            <Text
              key={i}
              style={[
                estilos.numero,
                lineaActiva === i + 1 && estilos.numeroActivo,
                error?.linea === i + 1 && estilos.numeroError,
              ]}>
              {error?.linea === i + 1 ? '⚠' : i + 1}
            </Text>
          ))}
        </View>
        <TextInput
          ref={ref}
          value={texto}
          onChangeText={onCambiar}
          selection={seleccion}
          onSelectionChange={(e) => setSeleccion(e.nativeEvent.selection)}
          editable={!deshabilitado}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          textAlignVertical="top"
          placeholder={'adelante()\nREPETIR 3 VECES\n  adelante()\nFIN'}
          placeholderTextColor={Colores.textoApagado}
          accessibilityLabel="Escribe tu hechizo, una instrucción por línea"
          style={estilos.entrada}
        />
      </View>

      {lineaActiva ? <Text style={estilos.estado}>▶ Ejecutando la línea {lineaActiva}</Text> : null}
      {error ? (
        <View style={estilos.error} accessibilityRole="alert">
          <Text style={estilos.textoError}>⚠ {error.mensaje}</Text>
        </View>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  editor: { gap: Espacio.sm, borderWidth: 2, borderColor: '#1e293b', backgroundColor: Colores.superficie, padding: Espacio.sm },
  archivo: { fontFamily: Fuentes.codigo, fontSize: Tamanos.cuerpo, lineHeight: AlturaLinea.cuerpo, color: Colores.texto },
  atajos: { gap: Espacio.xs },
  atajo: {
    minHeight: AreaTactilMinima,
    justifyContent: 'center',
    paddingHorizontal: Espacio.sm,
    backgroundColor: '#0f172a',
    borderWidth: 2,
    borderColor: '#1e293b',
    borderBottomWidth: 4,
    borderBottomColor: Colores.oro,
  },
  textoAtajo: { fontFamily: Fuentes.codigo, fontSize: Tamanos.pequeno, color: Colores.texto },
  area: { flexDirection: 'row', backgroundColor: '#0f172a', minHeight: 180 },
  numeros: { paddingTop: Espacio.sm, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: '#1e293b' },
  numero: { fontFamily: Fuentes.codigo, fontSize: Tamanos.cuerpo, lineHeight: AlturaLinea.cuerpo, color: Colores.textoApagado, textAlign: 'right', minWidth: 20 },
  numeroActivo: { color: Colores.verde },
  numeroError: { color: '#ef4444' },
  entrada: {
    flex: 1,
    minWidth: 0,
    padding: Espacio.sm,
    fontFamily: Fuentes.codigo,
    fontSize: Tamanos.cuerpo,
    lineHeight: AlturaLinea.cuerpo,
    color: Colores.verde,
  },
  estado: { fontFamily: Fuentes.codigo, fontSize: Tamanos.pequeno, color: Colores.verde },
  error: { padding: Espacio.sm, borderWidth: 2, borderColor: '#ef4444' },
  textoError: { fontFamily: Fuentes.cuerpoNegrita, fontSize: Tamanos.pequeno, lineHeight: AlturaLinea.pequeno, color: Colores.error },
});
