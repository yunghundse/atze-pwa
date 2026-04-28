# crew. — v102 „Level up & Streak"

**Status:** v102 live (Aura-Level, Streak-Counter, Mystery-Bonus, Ripple-FX, Input-Validation, Stagger, Cinema-Join-Everywhere)
**Basis:** 3 parallele Agent-Reviews (UX, Motion, Retention) — synthesized scope
**Cache:** `crew-v102` (sw.js bump auf v=14)
**Ziel:** Mehr Grund, morgen wiederzukommen + mehr „Wow" bei bestehenden Aktionen

---

## 1. Agent-Findings (Zusammenfassung)

### A) UX-Review (Top-10 davon übernommen)
1. Crew-Join Cinema läuft nur beim Invite-Mode, nicht beim Code-Join → **gefixt**
2. Swipe-Filter Feedback (verschoben auf v103)
3. Notification-System-Fix (v103)
4. Geburtsdatum-Select-Perf (v103)
5. Crew-Create Hang-Fix (in v101b erledigt)
6. Match-Rewind-Fix (v103)
7. Chat-Scroll-Fix (v103)
8. Tap-Targets Match-Screen (v103)
9. Safety-Hub-Koordinaten human-friendly (v103)
10. Leaderboard-Zero-Aura sichtbar (v103)

### B) Motion-/Visual-Review (Top-10 davon übernommen)
1. Input-Validation-Cascade (shake/bounce) → **live**
2. Toggle-Spring-Release (v103)
3. Button-Ripple-FX → **live**
4. Shared-Element-Morph Card→Detail (v103, komplexer)
5. Long-Press Haptic-Indikator (v103)
6. Skeleton-Breathing + Shimmer-Combo (v103)
7. Success-Checkmark-Morph (v103)
8. Modal Backdrop Progressive Depth (v103)
9. Icon-Pulse auf Notification-State (v103)
10. Staggered List Entrance + Reorder → **live** (Entrance)

### C) Retention-/Gamification-Review (Top-10, Quick-Win-Paket übernommen)
1. **Streak-Counter** → **live** (localStorage-basiert, Milestones bei 3/7/14/21/30/50/100)
3. **Aura-Level-System mit Progress-Bar** → **live**
6. **Mystery Aura Bonus** (10 % Chance auf Match) → **live**
9. Return-Detection + Welcome-Back-Bonus (v103, brauchen DB-Feld)
2. „Crew online" Push (v103, Realtime-Sub-Setup nötig)
4. Daily Quest (v104, größerer Feature-Block)
5. Win-Back Push nach 3 Tagen (v104, Cron-Job nötig)
7. Crew-Shared Achievements (v104)
8. Match-Batch-Notif (v103)
10. Vibe-Completion-Prompt (v103)

---

## 2. Was v102 JETZT bringt

### 2.1 Aura-Level-System

**Problem vorher:** Aura-Zahl wuchs, hatte aber kein Progression-Feeling. „143 Aura" ist nicht greifbar.

**Jetzt:**
- Level-Kurve: Lvl 1 (0), Lvl 2 (100), Lvl 3 (250), Lvl 4 (450), Lvl 5 (700) … — jedes Level braucht 50 Aura mehr als das vorherige.
- Auf Home in der Aura-Kachel: oben rechts `LVL 3`-Chip + unten eine dünne orange→gelbe Progress-Bar bis zum nächsten Level.
- Tooltip (Long-Press/Hover): „Level 3 • noch 107 Aura bis Level 4".
- **Level-Up-Celebration:** radiales Overlay mit Stern-Spin-In, großer Zahl, 2× Confetti (gestaffelt), 4 randomisierte Gratulations-Messages, Haptic `[18,14,32,14,60]`, Auto-Dismiss nach 7.5 s, Button „Weiter feiern ✨".
- Erkennung: alle 1.2 s wird `ME.points` gepollt — billig, stabil, ohne Proxy/Setter-Override.

**Helper:**
```js
getLevelInfo(points) // → {level, cur, next, progress, toNext}
```

### 2.2 Streak-Counter

**Problem vorher:** `.streak-badge` war im CSS seit Ewigkeiten `display:none !important`. `ME.streak` wurde aus `profiles` gelesen, aber nirgends inkrementiert. Der Sunk-Cost-Hook fehlte komplett.

