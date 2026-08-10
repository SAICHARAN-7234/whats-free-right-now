/**
 * "WHAT'S FREE RIGHT NOW?" — Service Worker
 * Enables offline caching, push notifications, and background sync
 * for the Progressive Web App experience.
 */

const CACHE_NAME = 'wfrn-cache-v1';
const CACHE_ASSETS = [
  './',
  'index.html',
  'css/styles.css',
  'js/data.js',
  'js/search.js',
  'js/map.js',
  'js/app.js',
  'manifest.json',
  'icons/icon-192.svg',
  'icons/icon-512.svg',
  'icons/icon-maskable.svg'
];

// --- Install: Pre-cache all core assets ---
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Pre-caching core app shell assets');
        return cache.addAll(CACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// --- Activate: Clean up old caches ---
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// --- Fetch: Network-first strategy with cache fallback ---
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // For navigation requests (HTML pages), use network-first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match('index.html'))
    );
    return;
  }

  // For other assets (CSS, JS, images), use cache-first with network fallback
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return from cache and update in background
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
            return networkResponse;
          }).catch(() => {});
          return cachedResponse;
        }
        // Not in cache, fetch from network
        return fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        });
      })
  );
});

// --- Push Notifications ---
self.addEventListener('push', (event) => {
  let data = { title: "What's Free Right Now?", body: 'A facility just became available!' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: 'icons/icon-192.svg',
    badge: 'icons/icon-192.svg',
    vibrate: [200, 50, 200],
    data: {
      url: data.url || './',
      dateOfArrival: Date.now()
    },
    actions: [
      { action: 'view', title: '⚡ View Now' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    tag: 'wfrn-notification',
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// --- Notification Click: Open the app ---
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || './';

  if (event.action === 'view' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((windowClients) => {
          // If app is already open, focus it
          for (const client of windowClients) {
            if (client.url.includes('index.html') && 'focus' in client) {
              return client.focus();
            }
          }
          // Otherwise open new window
          return clients.openWindow(targetUrl);
        })
    );
  }
});

// --- Background Sync: Retry failed bookings when back online ---
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-bookings') {
    event.waitUntil(syncPendingBookings());
  }
});

async function syncPendingBookings() {
  // In production: read pending bookings from IndexedDB and POST to server
  console.log('[SW] Background sync: checking for pending bookings...');
}
