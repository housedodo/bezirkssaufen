# Bezirkssaufen — project handbook

> **Read this first, every session.** Two people work on this repo, each with their own Claude Code.
> This file is the shared source of truth: what exists, how it works, who is doing what.
>
> **Rule: update this file in the same commit as every change.** At minimum:
> 1. add a line to the [Changelog](#changelog),
> 2. update [Current state](#current-state) / [Open items](#open-items) if they changed,
> 3. update [Work in progress](#work-in-progress) (claim before you start, clear when you're done).
>
> A commit that changes behaviour, content or structure without updating this file is incomplete.

---

## Collaboration rules (to avoid overlaps)

1. **Pull before you start**: `git pull --rebase origin main`.
2. **Claim your work** in [Work in progress](#work-in-progress): add a row (who, what, which files) and push that
   change *before* doing the work. If someone else has claimed the same file/area, coordinate first.
3. **Small, focused commits.** One feature or fix per commit. Don't mix refactors with content changes.
4. **Hot spots** — `story.js` and `app.js` are edited by almost every change.
   - In `story.js`, only touch the stops/challenges you claimed. Don't reformat or reorder the file.
   - In `app.js`, don't rename functions or state keys without noting it in the changelog.
5. **Before pushing**: `git pull --rebase origin main`, resolve conflicts, re-test (see [Testing](#testing)), then push.
6. **Bump the cache** (`VERSION` in `sw.js`) whenever any file the phones load changes — otherwise installed
   phones keep the old version.
7. **No build step, no frameworks, no npm.** Plain HTML/CSS/JS so it runs offline on two phones. Keep it that way
   unless both agree.
8. **Spoilers**: the README and this file contain all answers. Never send the repo link to Sarah or Sara —
   only the GitHub Pages URL.
9. Commit messages end with your usual attribution; describe *what* changed for the players, not just code.

---

## Work in progress

| Who | What | Files / area | Since |
|---|---|---|---|
| Dominik (Claude) | Sara's book-themed challenges (10) | `story.js` (end: `SARA_CHALLENGES`), `app.js` (challenge engine, Sara clue flow), `styles.css`, `sw.js` | 2026-10-14 |

*(Add a row before you start. Remove it in the commit that finishes the work.)*

---

## What this is

A birthday game for a pub crawl ("Bezirkssaufen", the **JJ Odyssey**) through all 17 districts of Graz, one drink
per district. Two birthday girls each play their own story on their own phone:

- **Sarah — "The Hunt for #99"**, built as a fake dating app called **Icebreaker**. She chases
  Jakob "Iceman" Eisner (#99), a hockey player who is always one bar ahead. His teammates are dating profiles.
- **Sara — "The Last Copy"**: chases travelling bookseller Ottilie Pfotenhauer (cat: Herb), who has the last copy
  of *The Library of Herb and Kafk*. Old-bookshop paper look.

In each district: read what happened → get a riddle describing the area around the **next** district (never its
name) → guess the district from a list → see the bar/time/connection → go there, drink, tap "We're in".

Live URL (once GitHub Pages is on): `https://housedodo.github.io/bezirkssaufen/`

---

## Current state

### Done
- Installable offline web app (PWA): story picker, intro, clue + district guessing with hints and "just tell us",
  next-stop screen (bar, planned time, bus/tram leg, Maps link), journal drawer, finale with confetti.
- Progress saved per phone in `localStorage` (`bezirkssaufen.v1`); "Start over" in the ☰ journal.
- Route follows the **JJ Odyssey** plan (Google Sheet "JJ Odyssey"), see [Route](#route).
- **Sara** (paper theme): full story for all 17 districts (encounter, souvenir page, riddle, hint) plus the
  **Bookbazaar** shop (Amazon/eBay-style fake marketplace). At each of the 16 stops with a riddle she sees 4 listings:
  Ottilie's real page (blurb quotes what the locals just said) and 3 dark-romance decoys. Buying the real one →
  "Order confirmed", parcel = souvenir page + riddle + guessing. Buying a decoy → penalty sips (1, 2, 3 … per stop,
  added to `sips`), the book goes into her haul (🌶️ counter in the top bar, listed in the finale).
- **Sarah** (dating theme):
  - 10 teammate profiles with full photos (name/tags/bio *below* the photo, nothing over the face) and round
    face avatars.
  - Like → "It's a match!" → message + riddle. Pass → profile comes back, penalty sips (1, 2, 3 … per pass).
  - 6 "💔 No matches nearby" event challenges (+3 ❤️) and 4 "⚡ Sudden intermission" challenges (+2 ❤️).
  - ❤️ and 🍻 in the top bar; finale shows matches, likes, penalty sips, crew-written bio, super likes.
  - Non-player stops show a chat message from a person in that district.
- Fully played through in a headless phone browser (390×844) after each change: no JS errors, both stories end in
  Lend.

### Not done / ideas
See [Open items](#open-items).

---

## Files

| File | What it is |
|---|---|
| `index.html` | Shell: top bar, progress bar, `<main id="app">`, journal drawer, toast. Loads fonts, `story.js`, `app.js`. |
| `story.js` | **All content**: `DISTRICTS`, `ROUTE`, `STOPS`, `HINT_AFTER`, `GIVE_UP_AFTER`, `CHALLENGES`, `STORIES`, `SARA_SHOP` (end of file). |
| `app.js` | All logic and rendering (one IIFE, template strings into `#app`). |
| `styles.css` | Base + three themes via `body[data-theme]`: `night` (picker), `dating` (Sarah), `paper` (Sara). `ice` theme CSS is legacy/unused. |
| `sw.js` | Service worker, cache name `VERSION`, list of files cached for offline use (incl. all player images). |
| `manifest.webmanifest`, `icons/` | PWA install metadata and icons. |
| `img/players/<name>.jpg` | Full profile photos, 716 px wide (cut from the user's 2×5 image grid, no logos). |
| `img/players/<name>-face.jpg` | 240×240 face crops for avatars. |
| `README.md` | Player/host-facing overview, route table, riddle cheat sheet, Sarah's schedule. **Contains spoilers.** |
| `CLAUDE.md` | This file. |

---

## How the code works

### Content model (`story.js`)
- `ROUTE` — array of district ids in play order. Changing the order means **rewriting riddles** (each riddle
  describes the next district on the route) and the `how` legs in `STOPS`.
- `STOPS[id]` — `{ venue, time, how }`; `how` describes the leg **to** this stop. Shown after a correct guess.
- `STORIES.sarah` / `STORIES.sara` — `name, title, tagline, theme, narrator, clueLabel, intro, stops` (+ Sarah:
  `app: "icebreaker"`, `howTo`).
- `stops[id]` fields:
  - `encounter` (HTML; blank line = new paragraph), `item {icon, name}`, `riddle`, `hint`. Last stop has no riddle
    (its encounter is the finale).
  - Sarah only: `profile {name, age, number, position, photo, face, tags[], bio}` **or** `from {name, avatar}`
    (chat message sender); optional `event: "<challengeKey>"` and/or `intermission: "<challengeKey>"`.
- `CHALLENGES[key]` — `{ type, icon, reward, title, story, … }`. Types:
  - `quiz` — `questions: [{q, options[], answer}]`, app checks, retry on wrong.
  - `confirm` — group-confirm button; optional `lines[]` (with "Another line"), `countdown: true`, `confirmLabel`.
  - `timer` — `seconds`, start button, live clock, unlocks at 0.
  - `write` — `seconds` (optional clock), textarea → saved to `state.myBio`.
  - `notes` — `count` textareas → appended to `state.superLikes`.

- `SARA_SHOP` — `{ name, tip, decoys[30], real{districtId} }`. `decoys[i] = {t, a, d, s(spice 1–5), p}`. At route
  index `step` the shop shows decoys `(step*3+k) % 30` for k=0..2; the real listing sits at position `(step*2+1) % 4`
  and takes its title/icon from the stop's `item`. `real[id] = {p, d, rv}` (price joke, blurb, review). Every Sara stop
  that has a riddle needs a `real` entry (the last stop, Lend, has no shop).
- `STORIES.sara.howTo` overrides the intro's "How it works".

### State (`app.js`, persisted in localStorage `bezirkssaufen.v1`)
`char, phase (pick|intro|clue|travel|done), step, wrong[], hint, log[], liked, passes, evDone, imDone, ch{},
hearts, sips, myBio, superLikes[], solvedGaveUp, bought, shopWrong[], haul[]`. Per-step fields (incl. `bought`, `shopWrong`) are reset by `stepReset()` on arrival; `haul` and `sips` are cumulative.
Adding a new key: add it to `fresh()` so old saved games still load.

### Flow
`render()` → `renderChrome()` + one of `renderPick / renderIntro / renderClue / renderTravel / renderDone`.
For Sarah, `renderClue()` → `renderDatingClue()`, which shows in order: intermission (if any, not done) → event
challenge (if any, not done) → profile swipe (if profile, not liked) → chat message + riddle + guessing.
For Sara, `renderClue()` shows `renderShop()` while `hasShop() && !state.bought`; `buy(id)` handles both outcomes, then the
normal encounter + riddle + guessing screen follows (with an "Order confirmed" ribbon).
`flash()` shows full-screen overlays (match, countdown, +❤️). `set(patch)` saves and re-renders.

### Gotchas we already hit
- Anything that slides off-screen widened the page and broke centred overlays → `html`/`body`/`main` use
  `overflow-x: hidden/clip`. Keep `clip` on `body` (not `hidden`), or the sticky like/pass buttons stop working.
- A timer that keeps re-rendering after hitting 0 makes buttons untappable → live clock interval only runs while
  time is left; `render()` always clears it.
- In the dating theme the arrival toast is disabled (it covered the challenge banner and spoiled the souvenir).

---

## Route

| # | District | Bar | ca. | Getting there | Sarah | Sara |
|---|---|---|---|---|---|---|
| 1 | I Innere Stadt | Auer Schmidtgasse | 09:00 | on foot | Matze #14 | bakery note |
| 2 | VI Jakomini | Sägewerk Sport (Raiffeisenpark) | 10:00 | Tram 5 | Elias #22 | |
| 3 | VII Liebenau | Gotthardt Cafe-Bar, Murpark | 11:00 | Tram 4 | ⚡ emoji → Tomasz #31 | |
| 4 | VIII St. Peter | Cuba Bar/Cafe | 12:00 | Bus 64 | Felix #9 | |
| 5 | IX Waltendorf | Martin Auer, Waltendorfer Hauptstr. 31 | 13:00 | Bus 64 | 💔 biochem quiz | |
| 6 | II St. Leonhard | Martin Auer Schillerplatz | 14:00 | 1 km on foot | 💔 pick-up line | |
| 7 | X Ries | Auer, Ragnitzstraße 91 | 15:00 | Bus 64 + 58 | ⚡ super likes → Marcus #77 | |
| 8 | III Geidorf | Bierbaron | 16:00 | Bus 58 | Luca #4 | |
| 9 | XI Mariatrost | Sorger, Mariatrosterstr. 24 | 17:00 | Bus 58 | 💔 crew writes bio | |
| 10 | XII Andritz | Flowers Cafe Lounge | 18:00 | Bus 58 + 41 | ⚡ no hands → Jonas #17 | |
| 11 | XIII Gösting | Göstinger Hof | 19:00 | Bus 52 | 💔 shot | |
| 12 | XIV Eggenberg | Das Eggenberg | 20:00 | Bus 65 (or taxi) | Nico #8 | |
| 13 | XV Wetzelsdorf | Liwi Pub | 21:00 | Bus 62 | 💔 penalty box | |
| 14 | XVI Straßgang | Clocktower (closes 23:00) | 22:00 | Bus 65 | 💔 goal celebration | |
| 15 | XVII Puntigam | Pools, Bar & Billard (Cineplexx) | 23:00 | Bus 65 | ⚡ bottle cap → Samuel #10 | |
| 16 | V Gries | Die Beate | 00:00 | E5 + 67 | Dragan #55 | |
| 17 | IV Lend | Wherever we wanna verend | 01:00 | on foot | finale (jersey #99) | finale (the book) |

Riddle landmarks per district are listed in `README.md` ("Host cheat sheet").

---

## Testing

There are no automated tests in the repo. Before pushing:
1. `python3 -m http.server 8000` in the repo root, open `http://localhost:8000` in a phone-sized window (390×844).
2. Start each story you touched from "Start over" and play the stops you changed. For Sarah, also try a pass, a wrong
   quiz answer and the penalty-box timer if you touched challenges.
3. Check the browser console for errors.
4. If you have Playwright: a quick script that picks a story, clicks `#start`, then for each step handles
   `.ch-title` challenges, `#like`, `[data-guess='<next id>']` and `#arrive` catches most regressions.

---

## Open items

- **Sheet check**: the "JJ Odyssey" sheet lists Geidorf 17:00 and Mariatrost 16:00, but the route visits Geidorf
  first. The app uses Geidorf 16:00 / Mariatrost 17:00. Confirm.
- **Stop name**: bus 64 stop spelled "Morreehof" and "Morrehof" in the sheet; app uses "Morrehof". Confirm.
- **Clocktower** (Straßgang) closes 23:00, arrival planned 22:00 — no slack.
- **GitHub Pages** not confirmed enabled yet (Settings → Pages → `main` / root).
- **Sara**'s shop is her only mechanic so far; could add book-themed event challenges like Sarah's (e.g. library card expired). Decoy listings are PG-13 parodies — tone up/down as wanted.
- **Lend finale** (both stories) is a plain message — could get a special ending.
- Likes (❤️) are score-only; penalty sips aren't enforced by the app (the group does it).
- Player photos are from a small source image; higher-res versions would look sharper on phones.
- Design mockups (8 style directions, flat illustrated encounters, early photo profiles) live on a private
  Claude design canvas "Icebreaker — Sarah's dating app" in Dominik's account; not in the repo.

---

## Changelog

Newest first. One line per commit: date · short hash (or "this commit") · who · what.

- 2026-10-14 · this commit · Dominik (Claude) · Sara: Bookbazaar shop — buy the right listing among dark-romance decoys to unlock the riddle; wrong buys = penalty sips + haul; new finale stats; cache v7.
- 2026-10-14 · earlier commit · Dominik (Claude) · Added `CLAUDE.md` project handbook with collaboration rules.
- 2026-10-14 · `6bb66bd` · Dominik (Claude) · Sarah: 10 challenges (6 events +3 ❤️, 4 sudden intermissions +2 ❤️), pass penalty sips, ❤️ counter, finale with crew bio and super likes; README schedule.
- 2026-10-14 · `98caddc` · Dominik (Claude) · Sarah: 10 full-photo profiles (Felix, Marcus, Jonas, Nico, Samuel added), info below photo, face avatars, floating like/pass buttons, toasts at top.
- 2026-10-14 · `70ef8b8` · Dominik (Claude) · Sarah's story rebuilt as the Icebreaker dating app (profiles, like/pass, match screen, chat messages).
- 2026-10-14 · `e20f7b9` · Dominik (Claude) · Route switched to the JJ Odyssey plan; all riddles rewritten; `STOPS` with bar/time/connection on the next-stop screen.
- 2026-10-14 · `4b3adf1` · Dominik (Claude) · Initial app: picker, both stories, guessing, hints, journal, offline PWA.
