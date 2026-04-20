'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '[::1]';

    if (process.env.NODE_ENV !== 'production' || isLocalhost) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
        .catch(() => undefined);

      if ('caches' in window) {
        caches
          .keys()
          .then((keys) => Promise.all(keys.filter((key) => key.startsWith('geosnap-cache-')).map((key) => caches.delete(key))))
          .catch(() => undefined);
      }

      return;
    }

    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Service worker registration is best-effort for local development.
    });
  }, []);

  return null;
}
