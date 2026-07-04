'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const STORAGE_KEY = 'mvb:locked-board';

interface LockModeContextValue {
    lockedBoardId: string | null;
    lock: (boardId: string) => void;
    unlock: () => void;
}

const LockModeContext = createContext<LockModeContextValue | undefined>(undefined);

export function LockModeProvider({ children }: { children: ReactNode }) {
    const [lockedBoardId, setLockedBoardId] = useState<string | null>(null);

    // Restore lock state after a reload (pull-to-refresh, accidental reload).
    useEffect(() => {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating lock state from sessionStorage after mount (SSR-safe pattern)
            setLockedBoardId(stored);
        }
    }, []);

    useEffect(() => {
        document.body.classList.toggle('lock-mode', !!lockedBoardId);
        return () => {
            document.body.classList.remove('lock-mode');
        };
    }, [lockedBoardId]);

    const lock = (boardId: string) => {
        sessionStorage.setItem(STORAGE_KEY, boardId);
        setLockedBoardId(boardId);
    };

    const unlock = () => {
        sessionStorage.removeItem(STORAGE_KEY);
        setLockedBoardId(null);
    };

    return (
        <LockModeContext.Provider value={{ lockedBoardId, lock, unlock }}>
            {children}
        </LockModeContext.Provider>
    );
}

export function useLockMode(): LockModeContextValue {
    const context = useContext(LockModeContext);
    if (!context) {
        throw new Error('useLockMode must be used within LockModeProvider');
    }
    return context;
}
