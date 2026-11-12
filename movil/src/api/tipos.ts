// Tipos de las respuestas del backend. Deben coincidir con backend/README.md.
import type { Equipo, ErrorLectura, Mazmorra, Objeto } from '@/juego/tipos';

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
  equipo: Equipo;
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

export type ResultadoReto = {
  retoId: number;
  nivelId: number;
  correcta: boolean;
  explicacion: string;
  pista: string | null; 
};

export type ResultadoNivel = {
  nivelId: number;
  primeraVez: boolean;
  errores: number;
  estrellas: number;
  mejoresEstrellas: number;
  xpGanada: number;
  subioDeNivel: boolean;
  nivelAnterior: number;
  nivelNuevo: number;
  progresoNivel: { xpEnNivel: number; xpPorNivel: number };
  racha: { actual: number; maxima: number; cambio: string };
  hechizoDesbloqueado: { nombre: string; descripcion: string } | null;
  siguienteNivelId: number | null;
  objetoGanado: ObjetoGanado | null;
  perfil: Perfil;
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
  retos: (RetoPublico | RetoMazmorra)[];
};

export type RespuestaReto = number | number[];

export type Hechizo = {
  nivelId: number;
  orden: number;
  nivelTitulo: string;
  desbloqueado: boolean;
  estrellas: number | null;
  // Llegan en null mientras el hechizo está bloqueado.
  nombre: string | null;
  descripcion: string | null;
  conceptoTitulo: string | null;
  conceptoTexto: string | null;
  conceptoEjemplo: string | null;
};

export type UnidadHechizos = {
  id: number;
  orden: number;
  titulo: string;
  hechizos: Hechizo[];
};

export type RespuestaHechizos = {
  unidades: UnidadHechizos[];
  resumen: { desbloqueados: number; total: number };
};

// ---------- Mazmorras ----------

export type RetoMazmorra = {
  id: number;
  orden: number;
  tipo: 'mazmorra';
  enunciado: string;
  codigo: string | null;
  opciones: Mazmorra;
  pista: string;
};

export type ResultadoMazmorra = {
  retoId: number;
  nivelId: number;
  correcta: boolean;
  motivo: string | null;
  error: ErrorLectura | null;
  objetivosCumplidos: boolean[];
  resultado: {
    vida: number;
    vidaMax: number;
    energiaRestante: number;
    monedas: number;
    monedasTotales: number;
    instrucciones: number;
  } | null;
  explicacion: string;
  pista: string | null;
};

// equipado: true si se puso solo porque su espacio estaba vacío.
export type ObjetoGanado = Objeto & { nivelId: number; equipado: boolean };

export type ObjetoInventario = Objeto & { nivelId: number | null; obtenidoAt: string };

export type RespuestaInventario = {
  objetos: ObjetoInventario[];
  equipo: Equipo;
};

export type PistaAvanzada = { lineas: string; completa: boolean };
