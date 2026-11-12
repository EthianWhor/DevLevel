# Matriz de trazabilidad de accesibilidad

**Proyecto:** DevLevel, aplicación móvil para aprender lógica de programación
**Asignatura:** Desarrollo de Aplicaciones Móviles, Universidad de La Sabana
**Documento:** Documento Técnico Final, Fase 3, Sección 3
**Equipo:** Ethian White y Tatiana Mayorga
**Fecha de entrega:** 12 de noviembre de 2026
**Versión de la aplicación:** 1.0.0 (APK final, commit `cec5fcf`)
**Plataforma entregada:** APK Android (no se entrega versión iOS)
**Stack:** Expo SDK 58, React Native 0.88, TypeScript, expo-router, React Context, AsyncStorage (preferencias), expo-secure-store (token de sesión); backend Express con Supabase
**Commit de cierre:** `PENDIENTE_DE_ACTUALIZAR` (rama main)

---

## 1. Propósito

Este documento presenta la matriz de trazabilidad de accesibilidad de DevLevel. Su finalidad es demostrar, para cada mejora de accesibilidad comprometida en la Fase 2 (Segundo Corte), qué se prometió, qué criterio de las Pautas de Accesibilidad para el Contenido Web (WCAG) 2.1 o 2.2 la justifica, en qué archivo o componente quedó implementada, cómo fue verificada y cuál es su estado final.

La matriz cumple una doble función. Para la evaluación escrita, permite contrastar de manera directa lo prometido con lo entregado. Para la defensa oral, ofrece al equipo una referencia verificable: cada fila describe un método de prueba que puede explicarse y justificarse sin apoyo de capturas de pantalla.

Los criterios WCAG se emplean como marco de referencia para una aplicación móvil nativa. Dado que las pautas fueron redactadas para contenido web, la correspondencia con React Native se establece por equivalencia funcional.

## 2. Alcance

### 2.1 Pantallas incluidas

La verificación cubre las pantallas del MVP: Splash, Onboarding (tres pantallas), Inicio de sesión y registro, Recuperación de contraseña, Selección de personaje, Mapa de niveles, Concepto, Reto (mazmorra jugable), Resultado, Subida de nivel, Perfil, Libro de hechizos, Configuración y accesibilidad.

### 2.2 Exclusiones

- **iOS y VoiceOver:** la aplicación se entrega únicamente como APK Android; no se evalúa ninguna versión para iOS.
- **Medición de contraste sobre la aplicación instalada:** los valores se tomaron de la definición del tema y no de una medición sobre la interfaz renderizada.
- **Pruebas con usuarios con discapacidad:** no formaron parte de esta entrega.
- **Backend (Express y Supabase):** no se evalúa, al no contener interfaz de usuario.

## 3. Metodología de verificación

La verificación se apoyó en seis métodos complementarios:

1. **Revisión de código.** Lectura de cada archivo involucrado y comprobación de la presencia y coherencia de las propiedades de accesibilidad.
2. **Análisis estático.** Ejecución de `eslint-plugin-react-native-a11y` sobre el proyecto móvil, con resultado de cero errores y cero advertencias.
3. **Recorrido funcional.** Navegación por todas las pantallas del flujo del juego, desde el registro hasta el perfil, sin fallos.
4. **Verificación de comportamiento.** Prueba manual de que los interruptores de Configuración producen un efecto observable.
5. **Verificación de persistencia.** Prueba manual de que las preferencias se conservan tras recargar la aplicación.
6. **Auditoría en dispositivo con TalkBack.** Auditoría realizada por Ethian White en un celular Android personal con el APK final instalado. Los resultados están en `docs/auditoria-dispositivo.md`. Trece de las dieciocho pruebas pasaron; una presentó un hallazgo (D-02, errores de login no anunciados automáticamente) y cuatro no se probaron por restricción de tiempo (D-01, D-15, D-16, D-17).

### Criterio de asignación de estado

| Estado | Significado |
|:--|:--|
| ✅ Verificada | La mejora está implementada y existe al menos un método concreto de verificación que respalda su cumplimiento, incluyendo (cuando aplica) la auditoría con TalkBack en dispositivo. |
| 📝 Limitación documentada | La implementación existe, pero su cumplimiento efectivo no es verificable con los métodos disponibles, o la auditoría en dispositivo encontró un hallazgo no corregido en la versión entregada. |
| ⏳ Pendiente | La mejora no está implementada o verificada y permanece abierta. |

