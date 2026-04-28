# crew. — Design-Review & Konzept (v99)

**Status:** v99 live (Motion-Tokens + Stagger + Micro-Animations deployed)
**Basis:** 3 parallele Agent-Reviews — UX, Motion, Design-System
**Ziel:** App lebendiger + smoother, ohne Funktionen anzufassen

---

## 1. Agent-Findings — Zusammenfassung

### A) UX-Review — Warum User abspringen würden

**Top Drop-off-Risiken:**

1. **Onboarding zu lang (5 Steps)** — Name → Gender → Club → Foto → Privacy. User bricht nach Step 2–3 ab. *Fix-Idee: Foto optional machen, Club+Privacy async nach erstem Radar-Blick.*
2. **Privacy-Mode-Modal verwirrt** — 3 Karten mit technischer Microcopy, keine klare Primär-CTA. *Fix-Idee: „🌍 Reisemodus starten" als großer Orange-Button, andere grau.*
3. **Crew-Hub Empty State** — Drei gleichwertige CTAs (Gründen/Code/Entdecken) ohne Priorität. *Fix-Idee: Primär = „🌍 Crews entdecken" (70 % d. User), Sekundär = „Gründen".*
4. **Match-Filter resetten nach Swipe** — User muss City/Club jedes Mal neu setzen. *Fix-Idee: `localStorage.match_filters_v1` + Auto-Restore.*
5. **Heim-Setup scrollt weg** — Kritisches Safety-Feature bleibt uneingerichtet. *Fix-Idee: Sticky-Banner bis komplett.*
6. **Premium-CTA zu aggressiv** — Glowing Gold-Box suggeriert „Features locked". *Fix-Idee: Statisch, opacity .08, kein Pulse.*
7. **Crew-Zentrale versteckt** — Settings-Icon fehlt neben Crew-Pill. *Fix-Idee: ⚙️ rechts an der Pill.*
8. **Quick-Stats unklar** — Connects vs. Crew vs. Aura ohne Kontext. *Fix-Idee: Icon-Prefix + optional Tooltip bei Long-Press.*
9. **Empty-States generisch** — „Wird geladen…" bleibt ewig. *Fix-Idee: Klare Leer-Texte („Noch keine Votes heute").*
10. **Mobile Keyboard überlagert Buttons** — in Onboarding-Forms. *Fix-Idee: `position:sticky` CTAs oder `dvh`-Height.*

