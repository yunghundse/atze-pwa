# crew. — Empty-States Copy-Sammlung

> Alle Empty-States in der App. Aktuell oft nüchtern oder fehlend —
> hier emotional + handlungsleitend. Format: 3D-Sticker (FX-Key) +
> Headline + Hilfsatz + CTA-Button.

Format pro State:
```
LOCATION: <wo in der App>
STICKER:  <FX-Key aus fx.js>
HEADLINE: <kurz, max 6 Wörter>
SUB:      <ein Satz, max 18 Wörter>
CTA:      <Button-Text>
ACTION:   <was passiert beim Klick>
```

---

## HOME-FEED LEER

```
LOCATION: Home → For-You-Feed
STICKER:  hug
HEADLINE: Noch ist es ruhig.
SUB:      Sobald deine Crew online geht, siehst du es hier — keine Push, kein Lärm.
CTA:      Crew einladen
ACTION:   Invite-Modal öffnen
```

## FOR-YOU-SPOTS (in der Nähe) LEER

```
LOCATION: Home → Spots in der Nähe (kein Hotspot in 5km)
STICKER:  map
HEADLINE: Hier ist gerade nichts los.
SUB:      Du bist der erste in deiner Gegend. Mach den ersten Spot — andere finden dich.
CTA:      Spot anlegen
ACTION:   Hotspot-Wizard öffnen
```

## CREW-LISTE LEER (User hat noch keine Crew)

```
LOCATION: Crew-Tab → Eigene Crews
STICKER:  crew
HEADLINE: Allein ist langweilig.
SUB:      Tritt einer öffentlichen Crew bei oder gründe deine eigene — du brauchst nur 2 Leute zum Start.
CTA:      Crews entdecken
ACTION:   Discovery-Modal öffnen, Default-Tab "Öffentlich"
```

## CREW-CHAT LEER (gerade beigetreten)

```
LOCATION: Crew-Detail → Chat-Thread (0 Messages)
STICKER:  speech
HEADLINE: Sag Hi.
SUB:      Erste Nachrichten kosten nichts. Crews ohne Stille sind Crews die bleiben.
CTA:      —
ACTION:   Input-Field gefokussiert
```

## DM-INBOX LEER

```
LOCATION: Crew-Tab → DM-Liste
STICKER:  speech
HEADLINE: Noch keine Nachrichten.
SUB:      Tippe auf einen Crew-Member auf der Map oder in der Liste, um zu schreiben.
CTA:      Zur Crew-Map
ACTION:   Map-Tab öffnen
```

## NOTIFICATION-CENTER LEER

```
LOCATION: Bell-Icon → Inbox-Modal
STICKER:  bell
HEADLINE: Alles ruhig.
SUB:      Hier landen SOS, Heimweg-Updates, Crew-Joins. Wir spammen nicht.
CTA:      Push-Settings
ACTION:   Settings → Push-Tab öffnen
```

## SAFETY-CIRCLE LEER

```
LOCATION: Profil → Safety-Circle (keine Member)
STICKER:  shield
HEADLINE: Wer holt dich raus, wenn's hart wird?
SUB:      Wähl 1–3 Leute. Sie sehen nichts von dir — nur wenn du SOS oder Heimweg-Modus aktivierst.
CTA:      Person hinzufügen
ACTION:   Invite-Modal mit Phone/Email/Username-Suche
```

## NOTFALL-KONTAKTE LEER

```
LOCATION: Settings → SOS → Notfallkontakte (0)
STICKER:  phone
HEADLINE: Wenn du SOS auslöst — wer wird angerufen?
SUB:      Trag mindestens eine Person ein. Auch ohne App-Account erreichbar via SMS.
CTA:      Kontakt eintragen
ACTION:   Add-Contact-Modal
```

## HEIMWEG-MODUS NIE GENUTZT

```
LOCATION: Home → Heimweg-Card (vor erstem Klick)
STICKER:  walking
HEADLINE: Heimweg-Modus.
SUB:      Sag der Crew Bescheid, wann du losgehst. Sie hören nur, wenn du nicht ankommst.
CTA:      Einrichten — 30 sec
ACTION:   Heimweg-Setup öffnen (Adresse + Standard-Zeit)
```

## HOTSPOT-LISTE LEER (Filter aktiv)

```
LOCATION: Hotspot-Tab → Liste mit aktivem Filter, 0 Treffer
STICKER:  search
HEADLINE: Nichts in dieser Filter-Kombi.
SUB:      Erweitere den Radius oder lass den Filter weg — vielleicht siehst du was.
CTA:      Filter zurücksetzen
ACTION:   Alle Filter clear
```

## HOTSPOT-MAP LEER (kein Pin im Viewport)

```
LOCATION: Hotspot-Map → Viewport mit 0 Pins
STICKER:  pin
HEADLINE: Diese Ecke ist neu.
SUB:      Setz den ersten Spot. Andere folgen — so funktioniert das Netz.
CTA:      Spot anlegen
ACTION:   Wizard mit Lat/Lng aus Map-Center vor-befüllt
```

