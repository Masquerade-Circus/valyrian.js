let Log = () => {};

let config = {
    version: 'v1.6.1::',
    name: 'Test',
    urls: ["/","/hello"]
};

// Function to add the network response to the cache
let fetchedFromNetwork = event => response => {
    Log('WORKER: fetch response from network.', event.request.url);
    if (!response || response.status !== 200 || response.type !== 'basic') {
        return;
    }

    let cacheCopy = response.clone();
    caches
        .open(config.version + config.name)
        .then(cache => cache.put(event.request, cacheCopy))
        .then(() => Log('WORKER: fetch response stored in cache.', event.request.url));
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
self.addEventListener("fetch", event => {
    Log('WORKER: fetch event in progress.', event.request.url);

    let url = new URL(event.request.url);

    // We only handle Get requests all others let them pass
    if (event.request.method !== 'GET') {
        return;
    }

    // TODO: Make a callback available here to filter if this request must be catched or let it pass directly
    // This callback must return true or false

    Log('WORKER: fetchevent for ' + url);

    event.respondWith(
        caches.match(event.request).then(cached => {
            Log('WORKER: fetch event', cached ? '(cached)' : '(network)', event.request.url);

            let network = fetch(event.request)
                .then(fetchedFromNetwork(event), unableToResolve)
                .catch(error => {
                    console.log(error);
                    return caches.match('/');
                });

            return network || cached;
        })
    );
});

self.addEventListener("install", event => {
    event.waitUntil(
        // We can't use cache.add() here, since we want OFFLINE_URL to be the cache key, but
        // the actual URL we end up requesting might include a cache-busting parameter.
        caches.open(config.version + config.name)
            .then(cache => cache.addAll(config.urls))
            .catch(error => console.error('WORKER: Failed to cache', error))
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(key => !key.startsWith(config.version)) // Filter by keys that don't start with the latest version prefix.
                    .map(key => caches.delete(key)) // Return a promise that's fulfilled when each outdated cache is deleted.
            ))
            .then(() => self.clients.claim())
    );
});
