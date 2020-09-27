let Log = console.log;

let config = {
  version: "v1::",
  name: "Valyrian.js",
  urls: ["/"]
};

let cacheName = config.version + config.name;

self.addEventListener("fetch", async (event) => {
  // DevTools opening will trigger these o-i-c requests, which this SW can't handle.
  // https://github.com/paulirish/caltrainschedule.io/issues/49
  if (
    event.request.cache === "only-if-cached" &&
    event.request.mode !== "same-origin"
  ) {
    return;
  }

  Log("WORKER: fetch event in progress.", event.request.url);

  // We only handle Get requests all others let them pass
  if (event.request.method !== "GET") {
    return;
  }

  Log("WORKER: fetchevent for " + event.request.url);

  let response = await fetch(event.request);
  if (response && response.status < 300 && response.type === "basic") {
    try {
      let cache = await caches.open(cacheName);
      cache.put(event.request, response);

      Log("WORKER: fetch response stored in cache.", event.request.url);
    } catch (err) {
      Log("WORKER: fetch response could not be stored in cache.", err);
    }

    return event.respondWith(response);
  }

  let cachedResponse = await caches.match(event.request);
  if (cachedResponse) {
    Log("WORKER: fetch request failed, responding with cache.");
    return event.respondWith(cachedResponse);
  }

  Log(
    "WORKER: fetch request failed in both cache and network, responding with service unavailable."
  );
  return event.respondWith(
    response ||
      new Response("<h1>Service Unavailable</h1>", {
        status: 503,
        statusText: "Service Unavailable",
        headers: new Headers({
          "Content-Type": "text/html"
        })
      })
  );
});

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(cacheName).then((cache) => cache.addAll(config.urls))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            // Filter by keys that don't start with the latest version prefix.
            .filter((key) => !key.startsWith(cacheName))
            // Return a promise that's fulfilled when each outdated cache is deleted.
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});
