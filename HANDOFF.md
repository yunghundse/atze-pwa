# crew. — Handoff für ChatGPT (Design-Continuation)

**Stand:** 03.05.2026, ~90% des aktuellen Sprints fertig.
**Repo:** github.com/yunghundse/atze-pwa (main-Branch, GitHub Pages auto-deploy)
**Live:** https://partycrew.app
**Konzept:** Connection + Safety Network für Freundesgruppen — DSGVO-konform, kein Tracking, EU-Hosting (Supabase Frankfurt + Sentry EU + PostHog EU).

---

## 1. Was die App ist (Mai 2026)

**Pivot abgeschlossen:** Aus „Party-App für Festivals" wurde eine **Safety-Community-Plattform** mit 7 Audience-Profilen. Party bleibt drin — als _ein_ Use-Case unter mehreren, nicht als Hauptframe.

**Audience-Profile** (Profil bestimmt UI-Defaults, Sprache, Hotspot-Vorschläge):
1. `general` — Allgemein, Connection mit Freunden
2. `party` — Festival/Club/Events
3. `familie` — Eltern/Kinder/Geschwister
4. `solo` — alleine unterwegs (Heimweg, Reise, Joggen)
5. `pflege` — Eltern/Großeltern betreuen
6. `recovery` — Mental Health & Suchthilfe
7. `lgbtq` — Safe Spaces & Support

**Hotspot-Kinds** (6 Typen mit Default-Visibility):
- `safe` (öffentlich) — Krankenhaus, Polizei, Tankstelle 24/7
- `trust` (Crew-only) — Zuhause, Job, Stamm-Café
- `live` (Freunde, zeitlich) — Festival/Wanderung/Treffpunkt
- `watch` (öffentlich) — Vorsicht-Warnung der Community
- `party` (Freunde) — Club/Festival/Event
- `community` (Crew) — Verein/Recovery-Treff/Gruppe

**Visibility-Stufen:** `public` / `friends` (Safety-Circle) / `circle` (manuell eingeladen) / `private` (nur User).

**Kern-Features:**
- SOS mit Stealth-Mode (Auslöser optisch unsichtbar) + 6 Farben
- Safety-Circle (mutual Notfall-Kontakte)
- Live-Location (Web Push, 24h max TTL, granular Consent)
- Mood-System (10 Moods mit Custom-SVG-Icons, kein Emoji)
- Hotspots V2 (3-Schritt Wizard)
- Crew-Wall + Friends-Wall
- Heimweg-Modus (Bring-Home mit Push-Trigger bei Verspätung)
- Web Push (VAPID, EU-region)
- AGB v1.0.0 + Datenschutz v2.0.0 (versioniert, akzeptanzpflichtig)

---

## 2. Tech-Stack

**Frontend (Single-File):**
- `/Users/jan/Desktop/app/deploy/app.html` (~1.47 MB, ~7900+ Lines)
- Vanilla JS, kein Framework, alles inline `<style id="bb-X">` + `<script id="bb-X-js">`-Pattern
- Tailwind ist NICHT drin
- Leaflet via CDN für Map (CartoDB Dark-Tiles)
- Supabase JS-Client v2

**Backend:**
- Supabase Project: `mzggdhowhyoytnvwtvpc` (atze, eu-central-1, Frankfurt)
- Postgres 17 + Realtime + Storage + RLS überall
- Edge Functions (Deno): `safety-cleanup`, `send-push`, `send-sms-verify`
- pg_cron + pg_net für scheduled tasks

**Drittanbieter:**
- Sentry EU (Project: butterbread-technologies/crew-app, PII-Sanitizer aktiv)
- PostHog EU (Autocapture aus, manueller Capture)
- Web Push: VAPID (Private Key in Supabase Secrets)
- Twilio SMS (mock-mode standardmäßig, erst aktiv wenn Credentials gesetzt)

**Hosting:** GitHub Pages auf `partycrew.app` (CNAME), Deploy via `git push origin main`.

---

## 3. Layer-Stack: alle bb-* Module (Reihenfolge im app.html)

Jeder Layer wird über `<style id="bb-X">` + `<script id="bb-X-js">` direkt vor `</body>` injiziert. Patches werden als neue Layer hinzugefügt, nicht in alte gepatcht. **Reihenfolge ist wichtig** — späterer Layer überschreibt frühere CSS-Regeln durch Spezifität/!important.

