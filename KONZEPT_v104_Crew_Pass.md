# crew. PWA — v104 Konzept & Changelog

_Crew-Mitglied-Pass, 8-stufiges Rang-System, individuelle Profil-Anpassung,
Safety-Sharing direkt im Pass, Blocking-Onboarding für bestehende und neue User._

---

## TL;DR

v103 hat das UI aufgeräumt (Level-Button, Streak dezenter, QR-Hub, Daily Quests,
Return-Detection, Safety-Hub human-friendly). User-Feedback danach:

> "das aura system und level system wie auf das gesamtprofil und das gesamt
> persönliche muss noch individueller sein. jedes crew mitglied bekommt einen
> crew mitglied pass. ist fest verankert im system und bleibt bestehen."
>
> "das profil darf nicht mehr verbugt sein und muss für alle einfach zu bedienen
> und einzustellen sein. bringe mir noch etwas mehr flow rein und bitte auch
> ein neues level system."
>
> "jeder der schon ein profil hat bekommt die aufforderung dann den crew pass
> zu erstellen. er muss den machen."

v104 antwortet mit einem fest verankerten **Crew-Mitglied-Pass** als
Fullscreen-Modal, einem neuen **8-stufigen Rang-System**, einer
**Blocking-Takeover-Erstellung** für bestehende und neue User, und einem
direkten **Safety-Share** über den Pass heraus.

---

## 1. Neues Rang-System (8 Tiers)

Die rohe Aura-Zahl bleibt bestehen — neu ist die Zuordnung zu **visuell
unterschiedlichen Rängen**, die auf dem Pass, im Profil-Menü, auf fremden
Profilen und überall wo früher der v103-`.v103-lvl-chip-big` war gerendert
werden.

| LVL   | Name         | Farbe  | Icon |
|-------|--------------|--------|------|
| 1     | Einstieg     | grau   | ·    |
| 2–3   | Aktiv        | blau   | ▲    |
| 4–5   | Stamm        | grün   | ◆    |
| 6–7   | Crew-Kenner  | gelb   | ★    |
| 8–10  | Veteran      | orange | ✦    |
| 11–14 | Crew-Legende | lila   | ♛    |
| 15–19 | Ikone        | rot    | ☀    |
| 20+   | Mythos       | gold   | ✹    |

Helper: `window.getRankForLevel(lvl)` · `window.renderRankChip(lvl, 'sm'|'md'|'lg')`

Die alten v103-Chips (`.v103-lvl-chip-big` auf Fremdprofilen) werden per
Polling-Replace zu v104-Rang-Chips (`.v104-rank-chip`) umgewandelt — Design
bleibt zum Rest der App kompatibel (Border-Radius, Font, Padding-System).

---

## 2. Crew-Mitglied-Pass (Fullscreen-Modal)

### Einstiegspunkte
- **Profil-Screen**: neue Pass-Karte `#profPassCard` ganz oben mit
  QR-Glas-Icon, Titel "Dein Crew-Pass" + Verifiziert-Tick, Subtitel
  (Name · Rang · N Crews), Arrow rechts.
- **QR-Hub (Header)**: gelbe Kachel heißt jetzt "Crew-Pass" statt "Mein QR".
  Öffnet den Pass direkt. Die ursprüngliche `showMyQR()`-Funktion bleibt
  intakt — sie wird nur nicht mehr aus dem Hub heraus angesprungen.

### Aufbau des Passes (von oben nach unten)

**Top-Strip (holografisch animiert)**
"CREW · MEMBER · PASS" mit shimmernder Gold-Lila-Gradient-Line.

**Hero**
- Großer Avatar (72px), Rang-Ring außen
- Name + Verifiziert-Check
- Tagline (`me.tagline` · fallback `@handle · member since ...`)

**Stats-Trio**
- **Aura** — numerisch + Rang-Name
- **Level** — SVG-Ring (Progress zum nächsten Level) + große Zahl
- **Mitglied seit** — formatiert "JJJJ" oder "Mon. JJJJ" (Helper
  `_formatSince`); fällt zurück auf `created_at`, dann auf `user_id`.

**Interest-Chips** (falls gesetzt)
Rendert `me.interests[]` als kleine Pills (Design matcht bestehende
`.chip`/`.badge` Komponenten).

**QR-Tabs**
- Tab 1: **Du** (eigener User-QR; Deep-Link auf `?u=<user_id>`)
- Tab 2..N: **Crew-Name** je Crew, zu der man gehört
  (Invite-Code → Deep-Link `?join=<code>`)
