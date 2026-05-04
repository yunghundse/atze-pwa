# crew. — Neue Architektur (v2.0)

**Stand:** 04.05.2026 · Sprint-Reset nach 43 Layer-Konflikten
**Ziel:** Saubere Compliance-by-Design Struktur statt Layer-Spam

---

## 1. Bestandsaufnahme (warum wir das brauchen)

`app.html` (Stand 04.05.2026):
- **1.67 MB** Single-File
- **43 bb-* Layer** (style + script Pairs) stapeln sich
- **1.331 `!important`** Deklarationen
- **82 `display:none !important`** Hide-Regeln
- **88 unterschiedliche z-index** Werte (0 bis 99.999.999)
- **27 `window.bb*` Funktionen** exposed

Das ist nicht erhaltbar. Jeder Bug-Fix erzeugt durch CSS-Spezifitäts-Kämpfe drei neue Bugs.

### Symptome die User direkt sieht
- SafePlace-Tab öffnete sich nicht (Funktionsname verwechselt: `openSafeplaceHub` vs `openSafePlace`)
- Profile-Bild fehlte (DB-Spalte heißt `name`/`photo_url`, nicht `display_name`)
- Buttons überlappten (mehrere FABs koexistieren)
- "Du bist in keiner Crew" trotz Crew-Members (Legacy-Layer prüfen falsche Tabelle)
- Wizard-Submit liest leeren State (Step 2 Inputs in Step 3 weg)

### Strukturelles Grundproblem
Jeder neue Layer **ergänzt** die App, **deaktiviert aber den vorherigen Layer nicht**. Konflikte werden mit `!important` und höherer Spezifität niedergeschrien — bis das Konzept verloren geht.

---

## 2. Neue Architektur-Prinzipien

### 2.1 Single Source of Truth pro Domain

| Domain | Owner-Datei / Layer |
|---|---|
| Routing | `bb-orchestrator` (zentrale `switchToScreen()`) |
| Design-Tokens | `bb-recovery` (`:root` mit `--c-*`, `--s-*`, `--t-*`, `--r-*`) |
| Bottom-Nav | `bb-finaldesign` (5-Button-Glass-Pill mit SafePlace) |
| SafePlace | `window.openSafeplaceHub()` (Original, NICHT überschreiben) |
| Hotspots | `bb-hotspot-v3` (V3 ist gültig, V2-Wizard-DOM bleibt) |
| Profile | Legacy-Markup (`.prof-hero`, `.prof-stats`, `.pmenu`), NUR poliert |
| Trust-System | `crew_trust_ratings` Tabelle + `get_crew_circle` RPC |
| SOS | Header-Button + Long-Press auf SafePlace-Nav-Button |

### 2.2 Subtraktiv statt destruktiv

- ❌ `#screen-profile > div:not(.bb-profile-wrap){ display:none }` — destruktiv
- ✅ Nur explizit benannte Elemente verstecken: `.sc-wrap, .aud-banner, ...`
- ❌ Komplette UI-Komponenten ersetzen
- ✅ Bestehende Komponenten polieren via Design-Tokens

### 2.3 Design-Tokens als Pflicht

**Alle künftigen Layer** verwenden ausschließlich diese Variablen aus `:root`:

```css
/* Typography */
--t-1: 22px; --t-2: 18px; --t-3: 15px; --t-4: 13px; --t-5: 11px;

/* Spacing */
--s-1: 4px; --s-2: 8px; --s-3: 12px; --s-4: 16px; --s-5: 24px; --s-6: 32px;

/* Colors */
--c-pink: #FE3C72; --c-orange: #FF6D2E; --c-gold: #FFD60A;
--c-green: #28C878; --c-blue: #3B82F6; --c-purple: #A855F7;
--c-bg: #05050A; --c-surface: rgba(255,255,255,.04);
--c-text-1: #FAFAFA; --c-text-2: rgba(255,255,255,.7);
--c-line: rgba(255,255,255,.08);

/* Radius */
--r-1: 8px; --r-2: 12px; --r-3: 16px; --r-4: 20px; --r-5: 999px;
```

