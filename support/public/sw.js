const CACHE = "dailyos-support-v1";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  e.respondWith(fetch(request).then((res) => { const c = res.clone(); caches.open(CACHE).then((x) => x.put(request, c)).catch(() => {}); return res; }).catch(() => caches.match(request)));
});
