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
| — | *nothing claimed* | — | — |

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
  - **13 book-themed challenges** (same engine as Sarah's) earning bookmarks 🔖 (stored in `state.hearts`):
    7 "📖 Reading room" events (+2: pop quiz @IX, dramatic reading @II, name that first line @III, back-cover blurb
    @XI, title this bar @XIII, five-star reviews @XV, chapter toast @XVI) and 6 "⚡ Sudden plot twist" intermissions (+1:
    menu poetry @I, Herb impression @VI, one word each @VIII, Herb's nap @III, silence in the library @XIV, book swap
    @V; `SARA_EVENTS` / `SARA_INTERMISSIONS` in `story.js` are authoritative). **Sarah and Sara play at the same time**, so Sara has nothing on a stop where
    Sarah has an intermission, and her intermissions avoid Sarah's events too. Check this when moving any challenge.
    Order at a stop: intermission → event → shop → riddle → guess.
    The blurb and reviews appear in the finale next to the haul.
- **Sarah** (dating theme):
  - 10 teammate profiles with full photos (name/tags/bio *below* the photo, nothing over the face) and round
    face avatars.
  - Like → "It's a match!" → message + riddle. Pass → profile comes back, penalty sips (1, 2, 3 … per pass).
  - 6 "💔 No matches nearby" event challenges (+2 ❤️) and 4 "⚡ Sudden intermission" challenges (+1 ❤️).
  - ❤️ and 🍻 in the top bar; finale shows matches, likes, penalty sips, crew-written bio, super likes.
  - Non-player stops show a chat message from a person in that district.
- Fully played through in a headless phone browser (390×844) after each change: no JS errors, both stories end in
  Lend.

- **Mission alerts** (host → phone notifications): `admin.html` (host panel, PIN-protected via the worker) →
  Cloudflare Worker in `worker/` → Web Push to each girl's iPhone (installed PWA, iOS 16.4+). Push is sent empty
  and the service worker fetches the text from the worker (`/inbox`), so no payload encryption. Quick missions on the
  admin page = **every intermission and event challenge** of both stories (grouped by player, sent to its owner),
  plus free text. A challenge notification is a **surprise mission**: the worker stores `{title, body, ch, id}`, the
  service worker shows it, and tapping it opens the app with `?mission=<challengeKey>&mid=<id>` (or `postMessage` if
  the app is open). `app.js` `receiveMission()` sets `state.bonus`; `render()` shows it via `renderChallenge(key,
  "surprise")` before the normal screen, progress in its own `state.bch`, reward goes to `hearts`, `state.missions`
  remembers finished ids (a tapped mission can't be redone). **Admin page safety:** pick the recipient first (Sarah /
  Sara / Both, colour-coded banner "Sending to: …"); the mission list then only shows what fits (Sarah's own, Sara's
  own, or the 8 **shared missions** for Both) and the confirm dialog repeats the recipient. Shared missions are
  `CHALLENGES` keys `d_*` with `shared: true` at the end of `story.js` (never attached to a stop, theme-neutral text). "Not now" pauses it and shows a 🎯 pill (`#mission-pill`). Inactive until
  `push-config.js` is filled in (the app hides the alerts card). Setup: `worker/README.md`.

- **Wallet** (❤️ Sarah / 🔖 Sara, `state.hearts`; `state.earned` = total ever earned, shown in the finale). Earning is
  deliberately slow: events +2, intermissions +1, shared missions +2/+1, quizzes −1 per wrong answer (min +1). Spending
  (`COSTS` in `story.js`): 💡 buy a hint before a wrong guess unlocks it (1) · 🧾 cancel the penalty sips of the current
  stop (2, Sarah's passes / Sara's wrong orders, tracked in `state.sipsStep`) · ⏭ skip an event/intermission, no reward
  (3) · 🔍 Sara: mark the real Bookbazaar listing (2). Surprise missions can't be skipped, only paused.
- **Step sync** ("only if both found the district, both continue"): after a correct guess or "just tell us",
  `solve()` sets `state.waiting`; `renderWaiting()` polls worker `POST /solved {who, step}` every 3 s until it answers
  `both` (or the host `released` the step) and only then shows the next-stop screen. Switch it off with
  `syncSteps: false` in `push-config.js`; without a `workerUrl` it is off automatically. If the worker can't be
  reached for 4 polls the phone offers "continue anyway". Admin page section "3 · Game sync" shows who is waiting,
  has "Let them through" per step and "Reset all progress" (**press it before the game**; KV data also expires after
  48 h; the in-app "Start over" does not touch the worker).

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
| `admin.html` | Host panel (not linked from the app, `noindex`). Needs the worker + PIN. |
| `push-config.js` | `self.PUSH = {workerUrl, vapidPublicKey}`; read by page and service worker. Empty = alerts off. |
| `worker/` | Cloudflare Worker (`worker.js`), VAPID key generator, `wrangler.toml`, setup guide. Not loaded by the game. |
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

- `SARA_CHALLENGES` do not exist as a separate object: Sara's challenges are added to `CHALLENGES` with keys `s_*`
  (end of `story.js`) and attached to stops via `SARA_EVENTS` / `SARA_INTERMISSIONS` (district id → key). Extra
  optional challenge fields: `fieldLabel` (write), `noteLabel` (notes), `clockSub`, `doneLabel` (timer).

### State (`app.js`, persisted in localStorage `bezirkssaufen.v1`)
`char, phase (pick|intro|clue|travel|done), step, wrong[], hint, log[], liked, passes, evDone, imDone, ch{},
hearts (❤️ for Sarah, 🔖 for Sara), bonus, bch, missions[], sips, myBio, superLikes[], solvedGaveUp, bought, shopWrong[], haul[]`. Per-step fields (incl. `bought`, `shopWrong`) are reset by `stepReset()` on arrival; `haul` and `sips` are cumulative.
Adding a new key: add it to `fresh()` so old saved games still load.

### Flow
`render()` → `renderChrome()` + one of `renderPick / renderIntro / renderClue / renderTravel / renderDone`.
For Sarah, `renderClue()` → `renderDatingClue()`, which shows in order: intermission (if any, not done) → event
challenge (if any, not done) → profile swipe (if profile, not liked) → chat message + riddle + guessing.
For Sara, `renderClue()` first shows a pending intermission/event via `renderChallenge()`, then `renderShop()` while `hasShop() && !state.bought`; `buy(id)` handles both outcomes, then the
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
- **Mission alerts** need the one-time Cloudflare setup in `worker/README.md` and a real-iPhone test (only unit-tested with mocks; Web Push can't run headless). Do it the day before.
- **Step sync** and mission alerts are only tested with mocks: do a real two-phone run the evening before (and press "Reset all progress" in the admin page afterwards).
- **GitHub Pages** not confirmed enabled yet (Settings → Pages → `main` / root).
- Sara's challenge texts (dramatic-reading lines, decoy titles) are PG-13 parodies — tone up/down as wanted.
- Sara's timers (45 s / 60 s) and the 90 s blurb are untested on a real phone with real hands; adjust `seconds` if too long/short.
- **Lend finale** (both stories) is a plain message — could get a special ending.
- Likes (❤️) are score-only; penalty sips aren't enforced by the app (the group does it).
- Player photos are from a small source image; higher-res versions would look sharper on phones.
- Design mockups (8 style directions, flat illustrated encounters, early photo profiles) live on a private
  Claude design canvas "Icebreaker — Sarah's dating app" in Dominik's account; not in the repo.

---

## Changelog

Newest first. One line per commit: date · short hash (or "this commit") · who · what.

- 2026-10-14 · this commit · Dominik (Claude) · Wallet: spend ❤️/🔖 on hints, cancelling sips, skipping challenges, revealing Sara's real listing (`COSTS`); rewards lowered (events +2, intermissions +1, quizzes −1 per miss); step sync: neither girl continues until both solved the stop (worker `/solved`, `/progress`, `/release`, `/reset`, admin sync panel; **redeploy `worker/worker.js`**); cache v14.
- 2026-10-14 · earlier commit · Dominik (Claude) · 8 shared "both do it" missions (`d_*`: clink, twin selfie, drink swap, compliment battle, dance-off, staring contest, rock-paper-scissors, birthday wishes); admin page now picks the recipient first and only lists matching missions; cache v13.
- 2026-10-14 · earlier commit · Dominik (Claude) · Surprise missions: admin lists every intermission/event per player; tapping the notification opens that challenge in the app (reward counts, once per mission, "not now" pill); worker stores `ch`+`id` (**redeploy `worker/worker.js` in Cloudflare**); cache v12.
- 2026-10-14 · `d7ca3cc`+ · Dominik (Claude) · `push-config.js` filled in (worker URL + VAPID public key) so mission alerts are active; cache v11.
- 2026-10-14 · `d98eaf6` · Dominik (Claude) · Host panel `admin.html` + Cloudflare Worker (`worker/`) sending Web Push missions to Sarah/Sara/both; push card in intro + ☰ drawer; `push-config.js`; service worker push handler; cache v10.
- 2026-10-14 · `9d1bfbb` · Dominik (Claude) · Sara: now 13 challenges (+ name that first line, menu poetry, Herb impression); re-slotted so Sara's challenges never overlap Sarah's intermissions (and her intermissions avoid Sarah's events); cache v9.
- 2026-10-14 · `92f3b2a` · Dominik (Claude) · Sara: 10 book-themed challenges (6 reading-room events +3 🔖, 4 plot-twist intermissions +2 🔖), paper-theme styling, finale shows blurb + reviews + bookmarks; challenge engine generalised for both stories (unit icon, labels); cache v8.
- 2026-10-14 · `e86a442` · Dominik (Claude) · Sara: Bookbazaar shop — buy the right listing among dark-romance decoys to unlock the riddle; wrong buys = penalty sips + haul; new finale stats; cache v7.
- 2026-10-14 · earlier commit · Dominik (Claude) · Added `CLAUDE.md` project handbook with collaboration rules.
- 2026-10-14 · `6bb66bd` · Dominik (Claude) · Sarah: 10 challenges (6 events +3 ❤️, 4 sudden intermissions +2 ❤️), pass penalty sips, ❤️ counter, finale with crew bio and super likes; README schedule.
- 2026-10-14 · `98caddc` · Dominik (Claude) · Sarah: 10 full-photo profiles (Felix, Marcus, Jonas, Nico, Samuel added), info below photo, face avatars, floating like/pass buttons, toasts at top.
- 2026-10-14 · `70ef8b8` · Dominik (Claude) · Sarah's story rebuilt as the Icebreaker dating app (profiles, like/pass, match screen, chat messages).
- 2026-10-14 · `e20f7b9` · Dominik (Claude) · Route switched to the JJ Odyssey plan; all riddles rewritten; `STOPS` with bar/time/connection on the next-stop screen.
- 2026-10-14 · `4b3adf1` · Dominik (Claude) · Initial app: picker, both stories, guessing, hints, journal, offline PWA.
