-- ============================================
-- v109 — Presence & Home-Location Overhaul
-- Einmal in Supabase SQL-Editor laufen lassen.
-- Idempotent: kann mehrfach ausgeführt werden.
-- ============================================

-- 1) Hide-Last-Seen Liste pro User (wer darf meinen last_active NICHT sehen)
alter table public.profiles
  add column if not exists hide_last_seen_from uuid[] default '{}'::uuid[];

-- 2) Home-Adresse (Straße/Hausnr.) zusätzlich zu home_city_*
alter table public.profiles
  add column if not exists home_address text;

-- 3) GPS-Consent Flag — wer GPS blockiert hat, verliert Live-Features
alter table public.profiles
  add column if not exists gps_consent boolean default false;

-- 4) last_active performanter indexieren für "Wer ist online?"-Queries
create index if not exists idx_profiles_last_active
  on public.profiles (last_active desc nulls last);

-- 5) Home-Coords indexieren für Travel-Distance-Checks
create index if not exists idx_profiles_home_coords
  on public.profiles (home_city_lat, home_city_lng)
  where home_city_lat is not null;

-- 6) RPC: schneller "online?"-Check für andere Nutzer (5-Minuten-Fenster)
--    Berücksichtigt die hide_last_seen_from Liste automatisch.
create or replace function public.get_user_presence(p_user_id uuid)
returns table (
  user_id uuid,
  last_active_visible timestamptz,
  is_online boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hidden boolean;
begin
  -- Prüfen: darf der aufrufende Nutzer den last_active sehen?
  select auth.uid() = any(coalesce(p.hide_last_seen_from, '{}'::uuid[]))
    into v_hidden
    from public.profiles p
    where p.user_id = p_user_id;

  return query
    select
      p.user_id,
      case when coalesce(v_hidden,false) then null else p.last_active end as last_active_visible,
      case
        when p.last_active is null then false
        when p.last_active > (now() - interval '5 minutes') then true
        else false
      end as is_online
    from public.profiles p
    where p.user_id = p_user_id;
end
$$;

grant execute on function public.get_user_presence(uuid) to authenticated;

-- Fertig.
-- Nächster Schritt: App auf v109 laden, Home-Setup erzwingen, Travel-Badge testen.
