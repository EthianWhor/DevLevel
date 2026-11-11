import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextInput,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { esErrorApi } from '@/api';
import { BotonPrincipal } from '@/components/ui/boton-principal';
import { CampoTexto } from '@/components/ui/campo-texto';
import { useAuth } from '@/context/auth-context';
import { AlturaLinea, AreaTactilMinima, Colores, Espacio, Fuentes, Radio, Tamanos } from '@/theme';

type Modo = 'login' | 'registro';
type Errores = { email?: string; password?: string; confirmar?: string };

// Mismas reglas que el backend (backend/src/lib/validacion.ts), para avisar
// antes de enviar. El backend vuelve a validar y sus errores también se
// muestran debajo de cada campo.
const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72;

function validar(modo: Modo, email: string, password: string, confirmar: string): Errores {
  const errores: Errores = {};

  if (email.trim() === '') errores.email = 'Escribe tu correo';
  else if (!PATRON_CORREO.test(email.trim())) errores.email = 'El correo no tiene un formato válido';

  if (password === '') errores.password = 'Escribe tu contraseña';
  else if (modo === 'registro' && password.length < PASSWORD_MIN)
    errores.password = `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`;
  else if (password.length > PASSWORD_MAX)
    errores.password = `La contraseña puede tener máximo ${PASSWORD_MAX} caracteres`;

  if (modo === 'registro') {
    if (confirmar === '') errores.confirmar = 'Vuelve a escribir la contraseña';
    else if (confirmar !== password) errores.confirmar = 'Las contraseñas no coinciden';
  }

  return errores;
}

