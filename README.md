# Heated Pages 🧊🔥📖

*(working title: Bezirkssaufen. The repo, the cache and the Worker keep the old name.)*

A tiny web app for an adventure-day pub crawl through all 17 districts of Graz: two birthdays that already happened, celebrated together today.
Two players, two stories:

- **Sarah — "The Hunt for #99":** chasing Jakob "Iceman" Eisner, Graz's most eligible ice hockey player, who is always one bar ahead.
- **Sara — "The Last Copy":** chasing Ottilie Pfotenhauer, a travelling bookseller with the last copy of *The Library of Herbert and Kafka*, always five minutes ahead.

In every district the player reads what just happened, collects a souvenir for her journal, and gets a riddle describing the area around the next district (never its name). She picks the district from a list. Wrong guesses unlock a free hint (or she can buy one with hearts/bookmarks). There is no way to skip a district: it has to be guessed. Once she's guessed it, the app shows the next bar, the planned time and the bus/tram connection. Then everyone goes there, gets a drink, and taps "we've arrived".

## The route ("JJ Odyssey" plan)

| # | District | Bar | ca. | Getting there |
|---|---|---|---|---|
| 1 | I Innere Stadt | Auer Schmidtgasse | 09:00 | on foot |
| 2 | VI Jakomini | Sägewerk Sport (Raiffeisenpark) | 10:00 | Tram 5 Jakominiplatz → Josefkirche |
| 3 | VII Liebenau | Gotthardt Cafe-Bar, Murpark | 11:00 | Tram 4 Messe → Murpark |
| 4 | VIII St. Peter | Cuba Bar/Cafe | 12:00 | Bus 64 Murpark → Morrehof |
| 5 | IX Waltendorf | Martin Auer, Waltendorfer Hauptstraße 31 | 13:00 | Bus 64 Morrehof → Schörgelgasse |
| 6 | II St. Leonhard | Martin Auer Schillerplatz | 14:00 | 1 km on foot |
| 7 | X Ries | Auer, Ragnitzstraße 91 | 15:00 | Bus 64 → Klinikum, Bus 58 → Rauchleitenstraße |
| 8 | III Geidorf | Bierbaron | 16:00 | Bus 58 → Uni/Liebiggasse |
| 9 | XI Mariatrost | Sorger, Mariatrosterstraße 24 | 17:00 | Bus 58 → Mariagrün |
| 10 | XII Andritz | Flowers Cafe Lounge | 18:00 | Bus 58 → Geidorfplatz, Bus 41 → Stukitzbad |
| 11 | XIII Gösting | Göstinger Hof | 19:00 | Bus 52 Stukitzbad → Shopping Nord |
| 12 | XIV Eggenberg | Das Eggenberg | 20:00 | Bus 65 Negrelligasse → Alte Poststraße (else taxi) |
| 13 | XV Wetzelsdorf | Liwi Pub | 21:00 | Bus 62 Eggenberger Allee → VS Peter Rosegger |
| 14 | XVI Straßgang | Clocktower (closes 23:00) | 22:00 | Bus 65 → Wagner-Jauregg-Straße |
| 15 | XVII Puntigam | Pools, Bar & Billard (Cineplexx) | 23:00 | Bus 65 → Puntigam Bahnhof |
| 16 | V Gries | Die Beate | 00:00 | E5 → Zentralfriedhof, 67 → Griesplatz |
| 17 | IV Lend | Wherever we wanna verend | 01:00 | on foot — finale |

Both stories follow the same route, so the group always moves together.

## Host cheat sheet — what each riddle describes

The riddle you read in a district points to the **next** row.

