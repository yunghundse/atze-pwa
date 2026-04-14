-- ============================================
-- ATZE PWA — Supabase Datenbank-Schema
-- butterbread tech GmbH
-- ============================================
-- Dieses SQL in Supabase → SQL Editor einfügen
-- und auf "Run" klicken.
-- ============================================

-- 1. PROFILES
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  name TEXT NOT NULL CHECK (char_length(name) >= 2 AND char_length(name) <= 30),
  age INTEGER NOT NULL CHECK (age >= 18 AND age <= 99),
  bio TEXT DEFAULT '' CHECK (char_length(bio) <= 300),
  gender TEXT CHECK (gender IN ('Mann', 'Frau', 'Divers', 'Non-Binary')),
  seek TEXT CHECK (seek IN ('Männer', 'Frauen', 'Alle')),
  status TEXT CHECK (status IN ('Single', 'Vergeben', 'Kompliziert', 'Offen')),
  club TEXT DEFAULT '',
  mood TEXT DEFAULT '🥳',
  insta TEXT DEFAULT '',
  tiktok TEXT DEFAULT '',
  photo_url TEXT DEFAULT '',
  verified BOOLEAN DEFAULT FALSE,
  premium BOOLEAN DEFAULT FALSE,
  premium_until TIMESTAMPTZ,
  points INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  last_active DATE DEFAULT CURRENT_DATE,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MATCHES (Swipes)
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  to_user UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('like', 'nope', 'super')),
  is_match BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_user, to_user)
);

-- 3. CREWS
CREATE TABLE crews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  created_by UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CREW MEMBERS
CREATE TABLE crew_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_id UUID REFERENCES crews(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  arrival DATE,
  departure DATE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(crew_id, user_id)
);

-- 5. VENUES (Echte Mallorca Locations)
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  type TEXT CHECK (type IN ('hot', 'busy', 'chill')),
  emoji TEXT DEFAULT '🎵',
  description TEXT DEFAULT '',
  address TEXT DEFAULT '',
  hours TEXT DEFAULT '',
  website TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  story_image TEXT DEFAULT '',
  story_text TEXT DEFAULT '',
  crowd_count INTEGER DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 0.0,
  is_live BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CHECK-INS
CREATE TABLE checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SOS ALERTS
CREATE TABLE sos_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  message TEXT DEFAULT '',
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. FEED EVENTS
CREATE TABLE feed_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('checkin', 'match', 'mood', 'arrival', 'photo')),
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. BADGES
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  badge_key TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_key)
);

-- ============================================
-- INDEXES für Performance
-- ============================================
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_location ON profiles(lat, lng) WHERE lat IS NOT NULL;
CREATE INDEX idx_profiles_gender ON profiles(gender);
CREATE INDEX idx_profiles_age ON profiles(age);
CREATE INDEX idx_matches_from ON matches(from_user);
CREATE INDEX idx_matches_to ON matches(to_user);
CREATE INDEX idx_matches_mutual ON matches(from_user, to_user) WHERE is_match = TRUE;
CREATE INDEX idx_crew_members_user ON crew_members(user_id);
CREATE INDEX idx_crew_members_crew ON crew_members(crew_id);
CREATE INDEX idx_checkins_user ON checkins(user_id);
CREATE INDEX idx_checkins_venue ON checkins(venue_id);
CREATE INDEX idx_checkins_recent ON checkins(created_at DESC);
CREATE INDEX idx_feed_events_user ON feed_events(user_id, created_at DESC);
CREATE INDEX idx_sos_alerts_active ON sos_alerts(created_at DESC) WHERE resolved = FALSE;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Jeder kann Profile sehen"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "User kann eigenes Profil bearbeiten"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "User kann eigenes Profil erstellen"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Matches
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User sieht eigene Matches"
  ON matches FOR SELECT
  USING (auth.uid() = from_user OR auth.uid() = to_user);

CREATE POLICY "User kann swipen"
  ON matches FOR INSERT
  WITH CHECK (auth.uid() = from_user);

-- Crews
ALTER TABLE crews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Crew-Mitglieder sehen ihre Crews"
  ON crews FOR SELECT
  USING (
    id IN (SELECT crew_id FROM crew_members WHERE user_id = auth.uid())
    OR created_by = auth.uid()
  );

CREATE POLICY "User kann Crew erstellen"
  ON crews FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Crew Members
ALTER TABLE crew_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mitglieder sehen ihre Crew"
  ON crew_members FOR SELECT
  USING (
    crew_id IN (SELECT crew_id FROM crew_members cm WHERE cm.user_id = auth.uid())
  );

CREATE POLICY "User kann Crew beitreten"
  ON crew_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User kann eigene Mitgliedschaft bearbeiten"
  ON crew_members FOR UPDATE
  USING (auth.uid() = user_id);

-- Venues (öffentlich lesbar)
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Jeder kann Venues sehen"
  ON venues FOR SELECT
  USING (true);

-- Checkins
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Jeder sieht Checkins"
  ON checkins FOR SELECT
  USING (true);

CREATE POLICY "User kann einchecken"
  ON checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- SOS
ALTER TABLE sos_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Crew sieht SOS"
  ON sos_alerts FOR SELECT
  USING (
    auth.uid() = user_id
    OR user_id IN (
      SELECT cm2.user_id FROM crew_members cm1
      JOIN crew_members cm2 ON cm1.crew_id = cm2.crew_id
      WHERE cm1.user_id = auth.uid()
    )
  );

CREATE POLICY "User kann SOS senden"
  ON sos_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Feed
