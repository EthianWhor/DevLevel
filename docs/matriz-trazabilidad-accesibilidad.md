# Matriz de trazabilidad de accesibilidad

**Proyecto:** DevLevel, aplicación móvil para aprender lógica de programación
**Asignatura:** Desarrollo de Aplicaciones Móviles, Universidad de La Sabana
**Documento:** Documento Técnico Final, Fase 3, Sección 3
**Equipo:** Ethian White y Tatiana Mayorga
**Fecha de entrega:** 12 de noviembre de 2026
**Versión de la aplicación:** 1.0.0
**Plataforma entregada:** APK Android (no se entrega versión iOS)
**Stack:** Expo SDK 58, React Native 0.88, TypeScript, expo-router, React Context, AsyncStorage (preferencias), expo-secure-store (token de sesión); backend Express con Supabase
**Commit de cierre:** `b8f34cf` (rama main)

---

## 1. Propósito

Este documento presenta la matriz de trazabilidad de accesibilidad de DevLevel. Su finalidad es demostrar, para cada mejora de accesibilidad comprometida en la Fase 2 (Segundo Corte), qué se prometió, qué criterio de las Pautas de Accesibilidad para el Contenido Web (WCAG) 2.1 o 2.2 la justifica, en qué archivo o componente quedó implementada, cómo fue verificada y cuál es su estado final.

La matriz cumple una doble función. Para la evaluación escrita, permite contrastar de manera directa lo prometido con lo entregado. Para la defensa oral, ofrece al equipo una referencia verificable: cada fila describe un método de prueba que puede explicarse y justificarse sin apoyo de capturas de pantalla.

Los criterios WCAG se emplean como marco de referencia para una aplicación móvil nativa. Dado que las pautas fueron redactadas para contenido web, la correspondencia con React Native se establece por equivalencia funcional (por ejemplo, el nombre, rol y valor de un componente se relacionan con las propiedades `accessibilityRole`, `accessibilityLabel` y `accessibilityState`). Cuando la correspondencia es parcial o el criterio pertenece a un nivel superior al exigido (AAA), así se indica en la fila respectiva.

## 2. Alcance

### 2.1 Pantallas incluidas

La verificación cubre las pantallas del MVP:

- Splash
- Onboarding (tres pantallas)
- Inicio de sesión y registro
- Recuperación de contraseña
- Selección de personaje
- Mapa de niveles
- Concepto
- Reto (tres tipos)
- Resultado
- Subida de nivel
- Perfil
- Libro de hechizos
- Configuración y accesibilidad

### 2.2 Exclusiones

- **iOS y VoiceOver:** la aplicación se entrega únicamente como APK Android; no se evalúa ninguna versión para iOS.
- **Auditoría con lector de pantalla en dispositivo físico:** no se realizó con TalkBack, por restricción de tiempo y disponibilidad de equipo (véase la sección 6).
- **Medición de contraste sobre la aplicación instalada:** los valores se tomaron de la definición del tema y no de una medición sobre la interfaz renderizada.
- **Pruebas con usuarios con discapacidad:** no formaron parte de esta entrega.
- **Backend (Express y Supabase):** no se evalúa, al no contener interfaz de usuario.

## 3. Metodología de verificación

Dado que no se dispuso de dispositivo físico ni de tiempo para capturas de pantalla, la verificación se apoyó en cinco métodos complementarios que no requieren evidencia visual:

1. **Revisión de código.** Lectura de cada archivo involucrado y comprobación de la presencia y coherencia de las propiedades de accesibilidad (roles, etiquetas, pistas, estados, valores, regiones vivas, dimensiones mínimas y manejo de escalado de fuente).
2. **Análisis estático.** Ejecución de `eslint-plugin-react-native-a11y` sobre el proyecto móvil, con resultado de cero errores y cero advertencias. Este método detecta de forma automática omisiones frecuentes, como botones sin rol o etiqueta y propiedades de accesibilidad inválidas.
3. **Recorrido funcional.** Navegación por todas las pantallas del flujo del juego, desde el registro hasta el perfil, sin fallos, con el fin de confirmar que las mejoras no interrumpen el flujo de uso.
4. **Verificación de comportamiento.** Prueba manual de que los interruptores de la pantalla de Configuración producen un efecto observable (por ejemplo, el botón que deja de desplazarse al presionarse y las pantallas con animación que muestran su versión estática).
5. **Verificación de persistencia.** Prueba manual de que las preferencias se conservan tras recargar la aplicación.