| Layer | Zweck |
|---|---|
| `bb-protect` | Anti-Klau (Right-Click off, Selection off) |
| `bb-nav-bootstrap` | Bottom-Nav Init |
| `bb-pill-nav` | Tinder-Glass-Pill Bottom-Nav mit Drag |
| `bb-sos-v2` | SOS-Knopf rund + Hold-to-Confirm |
| `bb-safeplace` | SafePlace Hub |
| `bb-safety-v3` | Mutual Safety Circle + Magic Invite |
| `bb-mood-privacy` | Mood-System + Privacy-Hub |
| `bb-live-loc` | Live-Location-Modus |
| `bb-architecture` | Compliance V2 + saubere Architektur |
| `bb-compliance-ui` | Privacy-Pill im Header |
| `bb-legal` | AGB/Datenschutz/Cookies/Push-Consent |
| `bb-webpush` | VAPID-Web-Push Subscription |
| `bb-infra` | iOS-PWA-Banner + Sentry |
| `bb-sms-verify` | SMS-Verifizierung Notfall-Kontakte |
| `bb-features` | PostHog + Onboarding + Heimweg + CrewWall + MoodShare |
| `bb-hardening` | Limits + Email-Verify-Fallback |
| `bb-simplify` | Hub: 15 Sektionen → 3 + Settings-Modal |
| `bb-tinder` | SafePlace Tinder-Card-Design |
| `bb-bridge` | Radar ↔ SafePlace Bridge |
| `bb-spots` | Live-Spots-Map (V1) |
| `bb-refactor` | Nav-Refactor + Crew-Hub-Cleanup + Friends-Wall |
| `bb-radar-replace` | Alter Radar-Screen → SafePlace |
| `bb-iconfix` | Custom-SVG-Icons Bottom-Nav |
| `bb-polish` | Compliance-Pill + Profil-Tinder |
| `bb-final` | Standort-System Cleanup |
| `bb-noemoji` | 100% Emoji → SVG-Mask (10 Moods) |
| `bb-stealth` | SOS-Stealth-Mode + Color-Picker (6 Farben) |
| `bb-hotspot-v2` | Audience-Profile + 3-Schritt Wizard + 6 Kinds + 4 Visibility |
| **`bb-polish-v2`** | **Aktuell letzter Layer:** Z-Index-Ladder, Safe-Area, Anti-Overlap, Wall-Emoji-Kill |

**Wichtig für ChatGPT:** Wenn du am Design weiterarbeitest, **NICHT** die alten Layer ändern — füge einen neuen `bb-X-Y` Layer mit höherer Spezifität an. Das ist die etablierte Konvention.

---

## 4. Wichtige DB-Tabellen (Public Schema)

| Tabelle | Zweck |
|---|---|
| `profiles` | User-Profil + safety_sos_color/safety_sos_stealth + audience_profile |
| `sos_alerts` | SOS-Auslösungen mit Audit-Felder |
| `emergency_contacts` | Notfall-Kontakte mit Verifizierung |
| `safety_circle` | Mutual Safety Circle (status: pending/accepted/blocked) |
| `safety_checkins` | Periodische "Bin OK"-Check-ins |
| `user_moods` | Mood-Updates |
| `live_locations` | Live-Standort-Sharing (TTL, max 24h) |
| `safety_audit_log` | Append-only Audit für SOS/Standort/Push |
| `terms_versions` | AGB/DSE-Versionen (versioniert) |
| `user_terms_acceptance` | Wer hat welche Version akzeptiert |
| `push_consents` | Push-Subscriptions mit Consent-Audit |
| `app_config` | Feature-Flags |
| `friend_posts` | Friends-Wall-Posts |
| `crew_posts` | Crew-Wall-Posts |
| `hotspots` | Hotspots V2 (kind/vibe/audience/visibility/is_recurring) |
| `hotspot_members` | Wer ist in welchem Hotspot |
| `home_routes` | Heimweg-Tracking |
| `contact_reports` | Reports/Meldungen |

**RLS:** Alle Tabellen haben RLS aktiv. Owner = `auth.uid()`. Visibility-Filter sind in RPCs gekapselt (z.B. `get_visible_hotspots_v2`).

