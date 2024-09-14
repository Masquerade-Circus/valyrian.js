let Log = console.log;

let config = {
  version: "v1.2::",
  name: "Valyrian.js",
  // Añadir aquí los recursos críticos y la página offline
  urls: ["/", "/index.html", "/styles.css", "/app.js", "/offline.html"]
};

let cacheName = config.version + config.name;
const MAX_CACHE_SIZE = 50; // Tamaño máximo de la caché

// Función para enviar mensajes a los clientes (páginas controladas)
function sendMessageToClients(message) {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage(message);
    });
  });
}

// Función para limitar el tamaño de la caché
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
  Log("WORKER: fetch event for " + event.request.url);
  try {
    // Clonar la solicitud para usarla en fetch y en la caché
    let fetchRequest = event.request.clone();
    let response = await fetch(fetchRequest);

    // Verificar si la respuesta es válida y del mismo origen
    if (response && response.status === 200 && response.type === "basic") {
      // Clonar la respuesta para almacenarla en la caché
      let responseToCache = response.clone();
      let cache = await caches.open(cacheName);
      cache.put(event.request, responseToCache);

      // Limitar el tamaño de la caché
      limitCacheSize(cacheName, MAX_CACHE_SIZE);

      Log("WORKER: fetch response stored in cache.", event.request.url);
    }
    return response;
  } catch (error) {
    Log("WORKER: fetch request failed.", error);

    // Intentar obtener la respuesta de la caché si la red falla
    let cachedResponse = await caches.match(event.request);
    if (cachedResponse) {
      Log("WORKER: fetch request failed, responding with cache.");
      return cachedResponse;
    }

    // Servir la página offline si está disponible
    let cache = await caches.open(cacheName);
    let offlineResponse = await cache.match("/offline.html");
    if (offlineResponse) {
      return offlineResponse;
    }

    // Fallback genérico si no hay caché ni página offline
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
  // Ignorar ciertas solicitudes
  if (
    event.request.cache === "only-if-cached" &&
    event.request.mode !== "same-origin"
  ) {
    return;
  }

  Log("WORKER: fetch event in progress.", event.request.url);

  // Solo manejar solicitudes GET
  if (event.request.method !== "GET") {
    return;
  }

  // Implementar diferentes estrategias de caché según el tipo de recurso
  if (event.request.url.includes("/api/")) {
    // Para solicitudes a la API, usar red primero
    event.respondWith(fetchRequest(event));
  } else {
    // Para otros recursos, usar caché primero
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          Log("WORKER: returning from cache.", event.request.url);
          return response;
        }
        return fetchRequest(event);
      })
    );
  }
});

self.addEventListener("install", (event) => {
  Log("WORKER: installing version", cacheName);
  // No usar skipWaiting para dar control al usuario sobre las actualizaciones
  event.waitUntil(
    caches
      .open(cacheName)
      .then((cache) => {
        return cache.addAll(config.urls);
      })
      .then(() => {
        Log("WORKER: install completed.");
      })
  );
});

self.addEventListener("activate", (event) => {
  Log("WORKER: activating new version", cacheName);

  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          // Eliminar cachés antiguas que no coinciden con el nombre actual
          .filter((key) => key !== cacheName)
          .map((key) => caches.delete(key))
      ).then(() => {
        Log("WORKER: old caches cleared.");
        // Notificar a los clientes que hay una nueva versión disponible
        sendMessageToClients({ type: "NEW_VERSION" });
      })
    )
  );
});

// Escuchar mensajes desde los clientes
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
