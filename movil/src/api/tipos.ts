// Tipos de las respuestas del backend. Deben coincidir con backend/README.md.

export type Avatar = 'explorador' | 'mago' | 'guerrero';

export type Perfil = {
  id: string;
  nombreHeroe: string | null;
  avatar: Avatar | null;
  xp: number;
  nivel: number;
  rachaActual: number;
  rachaMaxima: number;
  ultimaActividad: string | null;
};

export type Usuario = {
  id: string;
  email: string | null;
};

export type Sesion = {
  token: string;
  refreshToken: string;
  expiraEn: number | null; // segundos Unix
};

export type RespuestaSesion = {
  sesion: Sesion;
  usuario: Usuario;
  perfil: Perfil;
};

export type RespuestaMe = {
  usuario: Usuario;
  perfil: Perfil;
};

export type EstadoNivel = 'completado' | 'actual' | 'bloqueado';

export type NivelMapa = {
  id: number;
  orden: number;
  titulo: string;
  xpRecompensa: number;
  estado: EstadoNivel;
  estrellas: number | null;
};

export type UnidadMapa = {
  id: number;
  orden: number;
  titulo: string;
  descripcion: string;
  niveles: NivelMapa[];
};

export type RespuestaMapa = {
  unidades: UnidadMapa[];
  resumen: {
    completados: number;
    total: number;
    nivelActualId: number | null;
  };
};
export type TipoReto = 'opcion_multiple' | 'ordenar' | 'completar';

export type RetoPublico = {
  id: number;
  orden: number;
  tipo: TipoReto;
  enunciado: string;
  codigo: string | null;
  opciones: string[];
  pista: string;
};

export type RespuestaNivel = {
  nivel: {
    id: number;
    orden: number;
    titulo: string;
    conceptoTitulo: string;
    conceptoTexto: string;
    conceptoEjemplo: string | null;
    xpRecompensa: number;
  };
  retos: RetoPublico[];
};