---

## 5. Was JETZT funktioniert (Stand 90%)

✅ Bottom-Nav: Tinder-Glass-Pill mit fest verankertem Anchor, Safe-Area-Inset
✅ Header: sticky top, z-index 1000
✅ SOS: Hold-to-Confirm + Stealth-Mode + 6 Farben
✅ Hotspot-Wizard: 3-Schritt Flow mit Kind/Visibility/TTL
✅ Audience-Profile: 7 Profile, Picker beim ersten Login
✅ Safety-Circle: Mutual Invite + Status
✅ Mood-System: 10 Moods als Custom-SVG (keine Emojis mehr)
✅ Web Push: VAPID + Subscription + Consent-Audit
✅ AGB v1.0.0 + DSE v2.0.0 + Akzeptanz-Pflicht
✅ Z-Index-Ladder konsistent
✅ Filter-Bar + FAB auf Map ohne Overlap
✅ Modal-Stack mit Escape-Key-Dismiss
✅ Crew-Wall/Friends/Posts: Emojis stripped via DOM-Walker

---

## 6. Wo wir hängen geblieben sind (offene 10%)

### A. Hotspot-Detail-Card noch nicht voll integriert
- **Problem:** Beim Klick auf einen Pin in der Map wird zwar das `bbCreateHotspot`-Wizard-Override gehookt, aber das `hd-modal` (Hotspot-Detail) ist als CSS vorbereitet, hat aber noch keinen JS-Hook der bei Pin-Click triggert.
- **Datei:** `app.html`, Layer `bb-hotspot-v2-js`
- **Was fehlt:** `function openHotspotDetail(hotspotId)` + Click-Handler auf `.hp-pin-marker` der dieses öffnet, lädt `get_visible_hotspots_v2` für Details, zeigt Mitglieder, "Ich bin auch hier"-Button.
- **Einfacher Weg:** Im `bb-hotspot-v2-js` einen weiteren `function openHotspotDetail(h)` schreiben + Pin-Click-Listener im Map-Layer registrieren.

### B. Audience-Banner Position kann variieren
- **Problem:** Der Banner wird mit `insertBefore(bn, hub.firstChild)` injiziert. Auf manchen Screens (Settings, Spots) erscheint er falsch.
- **Lösung:** Audience-Banner nur auf `#screen-hub` und `#screen-safety` rendern, mit Selektor `[data-screen="hub"], [data-screen="safety"]` filtern.

### C. Friends-Wall + Crew-Wall: Komplette Visual-Rework noch ausstehend
- **Problem:** Das Polish kümmert sich um Avatar-SVG + Card-Optik, aber die Wall hat noch kein Like/Reply/Share-System.
- **Was zu tun ist:**
  - Like-Button (Heart-SVG) per Post
  - Reply-Thread-Drawer
  - Mood-Filter oben in der Wall
  - Pinned-Posts (für Crew-Admins)

### D. Heimweg-Modus UI fehlt im Hub
- **Problem:** Der Heimweg-Modus existiert backend-seitig in `home_routes`, aber im Hub gibt es keinen direkten Einstieg mehr seit dem Simplify-Layer.
- **Lösung:** In `bb-polish-v2` oder neuem Layer einen Quick-Action „Heimweg starten" zur Smart-Hub-Tile-Reihe hinzufügen.

### E. Hotspot-Map: GPS-Permission-Re-Request
- **Problem:** Wenn User GPS einmal abgelehnt hat, gibt es keinen Re-Trigger außer Reload. Browser-Permission-API kann queryen aber nicht re-prompten — das ist eine Browser-Restriction.
- **UX-Lösung:** Wir zeigen aktuell „Erlaubnis in Browser-Einstellungen aktivieren" — könnte aber mit einem visuell besseren Empty-State + Anleitung (Screenshot der iOS/Android Permission-UI) verstärkt werden.

### F. PWA-Install-Banner auf Desktop
- **Problem:** Desktop-Chrome zeigt den `beforeinstallprompt` zwar, aber unsere UI fängt ihn nicht. Auf iOS funktioniert nur der `add-to-homescreen`-Banner.
- **Lösung:** In `bb-infra-js` den `beforeinstallprompt`-Event-Handler ausbauen.