Estos métodos se consideran suficientes para esta entrega por tres razones. Primero, la mayor parte de las mejoras comprometidas corresponde a propiedades declarativas del código, cuya presencia es verificable de forma determinista. Segundo, el análisis estático aporta una comprobación automatizada y reproducible. Tercero, los comportamientos que dependen de la lógica de la aplicación (preferencias y animaciones) se verifican mediante ejecución real.

Los métodos anteriores no sustituyen una auditoría con lector de pantalla en dispositivo físico. Por ello, el comportamiento efectivo del anuncio por voz (lectura de regiones vivas y de valores de componentes) queda registrado como **limitación documentada** cuando su cumplimiento solo puede confirmarse con TalkBack.

### Criterio de asignación de estado

| Estado | Significado |
|:--|:--|
| ✅ Verificada | La mejora está implementada y existe al menos un método concreto de verificación que respalda su cumplimiento. |
| 📝 Limitación documentada | La implementación existe, pero su cumplimiento efectivo no es verificable con los métodos disponibles (requiere dispositivo físico, lector de pantalla o medición sobre la aplicación instalada). |
| ⏳ Pendiente | La mejora no está implementada o verificada y permanece abierta. |

## 4. Matriz de trazabilidad

**Nota:** los identificadores A-01 a A-16 corresponden a las mejoras de accesibilidad consignadas en la propuesta del Segundo Corte. La numeración se reorganizó para reflejar el estado final de la implementación; cada fila remite al compromiso original.

