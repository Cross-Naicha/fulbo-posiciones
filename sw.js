
const CACHE_NAME = "chiquiliga-v2026-06-25";

const urlsToCache = [
    "./",
    "./index.html",
    "./style.css",
    "./main.js",
    "./posiciones.json",
    "./partidos.json",
    "./noticias.json"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});
