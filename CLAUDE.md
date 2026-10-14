# Heated Pages (repo: bezirkssaufen) — project handbook

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
6. **Bump the cache** (`VERSION` in `sw.js`, currently v25) whenever any file the phones load changes — otherwise
   installed phones keep the old version. (The host app has its own `ADMIN_VERSION` in `admin-sw.js`; it is network-first,
   so bump it only when its cached file list changes.)
7. **No build step, no frameworks, no npm.** Plain HTML/CSS/JS so it runs offline on two phones. Keep it that way
   unless both agree. The one exception with a deploy step is `worker/worker.js`: it is **pasted into the Cloudflare
   dashboard by hand** (Worker → Edit code → Deploy). Every change to it needs a redeploy; say so in the changelog.
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

A birthday game for a pub crawl ("Heated Pages", formerly "Bezirkssaufen", the **JJ Odyssey**) through all 17 districts of Graz, one drink
per district. Two birthday girls each play their own story on their own phone:

- **Sarah — "The Hunt for #99"**, built as a fake dating app called **Icebreaker**. She chases
  Jakob "Iceman" Eisner (#99), a hockey player who is always one bar ahead. His teammates are dating profiles.
- **Sara — "The Last Copy"**: chases travelling bookseller Ottilie Pfotenhauer (cats: **Herbert the Gracious** and **Kafka the Schlimm**, neither is fat), who has the last copy
  of *The Library of Herbert and Kafka*. Old-bookshop paper look.

In each district: read what happened → get a riddle describing the area around the **next** district (never its
name) → guess the district from a list → see the bar/time/connection → go there, drink, tap "We're in".

Live URL (once GitHub Pages is on): `https://housedodo.github.io/bezirkssaufen/`

---

## Current state

### Done
- Installable offline web app (PWA): story picker, intro, clue + district guessing with hints (a district can never be skipped: there is no "just tell us"),
  next-stop screen (bar, planned time, bus/tram leg, Maps link), journal drawer, finale with confetti.
- **Install card** on the story picker and in the ☰ drawer: Android Chrome gets a real "Install" button (`beforeinstallprompt`), other Android browsers a menu hint, iPhone the Share → Add to Home Screen hint; hidden once installed (standalone) and on desktop.
- Progress saved per phone in `localStorage` (`bezirkssaufen.v1`); "Start over" in the ☰ journal.
- Route follows the **JJ Odyssey** plan (Google Sheet "JJ Odyssey"), see [Route](#route).
- **Sara** (paper theme): full story for all 17 districts (encounter, souvenir page, riddle, hint) plus the
  **Bookbazaar** shop (Amazon/eBay-style fake marketplace). At each of the 16 stops with a riddle she sees 4 listings
  that all look alike (same layout, no seller/"only 1 left"/special cover): Ottilie's **disguised** real book (a
  dark-romance-style title whose blurb only echoes what the local just said), 2 generic decoys and **one real listing of
  another stop** (always sold out), so the puzzle is matching a blurb to *this* stop's encounter. The slot of the real
  one follows an irregular fixed list (`REAL_SLOT`). Buying the real one → "Order confirmed", parcel = souvenir page +
  riddle + guessing. A wrong order costs penalty sips (1, 2, 3 … per stop, `sips`) and shows either a **weird
  dark-romance passage** from that book (the book goes into her haul, 🌶️ counter, finale) or an **"unfortunately sold
  out"** notice (no haul); that listing is then greyed out ("Owned" / "Sold out"). "Reveal the real listing" costs 2 🔖.
  - **13 book-themed challenges** (same engine as Sarah's) earning bookmarks 🔖 (stored in `state.hearts`):
    8 "📖 Reading room" events (+2: pop quiz @IX, dramatic reading @II, name that first line @III, menu poetry @VIII,
    back-cover blurb @XI, title this bar @XIII, five-star reviews @XV, chapter toast @XVI) and 5 "⚡ Sudden plot twist"
    intermissions (+1: Herbert impression @VI, one word each @VIII, Herbert's nap @III, silence in the library @XIV, book
    swap @V; `SARA_EVENTS` / `SARA_INTERMISSIONS` in `story.js` are authoritative). **Stop I (Innere Stadt) is only the
    introduction: no challenges for either girl, they start from the 2nd district.** **Sarah and Sara play at the same
    time**, so Sara has nothing on a stop where Sarah has an intermission, and her intermissions avoid Sarah's events too.
    Check this when moving any challenge. (Total separation is impossible: 23 challenges, 15 stops.)
    Order at a stop: intermission → event → shop → riddle → guess.
    The blurb and reviews appear in the finale next to the haul.
- **Sarah** (dating theme):
  - 10 teammate profiles with full photos (name/tags/bio *below* the photo, nothing over the face) and round
    face avatars.
  - Like → "It's a match!" → **Tinder-style chat** (`renderChat`): he texts hi (typing dots), she answers anything, he asks
    whether she's looking for the ice hockey guy, she answers anything, then "doesn't matter actually, here's what I
    heard" + his bio text; only then the riddle and the guess appear. Texts are per guy (`SARAH_FLIRT` in `story.js`).
  - Pass → penalty sips (1, 2, 3 … per pass) and a **10-second timeout** (`renderTimeout`, `state.timeoutUntil`, survives a
    reload): blurred photo, countdown, no buttons, a different joke per guy and per pass (3 each, e.g. "Beggars can't be
    choosers"); then the profile comes back.
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
  the app is open). The service worker never hands a mission to the host app's window (`admin.html` is on the same
  origin): it picks the game window (focused, else visible, else first non-admin) or opens the game. **Safety net:**
  `checkInbox()` (on start and whenever the app becomes visible) asks the worker `/inbox` for the latest message and
  shows a mission sent in the last 45 minutes that wasn't done yet, so it works even if the tap handoff fails. `app.js` `receiveMission()` sets `state.bonus`; `render()` shows it via `renderChallenge(key,
  "surprise")` before the normal screen in **every phase except `pick`** (so also in the lobby and the intro; a mission that
  arrives while choosing the name waits and appears right after; the lobby keeps polling for the game start underneath), progress in its own `state.bch`, reward goes to `hearts`, `state.missions`
  remembers finished ids (a tapped mission can't be redone). **Admin page safety:** pick the recipient first (Sarah /
  Sara / Both, colour-coded banner "Sending to: …"); the mission list then only shows what fits (Sarah's own, Sara's
  own, or the 8 **shared missions** for Both) and the confirm dialog repeats the recipient. Shared missions are
  `CHALLENGES` keys `d_*` with `shared: true` at the end of `story.js` (never attached to a stop, theme-neutral text). "Not now" pauses it and shows a 🎯 pill (`#mission-pill`). Inactive until
  `push-config.js` is filled in (the app hides the alerts card). Setup: `worker/README.md`.

