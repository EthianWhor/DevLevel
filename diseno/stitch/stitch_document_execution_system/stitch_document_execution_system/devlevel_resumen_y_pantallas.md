# DevLevel
### Resumen de propuesta y pantallas de la aplicación (RPG pixel art)
Ethian White y Tatiana Mayorga · Desarrollo Móvil · Universidad de La Sabana

---

## Resumen del documento (Fase 1)

DevLevel es una aplicación móvil (React Native) que enseña lógica de programación —no sintaxis ni carrera de desarrollador— a jóvenes de 13 a 25 años, y de forma secundaria a profesionales de 22 a 30 años, mediante niveles cortos y progresivos con retos interactivos y una dinámica de juego.

**Problema:**
- Aprender a programar hoy es abrumador por exceso de información desordenada, no por falta de recursos.
- Las tasas de finalización de los MOOCs rondan apenas el 5% y el 15% de los inscritos (Jordan, 2015).

**Análisis competitivo:**
- SoloLearn, Mimo, Codecademy y CodeCombat enseñan sintaxis o empleabilidad, no lógica para la vida diaria.
- La práctica real queda casi siempre detrás de un muro de pago (modelo freemium).
- El contenido de calidad está mayormente en inglés y pensado para EE. UU.
- Las plataformas grandes (Codecademy) abruman por exceso de opciones al usuario nuevo.

**Propuesta única de valor:**
- Lógica y pensamiento computacional como núcleo, con la sintaxis como herramienta y no como fin.
- Un único camino progresivo por niveles, sin parálisis por exceso de opciones.
- Contenido nativo en español, pensado para el contexto latinoamericano.
- Retroalimentación adaptativa apoyada en IA.

**Alcance del semestre (MVP):**
- App móvil con autenticación, sistema de niveles, retos interactivos y seguimiento de progreso.
- Un módulo completo de lógica con 15 a 20 niveles.
- La integración de IA para retroalimentación es deseable, no crítica para el MVP.

**Accesibilidad:**
- Compromiso con WCAG 2.2 nivel AA: lector de pantalla, contraste 4.5:1, texto escalable hasta 1.5x, sin depender solo del color, sin gestos complejos obligatorios, soporte a Reduce Motion y lenguaje simple.

**Stack técnico sugerido:**
- Frontend: React Native + Reanimated / Lottie para animaciones.
- Backend: Supabase o Firebase (autenticación, base de datos, progreso).
- IA: APIs de modelos de lenguaje para retroalimentación adaptativa sobre los ejercicios.

---

## Pantallas propuestas — estilo RPG pixel art

Organizadas en cuatro grupos, siguiendo la lógica de una app tipo videojuego.

### 1. Onboarding y cuenta
1. Splash / logo animado en pixel art
2. Onboarding narrativo — presenta el mundo y la misión del jugador
3. Registro / Login (correo o social)
4. Selección o creación de personaje (avatar pixel, clase o rol temático)

### 2. Núcleo del juego
5. Mapa de mundo (overworld) — niveles como zonas o pueblos desbloqueables en un camino único
6. Pantalla de nivel / reto — editor de código simplificado junto al escenario visual del "combate" o puzzle
7. Resultado del reto — victoria o derrota, feedback de IA en lenguaje simple, con ícono y texto (nunca solo color)
8. Subida de nivel / recompensa — animación de "level up", con versión reducida si Reduce Motion está activo

### 3. Progreso y usuario
9. Perfil del jugador — XP, racha, insignias o logros, estadísticas
10. Inventario o "libro de hechizos" — conceptos de lógica ya aprendidos, como ítems coleccionables
11. Configuración — tamaño de texto, Reduce Motion, sonido/subtítulos, idioma

### 4. Soporte
12. Ayuda / tutorial contextual, accesible desde cualquier nivel
13. Notificaciones / racha diaria — recordatorio tipo "tu personaje te espera"