**Keine** hartcodierten Hex-Codes oder Pixel-Werte mehr in neuen Layern.

### 2.4 Z-Index-Ladder (eingefroren)

| Wert | Layer |
|---|---|
| 1 | Base content |
| 50 | Pills, Status-Indikatoren |
| 400-415 | Map-Overlays (Filter-Bar, Loading-State) |
| 1000 | Header (sticky top) |
| 1100 | Bottom-Nav (fixed bottom) |
| 1200 | FAB (deprecated — keine FABs mehr) |
| 1900 | Toasts |
| 1950 | Bottom-Sheets |
| 1990 | SafePlace-Hub `#safeplaceOv` |
| 2000 | Modals |
| 2100 | Modal-Stack (Wizard auf Modal) |
| 2200 | Modal-Top (Trust-Rate-Modal) |
| 2300 | Tour/Onboarding |

**Keine** Werte > 2300 mehr verwenden. `99999999` ist ein Bug.

### 2.5 Naming Conventions

```
bb-<feature>-v<N>     /* feature layer mit Version */
.bb-<component>       /* CSS-Komponente */
.bb-<component>-<modifier>  /* Modifier */
window.bb<Feature>    /* Public API namespace */
```

**Verbotene Patterns:**
- Generische Klassen wie `.card`, `.btn` (zu uneindeutig — Konflikte)
- `<div class="...">` ohne `bb-` Prefix für eigene Komponenten

### 2.6 DB-Spalten: Wahrheit checken

Bevor du eine RPC oder Query schreibst:

```sql
SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='profiles'
ORDER BY ordinal_position;
```

**Profiles** hat:
- `name`, `username`, `photo_url`, `tagline`, `bio`
- `audience_profile`, `safety_sos_color`, `safety_sos_stealth`
- **NICHT** `display_name` (gibt es nicht!)

---

## 3. Migrations-Plan: 5 Phasen

### Phase 1 — Stabilisierung (Stand: jetzt)
- [x] Audit dokumentieren (diese Datei)
- [x] Design-Tokens etablieren (`bb-recovery`)
- [x] Legacy-Profil zurückbringen (Hide-Rule entfernt)
- [x] DB-Spalten in RPCs korrigiert (`name`/`photo_url`)
- [x] 5-Button-Nav mit SafePlace
- [ ] Diese MD ChatGPT/nächstem-Dev übergeben

### Phase 2 — Layer-Reduktion (geplant)
Diese Layer sind **redundant oder veraltet** und können entfernt werden:
- `bb-fixroutes` — durch `bb-saferealn` + `bb-finaldesign` ersetzt
- `bb-saveprofile` — durch `bb-recovery` ersetzt (zerstörte Profile)
- `bb-fixfinal` — Wizard-Cache jetzt redundant (Wizard wurde später überarbeitet)
- `bb-status-center` — wenn Hub-Quick-Tiles aus `bb-ux-v3` reichen
- `bb-polish` + `bb-polish-v2` — durch Design-Tokens ersetzbar

**Vorgehen:** Layer einzeln deaktivieren via `<style id="bb-X">/* DISABLED */</style>`, App testen, dann ganz entfernen.

### Phase 3 — Komponenten-System
Aus den verbleibenden Layern echte wiederverwendbare Komponenten extrahieren:

```
components/
  bb-card/          /* glass-card pattern */
  bb-button/        /* primary/secondary/danger */
  bb-modal/         /* bottom-sheet + drag-handle */
  bb-input/         /* text/textarea mit focus-ring */
  bb-toast/         /* mit/ohne undo */
  bb-avatar/        /* photo/initial/icon-fallback */
  bb-stars/         /* trust-rating display */
  bb-pill/          /* status, tag, chip */
  bb-tile/          /* selection grid */
```

Jede Komponente: 1 CSS + 1 JS-Konstruktor.

