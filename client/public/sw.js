const CACHE_NAME = "smart-dairy-v3";
const STATIC_ASSETS = ["/", "/login", "/manifest.json"];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => {
                    console.log("Deleting old cache:", k);
                    return caches.delete(k);
                })
            ))
            .then(() => self.clients.claim())
            .then(() => {
                // Force all clients to reload
                return self.clients.matchAll({ type: "window" });
            })
            .then(clients => {
                clients.forEach(client => client.navigate(client.url));
            })
    );
});

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;

    const url = new URL(event.request.url);

    // API calls — always network
    if (url.pathname.startsWith("/api/")) return;

    // JS/CSS assets — network first (always get latest)
    if (url.pathname.includes("/assets/")) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    }
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // HTML pages — network first, cache fallback
    event.respondWith(
        fetch(event.request)
            .then(response => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() => caches.match(event.request) || caches.match("/"))
    );
});