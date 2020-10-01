let Log = console.log;

let config = {
  version: "v1::",
  name: "Valyrian.js",
  urls: ["/"]
};

let cacheName = config.version + config.name;

async function fetchRequest(event) {
  Log("WORKER: fetchevent for " + event.request.url);
  let response;
  try {
    // IMPORTANT: Clone the request. A request is a stream and
    // can only be consumed once. Since we are consuming this
    // once by cache and once by the browser for fetch, we need
    // to clone the response.
    let fetchRequest = event.request.clone();
    response = await fetch(fetchRequest);
    if (response && response.status < 300 && response.type === "basic") {
      try {
        // IMPORTANT: Clone the response. A response is a stream
        // and because we want the browser to consume the response
        // as well as the cache consuming the response, we need
        // to clone it so we have two streams.
        let responseToCache = response.clone();
        let cache = await caches.open(cacheName);
        cache.put(event.request, responseToCache);

        Log("WORKER: fetch response stored in cache.", event.request.url);
      } catch (err) {
        Log("WORKER: fetch response could not be stored in cache.", err);
      }

      return response;
    }
  } catch (error) {
    Log("WORKER: fetch request failed.", error);
  }

  let cachedResponse;
  try {
    cachedResponse = await caches.match(event.request);
    if (cachedResponse) {
      Log("WORKER: fetch request failed, responding with cache.");
      return cachedResponse;
    }
  } catch (error) {
    Log("WORKER: cache request failed.", error);
  }

  Log(
    "WORKER: fetch request failed in both cache and network, responding with service unavailable."
  );
  return (
    response ||
    new Response("<h1>Service Unavailable</h1>", {
      status: 503,
      statusText: "Service Unavailable",
      headers: new Headers({
        "Content-Type": "text/html"
      })
    })
  );
}

self.addEventListener("fetch", (event) => {
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

  event.respondWith(fetchRequest(event));
});

self.addEventListener("install", (event) => {
  Log("WORKER: Version install", cacheName);
  event.waitUntil(
    caches
      .open(cacheName)
      .then((cache) => cache.addAll(config.urls))
      // IMPORTANT: `skipWaiting()` forces the waiting ServiceWorker to become the
      // active ServiceWorker, triggering the `onactivate` event.
      // Together with `Clients.claim()` this allows a worker to take effect
      // immediately in the client(s).
      .then(() => self.skipWaiting())
  );
});

// IMPORTANT: `onactivate` is usually called after a worker was installed and the page
// got refreshed. Since we call `skipWaiting()` in `oninstall`, `onactivate` is
// called immediately.
self.addEventListener("activate", (event) => {
  self.clients
    .matchAll({
      includeUncontrolled: true
    })
    .then((clientList) => {
      urls = clientList.map((client) => client.url);
      Log("WORKER: Matching clients:", urls.join(", "));
    });

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

      // IMPORTANT: `claim()` sets this worker as the active worker for all clients that
      // match the workers scope and triggers an `oncontrollerchange` event for
      // the clients.
      .then(() => self.clients.claim())
  );
});
