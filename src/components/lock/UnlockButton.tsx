'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';
import UnlockQuizDialog from './UnlockQuizDialog';
import { useLockMode } from '@/contexts/LockModeContext';

export default function UnlockButton() {
    const { unlock } = useLockMode();
    const [isQuizOpen, setIsQuizOpen] = useState(false);
    const [quizKey, setQuizKey] = useState(0);

    return (
        <>
            <button
                onClick={() => {
                    setQuizKey((k) => k + 1);
                    setIsQuizOpen(true);
                }}
                aria-label="Unlock board"
                title="Board locked — tap to unlock"
                className="p-2 rounded-full bg-red-500 hover:bg-red-600 shadow-md shadow-red-500/30 transition-colors touch-manipulation animate-lock-pulse"
            >
                <Lock className="w-5 h-5 text-white" />
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
