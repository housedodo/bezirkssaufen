# Bezirkssaufen 🍻

A tiny web app for a birthday pub crawl through all 17 districts of Graz.
Two players, two stories:

- **Sarah — "The Hunt for #99":** chasing Jakob "Iceman" Eisner, Graz's most eligible ice hockey player, who is always one bar ahead.
- **Sara — "The Last Copy":** chasing Ottilie Pfotenhauer, a travelling bookseller with the last copy of *The Library of Herb and Kafk*, always five minutes ahead.

In every district the player reads what just happened, collects a souvenir for her journal, and gets a riddle describing the area around the next district (never its name). She picks the district from a list. Wrong guesses unlock a hint, and after three wrong guesses there's a "just tell us" button. Then everyone goes there, gets a drink, and taps "we've arrived".

## The route

Every leg goes to a neighbouring district, so it's one loop around the city that ends at the brewery:

```
I Innere Stadt → IV Lend → XIII Gösting → XII Andritz → III Geidorf → XI Mariatrost
→ X Ries → II St. Leonhard → IX Waltendorf → VIII St. Peter → VII Liebenau
→ VI Jakomini → V Gries → XIV Eggenberg → XV Wetzelsdorf → XVI Straßgang → XVII Puntigam
```

Both stories follow the same route, so the group always moves together.

## Host cheat sheet

| Stop | District | What the clue at the previous stop describes |
|---|---|---|
| 1 | I Innere Stadt | (start) |
| 2 | IV Lend | Kunsthaus "Friendly Alien", Lendplatz market |
| 3 | XIII Gösting | Burgruine Gösting, Jungfernsprung |
| 4 | XII Andritz | ANDRITZ machine factory, Andritz-Ursprung spring, northern tram end |
| 5 | III Geidorf | Uni Graz, Botanical Garden, LKH |
| 6 | XI Mariatrost | Basilika Mariatrost, long stairs, tram museum |
| 7 | X Ries | Riesstraße hill races, old toll house, no primary school |
| 8 | II St. Leonhard | St. Leonhard (patron of prisoners), Leonhardstraße, Kunstuniversität |
| 9 | IX Waltendorf | Lustbühel observatory, Ruckerlberg villas, old clay pits/natural ice, Hallerschloss |
| 10 | VIII St. Peter | St. Peter's church (keys), ORF "Peichl-Torte", Grazer Urwald |
| 11 | VII Liebenau | Ice stadium, Merkur Arena / Ivica-Osim-Platz, Murpark, G-Class factory |
| 12 | VI Jakomini | Jakominiplatz tram hub, Augarten |
| 13 | V Gries | "Gries" = gravel, Griesplatz, Karlau prison wall |
| 14 | XIV Eggenberg | Schloss Eggenberg: 365 windows, peacocks |
| 15 | XV Wetzelsdorf | Ölberg, Plabutschtunnel, police HQ, tram terminus |
| 16 | XVI Straßgang | Maria im Elend, Schloss St. Martin, Naturbad, Kehlberg vineyards |
| 17 | XVII Puntigam | Brewery — finale |

## Editing the story

All text lives in [`story.js`](story.js): the route, both intros, every encounter, riddle, hint, souvenir and both finales. HTML like `<b>` and `<i>` works inside the texts; a blank line starts a new paragraph.

After changing anything, bump `VERSION` in [`sw.js`](sw.js) so phones that already opened the app pick up the new version.

## Running it

It's plain HTML/CSS/JS — no build step.

**Locally:** `python3 -m http.server 8000` in this folder, then open http://localhost:8000.

**On the phones (GitHub Pages):**
1. Repo → Settings → Pages → Source: *Deploy from a branch* → `main` / `/ (root)` → Save.
2. After a minute it's live at `https://housedodo.github.io/bezirkssaufen/`.
3. Each player opens the link and adds it to the home screen (Safari: Share → *Add to Home Screen*; Chrome: ⋮ → *Install app*). Once opened, it works offline.
4. Each player picks her own story. Progress is saved on the phone; "Start over" is in the journal menu (☰).