ALTER TABLE feed_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Crew sieht Feed"
  ON feed_events FOR SELECT
  USING (
    auth.uid() = user_id
    OR user_id IN (
      SELECT cm2.user_id FROM crew_members cm1
      JOIN crew_members cm2 ON cm1.crew_id = cm2.crew_id
      WHERE cm1.user_id = auth.uid()
    )
  );

CREATE POLICY "User kann Feed-Events erstellen"
  ON feed_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Badges
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Jeder sieht Badges"
  ON user_badges FOR SELECT
  USING (true);

CREATE POLICY "System vergibt Badges"
  ON user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Match-Check: Wenn beide geliked haben → is_match = true
CREATE OR REPLACE FUNCTION check_mutual_match()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.action = 'like' OR NEW.action = 'super' THEN
    -- Prüfe ob der andere auch geliked hat
    IF EXISTS (
      SELECT 1 FROM matches
      WHERE from_user = NEW.to_user
      AND to_user = NEW.from_user
      AND (action = 'like' OR action = 'super')
    ) THEN
      -- Setze beide auf is_match = true
      UPDATE matches SET is_match = TRUE
      WHERE from_user = NEW.to_user AND to_user = NEW.from_user;
      NEW.is_match := TRUE;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_match_insert
  BEFORE INSERT ON matches
  FOR EACH ROW
  EXECUTE FUNCTION check_mutual_match();

-- Punkte updaten
CREATE OR REPLACE FUNCTION add_points(p_user_id UUID, p_points INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE profiles SET points = points + p_points, updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Streak updaten
CREATE OR REPLACE FUNCTION update_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_last DATE;
  v_streak INTEGER;
BEGIN
  SELECT last_active, streak INTO v_last, v_streak FROM profiles WHERE user_id = p_user_id;
  IF v_last = CURRENT_DATE THEN
    RETURN v_streak;
  ELSIF v_last = CURRENT_DATE - 1 THEN
    v_streak := v_streak + 1;
  ELSE
    v_streak := 1;
  END IF;
  UPDATE profiles SET streak = v_streak, last_active = CURRENT_DATE, updated_at = NOW()
  WHERE user_id = p_user_id;
  RETURN v_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profile nach Auth-Signup automatisch erstellen
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, name, age)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'Neuer Atze'), 18);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- SEED DATA: Echte Mallorca Venues
-- ============================================
INSERT INTO venues (name, lat, lng, type, emoji, description, address, hours, website, image_url, story_image, story_text, crowd_count, rating, is_live, tags) VALUES
('Bierkönig', 39.5160, 2.7450, 'hot', '🎵', 'Live-Band jetzt', 'Carrer del Pare Bartomeu Salvà, 6', '11–05 (Apr-Okt)', 'bierkoenig.com', 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&q=80', 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=900&q=80', '🔥 JETZT LIVE: Mia Julia!', 847, 4.8, true, ARRAY['Live','Bier','Partyhits']),
('Megapark', 39.5150, 2.7400, 'hot', '🍹', 'DJ Show läuft', 'Carretera de l''Arenal, 52', '10–05 (Apr-Okt)', 'megapark.app', 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=600&q=80', 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=900&q=80', '🎉 4000m² Open-Air!', 1247, 4.7, true, ARRAY['Club','DJ','Open Air']),
('Oberbayern', 39.5150, 2.7380, 'busy', '🎤', 'Karaoke Night', 'Carretera de l''Arenal, 48', '21–05 (Apr-Okt)', 'oberbayern-mallorca.eu', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=900&q=80', '🎤 Karaoke ab 22 Uhr!', 412, 4.5, false, ARRAY['Karaoke','Club','Party']),
('Bamboleo', 39.5170, 2.7430, 'busy', '🍺', 'Biergarten-Vibe', 'Schinkenstraße', '10–05 (Apr-Okt)', '', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&q=80', '🍺 Pre-Party im Biergarten', 389, 4.4, false, ARRAY['Biergarten','Hits']),
('Bierexpress', 39.5130, 2.7420, 'busy', '🎤', 'Karaoke & Cocktails', 'Carrer de Cartago, 47', '18–04', '', 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&q=80', 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=900&q=80', '🎤 Sing deinen Hit!', 178, 4.3, false, ARRAY['Karaoke','Cocktails']),
('Et Dömsche', 39.5140, 2.7370, 'chill', '🍻', 'Kölsch & Chill', 'Calle Miquel Pellisa (Bierstraße)', '16–02', 'doemsche.com', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&q=80', '🍻 Treffpunkt für Kölner!', 95, 4.2, false, ARRAY['Kölsch','Chill','Köln']),
('Purobeach Palma', 39.5020, 2.7000, 'chill', '🌅', 'Premium Beach Club', 'Carrer del Pagell, 1, Can Pastilla', '10–22 (Mär-Okt)', 'purobeach.com', 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&q=80', 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=900&q=80', '🌅 Pool, Cocktails & Sunset', 234, 4.9, false, ARRAY['Beach Club','Pool','Lounge']),
('Ballermann 6', 39.5160, 2.7440, 'hot', '🏖', 'Beach Party', 'Balneario 6, Playa de Palma', '10–04', '', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=900&q=80', '🏖️ DER Ballermann!', 567, 4.6, true, ARRAY['Beach','Party','Kult']);

-- ============================================
-- REALTIME aktivieren
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE feed_events;
ALTER PUBLICATION supabase_realtime ADD TABLE sos_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE crew_members;

-- ============================================
-- STORAGE BUCKET für Profilbilder
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

CREATE POLICY "Jeder kann Avatare sehen"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "User kann eigenen Avatar hochladen"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "User kann eigenen Avatar updaten"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