## 4. Matriz de trazabilidad

**Nota:** los identificadores A-01 a A-21 corresponden a las mejoras de accesibilidad consignadas en la propuesta del Segundo Corte y a las mejoras adicionales implementadas durante el desarrollo. La numeración se reorganizó para reflejar el estado final de la implementación.

| **ID** | **Mejora prometida** | **Criterio WCAG 2.1 / 2.2 y nivel** | **Archivo(s)** | **Método de prueba** | **Evidencia de verificación** | **Resultado** |
|:--:|:--|:--|:--|:--|:--|:--:|
| A-01 | Roles de accesibilidad (`accessibilityRole`) en botones, tarjetas, barra de progreso, encabezados, switches, pestañas y bloques. | 4.1.2 Nombre, función, valor (A); 1.3.1 Información y relaciones (A) | `components/ui/boton-principal.tsx`, `components/ui/tarjeta.tsx`, `components/ui/barra-progreso.tsx`, `components/ui/fila-switch.tsx`, `components/mazmorra/*`, `app/(tabs)/configuracion.tsx` | Revisión de código; análisis estático; auditoría en dispositivo | Lectura de cada archivo con comprobación del rol declarado. ESLint sin errores. Auditoría D-05 y D-18: pestañas leídas correctamente, orden de lectura correcto. | ✅ |
| A-02 | Etiquetas (`accessibilityLabel`) y pistas (`accessibilityHint`) en las acciones. | 4.1.2 (A); 2.5.3 (A); 3.3.2 (A) | Mismos archivos de A-01 | Revisión de código; análisis estático; auditoría en dispositivo | Lectura de las propiedades. ESLint sin errores. Auditoría D-03, D-04, D-09, D-13: campos y botones con etiqueta clara. | ✅ |
| A-03 | Estados anunciados (`accessibilityState`) en botones (deshabilitado), switches (activado), pestañas (seleccionada) y barra de progreso. | 4.1.2 (A) | `components/ui/boton-principal.tsx`, `components/ui/fila-switch.tsx`, `components/mazmorra/*` | Revisión de código; verificación de comportamiento; auditoría en dispositivo | Lectura del estado declarado. Prueba manual de los switches. Auditoría D-05 y D-14: pestañas y switches anuncian su estado. | ✅ |
| A-04 | Área táctil mínima de 48 dp mediante `minHeight` con `AreaTactilMinima`. | 2.5.8 Tamaño del objetivo (AA, WCAG 2.2) | `theme/espaciado.ts`, `components/ui/*` | Revisión de código; recorrido funcional | Comprobación de `AreaTactilMinima` (48) y su uso. Recorrido funcional sin dificultades de activación. | ✅ |
| A-05 | La mazmorra jugable se resuelve solo con toques: los bloques se agregan con doble toque y se reordenan con botones ↑, ↓, 🗑. | 2.5.1 (A); 2.5.7 (AA, WCAG 2.2) | `components/mazmorra/pantalla-mazmorra.tsx`, `components/mazmorra/editor-bloques.tsx` | Revisión de código; auditoría en dispositivo | Lectura del editor: no hay manejadores de arrastre. Auditoría D-08: "no hace falta arrastrar nada". D-09: botones ↑, ↓, 🗑 con etiqueta clara. | ✅ |
| A-06 | El resultado no depende únicamente del color: se comunica con ícono, texto y vibración opcional. | 1.4.1 Uso del color (A) | `components/mazmorra/pantalla-mazmorra.tsx`, `components/mazmorra/escenario.tsx` | Revisión de código; recorrido funcional | Lectura de la pantalla de mazmorra: ícono y texto en ambos estados. Recorrido funcional del resultado correcto e incorrecto. | ✅ |
| A-07 | El resultado se anuncia automáticamente a lectores de pantalla mediante región viva. | 4.1.3 Mensajes de estado (AA, WCAG 2.2) | `components/mazmorra/pantalla-mazmorra.tsx` | Auditoría en dispositivo | Auditoría D-10: TalkBack anuncia solo "¡Saliste de la mazmorra!" o "No lo lograste" con el motivo. | ✅ |
| A-08 | La barra de progreso anuncia "N de M" mediante `accessibilityValue`. | 4.1.2 (A) | `components/ui/barra-progreso.tsx` | Revisión de código; análisis estático | Lectura de `barra-progreso.tsx`: `accessibilityValue` con valores actual y máximo. ESLint sin errores. La lectura por voz no se verificó en la auditoría. | 📝 |
| A-09 | El texto respeta el escalado de fuente del sistema (sin `allowFontScaling=false`) y define `lineHeight` explícito. | 1.4.4 (AA) | `theme/tipografia.ts` y todas las pantallas | Revisión de código | Búsqueda de `allowFontScaling={false}` (sin coincidencias) y comprobación de `lineHeight`. La letra al máximo no se probó en dispositivo (D-15 no probado). | 📝 |
| A-10a | Niveles bloqueados indicados con candado y texto, sin depender solo del color. | 1.4.1 (A) | `components/mapa/nodo-nivel.tsx` | Revisión de código; auditoría en dispositivo | Lectura de `nodo-nivel.tsx`. Auditoría D-04: cada nivel dice número, título, región y estado. | ✅ |
| A-10b | Contraste mínimo de 4.5:1 en niveles bloqueados y textos sobre el fondo. | 1.4.3 Contraste (AA) | `constants/retro.ts` | Revisión de código; cálculo de contraste | Lectura de `retro.ts` y cálculo de la razón de contraste. El cálculo no equivale a una medición sobre la app instalada. | ✅ |
| A-11 | Imágenes del onboarding con descripción (`accessible` y `accessibilityLabel`). | 1.1.1 Contenido no textual (A) | `app/onboarding.tsx` | Revisión de código; análisis estático | Lectura de `onboarding.tsx`. ESLint sin errores. No se probó con TalkBack en la auditoría (D-01 no probado). | 📝 |
| A-12 | Errores de formulario mostrados bajo cada campo, con ícono y texto, no solo con color. | 3.3.1 (A); 1.4.1 (A) | `app/login.tsx`, `app/recuperar.tsx`, `components/ui/campo-texto.tsx` | Revisión de código; auditoría en dispositivo | Lectura de `campo-texto.tsx`: `accessibilityRole="alert"` y `accessibilityLiveRegion="polite"`. Auditoría D-02: el error se muestra con ⚠ y texto, pero TalkBack no lo anuncia automáticamente. Corrección propuesta en `docs/auditoria-dispositivo.md`. No se incluyó en la versión entregada por falta de tiempo. | 📝 |
| A-13a | La animación de la pantalla Subida de nivel respeta "Reducir movimiento" mostrando versión estática. | 2.3.3 (AAA, WCAG 2.1); relacionado con 2.2.2 (A) | `components/nivel/subida-nivel.tsx` | Revisión de código; recorrido funcional | Lectura de `subida-nivel.tsx`: versión estática conectada al hook `useReducirMovimiento`. Recorrido funcional. El ajuste del sistema operativo no se probó (D-16 no probado). | 📝 |
| A-13b | La preferencia "Reducir movimiento" se persiste entre sesiones en AsyncStorage. | 2.3.3 (AAA); la persistencia no corresponde a un criterio WCAG específico | `context/preferencias-context.tsx` | Verificación de persistencia | Lectura de `preferencias-context.tsx`. Recarga de la app y comprobación de que el valor se conserva. | ✅ |
| A-13c | El hook `useReducirMovimiento` combina la preferencia con el ajuste del sistema operativo. | 2.3.3 (AAA); ajustes del sistema operativo | `hooks/use-reducir-movimiento.ts` | Revisión de código | Lectura del hook: combina `preferencias.reducirMovimiento` con `AccessibilityInfo.isReduceMotionEnabled` y suscribe a cambios. | ✅ |
| A-14 | Análisis estático de accesibilidad con `eslint-plugin-react-native-a11y`, sin errores ni advertencias. | Transversal: apoya 1.1.1 (A), 4.1.2 (A) y 2.5.3 (A) | `movil/eslint.config.js` | Análisis estático | Ejecución de ESLint con el plugin: cero errores y cero advertencias. | ✅ |
| A-15 | Botón principal con variante "peligro" (cerrar sesión) accesible: rol, etiqueta, pista, estado y área táctil de al menos 48 dp. | 4.1.2 (A); 2.5.3 (A); 2.5.8 (AA) | `components/ui/boton-principal.tsx`, `app/(tabs)/configuracion.tsx` | Revisión de código; análisis estático; recorrido funcional | Lectura de `boton-principal.tsx`: cinco propiedades en la variante de peligro. ESLint sin errores. Recorrido funcional del cierre de sesión. Pantalla Configuración implementada por Tatiana Mayorga (`abd2714`) y extendida por Ethian White (`fbbad0d`). | ✅ |
| A-16 | Preferencias de la app (reducir movimiento, sonido, vibración) persistidas y con efecto real sobre el comportamiento. | 2.3.3 (AAA); 1.4.2 (A) | `context/preferencias-context.tsx`, `app/(tabs)/configuracion.tsx` | Verificación de comportamiento; verificación de persistencia; auditoría en dispositivo | Prueba manual: el botón deja de desplazarse, las pantallas muestran versión estática, la vibración se desactiva. Prueba de persistencia tras recargar. Auditoría D-14: cada interruptor dice su nombre y si está activado. | ✅ |
| A-17 | Editor de bloques sin arrastrar: los bloques se agregan con doble toque y se reordenan con botones etiquetados. | 2.5.1 (A); 2.5.7 (AA) | `components/mazmorra/editor-bloques.tsx` | Auditoría en dispositivo | Auditoría D-08: cada botón dice "Agregar …", no hace falta arrastrar. D-09: las líneas se leen como "Línea N: …" con su estado. | ✅ |
| A-18 | Descripción del escenario de la mazmorra para TalkBack. | 1.1.1 (A) | `components/mazmorra/escenario.tsx` | Revisión de código; auditoría en dispositivo | Lectura de `escenario.tsx`: descripción textual del entorno. Auditoría D-07: describe en texto dónde está el héroe, hacia dónde mira y qué hay enfrente. | ✅ |
| A-19 | Vibración en la mazmorra controlada por la preferencia "Vibración". | 1.4.1 (A) como refuerzo multisensorial | `components/mazmorra/pantalla-mazmorra.tsx` | Revisión de código; verificación de comportamiento | Lectura de `pantalla-mazmorra.tsx`: la vibración se consulta contra `preferencias.vibracion`. Prueba manual: con el toggle desactivado, no vibra. | ✅ |
| A-20 | Panel de equipo con etiquetas semánticas. | 4.1.2 (A) | `components/mazmorra/pantalla-mazmorra.tsx` | Auditoría en dispositivo | Auditoría D-13: la casilla dice su espacio y qué tiene; los botones dicen "Equipar …" o "Quitar …". | ✅ |
| A-21 | Guías "Cómo se usa" con etiquetas semánticas. | 3.3.2 (A); 1.3.1 (A) | `components/mazmorra/pantalla-mazmorra.tsx` | Auditoría en dispositivo | Auditoría D-06: lee los títulos como encabezados y cada paso como "Paso N: …". | ✅ |

