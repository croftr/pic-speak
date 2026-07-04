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

        console.log('4. Killing server to go truly offline ...');
        killServer();
        await new Promise((r) => setTimeout(r, 1000));

        console.log('5. Reloading previously-visited page while offline ...');
        await page.reload({ waitUntil: 'load' });
        const title = await page.title();
        if (!title.includes('My Voice Board')) {
            throw new Error(`offline reload served wrong page: "${title}"`);
        }
        console.log(`   OK — served from cache (title: "${title}")`);

        console.log('6. Navigating offline to a never-visited page ...');
        await page.goto(`${BASE_URL}/public-boards`, { waitUntil: 'load' });
        const heading = await page.textContent('h1');
        if (!heading?.toLowerCase().includes('offline')) {
            throw new Error(`expected offline fallback page, got h1: "${heading}"`);
        }
        console.log(`   OK — offline fallback shown ("${heading}")`);

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
