// DailyOS service worker — deliberately minimal and self-healing.
//
// An earlier version cached JS/CSS "cache-first". On an installed PWA that can
// serve a stale/broken chunk after a deploy, which shows up as a blank
// "Application error: a client-side exception" — the whole app dead. To rule the
// service worker out entirely, this version caches NOTHING from the app: every
// request goes straight to the network, exactly as if there were no worker. The
// only thing kept is a tiny offline page shown if a navigation truly can't reach
// the network. On activate we delete every old cache, so any device stuck on the
// old caching worker heals itself the moment this one takes over.

const OFFLINE_CACHE = "dailyos-offline-v2";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(OFFLINE_CACHE)
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
        // Purge everything except this version's offline cache — this is what
        // rescues devices stuck on the old asset-caching worker.
        Promise.all(
          keys.filter((k) => k !== OFFLINE_CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // Only provide an offline fallback for page navigations. Everything else
  // (JS/CSS/assets, API, cross-origin) is left completely untouched — fetched
  // fresh from the network every time, with no cache that could go stale.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() =>
        caches.match(OFFLINE_URL).then((r) => r || Response.error()),
      ),
    );
  }
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
