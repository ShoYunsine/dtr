const CACHE_NAME = 'async-cache-v1';
const ASSETS_TO_CACHE = [
  '../',
  '../index.html',
  '../css/style.css',
  '../js/script.js',
  '../classes.html',
  '../css/classes.css',
  '../js/classes.js',
  '../class.html',
  '../css/class.css',
  '../js/class.js',
  '../css/login-signup-style.css',
  '../js/firebase.js',
  '../js/login.js',
  '../js/notif.js',
  '../js/index.js',
  '../js/facerecog.js',
  '../Images/logo.png'
];

// Install: Cache essential assets
self.addEventListener('install', event => {
  self.skipWaiting(); // Force immediate activation
  event.waitUntil(
      caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
});


self.addEventListener('activate', event => {
  event.waitUntil(
      caches.keys().then(keys => {
          return Promise.all(
              keys.filter(key => key !== CACHE_NAME)
                  .map(key => caches.delete(key))
          );
      }).then(() => self.clients.claim()) // Claim control immediately
  );
});

// Fetch: Network-first strategy with cache fallback
self.addEventListener('fetch', event => {
  event.respondWith(
      caches.match(event.request).then(response => {
          return response || fetch(event.request).then(fetchResponse => {
              return caches.open(CACHE_NAME).then(cache => {
                  cache.put(event.request, fetchResponse.clone());
                  return fetchResponse;
              });
          });
      }).catch(() => caches.match('/index.html')) // Fallback for offline
  );
});
