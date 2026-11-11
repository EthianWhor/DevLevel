import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authApi, esErrorApi, type Avatar } from '@/api';
import { AVATARES } from '@/constants/avatares';
import { AreaTactilMinima, Retro } from '@/constants/retro';
import { useAuth } from '@/context/auth-context';

const NOMBRE_MIN = 2;
const NOMBRE_MAX = 20;

// Selección de personaje: el usuario elige su clase (avatar) y su nombre de héroe.
// Se guarda con PATCH /me y después se va al mapa.
export default function PersonajeScreen() {
  const { perfil, conSesion, actualizarPerfilLocal } = useAuth();

  const [avatar, setAvatar] = useState<Avatar | null>(perfil?.avatar ?? null);
  const [nombre, setNombre] = useState(perfil?.nombreHeroe ?? '');
  const [errores, setErrores] = useState<{ avatar?: string; nombreHeroe?: string }>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Se valida en la app para responder rápido; el backend vuelve a validar.
  function validar() {
    const nuevos: typeof errores = {};
    if (!avatar) nuevos.avatar = 'Elige una clase para tu héroe';
    const limpio = nombre.trim();
    if (limpio.length < NOMBRE_MIN || limpio.length > NOMBRE_MAX) {
      nuevos.nombreHeroe = `El nombre debe tener entre ${NOMBRE_MIN} y ${NOMBRE_MAX} caracteres`;
    }
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  }

  async function comenzar() {
    setErrorGeneral(null);
    if (!validar() || !avatar) return;

    setGuardando(true);
    try {
      const respuesta = await conSesion((token) =>
        authApi.actualizarMe(token, { avatar, nombreHeroe: nombre.trim() }),
      );
      actualizarPerfilLocal(respuesta.perfil);
      router.replace('/');
    } catch (error) {
      if (esErrorApi(error) && Object.keys(error.campos).length > 0) {
        setErrores(error.campos);
      } else {
        setErrorGeneral(esErrorApi(error) ? error.message : 'No se pudo guardar. Intenta de nuevo.');
      }
    } finally {
      setGuardando(false);
    }
  }

  return (
    <SafeAreaView style={styles.pantalla}>
      <KeyboardAwareScrollView
        style={styles.pantalla}
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}>
          <Text style={styles.titulo} accessibilityRole="header">
            Selecciona tu clase
          </Text>
          <Text style={styles.subtitulo}>
            Elige el camino de tu héroe. Cada clase tiene una habilidad para dominar el reino de la
            lógica.
          </Text>

          <View accessibilityRole="radiogroup" accessibilityLabel="Clase del héroe" style={styles.lista}>
            {AVATARES.map((opcion) => {
              const seleccionado = avatar === opcion.id;
              return (
                <Pressable
                  key={opcion.id}
                  onPress={() => {
                    setAvatar(opcion.id);
                    setErrores((previos) => ({ ...previos, avatar: undefined }));
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: seleccionado }}
                  accessibilityLabel={`${opcion.nombre}. Habilidad: ${opcion.habilidad}. ${opcion.descripcion}`}
                  style={[styles.tarjeta, seleccionado && styles.tarjetaSeleccionada]}>
                  <Text style={styles.simbolo} importantForAccessibility="no" accessibilityElementsHidden>
                    {opcion.simbolo}
                  </Text>
                  <View style={styles.textosTarjeta}>
                    <Text style={styles.nombreClase}>{opcion.nombre}</Text>
                    <Text style={styles.habilidad}>Habilidad: {opcion.habilidad}</Text>
                    <Text style={styles.descripcion}>{opcion.descripcion}</Text>
                    {seleccionado ? (
                      // Texto además del borde: la selección no depende solo del color.
                      <Text style={styles.marcaSeleccion}>✓ SELECCIONADO</Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
          {errores.avatar ? <MensajeError texto={errores.avatar} /> : null}

          <Text style={styles.etiqueta} nativeID="etiqueta-nombre">
            Nombre del héroe
          </Text>
          <TextInput
            style={styles.campo}
            value={nombre}
            onChangeText={(texto) => {
              setNombre(texto);
              setErrores((previos) => ({ ...previos, nombreHeroe: undefined }));
            }}
            maxLength={NOMBRE_MAX}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={comenzar}
            accessibilityLabel="Nombre del héroe"
            accessibilityLabelledBy="etiqueta-nombre"
            accessibilityHint={`Entre ${NOMBRE_MIN} y ${NOMBRE_MAX} caracteres`}
            placeholder="Ej: Ada"
            placeholderTextColor={Retro.textoApagado}
          />
          <Text style={styles.contador} importantForAccessibility="no">
            {nombre.trim().length}/{NOMBRE_MAX}
          </Text>
          {errores.nombreHeroe ? <MensajeError texto={errores.nombreHeroe} /> : null}

          {errorGeneral ? <MensajeError texto={errorGeneral} /> : null}

          <Pressable
            onPress={comenzar}
            disabled={guardando}
            accessibilityRole="button"
            accessibilityLabel="Comenzar aventura"
            accessibilityState={{ disabled: guardando, busy: guardando }}
            style={({ pressed }) => [styles.boton, pressed && styles.botonPresionado]}>
            {guardando ? (
              <ActivityIndicator color={Retro.textoSobreOro} />
            ) : (
              <Text style={styles.textoBoton}>▶ COMENZAR AVENTURA</Text>
            )}
          </Pressable>
        </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

function MensajeError({ texto }: { texto: string }) {
  return (
    <View style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Text style={styles.textoError} importantForAccessibility="no" accessibilityElementsHidden>
        ⚠
      </Text>
      <Text style={styles.textoError}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: Retro.fondo },
  contenido: { padding: 20, gap: 8, paddingBottom: 40 },
  titulo: { color: Retro.oro, fontSize: 28, lineHeight: 34, fontWeight: '700' },
  subtitulo: { color: Retro.textoSecundario, fontSize: 16, lineHeight: 24, marginBottom: 8 },
  lista: { gap: 12 },
  tarjeta: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    minHeight: AreaTactilMinima,
    backgroundColor: Retro.superficie,
    borderWidth: 2,
    borderColor: Retro.borde,
  },
  tarjetaSeleccionada: { borderColor: Retro.oro, borderWidth: 4, backgroundColor: Retro.superficieAlta },
  simbolo: { fontSize: 36, lineHeight: 44 },
  textosTarjeta: { flex: 1, gap: 4 },
  nombreClase: { color: Retro.texto, fontSize: 18, lineHeight: 24, fontWeight: '700' },
  habilidad: { color: Retro.verde, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  descripcion: { color: Retro.textoSecundario, fontSize: 16, lineHeight: 22 },
  marcaSeleccion: { color: Retro.oro, fontSize: 14, lineHeight: 20, fontWeight: '700', marginTop: 4 },
  etiqueta: { color: Retro.texto, fontSize: 16, lineHeight: 24, fontWeight: '600', marginTop: 16 },
  campo: {
    minHeight: AreaTactilMinima,
    borderWidth: 2,
    borderColor: Retro.borde,
    backgroundColor: '#000000',
    color: Retro.verde,
    fontFamily: Platform.select({ android: 'monospace', default: undefined }),
    fontSize: 16,
    paddingHorizontal: 12,
  },
  contador: { color: Retro.textoSecundario, fontSize: 14, lineHeight: 20, textAlign: 'right' },
  error: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  textoError: { color: Retro.error, fontSize: 16, lineHeight: 22, flexShrink: 1 },
  boton: {
    minHeight: AreaTactilMinima,
    marginTop: 16,
    backgroundColor: Retro.oro,
    borderBottomWidth: 4,
    borderBottomColor: Retro.oroOscuro,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  botonPresionado: { borderBottomWidth: 0, transform: [{ translateY: 4 }] },
  textoBoton: { color: Retro.textoSobreOro, fontSize: 16, fontWeight: '700', letterSpacing: 1 },
});
