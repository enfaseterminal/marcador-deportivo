const CACHE_NAME = 'futbol-sala-v2';
const ASSETS_TO_CACHE = [
  '/futbol-sala/',
  'futbol-sala/index.html',
  // CSS
  '../css/base.css',
  '../css/themes.css',
  '../css/layout.css',
  '../css/components.css',
  '../css/header-with-bg.css',
  '../css/sport-specific/futbol-sala.css',
  // JS
  '../js/clock.js',
  '../js/celebrate.js',
  '../js/common.js',
  '../js/storage.js',
  '../js/match-core.js',
  '../js/modal-manager.js',
  '../js/futbol-sala.js',
  // Imágenes
  'imagenes/pizarra.png',
  'imagenes/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Cache abierto');
      return Promise.all(
        ASSETS_TO_CACHE.map(url => {
          return cache.add(url).catch(error => {
            console.log('Error al cachear:', url, error);
          });
        })
      );
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
  const url = new URL(event.request.url);
  
  // Solo cachear recursos locales, ignorar anuncios y analytics
  if (url.origin === location.origin && 
      !url.pathname.includes('/pagead/') && 
      !url.pathname.includes('/gtag/') &&
      !url.pathname.includes('/getconfig/') &&
      !url.pathname.includes('/sodar/')) {
    
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then(response => {
          // Solo cacheamos respuestas exitosas
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        });
      })
    );
  } else {
    // Para recursos externos, no usar cache
    return;
  }
});
