# DevLevel: diseño del juego de mazmorras

Fecha: 11 de noviembre de 2026.
Estado: aprobado en conversación por Ethian; pendiente de revisión escrita.

## 1. Por qué se rediseña

La versión actual funciona de punta a punta, pero no cumple lo que prometía el diseño de Stitch:

1. **Lo visual:** usa los colores Retro-Logic, pero perdió los bordes con bisel pixelado, los marcos, los brillos y los efectos que la hacían sentir como un juego.
2. **El mapa** es una lista. El diseño (`mapa_de_niveles_overworld`) es un mapa de reino con zonas, un sendero y el héroe en la zona actual.
3. **Los niveles** son cuestionarios: explican un concepto y hacen preguntas. El diseño (`reto_de_l_gica_editor` y la especificación de pantallas) pide un escenario pixelado con el personaje y un editor de código simplificado: el jugador arma un programa, lo ejecuta y ve al personaje moverse para cumplir el objetivo.
4. Faltan **retos especiales con recompensas**.

Restricción: la entrega es el jueves 12 de noviembre a las 5:00 PM. El trabajo va por fases y al final de cada una queda una app que funciona.

## 2. El nivel

Cada uno de los 15 niveles tiene:

1. **Concepto**: la explicación que ya existe, con el estilo nuevo.
2. **Una mazmorra**: un reto de tipo `mazmorra` que se resuelve programando. Reemplaza las preguntas tipo quiz.
3. **Subida de nivel**: estrellas, XP, racha, hechizo y el objeto ganado.

## 3. La mazmorra

### 3.1 El escenario

Una cuadrícula de hasta 8×8 casillas. El mapa se escribe con letras:

| Letra | Casilla |
|---|---|
| `#` | Muro |
| `.` | Piso |
| `S` | Inicio del héroe (es piso) |
| `P` | Puerta: la salida |
| `C` | Moneda (sobre piso) |
| `^` | Pinchos |
| `g` | Goblin |
| `o` | Orco |
| `k` | Caballero esqueleto (jefe) |

El héroe empieza en `S` mirando hacia `direccionInicial` (`norte`, `sur`, `este` u `oeste`).

### 3.2 El héroe y sus estadísticas

| Estadística | Valor base | Qué hace |
|---|---|---|
| Vida ❤️ | 3 | Si llega a 0, pierde el intento |
| Ataque ⚔️ | 1 | Daño de `atacar()` |
| Energía ⚡ | La de cada mazmorra | Cada acción gasta 1. Si se acaba antes de llegar a la puerta, pierde el intento |

### 3.3 El lenguaje (pseudocódigo en español)

**Acciones** (gastan 1 de energía):

| Instrucción | Efecto |
|---|---|
| `adelante()` | Avanza una casilla. Contra un muro no se mueve y cuenta como choque. Contra un enemigo no se mueve y el enemigo lo golpea. Sobre pinchos avanza y recibe 1 de daño |
| `girar_izquierda()` / `girar_derecha()` | Gira 90° |
| `saltar()` | Avanza 2 casillas pasando por encima de la de enfrente (sirve para los pinchos). No salta muros ni enemigos, y la casilla de llegada debe ser piso, moneda o puerta |
| `atacar()` | Golpea al enemigo de enfrente con su ataque. Si el enemigo sobrevive, devuelve el golpe |
| `recoger()` | Toma la moneda de la casilla donde está el héroe |

**Condiciones** (no gastan energía; miran la casilla de enfrente salvo `en_salida`): `hay_muro`, `hay_pincho`, `hay_enemigo`, `hay_moneda`, `en_salida`. Se pueden negar con `NO`: `NO hay_muro`.

**Estructuras:**

```
SI hay_enemigo ENTONCES
  atacar()
SINO
  adelante()
FIN

REPETIR 3 VECES
  adelante()
FIN

MIENTRAS NO en_salida HACER
  adelante()
FIN

pasos = 4
REPETIR pasos VECES
  adelante()
FIN

FUNCION esquivar()
  girar_derecha()
  adelante()
  girar_izquierda()
FIN
esquivar()
```

Reglas del lenguaje:
- Una instrucción por línea. Las palabras clave van en mayúsculas. Se aceptan minúsculas y tildes faltantes (`si`, `repetir`, `funcion`), que se normalizan.
- Las variables guardan números enteros de 0 a 99.
- Las funciones no reciben parámetros y deben declararse antes de usarse.
- Comentarios: el texto después de `//` se ignora.

