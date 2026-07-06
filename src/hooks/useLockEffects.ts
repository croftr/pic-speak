'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Fired when the lock blocks something the user tried to do (e.g. back
// navigation). UnlockButton listens and shows a brief "board is locked" hint.
export const LOCK_BLOCKED_EVENT = 'mvb:lock-blocked';

// Side effects for locked "use mode": screen wake lock, best-effort fullscreen,
// and a history sentinel that snaps browser/hardware back to the board.
export function useLockEffects(isLocked: boolean, boardId: string) {
    const router = useRouter();

    useEffect(() => {
        if (!isLocked) return;

        let wakeLock: WakeLockSentinel | null = null;

        const requestWakeLock = async () => {
            try {
                if ('wakeLock' in navigator) {
                    wakeLock = await navigator.wakeLock.request('screen');
                }
            } catch {
                // ignore — not fatal, e.g. unsupported or backgrounded
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                requestWakeLock();
            }
        };

        requestWakeLock();
        document.addEventListener('visibilitychange', handleVisibilityChange);

        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen?.().catch(() => {
                // may be rejected without a user gesture — the entry points
                // that trigger lock() already request fullscreen in-gesture
            });
        }

        const boardPath = `/board/${boardId}`;
        const sentinel = { __lockSentinel: true };
        history.pushState(sentinel, '', location.href);
        const handlePopState = () => {
            history.pushState(sentinel, '', location.href);
            if (location.pathname !== boardPath) {
                router.replace(boardPath);
            }
            window.dispatchEvent(new CustomEvent(LOCK_BLOCKED_EVENT));
        };
        window.addEventListener('popstate', handlePopState);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('popstate', handlePopState);
            wakeLock?.release().catch(() => {});
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
            }
            // Clean up the sentinel history entry so back-navigation behaves
            // normally after unlock.
            if (history.state?.__lockSentinel) {
                history.back();
            }
        };
    }, [isLocked, boardId, router]);
}
