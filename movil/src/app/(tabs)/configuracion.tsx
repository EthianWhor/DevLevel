import { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BotonPrincipal } from '@/components/ui/boton-principal';
import { FilaSwitch } from '@/components/ui/fila-switch';
import { Tarjeta } from '@/components/ui/tarjeta';
import { useAuth } from '@/context/auth-context';
import { usePreferencias } from '@/context/preferencias-context';
import { AlturaLinea, AreaTactilMinima, Colores, Espacio, Fuentes, Tamanos } from '@/theme';

export default function ConfiguracionScreen() {
  const { cerrarSesion } = useAuth();
  const { preferencias, cargando, cambiar } = usePreferencias();

  // Se congelan los callbacks por clave para que FilaSwitch no reciba una
  // función nueva en cada render (y no se re-renderice de más).
  const cambiarReducirMovimiento = useCallback(
    (v: boolean) => void cambiar('reducirMovimiento', v),
    [cambiar],
  );
  const cambiarSonido = useCallback((v: boolean) => void cambiar('sonido', v), [cambiar]);
  const cambiarVibracion = useCallback((v: boolean) => void cambiar('vibracion', v), [cambiar]);

  return (
    <SafeAreaView style={estilos.pantalla} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={estilos.contenido} showsVerticalScrollIndicator={false}>
        <Text style={estilos.titulo} accessibilityRole="header">
          Configuración
        </Text>
        <Text style={estilos.subtitulo}>Ajusta la experiencia a tu manera.</Text>

        <View style={estilos.seccion}>
          <Text style={estilos.seccionTitulo} accessibilityRole="header">
            Accesibilidad
          </Text>
          <Tarjeta>
            <FilaSwitch
              etiqueta="Reducir movimiento"
              descripcion="Desactiva las animaciones al presionar botones."
              valor={preferencias.reducirMovimiento}
              onChange={cambiarReducirMovimiento}
              deshabilitado={cargando}
            />
            <View style={estilos.separador} />
            <FilaSwitch
              etiqueta="Sonido"
              descripcion="Reproduce efectos de sonido en la app."
              valor={preferencias.sonido}
              onChange={cambiarSonido}
              deshabilitado={cargando}
            />
            <View style={estilos.separador} />
            <FilaSwitch
              etiqueta="Vibración"
              descripcion="Vibra al responder un reto."
              valor={preferencias.vibracion}
              onChange={cambiarVibracion}
              deshabilitado={cargando}
            />
          </Tarjeta>
        </View>

        <View style={estilos.seccion}>
          <Text style={estilos.seccionTitulo} accessibilityRole="header">
            Cuenta
          </Text>
          <BotonPrincipal
            titulo="Cerrar sesión"
            variante="peligro"
            onPress={() => void cerrarSesion()}
            pista="Vuelve a la pantalla de inicio de sesión."
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: Colores.fondo },
  contenido: {
    padding: Espacio.lg,
    gap: Espacio.lg,
    paddingBottom: Espacio.xl,
  },
  titulo: {
    fontFamily: Fuentes.titulo,
    fontSize: Tamanos.titulo,
    lineHeight: AlturaLinea.titulo,
    color: Colores.texto,
  },
  subtitulo: {
    fontFamily: Fuentes.cuerpo,
    fontSize: Tamanos.cuerpo,
    lineHeight: AlturaLinea.cuerpo,
    color: Colores.textoSecundario,
    marginTop: -Espacio.sm,
  },
  seccion: { gap: Espacio.sm },
  seccionTitulo: {
    fontFamily: Fuentes.tituloMedio,
    fontSize: Tamanos.subtitulo,
    lineHeight: AlturaLinea.subtitulo,
    color: Colores.texto,
  },
  separador: {
    height: StyleSheet.hairlineWidth * 2,
    backgroundColor: Colores.borde,
    marginVertical: Espacio.xs,
  },
  // Referencia usada solo para que TypeScript no se queje del import no usado
  // si en el futuro se retira AreaTactilMinima. Mantener por consistencia.
  _ref: { minHeight: AreaTactilMinima },
});