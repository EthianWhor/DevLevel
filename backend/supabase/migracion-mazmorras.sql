-- =============================================================
-- DevLevel — Migración al juego de mazmorras
-- Ejecutar UNA vez en: Supabase > SQL Editor > New query > Run
-- No borra usuarios, perfiles ni progreso. Después ejecutar
-- seed-mazmorras.sql para cargar las 15 mazmorras.
-- =============================================================

-- Nuevo tipo de reto: la mazmorra que se resuelve programando.
alter type public.tipo_reto add value if not exists 'mazmorra';

-- Objetos que ganó cada jugador (normales y míticos).
create table if not exists public.inventario (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  objeto_id   text not null,
  nivel_id    smallint references public.niveles (id) on delete set null,
  mitico      boolean not null default false,
  obtenido_at timestamptz not null default now(),
  primary key (user_id, objeto_id)
);

alter table public.inventario enable row level security;

-- Lo que el jugador lleva puesto: { "arma": id | null, "armadura": id | null, "amuleto": id | null }.
alter table public.profiles
  add column if not exists equipo jsonb not null
  default '{"arma": null, "armadura": null, "amuleto": null}'::jsonb;

-- Resultado de cada intento en una mazmorra (vida, monedas, objetivos cumplidos...).
alter table public.intentos_retos add column if not exists detalle jsonb;