**Jetzt:**
- Pure localStorage (`crew_streak_v1`), kein DB-Write. Bewusst kein Server-State — wir wollen zuerst testen, ob User's das lieben.
- On App-Open: `touchStreak()` checkt das letzte Datum.
  - Heute schon aktiv → nichts.
  - Gestern aktiv → +1.
  - Mehr als 1 Tag Pause → Reset auf 1 (dezenter Toast bei Break, nur wenn vorher ≥3).
- Badge im App-Header ist jetzt sichtbar mit 🔥 + Zahl. Ab 7 Tagen wechselt auf „Hot-Style" (rot-orange, schnellerer Pulse).
- Tappable → zeigt Toast mit nächstem Milestone.
- **Milestone-Celebrations** bei 3, 7, 14, 21, 30, 50, 100 Tagen: Toast + 100er Confetti + Haptic.

### 2.3 Mystery Aura Bonus

**Problem vorher:** Jeder Match gibt fix +50 Aura. Keine Variance, keine Slot-Machine-Überraschung.

**Jetzt:**
- Nach jedem Match-Celebration (monkey-patch von `showCele`) wird mit **10 % Chance** `+50` Bonus-Aura vergeben.
- Visuell: gold-leuchtender Text-Burst „🎁 LUCKY! +50 ✨" in der Bildschirm-Mitte, 1.8 s lang, gefolgt von goldenem Mini-Confetti (70 Partikel).
- Zusatz-Haptic `[10,10,30,10,50]`.
- Ruft `add_points` RPC + `updateProfile` + `updateQuickStats` — Level-Up-Trigger kann dadurch kaskadieren (Match → Bonus → Level-Up).

### 2.4 Crew-Join-Cinema auch bei Code/QR-Join

**Problem vorher:** Cinema lief nur, wenn User durch den Preview-Invite-Flow kam. Wer per Code oder QR direkt joined, bekam nur einen Toast — anti-climactic.

**Jetzt:**
- Wrapper um `window.joinCrew(crewId)`. Wenn der Original-Call `true` zurückgibt UND kein `_crewPreviewCtx` aktiv ist (sonst Doppel-Cinema), lädt der Wrapper Crew-Data + Top-Members und feuert `playCrewJoinCinema()`.
- Cinema kennt also alle 3 Flows: Invite, Code, QR.

### 2.5 Button-Ripple-FX

**Problem vorher:** Buttons hatten nur `scale(.96)` on active. Kein Feedback, dass der Tap „registriert wurde".

**Jetzt:**
- Global via `pointerdown`-Delegation auf `.btn, .tc-btn, .dtab, .deal-cta, .cj-btn-primary, .cj-btn-secondary, .hsc-cta, .lvl-btn, .fab-primary, button.primary`.
- Ripple spawnt an der Tap-Position, 180 px radial, 580 ms Lebensdauer, `mix-blend-mode:overlay` für natürlichen Look.
- Element-Position/Overflow wird on-the-fly angepasst, falls nötig — keine Breaking-Changes am bestehenden Layout.

### 2.6 Stagger List Entrance

**Problem vorher:** Listen (Crew-Mitglieder, Leaderboard, Match-Cards) erschienen alle gleichzeitig oder sprangen hart rein.

**Jetzt:**
- `.v102-stagger` Utility-Klasse mit `--i` Custom Property pro Kind → 55 ms Staffelung.
- Beim Screen-Wechsel (wrap um `window.go()`) wird automatisch auf folgende Container angewendet, wenn sie 1–20 Kinder haben:
  - `#crewsub-active`, `#leaderList`, `#cardStack`, `#crewsTrending`, `#crewsNew`.
- Nach Ende der Animation wird die Klasse wieder entfernt, damit Hover-States nicht gestört sind.

### 2.7 Input-Validation-Cascade

**Problem vorher:** `.ri`-Inputs (überall im Onboarding, Chat, Crew-Create) hatten nur `:focus`-Border. Kein Feedback bei gültig/ungültig.

