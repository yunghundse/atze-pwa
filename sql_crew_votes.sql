-- ================================================
-- CREW VOTES — Supabase SQL Setup
-- Psychologische Crew-Votes (täglich wechselnd)
-- ================================================

CREATE TABLE IF NOT EXISTS crew_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id UUID NOT NULL,
  voter_id UUID NOT NULL,
  voted_for UUID NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(crew_id, voter_id, category, date)
);

CREATE INDEX IF NOT EXISTS idx_crew_votes_crew ON crew_votes(crew_id, date);
CREATE INDEX IF NOT EXISTS idx_crew_votes_category ON crew_votes(crew_id, category, date);

ALTER TABLE crew_votes ENABLE ROW LEVEL SECURITY;

-- Authenticated policies
CREATE POLICY "auth_select_crew_votes" ON crew_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_crew_votes" ON crew_votes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_crew_votes" ON crew_votes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_crew_votes" ON crew_votes FOR DELETE TO authenticated USING (true);

-- Anon policies
CREATE POLICY "anon_select_crew_votes" ON crew_votes FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_crew_votes" ON crew_votes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_crew_votes" ON crew_votes FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_crew_votes" ON crew_votes FOR DELETE TO anon USING (true);