**Errores:** el lector devuelve la línea y un mensaje en lenguaje simple. Por ejemplo: "Línea 3: falta FIN para cerrar el REPETIR de la línea 1", "Línea 2: no conozco la instrucción 'avanzar()'. ¿Quisiste decir 'adelante()'?" o "Línea 5: no tienes equipado el Rayo de Zeus".

**Límite de seguridad:** como máximo 500 pasos de evaluación por programa, para que un `MIENTRAS` que nunca termina no cuelgue la app ni el backend. Al pasarse, pierde con el motivo "El hechizo se repitió demasiadas veces".

### 3.4 Cómo se arma el código según la unidad

| Unidad | Modo | Cómo se arma |
|---|---|---|
| 1. Pensar en pasos | `bloques` | Paleta de acciones; se toca para agregar |
| 2. Guardar información | `bloques` | Además, el bloque `pasos = N` con − y + |
| 3. Tomar decisiones | `mixto` | Bloques con `SI`; el código se ve como texto y hay un botón "Escribirlo yo" |
| 4. Repetir sin cansarse | `texto` | Editor de texto con barra de atajos sobre el teclado |
| 5. Bloques reutilizables | `texto` | Igual, con `FUNCION` |

Los bloques generan siempre el **mismo texto** del lenguaje. El backend solo recibe texto, así hay un único formato de entrada.

En modo bloques: tocar una instrucción de la paleta la agrega al final, o dentro del `REPETIR` o `SI` seleccionado. Tocar una línea la selecciona y muestra ↑, ↓ y 🗑. Nada se arrastra.

### 3.5 Enemigos y combate

| Enemigo | Vida | Daño | Desde |
|---|---|---|---|
| Goblin | 1 | 1 | Unidad 1 |
| Orco | 2 | 1 | Unidad 3 |
| Caballero esqueleto (jefe) | 3 | 2 | Tercer nivel de cada unidad desde la 2 |

El combate es **determinista** (sin azar) para que el backend pueda validar igual que la app:
- `atacar()` resta el ataque del héroe a la vida del enemigo de enfrente. Si el enemigo queda con vida, golpea al héroe.
- Si el héroe intenta avanzar hacia un enemigo, no se mueve y el enemigo lo golpea.
- Un enemigo con vida 0 desaparece y su casilla queda libre.
- Los enemigos no se mueven.

### 3.6 Victoria y objetivos

- **Objetivo principal:** pisar la puerta. Al pisarla, el programa se detiene y se gana.
- Si el programa termina sin llegar, pierde con el motivo "Tu hechizo terminó antes de llegar a la puerta".
- **Objetivos extra** (2 por mazmorra), de estos tipos:
  - `monedas`: recoger todas las monedas.
  - `maxInstrucciones`: usar como máximo N instrucciones. Cuentan las líneas con instrucción o estructura; `FIN`, `SINO` y los comentarios no cuentan.
  - `sinChoques`: no chocar contra muros.
  - `sinDanio`: terminar con la vida completa.
  - `derrotarTodos`: derrotar a todos los enemigos.
- **Estrellas:** 1 por ganar más 1 por cada objetivo extra cumplido en ese intento, hasta 3. Se guarda la mejor.

## 4. Objetos

### 4.1 Normales

Cada mazmorra da un objeto la primera vez que se gana cumpliendo **los dos objetivos extra**. Hay tres espacios de equipo: arma, armadura y amuleto.

| Id | Nombre | Espacio | Efecto |
|---|---|---|---|
| `daga_madera` | Daga de madera | Arma | +1 ataque |
| `espada_bronce` | Espada de bronce | Arma | +1 ataque y +2 energía |
| `lanza_larga` | Lanza larga | Arma | +1 ataque y `atacar()` alcanza 2 casillas |
| `hacha_guerra` | Hacha de guerra | Arma | +2 ataque |
| `espada_hierro` | Espada de hierro | Arma | +2 ataque y +2 energía |
| `cota_cuero` | Cota de cuero | Armadura | +1 vida |
| `casco_hierro` | Casco de hierro | Armadura | +1 vida y +1 energía |
| `capa_viajero` | Capa de viajero | Armadura | Los pinchos no hacen daño |
| `escudo_runico` | Escudo rúnico | Armadura | Bloquea el primer golpe |
| `armadura_placas` | Armadura de placas | Armadura | +2 vida |
| `botas_veloces` | Botas veloces | Amuleto | +5 energía |
| `anillo_mana` | Anillo de maná | Amuleto | Los giros no gastan energía |
| `pergamino_sabio` | Pergamino del sabio | Amuleto | Desbloquea la pista avanzada: las primeras 2 líneas de una solución |
| `lupa_explorador` | Lupa del explorador | Amuleto | Resalta en el escenario el camino más corto a la puerta |
| `amuleto_vida` | Amuleto de vida | Amuleto | Recupera 1 vida al recoger una moneda (sin pasar del máximo) |

