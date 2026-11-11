// Tipos del motor de mazmorras. Este archivo existe igual en el backend
// (backend/src/lib/mazmorra) y en la app (movil/src/juego): no lo cambies en
// un solo lado (hay una prueba que compara las dos copias).

export type Direccion = 'norte' | 'sur' | 'este' | 'oeste';

export type Sensor = 'hay_muro' | 'hay_pincho' | 'hay_enemigo' | 'hay_moneda' | 'en_salida';

export type Condicion = { sensor: Sensor; negada: boolean };

export type Valor = { numero: number } | { variable: string };

export type Accion =
  | 'adelante'
  | 'girar_izquierda'
  | 'girar_derecha'
  | 'saltar'
  | 'atacar'
  | 'recoger'
  | 'invocar_rayo'
  | 'volar'
  | 'atravesar';

export type Instruccion =
  | { tipo: 'accion'; accion: Accion; linea: number }
  | { tipo: 'llamada'; nombre: string; linea: number }
  | { tipo: 'asignar'; variable: string; valor: number; linea: number }
  | { tipo: 'repetir'; veces: Valor; cuerpo: Instruccion[]; linea: number }
  | { tipo: 'mientras'; condicion: Condicion; cuerpo: Instruccion[]; linea: number }
  | { tipo: 'si'; condicion: Condicion; entonces: Instruccion[]; sino: Instruccion[]; linea: number }
  | { tipo: 'funcion'; nombre: string; cuerpo: Instruccion[]; linea: number };

export type ErrorLectura = { linea: number; mensaje: string };

export type Lectura =
  | { ok: true; programa: Instruccion[]; instrucciones: number }
  | { ok: false; error: ErrorLectura };

export type Espacio = 'arma' | 'armadura' | 'amuleto';

export type Objeto = {
  id: string;
  nombre: string;
  espacio: Espacio;
  efecto: string;
  mitico: boolean;
};

export type Equipo = { arma: string | null; armadura: string | null; amuleto: string | null };

export type ObjetivoExtra =
  | { tipo: 'monedas' }
  | { tipo: 'maxInstrucciones'; valor: number }
  | { tipo: 'sinChoques' }
  | { tipo: 'sinDanio' }
  | { tipo: 'derrotarTodos' };

export type ModoEditor = 'bloques' | 'mixto' | 'texto';

export type Mazmorra = {
  nombre: string;
  historia: string;
  modo: ModoEditor;
  // Filas del mapa: # muro, . piso, S inicio, P puerta, C moneda, ^ pinchos,
  // g goblin, o orco, k caballero esqueleto.
  mapa: string[];
  direccionInicial: Direccion;
  energia: number;
  // Instrucciones que aparecen en la paleta de bloques / barra de atajos.
  instrucciones: string[];
  objetivosExtra: ObjetivoExtra[];
  // Objeto normal que da la mazmorra al cumplir todos los objetivos extra.
  objeto: string;
  pista: string;
};

export type TipoEnemigo = 'goblin' | 'orco' | 'caballero';

export type EstadoEnemigo = {
  id: number;
  tipo: TipoEnemigo;
  fila: number;
  col: number;
  vida: number;
  vidaMax: number;
};

export type TipoPaso =
  | 'mover'
  | 'girar'
  | 'saltar'
  | 'chocar'
  | 'pincho'
  | 'atacar'
  | 'golpeRecibido'
  | 'bloqueado'
  | 'enemigoDerrotado'
  | 'moneda'
  | 'rayo'
  | 'volar'
  | 'atravesar'
  | 'revivir';

// Foto del estado después de cada acción: la app la usa para animar.
export type Paso = {
  tipo: TipoPaso;
  linea: number;
  fila: number;
  col: number;
  dir: Direccion;
  vida: number;
  energia: number;
  monedas: number;
  enemigos: EstadoEnemigo[];
  monedasEnMapa: [number, number][];
  danio?: number;
};

export type ResultadoSimulacion = {
  gano: boolean;
  motivo: string | null;
  pasos: Paso[];
  vida: number;
  vidaMax: number;
  energiaRestante: number;
  monedas: number;
  monedasTotales: number;
  choques: number;
  danioRecibido: number;
  enemigosDerrotados: number;
  enemigosTotales: number;
  instrucciones: number;
  // Un valor por cada objetivo extra de la mazmorra, en el mismo orden.
  objetivosCumplidos: boolean[];
};