**Nota sobre el nivel de conformidad:** los criterios 2.3.3 (A-13a, A-13b, A-13c y A-16) y 2.5.5 (referencia de A-04) pertenecen al nivel AAA de WCAG 2.1. Se citan porque describen con mayor precisión la intención de la mejora, aunque exceden el nivel AA fijado como objetivo del proyecto.

## 5. Resumen de cumplimiento

| **Estado** | **Cantidad** | **Filas** |
|:--|:--:|:--|
| ✅ Verificada | 19 | A-01, 02, 03, 04, 05, 06, 07, 10a, 10b, 13b, 13c, 14, 15, 16, 17, 18, 19, 20, 21 |
| 📝 Limitación documentada | 5 | A-08, A-09, A-11, A-12, A-13a |
| ⏳ Pendiente | 0 | Ninguna |
| **Total de filas** | **24** | |

## 6. Limitaciones conocidas

### 6.1 Hallazgos de la auditoría en dispositivo

1. **Lectura automática de errores de formulario (D-02).** Los errores de login y recuperación se muestran con ícono y texto, pero TalkBack no los anuncia automáticamente al aparecer. La corrección propuesta (`AccessibilityInfo.announceForAccessibility`) no se incluyó en la versión entregada por falta de tiempo para generar y volver a probar el APK.
2. **Barra de progreso (A-08).** La barra declara `accessibilityValue` con "N de M", pero la auditoría en dispositivo no incluyó una prueba específica de su anuncio por TalkBack.
3. **Onboarding (D-01).** No se probó con TalkBack porque la auditoría comenzó desde el login (el onboarding solo aparece en la primera apertura).
4. **Letra del sistema al máximo (D-15).** No se probó en dispositivo. La revisión de código confirma que no hay `allowFontScaling={false}` y que todos los textos tienen `lineHeight` explícito.
5. **"Quitar animaciones" del sistema operativo (D-16).** No se probó en dispositivo. La revisión de código confirma que el hook consulta `AccessibilityInfo.isReduceMotionEnabled`.
6. **Áreas táctiles pequeñas en la mazmorra (D-17).** No se probaron en dispositivo. La revisión de código confirma `AreaTactilMinima` en los componentes base.

