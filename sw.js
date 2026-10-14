// Offline cache: the whole game works without signal once opened once.
// Bump VERSION whenever you change story.js or any other file.
const VERSION = "bezirk-v24";
importScripts("push-config.js"); // self.PUSH = { workerUrl, vapidPublicKey }
const CORE = [
  "./",
  "index.html",
  "styles.css",
  "app.js",
  "story.js",
  "push-config.js",
  "manifest.webmanifest",
  "icons/icon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png",
  "img/players/matze.jpg",
  "img/players/matze-face.jpg",
  "img/players/elias.jpg",
  "img/players/elias-face.jpg",
  "img/players/tomasz.jpg",
  "img/players/tomasz-face.jpg",
  "img/players/felix.jpg",
  "img/players/felix-face.jpg",
  "img/players/marcus.jpg",
  "img/players/marcus-face.jpg",
  "img/players/luca.jpg",
  "img/players/luca-face.jpg",
  "img/players/jonas.jpg",
  "img/players/jonas-face.jpg",
  "img/players/nico.jpg",
  "img/players/nico-face.jpg",
  "img/players/samuel.jpg",
  "img/players/samuel-face.jpg",
  "img/players/dragan.jpg",
  "img/players/dragan-face.jpg",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const isFont = url.hostname.endsWith("fonts.googleapis.com") || url.hostname.endsWith("fonts.gstatic.com");
  if (url.origin !== location.origin && !isFont) return;

  // Network first (so story edits arrive), fall back to cache when offline.
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && (res.ok || res.type === "opaque")) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("index.html")))
  );
});

// ── Mission alerts (Web Push) ───────────────────────────────────────────────
// The push itself carries no text. We ask the worker what the mission is, then show it.
self.addEventListener("push", (e) => {
  e.waitUntil((async () => {
    let msg = { title: "New mission 🎯", body: "Open the app." };
    try {
      const sub = await self.registration.pushManager.getSubscription();
      const res = await fetch(`${self.PUSH.workerUrl}/inbox`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ endpoint: sub && sub.endpoint }),
      });
      if (res.ok) msg = await res.json();
    } catch (_) { /* offline: show the generic text, iOS requires a visible notification */ }
    await self.registration.showNotification(msg.title, {
      body: msg.body,
      icon: "icons/icon-192.png",
      badge: "icons/icon-192.png",
      tag: "mission",
      renotify: true,
      data: { ch: msg.ch || null, id: msg.id || null },
    });
  })());
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const { ch, id } = e.notification.data || {};
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    // The host app (admin.html) lives on the same address: its window must never receive a player's mission.
    const game = all.filter((c) => !/\/admin\.html$/.test(new URL(c.url).pathname));
    const target = game.find((c) => c.focused) || game.find((c) => c.visibilityState === "visible") || game[0];
    if (target) {
      if (ch && id) target.postMessage({ type: "mission", ch, id });
      return target.focus();
    }
    // game is closed: open it with the mission in the URL, app.js picks it up
    const base = new URL("./", self.registration.scope).href;
    return self.clients.openWindow(ch && id ? `${base}?mission=${encodeURIComponent(ch)}&mid=${encodeURIComponent(id)}` : base);
  })());
});
