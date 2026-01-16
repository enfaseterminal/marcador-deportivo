const CACHE_NAME = 'voleibol-v1';
const ASSETS_TO_CACHE = [
  '/voleibol/',
  '/voleibol/index.html',
  '/voleibol/manifest.json',
  // CSS
  '../css/base.css',
  '../css/themes.css',
  '../css/layout.css',
  '../css/components.css',
  '../css/header-with-bg.css',
  '../css/sport-specific/voleibol.css',
  // JS
  '../js/common.js',
  '../js/match-core.js',
  '../js/storage.js',
  '../js/voleibol.js',
  '../js/ads-analytics.js',
  '../js/clock.js',
  '../js/celebrate.js',
  '../js/modal-manager.js',
  '../js/score-manager.js',
  // Imágenes
  '../imagenes/pizarra.png',
  '../imagenes/favicon.ico',
  '../imagenes/icon-192x192.png',
  '../imagenes/icon-512x512.png'
];

// Instalación
self.addEventListener('install', (event) => {
  console.log('Service Worker Voleibol: Instalando...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Cacheando archivos de voleibol');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      console.log('Service Worker: Instalación completada');
      return self.skipWaiting();
    })
  );
});

// Activación
self.addEventListener('activate', (event) => {
  console.log('Service Worker Voleibol: Activando...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Borrando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activación completada');
      return self.clients.claim();
    })
  );
});

// Fetch
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        return fetch(event.request).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // Offline fallback
        if (event.request.destination === 'document') {
          return caches.match('/voleibol/index.html');
        }
      })
  );
});

// Manejar mensajes (para actualizar caché)
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});