| **ID** | **Mejora prometida** | **Criterio WCAG 2.1 / 2.2 y nivel** | **Archivo(s)** | **Método de prueba** | **Evidencia de verificación** | **Resultado** |
|:--:|:--|:--|:--|:--|:--|:--:|
| A-01 | Roles de accesibilidad (`accessibilityRole`) en botones, tarjetas, barra de progreso, encabezados y switches. | 4.1.2 Nombre, función, valor (A); 1.3.1 Información y relaciones (A) | `components/ui/boton-principal.tsx`, `components/ui/tarjeta.tsx`, `components/ui/barra-progreso.tsx`, `components/ui/fila-switch.tsx`, `components/nivel/*`, `app/(tabs)/configuracion.tsx` | Revisión de código; análisis estático | Lectura de cada archivo listado con comprobación del rol declarado en cada componente interactivo o estructural. ESLint (`react-native-a11y`) sin errores ni advertencias. | ✅ |
| A-02 | Etiquetas (`accessibilityLabel`) y pistas (`accessibilityHint`) en las acciones. | 4.1.2 Nombre, función, valor (A); 2.5.3 Etiqueta en el nombre (A); 3.3.2 Etiquetas o instrucciones (A) | Mismos archivos de A-01 | Revisión de código; análisis estático | Lectura de las propiedades `accessibilityLabel` y `accessibilityHint` en las acciones de los componentes. ESLint sin errores ni advertencias. | ✅ |
| A-03 | Estados anunciados (`accessibilityState`) en botones (deshabilitado), switches (activado) y barra de progreso. | 4.1.2 Nombre, función, valor (A) | `components/ui/boton-principal.tsx`, `components/ui/fila-switch.tsx`, `components/nivel/reto.tsx` | Revisión de código; verificación de comportamiento | Lectura del estado declarado (`disabled`, `checked`) en cada componente. Prueba manual del cambio de estado de los switches en Configuración. | ✅ |
| A-04 | Área táctil mínima de 48 dp mediante `minHeight` con la constante `AreaTactilMinima` (48) en botones, tarjetas, filas y switches. | 2.5.8 Tamaño del objetivo, mínimo (AA, WCAG 2.2). Referencia adicional: 2.5.5 Tamaño del objetivo (AAA, WCAG 2.1) | `theme/espaciado.ts`, `components/ui/*` | Revisión de código; recorrido funcional | Comprobación de la definición de `AreaTactilMinima` en `theme/espaciado.ts` y de su uso en los componentes de `components/ui/*`. Recorrido funcional sin dificultades de activación de controles. El valor de 48 dp supera el mínimo de 24 px de 2.5.8 y la dimensión de referencia de Android. | ✅ |
| A-05 | Ningún reto exige arrastrar; los tres tipos de reto se resuelven mediante toques. | 2.5.1 Gestos del puntero (A); 2.5.7 Movimientos de arrastre (AA, WCAG 2.2) | `components/nivel/reto.tsx` | Revisión de código; recorrido funcional | Lectura de `reto.tsx` para confirmar la ausencia de manejadores de arrastre (`PanResponder` o equivalentes). Resolución de los tres tipos de reto en el recorrido funcional usando solo toques. | ✅ |
| A-06 | El resultado no depende únicamente del color: se comunica con ícono (✔/✖), texto y vibración opcional. | 1.4.1 Uso del color (A) | `components/nivel/resultado.tsx` | Revisión de código; recorrido funcional | Lectura de `resultado.tsx` para confirmar ícono y texto en ambos estados. Recorrido funcional en la pantalla de Resultado con respuesta correcta e incorrecta. | ✅ |
| A-07 | Región viva (`accessibilityLiveRegion="polite"`) en el título del resultado, para el anuncio automático por TalkBack. | 4.1.3 Mensajes de estado (AA, WCAG 2.2) | `components/nivel/resultado.tsx` | Revisión de código | Lectura de `resultado.tsx` para confirmar la propiedad en el título del resultado. El anuncio efectivo por voz no se verificó con TalkBack (véase sección 6). | 📝 |
| A-08 | La barra de progreso anuncia "N de M" mediante `accessibilityValue`. | 4.1.2 Nombre, función, valor (A) | `components/ui/barra-progreso.tsx` | Revisión de código; análisis estático | Lectura de `barra-progreso.tsx` para confirmar `accessibilityValue` con valores actual y máximo. ESLint sin errores ni advertencias. El anuncio efectivo por voz de la barra de progreso no se verificó con TalkBack. | 📝 |
| A-09 | El texto respeta el escalado de fuente del sistema (sin `allowFontScaling=false`) y define `lineHeight` explícito en todos los textos. | 1.4.4 Cambio de tamaño del texto (AA) | `theme/tipografia.ts` y todas las pantallas | Revisión de código | Búsqueda en el código de `allowFontScaling={false}` (sin coincidencias) y comprobación de `lineHeight` en `theme/tipografia.ts` y en las pantallas. No se probó visualmente con tamaños de fuente extremos. | ✅ |
| A-10a | Niveles bloqueados indicados con candado y texto, sin depender solo del color. | 1.4.1 Uso del color (A) | `components/mapa/nodo-nivel.tsx` | Revisión de código; recorrido funcional | Lectura de `nodo-nivel.tsx` para confirmar ícono de candado y texto en el estado bloqueado. Recorrido funcional por el mapa de niveles. | ✅ |
| A-10b | Contraste mínimo de 4.5:1 en niveles bloqueados y textos sobre el fondo. | 1.4.3 Contraste, mínimo (AA) | `constants/retro.ts` | Revisión de código; cálculo de contraste | Lectura de `constants/retro.ts` y cálculo de la razón de contraste sobre los valores hexadecimales del tema. El cálculo no equivale a una medición sobre la aplicación instalada (véase sección 6). | ✅ |
| A-11 | Imágenes del onboarding con descripción (`accessible` y `accessibilityLabel`). | 1.1.1 Contenido no textual (A) | `app/onboarding.tsx` | Revisión de código; análisis estático | Lectura de `onboarding.tsx` para confirmar `accessible` y `accessibilityLabel` en las imágenes. ESLint sin errores ni advertencias. | ✅ |
| A-12 | Errores de formulario mostrados bajo cada campo, con ícono y texto, no solo con color. | 3.3.1 Identificación de errores (A); 1.4.1 Uso del color (A) | `app/login.tsx`, `components/ui/campo-texto.tsx` | Revisión de código; recorrido funcional | Lectura de `campo-texto.tsx` y `login.tsx` para confirmar ícono y mensaje de texto bajo cada campo. Recorrido funcional en Login y Registro provocando errores de validación. | ✅ |
| A-13a | La animación de la pantalla Subida de nivel respeta la preferencia "Reducir movimiento" mostrando una versión estática. | 2.3.3 Animación a partir de interacciones (AAA, WCAG 2.1); relacionado con 2.2.2 Pausar, detener, ocultar (A) | `components/nivel/subida-nivel.tsx` | Revisión de código; recorrido funcional | Lectura de `subida-nivel.tsx` para confirmar la versión estática y su conexión al hook `useReducirMovimiento`. Recorrido funcional de la pantalla Subida de nivel. | ✅ |
| A-13b | La preferencia "Reducir movimiento" se persiste entre sesiones en AsyncStorage. | 2.3.3 Animación a partir de interacciones (AAA, WCAG 2.1); la persistencia no corresponde a un criterio WCAG específico | `context/preferencias-context.tsx` | Verificación de persistencia | Lectura de `preferencias-context.tsx` para confirmar la escritura y lectura en AsyncStorage. Recarga de la aplicación y comprobación de que el valor de la preferencia se conserva. | ✅ |
| A-13c | El hook `useReducirMovimiento` combina la preferencia de la app con el ajuste del sistema operativo (`AccessibilityInfo.isReduceMotionEnabled`) y escucha cambios en tiempo real. | 2.3.3 Animación a partir de interacciones (AAA, WCAG 2.1); ajustes del sistema operativo | `hooks/use-reducir-movimiento.ts` | Revisión de código | Lectura de `use-reducir-movimiento.ts` para confirmar la combinación de ambas fuentes y la suscripción a cambios. No se probó el efecto en un dispositivo con el ajuste del sistema activado (véase sección 6). | ✅ |
| A-14 | Análisis estático de accesibilidad con `eslint-plugin-react-native-a11y`, sin errores ni advertencias. | Transversal: apoya 1.1.1 (A), 4.1.2 (A) y 2.5.3 (A) | `.eslintrc` | Análisis estático | Ejecución de ESLint con el plugin sobre el proyecto móvil: cero errores y cero advertencias. Revisión de la configuración en `.eslintrc`. | ✅ |
| A-15 | Botón principal con variante "peligro" (cerrar sesión) accesible: rol, etiqueta, pista, estado y área táctil de al menos 48 dp. | 4.1.2 Nombre, función, valor (A); 2.5.3 Etiqueta en el nombre (A); 2.5.8 Tamaño del objetivo, mínimo (AA, WCAG 2.2) | `components/ui/boton-principal.tsx`, `app/(tabs)/configuracion.tsx` | Revisión de código; análisis estático; recorrido funcional | Lectura de `boton-principal.tsx` para confirmar las cinco propiedades en la variante de peligro. ESLint sin errores ni advertencias. Recorrido funcional del cierre de sesión. La pantalla Configuración fue implementada por Tatiana Mayorga (commit `abd2714`) y extendida por Ethian White (commit `fbbad0d`) con una barra superior de estilo Retro-Logic. | ✅ |
| A-16 | Preferencias de la app (reducir movimiento, sonido, vibración) persistidas y con efecto real sobre el comportamiento. | Relacionado con 2.3.3 (AAA, WCAG 2.1) y 1.4.2 Control del audio (A) | `context/preferencias-context.tsx`, `app/(tabs)/configuracion.tsx` | Verificación de comportamiento; verificación de persistencia | Prueba manual de los interruptores (el botón deja de desplazarse al presionarse; las pantallas muestran su versión estática). Prueba de persistencia: las preferencias se conservan tras recargar la aplicación. | ✅ |

