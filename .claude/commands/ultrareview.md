---
description: Tiefe Multi-Pass-Code-Analyse mit Plan + Selbst-Validierung
argument-hint: [optional Pfad(e) oder Fokus, z.B. "deploy/clean.html" oder "Trust-Layer Sprint 2"]
allowed-tools: Read, Grep, Glob, Bash, Agent, TaskCreate, TaskUpdate, Write
---

# Ultrareview — crew. App

Du führst jetzt einen **Ultrareview** über die Codebase aus. Das ist
KEIN normaler Chat-Antwort, sondern ein autonomer Multi-Phasen-Review
der mehrere Minuten dauern darf.

## Scope

User-Argument (kann leer sein): **$ARGUMENTS**

- Wenn leer → ganzes Repo (Schwerpunkt `deploy/clean.html`, `deploy/src/*`,
  `deploy/manifest.json`, `deploy/index.html`, `deploy/sw.js`)
- Wenn Pfad(e) → genau diese Dateien
- Wenn Fokus-Text → semantisch passende Bereiche identifizieren und
  fokussieren (z.B. „Auth" → Auth-Code in clean.html + Trigger in DB)

## Stack-Kontext (musst du wissen, ist kein Standard-Stack)

- **Frontend:** Single-File HTML (`deploy/clean.html`, ~10k Zeilen) mit
  IIFE-Inline-JS. Sprint-1.1 hat Konstanten in `deploy/src/*.js`
  ausgelagert (utils/fx/hsfx/moods/trust). Vanilla JS — kein React/Svelte.
- **Backend:** Supabase (Postgres + Auth + Realtime + Storage + Edge
  Functions). Project ID `mzggdhowhyoytnvwtvpc`.
- **Karten:** Leaflet 1.9.4 + markercluster + heat
- **Push:** VAPID + Service-Worker (`sw.js`)
- **Hosting:** GitHub-Pages auf `partycrew.app`
- **Status:** Pre-Pioneer-Launch. Sprint 1–4 abgeschlossen.

## Phasen (in dieser Reihenfolge ausführen)

### Phase 1 — Discovery (5–10 Min)

1. Lege eine TodoList für die fünf Phasen an.
2. Lies die Bestandsaufnahme:
   - `deploy/ARCHITECTURE.md` (falls vorhanden)
   - `deploy/HANDOFF.md` (Sprint-Historie)
   - `branding/01_BRAND_MANIFESTO.md` für Produkt-Werte
3. Liste die Top-10-Files nach Größe + die Module aus `src/` auf.
4. Bei Scope = Repo: Gib eine 5-Bullet-Architektur-Zusammenfassung.

### Phase 2 — Analyse (15–30 Min)

Geh durch die folgenden Kategorien. Pro Finding: **Kategorie · Schwere
(crit/high/med/low) · Datei:Zeile · Symptom · Root Cause · Fix-Idee**.

**A. Sicherheit**
- RLS-Lücken: Welche `public.*` Tabellen haben kein RLS oder zu offene Policies?
- SECURITY DEFINER Funktionen: Suchen die Service-Role-Daten ohne `auth.uid()`-Check ab?
- XSS: `innerHTML`-Stellen mit User-Daten ohne `esc()`?
- Open-Redirects: `location.href = ...` mit ungeprüftem Input?
- API-Key-Leaks: Hardcodierte Secrets in JS oder HTML?
- Email-Verify-Bypass: Kann User signed-in sein ohne `email_confirmed_at`?
- Rate-Limiting: Welche RPCs haben kein Rate-Limit (rein über DB-Triggers)?

**B. Performance**
- N+1-Queries: Sequential `await sb.from(...)` in Loops?
- Realtime-Channel-Leaks: Channels die nicht mit `removeChannel()` aufgeräumt werden?
- Map-Marker-Leaks: Leaflet-Marker ohne `removeLayer()`?
- Re-Renders: Funktionen die bei jedem State-Change die ganze Liste neu rendern?
- Image-Bundling: Welche Hotspot-Images werden ohne `loading="lazy"` geladen?
- Bundle-Size: clean.html ist 10k+ Zeilen — was sind die fettesten Sektionen?

**C. Korrektheit / Logik**
- Race Conditions: Async-Calls die State-Reihenfolge brechen können?
- Null-Checks: `$('xyz')` ohne `if`-Check (siehe Bug-Fix Sprint 4)?
- Dead Code: Funktionen die nie aufgerufen werden?
- Duplicated Logic: Gleiches Verhalten an >2 Stellen implementiert?
- Off-by-One: Pagination, Limits, Indices?

**D. UX / Accessibility**
- Keyboard-Nav: Modals ohne Escape-to-close, Bottom-Sheets ohne Tab-Trap?
- Color-Contrast: Texte unter WCAG AA?
- Mobile-Tap-Targets: Buttons unter 44×44px?
- Loading-States: RPCs ohne Spinner/Skeleton?
- Error-States: Fehler ohne User-Feedback?

**E. DSGVO / Privacy**
- Daten die in localStorage liegen ohne Auto-Expire?
- Tracking ohne Consent (Sentry, PostHog)?
- Standort-Daten die persistent statt session-only sind?
- Email-Adressen die im Frontend exposed werden?

**F. Code-Hygiene**
- Auskommentierte Code-Blöcke > 5 Zeilen?
- Console.log-Statements?
- Magic-Numbers ohne Konstante?
- Funktionen > 100 Zeilen?
- Files > 1000 Zeilen die hätten gesplittet werden müssen?

### Phase 3 — Planung (5–10 Min)

Sortiere alle Findings in drei Buckets:

**Bucket 1 — Quick Wins (< 30 Min Fix, hoher Impact)**
**Bucket 2 — Sprint-Aufgaben (1–4 Std Fix oder mittlere Komplexität)**
**Bucket 3 — Architektur (> 1 Tag, fundamentale Änderungen)**

Pro Bucket: Top-5-Findings mit Begründung „warum genau das, warum jetzt".

### Phase 4 — Selbst-Validierung (5–10 Min)

Bevor du den Report rausgibst:

1. Spawne einen `general-purpose`-Subagenten via Agent-Tool mit dem
   Auftrag: „Lies diesen Report und prüfe für die TOP 3 Critical-
   Findings ob die Root Cause stimmt. Gib mir Verify/Reject + Begründung
   pro Finding zurück. Halte unter 300 Wörter."
2. Falls der Subagent ein Finding rejected: Markiere es als „[VALIDATION
   REJECTED]" und entferne es aus dem Quick-Wins-Bucket (oder fix die
   Root-Cause-Beschreibung).
