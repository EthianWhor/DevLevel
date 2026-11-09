// Nombres de las fuentes tal como las registra @expo-google-fonts.
export const Fuentes = {
  titulo: 'SpaceGrotesk_700Bold',
  tituloMedio: 'SpaceGrotesk_500Medium',
  cuerpo: 'Inter_400Regular',
  cuerpoNegrita: 'Inter_600SemiBold',
  codigo: 'JetBrainsMono_400Regular',
} as const;

// Tamaños base. React Native los escala solo con el tamaño de letra
// del sistema, así que no hace falta un selector propio.
export const Tamanos = {
  pequeno: 14,
  cuerpo: 16,
  subtitulo: 20,
  titulo: 28,
  grande: 36,
} as const;

export const AlturaLinea = {
  pequeno: 20,
  cuerpo: 24,
  subtitulo: 28,
  titulo: 36,
  grande: 44,
} as const;