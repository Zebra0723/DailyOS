// DailyOS service worker — offline-capable, but deploy-safe.
//
// History: an early version cached JS/CSS "cache-first" including HTML. After a
// deploy that could serve stale HTML pointing at chunk hashes that no longer
// existed → "Application error: a client-side exception" (the whole app dead).
//
// This version brings offline support back WITHOUT that risk, by never letting a
// cached HTML page and its chunks fall out of sync:
//   • Page navigations are NETWORK-FIRST — online you always get fresh HTML (and
//     therefore current chunk URLs); the cache is only used when truly offline.
//   • Content-hashed static assets (/_next/static/…) are immutable — their URL
//     changes every build — so caching them cache-first is always safe.
//   • API and auth routes are never cached (they're dynamic / per-request).
// Result: after any deploy, an online load is always coherent; an offline load
// serves the last page you visited together with the chunks it was built with.

const VERSION = "v3";
const STATIC_CACHE = `dailyos-static-${VERSION}`;
const PAGES_CACHE = `dailyos-pages-${VERSION}`;
const OFFLINE_URL = "/offline.html";
const KEEP = [STATIC_CACHE, PAGES_CACHE];

const ASSET_RE = /\.(?:js|css|woff2?|ttf|otf|png|jpe?g|gif|svg|webp|avif|ico)$/;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        // Purge every cache from an older version — this also rescues devices
        // stuck on the old asset-caching worker.
        Promise.all(keys.filter((k) => !KEEP.includes(k)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }

  // Only ever touch same-origin requests; leave cross-origin untouched.
  if (url.origin !== self.location.origin) return;

  // Dynamic / per-request routes: always network, never cache.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) {
    return;
  }

  // Immutable, content-hashed assets → cache-first (safe: URL changes per build).
  if (url.pathname.startsWith("/_next/static/") || ASSET_RE.test(url.pathname)) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // Page navigations → network-first, falling back to a cached copy, then the
  // offline page. Never cache-first, so we can't serve HTML that points at
  // chunks a newer deploy has removed.
  if (req.mode === "navigate") {
    event.respondWith(networkFirstPage(req));
    return;
  }
  // Everything else (RSC fetches, manifest, etc.) is left to the network.
});

async function cacheFirst(req) {
  const cache = await caches.open(STATIC_CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return hit || Response.error();
  }
}

async function networkFirstPage(req) {
  const cache = await caches.open(PAGES_CACHE);
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    const cached = await cache.match(req);
    if (cached) return cached;
    const offline = await caches.match(OFFLINE_URL);
    return offline || Response.error();
  }
}

// --- Web Push -------------------------------------------------------------
// A push arrives from our server via the OS push service even when the app is
// closed or the phone is locked. We show a notification; tapping it focuses (or
// opens) DailyOS at the relevant page.

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "DailyOS", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "DailyOS";
  const options = {
    body: data.body || "",
    tag: data.tag || undefined,
    // /apple-icon is a generated PNG endpoint — a real raster icon for Android.
    icon: "/apple-icon",
    data: { url: data.url || "/today" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/today";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Focus an existing DailyOS tab if there is one; otherwise open a new one.
        for (const client of clientList) {
          if ("focus" in client) {
            client.navigate?.(target);
            return client.focus();
          }
        }
        return self.clients.openWindow(target);
      }),
  );
});
