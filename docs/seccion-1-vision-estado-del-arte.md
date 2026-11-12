# 1. Visión del producto y estado del arte

**Proyecto:** DevLevel, aplicación móvil para aprender lógica de programación
**Asignatura:** Desarrollo de Aplicaciones Móviles, Universidad de La Sabana
**Documento:** Documento Técnico Final, Fase 3, Sección 1
**Equipo:** Ethian White y Tatiana Mayorga
**Fecha de entrega:** 12 de noviembre de 2026

---

## 1.1 Visión

**DevLevel: "Aprende a pensar como programador, un nivel a la vez".**

DevLevel es un juego para Android que enseña lógica de programación desde cero y en español. El jugador recorre un reino dividido en 5 regiones y 15 mazmorras. En cada mazmorra tiene que escribir un pequeño programa en pseudocódigo para que su héroe llegue a la salida: avanzar, girar, saltar pinchos, recoger monedas y pelear con enemigos. Al principio el programa se arma tocando bloques, y en las últimas regiones el jugador ya lo escribe él mismo, con variables, condiciones, ciclos y funciones.

La meta no es formar programadores profesionales. Es que una persona sin experiencia termine el recorrido sabiendo mirar un problema, dividirlo en pasos y expresarlo con la lógica de un programa, sin importar el lenguaje que use después.

## 1.2 Problema y público

**Problema.** Aprender a programar por cuenta propia suele ser abrumador. No faltan recursos, sobran: llegan al mismo tiempo lenguajes, instalaciones, frameworks y teoría, cuando al inicio lo que la persona necesita es aprender a pensar. El formato dominante, el curso en línea masivo, tiene tasas de finalización de apenas el 5 % al 15 % de los inscritos (Jordan, 2015). Las personas sí quieren aprender; lo que falla es el formato.

**Público objetivo.** Las dos primeras personas vienen de la Fase 1; la tercera se agregó en la Fase 2, con la propuesta de accesibilidad:

| Persona | Perfil | Meta | Dolor |
|---|---|---|---|
| Primaria | Estudiante de colegio o primeros semestres, 13 a 25 años, sin experiencia | Aprender a programar de forma eficiente y divertida | Intentó con tutoriales o cursos gratuitos y se abrumó la primera semana |
| Secundaria | Joven profesional de 22 a 30 años, buen usuario digital | Entender la lógica del código para organizar su trabajo o automatizar tareas pequeñas | No tiene tiempo para un curso largo y formal |
| Con necesidades de accesibilidad | Estudiante de 19 años con baja visión que usa TalkBack y la letra grande del sistema; sensible a las animaciones rápidas | Aprender lógica en el celular con el mismo camino que sus compañeros | Las apps de programación dependen de arrastrar bloques, de colores sin texto y de animaciones que no se pueden detener, y su lector de pantalla no sabe qué hay en el escenario |

Para la tercera persona, la versión entregada no exige arrastrar: todo se hace con toques. Cada estado se comunica con texto además de color, la mazmorra se describe en texto para el lector de pantalla y el resultado de cada ejecución se anuncia solo. Además, la opción Reducir movimiento cambia las animaciones por versiones estáticas (detalle en la sección 3).

## 1.3 De la propuesta al producto entregado

La propuesta de la Fase 1 prometía "un solo camino por niveles, donde cada nivel entrega un concepto de lógica, un reto práctico y una recompensa". La primera versión funcional cumplía eso con retos tipo cuestionario (opción múltiple, ordenar y completar), y al revisarla contra el diseño visual del proyecto encontramos tres problemas:

1. **Los niveles eran cuestionarios.** Responder preguntas sobre lógica no es lo mismo que usar la lógica. El jugador nunca veía qué hace un programa cuando se ejecuta.
2. **El mapa era una lista.** Se perdía la sensación de recorrido y de avance que da la gamificación.
3. **Faltaban retos especiales con recompensas**, que son los que invitan a repetir un nivel para hacerlo mejor.

Por eso rediseñamos el núcleo del juego (el diseño completo está en [`diseno-juego-mazmorras.md`](diseno-juego-mazmorras.md)):

| Antes (primera versión) | Ahora (versión entregada) |
|---|---|
| Concepto + 3 preguntas por nivel | Concepto + **una mazmorra que se resuelve programando** |
| Respuesta correcta o incorrecta | El héroe **ejecuta el programa paso a paso** en un escenario pixel art y el jugador ve exactamente dónde falla |
| Estrellas según errores | 1 estrella por salir + 1 por cada **objetivo extra** (todas las monedas, sin chocar, sin daño, pocas instrucciones, derrotar a todos) |
| Sin recompensas materiales | **25 reliquias** (15 normales y 10 míticas en rojo) que cambian el combate o habilitan instrucciones nuevas |
| Lista de niveles | **Mapa del reino** con 5 regiones y el héroe en el nivel actual |

