'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';
import UnlockQuizDialog from './UnlockQuizDialog';
import { useLockMode } from '@/contexts/LockModeContext';

const HOLD_DURATION_MS = 3000;
const RADIUS = 18;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function HoldToUnlockButton() {
    const { unlock } = useLockMode();
    const [progress, setProgress] = useState(0);
    const [isQuizOpen, setIsQuizOpen] = useState(false);
    const [quizKey, setQuizKey] = useState(0);
    const rafRef = useRef<number | null>(null);
    const pointerDownAtRef = useRef<number | null>(null);

    const stopHold = useCallback(() => {
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        setProgress(0);
    }, []);

    useEffect(() => stopHold, [stopHold]);

    const handlePointerDown = (e: React.PointerEvent) => {
        e.preventDefault();
        pointerDownAtRef.current = Date.now();
        let startTime: number | null = null;

        const step = (timestamp: number) => {
            if (startTime === null) {
                startTime = timestamp;
            }
            const elapsed = timestamp - startTime;
            const pct = Math.min(elapsed / HOLD_DURATION_MS, 1);
            setProgress(pct);

            if (pct >= 1) {
                stopHold();
                setQuizKey((k) => k + 1);
                setIsQuizOpen(true);
                return;
            }

            rafRef.current = requestAnimationFrame(step);
        };

        rafRef.current = requestAnimationFrame(step);
    };

    const handlePointerEnd = () => {
        const heldMs = pointerDownAtRef.current ? Date.now() - pointerDownAtRef.current : 0;
        const wasHolding = rafRef.current !== null;
        stopHold();
        pointerDownAtRef.current = null;

        if (wasHolding && heldMs < HOLD_DURATION_MS) {
            toast.info('Hold to unlock');
        }
    };

    return (
        <>
            <button
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerEnd}
                onPointerLeave={handlePointerEnd}
                onPointerCancel={handlePointerEnd}
                onContextMenu={(e) => e.preventDefault()}
                aria-label="Hold to unlock board"
                className="relative p-2 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-colors touch-manipulation"
                style={{ touchAction: 'none', userSelect: 'none', WebkitTouchCallout: 'none' }}
            >
                <svg width="44" height="44" viewBox="0 0 44 44" className="absolute inset-0 -rotate-90">
                    <circle
                        cx="22"
                        cy="22"
                        r={RADIUS}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeOpacity="0.6"
                        strokeDasharray={CIRCUMFERENCE}
                        strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
                        className="text-primary transition-none"
                    />
                </svg>
                <Lock className="w-5 h-5 text-gray-600 dark:text-gray-300 relative" />
            </button>

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
