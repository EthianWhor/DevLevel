# 4. Pruebas y validación

**Proyecto:** DevLevel, aplicación móvil para aprender lógica de programación
**Asignatura:** Desarrollo de Aplicaciones Móviles, Universidad de La Sabana
**Documento:** Documento Técnico Final, Fase 3, Sección 4
**Equipo:** Ethian White y Tatiana Mayorga
**Fecha de entrega:** 12 de noviembre de 2026

---

## 4.1 Estrategia

Las pruebas se organizaron en cuatro niveles, de lo más automático a lo más cercano al usuario:

| Nivel | Qué se prueba | Herramienta | Cuándo se ejecuta |
|---|---|---|---|
| 1. Revisión estática | Tipos en la app y en el backend; reglas de accesibilidad en la app | TypeScript (`tsc`), ESLint con `eslint-plugin-react-native-a11y` | Antes de cada commit |
| 2. Pruebas automáticas | API completa, reglas del juego y motor de mazmorras | `node:test` sobre la API real con una base de datos falsa en memoria | Antes de cada commit al backend |
| 3. Casos funcionales | El sistema desplegado de punta a punta: app, API en Render y Supabase | Script de peticiones HTTP y pruebas manuales en la app | Al cerrar la versión final |
| 4. Accesibilidad | Lector de pantalla, letra grande, áreas táctiles, contraste y reducir movimiento | TalkBack y ajustes de accesibilidad de Android sobre el APK final (4.5) y la matriz de trazabilidad (sección 3) | Con el APK final |
| 5. Rendimiento | Tiempos de respuesta de la API, arranque en frío del servidor y costo del motor | Mediciones con un script contra Render y en el computador de desarrollo (4.6) | Al cerrar la versión final |

La regla del equipo fue no subir cambios a `main` sin pasar los niveles 1 y 2, porque Render despliega automáticamente cada cambio.

## 4.2 Pruebas automáticas del backend

Las pruebas levantan la API real de Express en un puerto libre y le hacen peticiones HTTP, igual que la app. En lugar de Supabase usan una base de datos falsa en memoria (`test/supabase-falso.ts`) que imita las consultas, la autenticación y los códigos de recuperación. Por eso no necesitan credenciales, no tocan datos reales y se pueden ejecutar sin internet. El azar del sorteo de míticos se puede reemplazar en las pruebas (`lib/azar.ts`) para que los resultados sean repetibles.

**Resultado final: 159 pruebas, 159 pasan, 0 fallan.**

| Archivo | Qué cubre |
|---|---|
| `auth.test.ts` | Registro, login, renovación de sesión, rutas protegidas sin token, `GET /me` y `PATCH /me` |
| `recuperar.test.ts` | Código de recuperación: no revela si el correo existe, código incorrecto, código de un solo uso |
| `retos.test.ts` | Responder retos y completar niveles: estrellas, XP, subida de nivel, racha, repetir niveles y niveles bloqueados |
| `progreso.test.ts` | Reglas puras: nivel según la XP, estrellas y racha con la fecha de Colombia |
| `hechizos.test.ts` | Libro de hechizos: bloqueados sin contenido, desbloqueo al completar, progreso por usuario |
| `lector.test.ts` | Lenguaje de las mazmorras: instrucciones, estructuras, variables, funciones, normalización y mensajes de error con línea y sugerencia |
| `simulador.test.ts` | Movimiento, choques, pinchos, saltos, monedas, combate, energía, límite de 500 pasos, objetivos y el efecto de cada objeto (incluidos los 10 míticos) |
| `objetos.test.ts` | Estadísticas del equipo y sorteo del mítico con la probabilidad decreciente |
| `contenido.test.ts` | Las 15 mazmorras se pueden ganar y sus objetivos extra se pueden cumplir |
| `mazmorras.test.ts` | `responder` y `completar` con mazmorras: inventario, equipo, equipo automático, pista avanzada y que la solución no se envíe |
| `bloques.test.ts` | El editor de bloques de la app: insertar, mover, borrar y convertir a texto |
| `motor-copia.test.ts` | La copia del motor en la app es idéntica a la del backend |

La prueba de `contenido.test.ts` es la que más protege el juego: ejecuta la solución y la solución con todos los objetivos de cada una de las 15 mazmorras, así cualquier cambio en el motor o en un mapa que deje un nivel imposible se detecta antes de publicarlo.

## 4.3 Casos de prueba funcionales

Se ejecutaron 33 casos contra el sistema desplegado (API en Render y Supabase real), con la misma versión del APK final. El detalle de cada caso (pasos, datos, resultado esperado y obtenido) y las capturas están en [`casos-de-prueba.md`](casos-de-prueba.md).

| Grupo | Casos | Pasan | Ejemplos |
|---|---|---|---|
| Autenticación y sesión | 10 | 10 | Datos inválidos con mensaje por campo, correo repetido, contraseña incorrecta, token falso, renovación, recuperación |
| Perfil | 2 | 2 | Nombre y clase válidos e inválidos |
| Mapa y desbloqueo | 3 | 3 | Solo el nivel 1 disponible al inicio, nivel bloqueado, la solución no llega a la app |
| Mazmorra | 6 | 6 | Instrucción mal escrita con sugerencia, falta `FIN`, ciclo infinito, sin energía |
| Progreso y objetos | 8 | 8 | 3 estrellas con objeto equipado automáticamente, repetir da 0 XP, equipar un objeto que no se tiene |
| Interfaz | 4 | 4 | Errores debajo de cada campo, sin conexión, mazmorra resuelta con bloques, subida de nivel con objeto |
| **Total** | **33** | **33** | |