### 4.2 Míticos (color rojo `#EF4444`, etiqueta MÍTICO)

Cada vez que se gana el objeto de una mazmorra, el backend tira un dado. Con probabilidad `0,10 × 0,8^k` (donde `k` es la cantidad de míticos que el jugador ya tiene), en lugar del objeto normal recibe un **mítico al azar que todavía no tenga**. Hay 10 y nunca se repiten. Si un mítico reemplazó al objeto normal, ese objeto se puede ganar después repitiendo la mazmorra con los dos extras, y se vuelve a tirar el dado.

| Id | Nombre | Espacio | Efecto |
|---|---|---|---|
| `rayo_zeus` | Rayo de Zeus | Amuleto | `invocar_rayo()`, una vez por mazmorra: todos los enemigos pierden un tercio de su vida máxima, redondeado hacia arriba |
| `martillo_thor` | Martillo de Thor | Arma | +3 ataque y `atacar()` también golpea al enemigo de la casilla de atrás de la de enfrente |
| `egida_atenea` | Égida de Atenea | Armadura | Ignora los primeros 3 golpes |
| `caliz_fenix` | Cáliz del Fénix | Armadura | Una vez por mazmorra, al llegar a 0 de vida revive con la vida completa |
| `reloj_cronos` | Reloj de Cronos | Amuleto | Duplica la energía |
| `ojo_odin` | Ojo de Odín | Amuleto | La pista avanzada muestra la solución completa |
| `sandalias_hermes` | Sandalias de Hermes | Amuleto | `volar()`, una vez por mazmorra: avanza 2 casillas pasando por encima de pinchos y enemigos |
| `capa_sombras` | Capa de Sombras | Armadura | Los enemigos no devuelven el golpe |
| `llave_maestra` | Llave Maestra | Amuleto | `atravesar()`, una vez por mazmorra: cruza el muro de enfrente |
| `corona_rey` | Corona del Rey Lógico | Amuleto | +50 % de XP al completar cada mazmorra |

Las instrucciones `invocar_rayo()`, `volar()` y `atravesar()` solo se pueden usar con su mítico equipado; si no, el lector da error.

### 4.3 Equilibrio

El objetivo principal de **todas** las mazmorras se puede cumplir sin objetos. Una prueba automática lo garantiza: cada mazmorra trae una solución de referencia que gana sin equipo, y otra que cumple los dos extras.

## 5. Contenido: las 15 mazmorras

| Nivel | Concepto | Mazmorra | Modo | Enemigos | Objetivos extra | Objeto |
|---|---|---|---|---|---|---|
| 1 | ¿Qué es un algoritmo? | El Pasillo de la Aldea | bloques | — | monedas, maxInstrucciones | Botas veloces |
| 2 | El orden importa | El Patio de los Giros | bloques | 1 goblin | sinChoques, derrotarTodos | Daga de madera |
| 3 | Dividir un problema | La Guarida del Goblin Jefe | bloques | goblins | monedas, sinDanio | Cota de cuero |
| 4 | Variables | El Cofre Contador | bloques | — | maxInstrucciones, monedas | Anillo de maná |
| 5 | Tipos de datos | El Sendero de Pinchos | bloques | goblin | sinDanio, monedas | Capa de viajero |
| 6 | Cambiar valores | La Cripta del Esqueleto | bloques | caballero | derrotarTodos, maxInstrucciones | Espada de bronce |
| 7 | Si… entonces | La Bifurcación | mixto | goblins | sinChoques, monedas | Pergamino del sabio |
| 8 | Si no | El Puente Dudoso | mixto | orco | sinDanio, maxInstrucciones | Casco de hierro |
| 9 | Varias condiciones | El Torreón de las Decisiones | mixto | orcos, caballero | derrotarTodos, sinDanio | Lanza larga |
| 10 | Repetir N veces | El Túnel Largo | texto | — | maxInstrucciones, monedas | Lupa del explorador |
| 11 | Repetir mientras | El Río Sin Fin | texto | goblins | maxInstrucciones, sinChoques | Escudo rúnico |
| 12 | Recorrer una lista | La Galería de Cofres | texto | orcos, caballero | monedas, derrotarTodos | Hacha de guerra |
| 13 | Crear una función | El Taller del Herrero | texto | goblins | maxInstrucciones, sinDanio | Amuleto de vida |
| 14 | Datos de entrada | Las Escaleras de la Fortaleza | texto | orcos | monedas, maxInstrucciones | Armadura de placas |
| 15 | Datos de salida | El Trono del Rey Esqueleto | texto | caballero, orcos | derrotarTodos, sinDanio | Espada de hierro |

