# crew. — Email + Push Sequenz

> Drei Touchpoints für neue User: **Tag 0** (Confirm-Signup),
> **Tag 3** (Aktivierungs-Nudge), **Tag 7** (Crew-Aufbau).
> Plus eine separate **Heimweg-Erinnerung** als situative Push.

Alle Texte sind so geschrieben, dass sie ohne Anpassung in Supabase
Auth → Email Templates und in die `notifications`-Send-Function gehen
können. Variable Platzhalter in `{{double_curly}}`.

---

## TAG 0 — Welcome / Confirm Email

**Wo:** Supabase Dashboard → Authentication → Email Templates → "Confirm
signup". Aktiv ab Sprint 2.5 (Email-Verify Hard-Enforcement).

### Subject
```
Willkommen bei crew. — bestätige nur noch deine Mail
```

### Plain-Text-Body (Fallback)
```
Hey,

du hast den ersten Schritt gemacht. Klick einmal auf den Link unten,
dann ist dein Account live:

{{ .ConfirmationURL }}

Was passiert danach:
1. Du wählst dein erstes Setup (Name, Foto, Stadt)
2. Du legst deinen Safety-Circle an — die 1–3 Leute, die im Notfall
   eine Push bekommen
3. Du bist drin.

Wenn du keine Mail erwartet hast, ignorier das hier einfach.

— crew.
yunghundse@gmail.com nicht antworten — Fragen an support@partycrew.app

EU-Server Frankfurt · DSGVO · Du kannst alles jederzeit löschen.
```

### HTML-Body (für Supabase Auth Email-Template)
```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { background:#0F0A1F; margin:0; padding:0; font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif; }
  .container { max-width:520px; margin:0 auto; padding:32px 24px; color:#F5F3FF; }
  .logo { font-size:36px; font-weight:700; letter-spacing:-1px; margin-bottom:8px; }
  .logo .dot { color:#8B5CF6; }
  .tag { font-size:13px; color:#A88CFF; margin-bottom:32px; }
  h1 { font-size:22px; font-weight:600; line-height:1.3; margin:0 0 16px; }
  p { font-size:15px; line-height:1.55; color:#D6CFEC; margin:0 0 14px; }
  .cta { display:inline-block; padding:14px 28px; background:#8B5CF6; color:#FFF !important; border-radius:14px; font-weight:600; font-size:15px; text-decoration:none; margin:18px 0; }
  .steps { background:rgba(168,140,255,.06); border:.5px solid rgba(168,140,255,.18); border-radius:14px; padding:16px 20px; margin:20px 0; }
  .steps-h { font-size:13px; font-weight:600; color:#A88CFF; margin-bottom:10px; }
  .steps li { font-size:14px; color:#D6CFEC; margin-bottom:8px; }
  .footer { font-size:11px; color:#6B5B8A; margin-top:32px; line-height:1.5; }
  .footer a { color:#A88CFF; text-decoration:none; }
</style>
</head>
<body>
  <div class="container">
    <div class="logo">crew<span class="dot">.</span></div>
    <div class="tag">Connection + Safety. Für deine Crew.</div>

    <h1>Willkommen. Bestätige nur noch deine Mail.</h1>
    <p>Du hast den ersten Schritt gemacht. Ein Klick noch, dann ist dein Account live.</p>

    <a href="{{ .ConfirmationURL }}" class="cta">Account aktivieren</a>

    <div class="steps">
      <div class="steps-h">Was direkt danach passiert</div>
      <ol class="steps">
        <li>Setup: Name, Foto, Stadt — 30 Sekunden.</li>
        <li>Safety-Circle anlegen: 1–3 Leute, die im Notfall eine Push bekommen.</li>
        <li>Du bist drin.</li>
      </ol>
    </div>

    <p>Wenn du keine Mail erwartet hast — einfach ignorieren, der Account erlischt von selbst.</p>

    <div class="footer">
      crew. — EU-Server Frankfurt · DSGVO · alles jederzeit löschbar.<br/>
      Fragen? <a href="mailto:support@partycrew.app">support@partycrew.app</a><br/>
      <a href="{{ .SiteURL }}/datenschutz">Datenschutz</a> · <a href="{{ .SiteURL }}/agb">AGB</a> · <a href="{{ .SiteURL }}/abmelden">Abmelden</a>
    </div>
  </div>
</body>
</html>
```

