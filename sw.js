const VERSION = '3.2.0';
const CACHE_NAME = `paidchat-shell-${VERSION}`;
const HOME = new URL('./', self.registration.scope).href;

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter(name => name.startsWith('paidchat-shell-') && name !== CACHE_NAME)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || !request.url.startsWith(self.registration.scope)) return;
  const path = new URL(request.url).pathname;
  const homePath = new URL(HOME).pathname;
  if (request.mode === 'navigate' && (path === homePath || path === homePath + 'index.html')) {
    event.respondWith(loadPage(request));
  }
});

async function loadPage(request) {
  try {
    const response = await fetch(request, {cache: 'no-store'});
    if (response.ok && !response.redirected) {
      await caches.open(CACHE_NAME)
        .then(cache => cache.put(HOME, response.clone())).catch(() => {});
    }
    return response;
  } catch {
    return (await caches.match(HOME, {cacheName: CACHE_NAME})) || Response.error();
  }
}