Un cambio respecto a la propuesta se hizo a propósito: la Fase 1 planteaba **retroalimentación adaptativa con IA** como funcionalidad deseable y no crítica. En la versión entregada la retroalimentación es **determinista**: el lector del pseudocódigo indica la línea exacta del error y sugiere la palabra correcta ("¿Quisiste decir 'adelante()'?"), el simulador explica por qué se perdió ("Te quedaste sin energía") y cada mazmorra tiene una pista escrita a mano. Así la explicación no depende de un servicio externo, no tiene costo por uso y siempre es correcta. Integrar un modelo de lenguaje queda como trabajo futuro.

## 1.4 Estado del arte

### 1.4.1 Aplicaciones existentes

En la Fase 1 analizamos cuatro plataformas. La tabla las compara con la versión entregada de DevLevel:

| | SoloLearn | Mimo | Codecademy | CodeCombat | **DevLevel** |
|---|---|---|---|---|---|
| Formato | Lecciones cortas tipo cuestionario, XP y medallas | Rutas guiadas con lecciones de minutos y rachas | Cursos interactivos en el navegador | Videojuego RPG donde el personaje avanza con código real | **Juego de mazmorras donde el héroe ejecuta el programa del jugador** |
| Qué enseña | Sintaxis de lenguajes concretos | Desarrollo web y Python | Lenguajes y rutas de carrera | Python y JavaScript | **Lógica: secuencia, variables, condiciones, ciclos y funciones** |
| Idioma | Inglés, con traducciones parciales | Mayormente inglés | Inglés | Inglés, con traducciones | **Español nativo, incluso el lenguaje del juego** |
| Plataforma | Móvil y web | Móvil y web | Web (escritorio) | Web (escritorio) | **Android** |
| Modelo | Freemium; la práctica útil es de pago | Freemium; casi todo es de pago | Plan básico gratis; Plus y Pro de pago | Primeros niveles gratis; suscripción | **Todo el contenido disponible** |
| Público principal | Principiantes | Futuros desarrolladores | Futuros desarrolladores | Niños y colegios de EE. UU. | **Jóvenes de 13 a 30 años sin experiencia** |

El competidor más cercano es CodeCombat, que demostró que "jugar primero" baja mucho la barrera de entrada. DevLevel toma esa idea y la lleva al celular, la escribe en español con un pseudocódigo pensado para principiantes y le cambia el tono: una estética retro pixel art que no se siente infantil para alguien de 20 o 30 años.

### 1.4.2 Investigación de dominio

- **Pensamiento computacional.** Wing (2006) lo define como una habilidad fundamental para todos, no solo para informáticos: descomponer problemas, reconocer patrones, abstraer y diseñar algoritmos. Es el núcleo del contenido de DevLevel, por encima de la sintaxis de un lenguaje concreto.
- **De bloques a texto.** Weintrop y Wilensky (2017) compararon grupos de colegio que aprendieron con una versión por bloques y otra en texto del mismo entorno. Los bloques facilitan los primeros aprendizajes porque eliminan los errores de sintaxis, pero los estudiantes perciben la programación con texto como más auténtica. DevLevel aplica una **transición gradual**: las unidades 1 y 2 usan bloques que se tocan, la unidad 3 permite pasar al texto ("Escribirlo yo") y las unidades 4 y 5 usan un editor de texto con barra de atajos. Los bloques generan exactamente el mismo texto que se escribe a mano, así el jugador ve desde el primer nivel cómo se ve su programa escrito.
- **Gamificación.** La gamificación con retroalimentación inmediata mejora la motivación y la retención de los estudiantes (España-Marca, 2025). DevLevel usa XP, niveles, rachas diarias, estrellas, objetivos opcionales y objetos coleccionables. Los míticos se sortean con una probabilidad baja que disminuye a medida que se consiguen más (10 % × 0,8 por cada mítico que ya se tiene), lo que agrega sorpresa sin afectar el avance.
- **Tutoría inteligente.** Las revisiones recientes sobre sistemas de tutoría con IA (Létourneau et al., 2025; Kestin et al., 2025) respaldan la personalización del ritmo y de la retroalimentación. Es la línea de evolución natural del proyecto (ver 1.3).

### 1.4.3 Estado del arte técnico

