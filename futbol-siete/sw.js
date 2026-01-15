const CACHE_NAME = 'futbol7-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  // CSS
  '../css/base.css',
  '../css/themes.css',
  '../css/layout.css',
  '../css/components.css',
  '../css/header-with-bg.css',
  '../css/sport-specific/futbol-siete.css',
  // JS
  '../js/clock.js',
  '../js/celebrate.js',
  '../js/storage.js',
  '../js/ads-analytics.js',
  '../js/futbol-siete.js',
  // Imágenes
  '../imagenes/pizarra.png',
  '../imagenes/favicon.ico',
  '../imagenes/icon-192.png',
  '../imagenes/icon-512.png'
];

// Instalación
self.addEventListener('install', (event) => {
  console.log('Service Worker Fútbol 7: Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cacheando archivos de fútbol 7');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('Service Worker: Instalación completada');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('Error al cachear archivos:', err);
      })
  );
});

// Activación
self.addEventListener('activate', (event) => {
  console.log('Service Worker Fútbol 7: Activando...');
  
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

// Estrategia: Cache First, Network Fallback
self.addEventListener('fetch', (event) => {
  // Solo manejar solicitudes GET
  if (event.request.method !== 'GET') return;
  
  // Ignorar solicitudes a APIs externas
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Si está en cache, devolverlo
      if (cachedResponse) {
        // Actualizar cache en segundo plano
        fetch(event.request).then((networkResponse) => {
          if (networkResponse.ok) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {
          // Si falla la red, mantener la versión cacheada
        });
        
        return cachedResponse;
      }
      
      // Si no está en cache, ir a la red
      return fetch(event.request).then((networkResponse) => {
        // Si la respuesta es válida, guardar en cache
        if (networkResponse.ok) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback para páginas HTML
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('./index.html');
        }
        // Fallback para otros recursos
        return new Response('Offline - No se pudo cargar el recurso', {
          status: 503,
          headers: new Headers({ 'Content-Type': 'text/plain' })
        });
      });
    })
  );
});

// Escuchar mensajes para borrar caché
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'clearCache') {
    console.log('Service Worker: Borrando caché por solicitud...');
    
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            return caches.delete(cacheName);
          })
        );
      }).then(() => {
        console.log('Service Worker: Caché borrada');
        event.ports[0].postMessage({ success: true });
      }).catch((error) => {
        console.error('Service Worker: Error borrando caché:', error);
        event.ports[0].postMessage({ success: false, error: error.message });
      })
    );
  }
});

// Control de versiones
self.addEventListener('activate', (event) => {
  // Enviar mensaje a las páginas abiertas sobre nueva versión
  event.waitUntil(
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'NEW_VERSION',
          version: CACHE_NAME
        });
      });
    })
  );
});
