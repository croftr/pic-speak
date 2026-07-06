'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Lock } from 'lucide-react';
import UnlockQuizDialog from './UnlockQuizDialog';
import { useLockMode } from '@/contexts/LockModeContext';
import { LOCK_BLOCKED_EVENT } from '@/hooks/useLockEffects';

// How long the lock button must be held before the carer quiz opens. A quick
// tap (a child poking at it) does nothing except show a brief hint.
const HOLD_MS = 1000;
const HINT_MS = 2400;

export default function UnlockButton() {
    const { unlock } = useLockMode();
    const [isQuizOpen, setIsQuizOpen] = useState(false);
    const [quizKey, setQuizKey] = useState(0);
    const [isHolding, setIsHolding] = useState(false);
    const [hint, setHint] = useState<string | null>(null);
    // Remounting the button re-runs its attention pulse animation.
    const [pulseKey, setPulseKey] = useState(0);

    const holdTimer = useRef<number | null>(null);
    const hintTimer = useRef<number | null>(null);

    const showHint = useCallback((message: string) => {
        setHint(message);
        if (hintTimer.current !== null) clearTimeout(hintTimer.current);
        hintTimer.current = window.setTimeout(() => {
            setHint(null);
            hintTimer.current = null;
        }, HINT_MS);
    }, []);

    const startHold = () => {
        if (holdTimer.current !== null) return;
        setIsHolding(true);
        holdTimer.current = window.setTimeout(() => {
            holdTimer.current = null;
            setIsHolding(false);
            setQuizKey((k) => k + 1);
            setIsQuizOpen(true);
        }, HOLD_MS);
    };

    const cancelHold = (silent = false) => {
        // Timer already fired means the hold completed — nothing to cancel.
        if (holdTimer.current === null) return;
        clearTimeout(holdTimer.current);
        holdTimer.current = null;
        setIsHolding(false);
        if (!silent) showHint('Hold to unlock');
    };

    // The lock blocked something (e.g. back button) — nudge the carer.
    useEffect(() => {
        const handleBlocked = () => {
            setPulseKey((k) => k + 1);
            showHint('Board is locked — hold the lock to exit');
        };
        window.addEventListener(LOCK_BLOCKED_EVENT, handleBlocked);
        return () => window.removeEventListener(LOCK_BLOCKED_EVENT, handleBlocked);
    }, [showHint]);

    useEffect(() => {
        return () => {
            if (holdTimer.current !== null) clearTimeout(holdTimer.current);
            if (hintTimer.current !== null) clearTimeout(hintTimer.current);
        };
    }, []);

    return (
        <>
            <button
                key={pulseKey}
                onPointerDown={(e) => {
                    // Keep receiving pointer events even if the finger drifts
                    // slightly off the button mid-hold.
                    e.currentTarget.setPointerCapture?.(e.pointerId);
                    startHold();
                }}
                onPointerUp={() => cancelHold()}
                onPointerCancel={() => cancelHold(true)}
                onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
                        e.preventDefault();
                        startHold();
                    }
                }}
                onKeyUp={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') cancelHold();
                }}
                onContextMenu={(e) => e.preventDefault()}
                aria-label="Unlock board"
                title="Board locked — press and hold to unlock"
                className={`relative p-2 rounded-full bg-red-500 hover:bg-red-600 shadow-md shadow-red-500/30 transition-transform touch-manipulation select-none animate-lock-pulse ${isHolding ? 'scale-110' : ''}`}
            >
                <Lock className="w-5 h-5 text-white" />
                {/* Hold progress ring — fills clockwise over HOLD_MS */}
                <svg
                    className="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)] pointer-events-none -rotate-90"
                    viewBox="0 0 36 36"
                    aria-hidden="true"
                >
                    <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        pathLength={100}
                        strokeDasharray={100}
                        strokeDashoffset={isHolding ? 0 : 100}
                        style={{
                            transition: isHolding ? `stroke-dashoffset ${HOLD_MS}ms linear` : 'none',
                            opacity: isHolding ? 1 : 0,
                        }}
                    />
                </svg>
            </button>

            {/* Transient hint pill — portalled to <body> because LockedBar's
                backdrop-blur header traps fixed-position descendants */}
            {hint &&
                createPortal(
                    <div
                        data-testid="lock-hint"
                        role="status"
                        className="fixed top-20 left-1/2 -translate-x-1/2 z-[150] flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 text-white dark:bg-white/95 dark:text-slate-900 text-sm font-medium shadow-lg pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200"
                    >
                        <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                        {hint}
                    </div>,
                    document.body
                )}

            <UnlockQuizDialog
                key={quizKey}
                isOpen={isQuizOpen}
                onClose={() => setIsQuizOpen(false)}
                onUnlock={() => {
                    setIsQuizOpen(false);
                    unlock();
                }}
            />
        </>
    );
}