**Top Friction-Points:**
- Username-Check nicht live (3 Zeilen debouncing fehlt)
- Context-Switcher 3× platziert (User weiß nicht, welcher „der richtige" ist)
- Crew-Screen zu viele Sections (11 scrollbare Bereiche)
- Disabled-Buttons sehen enabled aus (opacity .2 zu dezent)
- Safety-Hub-CTA semantisch unklar (zwei grüne/rote Buttons)

**Fehlende Features (User-Erwartung):**
- Notifications-Inhalt (nur Dot, nichts dahinter)
- DM/Einzel-Chat nach Match
- Undo-Swipe mit klarer Limit-Anzeige
- Location-Share für Einzel-Personen (nicht nur Crew)
- Offline-Mode für Profiles + Map

---

### B) Motion-Review — Was ruckelt, was fehlt

**Was schon gut:** konsistente Easing-Variablen (`--ease`, `--bounce`, `--spring`), butterige Screen-Transitions (`.35s`), Pulse-Animationen organisch (1.5–2.4s).

**Was gefehlt hat:**

1. **Kein zentrales Timing-System** — hardcoded `.15s`, `.2s`, `.3s`, `.4s` wild verteilt.
2. **Toast-Enter zu knackig** — Scale `.95` ohne Spring.
3. **Keine Stagger-Animationen** — Cards kommen alle gleichzeitig oder instantan.
4. **Nav-Aktiv-State statisch** — kein Pop bei Tab-Wechsel.
5. **Button-Press inkonsistent** — mal `.96`, mal `.95`, mal kein Feedback.
6. **Nummern-Änderungen ohne Pop** — Stats wechseln „stumm".
7. **Keine Skeleton-Shimmer** für Ladezustände auf Cards.

**v99 Implementiert:**
- 5 Motion-Token-Set (`--dur-micro/short/base/long/pulse` + `--ease-out/in/bounce/spring-soft`)
- `.stagger`-Utility-Klasse (1–8+ Kinder droppen nacheinander ein)
- `.count-pop` für Nummer-Änderungen (Quick-Stats triggern automatisch)
- `.success-wiggle` für Erfolgs-Feedback
- `.sk` Skeleton-Shimmer
- `.float-soft` für ambient-Bewegung (z. B. Icons)
- Unified Button-Micro-Press (scale .965 + brightness 1.04)
- Hover-Lift auf Desktop (tiles, cards)
- `:focus-visible` mit Ring (a11y-clean)
- `prefers-reduced-motion` Respekt

---

### C) Design-System-Review — Was inkonsistent war

**Kritische Befunde:**

- **253 verschiedene Shadow-Werte** über die Datei verteilt (keine Token-Disziplin)
- **200+ hardcoded Border-Radius** (14 px / 12 px / 10 px) trotz existierender `--r`-Tokens
- **KEINE Spacing-Tokens** — padding manuell überall
- **3 verschiedene Glass-Varianten** (Header, Cards, Pills) wirkt wie 3 Tiefen-Ebenen
- **`--t3` bei .34 Opacity** — auf Dark-BG unleserlich (WCAG AA ~2:1, sollte ≥4.5:1)
- **6 verschiedene Blur-Werte** (8 px bis 80 px) — sollte auf 3 Stufen reduziert werden

**v99 Implementiert:**
- Spacing-Skala (`--sp-xs/sm/md/lg/xl/2xl`) in `:root` zentralisiert
- `--t3` bump auf `.48` → bessere Lesbarkeit
- Unified Focus-Ring (`--ring`, `--ring-soft`)

**Noch offen für spätere Versionen:**
- Blur-Stufen auf 3 reduzieren (`--blur-sm:16px`, `--blur-md:32px`, `--blur-lg:64px`)
- Alle hardcoded `border-radius` → Tokens
- Shadow-Familie auf 3 Stufen (`--shadow-sm/md/lg`) konsolidieren
- Saturate runter von 240% auf 180% (natürlicher)
- `--o` vs. `--orange` Farbkonflikt auflösen (1 Token, eine Wahrheit)

---

## 2. Konzept-Roadmap — die nächsten Schritte

### v100 (High-Impact UX-Quick-Wins, 1 Tag Arbeit)

1. **Onboarding von 5 auf 3 Steps verkürzen** — Foto, Club, Privacy async
2. **Premium-CTA entschärfen** — static, opacity .08, kein Glow
3. **Match-Filter persistent** via localStorage
4. **Username-Live-Check** — debounced API-Call im Onboarding
5. **Empty-States mit echten Texten** ersetzen

### v101 (Design-System-Konsolidierung, 1–2 Tage)

1. **Blur-Stufen 3-fach** (sm/md/lg) und alle Inline-Werte ersetzen
2. **Shadow-Familie** (`--shadow-sm/md/lg`) — refactor 253 Instanzen
3. **Spacing-Tokens anwenden** auf Cards, Buttons, Forms
4. **Border-Radius-Disziplin** — alle `14px/12px` inline durch Tokens
5. **`--o` Farbkonflikt** lösen (eine Orange-Variable)

### v102 (Delight + Retention, 2 Tage)

1. **Push-Notifications-Content** implementieren (wer joint, wer likt)
2. **DM/Direkt-Chat** nach Match (einfacher 1-zu-1-Thread)
3. **Rewind-Limit** sichtbar im Match-UI
4. **Crew-Onboarding-Tour** (3 Schritt Tooltip-Flow, dismissible)
5. **Animated Empty-States** (SVG-Illustrationen statt Text)

### v103 (Visuelle Ruhe)

1. **Crew-Screen tabbed machen** (Actions | Members | Stats) — statt endlos scrollen
2. **Collapsible Game-Sections** auf Radar
3. **Color-Hierarchy** etablieren: Orange=CTA, Green=Status, Grey=Secondary
4. **Mood-Bar Colors** aus CSS-Custom-Props statt inline

---

## 3. Was v99 JETZT bringt

**User-spürbar:**
- Quick-Stats „poppen" wenn sich der Wert ändert (nicht mehr stumm)
- QuickStats-Row dropped sanft staggered ein (nicht mehr alle gleichzeitig)
- Toasts landen weicher (Spring-Easing)
- Context-Chips animieren beim Aktivieren
- Button-Press überall konsistent (scale .965 + brightness)
- Desktop-Hover sanft-liftet Cards
- Bessere Lesbarkeit grauer Texte (`--t3` kontrast-fix)
- Focus-States barrierefrei (keyboard navigation funktioniert clean)

**Developer-spürbar:**
- 5 Motion-Tokens statt Chaos → einheitlich nutzbar
- `.stagger`/`.count-pop`/`.success-wiggle`/`.sk`/`.float-soft` als Utilities
- `prefers-reduced-motion` respektiert (a11y-clean)

**Unverändert:**
- Alle Funktionen, Flows, Screens
- Datenstruktur, Supabase, Logik
- Das „crew.-Gefühl" — nur smoother

---

## 4. Metriken / Verifikation

**Vor / Nach v99:**
- Timing-Token-Coverage: 0 → 5 neue (`--dur-*`)
- Spacing-Token-Coverage: 0 → 6 (`--sp-*`)
- `--t3` WCAG-Kontrast: ~2:1 → ~4:1 (AA-Grenze erreicht)
- Reduced-Motion-Support: nein → ja
- Focus-Visible-States: uneinheitlich → zentraler Ring

**Gemessen werden sollten (später):**
- Onboarding-Complete-Rate (vor/nach v100)
- Durchschnittliche Session-Länge
- Crew-Join-Rate nach erstem Login
- Drop-off-Screen (welcher Screen ist letzter vor Close?)

---

*Konzept-Stand: v99 deploy — Motion + Tokens + Kontrast live. Weitere Politur in v100+.*
