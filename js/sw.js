const CACHE_NAME = 'async-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/script.js',
  '/classes.html',
  '/css/classes.css',
  '/js/classes.js',
  '/class.html',
  '/css/class.css',
  '/js/class.js',
  '/css/login-signup-style.css',
  '/js/firebase.js',
  '/js/login.js',
  '/js/notif.js',
  '/js/index.js',
  '/js/facerecog.js',
  '/Images/logo.png',
  '/fonts/Billabong.ttf'
];

// Install: Cache essential assets
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
});

// Activate: Clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: Network-first with cache fallback
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).then(response => {
      const responseClone = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
      return response;
    }).catch(() => caches.match(event.request).then(cacheResponse =>
      cacheResponse || caches.match('/index.html') // Offline fallback
    ))
  );
});
