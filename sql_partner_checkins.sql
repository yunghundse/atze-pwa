-- ================================================
-- PARTNER CHECK-IN SYSTEM — Supabase SQL Setup
-- Tabelle + RLS Policies für partner_checkins
-- ================================================

-- 1. Tabelle erstellen
CREATE TABLE IF NOT EXISTS partner_checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  partner_id UUID NOT NULL,
  partner_code TEXT NOT NULL,
  points_awarded INTEGER DEFAULT 25,
  deal_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Index für schnelle Abfragen
CREATE INDEX IF NOT EXISTS idx_partner_checkins_partner ON partner_checkins(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_checkins_user ON partner_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_checkins_code ON partner_checkins(partner_code);

-- 3. RLS aktivieren
ALTER TABLE partner_checkins ENABLE ROW LEVEL SECURITY;

-- 4. Anon darf einfügen (Partner-Seite scan.html hat keinen Auth-User)
CREATE POLICY "anon_insert_checkins" ON partner_checkins
  FOR INSERT TO anon WITH CHECK (true);

-- 5. Anon darf lesen (für Stats)
CREATE POLICY "anon_select_checkins" ON partner_checkins
  FOR SELECT TO anon USING (true);

-- 6. Authenticated users dürfen auch lesen + einfügen (app.html)
CREATE POLICY "auth_insert_checkins" ON partner_checkins
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "auth_select_checkins" ON partner_checkins
  FOR SELECT TO authenticated USING (true);

-- 7. Profiles-Tabelle: Stelle sicher dass anon profiles lesen darf
-- (Wird für User-Lookup auf der Partner-Seite gebraucht)
-- Falls die Policy schon existiert, wird das fehlschlagen — das ist OK
DO $$
BEGIN
  BEGIN
    CREATE POLICY "anon_read_profiles" ON profiles
      FOR SELECT TO anon USING (true);
  EXCEPTION WHEN duplicate_object THEN
    NULL; -- Policy existiert bereits
  END;
END $$;

-- 8. Partners-Tabelle: Anon muss aktive Partner lesen können
DO $$
BEGIN
  BEGIN
    CREATE POLICY "anon_read_active_partners" ON partners
      FOR SELECT TO anon USING (is_active = true);
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

-- 9. Profiles: Anon darf score updaten (für Partner-Check-in Punkte-Vergabe)
DO $$
BEGIN
  BEGIN
    CREATE POLICY "anon_update_profile_score" ON profiles
      FOR UPDATE TO anon USING (true) WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;
