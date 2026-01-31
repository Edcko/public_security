/**
 * Service Worker for PWA - Sistema de Gestión Policial
 *
 * Estrategias de Caching:
 * - App Shell: Cache First (para layouts, chunks estáticos)
 * - Navegación: Network First, luego Cache
 * - API GET: Cache con actualización en background (Stale-While-Revalidate)
 * - API POST/PUT/DELETE: Network Only (con cola offline)
 * - Imágenes/Assets: Cache First
 */

const CACHE_VERSION = 'v2';
const CACHE_NAME = `seguridad-publica-${CACHE_VERSION}`;

// App Shell - archivos críticos que siempre deben estar cacheados
const APP_SHELL_CACHE = 'app-shell-v1';
const APP_SHELL_URLS = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Tiempos de expiración (en segundos)
const CACHE_EXPIRATION = {
  API: 300, // 5 minutos
  ASSETS: 86400, // 24 horas
  APP_SHELL: 604800, // 7 días
};

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Install event triggered');
  event.waitUntil(
    Promise.all([
      // Cachear App Shell
      caches.open(APP_SHELL_CACHE).then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(APP_SHELL_URLS.map(url => new Request(url, { cache: 'reload' })));
      }).catch(err => {
        console.warn('[SW] Failed to cache app shell:', err);
        // No fallar la instalación si algunas URLs no están disponibles
        return Promise.resolve();
      }),
      // Crear cache principal
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[SW] Main cache created');
      })
    ])
  );
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event triggered');
  event.waitUntil(
    Promise.all([
      // Limpiar caches antiguos
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== APP_SHELL_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Tomar control de todos los clientes inmediatamente
      self.clients.claim()
    ])
  );
});

/**
 * Estrategia: Stale-While-Revalidate
 * Sirve del cache inmediatamente y actualiza en background
 */
function staleWhileRevalidate(request, cacheName) {
  return caches.open(cacheName).then((cache) => {
    return cache.match(request).then((cachedResponse) => {
      // Fetch en background para actualizar el cache
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      });

      // Retornar respuesta cacheada inmediatamente, o el fetch si no hay cache
      return cachedResponse || fetchPromise;
    });
  });
}

/**
 * Estrategia: Network First con Cache Fallback
 * Intenta network primero, si falla va al cache
 */
function networkFirst(request, cacheName) {
  return fetch(request).then((networkResponse) => {
    // Cacheamos la respuesta de network
    if (networkResponse && networkResponse.status === 200) {
      const responseClone = networkResponse.clone();
      caches.open(cacheName).then((cache) => {
        cache.put(request, responseClone);
      });
    }
    return networkResponse;
  }).catch(() => {
    // Network falló, intentar con cache
    return caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log('[SW] Serving from cache:', request.url);
        return cachedResponse;
      }
      // No hay cache ni network - retornar error offline
      throw new Error('Offline - No cached version available');
    });
  });
}

/**
 * Estrategia: Cache First con Network Fallback
 * Sirve del cache primero, si no existe va a network
 */
function cacheFirst(request, cacheName) {
  return caches.match(request).then((cachedResponse) => {
    if (cachedResponse) {
      // Actualizar en background
      fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          caches.open(cacheName).then((cache) => {
            cache.put(request, networkResponse);
          });
        }
      });
      return cachedResponse;
    }

    return fetch(request).then((networkResponse) => {
      if (networkResponse && networkResponse.status === 200) {
        const responseClone = networkResponse.clone();
        caches.open(cacheName).then((cache) => {
          cache.put(request, responseClone);
        });
      }
      return networkResponse;
    });
  });
}

/**
 * Estrategia: Network Only
 * Solo para POST/PUT/DELETE o datos sensibles
 */
function networkOnly(request) {
  return fetch(request).catch(() => {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Offline - La conexión es necesaria para esta operación',
        offline: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  });
}

// Handler principal de fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo procesar requests del mismo origen
  if (url.origin !== self.location.origin) {
    return;
  }

  // ========================================
  // API Routes
  // ========================================
  if (url.pathname.startsWith('/api/')) {
    // GET requests: Cache con actualización (Stale-While-Revalidate)
    if (request.method === 'GET') {
      event.respondWith(staleWhileRevalidate(request, CACHE_NAME));
      return;
    }

    // POST/PUT/DELETE: Network Only
    event.respondWith(networkOnly(request));
    return;
  }

  // ========================================
  // Next.js Static Assets (_next/static/)
  // ========================================
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, APP_SHELL_CACHE));
    return;
  }

  // ========================================
  // Navegación (páginas)
  // ========================================
  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirst(request, CACHE_NAME)
        .catch(() => {
          // Offline fallback - mostrar página offline
          return caches.match('/offline.html').then((response) => {
            return response || new Response(
              '<html><body><h1>Offline</h1><p>No tienes conexión a internet.</p></body></html>',
              { headers: { 'Content-Type': 'text/html' } }
            );
          });
        })
    );
    return;
  }

  // ========================================
  // Otros assets (imágenes, fuentes, etc.)
  // ========================================
  event.respondWith(cacheFirst(request, CACHE_NAME));
});