### Phase 4 — Compliance-by-Design Checklisten
Pro Component automatischer Checklauf:
- [ ] Kein hartcodierter Color/Spacing/Typography
- [ ] Z-Index aus erlaubter Range
- [ ] Kein `!important` außer bei Reset/Override-Block
- [ ] DSGVO: Kein Tracking ohne Consent
- [ ] Audit-Log bei jeder Daten-Verarbeitung
- [ ] Keyboard-Accessible
- [ ] ARIA-Labels gesetzt
- [ ] Reduced-Motion respektiert
- [ ] iOS Safe-Area beachtet

### Phase 5 — Build-Pipeline
Statt 1.67 MB Single-File:
- `app.html` = HTML-Skeleton
- `bb.css` = bundled CSS aller bb-* Layer
- `bb.js` = bundled JS aller bb-* Layer
- `bb.<feature>.js` = lazy-loaded Features (Hotspots, SafePlace)

---

## 4. Komponenten-Inventar (was jetzt existiert)

### Routing
- `window.bbOrch.switchToScreen(name)` — zentraler Tab-Wechsel
- 5 Tabs: `hub` / `spots` / `safety` / `crew` / `profile`
- `safety` öffnet `#safeplaceOv` Overlay (nicht eigener Screen)

### Hotspots
- DB: `hotspots` (kind/visibility/audience/expires_at), `hotspot_members`, `hotspot_messages`
- RPCs: `get_visible_hotspots_v2`, `get_hotspot_members`, `get_hotspot_messages`
- 6 Kinds: safe/trust/live/watch/party/community
- 4 Visibilities: public/friends/circle/private
- Wizard: 3-Step (Kind → Name → Visibility+TTL)
- Detail-Card V3: Tabs Info/Mitglieder/Chat
- Auto-Join nach Create
- Realtime-Channel `hotspot-detail-{id}`

### Trust-System
- DB: `crew_trust_ratings` (rater/rated/score 1-5/tags)
- View: `user_trust_summary` (avg + count + top_tags)
- Function: `calc_activity_score(uid)` 0-100
- RPC: `get_crew_circle()` (Self + Safety-Circle + Hotspot-Co-Members)
- 12 Tag-Optionen: zuverlässig, aktiv, ehrlich, hilfsbereit, ...

### SafePlace
- Element: `#safeplaceOv`
- Klasse: `.show` (NICHT `.on`)
- Open: `window.openSafeplaceHub()` (definiert im Original-bb-safeplace)
- Trigger: SafePlace-Button in 5er-Nav (mittiger Pink-Button)

### Audience-Profile (7)
- general / party / familie / solo / pflege / recovery / lgbtq
- DB: `profiles.audience_profile`
- UI: `aud-banner` (nur Hub), Audience-Picker-Modal

### Mood-System
- 10 Moods als Custom-SVG-Mask (kein Emoji)
- DB: `user_moods` (TTL 12h)
- Quick-Picker im Hub Status-Center

### SOS
- DB: `sos_alerts`
- Stealth: `profiles.safety_sos_stealth`
- Color: `profiles.safety_sos_color` (6 Farben)
- Trigger:
  - Header-SOS-Button (Hold-to-Confirm)
  - Long-Press 1.2s auf SafePlace-Nav-Button
  - Hardware Vol-Up + Vol-Down (eingeschränkt)

### Live-Location
- DB: `live_locations` (TTL 24h max, default 30min)
- Quick-Toggle in Header (`live-quick`)
- Quick-Tile im Hub

### Heimweg
- DB: `home_routes`
- Quick-Tile im Hub
- Toggle in Status-Center

---

## 5. Was offen bleibt (für nächsten Dev / ChatGPT)

### High-Priority
- **Layer-Reduktion (Phase 2):** 5-10 redundante Layer entfernen
- **Foto-Upload-Hook:** `prof-ava-edit` ruft `openPhotoUpload()` aber Funktion fehlt
- **Heimweg-Modal-Integration:** `window.bbStartHomemode(min)` exposen
- **Pin-Click-Detail-Wiring:** Pin-Click in Map muss V3-Detail öffnen