- **Wallet** (❤️ Sarah / 🔖 Sara, `state.hearts`; `state.earned` = total ever earned, shown in the finale). Earning is
  deliberately slow: events +2, intermissions +1, shared missions +2/+1, quizzes −1 per wrong answer (min +1). Spending
  (`COSTS` in `story.js`): 💡 buy a hint before a wrong guess unlocks it (1) · 🧾 cancel the penalty sips of the current
  stop (2, Sarah's passes / Sara's wrong orders, tracked in `state.sipsStep`) · 🎭 make someone else do an event/intermission challenge instead of you (3): they pick a victim from the crew, the group
  confirms it, no reward for the payer · 🔍 Sara: mark the real Bookbazaar listing (2). Surprise missions can't be delegated, only paused.
- **Step sync** ("only if both found the district, both continue"): after a correct guess,
  `solve()` sets `state.waiting`; `renderWaiting()` polls worker `POST /solved {who, step}` every 3 s until it answers
  `both` (or the host `released` the step) and only then shows the next-stop screen. Switch it off with
  `syncSteps: false` in `push-config.js`; without a `workerUrl` it is off automatically. If the worker can't be
  reached for 4 polls the phone offers "continue anyway". Admin page section "3 · Game sync" shows who is waiting,
  has "Let them through" per step and "Reset all progress" (**press it before the game**; KV data also expires after
  48 h; the in-app "Start over" does not touch the worker).

