# crew. PWA — v103 Konzept & Changelog

_UI-Rework: Level-Button, Streak dezenter, QR-Safety-Hub,
Daily Quests, Return-Detection, Success-Checkmark, Notification-Batch,
Safety-Hub human-friendly Koordinaten_

---

## TL;DR

v102 hat Level-up & Streak eingeführt. User-Feedback war klar:

> "das lvl jetzt bei aura steht find ich zu viel"
> "das mit dem streak finde ich so aber finde das dann oben ein bisschen zu viel mach dann es so das er besser drin ist"
> "mach anstatt die bier flasche einen qr code hin"

v103 adressiert diese drei Punkte UND zieht die offenen Roadmap-Features
(Daily Quests, Return-Detection, Success-Checkmark, Notification-Batch,
Safety-Hub readable coords) rein — alles additiv, ohne die bestehende
Architektur zu brechen.

---

## 1. Level-System: vom Chip zum Button

**Problem (v102):** Das `LVL 3`-Chip saß direkt auf der Aura-Kachel in
den Quick-Stats. Zu laut, zu klein, zu viel Info auf einer Kachel.

**Lösung (v103):**
- Chip & Progress-Bar aus der Aura-Kachel entfernt (`paintLevelInQuickStats`
  wird zu einem Cleanup-No-op überschrieben).
- Neuer **Level-Button an erster Position im Profil-Menü** — 44px goldener
  Stern-Icon, "Dein Level" + `LVL n`, Progress-Bar darunter, Hinweis
  "noch X Aura bis Level n+1", Arrow rechts.
- Klick öffnet das **Level-Detail-Modal**: großer Stern, LVL-Zahl mit
  Glow, level-spezifischer Motivations-Text, Progress-Bar, Aura- und
  Rest-Stats.
- **Auf anderen Profilen**: `.v103-lvl-chip-big` wird in den `.cps-badges`
  Bereich injiziert ("⭐ LVL 5"). Klick → zeigt Level-Detail-Modal der
  fremden Person.

---

## 2. Streak: dezent statt laut

**Problem (v102):** Goldener Streak-Counter mit Shadow, Pulse und großem
Text war zu dominant im Header.

**Lösung (v103) — CSS-only:**
- Padding `3px 8px` (vorher `5px 12px`).
- Font-size `10px` statt `13px`.
- Opacity `.78` im Normal-State.
- Shadow + Pulse-Animation komplett entfernt für Streak < 7 Tage.
- Erst ab **7+ Tage** (`.v102-hot`) bekommt der Badge das volle
  orange-rote Glow + die weiche `v102StreakPulse` Animation. Das Feature
  "feiert sich selbst" erst, wenn der User echten Progress hat.

---

## 3. Bier-Button → QR-Glass-Hub

**Problem (v102):** Der Bier-Flaschen-Button im Header führte zum
Alkohol-Tracker — aber viele Core-Actions (eigenen QR zeigen, Crew-QR
teilen, Safety-Hub, Einstellungen) waren tief im Profil-Menü versteckt.

**Lösung (v103):**
- Icon ersetzt: **Glas-Kästchen mit QR-Pattern** (`i-qr-glass` SVG).
- Klick öffnet den **QR-Safety-Hub** als Bottom-Sheet mit 4 farbcodierten
  Kacheln:
  - **Gelb — Mein QR**: ruft `showMyQR()` direkt.
  - **Orange — Crew-QR**: zeigt den QR der aktiven Crew (mit Teilen +
    Download). Deaktiviert, wenn keine Crew.
  - **Grün — Safety**: öffnet `openSafetyHub()`.
  - **Lila — Einstellungen**: springt zum Profil-Screen.
- Alkohol-Tracker bleibt über die Crew-Actions erreichbar (Link in
  der Crew-Map).

---

## 4. Daily Quest System

Jeder User bekommt **täglich genau eine Quest**, deterministisch gewählt
über Hash(`user_id` + `YYYY-MM-DD`) — damit jeder User eine andere,
aber stabile Quest hat.

**Pool:**
- `match3` · Mache 3 neue Matches · +30 ✨
- `checkin2` · Checke an 2 Orten ein · +25 ✨
- `vibe1` · Setze deinen Vibe · +15 ✨
- `react5` · Reagiere auf 5 Posts · +20 ✨
- `crewmap1` · Öffne deine Crew-Karte · +10 ✨

**UI:** `.v103-quest-card` Lila-Orange-Gradient-Karte, direkt **über der
Mood-Bar** auf dem Home-Screen. Progress-Bar, "3 / 5" Zähler, Reward
rechts. Bei Erfüllung: Karte wird grün (`.done`), Konfetti, +Aura auf
`ME.points` sowie `add_points` RPC (best effort).

**Persistenz:** `localStorage.crew_quest_v1`.

**Hooks in bestehenden Code:**
- `showCele` Wrap → `questProgress('match', 1)`
- `setMood` / `pickMood` / `setMyMood` / `selectMood` / `chooseMood` →
  `questProgress('vibe', 1)` (robust via Namens-Array)
- Weitere Counter (`checkin`, `react`, `crewmap`) haben die Funktion
  `window.questProgress('...')` — bestehender Code kann später
  einfach diese globale Funktion callen.

---

## 5. Return-Detection & Welcome-Back

**`localStorage.crew_last_session_v1`** speichert beim App-Open den
`Date.now()`.

Beim Login wird geprüft: waren mehr als 7 Tage vergangen?
→ **Welcome-Back-Modal** mit:
- Waving Emoji (animiert `v103Wave`),
- "Du warst X Tage weg. Die Crew hat dich vermisst.",
- **Rückkehr-Bonus** `min(100, 20 + days*5)` ✨ — kleiner bei kurzer
  Pause, bei 2+ Wochen Pause gedeckelt auf 100.
