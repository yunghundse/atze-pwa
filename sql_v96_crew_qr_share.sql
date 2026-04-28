-- ========================================================
-- v96 Migration — Leader-gesteuerter QR-Share-Toggle
-- ========================================================
-- Führe das im Supabase SQL Editor aus:
-- Dashboard → SQL Editor → New query → Paste → Run.
--
-- Was es macht:
--   Fügt `crews.allow_member_qr_share` hinzu (default false).
--   Wenn der Leader das auf true setzt, dürfen auch normale
--   Crew-Mitglieder den Crew-QR-Code und Einladungscode teilen.
--   Sonst ist QR/Link-Teilen nur dem Leader vorbehalten.
-- ========================================================

ALTER TABLE crews
  ADD COLUMN IF NOT EXISTS allow_member_qr_share BOOLEAN DEFAULT false;

-- Bestehende Crews: explizit auf false setzen (Sicherheit first).
UPDATE crews
   SET allow_member_qr_share = false
 WHERE allow_member_qr_share IS NULL;

-- Optional: Index auf visibility (falls noch nicht vorhanden) —
-- beschleunigt Community-Listen und Crew-Battle-Filter.
CREATE INDEX IF NOT EXISTS idx_crews_visibility
  ON crews(visibility);

-- ========================================================
-- Fertig.
-- ========================================================