- **Multiplataforma con un solo código.** React Native con Expo permite construir la app en TypeScript y generar el APK en la nube con EAS Build, sin mantener proyectos nativos por separado. La navegación usa expo-router (rutas por archivos), con rutas protegidas según el estado de la sesión.
- **Backend como servicio, detrás de una API propia.** Supabase resuelve la autenticación y la base de datos PostgreSQL. A diferencia de la arquitectura habitual, en la que la app se conecta directamente a Supabase, DevLevel pone una API propia en Node y Express en medio: la app nunca ve la base de datos. Esto permite que el servidor sea la autoridad del juego (sección 2).
- **Pixel art con gráficos vectoriales.** Los personajes, enemigos, terrenos y reliquias se dibujan en código como mapas de letras y se convierten en SVG con `react-native-svg`. No hay archivos de imagen que cargar, se escalan sin perder nitidez y una misma figura cambia de colores con solo cambiar la paleta.

## 1.5 Propuesta de valor y diferenciadores

**Propuesta de valor:** la aplicación que enseña a pensar como programador, no a ser programador.

| Diferenciador | Cómo quedó en la versión entregada |
|---|---|
| Lógica antes que sintaxis | Pseudocódigo en español con solo lo necesario: 6 acciones, 5 condiciones, `SI`, `REPETIR`, `MIENTRAS`, variables y `FUNCION` |
| Aprender haciendo | Cada nivel se supera ejecutando un programa y viendo al héroe moverse, no respondiendo preguntas |
| Un solo camino claro | 5 unidades y 15 niveles en orden, con desbloqueo progresivo y mapa del reino |
| Español nativo | Interfaz, contenido, mensajes de error y el propio lenguaje del juego en español |
| Retroalimentación que enseña | Error con número de línea y sugerencia, motivo de la derrota, pista por mazmorra y objetos que dan pistas avanzadas |
| Accesible | Compatible con TalkBack, sin gestos de arrastrar, áreas táctiles de 48 dp y opción de reducir movimiento (sección 3) |

## 1.6 Alcance entregado

- APK de Android instalable, conectado a un backend propio desplegado en Render y a Supabase.
- Registro, inicio de sesión, renovación automática de la sesión y recuperación de contraseña con código por correo.
- Onboarding, selección de clase de héroe (explorador, mago o guerrero) y nombre.
- 5 unidades, 15 niveles y 15 mazmorras con 3 modos de edición (bloques, mixto y texto).
- Combate por turnos con goblins, orcos y caballeros; 25 reliquias y equipo de 3 espacios.
- Progreso con XP, niveles, estrellas, rachas y Libro de hechizos.
- Ajustes de accesibilidad: reducir movimiento, sonido y vibración.
- 159 pruebas automáticas en el backend y 33 casos de prueba funcionales ejecutados ([`casos-de-prueba.md`](casos-de-prueba.md)).

## Referencias

- España-Marca, J. P. (2025). Gamificación inteligente: Integración de IA adaptativa en ambientes virtuales de aprendizaje para educación básica. *MQRInvestigar, 9*(4), e1207. https://doi.org/10.56048/MQR20225.9.4.2025.e1207
- Jordan, K. (2015). Massive open online course completion rates revisited: Assessment, length and attrition. *The International Review of Research in Open and Distributed Learning, 16*(3), 341–358. https://doi.org/10.19173/irrodl.v16i3.2112
- Kestin, G., Miller, K., Klales, A., Milbourne, T., & Ponti, G. (2025). AI tutoring outperforms in-class active learning: An RCT introducing a novel research-based design in an authentic educational setting. *Scientific Reports, 15*, 17458. https://doi.org/10.1038/s41598-025-97652-6
- Létourneau, A., Deslandes Martineau, M., Charland, P., Karran, J. A., Boasen, J., & Léger, P. M. (2025). A systematic review of AI-driven intelligent tutoring systems (ITS) in K-12 education. *npj Science of Learning, 10*, 29. https://doi.org/10.1038/s41539-025-00320-7
- Weintrop, D., & Wilensky, U. (2017). Comparing block-based and text-based programming in high school computer science classrooms. *ACM Transactions on Computing Education, 18*(1), Artículo 3. https://doi.org/10.1145/3089799
- Wing, J. M. (2006). Computational thinking. *Communications of the ACM, 49*(3), 33–35. https://doi.org/10.1145/1118178.1118215
- Codecademy. (2026). *Paid plans*. https://www.codecademy.com/pages/paid-plans
- Dealroom. (s.f.). *CodeCombat company profile*. https://app.dealroom.co/companies/codecombat
- Mimo GmbH. (2026). *Mimo: Aprender a programar* [Aplicación móvil]. Google Play Store. https://play.google.com/store/apps/details?id=com.getmimo
- Sololearn Inc. (2026). *Sololearn: Learn to code* [Aplicación móvil]. Google Play Store. https://play.google.com/store/apps/details?id=com.sololearn
