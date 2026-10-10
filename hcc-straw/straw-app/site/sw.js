importScripts('/precache-manifest.js');

self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL_CACHE).then(cache => cache.addAll(SHELL_URLS)));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('straw-shell-') && key !== SHELL_CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data === 'activate-update') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(caches.open(SHELL_CACHE).then(cache => cache.match('/index.html')).then(response => response || fetch(request)));
  } else if (SHELL_URLS.includes(url.pathname)) {
    event.respondWith(caches.open(SHELL_CACHE).then(cache => cache.match(request, { ignoreSearch: true })).then(response => response || fetch(request)));
  }
});
