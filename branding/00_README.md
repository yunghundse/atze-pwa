# crew. — Branding-Ordner (Sprint 3)

Vier Dokumente zum Brand-Setup. **Lies in dieser Reihenfolge:**

1. **`01_BRAND_MANIFESTO.md`** — Mission, Werte, Tagline, Tonalität,
   Anti-Mission. Eine Seite, lesbar in 4 Minuten. Fundament für alles
   andere.

2. **`02_GPT_BRIEF_LOGO_AND_ICON.md`** — Briefing-Doc für ChatGPT
   (DALL-E / Sora) zur Logo- und App-Icon-Erstellung. Kannst du 1:1
   in den Chat kopieren. Enthält 3 Konzept-Vorschläge, exakte
   Output-Format-Specs, Prompt-Templates zum Copy-Pasten.

3. **`03_EMAIL_AND_PUSH_SEQUENCE.md`** — Welcome-Email-Template
   (HTML, fertig für Supabase Auth) plus Day 3 / Day 7 Drip-Sequence
   plus situative Pushes (Heimweg, Live, SOS, Trust).

4. **`04_EMPTY_STATES_COPY.md`** — Sammlung aller Empty-States in der
   App mit Brand-Voice. Format: Sticker + Headline + Sub + CTA. Stage-
   Gate-Prio damit du nicht alle gleichzeitig ausrollen musst.

## Status

- ✅ Sprint 3.1 — Manifesto + Tagline final geklärt
  (Empfehlung: **„Connection + Safety. Für deine Crew."**)
- 📤 Sprint 3.2 — GPT-Brief steht, jetzt an ChatGPT übergeben.
  Lieferung erwartet als ZIP mit dem Folder-Layout aus dem Brief.
- 🛠 Sprint 3.3 — Onboarding-Tour Slides 0+1 aktualisiert
  (im Code: `clean.html`). Slide 0 jetzt Brand-Mission-First mit
  „Niemand geht alleine heim.", Slide 1 mit drei Pillar-Cards
  (Crew / Safety-Circle / Heimweg).
- 📤 Sprint 3.4 — Email + Push Templates stehen, müssen jetzt:
  - Welcome-Email-HTML in Supabase → Auth → Email Templates →
    Confirm-Signup einsetzen
  - Day 3 + Day 7 Send-Logik als Edge-Function bauen (existiert noch
    nicht, separater Sprint)
- 🛠 Sprint 3.5 — Drei wichtigste Empty-States im Code aktualisiert
  (Crew-Member-Liste, Crew-Chat-Thread, DM-Thread, Spots-Liste).
  Rest folgt in Stage-2-Polish-Pass.

## Nächste Schritte für Jan

**A — sofort (heute oder morgen):**
1. Brand-Manifesto durchlesen, freigeben oder Edits markieren
2. Tagline final bestätigen oder eine der Alternativen wählen
3. Den GPT-Brief an ChatGPT (idealerweise GPT-5 mit Image-Tools) übergeben
4. Welcome-Email-HTML in Supabase einsetzen (Authentication → Email Templates)

**B — wenn GPT zurückkommt:**
1. Drei Logo-Konzepte gemeinsam mit Claude reviewen
2. Eines wählen, Final-SVG anfordern
3. Icons in PWA (`manifest.json`, `apple-touch-icon` etc.) einsetzen
4. Splash + Header-Lockup auf Marketing-Seite einbauen

**C — Sprint 4 (Stuttgart-Pioneer-Programm):**
- Mit Final-Branding live gehen → 50 Pioneer-User-Onboarding
