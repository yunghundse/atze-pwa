# Build-Pipeline für partycrew.app

## Was es tut
- Liest deine `app.html`
- Minifiziert + Obfuskiert allen Inline-JS
- Minifiziert das HTML
- Schreibt nach `dist/app.html`

Ergebnis: Code ist nicht mehr lesbar, aber funktioniert identisch. Schreckt 90% der Code-Klauer ab. Entschlossene Reverse-Engineerer kommen trotzdem dran (siehe README im Hauptordner).

## Setup (einmalig)
```bash
cd build
npm install
```

Dauer: ~30 Sek. Installiert: terser, javascript-obfuscator, html-minifier-terser, jsdom.

## Build laufen lassen
```bash
node build.js                    # nimmt ../app.html
node build.js path/to/app.html   # alternativer Pfad
```

Output landet in `../dist/app.html`. Das ist die Datei, die du nach `partycrew.app` deployst (statt der Original-`app.html`).

## Obfuskations-Level
```bash
OBF_LEVEL=low node build.js     # nur Minify, schnell, App definitiv unverändert
OBF_LEVEL=medium node build.js  # Default — Strings encrypted, Variablen mangled
OBF_LEVEL=high node build.js    # + Control-Flow-Flattening, Dead-Code-Injection
                                #   ACHTUNG: kann ~3x langsamer machen, gut testen!
```

## Empfehlung
- **Erstes Deploy**: `OBF_LEVEL=low` — sicher dass die App noch läuft
- **Stabiles Production**: `OBF_LEVEL=medium` — guter Mix aus Schutz + Performance
- **Erst wenn aggressive Klone auftauchen**: `high`

## Was Obfuskation NICHT ist
- Kein Schutz vor Reverse-Engineering durch entschlossene Angreifer (Tools wie `webcrack`, `prettier`, `unminify` machen es teilweise rückgängig).
- Kein Ersatz für serverseitige Sicherheit — die kritische Logik MUSS im Backend (Supabase Edge Functions) liegen.
- Verhindert nicht, dass jemand die fertige App kopiert und in seinem eigenen Projekt verwendet (nur dass der Code lesbar ist).

## CI-Integration (GitHub Actions)
Als Bonus eine `.github/workflows/build.yml`:

```yaml
name: Build

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: cd build && npm install
      - run: cd build && node build.js
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

Damit wird bei jedem Push automatisch der obfuskierte Build deployed.
