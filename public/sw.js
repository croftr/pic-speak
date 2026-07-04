/*
 * Service worker for My Voice Board.
 *
 * Goals, in order of importance:
 *  1. Card audio and images keep working (and play instantly) offline —
 *     Vercel Blob URLs are immutable, so they are cached cache-first forever.
 *  2. Boards the user has opened before remain viewable offline —
 *     pages and API data are network-first with cache fallback.
 *  3. A friendly offline page for anything we've never seen.
 *
 * Bump CACHE_VERSION to invalidate all caches on deploy of breaking changes.
 */

const CACHE_VERSION = 'v2';
// Media (card images/audio) lives at immutable URLs and never goes stale, so
// it survives version bumps — wiping it would silence boards until the next
// online visit.
const MEDIA_VERSION = 'v1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const PAGES_CACHE = `pages-${CACHE_VERSION}`;
const MEDIA_CACHE = `media-${MEDIA_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;
const ALL_CACHES = [STATIC_CACHE, PAGES_CACHE, MEDIA_CACHE, API_CACHE];

const OFFLINE_URL = '/offline.html';

// Rough safety valve so caches don't grow unbounded on shared devices.
const MEDIA_MAX_ENTRIES = 1000;
const PAGES_MAX_ENTRIES = 100;
const API_MAX_ENTRIES = 100;

self.addEventListener('install', (event) => {
    event.waitUntil(
        Promise.all([
            caches.open(STATIC_CACHE).then((cache) =>
                cache.addAll([
                    OFFLINE_URL,
                    '/logo.svg',
                    '/icons/icon-192.png',
                ])
            ),
            // Precache the landing page so the very first visit's document
            // (which loads before this worker controls the page) is available
            // offline. Never fail install over it.
            caches.open(PAGES_CACHE).then((cache) => cache.add('/').catch(() => {})),
        ]).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter((key) => !ALL_CACHES.includes(key))
                        .map((key) => caches.delete(key))
                )
            )
            .then(() => self.clients.claim())
    );
});

/** Delete oldest entries beyond maxEntries (FIFO — Cache API keys are insertion-ordered). */
async function trimCache(cacheName, maxEntries) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length <= maxEntries) return;
    await Promise.all(keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key)));
}

/** Cache-first for immutable content (blob media, hashed build assets). */
async function cacheFirst(request, cacheName, maxEntries) {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Blob media is requested no-cors by <img>/<audio>, which yields opaque
    // responses that inflate storage quota. Vercel Blob supports CORS, so
    // re-request with CORS to cache a normal, inspectable response.
    let response;
    try {
        response = await fetch(request.url, { mode: 'cors' });
    } catch {
        response = await fetch(request);
    }

    if (response.ok || response.type === 'opaque') {
        const cache = await caches.open(cacheName);
        cache.put(request, response.clone());
        if (maxEntries) trimCache(cacheName, maxEntries);
    }
    return response;
}

/** Serve from cache immediately, refresh the cache in the background. */
async function staleWhileRevalidate(request, cacheName) {
    const cached = await caches.match(request);
    const refresh = fetch(request)
        .then(async (response) => {
            if (response.ok) {
                const cache = await caches.open(cacheName);
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => undefined);

    if (cached) return cached;
    const response = await refresh;
    if (!response) throw new Error('offline and not cached');
    return response;
}

/** Network-first with cache fallback for pages and data. */
async function networkFirst(request, cacheName, maxEntries, offlineFallback) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
            if (maxEntries) trimCache(cacheName, maxEntries);
        }
        return response;
    } catch (err) {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (offlineFallback) {
            const fallback = await caches.match(offlineFallback);
            if (fallback) return fallback;
        }
        throw err;
    }
}

self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') return;

    let url;
    try {
        url = new URL(request.url);
    } catch {
        return;
    }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return;

    const sameOrigin = url.origin === self.location.origin;
    const isBlobMedia = url.hostname.endsWith('.public.blob.vercel-storage.com');

    // Leave third-party requests (Clerk, analytics) to the browser.
    if (!sameOrigin && !isBlobMedia) return;

    // 1. Card images and audio — immutable, cache-first.
    if (isBlobMedia) {
        event.respondWith(cacheFirst(request, MEDIA_CACHE, MEDIA_MAX_ENTRIES));
        return;
    }

    // 2. Hashed build assets and optimized images — cache-first.
    if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/_next/image')) {
        event.respondWith(cacheFirst(request, STATIC_CACHE));
        return;
    }

    // 3. Page navigations — network-first, cached copy offline, else offline page.
    //    Also matches DocumentCacheWarmer's plain HTML fetches: client-side
    //    (RSC) navigations never produce a real `navigate` request, so the
    //    warmer refetches the full document to make the page launchable offline.
    const wantsHtml =
        request.mode === 'navigate' ||
        (request.destination === '' &&
            !request.headers.get('RSC') &&
            (request.headers.get('accept') || '').includes('text/html'));
    if (wantsHtml) {
        event.respondWith(networkFirst(request, PAGES_CACHE, PAGES_MAX_ENTRIES, OFFLINE_URL));
        return;
    }

    // 4. Next.js client-side navigation payloads (RSC) — network-first.
    if (url.searchParams.has('_rsc') || request.headers.get('RSC') === '1') {
        event.respondWith(networkFirst(request, PAGES_CACHE, PAGES_MAX_ENTRIES));
        return;
    }

    // 5. API data — network-first so boards/cards stay fresh but survive offline.
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirst(request, API_CACHE, API_MAX_ENTRIES));
        return;
    }

    // 6. Other same-origin files (svg, fonts, manifest) — cached copy fast,
    //    refreshed in the background so nothing goes permanently stale.
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
});
