const CACHE_NAME = ‘iron-log-pwa-v5’;
const STATIC_ASSETS = [
‘./icons/icon-180.png’,
‘./icons/icon-192.png’,
‘./icons/icon-512.png’,
‘./icons/icon-512-maskable.png’
];

// On install: pre-cache only static assets (not HTML)
self.addEventListener(‘install’, event => {
event.waitUntil(
caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
);
self.skipWaiting(); // activate immediately
});

// On activate: clear old caches
self.addEventListener(‘activate’, event => {
event.waitUntil(
caches.keys().then(keys =>
Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
)
);
self.clients.claim(); // take control immediately
});

self.addEventListener(‘fetch’, event => {
if (event.request.method !== ‘GET’) return;

const url = new URL(event.request.url);
const isHTML = event.request.destination === ‘document’ ||
url.pathname.endsWith(’.html’) ||
url.pathname === ‘/’ ||
url.pathname.endsWith(’/’);

if (isHTML) {
// Network-first for HTML: always try to get fresh version,
// fall back to cache only if offline
event.respondWith(
fetch(event.request)
.then(response => {
const copy = response.clone();
caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
return response;
})
.catch(() => caches.match(event.request))
);
} else {
// Cache-first for everything else (icons, fonts, etc.)
event.respondWith(
caches.match(event.request).then(cached => {
if (cached) return cached;
return fetch(event.request).then(response => {
const copy = response.clone();
caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
return response;
});
})
);
}
});
