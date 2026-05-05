# crew. — GPT-Brief für Logo + App-Icon + Splash

> **An ChatGPT (GPT-5 / DALL-E / Sora):** Lies dieses Brief vollständig
> bevor du irgendwas generierst. Liefere am Ende strukturiert ab —
> Format unten. Wenn du ein Detail nicht klären kannst, frag zurück
> bevor du generierst, statt zu raten.

---

## Was ist crew.

crew. (kleingeschrieben, mit Punkt) ist eine deutsche Connection +
Safety-App für 18–28-Jährige in DACH. Mission: **„Niemand geht alleine
heim."** Wir sind kein Crime-Reporter (Citizen), kein
Family-Tracker (Find My), kein Dating-Tool (Tinder) und kein
Vergänglichkeits-Spiel (Snap). Wir sind ein gewähltes Safety-Netz für
Crews die abends raus gehen.

Vollständiges Brand-Manifesto: siehe `01_BRAND_MANIFESTO.md` im
gleichen Ordner.

## Was wir von dir brauchen — Übersicht

1. **Wortmarke** — `crew.` als Schriftzug, mehrere Varianten
2. **Logo-Symbol (Mark)** — eigenständig nutzbar neben oder ohne Wortmarke
3. **App-Icon iOS** — 1024×1024 Master + 4 Varianten (Light/Dark/Tinted/Pink-SOS-Notif-Variant)
4. **App-Icon Android adaptive** — Foreground 432×432 auf transparentem Hintergrund + Background 432×432 farbig
5. **Splash-Screen** — 1242×2688 (iPhone 16 Pro Max) — Logo zentriert auf Brand-Hintergrund, ggf. mit subtiler Aura
6. **Favicon-Set** — 16/32/48/180/192/512
7. **Social-Card-Template** — 1200×630 für OG-Share-Previews
8. **Header-Lockup** — Logo + Tagline-Lockup für Web-Hero und Plakate

---

## DESIGN-DIREKTION (das wichtigste — bitte exakt befolgen)

### Stil-Anker
**„Modern Calm Tech meets Nightlife-Glow"**

- Geometrisch + lesbar, nicht verspielt
- Fluent-3D-Emoji-Familie ist visuell verwandt aber NICHT das Logo
- Eher **Linear**, **Notion**, **Arc Browser**, **Lo-Fi Hype Machine**, **Berlin's Späti-Plakate**
- WENIGER **Tinder-Flammen-Stil**, **Citizen-Hard-Edges**, **Snap-Cartoon**, **Police-Schild**

### Farb-System (zwingend)

| Token | Hex | Verwendung |
|---|---|---|
| `--violet` | `#8B5CF6` | Brand-Primary, Logo-Hauptfarbe |
| `--violet-deep` | `#1A1130` | Dark-Bg, Logo auf Light-Variante |
| `--violet-glow` | `#A88CFF` | Aura/Glow-Effekte |
| `--off-white` | `#F5F3FF` | Logo auf dunklem Bg |
| `--sos-pink` | `#EC4899` | NUR für SOS-Kontext, NIE im Standard-Logo |

**Wichtig:** Im Standard-Logo verwendest du **kein** Pink. Pink kommt
nur in der `Pink-SOS-Notif-Variant`-Icon-Variante zum Einsatz (siehe
unten — Anwendung: wenn ein User eine SOS-Push bekommt, springt sein
App-Icon auf diese Variante). Das ist eine optionale Lieferung Stage 2.

### Typografie

- **Wortmarke `crew.`:** geometrisch, leicht abgerundet, kleingeschrieben
- Vorschlag-Familien (such dir die passendste raus, eigene Schrift OK
  wenn signifikant besser):
  - **Geist Mono / Sans** (Vercel) — geometrisch, modern
  - **Inter Display** — bewährt, lesbar, kostenlos
  - **PP Neue Montreal** — Edge, modern (kostenpflichtig)
  - **Söhne** (Klim) — clean, premium (kostenpflichtig)
- Der Punkt am Ende **ist Teil der Marke** — er muss als eigenständiges
  Element wirken (z.B. in `--violet`-Farbe während `crew` in
  `--off-white` steht). **Niemals** den Punkt weglassen oder
  „dezent" machen.

