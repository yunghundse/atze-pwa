-- =================================================================
-- privacy_consent_log — DSGVO-konforme Einwilligungs-Historie (v72)
-- Jede Moduswahl + Widerruf wird mit Timestamp protokolliert.
-- Rechtsgrundlage: Art. 7 Abs. 1 DSGVO (Nachweispflicht der Einwilligung).
-- RLS: User koennen nur ihre eigenen Logs lesen; INSERT nur fuer sich selbst;
--      UPDATE/DELETE verboten (manipulationssicherer Audit-Trail).
-- =================================================================

create table if not exists public.privacy_consent_log (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  mode              text not null check (mode in ('travel','home','private','cleared')),
  previous_mode     text check (previous_mode is null or previous_mode in ('travel','home','private','cleared')),
  home_city_name    text,
  home_city_country text,
  home_city_lat     double precision,
  home_city_lng     double precision,
  tracking_consent  boolean not null default false,
  deals_consent     boolean not null default false,
  consent_version   integer not null default 1,
  user_agent        text,
  app_version       integer,
  source            text default 'app',
  created_at        timestamptz not null default now()
);

create index if not exists privacy_consent_log_user_created_idx
  on public.privacy_consent_log (user_id, created_at desc);

alter table public.privacy_consent_log enable row level security;

-- SELECT: User kann nur seine eigenen Logs lesen (Auskunftsrecht Art. 15 DSGVO)
drop policy if exists "pcl_select_own" on public.privacy_consent_log;
create policy "pcl_select_own"
  on public.privacy_consent_log for select
  using (auth.uid() = user_id);

-- INSERT: User kann nur fuer sich selbst schreiben
drop policy if exists "pcl_insert_own" on public.privacy_consent_log;
create policy "pcl_insert_own"
  on public.privacy_consent_log for insert
  with check (auth.uid() = user_id);

-- KEIN UPDATE-Policy → Updates sind fuer Normalnutzer gesperrt (Audit-Trail)
-- KEIN DELETE-Policy → Loeschung nur via on delete cascade bei Account-Loeschung
-- (erfuellt gleichzeitig Art. 17 DSGVO "Recht auf Vergessenwerden")

-- =================================================================
-- Optional: Mirror des aktuellen Modus auf profiles (fuer Queries)
-- Wenn die Spalten noch nicht existieren, hinzufuegen:
-- =================================================================
alter table public.profiles
  add column if not exists privacy_mode text check (privacy_mode is null or privacy_mode in ('travel','home','private')),
  add column if not exists home_city_name text,
  add column if not exists home_city_country text,
  add column if not exists home_city_lat double precision,
  add column if not exists home_city_lng double precision,
  add column if not exists privacy_mode_updated_at timestamptz;
