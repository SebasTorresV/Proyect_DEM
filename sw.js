const CACHE_NAME = "chivospot-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./lugar.html",
  "./evento.html",
  "./styles/base.css",
  "./styles/layout.css",
  "./styles/components.css",
  "./scripts/app.js",
  "./scripts/lugar.js",
  "./scripts/evento.js",
  "./scripts/data.js",
  "./scripts/utils.js",
  "./scripts/maps.js",
  "./scripts/geoloc.js",
  "./datos/eventos.json",
  "./datos/zonas.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch((error) => console.warn("Cache falló", error))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).catch(() => cached))
  );
});
