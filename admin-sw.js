// Service worker of the host app only (scope: admin.html). The game has its own sw.js.
// Network first so changes to admin.html arrive at once; the cache only makes the app open without signal.
const ADMIN_VERSION = "admin-v1";
const ADMIN_CORE = [
  "./admin.html",
  "story.js",
  "push-config.js",
  "admin.webmanifest",
  "icons/admin-192.png",
  "icons/admin-512.png",
  "icons/admin-icon.svg",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(ADMIN_VERSION).then((c) => c.addAll(ADMIN_CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("admin-") && k !== ADMIN_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return; // the worker API is never cached
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) { const copy = res.clone(); caches.open(ADMIN_VERSION).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("./admin.html")))
  );
});
