/**
 * Shared helper for the script-based e2e tests (offline, lock-mode,
 * sentence). Starts a production `next start` server (requires
 * `npm run build` first) and returns a kill function that reliably tears
 * down the whole process tree on both Windows and POSIX — the offline test
 * depends on the kill genuinely freeing the port.
 */
import { spawn, execSync } from 'child_process';

async function waitForServer(url: string, timeoutMs = 60_000) {
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

export async function startProdServer(port: number): Promise<{ kill: () => void }> {
    const isWindows = process.platform === 'win32';
    const server = spawn('npx', ['next', 'start', '-p', String(port)], {
        shell: isWindows, // npx is a .cmd on Windows
        stdio: 'ignore',
        // POSIX: own process group so we can kill npx + next + node together
        detached: !isWindows,
    });

    const kill = () => {
        if (server.pid === undefined) return;
        try {
            if (isWindows) {
                execSync(`taskkill /PID ${server.pid} /T /F`, { stdio: 'ignore' });
            } else {
                process.kill(-server.pid, 'SIGKILL');
            }
        } catch {
            // already dead
        }
    };

    try {
        await waitForServer(`http://localhost:${port}`);
    } catch (err) {
        kill();
        throw err;
    }

    return { kill };
}
