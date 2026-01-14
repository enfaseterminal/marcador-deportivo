const CACHE_NAME = 'futbol-sala-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/ayuda.html',
  // CSS
  '/css/base.css',
  '/css/themes.css',
  '/css/layout.css',
  '/css/components.css',
  '/css/header-with-bg.css',
  '/css/sport-specific/futbol-sala.css',
  // JS
  '/js/clock.js',
  '/js/celebrate.js',
  '/js/storage.js',
  '/js/ads-analytics.js',
  '/js/match-core.js',
  '/js/modal-manager.js',
  '/js/futbol-sala.js',
  // Imágenes
  '/imagenes/pizarra.png',
  '/imagenes/favicon.ico',
  '/imagenes/icon-192.png',
  '/imagenes/icon-512.png'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cacheando archivos');
        return cache.addAll(ASSETS_TO_CACHE)
          .then(() => self.skipWaiting())
          .catch(err => {
            console.log('Error al cachear algunos archivos:', err);
          });
      })
      .then(() => {
        console.log('Service Worker: Instalación completada');
        return self.skipWaiting();
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activando...');
  
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

// Estrategia de cache: Cache First, luego Network
self.addEventListener('fetch', (event) => {
  // Ignorar solicitudes que no son GET
  if (event.request.method !== 'GET') return;
  
  // Ignorar solicitudes a APIs externas y analytics
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    // Para recursos externos, usar Network First
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Si la respuesta es válida, guardar en cache
          if (response.ok && event.request.url.includes('googletagmanager') === false) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Si falla la red, intentar servir desde cache
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Para recursos locales
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Si está en cache, devolverlo
        if (cachedResponse) {
          // Actualizar el cache en segundo plano
          fetchAndCache(event.request);
          return cachedResponse;
        }
        
        // Si no está en cache, ir a la red
        return fetchAndCache(event.request);
      })
      .catch(() => {
        // Fallback para páginas HTML
        if (event.request.headers.get('