| Next district | Landmarks the riddle uses |
|---|---|
| VI Jakomini | Jakominiplatz tram hub, Augarten |
| VII Liebenau | Ice stadium, Merkur Arena / Ivica-Osim-Platz, Murpark, G-Class factory |
| VIII St. Peter | St. Peter's church (keys), ORF "Peichl-Torte", Grazer Urwald |
| IX Waltendorf | Lustbühel observatory, Ruckerlberg villas, old clay pits / natural ice, Hallerschloss, the "Seer of Waltendorf" |
| II St. Leonhard | St. Leonhard (patron of prisoners), Leonhardstraße, Kunstuniversität |
| X Ries | Riesstraße hill races, old toll house, no primary school |
| III Geidorf | Uni Graz, Botanical Garden, LKH |
| XI Mariatrost | Basilika Mariatrost, long stairs, tram museum |
| XII Andritz | ANDRITZ machine factory, Andritz-Ursprung spring, northern tram end |
| XIII Gösting | Burgruine Gösting, Jungfernsprung |
| XIV Eggenberg | Schloss Eggenberg: 365 windows, peacocks |
| XV Wetzelsdorf | Ölberg, Plabutschtunnel, police HQ, tram terminus |
| XVI Straßgang | Maria im Elend, Schloss St. Martin, Naturbad, Kehlberg vineyards |
| XVII Puntigam | The brewery |
| V Gries | "Gries" = gravel, Griesplatz, Karlau prison wall |
| IV Lend | Kunsthaus "Friendly Alien", Lendplatz — finale |

## Sara's Bookbazaar

At ten stops Sara lands on a fake book marketplace with 3 listings that all look alike: Ottilie's *disguised* real book (its blurb only echoes what the local just said) and 2 decoys, one of which is a real page from another stop (always sold out). Every blurb has to be read out loud before she can order anything (every listing is a short spicy excerpt, hidden behind a "Read this page out loud" button; the real book's page echoes the local's story), and only the right purchase delivers Ottilie's note (the riddle). A wrong order = penalty sips (1, 2, 3 … per stop) and either delivered (a courier line, the book joins her haul) or an "unfortunately sold out" notice. The finale shows her accidental library.

