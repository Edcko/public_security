/**
 * PWA Registration Hook
 * Hook personalizado para registrar el service worker
 */

import { useEffect, useState } from 'react';

export function usePWA() {
  const [isOnline, setIsOnline] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    // Verificar soporte de PWA
    setSupportsPWA('serviceWorker' in navigator);

    // Event listeners para online/offline
    const handleOnline = () => {
      setIsOnline(true);
      setIsOffline(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!supportsPWA) return;

    // Registrar service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registrado:', registration);

          // Verificar actualizaciones
          registration.addEventListener('updatefound', (event: any) => {
            const newWorker = event.waiting;
            if (newWorker) {
              setUpdateAvailable(true);
              setWaitingWorker(newWorker);
            }
          });
        })
        .catch((error) => {
          console.error('Error registrando Service Worker:', error);
        });
    }
  }, [supportsPWA]);

  // Activar nueva versión cuando esté disponible
  const activateUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setUpdateAvailable(false);
      setWaitingWorker(null);
      window.location.reload();
    }
  };

  return {
    isOnline,
    isOffline,
    supportsPWA,
    updateAvailable,
    activateUpdate,
  };
}
