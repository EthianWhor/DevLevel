# DevLevel — Plan de trabajo para la entrega final

**Integrantes:** Ethian White y Tatiana Mayorga
**Asignatura:** Desarrollo de Aplicaciones Móviles · Universidad de La Sabana
**Entrega final:** jueves 12 de noviembre de 2026, **5:00 PM** (una entrega con un minuto de retraso no se acepta)
**Plan vigente desde:** viernes 6 de noviembre de 2026

## Objetivo

Entregar DevLevel como una app móvil funcional de punta a punta: un APK instalable que se conecta a un backend propio, el cual guarda los datos en Supabase. Además hay que entregar el documento técnico final, la presentación con demo en vivo y preparar la defensa individual.

| Componente de la nota | Peso |
|---|---|
| Defensa técnica individual (preguntas del profesor) | 40 % |
| App funcional y repositorio | 30 % |
| Documento final | 20 % |
| Presentación y demo | 10 % |

La defensa vale el 40 % y el profesor puede preguntarle a cualquiera de los dos sobre cualquier parte del código. Por eso el trabajo está repartido de forma mixta: los dos trabajan en el backend y en la app durante la semana.

---

## Cómo marcar las tareas

Cada tarea tiene una casilla y dos espacios para llenar al terminarla:

```
- [ ] Tarea — Hecho por: ______ · Commit: ______
```

Al terminarla se marca así:

```
- [x] Tarea — Hecho por: Tatiana · Commit: a1b2c3d
```

- Una tarea cuenta como entregada si está **subida a `main` antes de las 11:59 PM** del día que le corresponde.
- El historial de commits de GitHub es la evidencia oficial de quién hizo cada tarea.
- Cada uno hace sus commits desde su propia cuenta de GitHub.

---

## Arquitectura

### Estructura del repositorio

```
DevLevel/
├── movil/      App en Expo + TypeScript
├── backend/    API en Node + Express + TypeScript
├── docs/       Documento final y evidencias
└── diseno/     Diseño de Stitch (ya existe)
```

### Cómo se conecta todo

```
App (APK en el celular)
      │  HTTPS + token de sesión
      ▼
Backend Express (desplegado en Render)
      │  supabase-js con la service role key
      ▼
Supabase (Postgres + Auth)
```

- La app **nunca** se conecta directo a Supabase ni tiene sus llaves. Solo conoce la URL del backend (`EXPO_PUBLIC_API_URL`).
- La app guarda el token de sesión en `expo-secure-store`.
- El backend valida el token en cada petición y es el único que lee y escribe en la base de datos.
- Las llaves van en archivos `.env` que **no se suben** al repositorio. Cada carpeta tiene un `.env.example` con los nombres de las variables, sin valores reales.
- Render en el plan gratis se duerme tras 15 minutos sin uso; la primera petición tarda unos 50 segundos. Hay que despertarlo antes de la demo.

### Base técnica (la misma del proyecto de IoT)

- Expo SDK 57, TypeScript, `expo-router` con las rutas en `movil/src/app`, estado global con React Context.
- APK con EAS, no Expo Go: `expo-dev-client` y un `eas.json` con los perfiles `development` y `preview` (`android.buildType: "apk"`).
- Comando para generar el APK: `npx eas-cli build --profile preview -p android`
- Paquete de Android: `com.ethianwhor.devlevel`

### Modelo de datos (Supabase)

| Tabla | Para qué sirve |
|---|---|
| `profiles` | Datos del jugador: nombre de héroe, avatar, XP, nivel, racha, última actividad |
| `unidades` | Las 5 unidades del módulo de lógica |
| `niveles` | Los 15 niveles: título, concepto explicado, XP de recompensa |
| `retos` | Los retos de cada nivel: tipo, enunciado, pseudocódigo, opciones, respuesta correcta, explicaciones y pista |
| `progreso_niveles` | Qué niveles completó cada usuario y con cuántas estrellas |
| `intentos_retos` | Cada respuesta enviada y si fue correcta |

- La respuesta correcta de cada reto **solo la conoce el backend**; la app nunca la recibe.
- Todas las tablas tienen RLS activado y sin políticas públicas, así que solo el backend puede entrar.

### Endpoints del backend

