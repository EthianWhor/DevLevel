import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { RespuestaReto, RetoPublico } from '@/api';
import { BarraProgreso } from '@/components/ui/barra-progreso';
import { BotonPrincipal } from '@/components/ui/boton-principal';
import { Tarjeta } from '@/components/ui/tarjeta';
import {
  AlturaLinea,
  AreaTactilMinima,
  Colores,
  Espacio,
  Fuentes,
  Radio,
  Tamanos,
} from '@/theme';

type Props = {
  reto: RetoPublico;
  numero: number;
  total: number;
  enviando: boolean;
  onResponder: (respuesta: RespuestaReto) => void;
};

export function Reto({ reto, numero, total, enviando, onResponder }: Props) {
  const [elegida, setElegida] = useState<number | null>(null);
  const [orden, setOrden] = useState<number[]>([]);
  const [pistaVisible, setPistaVisible] = useState(false);

  const esOrdenar = reto.tipo === 'ordenar';
  const lista = esOrdenar ? orden.length === reto.opciones.length : elegida !== null;

  function tocarPaso(indice: number) {
    setOrden((actual) =>
      actual.includes(indice) ? actual.filter((i) => i !== indice) : [...actual, indice],
    );
  }

  function enviar() {
    if (esOrdenar) onResponder(orden);
    else if (elegida !== null) onResponder(elegida);
  }

  return (
    <ScrollView contentContainerStyle={estilos.contenido}>
      <BarraProgreso total={total} actual={numero - 1} etiqueta={`Reto ${numero} de ${total}`} />
      <Text style={estilos.etiqueta}>{`Reto ${numero} de ${total}`}</Text>

      <Text accessibilityRole="header" style={estilos.enunciado}>
        {reto.enunciado}
      </Text>

      {reto.codigo ? (
        <Tarjeta>
          <Text style={estilos.codigo}>{reto.codigo}</Text>
        </Tarjeta>
      ) : null}

      {esOrdenar ? (
        <Text style={estilos.ayuda}>
          Toca los pasos en el orden correcto. Toca uno elegido para quitarlo.
        </Text>
      ) : null}

      <View style={estilos.opciones}>
        {reto.opciones.map((texto, indice) => {
          const posicion = orden.indexOf(indice);
          const seleccionada = esOrdenar ? posicion !== -1 : elegida === indice;
          const etiquetaPosicion = esOrdenar && seleccionada ? `Paso ${posicion + 1}. ` : '';

          return (
            <Pressable
              key={indice}
              onPress={() => (esOrdenar ? tocarPaso(indice) : setElegida(indice))}
              accessibilityRole={esOrdenar ? 'button' : 'radio'}
              accessibilityLabel={`${etiquetaPosicion}${texto}`}
              accessibilityState={{
                selected: seleccionada,
                checked: esOrdenar ? undefined : seleccionada,
              }}
              style={[estilos.opcion, seleccionada && estilos.opcionElegida]}
            >
              {esOrdenar ? (
                <Text style={estilos.numero}>{seleccionada ? String(posicion + 1) : '·'}</Text>
              ) : (
                <Text style={estilos.numero}>{seleccionada ? '●' : '○'}</Text>
              )}
              <Text style={estilos.textoOpcion}>{texto}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => setPistaVisible((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={pistaVisible ? 'Ocultar pista' : 'Ver pista'}
        style={estilos.botonPista}
      >
        <Text style={estilos.textoPista}>{pistaVisible ? 'Ocultar pista' : '💡 Ver pista'}</Text>
      </Pressable>
      {pistaVisible ? (
        <Tarjeta>
          <Text style={estilos.ayuda}>{reto.pista}</Text>
        </Tarjeta>
      ) : null}

      <BotonPrincipal
        titulo={enviando ? 'Revisando…' : 'Comprobar'}
        onPress={enviar}
        deshabilitado={!lista || enviando}
        pista={lista ? 'Envía tu respuesta' : 'Elige una respuesta primero'}
      />
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenido: { padding: Espacio.lg, gap: Espacio.md },
  etiqueta: {
    fontFamily: Fuentes.cuerpoNegrita,
    fontSize: Tamanos.pequeno,
    lineHeight: AlturaLinea.pequeno,
    color: Colores.textoSecundario,
  },
  enunciado: {
    fontFamily: Fuentes.titulo,
    fontSize: Tamanos.subtitulo,
    lineHeight: AlturaLinea.subtitulo,
    color: Colores.texto,
  },
  codigo: {
    fontFamily: Fuentes.codigo,
    fontSize: Tamanos.cuerpo,
    lineHeight: AlturaLinea.cuerpo,
    color: Colores.verde,
  },
  ayuda: {
    fontFamily: Fuentes.cuerpo,
    fontSize: Tamanos.pequeno,
    lineHeight: AlturaLinea.pequeno,
    color: Colores.textoSecundario,
  },
  opciones: { gap: Espacio.sm },
  opcion: {
    minHeight: AreaTactilMinima,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.md,
    padding: Espacio.md,
    backgroundColor: Colores.superficie,
    borderColor: Colores.borde,
    borderWidth: 2,
    borderRadius: Radio.md,
  },
  opcionElegida: { borderColor: Colores.oro, backgroundColor: Colores.superficieAlta },
  numero: {
    fontFamily: Fuentes.titulo,
    fontSize: Tamanos.cuerpo,
    color: Colores.oro,
    minWidth: 20,
    textAlign: 'center',
  },
  textoOpcion: {
    flex: 1,
    fontFamily: Fuentes.cuerpo,
    fontSize: Tamanos.cuerpo,
    lineHeight: AlturaLinea.cuerpo,
    color: Colores.texto,
  },
  botonPista: { minHeight: AreaTactilMinima, justifyContent: 'center' },
  textoPista: {
    fontFamily: Fuentes.cuerpoNegrita,
    fontSize: Tamanos.cuerpo,
    color: Colores.textoSecundario,
  },
});
