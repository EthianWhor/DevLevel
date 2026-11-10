import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, Vibration } from 'react-native';

import { BotonPrincipal } from '@/components/ui/boton-principal';
import { Tarjeta } from '@/components/ui/tarjeta';
import { AlturaLinea, Colores, Espacio, Fuentes, Tamanos } from '@/theme';

type Props = {
  correcta: boolean;
  explicacion: string;
  esUltimo: boolean;
  onContinuar: () => void;
  onReintentar: () => void;
};

export function Resultado({ correcta, explicacion, esUltimo, onContinuar, onReintentar }: Props) {
  useEffect(() => {
    Vibration.vibrate(correcta ? 80 : [0, 120, 80, 120]);
  }, [correcta]);

  const titulo = correcta ? '✔ ¡Correcto!' : '✖ Casi, intenta otra vez';

  return (
    <ScrollView contentContainerStyle={estilos.contenido}>
      <Text
        accessibilityRole="header"
        accessibilityLiveRegion="polite"
        style={[estilos.titulo, { color: correcta ? Colores.verde : Colores.error }]}
      >
        {titulo}
      </Text>

      <Tarjeta>
        <Text style={estilos.etiqueta}>Explicación</Text>
        <Text style={estilos.texto}>{explicacion}</Text>
      </Tarjeta>

      {correcta ? (
        <BotonPrincipal
          titulo={esUltimo ? 'Terminar nivel' : 'Continuar'}
          onPress={onContinuar}
          pista={esUltimo ? 'Termina el nivel' : 'Pasa al siguiente reto'}
        />
      ) : (
        <BotonPrincipal
          titulo="Intentar de nuevo"
          onPress={onReintentar}
          pista="Vuelve al mismo reto"
        />
      )}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenido: { padding: Espacio.lg, gap: Espacio.md },
  titulo: {
    fontFamily: Fuentes.titulo,
    fontSize: Tamanos.titulo,
    lineHeight: AlturaLinea.titulo,
  },
  etiqueta: {
    fontFamily: Fuentes.cuerpoNegrita,
    fontSize: Tamanos.pequeno,
    lineHeight: AlturaLinea.pequeno,
    color: Colores.textoSecundario,
    marginBottom: Espacio.sm,
  },
  texto: {
    fontFamily: Fuentes.cuerpo,
    fontSize: Tamanos.cuerpo,
    lineHeight: AlturaLinea.cuerpo,
    color: Colores.texto,
  },
});