3. Falls etwas neu auffällt: ergänze.

### Phase 5 — Output

Liefere einen Bericht im folgenden Format:

```markdown
# crew. — Ultrareview Report (TIMESTAMP)

## Executive Summary (5 Zeilen)
- N Findings total · X critical · Y high · Z medium
- Top-3-Risiken vor Pioneer-Launch
- Top-3-Quick-Wins

## Bucket 1 — Quick Wins (< 30 Min)
[Liste mit ~5 Items, jeweils Datei:Zeile + Fix-Diff oder Pseudo-Code]

## Bucket 2 — Sprint-Aufgaben
[Liste mit ~5 Items, jeweils Aufwand-Schätzung]

## Bucket 3 — Architektur-Themen
[Liste mit 1–3 Items, jeweils ADR-würdig]

## Validierte Findings (Phase 4)
[Top-3 vom Subagent geprüft, Verify/Reject + Begründung]

## Empfehlung
- Was JETZT machen, was wann später
```

## Hard Rules

- **Schreibe keinen Code.** Du machst Analyse + Plan, kein Fix.
  (Der User entscheidet was umgesetzt wird.)
- **Keine Halbwahrheiten.** Findings IMMER mit Datei:Zeile, sonst weglassen.
- **Speichere den Report.** Final-Output zusätzlich nach
  `branding/ULTRAREVIEW_<YYYY-MM-DD>.md` schreiben.
- **Tasks anlegen.** Für jeden Quick-Win automatisch ein TaskCreate mit
  Schwere als Tag.
- **Stop-Conditions:**
  - Wenn nach 30 Minuten keine kritischen Findings → früher abschließen
  - Wenn der Codebase-Scope unklar → User in einer Frage klären, dann erst weiter
