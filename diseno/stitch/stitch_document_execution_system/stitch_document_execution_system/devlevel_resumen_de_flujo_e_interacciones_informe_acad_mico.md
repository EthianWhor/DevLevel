# DevLevel — Especificación Integral de Flujo e Interacciones de Usuario
**Documento Técnico y Metodológico para Informe Académico**  
**Autores del Proyecto:** Ethian White & Tatiana Mayorga  
**Asignatura:** Desarrollo Móvil · Universidad de La Sabana  
**Versión del Prototipo:** v1.0.0 (MVP)  
**Estilo Visual:** RPG Pixel Art (*Retro-Logic Design System*)  
**Estándar de Accesibilidad:** WCAG 2.2 Nivel AA

---

## 1. Resumen Ejecutivo y Arquitectura de la Solución

**DevLevel** es una aplicación móvil diseñada para enseñar fundamentos de pensamiento computacional y algoritmos a jóvenes (13-25 años) sin la sobrecarga sintáctica convencional de los entornos tradicionales. Inspirada en la narrativa y mecánicas de un videojuego de rol (RPG de 8/16 bits), la experiencia transforma abstracciones complejas (variables, condicionales, bucles, arreglos) en hechizos, combates tácticos e ítems coleccionables en un grimorio.

El sistema se estructura en **13 pantallas maestras** articuladas en **4 grupos funcionales**, garantizando un ciclo de aprendizaje progresivo, alta retención diaria y cumplimiento estricto de accesibilidad e inclusión digital.

---

## 2. Mapa Global de Flujo y Navegación (User Journey)

```
[ INICIO ]
    │
    ▼
[ 1. Splash Screen ] ────────(Carga automática / 2.5s)─────────┐
    │                                                           │ (Usuario recurrente)
    ▼ (Primera sesión)                                          ▼
[ 2. Onboarding Narrativo ] ───(Skip o Completar)───► [ 3. Registro / Login ]
                                                                │
                                                                ▼
                                                   [ 4. Selección de Personaje ]
                                                                │
                                                                ▼
┌───────────────────────────────────────────────────────────────┴────────────────────────────────────────┐
│                                 NÚCLEO PRINCIPAL (OVERWORLD & APP SHELL)                                │
│                                                                                                        │
│                           ┌────────────────── [ 5. Mapa Overworld ] ◄─────────────────┐                │
│                           │                              │                            │                │
│                           ▼ (Tap en Nivel)               ▼ (Alerta / Recordatorio)    │ (Continuar)    │
│                  [ 6. Editor de Reto ]        [ 13. Notificaciones / Racha ]          │                │
│                           │                              │                            │                │
│                           ▼ (Ejecutar Código)            └─────► [ Jugar Reto Hoy ] ──┘                │
│                  [ 7. Resultado del Reto ]                                                             │
│                      ├── (Fallo) ──► Reintentar / Ir a [ 12. Santuario de Ayuda ]                      │
│                      └── (Éxito) ──► [ 8. Subida de Nivel / Level Up ] ──► (Vuelve al Mapa)            │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
    │                                  │                                   │
    ▼ (Tab: Spells)                    ▼ (Tab: Hero)                       ▼ (Tab: Config)
[ 10. Libro de Hechizos ]     [ 9. Perfil del Jugador ]          [ 11. Configuración & Accesibilidad ]
```

---

## 3. Matriz Detallada de Pantallas, Componentes e Interacciones

### GRUPO 1: Onboarding y Gestión de Cuenta

| ID | Nombre de Pantalla | Componentes Clave | Disparadores e Interacciones (Inputs / Gestos) | Estado de Destino y Transición |
|---|---|---|---|---|
| **01** | **Splash Screen Animada** | - Emblema de escudo pixel art con brackets `< >` en animación SVG continua.<br>- Indicadores de estado (`REALM: ONLINE`, `60 FPS`, `128 MP`).<br>- Barra de progreso segmentada ("Invocando Arch-Mage..."). | - **Timer (Automático):** 2.5s de precarga de recursos.<br>- **Tap en pantalla:** Omitir espera (skip rápido). | Transición *Fade-out* hacia **Onboarding (02)** si es primera ejecución, o hacia **Mapa Overworld (05)** si la sesión Supabase está guardada. |
| **02** | **Onboarding Narrativo** | - Diálogos RPG con el mentor Arch-Mage.<br>- Carrusel de 3 slides tácticas.<br>- Indicadores de paso con gemas pixel art.<br>- Botones "Siguiente" y "Saltar". | - **Swipe Horizontal / Tap en "Siguiente":** Avanza cutscene narrativo.<br>- **Tap en "Saltar":** Salto inmediato a autenticación. | Al completar el 3er slide, botón muta a "Comenzar Viaje" y redirige a **Registro / Login (03)**. |
| **03** | **Registro / Login** | - Contenedor con marco de pergamino 8-bit.<br>- Inputs validados: Correo Mágico y Clave Secreta.<br>- Autenticación federada (Google / Apple).<br>- Toggle interactivo "¿Nuevo aventurero? Crear cuenta". | - **Focus en inputs:** Despliegue de teclado táctil con padding seguro.<br>- **Validación en blur:** Muestra checkmark verde o error semántico (texto + icono).<br>- **Submit:** Envío de payload a Supabase Auth. | Autenticación válida redirige a **Selección de Personaje (04)** para nuevos usuarios o **Mapa (05)** para recurrentes. |
| **04** | **Selección de Personaje** | - Carrusel de avatares pixel art (Explorador, Mago del Código, Guerrero Lógico).<br>- Selector de paleta de túnica/armadura.<br>- Campo editable "Nombre del Héroe".<br>- CTA "Comenzar Aventura". | - **Tap en tarjeta de héroe:** Activa borde de selección dorado (`#ffd700`) y actualiza vista previa.<br>- **Tap en color:** Modifica tinte del sprite.<br>- **Tap en CTA:** Persiste perfil inicial en base de datos. | Transición con efecto de apertura de mapa hacia **Mapa Overworld (05)**. |