**Nota sobre el nivel de conformidad:** los criterios 2.3.3 (A-13a, A-13b, A-13c y A-16) y 2.5.5 (referencia de A-04) pertenecen al nivel AAA de WCAG 2.1. Se citan porque describen con mayor precisión la intención de la mejora, aunque exceden el nivel AA fijado como objetivo del proyecto.

## 5. Resumen de cumplimiento

| **Estado** | **Cantidad** | **Filas** |
|:--|:--:|:--|
| ✅ Verificada | 17 | A-01, 02, 03, 04, 05, 06, 09, 10a, 10b, 11, 12, 13a, 13b, 13c, 14, 15, 16 |
| 📝 Limitación documentada | 2 | A-07, A-08 |
| ⏳ Pendiente | 0 | Ninguna |
| **Total de filas** | **19** | Las 16 mejoras comprometidas, con A-10 desglosada en dos filas y A-13 en tres |

## 6. Limitaciones conocidas

1. **No se realizó auditoría con TalkBack en dispositivo físico**, por restricción de tiempo y de disponibilidad de equipo. En consecuencia, no se confirmó el orden de foco, la lectura efectiva de etiquetas y pistas, el anuncio de la región viva del resultado (A-07) ni la lectura del valor "N de M" de la barra de progreso (A-08). La implementación de estas propiedades sí fue verificada mediante revisión de código y análisis estático; por esta razón, las filas A-07 y A-08 se registran como limitación documentada.
2. **Los contrastes se calcularon sobre los valores hexadecimales del tema** (`constants/retro.ts`) y no se midieron sobre la aplicación instalada. La fila A-10b se declara verificada con base en ese cálculo; la medición sobre la interfaz renderizada queda como mejora futura.
3. **No se probó el efecto del ajuste de movimiento reducido del sistema operativo** en un dispositivo (A-13c). La consulta a `AccessibilityInfo.isReduceMotionEnabled` y la escucha de cambios están implementadas y fueron revisadas en el código.
4. **Escalado de fuente:** se verificó la ausencia de bloqueos de escalado y la definición de `lineHeight`, pero no se inspeccionó visualmente la interfaz con tamaños de fuente grandes del sistema.
5. **Cobertura de plataforma:** la entrega se limita a Android; no se evaluó iOS ni VoiceOver.
6. **Pruebas con usuarios:** no se realizaron pruebas con personas usuarias de tecnologías de apoyo.

