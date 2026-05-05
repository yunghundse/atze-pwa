# crew. — Drip-Email Setup-Anleitung

Sprint 4.4 hat das technische Fundament gelegt:

- DB-Spalten `profiles.email_sent_d3 / email_sent_d7`
- View `drip_pending` (was ist fällig?)
- RPC `mark_drip_sent(uid, type)` (markiert nach Send)
- Edge-Function `send_drip_emails` (deployed, version 1)
- pg_cron-Job `drip-emails-daily` (täglich 12 UTC = 14 Uhr DE-Sommer)

## Damit Mails wirklich rausgehen, brauchst du noch (5 min):

### 1. Resend-Account anlegen + API-Key

1. https://resend.com → Sign up (Free-Tier: 3000 Mails/Monat, reicht für Pioneer-Phase)
2. Domain `partycrew.app` verifizieren (DNS TXT + DKIM-Records eintragen)
3. API-Key generieren: Dashboard → API Keys → Create

### 2. API-Key in Supabase setzen

Supabase Dashboard → Project Settings → Edge Functions → Add New Variable:

```
RESEND_API_KEY=re_xxxxxxxxxxxxx
FROM_EMAIL=crew. <hi@partycrew.app>
SITE_URL=https://partycrew.app
```

### 3. pg_cron mit Service-Role-Auth verdrahten

Aktuell setzt der Cron-Job auf `current_setting('app.service_role_key')` —
das ist nicht gesetzt. Zwei Wege:

**Option A (empfohlen):** Service-Role-Key direkt im Cron-Job hardcoden
(Dashboard → Database → Cron Jobs → drip-emails-daily → Edit):

```sql
SELECT net.http_post(
  url := 'https://mzggdhowhyoytnvwtvpc.supabase.co/functions/v1/send_drip_emails',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer SERVICE_ROLE_KEY_HIER'
  ),
  body := '{}'::jsonb,
  timeout_milliseconds := 60000
);
```

Der Service-Role-Key liegt in Project Settings → API → `service_role` (geheim!).

**Option B:** Postgres-Setting setzen (einmalig per SQL Editor):
```sql
ALTER DATABASE postgres SET app.service_role_key = 'SERVICE_ROLE_KEY_HIER';
```

## Manueller Test

Nach Setup kannst du den Job sofort testen:

```sql
SELECT net.http_post(
  url := 'https://mzggdhowhyoytnvwtvpc.supabase.co/functions/v1/send_drip_emails',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer SERVICE_ROLE_KEY'
  ),
  body := '{}'::jsonb
);
```

Response sollte `{"ok": true, "total": 0, "sent": 0}` sein (weil noch
keine User in der 3-Tage-Lücke sind).

Oder Function-Logs anschauen:
Supabase Dashboard → Edge Functions → send_drip_emails → Logs

## Was passiert in der Praxis

- **Tag 0** User registriert sich
- **Tag 3** Wenn er noch keinen Safety-Circle hat → D3-Mail
- **Tag 4+** D3 wird nicht mehr gesendet (Window vorbei)
- **Tag 7** Wenn er noch keine Crew hat → D7-Mail
- **Tag 8+** D7 wird nicht mehr gesendet

State wird in `profiles.email_sent_d3 / d7` getrackt. Idempotent —
auch wenn der Cron 5x am Tag läuft, wird jede Mail nur einmal gesendet.

## Sicherheits-Hinweise

- `verify_jwt = true` an der Edge-Function → kein Random kann sie aufrufen
- Service-Role-Key NIEMALS im Frontend exposen
- `drip_pending` View ist nur für `service_role` granted
- Resend-API-Key in Supabase env vars, nicht im Code
