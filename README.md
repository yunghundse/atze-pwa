# crew. — Aktive Web-App

Production-Build für [partycrew.app](https://partycrew.app).

## Stack

- Vanilla HTML5 + CSS + JavaScript (kein Framework)
- [Supabase](https://supabase.com) für Beta-Waitlist (`beta_signups` Tabelle, EU-Region)
- [GitHub Pages](https://pages.github.com/) als Hosting
- [Inter](https://fonts.google.com/specimen/Inter) via Google Fonts

## Files

| File | Zweck |
|------|-------|
| `clean.html` | Aktive App-Quelle: Web-Warteliste, Native Login, App-Shell |
| `src/` | Helper-Module für Native Bridge, Telemetry, Trust, FX, Utilities |
| `app.html` | Redirect auf `clean.html` |
| `index.html` | Landing/Warteliste |
| `datenschutz.html` | DSGVO-Datenschutzerklärung |
| `impressum.html` | Impressum (§5 TMG) |
| `CNAME` | GitHub Pages Custom-Domain-Mapping |
| `.nojekyll` | Verhindert Jekyll-Filtering der Files |
| `robots.txt` | SEO-Crawler-Anweisungen |
| `sitemap.xml` | Sitemap für Suchmaschinen |

## Aktiver Pfad

Neue App-Arbeit passiert in `clean.html` und `src/`. Historische Backups (`_backup-*`) sind nur Recovery-Material. Die iOS-App bekommt diesen Stand über:

```bash
bash ../native/scripts/sync-web.sh
```

## Vor dem ersten Live-Schalten

1. **Supabase SQL** ausführen:
   ```sql
   create or replace function public.beta_signup_count()
   returns int language sql security definer stable as $$
     select count(*)::int from public.beta_signups;
   $$;
   grant execute on function public.beta_signup_count() to anon;
   ```

2. **Impressum + Datenschutz** mit echten Daten ausfüllen
   (Platzhalter `[DEIN NAME / FIRMA]` etc. ersetzen).

3. **GitHub Pages** im Repo aktivieren:
   Settings → Pages → Source: `main` / `/ (root)` → Custom domain: `partycrew.app`.

## Sicherheit

- **CSP** als Meta-Tag mit Allowlist (Supabase, Unsplash, fonts.googleapis, fonts.gstatic, unpkg).
- **Honeypot-Feld** im Form gegen einfache Bots.
- **Client-side Rate-Limit** (8s zwischen Submits).
- **Email-RegEx** strikter als HTML5-default.
- **Supabase Anon-Key** ist by-design public — durch Row-Level-Security geschützt:
  - INSERT erlaubt für `anon`
  - SELECT blockiert für `anon` (Mails sind nicht öffentlich auslesbar)
  - DELETE blockiert für `anon`

## Lokal entwickeln

```bash
# Einfacher HTTP-Server
python3 -m http.server 8000
# Dann http://localhost:8000 öffnen
```

## Deploy

Jeder Push auf `main` deployed automatisch via GitHub Pages (1–2 Minuten Cache-Verzögerung).

## Lizenz

Code: privat (alle Rechte vorbehalten). Hintergründe: [Unsplash License](https://unsplash.com/license).

---

Made with care. Built for everywhere.
