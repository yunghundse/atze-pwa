-- ============================================
-- v110 — Chat-Verfall nach 30 Tagen
-- DSGVO Art. 5 Abs. 1 lit. e (Grundsatz der Speicherbegrenzung)
-- crew-Konzept: Chat-Nachrichten verfallen automatisch, außer als Erinnerung gespeichert
-- ============================================
-- Einmal in Supabase → SQL Editor laufen lassen.
-- Idempotent: kann mehrfach ausgeführt werden.
-- ============================================

-- 1) Index auf created_at für schnelle periodische Löschung
CREATE INDEX IF NOT EXISTS idx_crew_chat_messages_created_at
  ON public.crew_chat_messages (created_at);

-- 2) Hauptfunktion: löscht Chat-Nachrichten älter als 30 Tage
--    Nutzt SECURITY DEFINER damit auch anon/authenticated Aufrufer
--    die DELETE-Permission über die Funktion bekommen (nicht direkt auf die Tabelle).
CREATE OR REPLACE FUNCTION public.cleanup_old_chat_messages()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INT;
BEGIN
  DELETE FROM public.crew_chat_messages
  WHERE created_at < (NOW() - INTERVAL '30 days');

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$;

-- 3) Permissions: damit der Client die Funktion per RPC aufrufen darf
GRANT EXECUTE ON FUNCTION public.cleanup_old_chat_messages() TO anon;
GRANT EXECUTE ON FUNCTION public.cleanup_old_chat_messages() TO authenticated;

-- 4) OPTIONAL: pg_cron Schedule für automatische tägliche Löschung um 3 Uhr UTC.
--    pg_cron ist in Supabase ab dem Pro-Tarif verfügbar. Falls du Free-Tarif hast,
--    kannst du stattdessen den opportunistischen Client-Trigger nutzen (ist im
--    app.html-Client schon eingebaut: bei jedem Chat-Öffnen wird die Funktion
--    einmal pro Session aufgerufen, was bei aktiver Nutzung > 1x täglich reicht).
--
--    Wenn du pg_cron aktivieren willst, folgende Zeilen einkommentieren:
--
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule(
--   'cleanup-old-chat-messages',
--   '0 3 * * *',
--   $cron$SELECT public.cleanup_old_chat_messages();$cron$
-- );

-- 5) Einmalige Initial-Löschung (alles was bereits älter als 30 Tage ist)
SELECT public.cleanup_old_chat_messages() AS initial_deleted_count;

-- Fertig.
-- Kontrolle: Wenn du nach dem Run einen Integer-Wert zurückbekommst
-- (z.B. 0 oder die Anzahl der gelöschten Alt-Nachrichten), ist alles richtig.
