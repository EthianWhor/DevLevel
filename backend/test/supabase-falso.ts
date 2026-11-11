// Supabase falso en memoria para las pruebas.
// Imita solo lo que usa el backend: consultas encadenadas (select, eq, lt, gt,
// in, order, limit, single, maybeSingle, insert, update, upsert) y las
// funciones de auth (createUser, deleteUser, updateUserById, signInWithPassword,
// refreshSession, getUser, resetPasswordForEmail y verifyOtp).
import type { SupabaseClient } from '@supabase/supabase-js';

type Fila = Record<string, unknown>;
type Filtro = (fila: Fila) => boolean;
type Resultado = { data: unknown; error: { code?: string; message: string; status?: number } | null };

// Relaciones que se pueden pedir anidadas en un select, por ejemplo
// retos.select('id, niveles (id, orden)') -> busca el nivel por retos.nivel_id.
const RELACIONES: Record<string, { tabla: string; llave: string }> = {
  niveles: { tabla: 'niveles', llave: 'nivel_id' },
};

const LLAVES_PRIMARIAS: Record<string, string[]> = {
  profiles: ['id'],
  unidades: ['id'],
  niveles: ['id'],
  retos: ['id'],
  progreso_niveles: ['user_id', 'nivel_id'],
  intentos_retos: ['id'],
};

// Divide "a, b, rel (c, d)" en partes respetando los paréntesis.
function partirColumnas(columnas: string): string[] {
  const partes: string[] = [];
  let actual = '';
  let profundidad = 0;
  for (const c of columnas) {
    if (c === '(') profundidad++;
    if (c === ')') profundidad--;
    if (c === ',' && profundidad === 0) {
      partes.push(actual.trim());
      actual = '';
    } else {
      actual += c;
    }
  }
  if (actual.trim()) partes.push(actual.trim());
  return partes;
}

export class BaseFalsa {
  tablas: Record<string, Fila[]> = {
    profiles: [],
    unidades: [],
    niveles: [],
    retos: [],
    progreso_niveles: [],
    intentos_retos: [],
  };
  // Códigos de recuperación "enviados por correo" (correo -> código).
  codigosRecuperacion = new Map<string, string>();
  private siguienteId: Record<string, number> = {};
  private ultimaHora = 0;

  // Hora estrictamente creciente para que el orden de los intentos sea exacto.
  ahora(): string {
    this.ultimaHora = Math.max(Date.now(), this.ultimaHora + 1);
    return new Date(this.ultimaHora).toISOString();
  }

  nuevoId(tabla: string): number {
    const maximo = Math.max(0, ...this.tablas[tabla].map((f) => Number(f.id) || 0));
    this.siguienteId[tabla] = Math.max(this.siguienteId[tabla] ?? 0, maximo) + 1;
    return this.siguienteId[tabla];
  }

  proyectar(tabla: string, fila: Fila, columnas: string): Fila {
    if (columnas.trim() === '*' || columnas.trim() === '') return { ...fila };
    const salida: Fila = {};
    for (const parte of partirColumnas(columnas)) {
      const anidada = parte.match(/^(\w+)\s*\((.*)\)$/);
      if (anidada) {
        const [, nombre, internas] = anidada;
        const relacion = RELACIONES[nombre];
        const relacionada = this.tablas[relacion.tabla].find((f) => f.id === fila[relacion.llave]);
        salida[nombre] = relacionada ? this.proyectar(relacion.tabla, relacionada, internas) : null;
      } else {
        salida[parte] = fila[parte];
      }
    }
    return salida;
  }
}

class Consulta implements PromiseLike<Resultado> {
  private operacion: 'select' | 'insert' | 'update' | 'upsert' = 'select';
  private columnas = '*';
  private devolver = false;
  private filtros: Filtro[] = [];
  private ordenes: { columna: string; ascendente: boolean }[] = [];
  private limite: number | null = null;
  private modo: 'lista' | 'single' | 'maybeSingle' = 'lista';
  private datos: Fila[] = [];
  private cambios: Fila = {};
  private opcionesUpsert: { onConflict?: string; ignoreDuplicates?: boolean } = {};

  constructor(
    private base: BaseFalsa,
    private tabla: string,
  ) {}

