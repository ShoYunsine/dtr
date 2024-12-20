const CACHE_NAME = 'dtr-v2.1';

self.addEventListener('install', event => {
  // You can perform setup during install if needed, but pre-caching is not done here.
});

self.addEventListener('fetch', event => {
  if (event.request.method === 'GET') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(event.request);
        
        // If there's a cached response, return it
        if (cachedResponse) {
          return cachedResponse;
        }

        // If no cached response, try to fetch from the network
        try {
          const fetchResponse = await fetch(event.request);
          
          // Cache valid responses
          if (fetchResponse && fetchResponse.status === 200) {
            cache.put(event.request, fetchResponse.clone());
          }
          return fetchResponse;
        } catch (e) {
          console.error('Fetch failed:', e);
          // Return a generic offline message if fetch fails and no cache is available
          return new Response('You are offline and no cached content is available.', { status: 503 });
        }
      })()
    );
  } else {
    // Non-GET requests are fetched directly without caching
    event.respondWith(fetch(event.request));
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'set-alarm') {
      const targetTime = new Date(event.data.targetTime); // Specific time to execute
      const checkInterval = 60 * 1000; // 1 minute check interval

      const checkTime = () => {
          const now = new Date();
          if (now >= targetTime) {
              console.log('Running the scheduled task at:', now);
              runScheduledTask();
          } else {
              console.log('Waiting for the target time...');
              setTimeout(checkTime, checkInterval);
          }
      };

      checkTime(); // Start the first check
  }
});

function runScheduledTask() {
  // Perform your scheduled task here
  console.log('Scheduled Task Executed!');
  self.registration.showNotification('Task Completed', {
      body: 'Your scheduled task has been executed!',
      icon: '../Images/logo.png',
  });
}


self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      // No deletion of old caches, just log the cache names
      console.log('Caches available during activation:', cacheNames);
      return Promise.resolve(); // Simply resolve the promise
    })
  );
});

// Handle push notifications if needed
self.addEventListener('push', event => {
  // Handle push notifications here
});

// Sync event for tracking location
self.addEventListener('sync', event => {
  // Handle sync events here if needed
});