At six stops the shop is replaced by a different game (wrong answers cost sips too): VII Liebenau **Zamboni physics** (3 science questions, Herbert's tip is always wrong) · X Ries **Herbert and Kafka judge** · XII Andritz **Ottilie's postcards** (which one was written here?) · XIV Eggenberg **Cover designer** · XVII Puntigam **Ask a stranger** (3 words, shown in the finale) · V Gries **Bookmark hunt** (the table approves).

**Sara's challenges** (earn 🔖 bookmarks). The host sends them from `admin.html` whenever it fits; the stops below are only the suggested timing: events — pop quiz @IX · dramatic reading @II · name that first line @III · menu poetry @VIII · back-cover blurb @XI · title this bar @XIII · five-star reviews @XV · chapter toast @XVI. Sudden plot twists — Herbert impression @VI · one word each @VIII · Herbert's nap @III · silence in the library @XIV · book swap @V · locker room speech @X · one-line fanfic @XVII.

**Shared missions** (host → Both): Adventure clink, twin selfie, drink swap, compliment battle, dance-off, staring contest, rock-paper-scissors, adventure wishes, **Bike vs Zamboni** (tap race: 40 taps in 10 s).

## Game day (host)

0. Install the host app once: open `admin.html` in Chrome/Safari and tap Install (or Add to Home Screen). It has its own teal icon ("Heated Host").
1. Both girls install the app and choose their name. They only see "Under construction" until you start.
2. In `admin.html`: enter the PIN, check both phones are registered, press **Reset all progress + back to the lobby**.
3. When everyone is ready, press **🚀 Start the game**. During the game, send the challenges from the mission list whenever it fits (pick Sarah / Sara / Both first). A sent mission is marked **✓ Done** in the list. Both phones get a notification; each girl reads her story and a first clue to the meeting point (Auer, Schmidtgasse, Innere Stadt). At Auer they press **Start the quest**.

## Spending points, and moving on together

Hearts (Sarah) and bookmarks (Sara) can be spent: buy a hint (1), cancel the sips of the current stop (2), make someone else do a challenge for you (3), Sara can have the real Bookbazaar listing marked (2). Only when **both** phones have solved the district (correct guess) does the next-stop screen appear; the host can release a stuck stop in `admin.html` → "Game sync".

## Sarah's dating app ("Icebreaker")

- **Player stops** show a teammate's profile. **Like** → "It's a match!" → a Tinder-style chat: he says hi (a random cool or cringe opener), she answers, he sends one red-flag text (a normal message, no label), she answers, he asks whether she's looking for the ice hockey guy, she replies (anything works), "doesn't matter actually, here's what I heard" + his tip, and only then the riddle (written to be read out loud). **Pass** → Sarah owes penalty sips (1st pass 1 sip, 2nd 2 sips, …), gets a 10-second timeout with a joke (different for every guy) and he swipes back in. She can't skip him — he's her only lead.
- **Tomasz #31 (Liebenau, the 3rd guy) is a dating sim:** 3 questions, 3 reply buttons each, his reaction to every answer, and one of 6 outcomes: 💘 perfect match (+1 ❤️), 😊 good (+1 ❤️), 😂 funny, 😬 bad (1 sip), 💀 very bad (2 sips), 🌪️ chaotic. Then his tip and the riddle as usual.
- **Challenges** (💔 events +2 ❤️, quizzes −1 per wrong answer; ⚡ intermissions +1 ❤️) are sent by the host from `admin.html` whenever it fits. The table below is the suggested timing.
- The top bar counts drinks and ❤️. The finale shows matches, likes earned, penalty sips, the bio her crew wrote and the super likes.

| District | What happens |
|---|---|
| I Innere Stadt | Matze #14 |
| VI Jakomini | Elias #22 |
| VII Liebenau | ⚡ Emoji decode (app checks) → Tomasz #31 |
| VIII St. Peter | Felix #9 |
| IX Waltendorf | 💔 Biochemistry quiz — 3 questions (app checks) |
| II St. Leonhard | 💔 Hockey pick-up line to the person behind the counter (group confirms) |
| X Ries | ⚡ Three super likes from the crew (typed in) → Marcus #77 |
| III Geidorf | Luca #4 |
| XI Mariatrost | 💔 Crew writes Sarah's dating bio in 90 s (typed in, shown at the finale) |
| XII Andritz | ⚡ Finish a drink without hands (group confirms) → Jonas #17 |
| XIII Gösting | 💔 A shot, with a 3-2-1 countdown (group confirms) |
| XIV Eggenberg | Nico #8 |
| XV Wetzelsdorf | 💔 Penalty box: 2 minutes silent, crew only says nice things (timer) |
| XVI Straßgang | 💔 Group goal celebration, filmed (group confirms) |
| XVII Puntigam | ⚡ Flick a cap/beer mat into a glass (group confirms) → Samuel #10 |
| V Gries | Dragan #55 |
| IV Lend | Finale |

Challenges live in `CHALLENGES` in `story.js`; the host panel lists them from `STORIES.<who>.missions` (built at the end of `story.js`).

## Editing the story

All text lives in [`story.js`](story.js): the route, bars and connections (`STOPS`), both intros, every encounter, riddle, hint, souvenir and both finales. HTML like `<b>` and `<i>` works inside the texts; a blank line starts a new paragraph.

After changing anything, bump `VERSION` in [`sw.js`](sw.js) so phones that already opened the app pick up the new version.

## Running it

It's plain HTML/CSS/JS — no build step.

**Locally:** `python3 -m http.server 8000` in this folder, then open http://localhost:8000.

**On the phones (GitHub Pages):**
1. Repo → Settings → Pages → Source: *Deploy from a branch* → `main` / `/ (root)` → Save.
2. After a minute it's live at `https://housedodo.github.io/bezirkssaufen/`.
3. Each player opens the link and adds it to the home screen (Safari: Share → *Add to Home Screen*; Chrome: ⋮ → *Install app*). Once opened, it works offline.
4. Each player picks her own story. Progress is saved on the phone; "Start over" is in the journal menu (☰).
