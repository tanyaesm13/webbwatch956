/* La Onda Libre — app shell service worker.
   Cache-first ONLY for the static app shell (app.html, manifest, icons).
   Everything else is network-only. The audio stream and the now-playing
   API are cross-origin and are NEVER intercepted or cached. */
var CACHE_NAME = "lol-app-shell-v1";
var SHELL_FILES = [
  "/app.html",
  "/manifest.webmanifest",
  "/icon-192.svg",
  "/icon-512.svg"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(SHELL_FILES);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  var url = new URL(event.request.url);

  /* Cross-origin requests (the radio stream, the now-playing API,
     analytics, etc.) pass straight through — never cached. */
  if (url.origin !== self.location.origin) {
    return;
  }

  /* App shell: cache-first, falling back to the network. */
  if (SHELL_FILES.indexOf(url.pathname) !== -1) {
    event.respondWith(
      caches.match(event.request, { ignoreSearch: true }).then(function (cached) {
        return cached || fetch(event.request).then(function (response) {
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, copy);
          });
          return response;
        });
      })
    );
    return;
  }

  /* Everything else on this origin: network-only, no caching. */
  event.respondWith(fetch(event.request));
});