- **Lobby + Start game**: after installing and choosing a name (`pick`) a phone goes to phase `lobby`: a funny "🚧 Under
  construction" screen (rotating `LOBBY_LINES`, nothing clickable except "Not Sara? Pick again"; no top bar). It polls
  worker `GET /game` every 5 s (and on app focus) and unlocks into `intro` by itself. The host presses **🚀 Start the
  game** in `admin.html` (`POST /start`): the worker stores `game`, sends a "🎂 The game has started!" push to both
  phones, and the lobbies unlock. In `intro` (kept deliberately short, it fits one phone screen: title, a ~40-word story the girl **reads out loud to the table**, the first clue, the Start button; "How does it work?" is folded away and there is no notification card here) each girl reads her story and **the first clue to the meeting point** (`firstClue`
  in `story.js`: blacksmith lane near the main square → Auer Schmidtgasse; free hint + Maps link) and, once sitting at
  Auer, presses **Start the quest** (→ stop I: Bookbazaar / dating profile). Off with `lobby: false` in `push-config.js`
  or when no `workerUrl` is set. Emergency exit if the server is down: tap the 🚧 7 times. "Reset all progress" in the
  admin page also puts the game back to "not started" (only matters for phones that haven't entered yet).

- **Host app**: `admin.html` can be installed on its own as "Heated Host" (own name, teal icon with gold star badge,
  own manifest `admin.webmanifest` with scope `admin.html`, own service worker `admin-sw.js`; install button/hint at
  the top of the page; opens offline). It does not interfere with the game's app.
- **Name and look**: the game is called **Heated Pages** (picker logo "HEATED / PAGES", kicker "Enemies to lovers · 17
  districts · 17 drinks"). Icon: ice/fire split heart with a crack, crossed hockey sticks, open book with a dog-eared page,
  sparkles. Internal names (repo `bezirkssaufen`, localStorage key, cache names, Worker) keep the old name on purpose.

### Not done / ideas
See [Open items](#open-items).

---

## Infrastructure

- **GitHub Pages** serves `main`: game `https://housedodo.github.io/bezirkssaufen/`, host panel `.../admin.html`.
- **Cloudflare Worker** `bezirkssaufen` (`https://bezirkssaufen.domi-dominkovic.workers.dev`), code = `worker/worker.js`
  pasted into the dashboard. KV binding `KV`; variables `VAPID_PUBLIC`, `VAPID_SUBJECT`; secrets `ADMIN_PIN`,
  `VAPID_PRIVATE_JWK`. Setup guide: `worker/README.md`. Endpoints (admin = `Authorization: Bearer <PIN>`):

| Endpoint | Who | What |
|---|---|---|
| `POST /subscribe {who, sub}` | phone | registers the push subscription of Sarah or Sara |
| `POST /inbox {endpoint}` | service worker | returns the latest `{title, body, ch, id}` for that phone after an empty push |
| `POST /send {to, title, body, ch?}` | admin | notification to sarah / sara / both; `ch` = challenge key → surprise mission |
| `GET /status` | admin | registered phones per player, game started? |
| `POST /solved {who, step}` | phone | step sync: marks "solved" and answers `{both, released, other}` |
| `GET /progress`, `POST /release {step}` | admin | who solved what; let both continue anyway |
| `GET /game` | phone | `{started}` for the lobby |
| `POST /start` | admin | starts the game, pushes "The game has started!" to both |
| `POST /reset` | admin | clears all progress and the started flag (KV data also expires after 48 h) |

---

## Files

| File | What it is |
|---|---|
| `index.html` | Shell: top bar, progress bar, `<main id="app">`, journal drawer, toast, `#mission-pill`. Loads fonts, `story.js`, `push-config.js`, `app.js`. |
| `story.js` | **All content**: `DISTRICTS`, `ROUTE`, `STOPS`, `HINT_AFTER`, `CHALLENGES`, `STORIES`, `SARA_SHOP` (end of file). |
| `app.js` | All logic and rendering (one IIFE, template strings into `#app`). |
| `styles.css` | Base + three themes via `body[data-theme]`: `night` (picker), `dating` (Sarah), `paper` (Sara). `ice` theme CSS is legacy/unused. |
| `admin.html` | Host panel (not linked from the app, `noindex`). Needs the worker + PIN. Installable as its own app ("Heated Host"): `admin.webmanifest` (scope `admin.html`), `admin-sw.js` (own small service worker, scope `admin.html`, network-first, `ADMIN_VERSION`), teal icon with a gold star badge `icons/admin-*` (same artwork as the game icon). Install button/hint at the top of the page. |
| `push-config.js` | `self.PUSH = {workerUrl, syncSteps, lobby, vapidPublicKey}`; read by page, admin page and service worker. Empty `workerUrl` = alerts, lobby and step sync all off (the game then runs standalone). `syncSteps: false` / `lobby: false` switch those two off individually. |
| `worker/` | Cloudflare Worker (`worker.js`), VAPID key generator, `wrangler.toml`, setup guide. Not loaded by the game. |
| `sw.js` | Game service worker: cache name `VERSION`, list of files cached for offline use (incl. all player images, `push-config.js`), `importScripts("push-config.js")`, and the Web Push handlers (`push` → asks the worker `/inbox` for the text → notification; `notificationclick` → opens/focuses the app with `?mission=<key>&mid=<id>` or `postMessage`). |
| `manifest.webmanifest`, `icons/` | PWA install metadata and icons. Name "Heated Pages" (short name the same). Icon = ice/fire split heart with a crack, crossed hockey sticks, open book with a dog-eared page, sparkles (`icons/icon.svg`; the PNGs are rendered from the same drawing as a full-bleed square so they work as maskable icons). |
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

- `SARA_SHOP` — `{ name, tip, decoys[30], passages{decoyIndex}, soldOut[6], real{districtId} }`. `decoys[i] = {t, a, d,
  s(spice 1–5), p}`; `passages[i]` = the weird excerpt shown when that decoy is delivered (a decoy without one is "sold
  out"; `soldOut[]` are the notices, handed out in turn). `real[id] = {t, a, d, s, p}`: the *disguised* listing of that
  stop; its blurb `d` must echo the stop's encounter without quoting it. At route index `step` the shop shows decoys
  `(step*2+k) % 30` for k=0,1, one real listing of another stop (`others[(step*5+3) % …]`, always sold out) and the real one
  at slot `REAL_SLOT[step]` (app.js). The souvenir is still the stop's `item`. Every Sara stop that has a riddle needs a
  `real` entry (the last stop, Lend, has no shop).
- `STORIES.sara.howTo` overrides the intro's "How it works".
- `STORIES.<who>.intro` must stay short (it is read aloud before the game starts, 2 short paragraphs); long explanations belong in `howTo`, which is folded away in the intro.
- `SARAH_FLIRT` (end of `story.js`) — per district id of a profile: `pass[3]` (timeout jokes), `hi`, `ask`, `reveal` (chat
  script); copied onto `profile.passLines` and `profile.chat`. Nico's `hi` carries the joke about the ex-#99 crying on Insta ("so cringe"). The chat's last bubble is the profile's `bio`.
- `STORIES.<who>.firstClue` — `{label, text, hint}`: the clue to the first meeting point (Auer, Schmidtgasse) shown in the
  intro after the host starts the game. `LOBBY_LINES` — rotating jokes on the "Under construction" screen.
- `COSTS` — `{hint, cancel, delegate, reveal}`: what the points can buy (see Wallet above). `HINT_AFTER` — wrong guesses
  after which the hint is free. There is no "give up" any more, a district must always be guessed.

- `SARA_CHALLENGES` do not exist as a separate object: Sara's challenges are added to `CHALLENGES` with keys `s_*`
  (end of `story.js`) and attached to stops via `SARA_EVENTS` / `SARA_INTERMISSIONS` (district id → key). Extra
  optional challenge fields: `fieldLabel` (write), `noteLabel` (notes), `clockSub`, `doneLabel` (timer), `shared: true`
  (only for the 8 `d_*` missions the host can send to both girls; never attached to a stop). Rewards: events +2,
  intermissions +1 (shared: +2/+1); a quiz pays `max(1, reward − wrong answers)`.

### State (`app.js`, persisted in localStorage `bezirkssaufen.v1`; the key keeps the old game name on purpose, renaming it would wipe saved games)
`char, phase (pick|lobby|intro|clue|travel|done), step, wrong[], hint, log[], liked, passes, evDone, imDone, ch{},
hearts (wallet: ❤️ Sarah / 🔖 Sara, earned minus spent), earned (total ever earned), timeoutUntil (Sarah's 10 s timeout), chat[] (Sarah's chat messages), sips, sipsStep (sips added at this stop),
revealed (Sara: real listing marked), waiting (solved, waiting for the other phone), bonus, bch, missions[] (surprise
missions), myBio, superLikes[], bought, shopWrong[], haul[], solvedGaveUp (legacy, always false)`.
Per-step fields are reset by `stepReset()` on arrival: `wrong, hint, liked, passes, evDone, imDone, ch, solvedGaveUp,
bought, shopWrong, sipsStep, revealed, waiting, timeoutUntil, chat`. Cumulative: `hearts, earned, sips, haul, myBio, superLikes` and the
surprise-mission keys `bonus, bch, missions`. Adding a new key: add it to `fresh()` so old saved games still load.

### Flow
Phases: `pick` (choose a name) → `lobby` ("Under construction", only while the worker says the game hasn't started) →
`intro` (story + first clue, "Start the quest" at Auer) → `clue` ⇄ `travel` per stop → `done` (finale at Lend).
`render()` clears the intervals (`tick` for timers, `pollT` step sync, `lobbyT`/`lobbyL` lobby), runs `renderChrome()`, shows a
pending surprise mission first (`renderChallenge(key, "surprise")`, see Mission alerts), otherwise one of
`renderPick / renderLobby / renderIntro / renderClue / renderTravel (→ renderWaiting while state.waiting) / renderDone`.
For Sarah, `renderClue()` → `renderDatingClue()`, which shows in order: intermission (if any, not done) → event
challenge (if any, not done) → profile swipe (`renderTimeout()` for 10 s after a pass) → once liked, the chat
(`renderChat()`: his messages appear after typing dots, her turn shows the composer; messages live in `state.chat`; when his
4th message is in, riddle + guess follow) → for non-player stops a plain chat message + riddle + guessing.
For Sara, `renderClue()` first shows a pending intermission/event via `renderChallenge()`, then `renderShop()` while
`hasShop() && !state.bought`; `buy(id)` handles both outcomes, then the normal encounter + riddle + guessing screen
follows (with an "Order confirmed" ribbon).
`solve()` → (`waiting` if step sync is on) → next-stop screen → "We're in" → `stepReset()`.
`flash()` shows full-screen overlays (match, countdown, +❤️); `modal()` shows a card the player must close (Sara's passage / sold-out). `set(patch)` saves and re-renders. Startup also runs
`pushSync()` (re-registers the push subscription) and handles `?mission=` / service-worker messages (`receiveMission()`).
Install cards: `installSlot()` / `fillInstall()`; push card: `pushSlot()` / `fillPush()`.

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
| 1 | I Innere Stadt | Auer Schmidtgasse | 09:00 | on foot | Matze #14 | intro only (no challenges) · Bookbazaar |
| 2 | VI Jakomini | Sägewerk Sport (Raiffeisenpark) | 10:00 | Tram 5 | Elias #22 | ⚡ Herbert impression |
| 3 | VII Liebenau | Gotthardt Cafe-Bar, Murpark | 11:00 | Tram 4 | ⚡ emoji → Tomasz #31 | — |
| 4 | VIII St. Peter | Cuba Bar/Cafe | 12:00 | Bus 64 | Felix #9 | ⚡ one word each · 📖 menu poetry |
| 5 | IX Waltendorf | Martin Auer, Waltendorfer Hauptstr. 31 | 13:00 | Bus 64 | 💔 biochem quiz | 📖 Herbert's pop quiz |
| 6 | II St. Leonhard | Martin Auer Schillerplatz | 14:00 | 1 km on foot | 💔 pick-up line | 📖 dramatic reading |
| 7 | X Ries | Auer, Ragnitzstraße 91 | 15:00 | Bus 64 + 58 | ⚡ super likes → Marcus #77 | — |
| 8 | III Geidorf | Bierbaron | 16:00 | Bus 58 | Luca #4 | ⚡ Herbert's nap · 📖 name that first line |
| 9 | XI Mariatrost | Sorger, Mariatrosterstr. 24 | 17:00 | Bus 58 | 💔 crew writes bio | 📖 back cover blurb |
| 10 | XII Andritz | Flowers Cafe Lounge | 18:00 | Bus 58 + 41 | ⚡ no hands → Jonas #17 | — |
| 11 | XIII Gösting | Göstinger Hof | 19:00 | Bus 52 | 💔 shot | 📖 title this bar |
| 12 | XIV Eggenberg | Das Eggenberg | 20:00 | Bus 65 (or taxi) | Nico #8 | ⚡ silence in the library |
| 13 | XV Wetzelsdorf | Liwi Pub | 21:00 | Bus 62 | 💔 penalty box | 📖 five-star reviews |
| 14 | XVI Straßgang | Clocktower (closes 23:00) | 22:00 | Bus 65 | 💔 goal celebration | 📖 chapter toast |
| 15 | XVII Puntigam | Pools, Bar & Billard (Cineplexx) | 23:00 | Bus 65 | ⚡ bottle cap → Samuel #10 | — |
| 16 | V Gries | Die Beate | 00:00 | E5 + 67 | Dragan #55 | ⚡ book swap |
| 17 | IV Lend | Wherever we wanna verend | 01:00 | on foot | finale (jersey #99) | finale (the book) |

Riddle landmarks per district are listed in `README.md` ("Host cheat sheet"). Sara's challenges are placed so that none lands on a
stop where Sarah has an intermission (⚡) and her ⚡ avoid Sarah's 💔; stop 1 is only the introduction for both.
Sara's reward values: 📖 +2, ⚡ +1. Sarah: 💔 +2, ⚡ +1.

---

## Testing

There is no automated test suite in the repo. Before pushing:
1. `python3 -m http.server 8000` in the repo root, open `http://localhost:8000` in a phone-sized window (390×844).
2. Start each story you touched from "Start over" and play the stops you changed. For Sarah, also try a pass, a wrong
   quiz answer and the penalty-box timer if you touched challenges.
3. Check the browser console for errors.
4. **`push-config.js` points at the real Worker**, so a local run will wait in the lobby and at step sync. Either set
   `lobby: false` / `syncSteps: false` temporarily (don't commit that) or, with Playwright, intercept
   `https://bezirkssaufen.domi-dominkovic.workers.dev/**`: `GET /game` → `{"started":true}`, `POST /solved` →
   `{"both":true}`, everything else → `{}` (with `access-control-allow-origin: *`). Fake push state with
   `localStorage['bezirkssaufen.v1']` (e.g. `{char:'sara',phase:'clue',step:4,hearts:10}`).
5. Playwright (preinstalled Chromium at `/opt/pw-browsers/chromium`, `serviceWorkers:'block'` for app tests): pick a story,
   click `#start`, then for each step handle `.ch-title` challenges (quiz: `.q-opt:not([disabled])`, write: `#bio`,
   notes: `[data-note]`, timer: `#startclock`, countdown: `#countdown`, else `#confirm`; wait out the `.match-overlay`
   flashes ~1.9 s), the Sara shop (`[data-buy=real]`), `#like`, `[data-guess='<next id>']` and `#arrive`. Shorten timers in
   the test with `CHALLENGES[k].seconds = 1`. This catches most regressions.
6. Worker: import `worker/worker.js` in Node and call `worker.fetch(new Request(...), env)` with a Map-backed fake KV
   (`get/put/delete/list`) and a stubbed global `fetch` for the push endpoints.
7. Installability: Chromium `Page.getInstallabilityErrors` via CDP should only report `in-incognito` in a test context.

---

## Open items

- **Sheet check**: the "JJ Odyssey" sheet lists Geidorf 17:00 and Mariatrost 16:00, but the route visits Geidorf
  first. The app uses Geidorf 16:00 / Mariatrost 17:00. Confirm.
- **Stop name**: bus 64 stop spelled "Morreehof" and "Morrehof" in the sheet; app uses "Morrehof". Confirm.
- **Clocktower** (Straßgang) closes 23:00, arrival planned 22:00 — no slack.
- **Real-device test** of mission alerts, step sync, lobby and Start game on the two iPhones (everything was only tested with mocks; Web Push can't run headless). Do it the evening before.
- **Is the deployed Worker current?** Open `https://bezirkssaufen.domi-dominkovic.workers.dev/game`: `{"started":…}` = current version, `{"error":"not found"}` = an old one that still needs the paste-and-deploy from `worker/worker.js`.
- **Worker redeploy**: after any change to `worker/worker.js` paste it into the Cloudflare dashboard (Edit code → Deploy). If a Git repo is connected under Worker → Settings → Builds, disconnect it, otherwise a push to `main` could overwrite the pasted code.
- **Secrets**: `ADMIN_PIN` and the VAPID private key live only in Cloudflare (never commit them). The VAPID private key was pasted once into a Claude chat; rotate it after the party if that matters (new keys: `node worker/gen-vapid.mjs`, update `VAPID_PUBLIC`, `VAPID_PRIVATE_JWK` and `push-config.js`).
- **Game day order**: (0) install the host app once, (1) both girls install + choose their name, (2) press "Reset all progress + back to the lobby" in admin.html, (3) at the start press "Start the game". Android install only works from a normal Chrome tab (not private, not Edge/Samsung).
- **After the test run** press "Reset all progress + back to the lobby" in the admin page.
- **GitHub Pages** not confirmed enabled yet (Settings → Pages → `main` / root).
- Sara's challenge texts (dramatic-reading lines, decoy titles) are PG-13 parodies — tone up/down as wanted.
- Sara's timers (45 s / 60 s) and the 90 s blurb are untested on a real phone with real hands; adjust `seconds` if too long/short.
- **Lend finale** (both stories) is a plain message — could get a special ending.
- Penalty sips aren't enforced by the app (the group does it); hearts/bookmarks can be spent, see Wallet.
- Player photos are from a small source image; higher-res versions would look sharper on phones.
- Design mockups (8 style directions, flat illustrated encounters, early photo profiles) live on a private
  Claude design canvas "Icebreaker — Sarah's dating app" in Dominik's account; not in the repo.

---

## Changelog

Newest first (the commits that only claim work in the table above are not listed). One line per commit: date · short hash (or "this commit") · who · what.

- 2026-10-14 · this commit · Dominik (Claude) · Much less text at the start: each intro is now a ~40-word story to read out loud ("📣 Read this out loud to the table"), a shorter first clue and the Start button on one screen; "How does it work?" folded away, notification card removed from the intro, shorter lobby card. Nico's chat opener now jokes about the ex-#99 crying on Insta ("so cringe"). Cache v25.
- 2026-10-14 · `f4e2a9b` · Dominik (Claude) · Sarah: 10 s timeout after a pass with a different joke per guy and pass; after a like a Tinder-style chat (hi → her reply → "looking for the ice hockey guy?" → her reply → "doesn't matter, here's what I heard" + tip) before the riddle. Sara: a wrong order now shows a weird dark-romance passage or an "unfortunately sold out" notice; the real book is disguised (same look as all listings, blurb only echoes the encounter) and one real listing of another stop is mixed in as an always-sold-out decoy; the real slot varies irregularly; cache v24.
- 2026-10-14 · `c39ea52` · Dominik (Claude) · Fix: tapping a mission notification did nothing. The service worker could hand the mission to the open admin window (same origin) instead of the game, and missions were hidden in the lobby/intro. Now: admin window is skipped, missions show in every phase except the name picker, new inbox safety net (`checkInbox`), lobby keeps polling for the game start under a mission screen; cache v23. No Worker change.
- 2026-10-14 · `f87806e` · Dominik (Claude) · Handbook audit: state keys and phases (lobby, waiting), flow, files, new Infrastructure section (Pages, Worker, endpoints, secrets), route table now lists Sara's challenges, testing recipes (mocking the Worker, Playwright selectors), open items (real-device test, Worker redeploy, secrets), real commit hashes in the changelog.
- 2026-10-14 · `afbd11e` · Dominik (Claude) · Host panel is installable as its own app "Heated Host" (own manifest, teal icon with star badge, own service worker, install button, opens offline); the game's app is unaffected.
- 2026-10-14 · `e795fc9` · Dominik (Claude) · Name shortened to two words: "Heated Pages" (heated = rivalry/spice, pages = book nerd) in picker logo, page title, manifest, home-screen name, notification-settings hint, README, handbook; icon unchanged; cache v22.
- 2026-10-14 · `cb42b59` · Dominik (Claude) · Name extended with the book-nerd side: "Icebreakers, Heated Rivalries & Dog-Eared Hearts" (third title line in the picker, page title, manifest, README, handbook); icon now has an open book with a dog-eared page under the heart; cache v21.
- 2026-10-14 · `7882ba3` · Dominik (Claude) · Game renamed "Icebreakers & Heated Rivalries" (short name "Icebreakers"; enemies-to-lovers kicker, "only one bed (at the end)" joke) in picker, page title, manifest, home-screen name, notification-settings hint, README, handbook; new icon (ice/fire split heart, crossed hockey sticks, sparkles on a romance-cover gradient) as SVG + 180/192/512 PNGs. Internal names (repo, localStorage key, cache, Worker) unchanged; cache v20.
- 2026-10-14 · `3168e94` · Dominik (Claude) · Cats are now "Herbert the Gracious" and "Kafka the Schlimm" (intro + finale); removed "fat" everywhere; cache v19.
- 2026-10-14 · `8d9bb20` · Dominik (Claude) · Lobby: after choosing a name the app shows "Under construction" until the host presses Start game in admin.html (notification to both, lobbies unlock by themselves); intro now has a first clue to Auer (hint + Maps); worker `/game`, `/start`, `/reset` clears game; **redeploy `worker/worker.js`**; cache v18.
- 2026-10-14 · `5f35368` · Dominik (Claude) · First stop is introduction only: intro button is now "Start the quest" (sit down at Auer, press it, then the shop / dating app starts); no challenges at stop I (Sara's menu poetry became a +2 event @VIII); cats renamed to Herbert and Kafka everywhere (book: "The Library of Herbert and Kafka", intro mentions both cats); cache v17.
- 2026-10-14 · `1ce76c4` · Dominik (Claude) · Install card with real "Install" button for Android (+ hints for other browsers/iPhone); manifest `id`; cache v16.
- 2026-10-14 · `59c0e53` · Dominik (Claude) · Removed "Just tell us" (districts can never be skipped); "skip challenge" became "make someone else do it" (3 ❤️/🔖, victim screen, no reward); cache v15. (Admin per-player mission filter from the previous commit is unchanged.)
- 2026-10-14 · `7254232` · Dominik (Claude) · Wallet: spend ❤️/🔖 on hints, cancelling sips, skipping challenges, revealing Sara's real listing (`COSTS`); rewards lowered (events +2, intermissions +1, quizzes −1 per miss); step sync: neither girl continues until both solved the stop (worker `/solved`, `/progress`, `/release`, `/reset`, admin sync panel; **redeploy `worker/worker.js`**); cache v14.
- 2026-10-14 · `41970b8` · Dominik (Claude) · 8 shared "both do it" missions (`d_*`: clink, twin selfie, drink swap, compliment battle, dance-off, staring contest, rock-paper-scissors, birthday wishes); admin page now picks the recipient first and only lists matching missions; cache v13.
- 2026-10-14 · `20f652a` · Dominik (Claude) · Surprise missions: admin lists every intermission/event per player; tapping the notification opens that challenge in the app (reward counts, once per mission, "not now" pill); worker stores `ch`+`id` (**redeploy `worker/worker.js` in Cloudflare**); cache v12.
- 2026-10-14 · `e6cc2d4` · Dominik (Claude) · `push-config.js` filled in (worker URL + VAPID public key) so mission alerts are active; cache v11.
- 2026-10-14 · `d98eaf6` · Dominik (Claude) · Host panel `admin.html` + Cloudflare Worker (`worker/`) sending Web Push missions to Sarah/Sara/both; push card in intro + ☰ drawer; `push-config.js`; service worker push handler; cache v10.
- 2026-10-14 · `9d1bfbb` · Dominik (Claude) · Sara: now 13 challenges (+ name that first line, menu poetry, Herbert impression); re-slotted so Sara's challenges never overlap Sarah's intermissions (and her intermissions avoid Sarah's events); cache v9.
- 2026-10-14 · `92f3b2a` · Dominik (Claude) · Sara: 10 book-themed challenges (6 reading-room events +3 🔖, 4 plot-twist intermissions +2 🔖), paper-theme styling, finale shows blurb + reviews + bookmarks; challenge engine generalised for both stories (unit icon, labels); cache v8.
- 2026-10-14 · `e86a442` · Dominik (Claude) · Sara: Bookbazaar shop — buy the right listing among dark-romance decoys to unlock the riddle; wrong buys = penalty sips + haul; new finale stats; cache v7.
- 2026-10-14 · `3b396fc` · Dominik (Claude) · Added `CLAUDE.md` project handbook with collaboration rules.
- 2026-10-14 · `6bb66bd` · Dominik (Claude) · Sarah: 10 challenges (6 events +3 ❤️, 4 sudden intermissions +2 ❤️), pass penalty sips, ❤️ counter, finale with crew bio and super likes; README schedule.
- 2026-10-14 · `98caddc` · Dominik (Claude) · Sarah: 10 full-photo profiles (Felix, Marcus, Jonas, Nico, Samuel added), info below photo, face avatars, floating like/pass buttons, toasts at top.
- 2026-10-14 · `70ef8b8` · Dominik (Claude) · Sarah's story rebuilt as the Icebreaker dating app (profiles, like/pass, match screen, chat messages).
- 2026-10-14 · `e20f7b9` · Dominik (Claude) · Route switched to the JJ Odyssey plan; all riddles rewritten; `STOPS` with bar/time/connection on the next-stop screen.
- 2026-10-14 · `4b3adf1` · Dominik (Claude) · Initial app: picker, both stories, guessing, hints, journal, offline PWA.
