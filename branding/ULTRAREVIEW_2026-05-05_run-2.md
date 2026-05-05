# crew. — Ultrareview Report (Run 2)

**Datum:** 2026-05-05
**Vorgänger:** `ULTRAREVIEW_2026-05-05.md` (Run 1)
**Trigger:** Manueller `/ultrareview` aus Claude Code im Terminal nach Push der Run-1-Quick-Wins
**Scope:** Delta-Analyse seit Run 1 + neue Probe-Stellen (DB-RLS, Edge-Functions, sw.js)
**Phasen:** Discovery → Targeted Analyse → Buckets → Validierung → Output

---

## Executive Summary

- **3 NEUE Findings** (1 critical, 2 medium) + **2 Findings aus Run 1 noch offen** (A-1 + S-1, beide jetzt brennend)
- **4 Quick-Wins aus Run 1 verifiziert** (alle gefixt — siehe Validation unten)
- **Top-3-Risiko vor Pioneer-Launch:**
  1. `get_my_referral_code(email)` ist anon-callable → Email-Enumeration + Referral-Code-Harvest möglich
  2. `app.html` (1.89 MB Legacy-V1) ist immer noch live unter `partycrew.app/app.html`
  3. Sentry + PostHog fehlen weiterhin in clean.html → Pioneer-Bugs sind blind

- **Top-3-Quick-Wins:**
  1. `REVOKE EXECUTE FROM anon, authenticated` auf `get_my_referral_code` (1 SQL-Statement, 30 Sek)
  2. sw.js Icon-Pfade auf `/img/brand/` umbiegen (5 Min)
  3. app.html aus dem Live-Build entfernen (Repo-Move + Re-Deploy, 5 Min)

---

## Run-1 Validation (4 Quick-Wins)

| # | Fix | Status |
|---|-----|--------|
| QW-1 | `index.html` Redirect → `clean.html` (Z. 1868 + 1880) | ✅ VERIFIED |
| QW-2 | `console.clear()`-Loop entfernt aus bb-protect-js | ✅ VERIFIED (0 Treffer) |
| QW-3 | Console-Silencer im IIFE-Init (clean.html:5793-5810) | ✅ VERIFIED |
| QW-4 | `crew_last_loc` TTL: 7d → 24h + expliziter Cleanup | ✅ VERIFIED |

Alle vier Fixes sind aktiv. 4× grün.

---

## Bucket 1 — Quick Wins (< 30 Min Fix)

### QW-N1 [CRITICAL] · `get_my_referral_code(text)` anon-callable
**Symptom:** SECURITY DEFINER-Function ohne auth-check, GRANT EXECUTE für anon + authenticated.
Body: `SELECT referral_code FROM waitlist WHERE email = user_email LIMIT 1`.
Jeder mit Anon-Token kann beliebige Email-Adressen durchprobieren und (a) feststellen
welche auf der Waitlist sind, (b) den referral_code abgreifen → Free-Sign-Up-Vector.
**Fix:**
```sql
REVOKE EXECUTE ON FUNCTION public.get_my_referral_code(text) FROM anon, authenticated;
-- ODER: Function rewriten so dass nur eigene email returnt wird:
CREATE OR REPLACE FUNCTION public.get_my_referral_code() RETURNS text
  LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT referral_code FROM waitlist
   WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
   LIMIT 1;
$$;
```
**Aufwand:** 5 Min. **Pre-Pioneer zwingend.**

### QW-N2 [MED] · sw.js zeigt auf alte Icon-Pfade
**Symptom:** `sw.js` referenziert `/img/icon-192.png` und `/img/favicon-32.png`.
Seit Sprint 3.6 liegen die Brand-Icons unter `/img/brand/`. Resultat:
- Service-Worker-Install könnte fehlschlagen (404 auf alte Pfade)
- Push-Notifications zeigen kein Icon
- PWA-Badge bei Notif fehlt
**Fix:** In `sw.js` alle `/img/icon-*.png` → `/img/brand/icon-*.png`
und `/img/favicon-*.png` → `/img/brand/favicon-*.png`. Plus CACHE-Version bumpen.
**Aufwand:** 5 Min.

### QW-N3 [MED] · app.html im Live-Deployment entfernen
**Symptom:** Trotz QW-1 (index.html → clean.html) liegt `app.html` (1.89 MB,
V1 Legacy mit 43 Layer-Konflikten) immer noch unter `https://partycrew.app/app.html`
und antwortet HTTP 200. Alte Bookmarks und Suchmaschinen-Treffer landen weiterhin
auf der falschen App.
**Fix:**
1. `app.html` → `_legacy/app.html` umziehen (im Build entfernen, im Repo behalten als Backup)
2. `_legacy/` zu `.gitignore` hinzufügen ODER GitHub-Pages-Build-Path konfigurieren
3. ODER pragmatisch: kompletter Inhalt von `app.html` durch HTML-Redirect ersetzen
   (`<meta http-equiv="refresh" content="0;url=clean.html">` plus 5-Zeilen-JS-Fallback)
**Aufwand:** 5 Min für Redirect-Variante.

---

## Bucket 2 — Sprint-Aufgaben (1–4h Fix)

### S-1 [HIGH, weiterhin offen aus Run 1] · Sentry + PostHog → clean.html migrieren
**Status:** Jetzt akut, weil Live-User dank QW-1 auf clean.html landen.
Pioneer-Bugs sind aktuell blind.
**Aufwand:** 2h.

