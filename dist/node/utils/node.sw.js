// eslint-disable-next-line no-console
const Log = console.log;

const config = {
  version: "v1",
  name: "Valyrian.js",
  logFetch: false,
  offlinePage: "/offline.html",
  // Critical resources and offline page
  urls: ["/"]
};

const cacheName = `${config.version}::${config.name}`;
const MAX_CACHE_SIZE = 50; // Max cache size

// Limit the cache size by deleting the oldest entries
function limitCacheSize(name, size) {
  caches.open(name).then((cache) => {
    cache.keys().then((keys) => {
      if (keys.length > size) {
        cache.delete(keys[0]).then(() => {
          limitCacheSize(name, size);
        });
      }
    });
  });
}

async function fetchRequest(event) {
  if (config.logFetch) {
    Log("WORKER: fetch event for " + event.request.url);
  }
  try {
    // Clone the request to store it in the cache
    const fetchRequest = event.request.clone();
    const response = await fetch(fetchRequest);

    // Verify if the response is valid
    if (response && response.status === 200 && response.type === "basic") {
      // Clone the response to store it in the cache
      const responseToCache = response.clone();
      const cache = await caches.open(cacheName);
      cache.put(event.request, responseToCache);

      // Limit the cache size
      limitCacheSize(cacheName, MAX_CACHE_SIZE);

      if (config.logFetch) {
        Log("WORKER: fetch response stored in cache.", event.request.url);
      }
    }
    return response;
  } catch (error) {
    Log("WORKER: fetch request failed.", error);

    // Try to serve the cached response if available
    const cachedResponse = await caches.match(event.request);
    if (cachedResponse) {
      Log("WORKER: fetch request failed, responding with cache.");
      return cachedResponse;
    }

    // Send the offline page if no cache is available
    const cache = await caches.open(cacheName);
    const offlineResponse = await cache.match(config.offlinePage);
    if (offlineResponse) {
      return offlineResponse;
    }

    // Generic offline page
    return new Response("<h1>Offline</h1>", {
      status: 503,
      statusText: "Service Unavailable",
      headers: new Headers({
        "Content-Type": "text/html"
      })
    });
  }
}

self.addEventListener("fetch", (event) => {
  // Ignore requests with the "only-if-cached" cache mode
  if (event.request.cache === "only-if-cached" && event.request.mode !== "same-origin") {
    return;
  }

  if (config.logFetch) {
    Log("WORKER: fetch event in progress.", event.request.url);
  }

  // Ignore requests that are not GET
  if (event.request.method !== "GET") {
    return;
  }

  // If the request is for the API, use the network first
  if (event.request.url.includes("/api/")) {
    event.respondWith(fetchRequest(event));
  } else {
    // Use the cache first for other requests
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          if (config.logFetch) {
            Log("WORKER: returning from cache.", event.request.url);
          }
          return response;
        }
        return fetchRequest(event);
      })
    );
  }
});

self.addEventListener("install", (event) => {
  Log("WORKER: installing version", cacheName);
  event.waitUntil(
    caches
      .open(cacheName)
      .then((cache) => {
        return cache.addAll(config.urls);
      })
      .then(() => {
        Log("WORKER: install completed.");
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: "VERSION", version: config.version });
          });
        });
      })
  );
});

self.addEventListener("activate", (event) => {
  Log("WORKER: activating new version", cacheName);

  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== cacheName).map((key) => caches.delete(key))).then(() => {
        Log("WORKER: old caches cleared.");
        return self.clients.claim();
      })
    )
  );
});

// Listen for messages from clients
self.addEventListener("message", (event) => {
  Log("WORKER: message received.", event.data);
  if (event.data) {
    if (event.data.type === "SKIP_WAITING") {
      self.skipWaiting();
    }
  }
});