### Medium-Priority
- **Mood-Filter** auf Crew/Friends-Wall
- **Pinned-Posts** für Crew-Owner
- **Realtime auf Hotspots** (neue Spots erscheinen ohne Reload)
- **Hotspot-Search** (suchen statt nur radius)

### Low-Priority
- **Onboarding-Tour** überarbeiten (jetzt zu lang)
- **Dark/Light-Toggle** (aktuell hart Dark)
- **i18n** (aktuell nur Deutsch)

---

## 6. Nicht-mehr-tun-Liste (Anti-Patterns)

❌ Neuer `bb-X-Y` Layer für jeden Bug-Fix
✅ Bug an der Source fixen (im Original-Layer wenn möglich)

❌ `display: none !important` als blanket-Regel auf Children
✅ Spezifische Elemente bei Namen ausblenden

❌ z-index in 5stellig oder höher
✅ Aus der Z-Ladder (siehe 2.4) wählen

❌ Hartcodierte Farb-Hex und Pixel-Werte
✅ Design-Tokens aus `:root`

❌ DB-Queries auf `display_name` (existiert nicht!)
✅ Erst Schema checken, dann querien

❌ `select().single()` direkt nach Insert mit komplexer RLS
✅ Insert separat, dann Select mit explizitem Filter

❌ Window-Funktionen ohne `bb`-Prefix
✅ Namespace-Konvention `window.bb<Feature>`

---

## 7. Compliance-by-Design Checkliste (für PRs)

Vor jedem neuen Feature:

**Privacy & DSGVO**
- [ ] Datenverarbeitung im Audit-Log eingetragen?
- [ ] User-Consent eingeholt (granular)?
- [ ] Min-Data-Prinzip (nur was nötig)?
- [ ] Auto-Expire definiert (TTL)?
- [ ] Right-to-Delete via UI machbar?
- [ ] EU-Server (Supabase Frankfurt, Sentry EU, PostHog EU)?

**Sicherheit**
- [ ] RLS-Policies auf neuen Tabellen?
- [ ] SECURITY DEFINER auf RPCs sinnvoll?
- [ ] Service-Role-Key NIEMALS im Client?
- [ ] CHECK-Constraints auf User-Input?

**Accessibility**
- [ ] ARIA-Labels?
- [ ] Keyboard-Navigation?
- [ ] Reduced-Motion respektiert?
- [ ] Mind. 4.5:1 Kontrast?
- [ ] Touch-Target ≥ 44×44px?

**Performance**
- [ ] Realtime-Channels werden cleanup'ed?
- [ ] LocalStorage-Limit (5MB) beachtet?
- [ ] Lazy-Load wo möglich?
- [ ] Bilder optimiert (WebP, Lazy)?

**Trauma-informed Design**
- [ ] Reversibel (Undo-Pattern statt Confirm-Dialog)?
- [ ] Predictable (3 klare Schritte)?
- [ ] Granular Consent (jede Setting einzeln)?
- [ ] Kein Fear-Mongering im Copy?
- [ ] Stealth-Option bei sensitive Aktionen?

---

## 8. Owner & Hand-Off

**App-Owner:** Jan Hundsdorff (yunghundse@gmail.com)
**Repo:** github.com/yunghundse/atze-pwa
**Live:** partycrew.app
**Backend:** Supabase Project `mzggdhowhyoytnvwtvpc` (eu-central-1)
**Edge Functions:** safety-cleanup, send-push, send-sms-verify
**Sentry:** butterbread-technologies/crew-app (EU)
**PostHog:** EU, Autocapture aus

**Migrations-Ansprechpartner:** dieser Doc + HANDOFF.md (v1.1)

---

**Version dieser Architektur-Datei:** 2.0 — 04.05.2026
**Nächster Sprint-Fokus:** Phase 2 (Layer-Reduktion)