- Switching per Tab-Click, QR wird via `api.qrserver.com` generiert
  (bleibt konsistent mit dem Rest der App).

**Action-Row**
- `Bearbeiten` — öffnet Edit-Sheet
- `Sicherheit teilen` — öffnet Safety-Share-Sheet
- `Schließen`

**Meta-Line** (footer)
"Mitglied seit 2026 · LVL 5 · 2 Crews" etc.

### Modal-Verhalten
- Fullscreen-Overlay `.v104-pass-ov`, Content-Sheet `.v104-pass-sheet`
- Slide-in von unten via `--ease-spring-soft` + `--dur-base`
- Schließen: X-Button · Backdrop-Click · `Esc` · Swipe-down
- Respektiert `prefers-reduced-motion`

---

## 3. Profil-Anpassung (Edit-Sheet)

Bottom-Sheet über den Pass: `window.openPassEdit()`.

Felder:
- **Tagline** (1-Zeiler, 60 Zeichen Soft-Limit, 120 Hard-Limit)
- **Bio** (140 Zeichen, nutzt bestehendes `profiles.bio`)
- **Interessen** — Chip-Multi-Select aus `INTEREST_POOL`
  (Festival, Beach, Bar-Hopping, Sport, Kultur, Natur, Food, Sunset,
  Chill, Strand-Volleyball, Hiking, Nightlife, Coffee, Brunch, Sunrise)
  — max. 6 gleichzeitig.

Speichern schreibt `tagline`, `bio`, `interests[]` direkt via
`sb.from('profiles').update(...).eq('id', ME.user_id)`. Success-Morph
`showSuccessCheck()` aus v103 wird wiederverwendet.

---

## 4. Safety-Share direkt über den Pass

Bottom-Sheet `window.openPassSafetyShare()`:
- Zeigt eigene Emergency-Daten (Name, Telefon, Notiz — aus
  bestehendem Safety-Hub).
- Button **Kopieren** (`navigator.clipboard`) und **Teilen**
  (`navigator.share` → Fallback Clipboard).
- **Toggle-Liste**: alle Crew-Mitglieder, mit denen man Safety
  explizit teilen möchte — persistiert in neuer Spalte
  `profiles.emergency_shared_with uuid[]`.

Damit ersetzt v104 das implizite "Safety-Hub sieht wer auf der Karte ist"
durch ein **explizites Consent-Modell**.

---

## 5. Blocking Pass-Creation (Takeover)

### Trigger
Nach Login wird via Polling (alle 500ms) auf `ME.user_id` gewartet,
dann nach 900ms `checkPassCreationRequired()` aufgerufen:
- Wenn `ME.pass_created_at` **null/leer** → Takeover öffnet.
- Greift für **bestehende User UND neue User** (inkl. Admin).

### 5-Schritt-Wizard (Fullscreen, ohne Close-Button)

**Step 0 — Welcome** 🎟️
"Dein Crew-Pass" + 3 Feature-Tiles (Permanenter QR, Deine Identität,
Direkt teilen). CTA "Los geht's".

**Step 1 — Review**
Avatar + Name + Handle-Preview. "Passt das für dich?" — bei Nein
Rück-Link zur Profil-Bearbeitung (bestehender Flow). Weiter-Button.

**Step 2 — Tagline + Bio**
Textarea + Zeichen-Counter. Beide Felder optional skippbar.

**Step 3 — Interessen**
Chip-Grid, max. 6 Auswahl, Skip möglich.

**Step 4 — Emergency + Reise-Hinweis**
Mini-Form für Notfallkontakt (Name + Telefon) + Hinweistext:
> "Reiseplan noch offen? Kein Stress — trag Ort und Datum später
> im Profil ein."
Final-CTA "Crew-Pass erstellen ✨".

### Finish
`_v104CreateFinish()`:
- Schreibt `pass_created_at = now()` + alle ausgefüllten Felder.
- Bei DB-Fehler (z. B. Migration noch nicht gelaufen): Toast-Warnung,
  aber **Client-State** (`ME.pass_created_at`) wird trotzdem gesetzt —
  User kann die App nutzen.
- Konfetti + Auto-Öffnen des Crew-Passes.

### Progress-Bar
Oben im Takeover zeigt 5-Dot-Progress aktuellen Schritt.

---

