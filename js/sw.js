const CACHE_NAME = 'dtr-v2.1';

// Use the install event to pre-cache all initial resources.
self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
    })()
  );
});

self.addEventListener('fetch', event => {
  // Handle only GET requests
  if (event.request.method === 'GET') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        // Check the cache for the requested resource
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse; // Return cached response if found
        }
        
        try {
          // If not cached, fetch from the network
          const fetchResponse = await fetch(event.request);
          
          // Cache the response if it is valid
          if (fetchResponse && fetchResponse.status === 200) {
            cache.put(event.request, fetchResponse.clone());
          }
          return fetchResponse;
        } catch (e) {
          // Handle network errors here, potentially serve fallback content
          console.error('Fetch failed:', e);
          // Optionally serve offline page or fallback content
          return caches.match('/offline.html');
        }
      })()
    );
  } else {
    // For non-GET requests, perform network fetch without caching
    event.respondWith(fetch(event.request));
  }
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('push', function (event) {

});

self.addEventListener('sync', event => {
  if (event.tag === 'track-location') {
      event.waitUntil(trackAndSyncLocation());
  }
});

let userClasses = [];

self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SET_CLASSES') {
        // Store the classes received from the main script
        userClasses = event.data.classes;
    }
});

async function trackAndSyncLocation() {
  try {
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(async position => {
              const location = {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude
              };

        
              // Sync location data with the server
              await syncLocationData(location);
          }, error => {
              console.error(`Error getting location: ${error.message}`);
          });
      } else {
          console.error("Geolocation is not supported by this browser.");
      }
  } catch (error) {
      console.error('Failed to track and sync location:', error);
  }
}


function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Radius of the Earth in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
}





