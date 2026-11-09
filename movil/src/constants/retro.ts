// Colores del diseño Retro-Logic (diseno/stitch/.../devlevel_retro_logic/DESIGN.md)
// que usan las pantallas de sesión, personaje y mapa.
// Todas las combinaciones de texto/fondo usadas cumplen contraste 4.5:1.
// Cuando exista el tema completo en src/theme/, estas pantallas pasan a usarlo.
export const Retro = {
  fondo: '#161308', // surface
  superficie: '#231f14', // surface-container
  superficieAlta: '#2e2a1e', // surface-container-high
  borde: '#4d4732', // outline-variant
  texto: '#eae2cf', // on-surface (14.4:1 sobre fondo)
  textoSecundario: '#d0c6ab', // on-surface-variant (10.9:1 sobre fondo)
  textoApagado: '#b3aa90', // para niveles bloqueados (8:1 sobre fondo, 7.1:1 sobre superficie)
  oro: '#ffd700', // primary-container: acción principal
  oroOscuro: '#544600', // bevel inferior del botón dorado
  textoSobreOro: '#221b00', // on-primary-fixed (12.2:1 sobre oro)
  verde: '#4de082', // secondary: completado / XP
  error: '#ffb4ab', // texto de error (10.9:1 sobre fondo)
  azulMana: '#3B82F6',
} as const;

export const AreaTactilMinima = 48;