## 6. Datenbank-Migration (v104)

Datei: `sql_v104_crew_pass.sql` — **muss einmal im Supabase SQL-Editor
ausgeführt werden** (idempotent, kann mehrfach laufen).

Neue Spalten in `public.profiles`:
- `pass_created_at timestamptz` — NULL = Takeover wird getriggert.
- `tagline text` — kurze Headline.
- `interests text[] default '{}'` — Multi-Select-Tags.
- `member_since timestamptz default now()` — Back-fill aus `created_at`
  wenn vorhanden.
- `emergency_shared_with uuid[] default '{}'` — Safety-Consent-Liste.

Client ist **fault-tolerant**: fehlende Spalten erzeugen Konsolen-Warnungen,
die App läuft mit Client-State weiter.

---

## 7. Datei-Änderungen

- **`sql_v104_crew_pass.sql`** — neu (5 ALTER-Statements + Back-fill-Block).
- **`app.html`**
  - Nach v103-CSS (~Line 3826): neuer v104-CSS-Block (Rang-Chips,
    Pass-Card, Pass-Overlay, Stats-Trio, Level-Ring, QR-Tabs, Create-Stepper,
    Edit-Sheet, Safety-Sheet, alle mit prefers-reduced-motion-Fallback).
  - ~Line 5184: `showMyQR()`-Div ersetzt durch `.v104-pass-card`.
  - ~Line 15875: QR-Hub gelbe Kachel "Mein QR" → "Crew-Pass", onclick
    `window._v104HubOpenPass()`.
  - Vor Service-Worker-Registrierung: neuer v104-IIFE (~850 Zeilen) mit
    Rang-System, Pass-Modal, Edit-Sheet, Safety-Share, Creation-Takeover,
    Profil-Card-Paint, Polling-Replace der v103-Chips.
  - Service-Worker-Tag von `sw.js?v=15` → `sw.js?v=16`.
- **`sw.js`**: `CACHE = 'crew-v104'` (vorher `'crew-v103'`).

---

## 8. Akzeptanz-Kriterien

- [x] Neue DB-Spalten vorhanden (Migration bereitgestellt).
- [x] Profil-Screen zeigt ganz oben die neue Crew-Pass-Karte.
- [x] QR-Hub öffnet über gelbe "Crew-Pass"-Kachel den Fullscreen-Pass.
- [x] Pass zeigt Avatar, Rang-Ring, Aura/Level/Mitglied-seit-Stats,
      Tagline, Interessen, QR-Tabs (Du + alle Crews).
- [x] Tab-Switch zwischen eigenem QR und Crew-QRs funktioniert.
- [x] Bearbeiten-Sheet speichert Tagline, Bio, Interessen.
- [x] Safety-Share-Sheet kopiert/teilt Emergency-Daten, Toggle-Liste
      schreibt `emergency_shared_with`.
- [x] Bestehende User ohne `pass_created_at` bekommen beim nächsten
      Login automatisch den Blocking-Takeover (5 Steps).
- [x] Neue User nach Onboarding direkt in den Takeover.
- [x] Takeover lässt sich nicht per Backdrop/Esc umgehen.
- [x] Alte v103-`.v103-lvl-chip-big` werden per Polling zu v104-Rang-Chips.
- [x] Rang-System hat 8 Tiers, Farben konsistent mit App-Tokens.
- [x] Alle Animationen respektieren `prefers-reduced-motion`.
- [x] `sw.js?v=16` + `CACHE = 'crew-v104'` erzwingen Refresh bei Nutzern.
- [x] Syntax-Check: `new Function(combined)` läuft ohne Fehler.

---

## 9. Offen für spätere Versionen

- **Verified-Badge-Logik**: aktuell kosmetisch — v105 soll Verification
  an tatsächliche Crew-Membership-Dauer + Admin-Bestätigung knüpfen.
- **Season-Pass & Premium-Slot** (v106+): Pass-Hintergrund austauschbar,
  Premium-Rahmen, zusätzliche Ring-Farben.
- **Pass-Shared-Stats**: Aggregierte "Wir sind seit X in einer Crew"
  Anzeige bei matched Pässen.
- **Travel-Intent-Integration**: später-Feld aus Step 4 soll in die
  Match-Logik einfließen (wer wohin will → Empfehlung).
- **Server-seitiger Trigger** für Takeover: aktuell Client-Polling —
  robuster wäre eine Realtime-Subscription auf Auth-Login.
