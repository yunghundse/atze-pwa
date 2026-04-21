# v108 — Crew-Menü-Rework

**Cache:** `crew-v108` (sw.js bump auf v=20)
**Stand:** 2026-04-21
**Scope:** Chat-first, Vote-Tab, Self in Crew-Liste, schlanke Actions, Community raus aus Crew-Karte, Quests automatisch.

---

## Warum v108

Feedback aus dem Live-Test:

> „Bringe den Chat noch an erster Stelle ans Crew-Menü auch eingebunden vor Quests. Den Standort-/Safe-Button kannst weg machen — also Action-Button. Den Chat-Button daneben auch, den Drinks-Button kannst du auch wegmachen. Deine Crew unten muss man sich selbst auch angezeigt werden. Crew-Vote des Tages musst du auch in das Menü noch reinhauen. Das mit der Community kannst du wegmachen, das darf nicht im Crew-Standort angezeigt werden — nur die Leute, die bei der Crew dabei sind. Die Quests finde ich gut, aber die jeweiligen Funktionen, die man lösen kann oder abhaken kann, soll man nicht manuell abhakcen können, sondern sollen vom System dann mit den jeweiligen Aufgaben übernommen werden. Also wenn jemand wirklich jemanden eingeladen hat, zählt das z.B. Wenn jemand wirklich gematcht hat, zählt das. Und so weiter."

Kurzform: **Das Crew-Menü war zu zersplittert** — Chat unten in eigener Mini-Section, Vote in einer Collapse-Card, Quests manuell abhakbar. Actions-Row hatte 6 Buttons, davon 4 Deko. Self fehlte in „Deine Crew". Und die Crew-Map zeigte Community-Pins, obwohl sie konzeptuell nur Crew sein soll.

v108 räumt das auf.

---

## Scope (was gemacht wird)

### 1) Chat als erster Tab im Crew-Menü
- Das v107 Tab-System bekommt eine neue Reihenfolge:
  **Chat · Vote · Quests · Top · Feed · Board** (6 Tabs, horizontal scrollbar).
- Default-Tab ist **Chat** statt Quests.
- Chat-Panel zeigt Mini-Preview (letzte 3 Nachrichten) + primärer CTA **„💬 Chat öffnen"** zum vollen Chat-Overlay.
- Alte `#miniChatSection` unter der Actions-Row wird komplett ausgeblendet (bleibt als hidden-div für Rückwärtskompatibilität im DOM).

### 2) Vote-Tab im Crew-Menü
- Bisher: `#v107VoteSection` als eigene Collapse-Card unter dem Menü.
- Neu: `#dailyVoting` lebt im Vote-Panel. Voting taucht nur auf, wenn der Tab aktiv ist → spart Above-the-fold-Platz.
- Alte Section wird ausgeblendet (hidden div).

### 3) Action-Button-Row abgespeckt
- Vorher: 6 Buttons (Taxi · Standort/Safe · Chat · Drinks · Einladen · ???).
- Nachher: **Nur Taxi + Einladen**. Chat wandert als primärer CTA in den Chat-Tab. Standort/Safe ist über Safety-Hub erreichbar. Drinks war Deko.
- Klasse `v108-actions-slim` zentriert die 2 Buttons (max 180px breit) — saubere Symmetrie.

### 4) Self in „Deine Crew"-Liste
- `getActiveCrewMemberIdsWithSelf()` holt **inkl. eigener user_id** (Komplement zur bestehenden `getActiveCrewMemberIds()`, die Self ausfiltert — die bleibt für Match-Logik etc. unverändert).
- `buildCrewList()` rendert eine eigene **Self-Card** mit:
  - Goldener Gradient-Border + linker Akzent-Stripe
  - **„DU"-Pill** neben dem Namen
  - Klick → Profilscreen (`go('profile')`)
  - Statt „Ping"-Button: **„Das bist du"**-Hint
- Visueller Pattern: `v108-self-card`, `v108-self-pill`, `v108-self-hint`.

### 5) Community raus aus Crew-Map
- `_renderCommunityLayer(map, storeKey)` bekommt Guard am Top:
  ```js
  if(storeKey === 'crew'){
    if(_crewCommunityLayer){ map.removeLayer(_crewCommunityLayer); _crewCommunityLayer = null; }
    return 0;
  }
  ```
- Crew-Karte zeigt ab jetzt **ausschließlich Crew-Pins + eigene Location**.
- Radar-Karte bleibt unverändert — dort gehört Community hin.

