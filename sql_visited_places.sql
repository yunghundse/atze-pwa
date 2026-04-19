-- =================================================================
-- visited_places — Travel Tracker (v62)
-- Automatic logging of places the user has been.
-- RLS: users can only read/write their own rows.
-- =================================================================

create table if not exists public.visited_places (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  lat          double precision not null,
  lng          double precision not null,
  accuracy     double precision,
  place_name   text,
  city         text,
  country      text,
  visited_at   timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

create index if not exists visited_places_user_visited_idx
  on public.visited_places (user_id, visited_at desc);

create index if not exists visited_places_user_geo_idx
  on public.visited_places (user_id, lat, lng);

alter table public.visited_places enable row level security;

drop policy if exists "visited_places_select_own" on public.visited_places;
create policy "visited_places_select_own"
  on public.visited_places for select
  using (auth.uid() = user_id);

drop policy if exists "visited_places_insert_own" on public.visited_places;
create policy "visited_places_insert_own"
  on public.visited_places for insert
  with check (auth.uid() = user_id);

drop policy if exists "visited_places_update_own" on public.visited_places;
create policy "visited_places_update_own"
  on public.visited_places for update
  using (auth.uid() = user_id);

drop policy if exists "visited_places_delete_own" on public.visited_places;
create policy "visited_places_delete_own"
  on public.visited_places for delete
  using (auth.uid() = user_id);
