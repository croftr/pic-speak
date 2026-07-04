'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useLockMode } from '@/contexts/LockModeContext';

export default function MainFrame({ children }: { children: ReactNode }) {
    const { lockedBoardId } = useLockMode();
    const pathname = usePathname();

    // Scoped to the locked board's own route — a stale lockedBoardId (e.g. the
    // user navigated away without unlocking) must not strip the header's
    // padding on every other page.
    const isLockedHere = !!lockedBoardId && pathname === `/board/${lockedBoardId}`;

    return (
        <div className={isLockedHere ? '' : 'pt-14 pb-16 sm:pt-16 sm:pb-0'}>
            {children}
        </div>
    );
}