### G. Welcome-Tour: Audience-Profile-Selection beim Erstauflauf
- **Problem:** Audience-Picker wird nach 5 Sekunden gezeigt für neue User — sollte besser direkt nach Onboarding-Tour erscheinen, nicht parallel.
- **Lösung:** Tour-Completion-Event abwarten, dann Audience-Picker.

### H. Settings-Modal: Tabs sind eng auf kleinen Screens
- **Problem:** Auf 360px-Geräten passen die 4-5 Tabs nicht in eine Reihe — sind zwar scrollbar, aber UX könnte besser sein.
- **Lösung:** Tabs als 2-Reihen-Grid auf Width < 380px statt horizontal-scroll.

### I. Realtime-Subscription für Hotspots fehlt
- **Problem:** Wenn ein Freund einen neuen Spot anlegt, sieht User es erst nach Reload.
- **Lösung:** `sb.channel('hotspots-' + uid).on('postgres_changes', ..., callback).subscribe()` im `bb-spots`-Layer aktivieren.

---

## 7. Code-Konventionen (bitte einhalten)

1. **Neuer Layer = neuer Style/Script-Block**, kein Patch in vorhandene Blöcke.
2. **Naming:** `bb-<thema>-<version>` z.B. `bb-wall-likes-v1`
3. **CSS-Spezifität:** `!important` ist erlaubt (es ist das Pattern), aber nur wenn nötig. Lieber Selektor-Kette spezifischer machen.
4. **JS:** IIFE + `if (window.__bbXInit) return;` Guard. Keine globalen Pollutionen außer auf `window.bbX`.
5. **Keine Emojis** in UI-Strings. Nur Custom-SVG-Mask-Icons. Liste der erlaubten Icons: bb-noemoji-Layer.
6. **DSGVO:** Jede neue PII-Verarbeitung braucht Consent-Check + Audit-Log-Eintrag.
7. **Backups:** Vor großen Edits in `app.html` immer `cp app.html _backup-YYYY-MM-DD-HHMM-pre-X.app.html.bak`.
8. **Deploy:** Manuell via `git add app.html && git commit -m "feat(X): ..." && git push origin main`. Kein CI.

---

## 8. Test-User & Daten

- **Owner-User:** Jan Hundsdorff (yunghundse@gmail.com)
- **Waitlist-User:** ~14 Personen aus partycrew.app — NIEMALS löschen
- **Twilio:** noch nicht aktiv, läuft im Mock-Mode
- **Sentry:** Project `crew-app` aktiv, EU
- **PostHog:** EU, Autocapture deaktiviert

---

## 9. Empfohlene nächste Sprints (Priorität)

**Sprint 11 — Wall-Engagement (1-2 Tage):**
- Like-Button per Post
- Reply-Threads
- Pinned-Posts
- Mood-Filter

**Sprint 12 — Hotspot-Realtime + Detail (1 Tag):**
- Realtime-Subscription für Hotspots
- Detail-Card bei Pin-Click
- "Ich bin auch hier"-Funktion

**Sprint 13 — Heimweg-Hub-Integration (0.5 Tag):**
- Quick-Action im Hub
- Heimweg-Status-Pill im Header während aktiv

**Sprint 14 — PWA-Polish (1 Tag):**
- Desktop-Install-Banner
- Offline-Mode für SOS (Service-Worker-Cache)
- Web-Share-API für Hotspot-Einladungen

**Sprint 15 — Compliance-Audit (0.5 Tag):**
- Externe DSGVO-Audit-Checkliste durchgehen
- Cookie-Consent-Modal-Recheck
- Datenexport-Button testen (RPC `export_user_data`)

---

## 10. Kontakt / Übergabe

- **Repo-Owner:** yunghundse / Jan Hundsdorff
- **Email:** info@butterbread-tech.com
- **GitHub:** @yunghundse
- **Wichtigste Files:**
  - `/deploy/app.html` — die ganze App
  - `/deploy/sw.js` — Service Worker mit Push
  - `/deploy/manifest.json` — PWA Manifest
  - `/deploy/datenschutz.html`, `/deploy/agb.html`, `/deploy/impressum.html`, `/deploy/kontakt.html` — Legal-Pages

---

**Version dieser Handoff-Datei:** 1.0 — 03.05.2026