### 6) Quests: kein manuelles Abhaken mehr
- Button **„+1 Fortschritt eintragen"** in `loadCrewQuests()` (Line ~17954) ist weg.
- Stattdessen: einmaliger Info-Hinweis am Ende der Quest-Liste:
  > ⚡ *Quests laufen automatisch — jede echte Aktion (Match, Einladung, Vote, Chat, Safe) zählt in Echtzeit.*
- Auto-Hooks für alle Quest-IDs existieren bereits (v105, Lines 18234–18250) für:
  - `matches_10` ← echter Match-Event
  - `invites_3` ← NEU: jetzt via `joinCrew()`-Hook → feuert `crewEvent('invite_accepted')`
  - `votes_5` ← echter Vote-Cast
  - `chat_20` ← echte Chat-Message
  - `safe_5` ← echter Safe-Check-in
  - `checkins_10 / checkins_5` ← Partner-Check-in
  - `nav_home_3` ← Navigation-Event

### 7) Lazy-Load pro Tab
- `v107SwitchTab(tab)` ruft beim Tab-Wechsel gezielt die passende Loader-Funktion:
  - `chat` → `buildMiniChat()`
  - `vote` → `buildDailyVoting()`
  - `quests` → `loadCrewQuests()`
  - `leader` → `loadLeaderboard()`
- Chat/Vote-Daten sind immer frisch, wenn der User den Tab anfasst.

---

## Geänderte Dateien

### `app.html`
- CSS: `.v108-actions-slim`, `.v108-tab-cta`, `.v108-self-card`, `.v108-self-pill`, `.v108-self-hint`, `.v108-auto-hint` vor `</style>` ergänzt.
- HTML ~5578–5660:
  - v107-Tabs: Chat (default) · Vote · Quests · Top · Feed · Board
  - Chat-Panel: `#miniChatPreview` + `v108-tab-cta`-Button
  - Vote-Panel: `#dailyVoting`
  - Actions-Row: 2 Buttons statt 6, Klasse `v108-actions-slim`
  - `#miniChatSection` + `#v107VoteSection` → hidden stubs.
- JS:
  - `buildMiniChat()` umgeschrieben: füllt nur noch `#miniChatPreview`, leere States inline.
  - `_renderCommunityLayer()` early-return bei `storeKey === 'crew'`.
  - `joinCrew()` feuert `window.crewEvent('invite_accepted')` nach erfolgreichem Join.
  - `loadCrewQuests()` rendert keinen Manuell-Button mehr, fügt Auto-Hint am Ende an.
  - `v107SwitchTab()` dispatcht lazy-load pro Tab.
  - `buildCrewList()` hat Self-Card-Rendering mit `v108-self-card`/`v108-self-pill`.
  - `getActiveCrewMemberIdsWithSelf()` — neue Helper-Funktion.
- SW-Registrierung: `sw.js?v=20`.

### `sw.js`
- `CACHE = 'crew-v108'` (vorher `'crew-v107'`).

### `KONZEPT_v108_Crew_Menu_Rework.md` (neu)
- Dieses Dokument.

---

## Rückwärtskompatibilität

- `getActiveCrewMemberIds()` bleibt unverändert — alle 8 bestehenden Call-Sites (Match-Filter, Distance-Calc, etc.) filtern weiterhin Self raus.
- `#miniChatSection` + `#v107VoteSection` bleiben als hidden DOM-Nodes → kein bestehender Selector bricht.
- Quest-Cache `_questProgressCache` hat dieselbe Shape → Auto-Hooks greifen ohne Änderung.

---

## Rollout

1. Commit v108 lokal.
2. Push via GitHub Desktop.
3. User lädt App → SW registriert `v=20` → neuer Cache `crew-v108` → alte Ressourcen werden gelöscht.
4. Crew-Tab öffnen → Chat ist oben, 2 Action-Buttons, Self in Liste, Community-Pins weg von Crew-Map, Quests ohne Manuell-Button.

---

## Was nicht gemacht wurde (bewusst)

- **Keine DB-Migration nötig** — v108 ist reine Client-Cosmetic + Logik-Reshuffle.
- **Keine Quest-Änderung** — IDs, Targets, Rewards bleiben. Nur die UI lässt den Manuell-Button weg.
- **Vote-Flow unverändert** — nur Position im Menü.
- **Chat-Overlay unverändert** — nur Einsprung via Tab-CTA.

---

*v108. Ein Menü, sauber sortiert. Self sichtbar. Quests authentisch. Crew-Map crew-only.*
