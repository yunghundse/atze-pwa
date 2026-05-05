# crew. — Ultrareview Report

**Datum:** 2026-05-05
**Scope:** ganzes Repo, Schwerpunkt `deploy/clean.html`, `deploy/src/*`, `deploy/index.html`
**Phasen:** Discovery → Analyse (6 Kategorien) → Planung → Validierung mit Subagent → Output

---

## Executive Summary

- **9 Findings:** 1 critical, 2 high, 4 medium, 2 low
- **Top-3-Risiko vor Pioneer-Launch:** (1) Live-User landen auf der Legacy-V1-App.html nicht auf der V2-clean.html, (2) keine Stock-Photo-Hash-DB für Spot-Photos (Phase 2 schon gefunden), (3) Top-Funktionen mit 100+ Zeilen werden bei jedem Bug-Fix riskanter
- **Top-3-Quick-Wins:** (1) `index.html` Redirect umbiegen auf `clean.html`, (2) console-Statements gaten oder raus, (3) localStorage-TTL für `crew_last_loc` (Standort-Persistenz)

---

## Bucket 1 — Quick Wins (< 30 Min Fix)

### QW-1 [CRITICAL] · `index.html:1868` + `:1880` — Redirect auf Legacy-app.html
**Symptom:** Nach Login redirected `index.html` mit `window.location.href='app.html'`.
`app.html` = 1.67 MB Legacy-V1 mit 43 bb-Layer-Konflikten und 1.331 `!important`-Spam.
`clean.html` = 456 KB saubere V2-Baseline.
**Live-User landen auf der ALTEN App.** Bestätigt durch Subagent (siehe Phase 4).
**Fix:** Beide `app.html` durch `clean.html` ersetzen. 5 Min.

### QW-2 [LOW] · `index.html` Anti-Copy-Guard mit `console.clear()` Loop
**Symptom:** `setInterval(()=>console.clear(),1500)` — clear console alle 1.5s.
Konsequenz: Wenn ein Pioneer einen Bug hat und Devtools öffnet, sieht er nichts.
**Fix:** `setInterval`-Block aus dem `bb-protect-js` rausnehmen. Anti-Copy-Schutz für Text bleibt.
5 Min.

### QW-3 [MEDIUM] · `clean.html` 20× console.log/warn/error in Production
**Symptom:** 20 ungeschützte `console.*` Statements im production-Code.
Zwei Probleme: leakt interne State-Daten (Pioneers könnten DB-IDs/User-IDs sehen),
plus Performance bei vielen Logs in Loops.
**Fix:** Globaler Wrapper `const log = DEBUG ? console.log : ()=>{}` und alle ersetzen.
Oder: alle `console.*` mit `if (window.DEBUG)` gaten.
20 Min.

### QW-4 [MEDIUM] · `clean.html` localStorage `crew_last_loc` ohne TTL
**Symptom:** GPS-Standort wird beim ersten Login gespeichert (`{lat,lng,source,t:Date.now()}`)
und nie automatisch invalidiert. DSGVO-Standpunkt: Standortdaten sollten nicht
unbegrenzt persistieren.
**Fix:** Bei jedem Read prüfen `if (Date.now() - parsed.t > 86400_000) localStorage.removeItem(...)`.
TTL = 24h. 15 Min.

### QW-5 [LOW] · `app.html` 1.67 MB Legacy-Code im Repo
**Symptom:** Liegt im Live-Deployment, aber wird (nach QW-1) nicht mehr gebraucht.
1.67 MB unnützer Bandbreite-Konsum für jeden GitHub-Pages-Build.
**Fix:** Nach QW-1 (Redirect umbiegen) und 7 Tagen Stabilitäts-Beobachtung →
`app.html` und alle `_backup-*.bak` löschen. ~67 MB Repo-Kosmetik.
5 Min Action, 7 Tage Wartezeit.

---

## Bucket 2 — Sprint-Aufgaben (1–4h Fix)

### S-1 [HIGH] · Sentry + PostHog in `clean.html` migrieren
**Status nach Validierung:** Sentry + PostHog laufen in der **alten** `app.html` (Sprint 26+35),
sind aber in der **neuen** `clean.html` nicht migriert. Wenn QW-1 umgesetzt wird
(Redirect zu clean.html), verlieren wir Error-Tracking und User-Analytics.
**Fix:** DSN aus `app.html:3291` und PostHog-Init aus `app.html:4032-4055`
in `clean.html` `<head>` einbauen. Plus: Consent-Check (DSGVO).
**Aufwand:** 2h.