### Symbol-Konzepte (drei Vorschläge — bitte alle drei liefern)

#### Konzept A — „Drei Punkte / Constellation"
Drei verbundene Punkte (Dreieck-Anordnung) — repräsentiert eine Crew
(min. 3 Personen). Verbindungen leicht violet-glühend, Hauptpunkte
solid. Skalierbar bis 16×16. Bewusst minimal und neutral.

#### Konzept B — „Aura-Pin"
Ein abstrahierter Pin/Standort-Marker, aber **nicht** der Find-My-/
Maps-Standard-Pin. Stattdessen: eine weiche, leicht abgerundete
Tropfenform mit einer pulsierenden Aura außen. Innen ein einzelner Punkt
(„du bist hier") — die Aura repräsentiert die Crew die dich umgibt.
Zwingend NICHT spitz wie ein Maps-Pin.

#### Konzept C — „Crew-Ring"
Ein nicht ganz geschlossener Kreis (wie ein C, das fast zum O wird).
Im Inneren ein kleinerer Punkt. Repräsentiert: „Kreis in den du rein
oder raus kannst, mit dir in der Mitte." Sehr clean, fast nordisch.

**Alle drei** möglichst geometrisch, ohne unnötige Verzierung,
funktionieren in 1-Color (violet auf weiß und weiß auf violet).

### Was das Logo NICHT sein darf
- KEIN Herz, keine Flamme, keine Wisch-Animation
- KEIN klassischer Maps-Pin (Tropfenform mit Spitze)
- KEIN Polizei-Schild, kein SOS-Cross
- KEINE Nightlife-Klischees (Discokugel, Drink-Glas, Konfetti)
- KEINE generischen „people connecting" Strichmännchen
- KEINE Ähnlichkeit zu Find My, Citizen, Tinder, Snap, Bumble,
  Discord-Logos
- KEIN Gradient innerhalb des Symbols (Aura ja, Symbol-Fill nein)
- KEIN Emoji als Logo

---

## APP-ICON — iOS 18 Specs

iOS 18 verlangt 4 Varianten:

### Variant 1 — Light/Standard (Pflicht)
- 1024×1024 PNG, **kein** Alpha-Kanal (vollflächig)
- Hintergrund: Solid `--violet` `#8B5CF6` ODER subtiler Verlauf von
  `--violet` (oben) zu `--violet-deep` (unten, ~15% dunkler)
- Symbol zentriert, weiß/`--off-white`, ca. 60% der Canvas-Breite
- Kein Schatten unter dem Symbol (das macht iOS automatisch beim
  Squircle-Crop)
- Apple cropt automatisch zum Squircle — designe in 1024×1024 ohne
  selbst gerundete Ecken zu legen

### Variant 2 — Dark Mode (Pflicht)
- Hintergrund `--violet-deep` `#1A1130`
- Symbol in `--violet-glow` `#A88CFF`
- Aura/Glow erlaubt, sehr subtil (8–12% Opacity, blur 80px)

### Variant 3 — Tinted (iOS 18 Tint-Mode)
- Schwarz-weiße Version
- Symbol: `#FFFFFF` auf transparentem Hintergrund (Apple legt
  System-Tint drüber)
- Wichtig: nur Schwarz und Weiß verwenden, kein Grau

### Variant 4 (optional, Stage 2) — „SOS-Notif-Variant"
- Hintergrund `--sos-pink` `#EC4899`
- Symbol weiß
- Wird als alternatives Icon vorbereitet (App-Code kann switchen
  wenn SOS-Push aktiv) — aber nicht als Default

## APP-ICON — Android (Adaptive)

Liefere zwei separate PNGs:

- **Foreground:** 432×432, transparentes PNG, Symbol zentriert in
  `--violet` (oder weiß je nach Background)
- **Background:** 432×432, vollflächig `--violet-deep` ODER
  Verlauf wie iOS-Variant 1

Sicherheitsbereich: das Symbol darf **nur** die mittleren 264×264
einnehmen (System cropt unterschiedlich auf verschiedene Hersteller).

## Splash-Screen

- 1242×2688 (iPhone 16 Pro Max) — du designst portrait
- Hintergrund: voller `--violet-deep`
- In der Mitte (etwa bei 50% Höhe): Logo (Wortmarke + Symbol oder nur
  Symbol, beides liefern)
- Optional: ganz subtile, langsame Aura-Animation (du lieferst statisch,
  wir animieren später per CSS)
- Kein Text-Slogan auf Splash

## Favicon-Set

Liefere als ein ZIP oder Einzelfiles:
- `favicon-16.png`
- `favicon-32.png`
- `favicon-48.png`
- `apple-touch-icon-180.png` (iOS Add-to-Homescreen)
- `android-chrome-192.png`
- `android-chrome-512.png`
- `favicon.ico` (Multi-Resolution mit 16+32+48 reingebacken)

## Social-Card-Template

- 1200×630 PNG
- Linke Hälfte: Logo + Wortmarke + Tagline „Connection + Safety. Für deine Crew."
- Rechte Hälfte: Platzhalter-Bereich für variablen Content (App-Screenshot,
  Quote, etc.) — markiere klar wo das ausgetauscht wird
- Hintergrund: `--violet-deep` mit dezenter Aura
- Liefere zusätzlich eine PSD/SVG/Figma-Datei wo nur der Content-Bereich
  bearbeitbar ist

## Header-Lockup für Web-Hero

- Wortmarke + Symbol nebeneinander
- Tagline als zweite Zeile, kleiner: „Connection + Safety. Für deine Crew."
- Liefere 3 Größen-Anwendungen:
  - 1024×120 (Web-Header)
  - 1080×1920 (Story-Format Plakate)
  - 1200×400 (Email-Header)

---

## OUTPUT-FORMAT (so möchten wir abgeben)

Bitte als ZIP oder Folder-Struktur:

```
crew_brand_v1/
├── 00_README.txt           # was du wo gemacht hast, welche Schrift verwendet
├── 01_logo/
│   ├── concept_A_dots.svg
│   ├── concept_A_dots.png  (1024×1024 transparent)
│   ├── concept_B_aura_pin.svg + .png
│   ├── concept_C_crew_ring.svg + .png
│   ├── wordmark_only.svg + .png
│   ├── wordmark_with_symbol_horizontal.svg + .png
│   └── wordmark_with_symbol_vertical.svg + .png
├── 02_app_icon_ios/
│   ├── icon_light_1024.png
│   ├── icon_dark_1024.png
│   ├── icon_tinted_1024.png
│   └── icon_sos_variant_1024.png
├── 03_app_icon_android/
│   ├── adaptive_foreground_432.png
│   └── adaptive_background_432.png
├── 04_splash/
│   └── splash_1242x2688.png
├── 05_favicon/
│   ├── favicon-16.png
│   ├── favicon-32.png
│   ├── favicon-48.png
│   ├── apple-touch-icon-180.png
│   ├── android-chrome-192.png
│   ├── android-chrome-512.png
│   └── favicon.ico
├── 06_social/
│   ├── og_card_template.png
│   └── og_card_template.svg
└── 07_header_lockup/
    ├── lockup_web_1024x120.png
    ├── lockup_story_1080x1920.png
    └── lockup_email_1200x400.png
```

**SVG-Pflicht** für: Logo-Konzepte A/B/C, Wortmarke, alle Lockups. Damit
wir später Farb-Tokens automatisiert tauschen können.

**PNG-Pflicht** für: Alle App-Icons, Splash, Favicons, Social-Cards.

---

## PROMPT-TEMPLATE FÜR DALL-E / IMAGE-GEN

> Wenn du im Image-Generator-Schritt steckst und keinen Vektor-Output
> machst, nutze diese Prompts. Generiere immer **3 Varianten** pro
> Konzept, und nimm den engsten zur Direktion oben.

### Prompt — Konzept A (Drei Punkte / Constellation)
```
Minimalist geometric logo design, three solid dots arranged in a triangle
formation, connected by thin glowing lines, deep violet background
(#1A1130), dots in light violet (#A88CFF), connections subtly glowing.
Clean, modern, scalable to 16x16 pixels. Style: Linear, Vercel, Arc
Browser. NO icons, NO emoji, NO faces, NO maps pin shape, NO heart.
Square 1024x1024 canvas. Plain background, focus on the mark only.
```

### Prompt — Konzept B (Aura-Pin)
```
Modern abstract logo, soft rounded teardrop shape with NO pointed tip,
single small dot in the center, surrounding the shape a subtle pulsing
violet glow aura. Color palette: violet #8B5CF6 for the shape,
A88CFF for the aura, deep violet background #1A1130. Clean,
minimalist, geometric. Style: Notion-meets-Berlin-poster-art. NO Maps
pin, NO Find My logo, NO heart shape. Square 1024x1024 canvas.
```

### Prompt — Konzept C (Crew-Ring)
```
Logo design: a near-complete circle with a small gap on the right side
(like a 'C' that almost becomes 'O'), thick stroke in violet #8B5CF6,
inside the ring a single solid dot in lighter violet #A88CFF. Clean,
geometric, Scandinavian-modern style. Solid #1A1130 background. NO
text, NO embellishment. Square 1024x1024 canvas. Designed to scale to
16x16 favicon size.
```

### Prompt — Wortmarke
```
Clean wordmark of the lowercase word "crew" followed by a single
period. Geometric sans-serif, slightly rounded letterforms, modern,
Vercel-style. The letters in light violet/off-white #F5F3FF, the
period in solid violet #8B5CF6 (the period is a deliberate
design element, larger than typographically natural). Background:
deep violet #1A1130. The word should feel calm, lowercase, friendly
but premium. Width-optimized for header use. NO ornament, NO icon
beside it. Render at 1024x256.
```

### Prompt — App-Icon Light (iOS Master)
```
iOS app icon, 1024x1024, full bleed (no rounded corners, iOS will
handle squircle crop), solid violet background with very subtle vertical
gradient from #8B5CF6 (top) to #1A1130-tinted bottom, centered abstract
geometric symbol [INSERT CHOSEN CONCEPT FROM A/B/C ABOVE] in
off-white #F5F3FF, symbol occupies central 60% of canvas, no shadow,
no text. Style: modern minimal, like Linear or Arc Browser app icons.
```

---

## QUALITÄTS-KRITERIEN

Wir akzeptieren nur Lieferungen die alle folgenden Tests bestehen:

- [ ] Logo bleibt **bei 16×16 Pixel** lesbar (squint-test)
- [ ] Logo funktioniert in 1 Farbe (nur Violet auf Weiß und Weiß auf Violet)
- [ ] Logo verwechselt sich **nicht** mit Find My, Citizen, Tinder,
      Snap, Bumble, Discord, Whatsapp, Signal, Telegram
- [ ] App-Icon ist **vom Telefon-Lock-Screen erkennbar** (1cm Distanz
      Test) zwischen 30 anderen App-Icons
- [ ] Wortmarke „crew." ist auch ohne Symbol als eigenständige Marke
      tragfähig
- [ ] Brand fühlt sich **mehr nach 25-jährigem Berliner als nach
      35-jährigem Tech-Recruiter** an
- [ ] Keine cringe-Elemente (Influencer-Vibes, Tech-Bro-Vibes,
      Corporate-Vibes)
- [ ] Bei Google-Bilder-Search nach „crew app logo" tauchen wir
      **nicht versehentlich neben** existierenden ähnlichen Logos auf
      — bitte selber checken vor Abgabe

---

## REVIEW-LOOP

Nach Abgabe:

1. Ich (Jan) und Claude prüfen alle Konzepte
2. Wir wählen 1 Konzept (A/B/C) als Final
3. Du lieferst noch:
   - Final-Konzept als finales SVG (production-ready)
   - Animation-Preview (CSS oder Lottie) für Splash-Screen
   - Brand-Mini-Guide (1-Seiten-PDF) mit Do's, Don'ts, Spacing-Regeln
4. Wir integrieren in die App + Marketing-Site

Falls bei der ersten Lieferung **keines** der drei Konzepte trifft —
liefere bitte **3 NEUE** Vorschläge mit ausführlicher Begründung
warum die ersten nicht passten, statt zu polishen.

---

## KONTAKT-RÜCKFRAGEN

Falls dir Information fehlt:
- Frag explizit „Welche Schriftart soll ich verwenden?" / „Welcher
  Glow-Radius?" / etc.
- Liefere NICHT erst und frag dann nach.
- Antworten kommen in <12h.

**Deadline für erste Lieferung:** offen, Quality > Speed.

**Ende des Briefs.**
