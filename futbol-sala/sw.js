const CACHE_NAME = 'futbol-sala-v1';
const ASSETS_TO_CACHE = [
  './',
  'index.html',
  'site.webmanifest',
  // CSS (Rutas relativas al SW)
  '../css/base.css',
  '../css/themes.css',
  '../css/layout.css',
  '../css/components.css',
  '../css/header-with-bg.css',
  '../css/sport-specific/futbol-sala.css',
  // JS (Rutas relativas al SW)
  '../js/ads-analytics.js',
  '../js/clock.js',
  '../js/celebrate.js',
  '../js/common.js',
  '../js/storage.js',
  '../js/match-core.js',
  '../js/modal-manager.js',
  '../js/futbol-sala.js',
  // Imágenes locales del marcador
  'imagenes/pizarra.png',
  'imagenes/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Usamos {cache: 'reload'} para forzar la descarga de la red durante la instalación
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Si está en caché, lo devuelve; si no, va a la red
      return cachedResponse || fetch(event.request);
    })
  );
});