// Pantalla Login / Registro (diseño "registro_login" de Stitch).
// Dos pestañas, errores debajo de cada campo con ícono + texto y un aviso
// general para errores que no son de un campo (sin internet, datos incorrectos).
export default function LoginScreen() {
  const { iniciarSesion, registrarse } = useAuth();
  const [modo, setModo] = useState<Modo>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [lento, setLento] = useState(false);

  const refPassword = useRef<ComponentRef<typeof TextInput>>(null);
  const refConfirmar = useRef<ComponentRef<typeof TextInput>>(null);

  // Si el servidor tarda (Render despertando), se explica en vez de dejar al
  // usuario esperando sin saber qué pasa.
  useEffect(() => {
    if (!enviando) {
      setLento(false);
      return;
    }
    const t = setTimeout(() => setLento(true), 5000);
    return () => clearTimeout(t);
  }, [enviando]);

  function cambiarModo(nuevo: Modo) {
    if (nuevo === modo) return;
    setModo(nuevo);
    setErrores({});
    setErrorGeneral(null);
    setConfirmar('');
  }

  // Al escribir en un campo se quita su error.
  function limpiar(campo: keyof Errores) {
    if (errores[campo]) setErrores((actual) => ({ ...actual, [campo]: undefined }));
    if (errorGeneral) setErrorGeneral(null);
  }

  async function enviar() {
    if (enviando) return;
    const locales = validar(modo, email, password, confirmar);
    setErrores(locales);
    setErrorGeneral(null);
    if (Object.keys(locales).length > 0) return;

    setEnviando(true);
    try {
      if (modo === 'login') await iniciarSesion(email.trim(), password);
      else await registrarse(email.trim(), password);
      // Con sesión, el layout raíz cambia de pantalla solo.
    } catch (error) {
      if (esErrorApi(error)) {
        const campos = error.campos as Errores;
        if (campos.email || campos.password) {
          setErrores({ email: campos.email, password: campos.password });
        } else {
          setErrorGeneral(error.message);
        }
      } else {
        setErrorGeneral('Ocurrió un error inesperado. Intenta de nuevo.');
      }
    } finally {
      setEnviando(false);
    }
  }

  const esRegistro = modo === 'registro';

  return (
    <SafeAreaView style={estilos.pantalla}>
      <View style={estilos.barraSuperior}>
        <Image
          source={require('../../assets/images/onboarding/heroe.jpg')}
          style={estilos.avatar}
          contentFit="cover"
          accessibilityIgnoresInvertColors
          accessible={false}
        />
        <Text style={estilos.marca}>DevLevel</Text>
        <Text style={estilos.rayo} importantForAccessibility="no" accessibilityElementsHidden>
          ⚡
        </Text>
      </View>

      <KeyboardAwareScrollView
        style={estilos.flex}
        contentContainerStyle={estilos.contenido}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}>
          <View style={estilos.tarjeta}>
            <Text style={estilos.titulo} accessibilityRole="header">
              {esRegistro ? 'Únete al reino' : 'Entra al reino'}
            </Text>
            <Text style={estilos.subtitulo}>
              {esRegistro
                ? 'Crea tu cuenta para empezar la aventura.'
                : 'Inicia sesión para seguir tu aventura.'}
            </Text>

            {/* Pestañas: se cambia de modo tocando, con texto y subrayado. */}
            <View style={estilos.pestanas} accessibilityRole="tablist">
              <Pestana texto="Iniciar sesión" activa={!esRegistro} onPress={() => cambiarModo('login')} />
              <Pestana texto="Crear cuenta" activa={esRegistro} onPress={() => cambiarModo('registro')} />
            </View>

            <View style={estilos.formulario}>
              <CampoTexto
                etiqueta="Correo"
                icono="✉"
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  limpiar('email');
                }}
                error={errores.email}
                placeholder="heroe@correo.com"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() => refPassword.current?.focus()}
                submitBehavior="submit"
              />

              <CampoTexto
                ref={refPassword}
                etiqueta="Contraseña"
                icono="🔒"
                esContrasena
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  limpiar('password');
                }}
                error={errores.password}
                ayuda={esRegistro ? `Mínimo ${PASSWORD_MIN} caracteres.` : undefined}
                placeholder="••••••••"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete={esRegistro ? 'new-password' : 'current-password'}
                textContentType={esRegistro ? 'newPassword' : 'password'}
                returnKeyType={esRegistro ? 'next' : 'go'}
                onSubmitEditing={() => (esRegistro ? refConfirmar.current?.focus() : void enviar())}
                submitBehavior={esRegistro ? 'submit' : 'blurAndSubmit'}
              />

              {!esRegistro ? (
                <Pressable
                  onPress={() =>
                    router.push({ pathname: '/recuperar', params: { email: email.trim() } })
                  }
                  accessibilityRole="link"
                  accessibilityHint="Te enviamos un código al correo para crear una contraseña nueva"
                  style={estilos.olvido}>
                  <Text style={estilos.textoOlvido}>¿Olvidaste tu contraseña?</Text>
                </Pressable>
              ) : null}

              {esRegistro ? (
                <CampoTexto
                  ref={refConfirmar}
                  etiqueta="Confirmar contraseña"
                  icono="🔁"
                  esContrasena
                  value={confirmar}
                  onChangeText={(v) => {
                    setConfirmar(v);
                    limpiar('confirmar');
                  }}
                  error={errores.confirmar}
                  placeholder="••••••••"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="go"
                  onSubmitEditing={() => void enviar()}
                />
              ) : null}
            </View>

            {errorGeneral ? (
              <View style={estilos.aviso} accessibilityRole="alert" accessibilityLiveRegion="assertive">
                <Text style={estilos.textoAviso} importantForAccessibility="no" accessibilityElementsHidden>
                  ⚠
                </Text>
                <Text style={estilos.textoAviso}>{errorGeneral}</Text>
              </View>
            ) : null}

            <BotonPrincipal
              titulo={enviando ? 'Conectando…' : esRegistro ? '✚ Crear cuenta' : '➜ Entrar'}
              onPress={() => void enviar()}
              deshabilitado={enviando}
              pista={esRegistro ? 'Crea tu cuenta y empieza a jugar' : 'Inicia sesión con tu correo'}
            />

            {lento ? (
              <Text style={estilos.lento} accessibilityLiveRegion="polite">
                ⏳ El servidor se está despertando. La primera vez puede tardar hasta un minuto.
              </Text>
            ) : null}

            <Pressable
              onPress={() => cambiarModo(esRegistro ? 'login' : 'registro')}
              accessibilityRole="button"
              style={estilos.enlace}>
              <Text style={estilos.textoEnlace}>
                {esRegistro ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Crea una'}
              </Text>
            </Pressable>
          </View>
        </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

function Pestana({ texto, activa, onPress }: { texto: string; activa: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={texto}
      accessibilityState={{ selected: activa }}
      style={[estilos.pestana, activa && estilos.pestanaActiva]}>
      <Text style={[estilos.textoPestana, activa && estilos.textoPestanaActiva]}>{texto}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: Colores.fondo },
  flex: { flex: 1 },
  barraSuperior: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.md,
    paddingHorizontal: Espacio.lg,
    paddingVertical: Espacio.sm,
    borderBottomWidth: 3,
    borderBottomColor: '#1e293b',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radio.sm,
    borderWidth: 2,
    borderColor: '#1e293b',
  },
  marca: {
    flex: 1,
    fontFamily: Fuentes.titulo,
    fontSize: Tamanos.titulo,
    lineHeight: AlturaLinea.titulo,
    color: Colores.oro,
  },
  rayo: { fontSize: Tamanos.subtitulo, lineHeight: AlturaLinea.subtitulo, color: Colores.oro },
  contenido: { flexGrow: 1, justifyContent: 'center', padding: Espacio.md + 4 },
  tarjeta: {
    backgroundColor: Colores.superficieAlta,
    borderWidth: 2,
    borderColor: '#1e293b',
    borderRadius: Radio.sm,
    padding: Espacio.lg,
    gap: Espacio.md,
  },
  titulo: {
    fontFamily: Fuentes.titulo,
    fontSize: Tamanos.subtitulo,
    lineHeight: AlturaLinea.subtitulo,
    color: Colores.oro,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  subtitulo: {
    fontFamily: Fuentes.cuerpo,
    fontSize: Tamanos.cuerpo,
    lineHeight: AlturaLinea.cuerpo,
    color: Colores.textoSecundario,
    textAlign: 'center',
    marginTop: -Espacio.sm,
  },
  pestanas: { flexDirection: 'row', borderBottomWidth: 4, borderBottomColor: Colores.superficie },
  pestana: {
    flex: 1,
    minHeight: AreaTactilMinima,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -4,
    borderBottomWidth: 4,
    borderBottomColor: 'transparent',
  },
  pestanaActiva: { borderBottomColor: Colores.oro },
  textoPestana: {
    fontFamily: Fuentes.cuerpoNegrita,
    fontSize: Tamanos.cuerpo,
    lineHeight: AlturaLinea.cuerpo,
    color: Colores.textoSecundario,
  },
  textoPestanaActiva: { color: Colores.oro },
  formulario: { gap: Espacio.md },
  olvido: {
    alignSelf: 'flex-end',
    minHeight: AreaTactilMinima,
    justifyContent: 'center',
    marginTop: -Espacio.sm,
  },
  textoOlvido: {
    fontFamily: Fuentes.cuerpoNegrita,
    fontSize: Tamanos.pequeno,
    lineHeight: AlturaLinea.pequeno,
    color: '#93c5fd',
    textDecorationLine: 'underline',
  },
  aviso: {
    flexDirection: 'row',
    gap: Espacio.sm,
    padding: Espacio.md,
    borderWidth: 2,
    borderColor: Colores.error,
    borderRadius: Radio.sm,
    backgroundColor: Colores.superficie,
  },
  textoAviso: {
    flexShrink: 1,
    fontFamily: Fuentes.cuerpoNegrita,
    fontSize: Tamanos.cuerpo,
    lineHeight: AlturaLinea.cuerpo,
    color: Colores.error,
  },
  lento: {
    fontFamily: Fuentes.cuerpo,
    fontSize: Tamanos.pequeno,
    lineHeight: AlturaLinea.pequeno,
    color: Colores.textoSecundario,
    textAlign: 'center',
  },
  enlace: { minHeight: AreaTactilMinima, alignItems: 'center', justifyContent: 'center' },
  textoEnlace: {
    fontFamily: Fuentes.cuerpoNegrita,
    fontSize: Tamanos.cuerpo,
    lineHeight: AlturaLinea.cuerpo,
    color: Colores.texto,
    textDecorationLine: 'underline',
  },
});
