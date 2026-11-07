# DevLevel — Detalle de pantallas
### Estilo visual: RPG pixel art
Ethian White y Tatiana Mayorga · Desarrollo Móvil · Universidad de La Sabana

13 pantallas organizadas en 4 grupos, siguiendo la lógica de una app tipo videojuego.

---

## Grupo 1 — Onboarding y cuenta

### 1. Splash screen
- Logo de DevLevel animado en pixel art (idle animation corta, 2-3 segundos).
- Fondo temático (ej. un mapa de fantasía en construcción o un cielo estrellado 8-bit).
- Sin botones ni interacción; transición automática a Onboarding o Login según si es primera vez.

### 2. Onboarding narrativo
- 3-4 slides tipo "cutscene" que presentan el mundo del juego y la misión del jugador (aprender lógica de programación).
- Un personaje guía (mentor o NPC) introduce la historia con diálogo corto en cajas de texto estilo RPG clásico.
- Botón "Siguiente" / "Saltar" en cada slide; indicador de progreso (puntos o barra).
- Última slide lleva a Registro/Login.

### 3. Registro / Login
- Formulario simple: correo + contraseña, o inicio con Google/Apple.
- Estética de "pergamino" o "tablero de misiones" en pixel art como fondo del formulario.
- Link a "¿Olvidaste tu contraseña?" y alternancia entre Registro e Inicio de sesión.
- Validación de campos con mensajes de error claros (texto + ícono, no solo color).

### 4. Selección o creación de personaje
- Galería de avatares pixel art (clases o "rols" temáticos, ej. Explorador, Mago del código, Guerrero lógico).
- Opciones básicas de personalización (color, accesorio).
- Nombre del personaje editable.
- Botón "Comenzar aventura" que lleva al Mapa de mundo.

---

## Grupo 2 — Núcleo del juego

### 5. Mapa de mundo (overworld)
- Vista tipo mapa de RPG con "zonas" o "pueblos" representando los módulos/niveles del curso.
- Camino único visual (sendero) que conecta los niveles en orden, mostrando cuáles están desbloqueados, en progreso o bloqueados.
- Ícono del personaje ubicado en la zona actual, con animación de caminar al desplazarse.
- Tap en una zona desbloqueada abre la Pantalla de nivel/reto correspondiente.

### 6. Pantalla de nivel / reto
- Dividida en dos partes: escenario visual (el "combate" o puzzle representado con sprites pixel art) y editor de código simplificado (bloques o líneas guiadas, según el nivel).
- Enunciado del reto en lenguaje simple, con un ícono del NPC/mentor dando la instrucción.
- Botón "Ejecutar" para correr la solución y ver la reacción animada del escenario.
- Botón de ayuda/pista siempre visible, sin penalización agresiva.
- Indicador de progreso dentro del nivel (ej. "Reto 2 de 5").

### 7. Resultado del reto
- Pantalla de victoria o derrota clara: siempre con ícono + texto (nunca solo color, por accesibilidad).
- En caso de error: feedback generado por IA en lenguaje simple, explicando qué pasó y cómo corregirlo.
- En caso de éxito: resumen de lo aprendido y recompensa obtenida (XP, ítem).
- Botones: "Reintentar" (si falló) o "Continuar" (si ganó).

### 8. Subida de nivel / recompensa
- Animación de "level up" del personaje (con versión reducida/estática si el usuario activó Reduce Motion).
- Muestra el nuevo ítem, insignia o concepto de lógica desbloqueado.
- Actualización visible de la barra de XP y del progreso en el mapa de mundo.
- Botón para volver al Mapa de mundo.

---

## Grupo 3 — Progreso y usuario

### 9. Perfil del jugador
- Avatar del personaje con su nivel actual.
- Estadísticas: XP total, racha de días activos, insignias/logros obtenidos.
- Historial resumido de niveles completados.
- Acceso a Configuración desde esta pantalla.

### 10. Inventario / "libro de hechizos"
- Colección visual de los conceptos de lógica ya aprendidos, representados como ítems o "hechizos" coleccionables en pixel art.
- Cada ítem es tocable y muestra una tarjeta con el concepto explicado en lenguaje simple (ej. "Condicional if/else").
- Filtro u organización por módulo o por orden de obtención.

### 11. Configuración
- Accesibilidad: tamaño de texto (hasta 1.5x), activar/desactivar Reduce Motion, subtítulos, volumen de sonido.
- Idioma de la app.
- Gestión de cuenta (cerrar sesión, cambiar contraseña, eliminar cuenta).
- Enlace a la pantalla de Ayuda.

---

## Grupo 4 — Soporte

### 12. Ayuda / tutorial contextual
- Accesible desde cualquier pantalla mediante un ícono fijo (ej. un botón con el mentor/NPC).
- Explicaciones cortas y específicas según en qué pantalla se invoque (tooltips o modal ligero).
- Sección de preguntas frecuentes básicas.

### 13. Notificaciones / racha diaria
- Pantalla o modal que aparece al abrir la app si hay una racha en riesgo o un recordatorio pendiente.
- Mensaje motivacional tipo "Tu personaje te espera" con la racha actual visible.
- Botón directo para ir al Mapa de mundo y continuar el reto del día.
