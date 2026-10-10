/* Aadu Puli Aatam offline service worker (hand-rolled, zero-dep).
 * Strategy:
 *  - Precache app shell (/, /offline.html, manifest, icons) on install.
 *  - Navigation requests: network-first, fall back to cache, then /offline.html.
 *  - Static assets (same-origin GET): stale-while-revalidate.
 *  - Never cache Supabase realtime / API calls (always network-only).
 */
const VERSION = "aadu-puli-v1";
const APP_SHELL = ["/", "/offline.html", "/manifest.webmanifest", "/aadu-puli-favicon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

function isApiRequest(url) {
  return (
    url.hostname.includes("supabase.co") ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_server/") ||
    url.pathname.includes("realtime")
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    // Third-party realtime/API: never intercept.
    if (isApiRequest(url)) return;
    return;
  }
  if (isApiRequest(url)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put("/", copy));
          return res;
        })
        .catch(async () => {
          const cached = await caches.match("/", { ignoreSearch: true });
          if (cached) return cached;
          return caches.match("/offline.html");
        }),
    );
    return;
  }

  // Static assets: stale-while-revalidate.
  event.respondWith(
    caches.match(request, { ignoreVary: true }).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
