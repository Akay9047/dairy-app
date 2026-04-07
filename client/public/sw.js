cat > sw.js << 'EOF'
const CACHE = "dairy-v1";
const OFFLINE_URLS = ["/", "/login"];

self.addEventListener("install", e => {
    e.waitUntil(
        caches.open(CACHE).then(c => c.addAll(OFFLINE_URLS))
    );
});

self.addEventListener("fetch", e => {
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
});
EOF