  select(columnas = '*') {
    this.columnas = columnas;
    if (this.operacion !== 'select') this.devolver = true;
    return this;
  }
  insert(filas: Fila | Fila[]) {
    this.operacion = 'insert';
    this.datos = Array.isArray(filas) ? filas : [filas];
    return this;
  }
  update(cambios: Fila) {
    this.operacion = 'update';
    this.cambios = cambios;
    return this;
  }
  upsert(filas: Fila | Fila[], opciones: { onConflict?: string; ignoreDuplicates?: boolean } = {}) {
    this.operacion = 'upsert';
    this.datos = Array.isArray(filas) ? filas : [filas];
    this.opcionesUpsert = opciones;
    return this;
  }
  eq(columna: string, valor: unknown) {
    this.filtros.push((f) => f[columna] === valor);
    return this;
  }
  lt(columna: string, valor: unknown) {
    this.filtros.push((f) => (f[columna] as number | string) < (valor as number | string));
    return this;
  }
  gt(columna: string, valor: unknown) {
    this.filtros.push((f) => (f[columna] as number | string) > (valor as number | string));
    return this;
  }
  in(columna: string, valores: unknown[]) {
    this.filtros.push((f) => valores.includes(f[columna]));
    return this;
  }
  order(columna: string, opciones: { ascending?: boolean } = {}) {
    this.ordenes.push({ columna, ascendente: opciones.ascending !== false });
    return this;
  }
  limit(n: number) {
    this.limite = n;
    return this;
  }
  single() {
    this.modo = 'single';
    return this;
  }
  maybeSingle() {
    this.modo = 'maybeSingle';
    return this;
  }

  then<A = Resultado, B = never>(
    alResolver?: ((valor: Resultado) => A | PromiseLike<A>) | null,
    alFallar?: ((razon: unknown) => B | PromiseLike<B>) | null,
  ): PromiseLike<A | B> {
    return Promise.resolve()
      .then(() => this.ejecutar())
      .then(alResolver, alFallar);
  }

  private filasDeTabla() {
    return this.base.tablas[this.tabla];
  }

  private ejecutar(): Resultado {
    let filas: Fila[];

    if (this.operacion === 'insert') {
      const llaves = LLAVES_PRIMARIAS[this.tabla];
      filas = [];
      for (const dato of this.datos) {
        const fila = this.conDefectos(dato);
        const repetida = this.filasDeTabla().some((f) => llaves.every((l) => f[l] === fila[l]));
        if (repetida) {
          return { data: null, error: { code: '23505', message: 'Llave duplicada' } };
        }
        this.filasDeTabla().push(fila);
        filas.push(fila);
      }
      if (!this.devolver) return { data: null, error: null };
    } else if (this.operacion === 'upsert') {
      const llaves = (this.opcionesUpsert.onConflict ?? LLAVES_PRIMARIAS[this.tabla].join(','))
        .split(',')
        .map((l) => l.trim());
      filas = [];
      for (const dato of this.datos) {
        const existente = this.filasDeTabla().find((f) => llaves.every((l) => f[l] === dato[l]));
        if (existente) {
          if (this.opcionesUpsert.ignoreDuplicates) continue;
          Object.assign(existente, dato);
          filas.push(existente);
        } else {
          const fila = this.conDefectos(dato);
          this.filasDeTabla().push(fila);
          filas.push(fila);
        }
      }
      if (!this.devolver) return { data: null, error: null };
    } else if (this.operacion === 'update') {
      filas = this.filasDeTabla().filter((f) => this.filtros.every((filtro) => filtro(f)));
      for (const fila of filas) Object.assign(fila, this.cambios);
      if (!this.devolver) return { data: null, error: null };
    } else {
      filas = this.filasDeTabla().filter((f) => this.filtros.every((filtro) => filtro(f)));
    }

    filas = [...filas];
    for (const { columna, ascendente } of [...this.ordenes].reverse()) {
      filas.sort((a, b) => {
        const x = a[columna] as number | string;
        const y = b[columna] as number | string;
        return (x < y ? -1 : x > y ? 1 : 0) * (ascendente ? 1 : -1);
      });
    }
    if (this.limite !== null) filas = filas.slice(0, this.limite);

    const proyectadas = filas.map((f) => this.base.proyectar(this.tabla, f, this.columnas));

    if (this.modo === 'lista') return { data: proyectadas, error: null };
    if (proyectadas.length > 1 || (this.modo === 'single' && proyectadas.length === 0)) {
      return { data: null, error: { code: 'PGRST116', message: 'Se esperaba una sola fila' } };
    }
    return { data: proyectadas[0] ?? null, error: null };
  }