- CTA "Let's go 🌴" → schließt Modal, Konfetti, Bonus wird auf
  `ME.points` addiert + RPC.

---

## 6. Success-Checkmark-Morph (Utility)

`window.showSuccessCheck(host, msg)` — zeigt einen animierten grünen
Check (SVG Stroke-Draw + Bounce-In) für 1,5s in einem beliebigen
Container, danach Fade-out. Haptic-Feedback `[10,20,40]`.

Nutzbar von anderem Code für "saved!", "sent!", "eingecheckt" etc.

---

## 7. Notification-Batching für Matches

**Problem:** Bei schnellen mehreren Matches (z. B. beim ersten Öffnen
nach einer Pause) feuerte `showCele` zig einzelne Toasts.

**Lösung:** Die `showCele` ist gewrappt und callt zusätzlich
`batchMatchNotif(label)` — die sammelt im `localStorage.crew_notif_batch_v1`
alle Matches innerhalb eines **5-min-Fensters**. Ein Timer feuert am
Ende des Fensters einen **einzigen** Toast:
- 1 Match: `💥 Neues Match: Name`
- 2+: `💥 3 neue Matches in den letzten 5 Min!`

Cinematic-Overlay pro Match bleibt bestehen (Core-Feature), nur der
Toast wird gebündelt.

---

## 8. Safety-Hub: human-friendly Koordinaten

**Problem (v102):** Der Safety-Hub zeigte `39.56784, 2.65012` —
technisch, nicht menschlich lesbar.

**Lösung (v103):**
- `window.coordsToReadable(lat, lng)` matcht gegen eine Mallorca-POI-Liste
  (Palma, Arenal, Magaluf, Palmanova, Cala Ratjada, Alcúdia, Can Picafort,
  Santa Ponça, Peguera, Sóller, Valldemossa, Pollença, Cala Millor,
  Manacor, Inca, Ses Salines, Felanitx, Andratx) mit Haversine-Distanz
  und POI-spezifischem Radius.
- Ausgabe:
  - `📍 Palma` (innerhalb Radius)
  - `📍 Nähe Palma` (bis 1.8× Radius)
  - `📍 bei Palma (~3 km)` (für weiter weg, < 9 km)
  - `📍 auf Mallorca` (fallback)
- Die Rohkoordinaten sind **unter einem `<details>`-Summary** weiterhin
  einsehbar ("Rohkoordinaten anzeigen"), falls User/Debug sie brauchen.

---

## Datei-Änderungen

- `app.html`
  - Line 2899: neues SVG-Symbol `i-qr-glass` (v102-Turn).
  - Line 4548: Bier-Button ersetzt durch QR-Glass-Button (v102-Turn, Name hochgesetzt).
  - Line 3653–3826: gesamter `v103`-CSS-Block (Streak dezent, Level-Button,
    Hub, Check-Morph, Quest-Card, Return-Modal) vor `</style>`.
  - Nach v102-IIFE (~Line 15334): neuer v103-IIFE mit JS-Layer
    (~600 Zeilen) für alle oben beschriebenen Features.
  - Service-Worker-Tag von `sw.js?v=14` auf `sw.js?v=15`.
- `sw.js`
  - `CACHE = 'crew-v103'` (vorher `'crew-v102'`).

## Akzeptanz-Kriterien

- [x] Aura-Kachel auf Home zeigt keine Level-Chip/Bar mehr.
- [x] Profil-Menü zeigt ganz oben einen gold-orangenen Level-Button.
- [x] Klick auf Level-Button öffnet Detail-Modal, das sich via × oder
      Backdrop schließen lässt.
- [x] Fremde Profile zeigen `⭐ LVL n` in der Badges-Reihe.
- [x] Header-Streak ist unter 7 Tage dezent (opacity .78, kein Glow),
      ab 7 Tagen hot.
- [x] Header-Button rechts ist ein Glas-Kästchen mit QR-Pattern — nicht
      mehr die Bierflasche.
- [x] Klick öffnet den 4-Kachel-Hub, die Tiles routen sauber zu
      `showMyQR`, Crew-QR, `openSafetyHub`, `go('profile')`.
- [x] Safety-Hub zeigt lesbare Orts-Bezeichnung (z. B. "📍 Palma")
      statt reiner Koordinaten. Rohkoordinaten als Details einklappbar.
- [x] Tages-Quest-Karte erscheint über Mood-Bar auf Home. Fortschritt
      läuft bei Match / Vibe hoch. Done-State wird grün.
- [x] Nach 7+ Tagen Abwesenheit: Welcome-Back-Modal mit Rückkehr-Bonus.
- [x] Mehrere Matches innerhalb 5 Min werden zu einem Toast gebündelt.
- [x] Syntax-Check: `new Function(combined)` läuft ohne Fehler.
- [x] SW-Cache `crew-v103` + `sw.js?v=15` bumpt alles für User-Refresh.

## Offen für spätere Versionen

- **Crew-Shared-Achievements** (v104): Aggregierte Crew-Erfolge auf
  Basis Server-Daten (benötigt DB-Schema für `crew_achievements`).
- **Shared-Element-Morph** (v104): Crew-Card-Hero → Crew-Profil-Hero
  als Shared-Element-Transition (erfordert View-Transitions-API oder
  FLIP).
- **Quest-Streak**: mehrere Tage in Folge Quest erfüllt → Bonus.
- **Server-seitige Return-Detection**: Statt localStorage lieber
  `profiles.last_seen_at` nutzen (→ funktioniert auch bei Re-Install).
