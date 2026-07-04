'use client';

import { useEffect } from 'react';

/**
 * Registers the offline service worker (public/sw.js).
 * Production-only: caching intermediate builds in dev makes debugging miserable.
 */
export default function ServiceWorkerRegistration() {
    useEffect(() => {
        if (process.env.NODE_ENV !== 'production') return;
        if (!('serviceWorker' in navigator)) return;

        const register = () => {
            navigator.serviceWorker
                .register('/sw.js')
                .catch((err) => console.error('Service worker registration failed:', err));
        };

        if (document.readyState === 'complete') {
            register();
        } else {
            window.addEventListener('load', register, { once: true });
            return () => window.removeEventListener('load', register);
        }
    }, []);

    return null;
}