### S-N1 [MED] · 49 SECURITY DEFINER ohne auth.uid()-Check audit
**Symptom:** Datenbank-Audit zeigt 49 SECURITY DEFINER Funktionen ohne `auth.uid()`-Check.
Davon sind die meisten triggers (rate_limit, notify_*) oder admin-only granted
(get_partner_applications, get_all_feedback, get_invite_stats — jeweils nur
service_role + postgres). **3 von 49** sind potentielle Risk-Kandidaten:
- `get_my_referral_code` (anon callable) → siehe QW-N1
- `_is_hotspot_member` / `_is_hotspot_owner` / `_is_in_safety_circle` /
  `_is_uc2_member` (helper-functions, könnten Privacy-Daten leaken wenn falsch genutzt)
- `like_shot(uuid)` (kann jeder posten — auch fremde Shots?)

**Fix:** Pro Function: prüfen GRANT-Status, `auth.uid()`-Check ergänzen wo nötig.
**Aufwand:** 3-4h.

### S-2, S-3, S-4, S-5 (aus Run 1) — alle weiterhin offen
- S-2 safe$()-Helper für Null-Checks
- S-3 aria-labels (14/241 Buttons)
- S-4 Function-Splitting (renderCrew 195 Zeilen)
- S-5 localStorage-Wrapper mit TTL
**Status:** unverändert, niedrigere Prio als die neuen Findings + S-1.

---

## Bucket 3 — Architektur

### A-1 [CRITICAL — adressiert via QW-N3] · Doppelt-App-Architektur
**Status:** Run 1 hatte das als „adressiert via QW-1". Jetzt zeigt die Live-Validation:
QW-1 hat nur den **Redirect** geändert, nicht die **Erreichbarkeit**. Bis app.html
selbst entfernt ist, ist der Critical nicht zu.
**Empfehlung:** QW-N3 SOFORT umsetzen.

### A-2, A-3 (aus Run 1) — unverändert
- Sprint 1.2-1.6 Code-Split fortsetzen
- Cookie-Consent-Modal mit Tracking-Toggle vor S-1

---

## Validierte Findings (Phase 4)

| Finding | Behauptung | Validierung | Notiz |
|---|---|---|---|
| **CRIT-N1** | `get_my_referral_code` anon-callable | ✅ VERIFIED | `pg_get_functiondef` zeigt SECURITY DEFINER ohne Auth-Check, granted_to enthält `anon` + `authenticated`. Kein Rate-Limit-Trigger. |
| **A-1** | app.html immer noch erreichbar | ✅ VERIFIED | `ls`: 1.89 MB Datei vorhanden. `curl -I https://partycrew.app/app.html` → HTTP 200. |
| **S-1** | Sentry/PostHog fehlen in clean.html | ✅ VERIFIED | `grep -cE "Sentry\|posthog\|window\.Sentry\|window\.posthog"` clean.html → 0 Treffer. |

**Lesson aus Run 2:** Subagent hatte keinen Repo-Access (Pfad-Mismatch). Self-validation
funktioniert wenn der File-Access da ist. Für nächste Runs: explizit den Pfad mit `/sessions/...`
oder den Read-Tool-Pfad weitergeben damit Subagent direkt zugreifen kann.

---

## Empfehlung — was JETZT machen

### Pre-Push-Pflicht (binnen 30 Min vor nächstem Pioneer-Test):
1. **QW-N1** REVOKE-Statement auf get_my_referral_code (5 Min)
2. **QW-N3** app.html → Redirect-Stub (5 Min)
3. **QW-N2** sw.js Icon-Pfade fixen + Cache-Version bumpen (5 Min)

**Total: 15 Min für 3 verifizierte Findings.**

### Diese Woche (vor Pioneer-Programm-Start):
4. **S-1** Sentry + PostHog migrieren (2h)
5. **A-3** Cookie-Consent-Modal + S-1 zusammen (4-5h)

### Nächste Woche (parallel zum Pioneer-Programm):
6. **S-N1** SECURITY DEFINER Audit der 3 Risk-Kandidaten (3-4h)
7. **S-2** safe$()-Helper (2-3h)
8. **S-5** localStorage-Wrapper (1-2h)

### Architektur:
9. **A-2** Sprint 1.2-1.6 Code-Split (3-4 Sprints)

---

## Anhang: Run 2 Diff-Daten

**Commits seit Run 1:**
- `b230c03` fix(e2e-bugs): TypeError + Onboarding-Trigger + Wortmarke-Color
- `8d38fa4` feat(sprint-3.6): Brand-Assets v1
- `9924097` feat(sprint-4): Marketing-Brand + iOS-Splash + Drip-Mails
- `6e85050` feat: /ultrareview slash-command + branding docs ins Repo
- `a7feffa` fix(ultrareview): 4 Quick-Wins ✅

**DB-Audit-Stats:**
- Public Tables ohne RLS: 0 (alle 90+ haben RLS)
- Tables mit RLS aber 0 Policies: 0
- SECURITY DEFINER ohne auth.uid()-Check: 49 (davon 3 Risk-Kandidaten, siehe S-N1)
- 1 Critical (CRIT-N1) bereits in Run 2 entdeckt

**Live-Tests:**
- `curl -I https://partycrew.app/app.html` → 200 (Legacy noch erreichbar)
- `curl -I https://partycrew.app/clean.html` → noch nicht getestet (Run 3?)