---

### GRUPO 2: Núcleo del Juego (Gameplay Loop de Lógica)

| ID | Nombre de Pantalla | Componentes Clave | Disparadores e Interacciones (Inputs / Gestos) | Estado de Destino y Transición |
|---|---|---|---|---|
| **05** | **Mapa de Mundo (Overworld)** | - Sendero secuencial con nodos de nivel (Completado, Activo, Bloqueado).<br>- Sprite del héroe posicionado con animación *idle/walk*.<br>- Banner superior de progreso por isla (Sector 1: Variables, Sector 2: Bucles). | - **Tap en nodo activo:** Despliega modal resumen de nivel (Recompensas XP, Enunciado breve).<br>- **Tap en nodo bloqueado:** Emite feedback sonoro leve y mensaje de requerimiento previo.<br>- **Tap en "Entrar al Reto":** Inicia partida. | Transición hacia **Editor de Reto (06)**. |
| **06** | **Pantalla de Reto / Editor** | - **Mitad superior:** Arena gráfica de combate/puzzle con sprites animados.<br>- **Mitad inferior:** Editor de lógica visual mediante bloques estructurados / líneas guiadas.<br>- Botón flotante de Mentor/Ayuda rápida.<br>- CTA "Ejecutar Solución". | - **Drag & Drop / Tap secuencial:** Ensambla bloques lógicos en el slot de ejecución.<br>- **Tap en botón de Ayuda:** Abre tooltip no intrusivo o redirige a **Santuario (12)** sin coste.<br>- **Tap en "Ejecutar":** Dispara animación en la arena superior evaluando el algoritmo paso a paso. | - Si la lógica es correcta: Transiciona a **Resultado de Victoria (07)**.<br>- Si falla: Transiciona a **Resultado con Feedback IA (07)**. |
| **07** | **Resultado del Reto** | - Indicador de estado unívoco (Victoria / Derrota) con texto explícito e icono distintivo.<br>- Tarjeta de *Feedback Asistido por IA* explicando el error lógico en lenguaje deductivo.<br>- Desglose de botín (+150 XP, Gema desbloqueada).<br>- Botones "Reintentar" o "Continuar". | - **Tap en "Reintentar":** Reinicia el escenario en **Editor (06)** manteniendo la sintaxis previa para depuración.<br>- **Tap en "Continuar":** Procesa balance de experiencia. | Si el XP acumulado supera el umbral de nivel, pasa a **Subida de Nivel (08)**; si no, regresa a **Mapa (05)**. |
| **08** | **Subida de Nivel (Level Up)** | - Fanfarria visual de *Level Up* con halo dorado y chispas de partículas.<br>- Comparador de atributos (Nivel previo vs. Nuevo nivel alcanzado).<br>- Carta de recompensa: Nuevo Hechizo incorporado al inventario.<br>- Botón "Reclamar y Volver al Mapa". | - **Tap en "Reclamar":** Activa efecto sonoro retro de fanfarria y animación de guardado.<br>- Cumple con `prefers-reduced-motion` mostrando animación estática instantánea si está activo. | Retorno al **Mapa Overworld (05)** con el siguiente nodo desbloqueado. |

---

### GRUPO 3: Progreso del Usuario y Parametrización

