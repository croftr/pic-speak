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
                className="p-2 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-colors touch-manipulation"
            >
                <Lock className="w-5 h-5 text-gray-600 dark:text-gray-300" />
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