### S-2 [HIGH] · 250 unsafe `$('xxx').foo` ohne Null-Check
**Symptom:** Aktuell sind alle 250 Element-Zugriffe valid, weil die HTML-IDs
existieren. Aber: Bei jedem Refactor wo eine ID umbenannt wird, crasht die ganze
Init (gerade eben in Sprint G passiert mit `setShareLoc` → `setShareLive`).
**Fix:** Helper `safe$(id)` der `null` returnt und Null-Check intrinsiert.
Refactor aller 250 Stellen via Codemod.
**Aufwand:** 2-3h.

### S-3 [MEDIUM] · 14 von 241 Buttons mit aria-label (5.8%)
**Symptom:** Screen-Reader-User können 94% der Buttons nicht semantisch erfassen.
Pre-Pioneer-Launch ist das hinnehmbar, aber für DSGVO-Audits / Behinderten-Inclusion
relevant.
**Fix:** Top-50 unbeschriftete Buttons (Bottom-Nav, SOS, Toggle-Switches) bekommen
`aria-label`. Restliche via SVG `<title>` oder Text-Content.
**Aufwand:** 2h.

### S-4 [MEDIUM] · `renderCrew()` 195 Zeilen, 5 Funktionen >80 Zeilen
**Symptom:** `renderCrew()` (line 7675) ist zu groß zum sicheren Refactor.
Plus: `onAuth()` 145 Zeilen, `openHotspotDetail()` 131, `renderCircleTree()` 126.
**Fix:** Pro Funktion in 3-4 Sub-Helpers splitten (renderCrewHeader, renderCrewMembers,
renderCrewLive, etc.). Sprint-1.x Code-Split.
**Aufwand:** 4-6h.

### S-5 [MEDIUM] · localStorage-TTL für ALLE 8 crew-* Keys
**Symptom:** Erweiterung von QW-4: `crew-home`, `crew-home-eta`, `crew-home-note`,
`crew-live`, `crew-theme`, `crew_last_loc`, `crew_onboard_skipped`, `crew-ios-dismissed`
haben kein TTL. Speziell `crew-home-eta` und `crew-live` sollten Session-only sein.
**Fix:** Wrapper `lsSet(key, value, ttlMs)` und `lsGet(key)` mit Auto-Expire.
**Aufwand:** 1-2h.

---

## Bucket 3 — Architektur-Themen

### A-1 [CRITICAL — adressiert via QW-1] · Doppelt-App-Architektur app.html / clean.html
**Symptom:** Repo enthält zwei vollständige App-Versionen die gleichzeitig deployed sind.
`app.html` = V1 mit Layer-Konflikten, `clean.html` = V2-Baseline. Plus 30+ Backup-Files
mit `_backup-2026-*.bak` (insgesamt ~67 MB).
**Empfehlung:** Nach QW-1-Fix:
1. 7 Tage Live-Test mit clean.html
2. Wenn stabil → app.html und alle .bak-Files löschen
3. Sprint 1.2-1.5 Code-Split fortsetzen damit clean.html nicht bei 10k Zeilen bleibt
**Aufwand:** 30 Min Cleanup + Sprint 1.x parallel.

### A-2 [MEDIUM] · clean.html bei 10.584 Zeilen — Code-Split-Strategie
**Symptom:** Trotz Sprint 1.1 (5 Module ausgelagert) ist clean.html immer noch eine
einzelne 456-KB-Datei mit ~95% Inline-Code.
**Empfehlung ADR:** Sprint 1.2 (Auth+Toast) → 1.3 (Home+Feed) → 1.4 (Crew+DM) →
1.5 (Hotspots+Map) → 1.6 (Profile+Settings). Pro Sub-Sprint ~1k Zeilen raus,
am Ende clean.html nur noch HTML + 1k JS für init.
**Aufwand:** 3-4 Sprints, ~15-20h Total.

### A-3 [MEDIUM] · Tracking + Consent-Architektur
**Symptom:** Wenn S-1 (Sentry+PostHog Migration) umgesetzt wird, brauchen wir
DSGVO-Consent-Flow VOR dem Init. Aktuell hatten wir Cookie-Consent in app.html
(Sprint 23) — der muss auch nach clean.html.
**Empfehlung ADR:** Pre-Init-Consent-Modal mit drei Toggles (Sentry / PostHog /
optional 3rd party). Default off. Nach Klick wird Init geladen.
**Aufwand:** 4-5h, kombinierbar mit S-1.