---

## TAG 3 — Aktivierungs-Nudge

**Trigger:** User hat bestätigt aber **keinen Safety-Circle angelegt**
(`safety_circle` IS EMPTY für `user_id`) UND letzte Aktivität >24h her.

**Channel-Logik:**
- Hat Push-Permission? → Push
- Sonst → Email

### Push (wenn Permission da)
```
Title:  Hey, dein Safety-Circle wartet.
Body:   3 Leute reichen. Im Notfall bekommen sie eine Push — sonst sehen sie nichts. Tipp.
Deeplink: crew://safetycircle/setup
```

### Email-Subject
```
Du bist da, dein Safety-Circle nicht. Eine Minute genügt.
```

### Email-Body (HTML — gleicher Style wie Tag 0)
```html
<h1>Eine Minute. Drei Leute. Done.</h1>

<p>Du bist seit ein paar Tagen drin — danke. Eine Sache fehlt aber noch:
dein Safety-Circle.</p>

<p>Das sind die 1–3 Leute, die im Notfall eine Push von dir bekommen.
Sonst sehen sie <b>nichts</b> von dir. Kein Standort, keine Aktivität,
keine Mood. Nur wenn du SOS auslöst oder den Heimweg-Modus aktivierst,
wird's relevant.</p>

<a href="{{ .SiteURL }}/safetycircle/setup" class="cta">Circle einrichten</a>

<p>Wer Sinn macht: Mitbewohner, beste Freunde, Geschwister. Nicht
deine Eltern, nicht deine Boss. Leute, die schnell reagieren würden
wenn was wäre.</p>

<div class="footer">
  Wenn du den Circle nicht willst, ignorier das hier — wir mailen
  dazu nicht nochmal.
</div>
```

---

## TAG 7 — Crew-Aufbau

**Trigger:** User hat Safety-Circle **angelegt** (also Tag-3-Mail nicht
mehr nötig) ODER User hat ihn nicht angelegt aber Tag 3 ignoriert,
braucht jetzt Crew-Hook.

Zwei Varianten — du wählst die passende beim Send anhand des States.

### Variante A — User hat Circle, aber **keine Crew**
```
Push Title:  Allein in deiner Stadt? Crews suchen dich.
Push Body:   In {{ profile.city || "deiner Stadt" }} sind {{ count_crews_nearby }} öffentliche Crews — hops einer dazu.
Deeplink: crew://crews/discovery
```

### Variante B — User hat Circle UND Crew, aber war **<3× online**
```
Push Title:  Lisa war heute im Späti. Du verpasst nichts wichtiges, aber.
Push Body:   Crew-Aktivität in den letzten 24h: {{ recent_count }} Posts. Schau kurz rein.
Deeplink: crew://feed
```

(Wenn keine Crew-Activity → Skip. Lieber nichts senden als Spam.)

### Email Variante A (Subject)
```
{{ count_crews_nearby }} Crews in {{ profile.city }} — eine reicht.
```

### Email Variante A (Body)
```html
<h1>Du bist drin. Nächster Schritt: eine Crew.</h1>

<p>Crews sind kleine Gruppen (3–15 Leute) die in deiner Stadt aktiv
sind — Festival-Crews, Studi-WGs, Spätis-Stammgäste. Du wählst, was
passt.</p>

<p>In {{ profile.city }} laufen aktuell <b>{{ count_crews_nearby }}
öffentliche Crews</b>. Schau dir 3 davon an — wenn keine passt,
gründest du eine eigene mit einem Klick.</p>

<a href="{{ .SiteURL }}/crews/discovery" class="cta">Crews entdecken</a>

<p style="font-size:13px;color:#888">Wir matchen nicht. Du wählst.
Wenn dir was nicht gefällt, gehst du wieder raus — kein Drama.</p>
```

