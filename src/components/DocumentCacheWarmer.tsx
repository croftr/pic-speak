'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Makes pages reached by client-side navigation launchable offline.
 *
 * Next.js soft navigations fetch RSC payloads, not full HTML, so the service
 * worker's navigate handler never sees (or caches) a document for them. This
 * component asks the service worker (via postMessage) to fetch the current
 * page as plain HTML and store it in the pages cache, so a cold offline
 * launch (e.g. the installed PWA with no connection) can serve the full page.
 * The worker does the fetch itself — a page-side fetch would stream to two
 * consumers (page + cache clone) and the browser can cancel the shared
 * stream, silently aborting the cache write.
 */

// Only the pages that matter offline — boards and the lists that lead to them.
const WARM_PATHS = /^\/(my-boards|public-boards|board\/.+)?$/;

// Session-scoped: one warm fetch per path.
const warmed = new Set<string>();

export default function DocumentCacheWarmer() {
    const pathname = usePathname();

    useEffect(() => {
        if (process.env.NODE_ENV !== 'production') return;
        if (!('serviceWorker' in navigator)) return;
        if (!WARM_PATHS.test(pathname) || warmed.has(pathname)) return;

        let cancelled = false;

        navigator.serviceWorker.ready.then((registration) => {
            if (cancelled || !registration.active) return;
            const warmPath = (path: string) => {
                if (warmed.has(path)) return;
                warmed.add(path);
                registration.active?.postMessage({ type: 'warm-document', path });
            };
            warmPath(pathname);
            // The landing page is the offline entry point — refresh its cached
            // copy every session, not only when the user happens to visit it,
            // so it can't go stale across deploys.
            warmPath('/');
        });

        return () => {
            cancelled = true;
        };
    }, [pathname]);

    return null;
}
