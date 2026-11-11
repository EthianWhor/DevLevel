-- =============================================================
-- DevLevel — Esquema de la base de datos (Supabase / Postgres)
-- Ejecutar completo en: Supabase > SQL Editor > New query > Run
-- Se puede volver a ejecutar: primero borra las tablas y el tipo.
-- =============================================================

drop table if exists public.inventario cascade;
drop table if exists public.intentos_retos cascade;
drop table if exists public.progreso_niveles cascade;
drop table if exists public.retos cascade;
drop table if exists public.niveles cascade;
drop table if exists public.unidades cascade;
drop table if exists public.profiles cascade;
drop type if exists public.tipo_reto;

-- -------------------------------------------------------------
-- profiles: datos de juego de cada usuario.
-- El id es el mismo del usuario en Supabase Auth (auth.users),
-- así que al borrar la cuenta se borra también su perfil.
-- -------------------------------------------------------------
create table public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  nombre_heroe     text check (char_length(nombre_heroe) between 2 and 20),
  avatar           text,
  xp               integer not null default 0 check (xp >= 0),
  nivel            integer not null default 1 check (nivel >= 1),
  racha_actual     integer not null default 0 check (racha_actual >= 0),
  racha_maxima     integer not null default 0 check (racha_maxima >= 0),
  ultima_actividad date,
  -- Objetos equipados en la mazmorra: arma, armadura y amuleto (id o null).
  equipo           jsonb not null default '{"arma": null, "armadura": null, "amuleto": null}'::jsonb,
  created_at       timestamptz not null default now()
);

-- -------------------------------------------------------------
-- unidades: los 5 bloques temáticos del módulo de lógica.
-- -------------------------------------------------------------
create table public.unidades (
  id          smallint primary key,
  orden       smallint not null unique,
  titulo      text not null,
  descripcion text not null
);

-- -------------------------------------------------------------
-- niveles: los 15 niveles. "orden" es la posición en el camino
-- (1 a 15) y define cuál se desbloquea después de cuál.
-- Cada nivel enseña un concepto, que al completarlo se guarda
-- como "hechizo" en el Libro de hechizos.
-- -------------------------------------------------------------
create table public.niveles (
  id                  smallint primary key,
  unidad_id           smallint not null references public.unidades (id),
  orden               smallint not null unique,
  titulo              text not null,
  concepto_titulo     text not null,
  concepto_texto      text not null,
  concepto_ejemplo    text,
  hechizo_nombre      text not null,
  hechizo_descripcion text not null,
  xp_recompensa       integer not null default 50 check (xp_recompensa > 0)
);

-- -------------------------------------------------------------
-- retos: los ejercicios de cada nivel.
--   opcion_multiple -> opciones: ["a","b","c"], respuesta: 1   (índice)
--   ordenar         -> opciones: pasos desordenados, respuesta: [2,0,1] (orden correcto de índices)
--   completar       -> opciones: palabras posibles,  respuesta: 0   (índice)
-- La columna "respuesta" NUNCA se envía a la app: solo la usa el backend.
-- -------------------------------------------------------------
--   mazmorra        -> opciones: la mazmorra (mapa, energía, objetivos...), respuesta: { solucion, solucionExtras }
create type public.tipo_reto as enum ('opcion_multiple', 'ordenar', 'completar', 'mazmorra');

create table public.retos (
  id                   serial primary key,
  nivel_id             smallint not null references public.niveles (id) on delete cascade,
  orden                smallint not null,
  tipo                 public.tipo_reto not null,
  enunciado            text not null,
  codigo               text,
  opciones             jsonb not null,
  respuesta            jsonb not null,
  explicacion_correcta text not null,
  explicacion_error    text not null,
  pista                text not null,
  unique (nivel_id, orden)
);

-- -------------------------------------------------------------
-- progreso_niveles: qué niveles completó cada usuario.
-- Una fila por usuario y nivel; si repite el nivel se actualiza.
-- -------------------------------------------------------------
create table public.progreso_niveles (
  user_id       uuid not null references public.profiles (id) on delete cascade,
  nivel_id      smallint not null references public.niveles (id) on delete cascade,
  estrellas     smallint not null check (estrellas between 1 and 3),
  completado_at timestamptz not null default now(),
  primary key (user_id, nivel_id)
);

-- -------------------------------------------------------------
-- intentos_retos: cada respuesta que envía un usuario.
-- Sirve para calcular las estrellas (menos errores = más estrellas).
-- -------------------------------------------------------------
create table public.intentos_retos (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  reto_id    integer not null references public.retos (id) on delete cascade,
  respuesta  jsonb not null,
  correcto   boolean not null,
  detalle    jsonb, -- resultado de una mazmorra: vida, monedas, objetivos cumplidos
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------
-- inventario: objetos que ganó cada jugador (normales y míticos).
-- -------------------------------------------------------------
create table public.inventario (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  objeto_id   text not null,
  nivel_id    smallint references public.niveles (id) on delete set null,
  mitico      boolean not null default false,
  obtenido_at timestamptz not null default now(),
  primary key (user_id, objeto_id)
);

create index intentos_retos_user_reto_idx on public.intentos_retos (user_id, reto_id);
create index niveles_unidad_idx on public.niveles (unidad_id);

-- -------------------------------------------------------------
-- Seguridad: RLS activado en todas las tablas y SIN políticas.
-- Así nadie puede leer ni escribir con la llave pública de Supabase.
-- Solo el backend entra, porque usa la llave secreta (que se salta RLS).
-- -------------------------------------------------------------
alter table public.profiles         enable row level security;
alter table public.unidades         enable row level security;
alter table public.niveles          enable row level security;
alter table public.retos            enable row level security;
alter table public.progreso_niveles enable row level security;
alter table public.intentos_retos   enable row level security;
alter table public.inventario       enable row level security;