Los mapas exactos y las soluciones de referencia se escriben en `backend/supabase/seed.sql` y se validan con pruebas.

## 6. Base de datos

Script nuevo `backend/supabase/migracion-mazmorras.sql`, que se ejecuta una vez sin borrar el progreso:

- `alter type public.tipo_reto add value 'mazmorra'`.
- En `retos`, para el tipo `mazmorra`:
  - `opciones` guarda la mazmorra: `{ nombre, historia, modo, mapa, direccionInicial, energia, instrucciones, objetivosExtra, objeto }`.
  - `respuesta` guarda `{ solucion, solucionExtras }`; nunca se envía a la app.
- Tabla nueva `inventario` (`user_id`, `objeto_id`, `nivel_id`, `mitico`, `obtenido_at`, llave primaria `user_id + objeto_id`), con RLS activado y sin políticas.
- Columna `equipo jsonb` en `profiles` (`{ arma, armadura, amuleto }`, cada uno id o null).
- Columna `detalle jsonb` en `intentos_retos` con el resultado del intento.

El `seed.sql` se rehace: borra los retos de pregunta y crea las 15 mazmorras, manteniendo unidades y niveles. Los intentos viejos se borran en cascada con sus retos; `progreso_niveles` se conserva.

## 7. Backend

- **Motor** en `backend/src/lib/mazmorra/`: `lector.ts` (texto → instrucciones), `simulador.ts` (instrucciones + mazmorra + equipo → pasos y resultado), `objetos.ts` (catálogo y efectos) y `tipos.ts`. Es TypeScript puro, sin dependencias.
- **Copia idéntica** en `movil/src/juego/`. Una prueba compara los archivos y falla si difieren.
- `GET /niveles/:id`: concepto y mazmorra (sin `respuesta`).
- `POST /retos/:id/responder` con `{ programa: string }`: lee el equipo guardado, verifica en `inventario` que el jugador lo tenga, lee el programa, simula y guarda el intento. Devuelve `{ correcta, motivo, objetivosCumplidos, error: { linea, mensaje } | null, resultado: { vida, energiaRestante, monedas, instrucciones } }`.
- `POST /niveles/:id/completar`: exige un intento ganador desde la última vez que se completó. Las estrellas salen de ese intento. Si cumplió los dos extras y no tiene el objeto de la mazmorra, tira el dado del mítico (con generador de azar inyectable para las pruebas) y guarda el objeto. Devuelve además `objetoGanado: { id, nombre, espacio, efecto, mitico } | null`.
- `GET /inventario`: objetos del jugador y su equipo.
- `PATCH /me` acepta `equipo`; valida que tenga cada objeto y que vaya en su espacio.
- `GET /retos/:id/pista-avanzada`: con el Pergamino del sabio devuelve las primeras 2 líneas de la solución; con el Ojo de Odín, la solución completa; sin ninguno, 403.

## 8. App

### 8.1 Pantalla de la mazmorra

De arriba hacia abajo: barra con el nombre de la mazmorra y el XP; escenario en pixel art con indicadores (❤️, ⚡, 🪙, ⚔️); objetivos con casillas ☐/☑; editor "Hechizo.logica" en el modo de la unidad; botones ▶ Ejecutar hechizo, ⟲ Reiniciar, 💡 Pista (siempre), 🔮 Pista avanzada (con objeto) y 🎒 Equipo.

Al ejecutar, la app simula con su copia del motor y **anima paso a paso** (unos 300 ms por paso): caminar, girar, golpear, número flotante de daño y moneda recogida. Al mismo tiempo envía el programa al backend; **el resultado final es el del backend**. Con "Reducir movimiento", el héroe cambia de casilla sin transición y no hay números flotantes. Durante la ejecución se resalta la línea que corre.

Si pierde: panel con ✖, el motivo y la línea, y el botón Reintentar; el código se conserva. Si gana: panel con ✔, los objetivos cumplidos y el botón Terminar nivel (puede reintentar para cumplir los extras).

