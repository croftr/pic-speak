/**
 * End-to-end check of the locked "use mode" (child/kiosk mode).
 *
 * Starts its own production server (requires `npm run build` first) and
 * exercises the public starter-template board, which needs no auth.
 *
 * Usage: npx tsx scripts/test-lock-mode.ts
 */
import { chromium } from '@playwright/test';
import { startProdServer } from './lib/prod-server';

const PORT = 4598;
const BASE_URL = `http://localhost:${PORT}`;
const BOARD_URL = `${BASE_URL}/board/starter-template`;

async function main() {
    console.log('1. Starting production server ...');
    const { kill: killServer } = await startProdServer(PORT);

    try {

        const browser = await chromium.launch();
        const page = await (await browser.newContext()).newPage();

        console.log('2. Loading the starter board ...');
        await page.goto(BOARD_URL, { waitUntil: 'load' });
        await page.waitForSelector('a[href="/my-boards"], a[href="/"]');
        const lockButton = page.locator('button[aria-label="Lock board for child use"]');
        await lockButton.waitFor({ state: 'visible', timeout: 10_000 });
        console.log('   OK — normal chrome and lock button visible');

        console.log('3. Clicking lock button ...');
        await lockButton.click();
        const unlockButton = page.locator('button[aria-label="Unlock board"]');
        await unlockButton.waitFor({ state: 'visible', timeout: 10_000 });
        const headerGone = await page.locator('a[href="/my-boards"]').count();
        if (headerGone !== 0) {
            throw new Error('GlobalHeader still present after locking');
        }
        console.log('   OK — chrome hidden, unlock button present');

        console.log('4. Quick-tapping unlock button (should NOT open quiz) ...');
        await unlockButton.click();
        await page.waitForTimeout(300);
        if ((await page.locator('[data-testid="quiz-question"]').count()) !== 0) {
            throw new Error('quiz opened on a quick tap — hold requirement not enforced');
        }
        await page.waitForSelector('[data-testid="lock-hint"]', { timeout: 2_000 });
        console.log('   OK — quick tap ignored, "hold to unlock" hint shown');

        console.log('5. Holding unlock button for 1s ...');
        await unlockButton.click({ delay: 1200 });
        await page.waitForSelector('[data-testid="quiz-question"]', { timeout: 5_000 });
        const readQuestion = async () => {
            const text = await page.textContent('[data-testid="quiz-question"]');
            const match = text?.match(/(\d+)\s*\+\s*(\d+)/);
            if (!match) throw new Error(`could not parse quiz question: "${text}"`);
            return { a: parseInt(match[1], 10), b: parseInt(match[2], 10) };
        };
        const clickOption = async (targetValue: number) => {
            const options = page.locator('[data-testid="quiz-option"]');
            const count = await options.count();
            for (let i = 0; i < count; i++) {
                const text = await options.nth(i).textContent();
                if (text && parseInt(text, 10) === targetValue) {
                    await options.nth(i).click();
                    return true;
                }
            }
            return false;
        };

        const { a, b } = await readQuestion();
        const correctAnswer = a + b;
        console.log(`   OK — quiz appeared (${a} + ${b} = ${correctAnswer})`);

        console.log('6. Clicking a wrong answer ...');
        const optionTexts = await page.locator('[data-testid="quiz-option"]').allTextContents();
        const wrongValue = optionTexts.map((t) => parseInt(t, 10)).find((v) => v !== correctAnswer);
        if (wrongValue === undefined) throw new Error('no wrong-answer option found');
        if (!(await clickOption(wrongValue))) throw new Error('failed to click wrong answer');
        await page.waitForTimeout(200);
        const stillLocked = await page.locator('button[aria-label="Unlock board"]').count();
        if (stillLocked === 0) {
            throw new Error('board unlocked after wrong answer');
        }
        console.log('   OK — still locked, question regenerated');

        console.log('7. Clicking the correct answer ...');
        const { a: a2, b: b2 } = await readQuestion();
        const correctAnswer2 = a2 + b2;
        if (!(await clickOption(correctAnswer2))) throw new Error('correct-answer option not found');

        await page.waitForSelector('a[href="/my-boards"], a[href="/"]', { timeout: 5_000 });
        console.log('   OK — chrome restored, board unlocked');

        console.log('8. Re-locking and testing back-button trap ...');
        await lockButton.click();
        await unlockButton.waitFor({ state: 'visible', timeout: 5_000 });
        // Let the quick-tap hint from earlier expire so the hint we assert on
        // below is definitely the blocked-navigation one.
        await page.waitForTimeout(2_500);
        await page.goBack();
        await page.waitForTimeout(500);
        if (!page.url().includes('/board/starter-template')) {
            throw new Error(`back navigation escaped the board: ${page.url()}`);
        }
        const stillLockedAfterBack = await page.locator('button[aria-label="Unlock board"]').count();
        if (stillLockedAfterBack === 0) {
            throw new Error('lock UI gone after back navigation');
        }
        const blockedHint = await page.locator('[data-testid="lock-hint"]').textContent();
        if (!blockedHint || !blockedHint.toLowerCase().includes('locked')) {
            throw new Error(`expected "board is locked" hint after trapped back navigation, got: "${blockedHint}"`);
        }
        console.log('   OK — back navigation trapped on board, still locked, hint shown');

        console.log('9. Reloading while locked ...');
        await page.reload({ waitUntil: 'load' });
        await page.locator('button[aria-label="Unlock board"]').waitFor({ state: 'visible', timeout: 10_000 });
        console.log('   OK — lock state restored after reload');

        // Regression check: a stale `mvb:locked-board` in sessionStorage (e.g. the
        // user ends up away from the board without going through unlock) must not
        // hide the GlobalHeader or strip its top padding on other pages — both are
        // scoped to the locked board's own route.
        console.log('10. Navigating to home while a stale lock is still set ...');
        await page.goto(BASE_URL, { waitUntil: 'load' });
        await page.waitForSelector('a[href="/my-boards"], a[href="/public-boards"]', { timeout: 10_000 });
        const headerVisible = await page.locator('header').first().isVisible();
        if (!headerVisible) throw new Error('header did not render on home page despite stale lock');
        const paddingTop = await page.evaluate(() => {
            const el = document.querySelector('body > header + div');
            return el ? parseFloat(getComputedStyle(el).paddingTop) : null;
        });
        if (!paddingTop || paddingTop < 20) {
            throw new Error(`expected top padding to clear the fixed header on home page, got ${paddingTop}px`);
        }
        console.log(`   OK — header visible and content padded correctly on home page (padding-top: ${paddingTop}px)`);

        await browser.close();
        console.log('\nAll lock-mode checks passed.');
    } finally {
        killServer();
    }
}

main().catch((err) => {
    console.error('\nLOCK MODE TEST FAILED:', err.message);
    process.exit(1);
});
