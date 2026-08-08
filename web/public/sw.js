// AXOM service worker — offline-first for the installable / downloadable app.
// Cache name is bumped per build via the version query; old caches are purged.
const CACHE = "axom-v0.0.1-prebeta";
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

// Cache-first for same-origin GETs (the hashed Vite assets are immutable),
// with a network fallback that also fills the cache.
self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then((res) => res.ok ? res : Promise.reject(new Error("navigation unavailable"))).catch(() => caches.match("./index.html")));
    return;
  }
  e.respondWith(
    caches.match(req).then((hit) =>
      hit ||
      fetch(req).then((res) => {
        if (res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      }),
    ),
  );
});
