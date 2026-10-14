# Mission pusher (Cloudflare Worker)

Lets the host (`admin.html`) send a notification to Sarah's or Sara's iPhone.
This folder is **not** loaded by the game; it is only deployed to Cloudflare. Everything else in the repo stays "no build, no npm".

## One-time setup (≈10 min)

From this folder, logged in to Cloudflare (`npx wrangler login`):

1. **Storage**: `npx wrangler kv namespace create KV` → paste the printed `id` into `wrangler.toml`.
2. **Push keys**: `node gen-vapid.mjs`
   - PUBLIC key → `wrangler.toml` (`VAPID_PUBLIC`) **and** `../push-config.js` (`vapidPublicKey`).
   - PRIVATE key → `npx wrangler secret put VAPID_PRIVATE_JWK` (paste the whole JSON line).
3. **Admin PIN**: `npx wrangler secret put ADMIN_PIN`. Pick something long (8+ characters): anyone who knows the PIN can send missions.
4. **Deploy**: `npx wrangler deploy` → note the `https://bezirkssaufen-push.<you>.workers.dev` URL → put it in `../push-config.js` (`workerUrl`).
5. Bump `VERSION` in `../sw.js`, commit and push (`push-config.js` is cached on the phones), wait for GitHub Pages.

## On each iPhone (needs iOS 16.4+)

1. Open the Pages URL in **Safari** → Share → **Add to Home Screen**.
2. Open the app **from the new icon** (not from Safari), pick the story.
3. Tap **Turn on mission alerts** on the intro screen (or in the ☰ drawer) and allow notifications.

## Sending

Open `https://housedodo.github.io/bezirkssaufen/admin.html`, enter the PIN (the page then shows how many phones are registered per player),
pick Sarah / Sara / Both, tap a quick mission or write your own and press Send. Do a test run the evening before.

## How it works

- Phone → `POST /subscribe {who, sub}` → stored in KV (a phone belongs to one player).
- Admin → `POST /send` with `Authorization: Bearer <PIN>` → the worker stores the text under that player and sends an **empty**, VAPID-signed push to each registered phone (no payload encryption needed).
- The phone's service worker (`sw.js`) wakes up, asks `POST /inbox {endpoint}` for the text and shows the notification.

## All endpoints

Besides subscribe / inbox / send the worker also handles the lobby (`GET /game`, `POST /start`), step sync (`POST /solved`, `GET /progress`, `POST /release`) and `POST /reset`. The full table is in `CLAUDE.md` → Infrastructure. The Worker name in the dashboard is `bezirkssaufen`; set the secrets `ADMIN_PIN` and `VAPID_PRIVATE_JWK`, the variables `VAPID_PUBLIC` and `VAPID_SUBJECT`, and bind the KV namespace as `KV`.

## Updating the worker

After changing `worker.js` in the repo: Cloudflare dashboard → your Worker → **Edit code** → replace everything with the new file → **Deploy**.

## Troubleshooting

- Admin says `Sarah 0`: the phone hasn't tapped "Turn on mission alerts" yet, or the app was opened from Safari instead of the home-screen icon.
- Sent `1/1` but nothing shows: iOS Focus / Do Not Disturb, or notifications switched off in Settings → Notifications → Bezirkssaufen. Delete the home-screen icon, add it again and re-enable.
- `wrong pin`: the PIN you typed isn't the `ADMIN_PIN` secret.
