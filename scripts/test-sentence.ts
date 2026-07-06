/**
 * End-to-end check of the sentence builder mode.
 *
 * Starts its own production server (requires `npm run build` first) and
 * exercises the public starter-template board, which needs no auth.
 *
 * Usage: npx tsx scripts/test-sentence.ts
 */
import { chromium } from '@playwright/test';
import { spawn, execSync } from 'child_process';

const PORT = 4599;
const BASE_URL = `http://localhost:${PORT}`;
const BOARD_URL = `${BASE_URL}/board/starter-template`;

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

        console.log('2. Loading the starter board ...');
        await page.goto(BOARD_URL, { waitUntil: 'load' });
        const toggleButton = page.locator('button[aria-label="Toggle sentence builder"]');
        await toggleButton.waitFor({ state: 'visible', timeout: 10_000 });
        console.log('   OK — sentence toggle visible');

        console.log('3. Toggling sentence mode on ...');
        await toggleButton.click();
        await page.waitForSelector('[data-testid="sentence-strip"]', { timeout: 5_000 });
        await page.waitForSelector('[data-testid="sentence-empty-hint"]', { timeout: 5_000 });
        console.log('   OK — strip and empty hint appeared');

        console.log('4. Tapping cards to build a sentence ...');
        const cards = page.locator('[data-card-id]');
        const cardCount = await cards.count();
        if (cardCount < 2) throw new Error('starter board needs at least 2 cards for this test');

        const firstCardLabel = (await cards.nth(0).locator('h3').textContent())?.trim();
        const secondCardLabel = (await cards.nth(1).locator('h3').textContent())?.trim();
        if (!firstCardLabel || !secondCardLabel) throw new Error('could not read card labels');

        await cards.nth(0).click();
        await cards.nth(1).click();
        const chips = page.locator('[data-testid="sentence-chip"]');
        if ((await chips.count()) !== 2) throw new Error(`expected 2 chips, got ${await chips.count()}`);
        console.log('   OK — 2 chips added');

        console.log('5. Tapping the first card again (duplicate support) ...');
        await cards.nth(0).click();
        if ((await chips.count()) !== 3) throw new Error(`expected 3 chips after duplicate tap, got ${await chips.count()}`);
        console.log('   OK — 3 chips (duplicate word supported)');

        console.log('6. Removing a chip by tapping it ...');
        await chips.nth(0).click();
        if ((await chips.count()) !== 2) throw new Error(`expected 2 chips after removing one, got ${await chips.count()}`);
        console.log('   OK — chip removed');

        console.log('7. Removing via backspace ...');
        await page.locator('[data-testid="sentence-backspace"]').click();
        if ((await chips.count()) !== 1) throw new Error(`expected 1 chip after backspace, got ${await chips.count()}`);
        console.log('   OK — backspace removed last item');

        console.log('8. Re-adding a card and testing play ...');
        await cards.nth(1).click();
        if ((await chips.count()) !== 2) throw new Error('expected 2 chips before play test');

        const playButton = page.locator('[data-testid="sentence-play"]');
        await playButton.click();
        await page.waitForSelector('button[aria-label="Stop sentence"]', { timeout: 5_000 });
        console.log('   OK — play button flipped to stop');

        await page.waitForSelector('button[aria-label="Play sentence"]', { timeout: 25_000 });
        console.log('   OK — playback finished, button returned to play');

        console.log('9. Changing category filter (chips should be unaffected) ...');
        const categoryButtons = page.locator('button', { hasText: /^All \(/ });
        if ((await categoryButtons.count()) > 0) {
            const otherCategoryButton = page.locator('main button').filter({ hasText: /\(\d+\)$/ }).nth(1);
            if ((await otherCategoryButton.count()) > 0) {
                await otherCategoryButton.click();
                await page.waitForTimeout(300);
                if ((await chips.count()) !== 2) throw new Error('chip count changed after filtering by category');
                await categoryButtons.first().click();
            }
            console.log('   OK — chips unaffected by category filter');
        } else {
            console.log('   SKIP — no category filter on this board');
        }

        console.log('10. Clearing the sentence ...');
        await page.locator('[data-testid="sentence-clear"]').click();
        await page.waitForSelector('[data-testid="sentence-empty-hint"]', { timeout: 5_000 });
        console.log('   OK — strip empty again');

        console.log('11. Locking the board ...');
        const lockButton = page.locator('button[aria-label="Lock board for child use"]');
        await lockButton.click();
        const unlockButton = page.locator('button[aria-label="Unlock board"]');
        await unlockButton.waitFor({ state: 'visible', timeout: 10_000 });
        const lockedToggle = page.locator('button[aria-label="Toggle sentence builder"]');
        await lockedToggle.waitFor({ state: 'visible', timeout: 5_000 });
        console.log('   OK — sentence toggle present while locked');

        console.log('12. Tapping cards while locked ...');
        await cards.nth(0).click();
        if ((await chips.count()) !== 1) throw new Error('tapping card while locked did not append to strip');
        console.log('   OK — cards still append while locked');

        console.log('13. Reloading while locked ...');
        await page.reload({ waitUntil: 'load' });
        await unlockButton.waitFor({ state: 'visible', timeout: 10_000 });
        await page.waitForSelector('[data-testid="sentence-strip"]', { timeout: 5_000 });
        console.log('   OK — sentence mode restored from sessionStorage after reload');

        console.log('14. Toggling sentence mode off ...');
        await lockedToggle.click();
        if ((await page.locator('[data-testid="sentence-strip"]').count()) !== 0) {
            throw new Error('sentence strip still present after toggling off');
        }
        await cards.nth(0).click();
        await page.waitForTimeout(300);
        console.log('   OK — strip gone after toggling off');

        await browser.close();
        console.log('\nAll sentence builder checks passed.');
    } finally {
        killServer();
    }
}

main().catch((err) => {
    console.error('\nSENTENCE BUILDER TEST FAILED:', err.message);
    process.exit(1);
});
