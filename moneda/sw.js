const CACHE_NAME = 'moneda-v1';
const ASSETS_TO_CACHE = [
  '/moneda/',
  '/moneda/index.html',
  '/moneda/manifest.json',
  // CSS
  '../css/base.css',
  '../css/themes.css',
  '../css/layout.css',
  '../css/components.css',
  '../css/header-with-bg.css',
  '../css/sport-specific/moneda.css',
  // JS
  '../js/common.js',
  '../js/storage.js',
  '../js/moneda.js',
  '../js/ads-analytics.js',
  '../js/celebrate.js',
  '../js/modal-manager.js',
  // Imágenes
  '../imagenes/pizarra.png',
  '../imagenes/favicon.ico',
  '../imagenes/icon-192x192.png',
  '../imagenes/icon-512x512.png'
];

// Instalación
self.addEventListener('install', (event) => {
  console.log('Service Worker Moneda: Instalando...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Cacheando archivos de moneda');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      console.log('Service Worker: Instalación completada');
      return self.skipWaiting();
    })
  );
});

// Activación
self.addEventListener('activate', (event) => {
  console.log('Service Worker Moneda: Activando...');

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
    caches.match(event.request).then((response) => {
      // Retorna el recurso cacheado si existe
      if (response) {
        return response;
      }

      // Si no está en cache, intenta obtenerlo de la red
      return fetch(event.request).then((response) => {
        // Verifica si la respuesta es válida
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clona la respuesta para cachearla
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Si falla la red y es una página, retorna la página offline
        if (event.request.destination === 'document') {
          return caches.match('/moneda/');
        }
      });
    })
  );
});

// Manejo de mensajes
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});