---

## Validierte Findings (Phase 4 mit Subagent)

| Finding | Behauptung | Validierung | Notiz |
|---|---|---|---|
| **A1.1** | index.html → app.html | ✅ VERIFIED | Bestätigt durch ARCHITECTURE.md + HANDOFF.md, Live-Live-Code vorhanden in Z. 1868 + 1880 |
| **B1.1** | Sentry/PostHog fehlen in clean.html | ❌ REJECTED | Beide laufen in app.html (Z. 3291 ff. und 4032-4055). Aber: weil app.html der aktive Endpoint ist, ist das eigentlich heute korrekt. Wird nach QW-1 zu S-1 |
| **C1.1** | Modals ohne Escape-to-close | ❌ REJECTED | Globaler Listener in clean.html Z. 9748-9751 schließt das oberste Modal. Mein Grep war fehlerhaft (Shell-Quoting). |

**Lesson:** Subagent hat zwei false-positives entdeckt. Nicht alles was nicht
direkt grepbar ist, fehlt. Vor Reports immer kritisch gegenprüfen.

---

## Empfehlung — Was JETZT machen, was später

### Diese Woche (vor Pioneer-Launch):
1. **QW-1** Redirect umbiegen (5 Min) — sonst sehen Pioniere die alte App
2. **QW-3** Console-Statements gaten (20 Min) — keine Daten-Leaks im Devtools
3. **QW-4** Standort-TTL (15 Min) — DSGVO-Hygiene
4. **QW-2** Anti-Copy `console.clear()` raus (5 Min) — debugbarer für Bug-Reports

**Total: 45 Minuten Aufwand für 3 Schweregrade.**

### Innerhalb Sprint 4 (vor Stuttgart-Pioneer-Programm):
5. **S-1** Sentry + PostHog in clean.html (2h) — sonst sind Pioneer-Bugs blind
6. **S-5** localStorage-TTL für alle Keys (1-2h) — DSGVO-Argument

### Nach Pioneer-Launch (im Hintergrund):
7. **S-2** safe$()-Helper (2-3h) — verhindert Sprint-G-Style-Bugs
8. **S-3** aria-labels Top-50 (2h) — Inclusion + audit-readiness
9. **S-4** Funktionen splitten (4-6h) — Maintainability
10. **A-1** Legacy app.html löschen nach 7 Tagen Stabilität
11. **A-2** Sprint 1.2-1.6 Code-Split fortsetzen
12. **A-3** Cookie-Consent-Modal vor Tracking-Init

### Niemals:
- Anti-Copy-Guard wieder aufdrehen (Z.1880 ff. in index.html). User-feindlich.

---

## Anhang: Discovery-Daten

**Codebase-Größe (Top-15 nach Zeilen):**
- `app.html` 20.895 (Legacy V1, 1.67 MB)
- `clean.html` 10.584 (V2 Baseline, 456 KB)
- `index.html` 1.886 (Marketing-Landing)
- `datenschutz.html` 411
- `beta.html` 403
- `supabase-schema.sql` 383
- `kontakt.html` 341
- `agb.html` 268
- `src/trust.js` 265 (Sprint 2)
- `src/hsfx.js` 122 (Sprint 1.1)
- `src/fx.js` 77
- `sw.js` 60

**Module-Inventar (`deploy/src/`):**
- `utils.js` (54 Zeilen) — `$`, `$$`, `esc`, `initials`, `timeAgo`, `haversine`
- `fx.js` (77) — FX_BASE + 50 Fluent-3D-Emoji-URLs
- `hsfx.js` (122) — HS_KIND_FX, HS_SUB_FX, hsFx, hsLabel, hsLabelHtml, hsShortCode, emo3d
- `moods.js` (26) — MOODS-Array (8 Stimmungen)
- `trust.js` (265) — Report+Block+Suspend-UI

**Backend-Status:**
- DB: 16.871 Hotspots geseedet, RLS überall an, 11 Trust-Layer-RPCs, Email-Verify-Trigger,
  Strike-System, Drip-Email-View
- Edge-Functions: `send_drip_emails` (deployed Sprint 4.4)
- pg_cron: `drip-emails-daily` aktiv täglich 12 UTC

**Brand-Assets-Status (Sprint 3.6):**
- 26 Files in `img/brand/` integriert (Logo SVGs, App-Icons iOS/Android, 13 Splash-Auflösungen,
  Favicon-Set, OG-Card, Header-Lockups)