| ID | Nombre de Pantalla | Componentes Clave | Disparadores e Interacciones (Inputs / Gestos) | Estado de Destino y Transición |
|---|---|---|---|---|
| **09** | **Perfil del Jugador** | - Tarjeta de héroe con nivel actual, rango y gremio.<br>- Métricas: XP total acumulado, racha de días, puzzles resueltos.<br>- Vitrina de insignias/logros pixel art desbloqueados.<br>- Historial de mazmorras y temas dominados. | - **Tap en insignia:** Abre tarjeta con fecha de obtención y criterio del logro.<br>- **Tap en botón de engranaje superior:** Acceso rápido a Configuración.<br>- **Navegación inferior:** Pestaña 'Hero' activa. | Permite consultar estadísticas personales o navegar a otras secciones vía Bottom Bar. |
| **10** | **Inventario / Libro de Hechizos** | - Estante/Grimorio categorizado por conceptos (Variables, Decisiones `if/else`, Bucles `while/for`, Funciones).<br>- Tarjetas de hechizo con estado (Desbloqueado / Bloqueado con candado).<br>- Ficha de detalle con analogía cotidiana ("Un cofre con etiqueta = Variable"). | - **Tap en hechizo desbloqueado:** Abre modal desplegable con la explicación conceptual y ejemplo ejecutable.<br>- **Filtros por categoría:** Pestañas superiores para filtrar el catálogo sin recarga. | Modal interactivo in-place sin abandonar el grimorio. |
| **11** | **Configuración y Accesibilidad** | - **Control de Escalado de Texto:** Selector 1.0x, 1.25x, 1.5x con previsualizador de código en vivo.<br>- **Toggles de Accesibilidad:** Reducir movimiento, Modo alto contraste, Subtítulos de diálogo, Compatibilidad VoiceOver/TalkBack.<br>- Sliders de Chiptune BGM y SFX.<br>- Gestión de cuenta segura (Supabase Sync, Logout, Delete). | - **Tap en escala de texto:** Aplica clase de tamaño dinámico en toda la aplicación de inmediato.<br>- **Toggle Reduce Motion:** Desactiva transiciones y keyframes en el DOM.<br>- **Sliders de volumen:** Ajuste continuo de audio.<br>- **Tap en Cerrar Sesión:** Modal de confirmación destructiva. | Los cambios se guardan localmente (`AsyncStorage`) y en la nube en tiempo real. |

---

### GRUPO 4: Soporte Contextual y Retención

| ID | Nombre de Pantalla | Componentes Clave | Disparadores e Interacciones (Inputs / Gestos) | Estado de Destino y Transición |
|---|---|---|---|---|
| **12** | **Ayuda / Soporte (Santuario)** | - Oráculo contextual: Reconoce el reto exacto donde el usuario solicitó apoyo.<br>- Diálogo orientativo del Arch-Mage sin revelar la solución directa.<br>- Acciones de rescate: "Pedir Pista (0 XP)", "Metáforas del Reino", "Debugger Mágico".<br>- Acordeones de FAQ y contacto con tutores humanos del gremio. | - **Tap en "Pedir Pista":** Revela pista progresiva nivel 1.<br>- **Tap en acordeón de FAQ:** Expande respuesta con animación suave.<br>- **Tap en "Enviar Mensaje":** Envía ticket al equipo docente/tutores. | Retorno mediante botón 'Atrás' a la pantalla del reto previo preservando el estado de edición. |
| **13** | **Notificaciones y Racha Diaria** | - Alerta de racha en peligro con cuenta regresiva en vivo.<br>- Racha de fuego (7 días consecutivos) con buff de sabiduría activo (+25% XP).<br>- Rastreador semanal de lunes a domingo con cofre de recompensa.<br>- Feed de avisos del gremio y sistema.<br>- CTA "Proteger Racha: Jugar Reto de Hoy". | - **Tap en CTA dorado:** Dirige directamente al reto diario correspondiente.<br>- **Toggle de alertas:** Configuración rápida de recordatorios push diarios a las 20:00.<br>- **Tap en escudo:** Usa un comodín de congelación para proteger la racha si se perdió un día. | Conduce al flujo de juego en **Mapa (05)** o **Reto (06)**. |

---

## 4. Patrones de Diseño, Accesibilidad (WCAG 2.2 AA) y Métricas Académicas

1. **Jerarquía Visual y Tipográfica:**
   - **Display / Retro:** Tipografía de inspiración pixel/grotesk (`Space Grotesk` y etiquetas pixel art) con renderizado nítido (`image-rendering: pixelated`, bordes de 2px a 4px).
   - **Textos de Lectura:** Tamaños mínimos de 14px en móvil con interlineado holgado (1.5) para facilitar la lectura a personas con dislexia o fatiga visual.

2. **Garantía de Contraste Cromático:**
   - Fondo oscuro de alto contraste (`#161308` y `#110e05`) contra acentos oro (`#ffd700`), esmeralda (`#00ff66`), cian (`#00e5ff`) y blanco, superando el ratio de contraste mínimo de **4.5:1** para texto normal y **3:1** para componentes UI interactivos.
   - Ningún estado (éxito, error, advertencia) depende exclusivamente del color: siempre está acompañado de un glifo/icono semántico y texto explícito.

3. **Arquitectura para React Native:**
   - La estructura de pantallas y componentes compartidos (`TopAppBar`, `BottomNavBar`) está diseñada para un mapeo directo a componentes funcionales de **React Native** usando librerías estándar:
     - Navegación: `@react-navigation/native` (Bottom Tabs + Native Stack).
     - Persistencia y Autenticación: `@supabase/supabase-js`.
     - Animaciones y Accesibilidad: `react-native-reanimated` con soporte nativo para `prefers-reduced-motion`.
