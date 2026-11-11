import { forwardRef, useState, type ComponentRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { AlturaLinea, AreaTactilMinima, Colores, Espacio, Fuentes, Radio, Tamanos } from '@/theme';

type Props = Omit<TextInputProps, 'style'> & {
  etiqueta: string;
  icono: string;
  error?: string | null;
  ayuda?: string; // texto de apoyo debajo del campo cuando no hay error
  esContrasena?: boolean;
};

// Campo de formulario accesible:
// - etiqueta visible arriba (no solo placeholder)
// - ícono a la izquierda
// - error debajo con ícono ⚠ + texto, borde rojo y aviso a TalkBack
// - en contraseñas, botón "Mostrar / Ocultar" con texto
export const CampoTexto = forwardRef<ComponentRef<typeof TextInput>, Props>(function CampoTexto(
  { etiqueta, icono, error, ayuda, esContrasena = false, ...props },
  ref,
) {
  const [visible, setVisible] = useState(false);
  const [enfocado, setEnfocado] = useState(false);
  const conError = Boolean(error);

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      <View
        style={[
          estilos.caja,
          enfocado && estilos.cajaEnfocada,
          conError && estilos.cajaError,
        ]}>
        <Text style={estilos.icono} importantForAccessibility="no" accessibilityElementsHidden>
          {icono}
        </Text>
        <TextInput
          ref={ref}
          {...props}
          secureTextEntry={esContrasena && !visible}
          style={estilos.entrada}
          placeholderTextColor={Colores.textoApagado}
          accessibilityLabel={conError ? `${etiqueta}. Error: ${error}` : etiqueta}
          accessibilityHint={!conError ? ayuda : undefined}
          onFocus={(e) => {
            setEnfocado(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setEnfocado(false);
            props.onBlur?.(e);
          }}
        />
        {esContrasena ? (
          <Pressable
            onPress={() => setVisible((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            hitSlop={8}
            style={estilos.mostrar}>
            <Text style={estilos.textoMostrar}>{visible ? 'Ocultar' : 'Mostrar'}</Text>
          </Pressable>
        ) : null}
      </View>

      {conError ? (
        <View style={estilos.filaError} accessibilityRole="alert" accessibilityLiveRegion="polite">
          <Text style={estilos.textoError} importantForAccessibility="no" accessibilityElementsHidden>
            ⚠
          </Text>
          <Text style={estilos.textoError}>{error}</Text>
        </View>
      ) : ayuda ? (
        <Text style={estilos.ayuda}>{ayuda}</Text>
      ) : null}
    </View>
  );
});

const estilos = StyleSheet.create({
  contenedor: { gap: Espacio.xs },
  etiqueta: {
    fontFamily: Fuentes.cuerpoNegrita,
    fontSize: Tamanos.cuerpo,
    lineHeight: AlturaLinea.cuerpo,
    color: Colores.texto,
  },
  caja: {
    minHeight: AreaTactilMinima + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.sm,
    paddingHorizontal: Espacio.md,
    backgroundColor: '#0f172a',
    borderWidth: 2,
    borderColor: '#1e293b',
    borderRadius: Radio.sm,
  },
  cajaEnfocada: { borderColor: Colores.oro },
  cajaError: { borderColor: Colores.error },
  icono: { fontSize: Tamanos.subtitulo, lineHeight: AlturaLinea.subtitulo, color: Colores.textoSecundario },
  entrada: {
    flex: 1,
    minWidth: 0, // deja que el campo se encoja y quepa el botón Mostrar
    minHeight: AreaTactilMinima,
    fontFamily: Fuentes.codigo,
    fontSize: Tamanos.cuerpo,
    color: Colores.texto,
  },
  mostrar: { minHeight: AreaTactilMinima, justifyContent: 'center', paddingLeft: Espacio.xs },
  textoMostrar: {
    fontFamily: Fuentes.cuerpoNegrita,
    fontSize: Tamanos.pequeno,
    lineHeight: AlturaLinea.pequeno,
    color: '#93c5fd',
    textDecorationLine: 'underline',
  },
  filaError: { flexDirection: 'row', gap: Espacio.xs, alignItems: 'flex-start' },
  textoError: {
    flexShrink: 1,
    fontFamily: Fuentes.cuerpo,
    fontSize: Tamanos.pequeno,
    lineHeight: AlturaLinea.pequeno,
    color: Colores.error,
  },
  ayuda: {
    fontFamily: Fuentes.cuerpo,
    fontSize: Tamanos.pequeno,
    lineHeight: AlturaLinea.pequeno,
    color: Colores.textoApagado,
  },
});