---

## SITUATIVE PUSHES (kein Time-basierter Trigger)

### Heimweg-Erinnerung
**Trigger:** User aktiviert keinen Heimweg-Modus, ist aber zwischen
22:00–05:00 mehr als 30 Minuten in einer Location, die als „Bar" oder
„Club" klassifiziert ist (nice-to-have, optional Stage 2).

```
Title:  Heimweg starten?
Body:   Aktiviere kurz den Heimweg-Modus, dein Safety-Circle bekommt nur eine Push wenn du nicht ankommst.
Deeplink: crew://heimweg/start
```

### Crew-Pin pulsiert (Live-Status)
**Trigger:** Eines deiner Crew-Mitglieder geht „live" und du bist auch online.

```
Title:  {{ crew_member.name }} ist live.
Body:   {{ crew_member.live_emoji }} {{ crew_member.context }} — schau auf der Map.
Deeplink: crew://map?focus={{ crew_member.id }}
```

### SOS — höchste Prio (laut + bypass)
**Trigger:** Member deines Safety-Circle löst SOS aus.

```
Title:  ⚠ SOS von {{ name }}
Body:   {{ name }} hat SOS ausgelöst. Standort + Details siehst du in der App.
Sound:  default-loud
Bypass-DND: true (iOS critical alert wenn permission)
Deeplink: crew://sos/{{ alert_id }}
```

### Trust-Ping
**Trigger:** Jemand hat dich zur Crew/Circle hinzugefügt UND dir Trust gegeben.

```
Title:  +1 Trust von {{ name }}
Body:   Dein Trust-Score ist jetzt {{ new_score }}. Bleib echt.
Deeplink: crew://profile/me
```

---

## TONE-RULES (für alle Pushes)

- **Maximal 50 Zeichen** Title, **120** Body
- Niemals „Hey 👋" oder „Hi du!" — direkt mit Subjekt anfangen
- Kein Marketing-Sprech („Entdecke die Welt von…")
- Wenn ein Name verfügbar ist, nutze ihn — niemals „Ein Crew-Member"
- Aktiv statt passiv: „Lisa ist live" statt „Lisa wurde aktiv"
- Push muss **stehen, ohne dass der User die App öffnet** — die
  Information selbst ist der Wert, nicht der Hook

## SEND-LOGIK (Server-Side, für Edge-Function)

```sql
-- Tag 3 Trigger
SELECT user_id, email, push_consents
FROM profiles p
LEFT JOIN safety_circle sc ON sc.user_id = p.user_id
WHERE p.created_at < now() - interval '3 days'
  AND p.created_at > now() - interval '4 days'
  AND p.email_confirmed_at IS NOT NULL
  AND sc.user_id IS NULL  -- noch keinen Circle
GROUP BY user_id;

-- Tag 7 Trigger Variante A
SELECT user_id, email, push_consents, city
FROM profiles p
WHERE p.created_at < now() - interval '7 days'
  AND p.created_at > now() - interval '8 days'
  AND NOT EXISTS (
    SELECT 1 FROM user_crew_members_v2 m WHERE m.user_id = p.user_id
  );
```

**Anti-Spam-Regel:** Maximal 1 Email + 2 Pushes pro Woche pro User
(außer SOS — das ignoriert das Limit).

---

## A/B-Test-Ideen (für später, nicht jetzt)

- Subject „Eine Minute. Drei Leute. Done." vs. „Du bist da, dein
  Safety-Circle nicht."
- Push „Lisa ist live" vs. „Crew-Aktivität: Lisa"
- Email-Hero-Image (Symbol-Glow) vs. nüchtern textbasiert

Tracking via PostHog `email_opened`, `push_clicked`,
`safety_circle_setup_after_nudge`. Mindest-Sample 50 User pro Variante
bevor Decision.