| Método y ruta | Qué hace |
|---|---|
| `GET /health` | Revisa que el servidor esté vivo |
| `POST /auth/register` | Crea la cuenta y el perfil |
| `POST /auth/login` | Inicia sesión y devuelve el token |
| `GET /me` | Devuelve el perfil del usuario |
| `PATCH /me` | Actualiza nombre de héroe y avatar |
| `GET /mapa` | Unidades y niveles con su estado para ese usuario (completado, actual, bloqueado) |
| `GET /niveles/:id` | Concepto y retos de un nivel, sin las respuestas |
| `POST /retos/:id/responder` | Revisa una respuesta y devuelve si es correcta y la explicación |
| `POST /niveles/:id/completar` | Calcula XP, estrellas, racha y si subió de nivel |
| `GET /hechizos` | Conceptos que el usuario ya desbloqueó |

### Pantallas de la app

Se construyen a partir del diseño de Stitch (`diseno/stitch/`), recortado a lo que cabe en el MVP:

1. Splash
2. Onboarding (3 pantallas)
3. Login / Registro
4. Selección de personaje
5. Mapa de niveles
6. Concepto (explicación antes de los retos)
7. Reto: opción múltiple, ordenar pasos tocando y completar el espacio
8. Resultado (correcto o incorrecto, con explicación)
9. Subida de nivel
10. Perfil
11. Libro de hechizos
12. Configuración y accesibilidad

**Fuera del MVP:** notificaciones y gremio, chat con tutores, maná y runas, retroalimentación con IA.

**Ajustes obligatorios al diseño de Stitch:**
- Todo el texto en español.
- Ningún reto obliga a arrastrar; todo se puede hacer tocando.
- El texto sigue el tamaño de letra del sistema (sin selector propio de 1.0x a 1.5x).
- Los niveles bloqueados deben cumplir contraste 4.5:1 y mostrar candado + texto.
- Quitar los sellos "AAA Ready" y "WCAG Verificado".
- Contenido en pseudocódigo en español, sin conceptos avanzados (nada de Hash Map, O(n) ni SQL).

### Contenido del módulo

1 módulo de lógica, 5 unidades × 3 niveles = **15 niveles**, con **3 retos por nivel** (45 retos):

| Unidad | Niveles |
|---|---|
| 1. Pensar en pasos | ¿Qué es un algoritmo? · El orden importa · Dividir un problema |
| 2. Guardar información | Variables · Tipos de datos · Cambiar valores |
| 3. Tomar decisiones | Si… entonces · Si no · Varias condiciones |
| 4. Repetir sin cansarse | Repetir N veces · Repetir mientras · Recorrer una lista |
| 5. Bloques reutilizables | Crear una función · Datos de entrada · Datos de salida |

---

## Cronograma

### Viernes 6 de noviembre — Base del proyecto

**Ethian**
- [x] Agregar a Tatiana como colaboradora del repositorio en GitHub, crear el proyecto en Supabase y agregarla como miembro — Hecho por: Ethian White · Commit: no aplica (se hace en GitHub y Supabase)
- [x] Escribir el esquema de la base de datos en `backend/supabase/schema.sql` (las 6 tablas, RLS activado) y ejecutarlo en Supabase — Hecho por: Ethian White · Commit: fe44488
- [x] Crear el esqueleto del backend en `backend/` (Express + TypeScript, `GET /health`, `.env.example`, `.gitignore` con `.env`) — Hecho por: Ethian White · Commit: 7b3664b
- [x] Desplegar el backend en Render y anotar la URL pública en el README — Hecho por: Ethian White · Commit: 8679c01

**Tatiana**
- [x] Leer este plan y marcar esta casilla como aceptado, con un commit propio — Hecho por: Tatiana Mayorga· Commit: 40163a1
- [x] Crear la app en `movil/` (Expo SDK 57 + TypeScript + expo-router) y configurar EAS (`eas.json` con perfiles `development` y `preview`) — Hecho por: Tatiana Mayorga· Commit: 6034efd, 6101e7a
- [x] Crear el tema Retro-Logic en `movil/src/theme/` (colores, tipografías Space Grotesk, Inter y JetBrains Mono, espaciados) — Hecho por: Tatiana Mayorga · Commit: e7e7e27, 5bbb0c6
- [x] Crear los componentes base accesibles: botón principal, tarjeta y barra de progreso segmentada (con `accessibilityRole`, `accessibilityLabel` y área táctil ≥ 48 dp) — Hecho por: Tatiana Mayorga · Commit: d276f9b
- [ ] Generar un primer APK de prueba con EAS e instalarlo en un celular — Hecho por: ______ · Commit: ______