### 6.2 Limitaciones del proyecto

7. **Medición de contraste sobre la aplicación instalada.** Los contrastes se calcularon sobre los valores hexadecimales del tema (`constants/retro.ts`) y no se midieron sobre la app instalada con una herramienta sobre pantalla.
8. **Cobertura de plataforma.** La entrega se limita a Android; no se evaluó iOS ni VoiceOver.
9. **Pruebas con usuarios.** No se realizaron pruebas con personas usuarias de tecnologías de apoyo.

## 7. Trazabilidad con el repositorio

| Hito | Mejoras asociadas | Commit |
|---|---|---|
| Tema Retro-Logic con paleta de contraste verificado | A-10b | `e7e7e27` |
| Componentes base accesibles: botón principal, tarjeta y barra de progreso | A-01, A-02, A-03, A-04, A-08 | `d276f9b` |
| Barra de pestañas inferior con etiqueta textual en cada pestaña | A-01 | `37b5efc` |
| Pantalla Concepto con jerarquía de encabezados y altura de línea | A-01, A-09 | `6951482` |
| Pantalla Resultado con ícono, texto, región viva y vibración opcional | A-06, A-07 | `bd9c31f` |
| Pantalla Mapa de niveles con niveles bloqueados en candado + texto | A-10a | `c1a3c8e` |
| Pantallas Splash animado y Onboarding con imágenes descritas | A-11 | `f3006f8` |
| Pantalla Login / Registro con errores bajo cada campo | A-12 | `5c3726f` |
| Pantalla Subida de nivel con versión estática y conexión al hook de reducir movimiento | A-13a, A-13c | `1fec44d`, `db9be72` |
| Contexto de preferencias de accesibilidad persistido con AsyncStorage | A-13b, A-16 | `9e97959` |
| FilaSwitch accesible y variante "peligro" del botón principal | A-02, A-03, A-04, A-15 | `5a84902` |
| Pantalla Configuración y accesibilidad (switches y cierre de sesión) | A-01, A-02, A-03, A-13b, A-15 | `abd2714`, `fbbad0d` |
| Editor de bloques sin arrastrar y mazmorra jugable | A-05, A-17 | `b7a080b`, `e58677d` |
| Escenario de la mazmorra con descripción para TalkBack | A-18 | `b7a080b` |
| Vibración en la mazmorra y resultado anunciado | A-07, A-19 | `733e1b1` |
| Panel de equipo con etiquetas semánticas | A-20 | `f875f45` |
| Guías "Cómo se usa" en la mazmorra | A-21 | `cec5fcf` |
| Configuración de `eslint-plugin-react-native-a11y` sin errores | A-14 | `317ae34` |
| Auditoría con TalkBack en dispositivo y prueba del APK final | Todas las verificadas en dispositivo | `6b32645`, `67f2ada` |
| Secciones 3 y 5 del documento final | Documento completo | `a6a0c57` |

**Nota sobre A-13:** el sistema "Reducir movimiento" está implementado en tres capas: preferencia persistida (`9e97959`), hook que combina preferencia y SO (`db9be72`), y pantallas que consumen el hook (`1fec44d`).

**Nota sobre A-15:** la pantalla Configuración tuvo dos autores. Tatiana Mayorga la implementó en `abd2714` y Ethian White la extendió en `fbbad0d` con una barra superior de estilo Retro-Logic.

**Nota sobre autoría de commits:** los commits `9e97959`, `5a84902`, `abd2714`, `cd52a03` y `7e1e555` fueron creados por Tatiana Mayorga y subidos a `origin/main` durante el desarrollo. Por operaciones de integración de ramas realizadas en el repositorio, el historial remoto actual no conserva esos hashes en `main`. El código asociado está presente en la versión entregada y es verificable en los archivos referenciados en la matriz. La totalidad de las mejoras descritas en esta sección está implementada y operativa en la versión que se entrega.