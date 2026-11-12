# Auditoría de accesibilidad en dispositivo

**Proyecto:** DevLevel · **Versión:** APK final (commit `cec5fcf`)
**Celular:** celular Android personal de Ethian, con el APK final instalado
**Fecha:** 12 de noviembre de 2026 · **Ejecutó:** Ethian White

## Preparación

1. Instalar el APK final y abrir `https://devlevel-api.onrender.com/health` para despertar el servidor.
2. **TalkBack:** Ajustes → Accesibilidad → TalkBack → activar. Se navega deslizando un dedo a la derecha o a la izquierda (siguiente o anterior elemento) y se activa con doble toque.
3. Para las pruebas de letra y movimiento: Ajustes → Pantalla → Tamaño de fuente al máximo, y Ajustes → Accesibilidad → Quitar animaciones.

Resultado: ✅ cumple · ⚠️ cumple con observaciones · ❌ no cumple. Tomar una captura de cada ⚠️ o ❌ y de las filas marcadas con 📷, y guardarlas en `docs/auditoria-dispositivo/`.

## Lista de verificación

| ID | Pantalla | Qué hacer | Qué debe pasar | Resultado | Observación |
|---|---|---|---|---|---|
| D-01 | Onboarding | Recorrer con TalkBack las 3 pantallas | Lee el título, el texto, "Página 1 de 3" y los botones Saltar y Siguiente | — No probado | Se empezó desde el login; el onboarding solo aparece en la primera apertura |
| D-02 | Login 📷 | Dejar el correo vacío y tocar Entrar | TalkBack anuncia el error del campo; el error se ve debajo del campo con ⚠ y texto | ❌ | El error se muestra debajo del campo con ⚠ y texto, pero TalkBack no lo anuncia solo: hay que llegar a él deslizando |
| D-03 | Login | Recorrer los campos | Lee "Correo" y "Contraseña" como campos de texto y "Mostrar contraseña" como botón | ✅ |  |
| D-04 | Mapa 📷 | Recorrer los niveles | Cada nivel dice número, título, región y estado (completado con estrellas, actual o bloqueado) | ✅ |  |
| D-05 | Pestañas | Recorrer la barra inferior | Cada pestaña se lee como pestaña, con su nombre y si está seleccionada | ✅ |  |
| D-06 | Concepto | Recorrer la guía "Cómo se usa" | Lee los títulos como encabezados y cada paso como "Paso N: …" | ✅ |  |
| D-07 | Mazmorra 📷 | Llegar al escenario | Describe en texto dónde está el héroe, hacia dónde mira y qué hay enfrente | ✅ | Describe el escenario en texto; también lee los emojis con su nombre |
| D-08 | Mazmorra | Agregar instrucciones con doble toque en la paleta | Cada botón dice "Agregar …"; no hace falta arrastrar nada | ✅ |  |
| D-09 | Mazmorra | Elegir una línea y usar ↑, ↓ y 🗑 | Las líneas se leen como "Línea N: …" con su estado de seleccionada; los botones dicen "Subir línea", "Bajar línea" y "Borrar línea" | ✅ |  |
| D-10 | Mazmorra | Ejecutar un hechizo que gana y uno que pierde | TalkBack anuncia solo "¡Saliste de la mazmorra!" o "No lo lograste" con el motivo | ✅ |  |
| D-11 | Mazmorra | Ejecutar con un error de escritura (modo texto) | Se anuncia la línea del error y la sugerencia | ✅ |  |
| D-12 | Subida de nivel | Terminar un nivel | Lee estrellas, XP, racha, hechizo nuevo y objeto ganado | ✅ |  |
| D-13 | Héroe → Equipo 📷 | Tocar una casilla y equipar un objeto | La casilla dice su espacio y qué tiene; los botones dicen "Equipar …" o "Quitar …" | ✅ |  |
| D-14 | Ajustes | Activar y desactivar cada opción | Cada interruptor dice su nombre y si está activado | ✅ |  |
| D-15 | Toda la app 📷 | Letra del sistema al máximo | Ningún texto se corta ni se monta sobre otro; los botones siguen siendo tocables | — No probado | Pendiente: letra del sistema al máximo |
| D-16 | Subida de nivel y mazmorra | Con "Quitar animaciones" activado | La subida de nivel se muestra estática y el héroe salta al resultado sin animarse | — No probado | Pendiente: "Quitar animaciones" |
| D-17 | Toda la app | Tocar botones pequeños (↑, ↓, 🗑, casillas de equipo) | Se tocan sin esfuerzo y sin activar el botón de al lado | — No probado | Pendiente |
| D-18 | Toda la app | Orden de lectura | TalkBack recorre cada pantalla de arriba hacia abajo, sin saltos ni elementos repetidos | ✅ |  |

## Resumen

| Resultado | Cantidad |
|---|---|
| ✅ Cumple | 13 |
| ⚠️ Con observaciones | 0 |
| ❌ No cumple | 1 (D-02) |
| No probado | 4 (D-01, D-15, D-16, D-17) |

### Hallazgo D-02 y corrección propuesta

Los errores del formulario de login aparecen como un elemento nuevo debajo del campo. Aunque ese elemento tiene `accessibilityRole="alert"` y `accessibilityLiveRegion="polite"` (`components/ui/campo-texto.tsx`), Android solo anuncia una región viva cuando cambia un contenido que ya estaba en pantalla, no cuando el elemento aparece por primera vez. Por eso TalkBack no lo lee solo.

**Corrección propuesta (siguiente versión):** al fallar la validación en `app/login.tsx` y `app/recuperar.tsx`, llamar a `AccessibilityInfo.announceForAccessibility` con los mensajes de error, como ya se hace con el resultado de la mazmorra en `components/mazmorra/pantalla-mazmorra.tsx`. No se incluyó en la versión entregada por falta de tiempo para generar y volver a probar el APK.
