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

const VERSION = "v5";
const DEPLOY = "319";
const STATIC_CACHE = `dailyos-static-${VERSION}`;
const PAGES_CACHE = `dailyos-pages-${VERSION}`;

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== STATIC_CACHE && k !== PAGES_CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Never cache API, auth, or analytics requests.
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/_vercel/") ||
    url.pathname.startsWith("/_next/data/")
  ) {
    return;
  }

  // ── Immutable hashed assets ── cache-first, safe forever.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(event.request).then(
          (hit) =>
            hit ||
            fetch(event.request).then((res) => {
              if (res.ok) cache.put(event.request, res.clone());
              return res;
            }),
        ),
      ),
    );
    return;
  }

  // ── Everything else (HTML navigations, etc.) ── network-first.
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(PAGES_CACHE).then((c) => c.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request).then((hit) => hit || caches.match("/"))),
    );
    return;
  }
});

// ── Push notifications ──
self.addEventListener("push", (event) => {
  if (!event.data) return;
  try {
    const payload = event.data.json();
    event.waitUntil(
      self.registration.showNotification(payload.title ?? "DailyOS", {
        body: payload.body ?? "",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        data: { url: payload.url ?? "/today" },
      }),
    );
  } catch {
    // malformed push — ignore
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url ?? "/today";
  event.waitUntil(clients.openWindow(target));
});
