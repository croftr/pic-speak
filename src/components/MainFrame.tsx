'use client';

import { ReactNode } from 'react';
import { useLockMode } from '@/contexts/LockModeContext';

export default function MainFrame({ children }: { children: ReactNode }) {
    const { lockedBoardId } = useLockMode();

    return (
        <div className={lockedBoardId ? '' : 'pt-14 pb-16 sm:pt-16 sm:pb-0'}>
            {children}
        </div>
    );
}
