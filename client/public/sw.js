const CACHE_NAME = "smart-dairy-v2";
const STATIC_ASSETS = [
    "/",
    "/login",
    "/dashboard",
    "/manifest.json",
    "/icon-192.png",
    "/icon-512.png",
];

// Install
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate - clean old caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    );
});

// Fetch strategy:
// - API calls: Network first, no cache (data handled by IndexedDB)
// - Static assets: Cache first, network fallback
self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET
    if (event.request.method !== "GET") return;

    // API calls — network only (IndexedDB handles offline data)
    if (url.pathname.startsWith("/api/")) return;

    // Static assets — cache first
    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;
            return fetch(event.request).then(response => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            }).catch(() => {
                // Offline fallback for HTML pages
                if (event.request.destination === "document") {
                    return caches.match("/");
                }
            });
        })
    );
});

// Background sync (when coming back online)
self.addEventListener("sync", (event) => {
    if (event.tag === "dairy-sync") {
        event.waitUntil(
            self.clients.matchAll().then(clients => {
                clients.forEach(client => client.postMessage({ type: "SYNC_REQUESTED" }));
            })
        );
    }
});