// DailyOS service worker — a lightweight, professional offline layer.
//
// Design goals:
//  - Never serve a stale app HTML shell (deploys must land instantly), so we
//    DON'T cache HTML. Navigations are network-first with an offline fallback.
//  - Fast, offline-capable static assets: content-hashed JS/CSS/fonts/icons are
//    cache-first (safe because their URLs change on every deploy).
//  - Never touch cross-origin (Supabase) or same-origin API/data requests.

const CACHE = "dailyos-static-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

function isStaticAsset(pathname) {
  return (
    pathname.startsWith("/_next/static/") ||
    /\.(?:js|css|svg|png|jpg|jpeg|gif|webp|ico|woff2?)$/.test(pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Only handle our own origin — leave Supabase/API/data alone.
  if (url.origin !== self.location.origin) return;

  // Content-hashed static assets: cache-first, refresh in the background.
  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        const network = fetch(req)
          .then((res) => {
            if (res && res.ok) cache.put(req, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
    return;
  }

  // Page navigations: always try the network (so deploys land and auth stays
  // correct); fall back to the offline page when there's no connection. HTML is
  // never cached.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match(OFFLINE_URL)),
    );
    return;
  }
  // Everything else (incl. same-origin API): network only, no caching.
});

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