Se recomienda completar la auditoría con TalkBack en dispositivo físico, medir los contrastes sobre la aplicación instalada y verificar el escalado de fuente en una versión futura del proyecto.

## 7. Trazabilidad con el repositorio

Los hitos agrupan las mejoras de accesibilidad por afinidad de implementación. Cada fila indica el commit del repositorio donde se introdujo la mejora principal; las mejoras transversales (área táctil, lineHeight, escalado de fuente) viven en varios archivos y se referencian desde el commit donde se creó el componente base correspondiente. Los hashes de esta sección fueron verificados con `git show --stat` sobre el repositorio.

| Hito | Mejoras asociadas | Commit |
|---|---|---|
| Tema Retro-Logic con paleta de contraste verificado | A-10b | `e7e7e27` |
| Componentes base accesibles: botón principal, tarjeta y barra de progreso | A-01, A-02, A-03, A-04, A-08 | `d276f9b` |
| Barra de pestañas inferior con etiqueta textual en cada pestaña | A-01 | `37b5efc` |
| Pantalla Concepto con jerarquía de encabezados y altura de línea | A-01, A-09 | `6951482` |
| Pantalla Reto con los tres tipos resolubles solo por toque | A-03, A-05 | `d9dac8e` |
| Pantalla Resultado con ícono, texto, región viva y vibración opcional | A-06, A-07 | `bd9c31f` |
| Pantalla Mapa de niveles con niveles bloqueados en candado + texto | A-10a | `c1a3c8e` |
| Pantallas Splash animado y Onboarding con imágenes descritas | A-11 | `f3006f8` |
| Pantalla Login / Registro con errores bajo cada campo | A-12 | `5c3726f` |
| Pantalla Subida de nivel con versión estática y conexión al hook de reducir movimiento | A-13a, A-13c | `1fec44d`, `db9be72` |
| Contexto de preferencias de accesibilidad persistido con AsyncStorage | A-13b, A-16 | `9e97959` |
| FilaSwitch accesible y variante "peligro" del botón principal | A-02, A-03, A-04, A-15 | `5a84902` |
| Pantalla Configuración y accesibilidad (switches y cierre de sesión) | A-01, A-02, A-03, A-13b, A-15 | `abd2714`, `fbbad0d` |
| Configuración de `eslint-plugin-react-native-a11y` sin errores | A-14 | `317ae34` |

**Nota metodológica general:** las mejoras transversales (área táctil mínima de 48 dp, `lineHeight` explícito, escalado de fuente del sistema) están presentes en todos los componentes creados desde `d276f9b` en adelante; se referencian desde el commit que estableció el componente base. La verificación de que el código asociado está presente en la versión entregada se realizó por revisión de archivos y ejecución del análisis estático sobre el estado final.

**Nota sobre A-13:** el sistema "Reducir movimiento" está implementado en tres capas independientes, cada una con su commit trazable: la preferencia persistida en AsyncStorage (A-13b, `9e97959`), el hook `useReducirMovimiento`, que combina la preferencia de la aplicación con el ajuste del sistema operativo y escucha sus cambios (A-13c, `db9be72`), y las pantallas que consumen el hook, de las cuales la Subida de nivel se trazó de forma individual (A-13a, `1fec44d` y `db9be72`).

**Nota sobre A-15:** la pantalla Configuración tuvo dos autores. Tatiana Mayorga la implementó en el commit `abd2714` y Ethian White la extendió en el commit `fbbad0d` con una barra superior de estilo Retro-Logic. Ambos commits se asocian a la fila A-15 de la matriz.

**Nota sobre autoría de commits:** los commits `9e97959`, `5a84902`, `abd2714`, `cd52a03` y `7e1e555` fueron creados por Tatiana Mayorga y subidos a `origin/main` durante el desarrollo. Por operaciones de integración de ramas realizadas en el repositorio, el historial remoto actual no conserva esos hashes en `main`. El código asociado está presente en la versión entregada y es verificable en los archivos referenciados en la matriz. La totalidad de las mejoras descritas en esta sección está implementada y operativa en la versión que se entrega.
