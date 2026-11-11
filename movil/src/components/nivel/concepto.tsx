import { ScrollView, StyleSheet, Text } from 'react-native';

import type { RespuestaNivel } from '@/api';
import { BotonPrincipal } from '@/components/ui/boton-principal';
import { Tarjeta } from '@/components/ui/tarjeta';
import { Colores, Espacio, Fuentes, Tamanos, AlturaLinea } from '@/theme';

type Props = {
  nivel: RespuestaNivel['nivel'];
  // Texto de lo que viene después del concepto y del botón para empezar.
  resumen: string;
  textoBoton: string;
  onEmpezar: () => void;
};

export function Concepto({ nivel, resumen, textoBoton, onEmpezar }: Props) {
  return (
    <ScrollView contentContainerStyle={estilos.contenido}>
      <Text style={estilos.etiqueta}>{`Nivel ${nivel.orden}`}</Text>
      <Text accessibilityRole="header" style={estilos.titulo}>
        {nivel.titulo}
      </Text>

      <Tarjeta>
        <Text accessibilityRole="header" style={estilos.subtitulo}>
          {nivel.conceptoTitulo}
        </Text>
        <Text style={estilos.texto}>{nivel.conceptoTexto}</Text>
      </Tarjeta>

      {nivel.conceptoEjemplo ? (
        <Tarjeta>
          <Text style={estilos.etiqueta}>Ejemplo</Text>
          <Text style={estilos.codigo} accessibilityLabel={`Ejemplo: ${nivel.conceptoEjemplo}`}>
            {nivel.conceptoEjemplo}
          </Text>
        </Tarjeta>
      ) : null}

      <Text style={estilos.texto}>
        {resumen}
      </Text>

      <BotonPrincipal
        titulo={textoBoton}
        onPress={onEmpezar}
        pista="Empieza el reto de este nivel"
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
  titulo: {
    fontFamily: Fuentes.titulo,
    fontSize: Tamanos.titulo,
    lineHeight: AlturaLinea.titulo,
    color: Colores.oro,
  },
  subtitulo: {
    fontFamily: Fuentes.titulo,
    fontSize: Tamanos.subtitulo,
    lineHeight: AlturaLinea.subtitulo,
    color: Colores.texto,
    marginBottom: Espacio.sm,
  },
  texto: {
    fontFamily: Fuentes.cuerpo,
    fontSize: Tamanos.cuerpo,
    lineHeight: AlturaLinea.cuerpo,
    color: Colores.texto,
  },
  codigo: {
    fontFamily: Fuentes.codigo,
    fontSize: Tamanos.cuerpo,
    lineHeight: AlturaLinea.cuerpo,
    color: Colores.verde,
  },
});