### Sábado 7 de noviembre — Autenticación de punta a punta

**Ethian**
- [x] `POST /auth/register` y `POST /auth/login` en el backend (validación de datos y errores claros) — Hecho por: Ethian White · Commit: 36d1764
- [x] Middleware que valida el token en las rutas protegidas — Hecho por: Ethian White · Commit: a9fe325
- [x] `GET /me` y `PATCH /me` — Hecho por: Ethian White · Commit: 8086adc
- [x] Documentar los endpoints de auth en `backend/README.md` (petición y respuesta de ejemplo) — Hecho por: Ethian White · Commit: 0d1e33d

**Tatiana**
- [x] Cliente de la API en `movil/src/api/` (URL desde `EXPO_PUBLIC_API_URL`, manejo de errores de red) — Hecho por: Ethian White · Commit: 0b2d2f9
- [x] `AuthContext` con el token guardado en `expo-secure-store` y redirección según haya sesión o no — Hecho por: Ethian White · Commit: 2da7e87
- [x] Pantallas Splash y Onboarding — Hecho por: Ethian White · Commit: f3006f8
- [x] Pantalla Login / Registro conectada al backend, con errores debajo de cada campo (ícono + texto) — Hecho por: Ethian White · Commit: 5c3726f

### Domingo 8 de noviembre — Mapa y contenido

**Ethian (app)**
- [x] Pantalla Selección de personaje (avatar y nombre de héroe, guarda con `PATCH /me`) — Hecho por: Ethian White · Commit: 7af71c7
- [x] Pantalla Mapa de niveles consumiendo `GET /mapa` (estados completado, actual y bloqueado con ícono + texto) — Hecho por: Ethian White · Commit: c1a3c8e
- [x] Barra de pestañas inferior (Mapa, Hechizos, Perfil, Configuración) — Hecho por: Ethian White · Commit: 37b5efc

**Tatiana (backend)**
- [x] `GET /mapa` con el estado de cada nivel para el usuario — Hecho por: Ethian White · Commit: c65ea1a
- [x] `GET /niveles/:id` sin enviar las respuestas correctas — Hecho por: Tatiana Mayorga · Commit: d3670da
- [x] Contenido de las unidades 1 a 3 en `backend/supabase/seed.sql` (9 niveles, 27 retos) — Hecho por: Tatiana Mayorga · Commit: d3670da
### Lunes 9 de noviembre — Retos

**Ethian (backend)**
- [x] `POST /retos/:id/responder` (revisa la respuesta y guarda el intento) — Hecho por: Ethian White · Commit: c1d6fec
- [x] `POST /niveles/:id/completar` (XP, estrellas, racha y subida de nivel) — Hecho por: Ethian White · Commit: 4cccdc1
- [x] Pruebas automáticas de la API para auth, responder y completar — Hecho por: Ethian White · Commit: cb55c66
- [x] Contenido de las unidades 4 y 5 en `seed.sql` (6 niveles, 18 retos) — Hecho por: Ethian White · Commit: 097f502

**Tatiana (app)**
- [x] Pantalla Concepto (explicación del nivel antes de los retos) — Hecho por: Tatiana Mayorga · Commit: 6951482
- [x] Pantalla Reto con los 3 tipos ... — Hecho por: Tatiana Mayorga · Commit: d9dac8e
- [x] Pantalla Resultado: correcto o incorrecto con ícono + texto + vibración, explicación y botones Continuar / Intentar de nuevo — Hecho por: Tatiana Mayorga· Commit: df110b3

### Martes 10 de noviembre — Progreso y accesibilidad

**Ethian**
- [x] Pantalla Subida de nivel con animación y versión estática si "Reducir movimiento" está activo — Hecho por: Ethian White · Commit: 1fec44d
- [x] Pantalla Perfil (XP, nivel, racha, niveles completados) — Hecho por: Ethian White · Commit: 1d4b9a4
- [x] `GET /hechizos` en el backend y pantalla Libro de hechizos en la app — Hecho por: Ethian White · Commit: c67befd

