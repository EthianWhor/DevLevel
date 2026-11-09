// Versión mínima de inicio de sesión / registro para poder probar el
// AuthContext y las pantallas protegidas. La pantalla final con el diseño de
// Stitch (pergamino, ícono + texto en cada error) es la tarea Login / Registro.
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { esErrorApi } from '@/api';
import { AreaTactilMinima, Retro } from '@/constants/retro';
import { useAuth } from '@/context/auth-context';

type Modo = 'login' | 'registro';

export default function LoginScreen() {
  const { iniciarSesion, registrarse } = useAuth();
  const [modo, setModo] = useState<Modo>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});

  async function enviar() {
    setEnviando(true);
    setErrorGeneral(null);
    setErrores({});
    try {
      if (modo === 'login') {
        await iniciarSesion(email, password);
      } else {
        await registrarse(email, password);
      }
      // Al haber sesión, el layout raíz cambia de pantalla solo.
    } catch (error) {
      if (esErrorApi(error)) {
        setErrores(error.campos);
        if (Object.keys(error.campos).length === 0) setErrorGeneral(error.message);
      } else {
        setErrorGeneral('Ocurrió un error inesperado. Intenta de nuevo.');
      }
    } finally {
      setEnviando(false);
    }
  }

  const titulo = modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta';

  return (
    <SafeAreaView style={styles.pantalla}>
      <KeyboardAvoidingView
        style={styles.pantalla}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
          <Text style={styles.marca} accessibilityRole="header">
            DevLevel
          </Text>
          <Text style={styles.titulo} accessibilityRole="header">
            {titulo}
          </Text>

          <Text style={styles.etiqueta} nativeID="etiqueta-correo">
            Correo
          </Text>
          <TextInput
            style={styles.campo}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            accessibilityLabel="Correo"
            accessibilityLabelledBy="etiqueta-correo"
            placeholder="heroe@correo.com"
            placeholderTextColor={Retro.textoApagado}
          />
          {errores.email ? <MensajeError texto={errores.email} /> : null}

          <Text style={styles.etiqueta} nativeID="etiqueta-password">
            Contraseña
          </Text>
          <TextInput
            style={styles.campo}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
            accessibilityLabel="Contraseña"
            accessibilityLabelledBy="etiqueta-password"
            placeholder="Mínimo 8 caracteres"
            placeholderTextColor={Retro.textoApagado}
          />
          {errores.password ? <MensajeError texto={errores.password} /> : null}

          {errorGeneral ? <MensajeError texto={errorGeneral} /> : null}

          <Pressable
            onPress={enviar}
            disabled={enviando}
            accessibilityRole="button"
            accessibilityLabel={titulo}
            accessibilityState={{ disabled: enviando, busy: enviando }}
            style={({ pressed }) => [styles.boton, pressed && styles.botonPresionado]}>
            {enviando ? (
              <ActivityIndicator color={Retro.textoSobreOro} />
            ) : (
              <Text style={styles.textoBoton}>{titulo.toUpperCase()}</Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => {
              setModo(modo === 'login' ? 'registro' : 'login');
              setErrores({});
              setErrorGeneral(null);
            }}
            accessibilityRole="button"
            hitSlop={8}
            style={styles.enlace}>
            <Text style={styles.textoEnlace}>
              {modo === 'login' ? '¿No tienes cuenta? Crear una' : '¿Ya tienes cuenta? Inicia sesión'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MensajeError({ texto }: { texto: string }) {
  return (
    <View style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Text style={styles.textoError} accessibilityElementsHidden importantForAccessibility="no">
        ⚠
      </Text>
      <Text style={styles.textoError}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: Retro.fondo },
  contenido: { flexGrow: 1, justifyContent: 'center', padding: 20, gap: 8 },
  marca: { color: Retro.oro, fontSize: 32, lineHeight: 40, fontWeight: '700', textAlign: 'center' },
  titulo: {
    color: Retro.texto,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  etiqueta: { color: Retro.textoSecundario, fontSize: 16, lineHeight: 24, marginTop: 8 },
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
  enlace: { minHeight: AreaTactilMinima, alignItems: 'center', justifyContent: 'center' },
  textoEnlace: { color: Retro.texto, fontSize: 16, lineHeight: 24, textDecorationLine: 'underline' },
});
