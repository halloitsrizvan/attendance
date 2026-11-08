/* Only public assets are cached. API responses, HTML and student data are never stored. */
const CACHE = 'darul-irfan-public-v2';
const PUBLIC_ASSETS = ['/offline.html', '/icons/app-192.png', '/icons/app-512.png', '/icons/app-maskable-512.png', '/icons/app-apple-180.png'];
self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PUBLIC_ASSETS)));
});
self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        for (const name of await caches.keys()) {
            if (name.startsWith('darul-irfan-public-') && name !== CACHE) await caches.delete(name);
        }
        await self.clients.claim();
    })());
});
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
    if (request.mode === 'navigate') {
        event.respondWith(fetch(request).catch(async () => (await caches.match('/offline.html')) || Response.error()));
        return;
    }
    // Keep RSC requests and Next.js bundles on the network to avoid stale deployments.
    if (PUBLIC_ASSETS.includes(url.pathname)) {
        event.respondWith(caches.match(request).then(cached => cached || fetch(request)));
    }
});
