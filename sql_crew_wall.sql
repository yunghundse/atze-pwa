-- ================================================
-- CREW WALL SYSTEM — Supabase SQL Setup
-- Tabelle für crew_wall_posts (ersetzt localStorage)
-- ================================================

-- 1. Crew Wall Posts Tabelle
CREATE TABLE IF NOT EXISTS crew_wall_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  crew_id UUID NOT NULL,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL DEFAULT 'Anonym',
  user_photo TEXT DEFAULT '',
  message TEXT NOT NULL,
  loc_name TEXT,
  loc_lat DOUBLE PRECISION,
  loc_lng DOUBLE PRECISION,
  reactions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Index
CREATE INDEX IF NOT EXISTS idx_wall_crew ON crew_wall_posts(crew_id);
CREATE INDEX IF NOT EXISTS idx_wall_created ON crew_wall_posts(created_at DESC);

-- 3. RLS
ALTER TABLE crew_wall_posts ENABLE ROW LEVEL SECURITY;

-- 4. Authenticated users: lesen, schreiben, eigene löschen
CREATE POLICY "auth_select_wall" ON crew_wall_posts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_insert_wall" ON crew_wall_posts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "auth_delete_own_wall" ON crew_wall_posts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "auth_update_wall" ON crew_wall_posts
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