Accesibilidad: el escenario tiene una descripción para TalkBack y un botón "Describir mazmorra" con la lista completa en texto; se anuncian los eventos importantes (golpe, moneda, victoria), no cada paso; todo se hace tocando, con áreas de al menos 48 dp; la vibración respeta la preferencia de Configuración.

### 8.2 Arte

Pixel art dibujado en código con la paleta Retro-Logic (como el emblema del Splash): tres héroes (explorador, mago, guerrero) en cuatro direcciones, muro, piso, puerta, moneda, pinchos, goblin, orco, caballero, antorcha y los íconos de los objetos.

### 8.3 Mapa del reino

Camino vertical que sube desde la aldea (nivel 1, abajo) hasta la fortaleza (nivel 15, arriba), con cinco regiones dibujadas en pixel art: Aldea del Inicio, Bosque de los Cofres, Montaña de los Caminos, Río de los Ciclos y Fortaleza de las Funciones. Los niveles son zonas unidas por un sendero en zigzag; el tercer nivel de cada unidad es la guarida del jefe. Estados con ícono y texto: completado (marco verde, ✓, estrellas), actual (marco dorado con brillo, 📍, el héroe al lado y tarjeta con ENTRAR) y bloqueado (🔒 "Bloqueado", contraste 4.5:1). Al abrir se desplaza al nivel actual; al completar uno, el héroe camina a la zona siguiente (sin animación con "Reducir movimiento"). Botón "Ver como lista" con la lista accesible actual. TalkBack recorre las zonas del 1 al 15.

### 8.4 Estilo Stitch

Componentes en `movil/src/components/retro/`: `MarcoPixel` (borde grueso `#1E293B`, sombra dura desplazada, esquinas doradas, encabezado en JetBrains Mono), `BotonBisel` (variantes oro, verde, azul maná y rojo; el `BotonPrincipal` actual pasa a usar este estilo sin cambiar su forma de uso), `Brillo`, `FondoReino` (cuadrícula y partículas), etiquetas pixel, barras segmentadas de vida, XP y energía, barra superior común y barra de pestañas propia (píldora dorada para la seleccionada, con rol de pestaña). Se aplican a Onboarding, Login, Recuperar, Personaje, Mapa, Concepto, Mazmorra, Subida de nivel, Perfil (con Reliquias, el inventario, y el equipo), Libro de hechizos (estilo Grimorio) y Configuración (solo estilo). Se agregan al tema los colores faltantes del `DESIGN.md` y se verifica el contraste de 4.5:1 de cada combinación nueva.

### 8.5 Teclado

En Android con pantalla completa, el teclado tapa los campos. Se usa `react-native-keyboard-controller` (`KeyboardProvider` en la raíz y `KeyboardAwareScrollView` en los formularios) para que el campo activo quede siempre visible: Login, Registro, Recuperar, Personaje y el editor de texto de la mazmorra.

### 8.6 Lo que se retira

Las pantallas Reto y Resultado de preguntas (`components/nivel/reto.tsx` y `resultado.tsx`) dejan de usarse y se retiran de la app. El backend sigue aceptando los tipos de reto anteriores.

## 9. Pruebas

- Backend (`node:test` con el Supabase falso): lector (cada estructura y cada error con su línea), simulador (movimiento, choques, pinchos, saltos, combate, energía, límite de pasos, victoria), cada objeto normal y mítico, probabilidad del mítico con azar controlado, validación de equipo, pista avanzada, `responder` y `completar` con mazmorras, y las 15 mazmorras ganables sin objetos con sus extras alcanzables.
- Prueba que compara las dos copias del motor.
- En cada fase: `npm run typecheck`, `npm test`, `npx tsc --noEmit` y `npx expo export --platform android`.
- Prueba manual en la app web de cada pantalla nueva y APK de control al cerrar las fases 1, 3 y 5.

## 10. Fases

| Fase | Contenido | APK de control |
|---|---|---|
| 0 | Arreglo del teclado y script de migración | |
| 1 | Motor, objetos y míticos, backend, una mazmorra completa en modo bloques y Subida de nivel con objeto | Sí |
| 2 | Las 15 mazmorras, modos mixto y texto, equipo e inventario, pista avanzada | |
| 3 | Mapa del reino | Sí |
| 4 | Estilo Stitch en todas las pantallas y barra de pestañas | |
| 5 | APK final, prueba completa y README actualizado | Sí |

Si falta tiempo, se recorta en este orden: (1) el estilo de la fase 4 se aplica solo a mapa, mazmorra, subida de nivel y perfil; (2) se quita la caminata animada del mapa; (3) el modo texto queda solo en la unidad 5.
