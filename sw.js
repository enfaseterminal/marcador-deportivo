// Generamos un nombre de caché único basado en el día/hora de despliegue
const CACHE_NAME = 'liga-escolar-cache-' + new Date().getTime();

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/privacidad.html',
  '/404.html',
  '/site.webmanifest',
  '/css/base.css',
  '/css/themes.css',
  '/css/layout.css',
  '/css/components.css',
  '/js/clock.js',
  '/js/storage.js',
  '/js/match-core.js',
  '/imagenes/favicon-32x32.png'
];

// INSTALACIÓN: Crea la nueva caché
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Nueva caché abierta:', CACHE_NAME);
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting()) // Fuerza a la nueva versión a tomar el control
  );
});

// ACTIVACIÓN: Borra TODAS las cachés antiguas de versiones anteriores
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Borrando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Toma control de las pestañas abiertas inmediatamente
  );
});

// ESTRATEGIA: Network First (Intenta red, si falla usa caché)
// Ideal para marcadores: si hay internet, trae lo último; si no, usa lo guardado.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
