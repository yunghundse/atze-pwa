-- ================================================
-- TONIGHT PLANNER — Supabase SQL Setup
-- Crew-Vorschläge + Votes für "Wo geht's heute hin?"
-- ================================================

-- 1. Tonight Suggestions (eigene Vorschläge der Crew)
CREATE TABLE IF NOT EXISTS tonight_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id UUID NOT NULL,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL DEFAULT 'Anonym',
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📍',
  type TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tonight_sug_crew ON tonight_suggestions(crew_id, date);

ALTER TABLE tonight_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_tonight_sug" ON tonight_suggestions FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_tonight_sug" ON tonight_suggestions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "anon_select_tonight_sug" ON tonight_suggestions FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_tonight_sug" ON tonight_suggestions FOR INSERT TO anon WITH CHECK (true);

-- 2. Tonight Votes (wer stimmt für was)
CREATE TABLE IF NOT EXISTS tonight_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id UUID NOT NULL,
  user_id UUID NOT NULL,
  venue_id TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(crew_id, user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_tonight_votes_crew ON tonight_votes(crew_id, date);

ALTER TABLE tonight_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_tonight_votes" ON tonight_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_tonight_votes" ON tonight_votes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_tonight_votes" ON tonight_votes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_tonight_votes" ON tonight_votes FOR DELETE TO authenticated USING (true);
CREATE POLICY "anon_select_tonight_votes" ON tonight_votes FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_tonight_votes" ON tonight_votes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_tonight_votes" ON tonight_votes FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_tonight_votes" ON tonight_votes FOR DELETE TO anon USING (true);