// ========================================
// Background Sync - Para operaciones offline
// ========================================
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'sync-personnel') {
    event.waitUntil(syncPersonnel());
  } else if (event.tag === 'sync-vehicles') {
    event.waitUntil(syncVehicles());
  } else if (event.tag === 'sync-reports') {
    event.waitUntil(syncReports());
  }
});

// Función para sincronizar datos de personal
async function syncPersonnel() {
  try {
    // Obtener datos pendientes de IndexedDB
    const pendingData = await getPendingSyncData('personnel');

    for (const data of pendingData) {
      await fetch('/api/personnel', {
        method: data.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token}`,
        },
        body: JSON.stringify(data.payload),
      });

      // Eliminar de IndexedDB después de sincronizar
      await removePendingSyncData('personnel', data.id);
    }

    console.log('[SW] Personnel sync completed');
  } catch (error) {
    console.error('[SW] Personnel sync failed:', error);
  }
}

// Función para sincronizar vehículos
async function syncVehicles() {
  try {
    const pendingData = await getPendingSyncData('vehicles');

    for (const data of pendingData) {
      await fetch('/api/vehicles', {
        method: data.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token}`,
        },
        body: JSON.stringify(data.payload),
      });

      await removePendingSyncData('vehicles', data.id);
    }

    console.log('[SW] Vehicles sync completed');
  } catch (error) {
    console.error('[SW] Vehicles sync failed:', error);
  }
}

// Función para sincronizar reportes
async function syncReports() {
  try {
    const pendingData = await getPendingSyncData('reports');

    for (const data of pendingData) {
      await fetch('/api/arrests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token}`,
        },
        body: JSON.stringify(data.payload),
      });

      await removePendingSyncData('reports', data.id);
    }

    console.log('[SW] Reports sync completed');
  } catch (error) {
    console.error('[SW] Reports sync failed:', error);
  }
}

// Helpers para IndexedDB (stub - implementación completa requeriría un módulo separado)
async function getPendingSyncData(type) {
  // TODO: Implementar lectura de IndexedDB
  return [];
}

async function removePendingSyncData(type, id) {
  // TODO: Implementar eliminación de IndexedDB
  return Promise.resolve();
}

// ========================================
// Push Notifications
// ========================================
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received');

  let data = {
    title: 'Sistema de Gestión Policial',
    body: 'Tienes una nueva notificación',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
  };

  if (event.data) {
    try {
      const pushData = event.data.json();
      data = { ...data, ...pushData };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [200, 100, 200],
    tag: 'security-notification',
    requireInteraction: true,
    data: {
      url: data.url || '/dashboard',
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/dashboard')
  );
});

// ========================================
// Mensajes desde la aplicación
// ========================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skipping waiting');
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[SW] Clearing cache');
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }

  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        let totalSize = 0;
        const sizePromises = cacheNames.map((cacheName) => {
          return caches.open(cacheName).then((cache) => {
            return cache.keys().then((keys) => {
              const sizePromises = keys.map((request) => {
                return cache.match(request).then((response) => {
                  if (response) {
                    const sizeHeader = response.headers.get('Content-Length');
                    if (sizeHeader) {
                      totalSize += parseInt(sizeHeader, 10);
                    } else {
                      // Estimar tamaño si no hay header
                      totalSize += response.blob().then((blob) => blob.size).catch(() => 0);
                    }
                  }
                  return Promise.resolve();
                });
              });
              return Promise.all(sizePromises);
            });
          });
        });

        return Promise.all(sizePromises).then(() => {
          event.ports[0].postMessage({ size: totalSize });
        });
      })
    );
  }
});

// ========================================
// Periodic Background Sync (para actualizaciones)
// ========================================
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync triggered:', event.tag);

  if (event.tag === 'sync-data') {
    event.waitUntil(
      // Actualizar datos críticos en cache
      Promise.all([
        fetch('/api/personnel').then(response => {
          if (response.ok) return caches.open(CACHE_NAME).then(cache => cache.put('/api/personnel', response));
        }),
        fetch('/api/vehicles').then(response => {
          if (response.ok) return caches.open(CACHE_NAME).then(cache => cache.put('/api/vehicles', response));
        }),
        fetch('/api/corporations').then(response => {
          if (response.ok) return caches.open(CACHE_NAME).then(cache => cache.put('/api/corporations', response));
        }),
      ])
    );
  }
});

console.log('[SW] Service Worker loaded - Version:', CACHE_VERSION);
