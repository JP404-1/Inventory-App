const CACHE_NAME = "inventory-cache-v8";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon 192.png",
  "./icon 512.png"
];
const OPTIONAL_CACHE = [
  "https://unpkg.com/@zxing/browser@latest"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      await cache.addAll(APP_SHELL);
      await Promise.all(
        OPTIONAL_CACHE.map(url =>
          cache.add(url).catch(error => {
            console.warn("Optional cache failed:", url, error);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  const isAppShellRequest =
    requestUrl.origin === self.location.origin &&
    (requestUrl.pathname.endsWith("/")
      || requestUrl.pathname.endsWith("/index.html")
      || requestUrl.pathname.endsWith("/manifest.json")
      || requestUrl.pathname.endsWith("/icon.svg"));

  if (requestUrl.origin !== self.location.origin) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }

  if (isAppShellRequest) {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
