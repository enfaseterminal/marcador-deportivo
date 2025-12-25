const CACHE_NAME = 'liga-escolar-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/privacidad.html',
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

// Instalación: Guardar archivos esenciales en caché
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Estrategia: Primero intentar red, si falla usar caché (útil para marcadores offline)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
