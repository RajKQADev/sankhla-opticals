const CACHE = 'sankhla-opticals-v1';
const SHELL = ['./', './index.html', './admin.html', './styles.css', './app.js', './admin.js', './manifest.webmanifest', './assets/sankhla-opticals.svg'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  event.respondWith(fetch(request).then(response => {
    if (response.ok && (request.destination === 'document' || ['style', 'script', 'image'].includes(request.destination))) {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(request, copy));
    }
    return response;
  }).catch(async () => (await caches.match(request)) || (await caches.match('./index.html'))));
});

