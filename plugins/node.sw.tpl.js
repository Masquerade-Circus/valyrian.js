let Log = console.log;

let config = {
  version: 'v1::',
  name: 'Valyrian.js',
  urls: ['/']
};

// Function to add the network response to the cache
let fetchedFromNetwork = (event) => (response) => {
  Log('WORKER: fetch response from network.', event.request.url);
  if (!response || response.status !== 200 || response.type !== 'basic') {
    return;
  }

  let cacheCopy = response.clone();
  caches
    .open(config.version + config.name)
    .then((cache) => cache.put(event.request, cacheCopy))
    .then(() => Log('WORKER: fetch response stored in cache.', event.request.url))
    .catch((err) => Log('WORKER: fetch response could not be stored in cache.', err));
  return response;
};

// If the network or the cache response fail, response with Service Unavailable
let unableToResolve = () => {
  Log('WORKER: fetch request failed in both cache and network.');
  return new Response('<h1>Service Unavailable</h1>', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: new Headers({
      'Content-Type': 'text/html'
    })
  });
};

// Fetch listener
self.addEventListener('fetch', (event) => {
  Log('WORKER: fetch event in progress.', event.request.url);

  // We only handle Get requests all others let them pass
  if (event.request.method !== 'GET') {
    return;
  }

  // TODO: Make a callback available here to filter if this request must be cached or let it pass directly
  // This callback must return true or false

  Log('WORKER: fetchevent for ' + event.request.url);

  event.respondWith(
    caches.match(event.request).then((cached) => {
      Log('WORKER: fetch event', cached ? '(cached)' : '(network)', event.request.url);

      let network = fetch(event.request)
        .then(fetchedFromNetwork(event), unableToResolve)
        .catch((error) => {
          console.log(error);
          return caches.match('/');
        });

      return network || cached;
    })
  );
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(config.version + config.name)
      .then((cache) => cache.addAll(config.urls))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            // Filter by keys that don't start with the latest version prefix.
            .filter((key) => !key.startsWith(config.version))
            // Return a promise that's fulfilled when each outdated cache is deleted.
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});
