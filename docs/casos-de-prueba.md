# DevLevel: casos de prueba funcionales

**Fecha de ejecución:** 12 de noviembre de 2026
**Ejecutó:** Ethian White
**Versión probada:** commit `e981a3d` de `main` (la misma del APK final)

## Entorno

| Pieza | Dónde |
|---|---|
| API | Producción en Render: `https://devlevel-api.onrender.com` |
| Base de datos | Supabase real (el mismo proyecto que usa el APK) |
| App | Versión web de la app (`npx expo start --web`) en tamaño de celular (375×812), conectada a Render |
| Cuenta de prueba | Una cuenta nueva creada por el propio caso CP-03, para empezar sin progreso |

Los casos de API se ejecutaron con un script que hace las peticiones HTTP en orden y compara la respuesta con lo esperado. Los casos de interfaz se ejecutaron a mano en la app y se guardó una captura de cada uno en [`casos-de-prueba/`](casos-de-prueba/).

## Resumen

| Grupo | Casos | Pasan |
|---|---|---|
| Autenticación y sesión | 10 | 10 |
| Perfil | 2 | 2 |
| Mapa y desbloqueo | 3 | 3 |
| Mazmorra (validación y errores del hechizo) | 6 | 6 |
| Completar nivel, objetos y progreso | 8 | 8 |
| Interfaz (validación, red y flujo completo) | 4 | 4 |
| **Total** | **33** | **33** |

Además, las 159 pruebas automáticas del backend (`cd backend && npm test`) pasan: 159 de 159.

---

## 1. Autenticación y sesión

| ID | Caso | Pasos y datos | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| CP-01 | El servidor responde | `GET /health` | 200 y `estado: ok` | 200, `estado: ok`, base de datos conectada (790 ms con el servicio despierto) | ✅ Pasa |
| CP-02 | Registro con datos inválidos | `POST /auth/register` con correo `correo-malo` y contraseña `123` | 400 con un mensaje por campo | 400. `email`: "El correo no tiene un formato válido". `password`: "La contraseña debe tener al menos 8 caracteres" | ✅ Pasa |
| CP-03 | Registro correcto | `POST /auth/register` con correo nuevo y contraseña de 12 caracteres | 201, sesión iniciada y perfil en nivel 1 | 201, token entregado, nivel 1 y 0 XP | ✅ Pasa |
| CP-04 | Registro con correo repetido | Repetir CP-03 con el mismo correo | 409 con error en el campo correo | 409. `email`: "Ya existe una cuenta con este correo" | ✅ Pasa |
| CP-05 | Login con contraseña incorrecta | `POST /auth/login` con la contraseña equivocada | 401 sin decir cuál dato falló | 401: "Correo o contraseña incorrectos" | ✅ Pasa |
| CP-06 | Login correcto | `POST /auth/login` con los datos de CP-03 | 200 y token | 200 y token | ✅ Pasa |
| CP-07 | Ruta protegida sin sesión | `GET /me` sin token y con un token inventado | 401 en los dos casos | 401 y 401: "La sesión no es válida o expiró" | ✅ Pasa |
| CP-08 | Renovar la sesión | `POST /auth/refresh` con el `refreshToken` | 200 y token nuevo | 200 y token nuevo | ✅ Pasa |
| CP-09 | Recuperar contraseña de un correo que no existe | `POST /auth/recuperar` con un correo sin cuenta | 200 con un mensaje que no revela si la cuenta existe | 200: "Si el correo tiene una cuenta, te enviamos un código para cambiar la contraseña." | ✅ Pasa |
| CP-10 | Restablecer con código incorrecto | `POST /auth/restablecer` con código `00000000` | 400 con error en el campo código | 400. `codigo`: "El código no es válido o ya venció. Pide uno nuevo." | ✅ Pasa |

## 2. Perfil

| ID | Caso | Pasos y datos | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| CP-11 | Elegir nombre y clase del héroe | `PATCH /me` con `nombreHeroe: Casos` y `avatar: mago` | 200 y perfil actualizado | 200, nombre "Casos" y avatar "mago" | ✅ Pasa |
| CP-12 | Nombre vacío y clase inexistente | `PATCH /me` con nombre `""` y avatar `dragon` | 400 con un mensaje por campo | 400. `nombreHeroe`: "El nombre de héroe debe tener entre 2 y 20 caracteres". `avatar`: "El avatar debe ser uno de: explorador, mago, guerrero" | ✅ Pasa |

## 3. Mapa y desbloqueo

| ID | Caso | Pasos y datos | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| CP-13 | Mapa de una cuenta nueva | `GET /mapa` | 5 unidades, 15 niveles y solo el nivel 1 disponible | 5 unidades, 15 niveles y disponible solo el nivel 1 | ✅ Pasa |
| CP-14 | Entrar a un nivel bloqueado | `GET /niveles/2` antes de completar el 1 | 403 | 403: "Este nivel todavía está bloqueado" | ✅ Pasa |
| CP-15 | La solución nunca viaja a la app | `GET /niveles/1` y buscar la solución en la respuesta | La respuesta trae la mazmorra pero no la solución | Reto de mazmorra 46 recibido y la solución no aparece en la respuesta | ✅ Pasa |

## 4. Mazmorra: validación y errores del hechizo

