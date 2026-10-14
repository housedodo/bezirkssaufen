# Bezirkssaufen 🍻

A tiny web app for a birthday pub crawl through all 17 districts of Graz.
Two players, two stories:

- **Sarah — "The Hunt for #99":** chasing Jakob "Iceman" Eisner, Graz's most eligible ice hockey player, who is always one bar ahead.
- **Sara — "The Last Copy":** chasing Ottilie Pfotenhauer, a travelling bookseller with the last copy of *The Library of Herb and Kafk*, always five minutes ahead.

In every district the player reads what just happened, collects a souvenir for her journal, and gets a riddle describing the area around the next district (never its name). She picks the district from a list. Wrong guesses unlock a hint, and after three wrong guesses there's a "just tell us" button. Once she's guessed it, the app shows the next bar, the planned time and the bus/tram connection. Then everyone goes there, gets a drink, and taps "we've arrived".

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

Sarah's hockey teammates appear in Innere Stadt (Matze #14), Jakomini (Elias #22), Liebenau (Tomasz #31), Geidorf (Luca #4) and Gries (Dragan #55).

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