## SAFEHAVEN-LISTE LEER (z.B. neue Stadt)

```
LOCATION: SafePlace-Tab → SafeHavens (0)
STICKER:  folded
HEADLINE: Hier gibt's noch keinen Schutzort.
SUB:      Frauenhäuser, LGBTQ+-Zentren, Beratungsstellen — kennst du einen? Trag ihn ein.
CTA:      SafeHaven vorschlagen
ACTION:   Hotspot-Wizard mit kind=safehaven vor-ausgewählt
```

## TRUST-SCORE 0 (frisch registriert)

```
LOCATION: Profil → Trust-Score-Card
STICKER:  star
HEADLINE: Noch keine Bewertungen.
SUB:      Trust kommt von deiner Crew. Je mehr du dabei bist, desto höher.
CTA:      Was ist Trust?
ACTION:   Info-Modal mit Trust-Erklärung öffnen
```

## TOP-TRUST WELT-RANKING (User nicht opted-in)

```
LOCATION: Trust-Modal → Welt-Tab (Opt-Out)
STICKER:  globe
HEADLINE: Du bist nicht im Welt-Ranking.
SUB:      Standardmäßig aus. Wenn du willst, kannst du es in den Privacy-Settings einschalten.
CTA:      Einschalten
ACTION:   Settings → Privacy → setWorldRank toggle
```

## STAMMBAUM LEER (Safety-Circle 0)

```
LOCATION: Profil → Stammbaum-Visualisierung
STICKER:  seedling
HEADLINE: Dein Stammbaum wartet auf den ersten Ast.
SUB:      Sobald du jemanden in den Safety-Circle holst, wachsen Verbindungen.
CTA:      Erste Person hinzufügen
ACTION:   Safety-Circle Add-Modal
```

## ADMIN-WAITLIST LEER (für dich, nicht user-facing)

```
LOCATION: Admin → Waitlist → Pending-Tab (0 Einträge)
STICKER:  hourglass
HEADLINE: Niemand wartet gerade.
SUB:      Sobald sich neue Leute eintragen, landen sie hier.
CTA:      —
ACTION:   keine
```

## ADMIN-REPORTS LEER

```
LOCATION: Admin → Reports → Offen (0 Einträge)
STICKER:  check
HEADLINE: Keine offenen Reports.
SUB:      Saubere Community heute. Schau morgen wieder rein.
CTA:      —
ACTION:   keine
```

## ONBOARDING-SUCCESS (Setup fertig, vor erster App-Nutzung)

```
LOCATION: Nach Onboarding-Tour, vor Home-Tab
STICKER:  party
HEADLINE: {{ profile.name }}, du bist drin.
SUB:      Erst leise. Sobald deine Crew dazustößt, wird's lauter.
CTA:      Los geht's
ACTION:   Tour schließen, Home-Tab
```

## OFFLINE-MODUS (kein Netz)

```
LOCATION: Globaler Network-Lost-Banner
STICKER:  warning
HEADLINE: Offline.
SUB:      Wir versuchen's automatisch wieder. Deine Daten sind sicher.
CTA:      Erneut prüfen
ACTION:   Manuell reconnect
```

## SUSPENDED-USER (separater Sperr-Banner — nicht klassischer Empty-State)

Bereits in Sprint 2.3 implementiert:
```
HEADLINE: Account {{ "gesperrt bis 14.5." | "dauerhaft gesperrt" }}.
SUB:      Grund: {{ reason }}. Bei Fragen: support@partycrew.app
CTA:      Abmelden
```

---

## VOICE-CHECK

Bevor irgendein Empty-State live geht, durch diese 5 Fragen:

1. **Erkläre ich das Problem?** (Ja, ohne Tech-Sprech)
2. **Gebe ich einen klaren nächsten Schritt?** (Ja, ein CTA)
3. **Klingt es nach einem 25-jährigen Berliner oder nach einer Versicherung?** (Berliner)
4. **Würde ich das selbst genervt finden?** (Wenn ja → kürzen)
5. **Funktioniert es ohne den 3D-Sticker?** (Sticker ist Bonus, nicht Krücke)

---

## SCHRITT-FÜR-SCHRITT-PRIO ZUM AUSROLLEN

Nicht alle auf einmal — Stage-Gate:

**Stage 1 (für Public-Launch zwingend):**
- Home-Feed leer
- Crew-Liste leer
- Crew-Chat leer
- Safety-Circle leer
- Notfall-Kontakte leer
- Notification-Center leer
- Onboarding-Success

**Stage 2 (Polish, nach 50 Pioneer-Usern):**
- For-You-Spots
- Hotspot-Map leer
- DM-Inbox leer
- SafeHaven-Liste leer

**Stage 3 (Edge-Cases):**
- Trust-Score 0
- Stammbaum leer
- Top-Trust Welt-Ranking
- Filter-Empty
- Offline-Modus