**Jetzt:**
- On `blur` werden `.ri`-Inputs geprüft: type=email-Regex, minlength, maxlength, pattern, checkValidity.
- Nur bei nicht-leerem Input (leere Pflichtfelder werden nicht als Fehler markiert).
- Invalid → roter Border + Box-Shadow + `.36s` Shake + 12 ms Haptic.
- Valid → grüner Border + Box-Shadow + soft Bounce.
- Beim nächsten Tipp wird Invalid-State wieder entfernt (User wird nicht „bestraft").

---

## 3. Technische Guardrails

- **Additiv, nicht destruktiv.** Alle Patches wrappen existierende Funktionen (`window.showCele`, `window.joinCrew`, `window.go`, `window.updateQuickStats`). Keine Original-Funktion ersetzt.
- **Kein DB-Migration.** Level wird aus existierenden `profiles.points` berechnet. Streak lebt in `localStorage`.
- **`prefers-reduced-motion`** wird für alle v102-Animationen respektiert (Overlay, Ripple, Lucky-Burst, Stagger, Streak-Pulse).
- **Polling statt Proxy:** `ME.points` wird alle 1.2 s geprüft. Billig, keine Setter-Side-Effects, funktioniert auch wenn Supabase-Updates asynchron kommen.
- **IIFE-Scope** — keine globalen Variablen-Lecks außer den explizit als `window.xxx` exportierten Helpern (`getLevelInfo`, `showLevelUp`, `paintLevelInQuickStats`, `paintStreakBadge`, `showLuckyBurst`, `_v102CheckLevelUp`, `_v102TouchStreak`, `_v102GetStreak`).
- **Reduced-Motion + A11y:** Alle neuen Buttons haben Focus-States, Overlay schließt via ESC (Browser-Default durch `button`-Element), `aria-disabled` wird beim Ripple beachtet.

---

## 4. Was MESSBAR sein sollte (vor/nach)

- **DAU-Retention Day 3 → Day 7:** Streak sollte +10–20 % bringen (Analogie: Duolingo, Snapchat Streaks).
- **Session-Länge:** Level-Progression + Lucky-Burst sollten Match-Sessions verlängern.
- **Match-Reaktionen:** Schauen, ob User bei Lucky-Bursts öfter „weiterswiped" vs. vergleichbarem Zeitraum.
- **Streak-Break-Rate:** Wie oft reißt der Streak? (Proxy für „wie wichtig war er psychologisch"?)

---

## 5. Roadmap (aktualisiert)

### v103 (nächste Runde, UX-Feinschliff + Polish)
- Match-Rewind-Fix (`cIdx` Reset)
- Chat-Scroll-ResizeObserver
- Match-Filter-Feedback (Spinner bei apply)
- Tap-Targets Match-Screen auf 44 px
- Safety-Hub-Koordinaten → Radius-Namen
- Leaderboard zeigt ME bei 0 Aura
- Return-Detection nach 7 Tagen Inaktivität (Welcome-Back-Modal + Bonus)
- Icon-Pulse auf Notification-State
- Long-Press Haptic-Indikator auf Crew-Cards
- Shared-Element-Morph (Card → Detail)
- Success-Checkmark-Morph nach Save/Join

### v104 (Gamification-Ausbau)
- **Daily Quest** (3 Random-Missionen pro Tag, Pool: Match-3, Check-In-2, Vibe-teilen, React-geben)
- **Crew-Shared Achievements** (Full-Crew-Activity, Crew-Aura-Milestones)
- **Win-Back-Push** nach 3 Tagen (Edge-Function + Cron)
- **Match-Batch-Notif** („3 neue Likes")
- **„Crew online"-Realtime-Badge** auf Home

### v105 (Design-System-Konsolidierung finalisieren)
- Blur-Stufen auf 3 reduzieren (`--blur-sm/md/lg`)
- Shadow-Familie (`--shadow-sm/md/lg`) refactoren (253 Instanzen)
- Spacing-Token durchsetzen
- Border-Radius durch Tokens ersetzen
- `--o` vs. `--orange` auflösen

---

## 6. Was UNVERÄNDERT bleibt

- Alle existierenden Screens, Flows, Funktionen
- Supabase-Schema (keine Migration)
- Profil-Daten, Matches, Crews, Deals
- Das „crew."-Gefühl — nur mehr Grund, morgen wieder da zu sein

---

*Konzept-Stand: v102 deployed. Cache `crew-v102`, Service-Worker `sw.js?v=14`. Zwei lokale Commits warten auf Push zu `origin/main` (c8d4269 v101, 0453a7d v101b — dieser v102-Commit kommt noch).*
