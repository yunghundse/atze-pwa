-- ============================================
-- v104 — Crew-Pass Migration
-- Einmal in Supabase SQL-Editor laufen lassen.
-- Idempotent: kann mehrfach ausgeführt werden.
-- ============================================

-- 1) Pass-Creation-Timestamp. NULL = Pass noch nicht erstellt → Blocking-Flow zeigt.
alter table public.profiles
  add column if not exists pass_created_at timestamptz;

-- 2) Kurzer Motto/Tagline-Text (60 chars im UI enforced, 120 hard limit).
alter table public.profiles
  add column if not exists tagline text;

-- 3) Interessen als Array. Nur Strings aus bekannter UI-Liste
--    (Festival, Beach, Bar-Hopping, Sport, Kultur, Natur, Food, Sunset, Chill).
--    Wird client-seitig validiert; DB bleibt locker.
alter table public.profiles
  add column if not exists interests text[] default '{}'::text[];

-- 4) Member-since als garantierter Timestamp (fällt zurück auf created_at wenn vorhanden).
--    Einige Schemas haben created_at bereits; falls nicht, legen wir's separat an.
alter table public.profiles
  add column if not exists member_since timestamptz default now();

-- Back-fill: Wenn created_at existiert, kopiere es in member_since
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='profiles' and column_name='created_at'
  ) then
    update public.profiles
      set member_since = coalesce(member_since, created_at)
      where member_since is null or member_since = now();
  end if;
end $$;

-- 5) Emergency-Contact-Sharing: mit welchen user_ids teilt die Person ihre Notfall-Infos aktiv?
--    Leeres Array = mit niemandem. Löst das alte, implizite Teilen ab.
alter table public.profiles
  add column if not exists emergency_shared_with uuid[] default '{}'::uuid[];

-- Fertig.
-- Nächster Schritt: v104 im Client lädt automatisch alle Felder mit SELECT *.
