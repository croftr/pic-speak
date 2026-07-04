/**
 * End-to-end check of the locked "use mode" (child/kiosk mode).
 *
 * Starts its own production server (requires `npm run build` first) and
 * exercises the public starter-template board, which needs no auth.
 *
 * Usage: npx tsx scripts/test-lock-mode.ts
 */
import { chromium } from '@playwright/test';
import { spawn, execSync } from 'child_process';

const PORT = 4598;
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

        console.log('4. Clicking unlock button ...');
        await unlockButton.click();
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
        await page.goBack();
        await page.waitForTimeout(500);
        if (!page.url().includes('/board/starter-template')) {
            throw new Error(`back navigation escaped the board: ${page.url()}`);
        }
        const stillLockedAfterBack = await page.locator('button[aria-label="Unlock board"]').count();
        if (stillLockedAfterBack === 0) {
            throw new Error('lock UI gone after back navigation');
        }
        console.log('   OK — back navigation trapped on board, still locked');

        console.log('9. Reloading while locked ...');
        await page.reload({ waitUntil: 'load' });
        await page.locator('button[aria-label="Unlock board"]').waitFor({ state: 'visible', timeout: 10_000 });
        console.log('   OK — lock state restored after reload');

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