| ID | Caso | Hechizo enviado | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| CP-16 | Instrucción mal escrita | `avanzar()` | No gana; error con la línea y una sugerencia | Línea 1: "no conozco la instrucción 'avanzar()'. ¿Quisiste decir 'adelante()'?" | ✅ Pasa |
| CP-17 | Bloque sin cerrar | `REPETIR 3 VECES` / `adelante()` (sin `FIN`) | Error de lectura con la línea | Línea 1: "falta FIN para cerrar el REPETIR" | ✅ Pasa |
| CP-18 | Hechizo que no llega a la puerta | `girar_derecha()` | No gana; motivo y pista | "Tu hechizo terminó antes de llegar a la puerta", con pista | ✅ Pasa |
| CP-19 | Ciclo infinito | `MIENTRAS NO en_salida HACER` / `pasos = 1` / `FIN` | Se corta en el límite de 500 pasos y no se cuelga | "El hechizo se repitió demasiadas veces" | ✅ Pasa |
| CP-20 | Se acaba la energía | `MIENTRAS NO en_salida HACER` / `girar_derecha()` / `FIN` | Pierde por energía | "Te quedaste sin energía" | ✅ Pasa |
| CP-21 | Pista avanzada sin el objeto | `GET /retos/46/pista-avanzada` sin Pergamino ni Ojo de Odín | 403 | 403: "Necesitas equipar el Pergamino del sabio o el Ojo de Odín" | ✅ Pasa |

## 5. Completar nivel, objetos y progreso

| ID | Caso | Pasos y datos | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| CP-22 | Completar sin haber ganado | `POST /niveles/1/completar` después de solo intentos fallidos | 409 | 409: "Gana la mazmorra antes de completar el nivel" | ✅ Pasa |
| CP-23 | Ganar cumpliendo todos los objetivos ★ | Enviar la solución completa del nivel 1 | Gana y cumple los 2 objetivos extra | `correcta: true`, objetivos `[true, true]` | ✅ Pasa |
| CP-24 | Completar el nivel ganado | `POST /niveles/1/completar` | 3 estrellas, XP, objeto ganado y equipado solo | 3 estrellas, +50 XP, Botas veloces equipadas automáticamente, siguiente nivel: 2 | ✅ Pasa |
| CP-25 | Repetir un nivel ya completado | Ganar otra vez con la solución básica (cumple 1 de 2 objetivos) y completar | 0 XP la segunda vez; se guardan las mejores estrellas; no se repite el objeto | 0 XP, 2 estrellas en este intento, mejores estrellas 3 y sin objeto | ✅ Pasa |
| CP-26 | Inventario | `GET /inventario` | El objeto ganado y el equipo puesto | Objetos: Botas veloces; amuleto equipado: Botas veloces | ✅ Pasa |
| CP-27 | Equipar un objeto que no se tiene | `PATCH /me` con `equipo.arma: martillo_thor` | 400 | 400: "No tienes ese objeto en tu inventario" | ✅ Pasa |
| CP-28 | Desbloqueo del siguiente nivel | `GET /mapa` después de completar el nivel 1 | El nivel 2 queda disponible | Nivel 2 en estado "actual", 1 nivel completado | ✅ Pasa |
| CP-29 | Libro de hechizos | `GET /hechizos` | 1 de 15 hechizos desbloqueados | 1 de 15 desbloqueados | ✅ Pasa |

## 6. Interfaz

| ID | Caso | Pasos | Resultado esperado | Resultado obtenido | Estado | Evidencia |
|---|---|---|---|---|---|---|
| UI-01 | Errores debajo de cada campo | Crear cuenta con correo `correo-malo`, contraseña `123` y confirmación `456` | Cada campo muestra su error debajo, con ⚠ y texto, sin enviar nada al servidor | "El correo no tiene un formato válido", "La contraseña debe tener al menos 8 caracteres" y "Las contraseñas no coinciden", cada uno debajo de su campo | ✅ Pasa | [captura](casos-de-prueba/ui-01-validacion-registro.jpg) |
| UI-02 | Sin conexión con el servidor | Abrir la app apuntando a un servidor que no responde e intentar entrar | Mensaje claro de error de red, sin cerrarse ni quedarse cargando | Alerta: "No hay conexión con el servidor. Revisa tu internet." y el botón Entrar vuelve a estar disponible | ✅ Pasa | [captura](casos-de-prueba/ui-02-sin-conexion.jpg) |
| UI-03 | Resolver una mazmorra con bloques | Login → mapa → nivel 2 → Entrar a la mazmorra → armar 13 bloques tocando la paleta → Ejecutar hechizo | El héroe recorre la mazmorra, derrota al goblin y sale; se muestran las estrellas | "¡Saliste de la mazmorra!" con 3 de 3 estrellas y el botón Terminar nivel | ✅ Pasa | [captura](casos-de-prueba/ui-03-mazmorra-ganada.jpg) |
| UI-04 | Subida de nivel con objeto | Tocar Terminar nivel después de UI-03 | Subida de nivel, XP, racha, hechizo nuevo y objeto ganado con su ícono | Nivel 1 → 2, +50 XP, Hechizo del Orden, "¡Ganaste un objeto!: Daga de madera" con su ícono pixel art y "Se equipó automáticamente" | ✅ Pasa | [captura](casos-de-prueba/ui-04-subida-nivel-objeto.jpg) |

---

## Pruebas automáticas

```bash
cd backend
npm test
```

Resultado del 12 de noviembre: **159 pruebas, 159 pasan, 0 fallan**. Cubren autenticación, recuperación de contraseña, retos, completar nivel, mazmorras, inventario y equipo, el motor del juego (lector, simulador, combate, objetos y sorteo de míticos), que las 15 mazmorras se puedan ganar y que la copia del motor en la app sea idéntica a la del backend.

En la app: `npx tsc --noEmit` sin errores y `npm run lint` (con las reglas de accesibilidad de `eslint-plugin-react-native-a11y`) sin advertencias.

## Observaciones

- Con el servicio dormido, la primera petición a Render tarda unos 50 segundos (plan gratis). Con el servicio despierto, las respuestas tardan menos de 1 segundo.
- La auditoría con TalkBack en un celular físico es una prueba aparte, a cargo de Tatiana (sección 3 del documento).
