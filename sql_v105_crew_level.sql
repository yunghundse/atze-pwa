-- ============================================
-- v105 — Crew-Level Migration
-- Einmal in Supabase SQL-Editor laufen lassen.
-- Idempotent: kann mehrfach ausgeführt werden.
-- ============================================

-- 1) ALLE User-Punkte zurück auf 0
--    Solo-Level wird komplett neu aufgesetzt, daher Reset.
update public.profiles
  set points = 0
  where points is not null;

-- 2) Crew-XP-Pool (crews.aura) → Default 0 absichern
alter table public.crews
  alter column aura set default 0;

update public.crews
  set aura = 0
  where aura is null;

-- 3) Crew-XP-Log — Feed aller XP-Events für den Live-Ticker
--    crew_id ist text, weil crews.id in diesem Schema text ist.
create table if not exists public.crew_xp_log (
  id uuid primary key default gen_random_uuid(),
  crew_id text not null references public.crews(id) on delete cascade,
  user_id uuid references public.profiles(user_id) on delete set null,
  amount integer not null check (amount > 0),
  reason text not null,
  icon text,
  created_at timestamptz not null default now()
);
create index if not exists idx_crew_xp_log_crew_created
  on public.crew_xp_log (crew_id, created_at desc);
create index if not exists idx_crew_xp_log_user
  on public.crew_xp_log (user_id, created_at desc);

-- RLS: Crew-Mitglieder dürfen ihren eigenen Log lesen
alter table public.crew_xp_log enable row level security;

drop policy if exists "crew_xp_log_read" on public.crew_xp_log;
create policy "crew_xp_log_read"
  on public.crew_xp_log for select
  using (
    crew_id in (
      select crew_id from public.crew_members
      where user_id = auth.uid()
    )
  );

drop policy if exists "crew_xp_log_insert" on public.crew_xp_log;
create policy "crew_xp_log_insert"
  on public.crew_xp_log for insert
  with check (
    user_id = auth.uid()
    and crew_id in (
      select crew_id from public.crew_members
      where user_id = auth.uid()
    )
  );

-- 4) RPC add_crew_xp — atomisch: crews.aura hochzählen + Log schreiben
--    p_crew_id ist text, passt zu crews.id (text).
--    Alte uuid-Signatur droppen, damit der Client die neue sauber trifft.
drop function if exists public.add_crew_xp(uuid,int,text,text);

create or replace function public.add_crew_xp(
  p_crew_id text,
  p_amount int,
  p_reason text,
  p_icon text default null
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_total int;
begin
  if p_amount is null or p_amount <= 0 then
    return 0;
  end if;

  -- Nur Mitglieder dürfen ihrer Crew XP geben
  if not exists (
    select 1 from public.crew_members
    where crew_id = p_crew_id and user_id = auth.uid()
  ) then
    raise exception 'not_a_member';
  end if;

  update public.crews
    set aura = coalesce(aura,0) + p_amount
    where id = p_crew_id
    returning aura into v_new_total;

  insert into public.crew_xp_log(crew_id, user_id, amount, reason, icon)
    values (p_crew_id, auth.uid(), p_amount, p_reason, p_icon);

  return coalesce(v_new_total, 0);
end
$$;

grant execute on function public.add_crew_xp(text,int,text,text) to authenticated;

-- 5) Weekly-Quest-Progress pro Crew (was gehört wem?)
--    crew_id ist text, weil crews.id in diesem Schema text ist.
create table if not exists public.crew_quest_progress (
  crew_id text not null references public.crews(id) on delete cascade,
  quest_id text not null,
  week_key text not null,   -- z.B. '2026-W17'
  progress int not null default 0,
  target int not null default 1,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (crew_id, quest_id, week_key)
);
create index if not exists idx_crew_quest_progress_crew_week
  on public.crew_quest_progress (crew_id, week_key);

alter table public.crew_quest_progress enable row level security;

drop policy if exists "crew_quest_read" on public.crew_quest_progress;
create policy "crew_quest_read"
  on public.crew_quest_progress for select
  using (
    crew_id in (
      select crew_id from public.crew_members
      where user_id = auth.uid()
    )
  );

drop policy if exists "crew_quest_write" on public.crew_quest_progress;
create policy "crew_quest_write"
  on public.crew_quest_progress for all
  using (
    crew_id in (
      select crew_id from public.crew_members
      where user_id = auth.uid()
    )
  )
  with check (
    crew_id in (
      select crew_id from public.crew_members
      where user_id = auth.uid()
    )
  );

-- Fertig.
-- Nächster Schritt: Client-Update auf v105 laden, Crew-Tab öffnen,
-- Level-Hero + Quests erscheinen.