**Tatiana**
- [x] Pantalla Configuración y accesibilidad (reducir movimiento, sonido, vibración, cerrar sesión) — Hecho por: Tatiana Mayorga · Commit: abd2714
- [ ] Revisión de accesibilidad en todas las pantallas: `accessibilityLabel`, `accessibilityRole`, `accessibilityState`, `hitSlop`, escalado de fuente, `lineHeight` y contraste — Hecho por: ______ · Commit: ______
- [x] Instalar y configurar `eslint-plugin-react-native-a11y` y corregir lo que reporte — Hecho por: Tatiana Mayorga · Commit: 317ae34
- [x] Borrador de la matriz de trazabilidad en `docs/` (cada mejora prometida en la Fase 2, el archivo donde está y cómo se probó) — Hecho por: Tatiana Mayorga · Commit: 5b80834

### Miércoles 11 de noviembre — Pruebas, documento y APK final

**Ethian**
- [ ] Generar el APK final con EAS y probar el flujo completo en un celular — Hecho por: ______ · Commit: ______
- [x] README completo en la raíz (instalación, variables de entorno, arquitectura, cómo ejecutar, resumen de accesibilidad) — Hecho por: Ethian White · Commit: 7891ab2
- [x] Casos de prueba funcionales ejecutados (flujos principales y errores de red/validación), con resultados — Hecho por: Ethian White · Commit: 26e9844
- [ ] Documento final, secciones 1 (visión y estado del arte) y 2 (arquitectura, con diagrama) — Hecho por: ______ · Commit: ______

**Tatiana**
- [ ] Auditoría con TalkBack y Accessibility Scanner en un celular, con capturas en `docs/` — Hecho por: ______ · Commit: ______
- [ ] Documento final, secciones 3 (accesibilidad y matriz de trazabilidad) y 5 (conclusiones) — Hecho por: ______ · Commit: ______
- [ ] Presentación para el pitch y la demo — Hecho por: ______ · Commit: ______

**Los dos**
- [ ] Ensayo de la defensa: cada uno le explica al otro el código que no escribió (navegación, estado, API, base de datos y accesibilidad) — Hecho por: ______

### Jueves 12 de noviembre — Entrega (sin tareas nuevas)

- [ ] Unir las secciones del documento y exportarlo a PDF en `docs/`
- [ ] Subir la entrega a la plataforma **antes del mediodía** (margen sobre las 5:00 PM)
- [ ] Instalar el APK final en el celular de la demo
- [ ] Despertar el backend de Render antes de la sustentación

---

## Tabla de seguimiento

Se actualiza en cada revisión de la mañana. Sirve para la revisión del 10 de noviembre.

| Día | Tareas de Ethian | Tareas de Tatiana | Hechas por Ethian | Hechas por Tatiana |
|---|---|---|---|---|
| Vie 6 nov | 4 | 5 | | |
| Sáb 7 nov | 4 | 4 | | |
| Dom 8 nov | 3 | 3 | | |
| Lun 9 nov | 4 | 3 | | |
| Mar 10 nov | 3 | 4 | | |
| Mié 11 nov | 4 | 3 | | |
| **Total** | **22** | **22** | | |

---

## Acuerdo de responsabilidad del equipo

Este plan se comparte con los dos integrantes el 6 de noviembre de 2026. La primera tarea de Tatiana es aceptarlo con un commit propio, lo que deja constancia de que lo conoce.

1. **Revisión diaria.** Cada mañana Ethian revisa en el repositorio el trabajo subido el día anterior.
2. **Tareas no entregadas.** Si una tarea asignada a Tatiana no está subida a tiempo, Ethian la hará sin aviso previo, porque la fecha de entrega no deja margen para esperar, y quedará marcada como hecha por Ethian.
3. **Revisión del 10 de noviembre.** En la mañana del 10 de noviembre se cuentan las tareas terminadas hasta el 9 de noviembre. Si más del 80 % quedaron hechas por Ethian, se retirará el acceso de escritura de Tatiana al repositorio y se informará al profesor, usando este plan y el historial de commits como evidencia.
