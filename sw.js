// Offline cache: the whole game works without signal once opened once.
// Bump VERSION whenever you change story.js or any other file.
const VERSION = "bezirk-v7";
const CORE = [
  "./",
  "index.html",
  "styles.css",
  "app.js",
  "story.js",
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