Los casos de error de red y de validación cubren lo que el usuario ve cuando algo sale mal:

- **Sin conexión:** la app muestra "No hay conexión con el servidor. Revisa tu internet." y el botón vuelve a estar disponible; no se cierra ni se queda cargando.
- **Validación:** cada campo muestra su propio error debajo, con ⚠ y texto, antes de enviar nada al servidor. El servidor vuelve a validar y responde con el mismo formato.
- **Servidor dormido:** la app espera hasta 60 segundos (lo que tarda Render en despertar) antes de mostrar un error de tiempo.

## 4.4 Defectos encontrados y corregidos

Las pruebas encontraron estos problemas antes de la entrega. Cada uno se corrigió en su propio commit:

| Defecto | Cómo se encontró | Corrección |
|---|---|---|
| La vida y la energía de la mazmorra no se actualizaban al cambiar el equipo | Prueba en la app: equipar un objeto dentro de la mazmorra | Recalcular el estado inicial al cambiar el equipo (`734bad1`) |
| El teclado tapaba los campos de los formularios y el editor de código | Prueba en un celular | `react-native-keyboard-controller` con desplazamiento automático al campo activo (`d1d764e`) |
| Al ejecutar el hechizo no se veía al héroe moverse, porque el escenario quedaba fuera de la pantalla | Prueba en un celular con el APK | Desplazar al escenario al ejecutar y al resultado al terminar (`733e1b1`) |
| No quedaba claro cómo equipar un objeto ganado | Prueba en un celular con el APK | Equipo automático si el espacio está vacío (`ccade3b`) y panel con la silueta del héroe y sus casillas (`f875f45`) |
| Los íconos de las reliquias eran emojis y no seguían el estilo pixel art | Revisión visual | Íconos pixel art de 16×16 para los 25 objetos (`59fd989`) |
| Avisos de accesibilidad del linter | ESLint con reglas de accesibilidad | Correcciones en los componentes señalados (`317ae34`) |
| Con bloques no se podían armar las soluciones con todas las ★ de los niveles 4 y 6: no había forma de usar una segunda variable, de volver a darle valor a `pasos` ni de agregar algo después de un REPETIR o SI anidado | Prueba de los niveles con bloques y comentarios de uso ("no se entiende cómo usar la variable") | Tocar el FIN de un bloque agrega después de él, botón "nombre ⟳" en las variables y "usar …" recorre todas las variables (`e58677d`). Además, cada nivel explica qué tocar para usar lo nuevo (`cec5fcf`). Verificado armando con bloques la solución completa del nivel 4: 3 de 3 estrellas |

## 4.5 Auditoría de accesibilidad en dispositivo

<!-- PENDIENTE: completar con los resultados de la prueba en el celular con el APK final (ver auditoria-dispositivo.md). -->

Prueba manual sobre el APK final instalado en un celular Android, con TalkBack activado, la letra grande del sistema y la opción "Quitar animaciones". La lista de verificación completa está en [`auditoria-dispositivo.md`](auditoria-dispositivo.md).

## 4.6 Rendimiento

**Tiempos de respuesta de la API** (Render, plan gratis, medidos el 12 de noviembre de 2026 desde Colombia con el servicio despierto; 7 peticiones por ruta):

| Ruta | Mediana | Mínimo | Máximo |
|---|---|---|---|
| `GET /health` | 207 ms | 181 ms | 297 ms |
| `POST /auth/login` | 427 ms | 382 ms | 507 ms |
| `GET /me` | 334 ms | 284 ms | 645 ms |
| `GET /mapa` | 268 ms | 230 ms | 355 ms |
| `GET /niveles/1` | 344 ms | 281 ms | 431 ms |
| `POST /retos/:id/responder` (ejecuta el programa en el servidor) | 508 ms | 479 ms | 653 ms |
| `GET /inventario` | 302 ms | 257 ms | 337 ms |
| `GET /hechizos` | 283 ms | 254 ms | 304 ms |

- **Arranque en frío:** con el servicio dormido, la primera petición tardó 13,9 s en esta medición; Render indica que puede llegar a unos 50 s. La app espera hasta 60 s antes de mostrar un error.
- **Ejecución del hechizo:** `responder` es la ruta más lenta porque lee el reto y el equipo, ejecuta el programa y guarda el intento. Aun así, la app no hace esperar al jugador: mientras llega la respuesta ya está animando al héroe con su propia simulación (sección 2.5.1). Cada paso de la animación dura 320 ms, así que con 2 pasos o más la respuesta suele llegar antes de que termine la animación.
- **Motor de mazmorras:** el programa más largo del juego se ejecuta en unos 0,2 ms, y un ciclo infinito se corta en el límite de 500 pasos en unos 0,1 ms. El costo del motor es despreciable frente al de la red.

## 4.7 Limitaciones conocidas

- **Render en plan gratis:** la primera petición después de 15 minutos sin uso tarda unos 50 segundos. Antes de la demo hay que abrir `/health` para despertar el servicio.
- **No hay pruebas automáticas de interfaz** en la app: las pantallas se validaron con los casos funcionales manuales y con la revisión estática. La lógica de la app que no es visual (el motor y los bloques) sí se prueba de forma automática desde el backend.
- **Solo Android:** el proyecto se compila para Android con EAS; no se probó ni se entrega una versión de iOS.
- **Dos peticiones simultáneas de "completar" del mismo nivel** podrían procesarse a la vez. La app lo evita deshabilitando el botón mientras espera la respuesta, pero el backend no lo bloquea por sí mismo.