  // Valores por defecto de las columnas, como en schema.sql.
  private conDefectos(dato: Fila): Fila {
    const fila = { ...dato };
    if (this.tabla === 'profiles') {
      return {
        nombre_heroe: null,
        avatar: null,
        xp: 0,
        nivel: 1,
        racha_actual: 0,
        racha_maxima: 0,
        ultima_actividad: null,
        created_at: this.base.ahora(),
        ...fila,
      };
    }
    if (this.tabla === 'intentos_retos' || this.tabla === 'retos') {
      fila.id ??= this.base.nuevoId(this.tabla);
    }
    if (this.tabla === 'intentos_retos') fila.created_at ??= this.base.ahora();
    if (this.tabla === 'progreso_niveles') fila.completado_at ??= this.base.ahora();
    return fila;
  }
}

type UsuarioFalso = { id: string; email: string; password: string };

export function crearSupabaseFalso() {
  const base = new BaseFalsa();
  const usuarios = new Map<string, UsuarioFalso>();
  const tokens = new Map<string, string>(); // token -> id de usuario
  const refreshTokens = new Map<string, string>();
  let contador = 0;

  function crearSesion(usuario: UsuarioFalso) {
    contador++;
    const token = `token-${usuario.id}-${contador}`;
    const refresh = `refresh-${usuario.id}-${contador}`;
    tokens.set(token, usuario.id);
    refreshTokens.set(refresh, usuario.id);
    return {
      access_token: token,
      refresh_token: refresh,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: usuario.id, email: usuario.email },
    };
  }

  const auth = {
    admin: {
      async createUser({ email, password }: { email: string; password: string }) {
        if ([...usuarios.values()].some((u) => u.email === email)) {
          return {
            data: { user: null },
            error: { code: 'email_exists', status: 422, message: 'Ya registrado' },
          };
        }
        contador++;
        const usuario = { id: `00000000-0000-4000-8000-${String(contador).padStart(12, '0')}`, email, password };
        usuarios.set(usuario.id, usuario);
        return { data: { user: { id: usuario.id, email } }, error: null };
      },
      async deleteUser(id: string) {
        usuarios.delete(id);
        return { data: null, error: null };
      },
      async updateUserById(id: string, cambios: { password?: string }) {
        const usuario = usuarios.get(id);
        if (!usuario) return { data: { user: null }, error: { status: 404, message: 'No existe' } };
        if (cambios.password !== undefined) {
          if (cambios.password === usuario.password) {
            return {
              data: { user: null },
              error: { code: 'same_password', status: 422, message: 'Misma contraseña' },
            };
          }
          usuario.password = cambios.password;
        }
        return { data: { user: { id: usuario.id, email: usuario.email } }, error: null };
      },
    },
    // Como Supabase: no dice si el correo existe. Solo "envía" el código si hay cuenta.
    async resetPasswordForEmail(email: string) {
      if ([...usuarios.values()].some((u) => u.email === email)) {
        base.codigosRecuperacion.set(email, String(100000 + contador));
      }
      return { data: {}, error: null };
    },
    async verifyOtp({ email, token, type }: { email: string; token: string; type: string }) {
      const usuario = [...usuarios.values()].find((u) => u.email === email);
      if (type !== 'recovery' || !usuario || base.codigosRecuperacion.get(email) !== token) {
        return {
          data: { session: null, user: null },
          error: { code: 'otp_expired', status: 403, message: 'Token has expired or is invalid' },
        };
      }
      base.codigosRecuperacion.delete(email); // cada código sirve una sola vez
      const session = crearSesion(usuario);
      return { data: { session, user: session.user }, error: null };
    },
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      const usuario = [...usuarios.values()].find((u) => u.email === email);
      if (!usuario || usuario.password !== password) {
        return {
          data: { session: null, user: null },
          error: { code: 'invalid_credentials', status: 400, message: 'Invalid login credentials' },
        };
      }
      const session = crearSesion(usuario);
      return { data: { session, user: session.user }, error: null };
    },
    async refreshSession({ refresh_token }: { refresh_token: string }) {
      const id = refreshTokens.get(refresh_token);
      const usuario = id ? usuarios.get(id) : undefined;
      if (!usuario) {
        return {
          data: { session: null, user: null },
          error: { code: 'refresh_token_not_found', status: 400, message: 'No existe' },
        };
      }
      refreshTokens.delete(refresh_token); // cada refresh token se usa una vez
      const session = crearSesion(usuario);
      return { data: { session, user: session.user }, error: null };
    },
    async getUser(token: string) {
      const id = tokens.get(token);
      const usuario = id ? usuarios.get(id) : undefined;
      if (!usuario) {
        return { data: { user: null }, error: { status: 401, message: 'Token inválido' } };
      }
      return { data: { user: { id: usuario.id, email: usuario.email } }, error: null };
    },
  };

  const cliente = {
    from: (tabla: string) => new Consulta(base, tabla),
    auth,
  } as unknown as SupabaseClient;

  return { cliente, base };
}
