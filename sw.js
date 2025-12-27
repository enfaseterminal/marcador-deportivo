// sw.js - Service Worker Único para Liga Escolar
const CACHE_VERSION = 'v3';
const CACHE_NAME = `liga-escolar-${CACHE_VERSION}`;

// Assets principales que SIEMPRE deben cachearse
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/404.html',
  '/privacidad.html',
  '/site.webmanifest',
  
  // CSS comunes
  '/css/base.css',
  '/css/themes.css',
  '/css/layout.css',
  '/css/components.css',
  '/css/header-with-bg.css',
  
  // JS comunes
  '/js/clock.js',
  '/js/main.js',
  '/js/ads-analytics.js',
  '/js/celebrate.js',
  
  // Imágenes principales
  '/imagenes/favicon.ico',
  '/imagenes/favicon-32x32.png',
  '/imagenes/favicon-16x16.png',
  '/imagenes/apple-touch-icon-180x180.png',
  '/imagenes/pizarra.png'
];

// NO cachear estas URLs (analytics, ads, etc.)
const DO_NOT_CACHE = [
  'googletagmanager',
  'google-analytics',
  'googlesyndication',
  'adsbygoogle',
  'gen_204',
  'sodar'
];

self.addEventListener('install', (event) => {
  console.log('[SW] Instalando versión:', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cacheando recursos principales');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activando versión:', CACHE_VERSION);
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Eliminando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // 1. Evitar peticiones no GET
  if (event.request.method !== 'GET') {
    return;
  }
  
  // 2. Evitar cachear recursos de analytics/ads
  const shouldSkipCache = DO_NOT_CACHE.some(term => url.href.includes(term));
  if (shouldSkipCache) {
    console.log('[SW] Saltando caché para:', url.pathname);
    return fetch(event.request);
  }
  
  // 3. Estrategia: Cache First para recursos estáticos, Network First para HTML
  event.respondWith(
    (async () => {
      // Para páginas HTML (navegación)
      if (event.request.headers.get('accept')?.includes('text/html')) {
        try {
          // Intenta red primero
          const networkResponse = await fetch(event.request);
          
          // Clona y guarda en caché para futuras visitas
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request, networkResponse.clone());
          
          return networkResponse;
        } catch (error) {
          // Si falla la red, busca en caché
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Si no hay nada en caché, devuelve la página principal
          return caches.match('/');
        }
      }
      
      // Para recursos estáticos (CSS, JS, imágenes): Cache First
      const cachedResponse = await caches.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }
      
      try {
        const networkResponse = await fetch(event.request);
        
        // Solo cachear si es del mismo origen
        if (url.origin === location.origin) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request, networkResponse.clone());
        }
        
        return networkResponse;
      } catch (error) {
        // Fallback para imágenes
        if (event.request.destination === 'image') {
          return caches.match('/imagenes/favicon.ico');
        }
        
        // Fallback para CSS
        if (url.pathname.endsWith('.css')) {
          return new Response('', {
            headers: { 'Content-Type': 'text/css' }
          });
        }
        
        throw error;
      }
    })()
  );
});

// Manejar mensajes (para actualizar caché)
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
