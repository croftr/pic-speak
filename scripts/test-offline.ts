/**
 * End-to-end check of the offline service worker.
 *
 * Starts its own production server (requires `npm run build` first), warms the
 * service worker cache, then KILLS the server and verifies the app still works.
 * Killing the server is the only honest way to test this: Playwright's
 * setOffline() does not apply to service-worker-initiated fetches.
 *
 * Usage: npx tsx scripts/test-offline.ts
 */
import { chromium } from '@playwright/test';
import { spawn, execSync } from 'child_process';

const PORT = 4599;
const BASE_URL = `http://localhost:${PORT}`;

async function waitForServer(url: string, timeoutMs = 30_000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        try {
            const res = await fetch(url);
            if (res.ok) return;
        } catch {
            // not up yet
        }
        await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error(`server did not start at ${url}`);
}

async function main() {
    console.log('1. Starting production server ...');
    const server = spawn('npx', ['next', 'start', '-p', String(PORT)], {
        shell: true,
        stdio: 'ignore',
        detached: false,
    });
    const killServer = () => {
        try {
            execSync(`taskkill /PID ${server.pid} /T /F`, { stdio: 'ignore' });
        } catch {
            // already dead
        }
    };

    try {
        await waitForServer(BASE_URL);

        const browser = await chromium.launch();
        const page = await (await browser.newContext()).newPage();

        console.log('2. Loading landing page and waiting for service worker ...');
        await page.goto(BASE_URL, { waitUntil: 'load' });
        await page.evaluate(async () => {
            const reg = await navigator.serviceWorker.ready;
            if (!reg.active) throw new Error('no active service worker');
        });

        // Reload so the navigation is fetched under SW control and cached
        await page.reload({ waitUntil: 'load' });
        const cacheNames = await page.evaluate(() => caches.keys());
        console.log('3. Caches created:', cacheNames.join(', '));
        if (!cacheNames.some((n) => n.startsWith('static-'))) {
            throw new Error('static cache missing — precache failed');
        }

        // Reproduce the real-world flow: reach a page by CLIENT-SIDE navigation
        // only (no full document request), then later cold-launch it offline.
        // This only works if DocumentCacheWarmer cached the page's HTML.
        console.log('4. Client-side navigating to /public-boards ...');
        await page.click('a[href="/public-boards"]');
        await page.waitForSelector('h1');
        await page.waitForFunction(
            () => caches.match('/public-boards').then((r) => !!r),
            undefined,
            { timeout: 10_000 }
        );
        console.log('   OK — page HTML warmed into cache');

        console.log('5. Warming an audio file into the cache ...');
        await page.evaluate(async () => {
            const res = await fetch('/prebuilt/banana.wav');
            if (!res.ok) throw new Error(`audio warm fetch failed: ${res.status}`);
        });
        await page.waitForFunction(
            () => caches.match('/prebuilt/banana.wav', { ignoreVary: true }).then((r) => !!r),
            undefined,
            { timeout: 10_000 }
        );
        console.log('   OK — audio cached');

        console.log('6. Killing server to go truly offline ...');
        killServer();
        await new Promise((r) => setTimeout(r, 1000));

        console.log('7. Cold-loading the client-side-visited page while offline ...');
        await page.goto(`${BASE_URL}/public-boards`, { waitUntil: 'load' });
        const warmedHeading = await page.textContent('h1');
        if (!warmedHeading?.includes('Public Boards')) {
            throw new Error(`expected cached Public Boards page, got h1: "${warmedHeading}"`);
        }
        console.log(`   OK — served from cache (h1: "${warmedHeading}")`);

        console.log('8. Cold-loading the landing page while offline ...');
        await page.goto(BASE_URL, { waitUntil: 'load' });
        const title = await page.title();
        if (!title.includes('My Voice Board')) {
            throw new Error(`offline reload served wrong page: "${title}"`);
        }
        console.log(`   OK — served from cache (title: "${title}")`);

        console.log('9. Client-side navigating while offline (RSC fetch must fall back) ...');
        await page.click('a[href="/public-boards"]');
        await page.waitForFunction(
            () => document.querySelector('h1')?.textContent?.includes('Public Boards'),
            undefined,
            { timeout: 15_000 }
        );
        console.log('   OK — offline client-side navigation landed on cached page');

        console.log('10. Navigating offline to a never-visited page ...');
        await page.goto(`${BASE_URL}/about`, { waitUntil: 'load' });
        const heading = await page.textContent('h1');
        if (!heading?.toLowerCase().includes('offline')) {
            throw new Error(`expected offline fallback page, got h1: "${heading}"`);
        }
        console.log(`   OK — offline fallback shown ("${heading}")`);

        // A previously-signed-in user must keep their "My Boards" entrance
        // offline (Clerk can't confirm the session, but the boards are cached).
        // setOffline makes navigator.onLine false and blocks page-initiated
        // requests like clerk-js, mirroring a device with wifi/data off.
        console.log('11. Offline landing page for a remembered signed-in user ...');
        await page.context().setOffline(true);
        await page.goto(BASE_URL, { waitUntil: 'load' });
        await page.evaluate(() => localStorage.setItem('mvb:was-signed-in', '1'));
        await page.reload({ waitUntil: 'load' });
        await page.waitForSelector('a[href="/my-boards"]', { timeout: 10_000 });
        console.log('   OK — My Boards link shown from offline auth memory');

        // Audio elements (iOS especially) request media with a Range header and
        // require a genuine 206 Partial Content reply — a cached 200 is refused.
        console.log('12. Byte-range request for cached audio while offline ...');
        const rangeResult = await page.evaluate(async () => {
            const res = await fetch('/prebuilt/banana.wav', {
                headers: { Range: 'bytes=0-99' },
            });
            const bytes = (await res.arrayBuffer()).byteLength;
            return {
                status: res.status,
                contentRange: res.headers.get('Content-Range'),
                bytes,
            };
        });
        if (rangeResult.status !== 206 || rangeResult.bytes !== 100) {
            throw new Error(
                `expected 206 with 100 bytes, got ${rangeResult.status} with ${rangeResult.bytes} bytes (Content-Range: ${rangeResult.contentRange})`
            );
        }
        console.log(
            `   OK — 206 Partial Content served from cache (${rangeResult.contentRange})`
        );

        const openEnded = await page.evaluate(async () => {
            const res = await fetch('/prebuilt/banana.wav', {
                headers: { Range: 'bytes=0-' },
            });
            return { status: res.status, bytes: (await res.arrayBuffer()).byteLength };
        });
        if (openEnded.status !== 206 || openEnded.bytes < 1000) {
            throw new Error(
                `expected 206 with full body for open-ended range, got ${openEnded.status} with ${openEnded.bytes} bytes`
            );
        }
        console.log(`   OK — open-ended range (bytes=0-) served ${openEnded.bytes} bytes`);

        await browser.close();
        console.log('\nAll offline checks passed.');
    } finally {
        killServer();
    }
}

main().catch((err) => {
    console.error('\nOFFLINE TEST FAILED:', err.message);
    process.exit(1);
});
