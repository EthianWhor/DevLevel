import { router, useLocalSearchParams } from 'expo-router';
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

import { authApi, esErrorApi } from '@/api';
import { BotonPrincipal } from '@/components/ui/boton-principal';
import { CampoTexto } from '@/components/ui/campo-texto';
import { useAuth } from '@/context/auth-context';
import { AlturaLinea, AreaTactilMinima, Colores, Espacio, Fuentes, Radio, Tamanos } from '@/theme';

type Paso = 'correo' | 'codigo';
type Errores = { email?: string; codigo?: string; password?: string; confirmar?: string };

const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PATRON_CODIGO = /^\d{6,10}$/;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72;
// Supabase deja pedir otro código después de un minuto.
const ESPERA_REENVIO_S = 60;

function validarCorreo(email: string) {
  if (email.trim() === '') return 'Escribe tu correo';
  if (!PATRON_CORREO.test(email.trim())) return 'El correo no tiene un formato válido';
  return undefined;
}

// Recuperar contraseña en dos pasos:
//   1. El usuario escribe su correo y el backend le envía un código.
//   2. Escribe el código y su nueva contraseña; si todo está bien, entra directo.
export default function RecuperarScreen() {
  const parametros = useLocalSearchParams<{ email?: string }>();
  const { restablecerContrasena } = useAuth();

  const [paso, setPaso] = useState<Paso>('correo');
  const [email, setEmail] = useState(parametros.email ?? '');
  const [codigo, setCodigo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [segundos, setSegundos] = useState(0);

  const refPassword = useRef<ComponentRef<typeof TextInput>>(null);
  const refConfirmar = useRef<ComponentRef<typeof TextInput>>(null);

  // Cuenta regresiva para poder pedir otro código.
  useEffect(() => {
    if (segundos <= 0) return;
    const t = setTimeout(() => setSegundos((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [segundos]);

  function limpiar(campo: keyof Errores) {
    if (errores[campo]) setErrores((actual) => ({ ...actual, [campo]: undefined }));
    if (errorGeneral) setErrorGeneral(null);
  }

  function mostrarError(error: unknown, camposPermitidos: (keyof Errores)[]) {
    if (esErrorApi(error)) {
      const campos = error.campos as Errores;
      const deCampo = camposPermitidos.filter((c) => campos[c]);
      if (deCampo.length > 0) {
        setErrores(Object.fromEntries(deCampo.map((c) => [c, campos[c]])) as Errores);
        return;
      }
      setErrorGeneral(error.message);
      return;
    }
    setErrorGeneral('Ocurrió un error inesperado. Intenta de nuevo.');
  }

  async function enviarCodigo() {
    if (enviando) return;
    const errorCorreo = validarCorreo(email);
    setErrores(errorCorreo ? { email: errorCorreo } : {});
    setErrorGeneral(null);
    if (errorCorreo) return;

    setEnviando(true);
    try {
      await authApi.pedirCodigoRecuperacion(email.trim());
      setPaso('codigo');
      setSegundos(ESPERA_REENVIO_S);
    } catch (error) {
      mostrarError(error, ['email']);
    } finally {
      setEnviando(false);
    }
  }

  async function cambiarContrasena() {
    if (enviando) return;
    const locales: Errores = {};
    if (codigo.trim() === '') locales.codigo = 'Escribe el código que te llegó al correo';
    else if (!PATRON_CODIGO.test(codigo.trim())) locales.codigo = 'El código son solo números, revisa el correo';
    if (password === '') locales.password = 'Escribe tu nueva contraseña';
    else if (password.length < PASSWORD_MIN)
      locales.password = `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`;
    else if (password.length > PASSWORD_MAX)
      locales.password = `La contraseña puede tener máximo ${PASSWORD_MAX} caracteres`;
    if (confirmar === '') locales.confirmar = 'Vuelve a escribir la contraseña';
    else if (confirmar !== password) locales.confirmar = 'Las contraseñas no coinciden';

    setErrores(locales);
    setErrorGeneral(null);
    if (Object.keys(locales).length > 0) return;

    setEnviando(true);
    try {
      await restablecerContrasena(email.trim(), codigo.trim(), password);
      // Con sesión, el layout raíz lleva al mapa solo.
    } catch (error) {
      mostrarError(error, ['codigo', 'password']);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView style={estilos.pantalla}>
      <View style={estilos.barraSuperior}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/login'))}
          accessibilityRole="button"
          accessibilityLabel="Volver a iniciar sesión"
          style={estilos.volver}>
          <Text style={estilos.textoVolver}>← Volver</Text>
        </Pressable>
        <Text style={estilos.marca}>DevLevel</Text>
      </View>

      <KeyboardAwareScrollView
        style={estilos.flex}
        contentContainerStyle={estilos.contenido}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}>
          <View style={estilos.tarjeta}>
            <Text style={estilos.titulo} accessibilityRole="header">
              Recuperar contraseña
            </Text>
            <Text style={estilos.paso}>Paso {paso === 'correo' ? 1 : 2} de 2</Text>

            {paso === 'correo' ? (
              <>
                <Text style={estilos.texto}>
                  Escribe el correo de tu cuenta y te enviaremos un código para crear una contraseña
                  nueva.
                </Text>
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
                  returnKeyType="send"
                  onSubmitEditing={() => void enviarCodigo()}
                />
              </>
            ) : (
              <>
                <View style={estilos.info} accessibilityLiveRegion="polite">
                  <Text style={estilos.textoInfo}>
                    ✉ Si {email.trim()} tiene una cuenta, te enviamos un código. Revisa también la
                    carpeta de spam.
                  </Text>
                </View>

                <CampoTexto
                  etiqueta="Código del correo"
                  icono="🔑"
                  value={codigo}
                  onChangeText={(v) => {
                    setCodigo(v.replace(/\D/g, ''));
                    limpiar('codigo');
                  }}
                  error={errores.codigo}
                  placeholder="123456"
                  keyboardType="number-pad"
                  autoComplete="one-time-code"
                  textContentType="oneTimeCode"
                  maxLength={10}
                  returnKeyType="next"
                  onSubmitEditing={() => refPassword.current?.focus()}
                  submitBehavior="submit"
                />
                <CampoTexto
                  ref={refPassword}
                  etiqueta="Nueva contraseña"
                  icono="🔒"
                  esContrasena
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v);
                    limpiar('password');
                  }}
                  error={errores.password}
                  ayuda={`Mínimo ${PASSWORD_MIN} caracteres.`}
                  placeholder="••••••••"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="next"
                  onSubmitEditing={() => refConfirmar.current?.focus()}
                  submitBehavior="submit"
                />
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
                  onSubmitEditing={() => void cambiarContrasena()}
                />
              </>
            )}

            {errorGeneral ? (
              <View style={estilos.aviso} accessibilityRole="alert" accessibilityLiveRegion="assertive">
                <Text style={estilos.textoAviso} importantForAccessibility="no" accessibilityElementsHidden>
                  ⚠
                </Text>
                <Text style={estilos.textoAviso}>{errorGeneral}</Text>
              </View>
            ) : null}

            {paso === 'correo' ? (
              <BotonPrincipal
                titulo={enviando ? 'Enviando…' : '✉ Enviar código'}
                onPress={() => void enviarCodigo()}
                deshabilitado={enviando}
                pista="Envía un código a tu correo"
              />
            ) : (
              <>
                <BotonPrincipal
                  titulo={enviando ? 'Cambiando…' : '✔ Cambiar contraseña'}
                  onPress={() => void cambiarContrasena()}
                  deshabilitado={enviando}
                  pista="Guarda la nueva contraseña y entra a tu cuenta"
                />
                <Pressable
                  onPress={() => void enviarCodigo()}
                  disabled={segundos > 0 || enviando}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: segundos > 0 || enviando }}
                  accessibilityLabel={
                    segundos > 0 ? `Pedir otro código, disponible en ${segundos} segundos` : 'Pedir otro código'
                  }
                  style={estilos.enlace}>
                  <Text style={[estilos.textoEnlace, segundos > 0 && estilos.enlaceInactivo]}>
                    {segundos > 0 ? `Pedir otro código (${segundos} s)` : 'Pedir otro código'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setPaso('correo');
                    setErrores({});
                    setErrorGeneral(null);
                  }}
                  accessibilityRole="button"
                  style={estilos.enlace}>
                  <Text style={estilos.textoEnlace}>Usar otro correo</Text>
                </Pressable>
              </>
            )}
          </View>
        </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: Colores.fondo },
  flex: { flex: 1 },
  barraSuperior: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.md,
    paddingHorizontal: Espacio.md,
    paddingVertical: Espacio.xs,
    borderBottomWidth: 3,
    borderBottomColor: '#1e293b',
  },
  volver: { minHeight: AreaTactilMinima, minWidth: AreaTactilMinima, justifyContent: 'center' },
  textoVolver: {
    fontFamily: Fuentes.cuerpoNegrita,
    fontSize: Tamanos.cuerpo,
    lineHeight: AlturaLinea.cuerpo,
    color: Colores.texto,
  },
  marca: {
    fontFamily: Fuentes.titulo,
    fontSize: Tamanos.subtitulo,
    lineHeight: AlturaLinea.subtitulo,
    color: Colores.oro,
  },
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
  paso: {
    fontFamily: Fuentes.codigo,
    fontSize: Tamanos.pequeno,
    lineHeight: AlturaLinea.pequeno,
    color: Colores.textoSecundario,
    textAlign: 'center',
    marginTop: -Espacio.sm,
  },
  texto: {
    fontFamily: Fuentes.cuerpo,
    fontSize: Tamanos.cuerpo,
    lineHeight: AlturaLinea.cuerpo,
    color: Colores.textoSecundario,
  },
  info: {
    padding: Espacio.md,
    borderWidth: 2,
    borderColor: Colores.verde,
    borderRadius: Radio.sm,
    backgroundColor: Colores.superficie,
  },
  textoInfo: {
    fontFamily: Fuentes.cuerpo,
    fontSize: Tamanos.cuerpo,
    lineHeight: AlturaLinea.cuerpo,
    color: Colores.texto,
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
  enlace: { minHeight: AreaTactilMinima, alignItems: 'center', justifyContent: 'center' },
  textoEnlace: {
    fontFamily: Fuentes.cuerpoNegrita,
    fontSize: Tamanos.cuerpo,
    lineHeight: AlturaLinea.cuerpo,
    color: Colores.texto,
    textDecorationLine: 'underline',
  },
  enlaceInactivo: { color: Colores.textoApagado, textDecorationLine: 'none' },
});
